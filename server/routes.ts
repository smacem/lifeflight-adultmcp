import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertScheduleSchema, 
  insertShiftTradeSchema,
  monthYearQuerySchema,
  tradeStatusUpdateSchema,
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
      
      // Check for pending trades
      const pendingTrades = await storage.getPendingTradesForSchedule(scheduleId);
      if (pendingTrades.length > 0) {
        return res.status(409).json({ 
          error: "Cannot delete schedule with pending shift trades. Please resolve or cancel trades first." 
        });
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

  // Shift trades endpoints
  app.get("/api/shift-trades", async (req, res) => {
    try {
      const trades = await storage.getShiftTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error getting shift trades:", error);
      res.status(500).json({ error: "Failed to get shift trades" });
    }
  });

  app.post("/api/shift-trades", async (req, res) => {
    try {
      const validatedData = insertShiftTradeSchema.parse(req.body);
      
      // Validate users exist
      const [fromUser, toUser] = await Promise.all([
        storage.getUser(validatedData.fromUserId),
        storage.getUser(validatedData.toUserId)
      ]);
      
      if (!fromUser) {
        return res.status(400).json({ error: "Source user not found" });
      }
      
      if (!toUser) {
        return res.status(400).json({ error: "Target user not found" });
      }
      
      // Validate schedule exists and belongs to fromUser
      const schedule = await storage.getSchedule(validatedData.scheduleId);
      if (!schedule) {
        return res.status(400).json({ error: "Schedule not found" });
      }
      
      if (schedule.userId !== validatedData.fromUserId) {
        return res.status(403).json({ error: "You can only trade your own shifts" });
      }
      
      // Check for existing pending trades for this schedule
      const existingTrades = await storage.getPendingTradesForSchedule(validatedData.scheduleId);
      if (existingTrades.length > 0) {
        return res.status(409).json({ error: "There is already a pending trade request for this shift" });
      }
      
      // Check if target user would exceed monthly limit
      const monthlyCount = await storage.getMonthlyScheduleCount(validatedData.toUserId, schedule.month, schedule.year);
      if (monthlyCount >= toUser.monthlyShiftLimit) {
        return res.status(409).json({ 
          error: `Target user has reached their monthly shift limit of ${toUser.monthlyShiftLimit}` 
        });
      }
      
      const trade = await storage.createShiftTrade(validatedData);
      res.status(201).json(trade);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error creating shift trade:", error);
      res.status(500).json({ error: "Failed to create shift trade" });
    }
  });

  app.put("/api/shift-trades/:id", async (req, res) => {
    try {
      const tradeId = uuidParamSchema.parse(req.params.id);
      const { status } = tradeStatusUpdateSchema.parse(req.body);
      
      // Get the trade to validate it exists and get context
      const existingTrade = await storage.getShiftTrade(tradeId);
      if (!existingTrade) {
        return res.status(404).json({ error: "Shift trade not found" });
      }
      
      if (existingTrade.status !== 'pending') {
        return res.status(409).json({ error: "Can only update pending trade requests" });
      }
      
      // If approving, perform final validation
      if (status === 'approved') {
        const [schedule, toUser] = await Promise.all([
          storage.getSchedule(existingTrade.scheduleId),
          storage.getUser(existingTrade.toUserId)
        ]);
        
        if (!schedule || !toUser) {
          return res.status(400).json({ error: "Referenced schedule or user no longer exists" });
        }
        
        // Re-check monthly limit in case other trades were approved
        const monthlyCount = await storage.getMonthlyScheduleCount(existingTrade.toUserId, schedule.month, schedule.year);
        if (monthlyCount >= toUser.monthlyShiftLimit) {
          return res.status(409).json({ 
            error: `Target user has reached their monthly shift limit of ${toUser.monthlyShiftLimit}` 
          });
        }
        
        // Execute the trade (update schedule ownership)
        await storage.executeShiftTrade(tradeId);
      }
      
      const trade = await storage.updateShiftTrade(tradeId, status);
      res.json(trade);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error("Error updating shift trade:", error);
      res.status(500).json({ error: "Failed to update shift trade" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
