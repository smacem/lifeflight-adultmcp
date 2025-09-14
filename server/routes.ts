import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertScheduleSchema, 
  insertMonthlySettingsSchema,
  monthYearQuerySchema,
  uuidParamSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check for duplicate name
      const existingUser = await storage.getUserByName(validatedData.name);
      if (existingUser) {
        return res.status(409).json({ error: "A user with this name already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = uuidParamSchema.parse(req.params.id);
      const validatedData = insertUserSchema.partial().parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check for name conflicts if name is being updated
      if (validatedData.name && validatedData.name !== existingUser.name) {
        const duplicateUser = await storage.getUserByName(validatedData.name);
        if (duplicateUser) {
          return res.status(409).json({ error: "A user with this name already exists" });
        }
      }
      
      const user = await storage.updateUser(userId, validatedData);
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = uuidParamSchema.parse(req.params.id);
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has any scheduled shifts
      const userSchedules = await storage.getUserSchedules(userId);
      if (userSchedules.length > 0) {
        return res.status(409).json({ 
          error: "Cannot delete user with existing scheduled shifts. Please remove all shifts first." 
        });
      }
      
      await storage.deleteUser(userId);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid user ID", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Schedules endpoints
  app.get("/api/schedules", async (req, res) => {
    try {
      const { month, year } = monthYearQuerySchema.parse(req.query);
      
      const schedules = await storage.getSchedulesForMonth(month, year);
      res.json(schedules);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid query parameters", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error getting schedules:", error);
      res.status(500).json({ error: "Failed to get schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      
      // Validate date is real (e.g., not Feb 30)
      const date = new Date(validatedData.year, validatedData.month - 1, validatedData.day);
      if (date.getMonth() !== validatedData.month - 1 || date.getDate() !== validatedData.day) {
        return res.status(400).json({ error: "Invalid date: this day does not exist in the specified month" });
      }
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      
      // Check for scheduling conflicts and business rules
      const validationResult = await storage.validateScheduleConstraints(validatedData);
      if (!validationResult.isValid) {
        return res.status(409).json({ error: validationResult.error });
      }
      
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error creating schedule:", error);
      res.status(500).json({ error: "Failed to create schedule" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const scheduleId = uuidParamSchema.parse(req.params.id);
      
      // Check if schedule exists
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      
      const success = await storage.deleteSchedule(scheduleId);
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid schedule ID", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error deleting schedule:", error);
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });





  // Monthly settings endpoints
  app.get("/api/monthly-settings", async (req, res) => {
    try {
      const { month, year } = monthYearQuerySchema.parse(req.query);
      const settings = await storage.getMonthlySettings(month, year);
      res.json(settings);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid query parameters", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error getting monthly settings:", error);
      res.status(500).json({ error: "Failed to get monthly settings" });
    }
  });

  app.put("/api/monthly-settings", async (req, res) => {
    try {
      const validatedData = insertMonthlySettingsSchema.parse(req.body);
      const settings = await storage.updateMonthlySettings(validatedData.month, validatedData.year, validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error updating monthly settings:", error);
      res.status(500).json({ error: "Failed to update monthly settings" });
    }
  });

  // Public schedule endpoint
  app.get("/api/public/:token", async (req, res) => {
    try {
      const token = req.params.token;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      const publicData = await storage.getPublicScheduleByToken(token);
      if (!publicData) {
        return res.status(404).json({ error: "Schedule not found or not published" });
      }

      res.json(publicData);
    } catch (error) {
      console.error("Error getting public schedule:", error);
      res.status(500).json({ error: "Failed to get public schedule" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
