import { type User, type InsertUser, type Schedule, type InsertSchedule, type MonthlySettings, type InsertMonthlySettings } from "@shared/schema";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUserSchedules(userId: string): Promise<Schedule[]>;
  
  getSchedule(id: string): Promise<Schedule | undefined>;
  getSchedulesForMonth(month: number, year: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  deleteSchedule(id: string): Promise<boolean>;
  getMonthlyScheduleCount(userId: string, month: number, year: number, excludeScheduleIds?: string[]): Promise<number>;
  validateScheduleConstraints(schedule: InsertSchedule, excludeScheduleIds?: string[]): Promise<{ isValid: boolean; error?: string }>;
  
  updateSchedule(id: string, updates: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  getSchedulesForDay(month: number, year: number, day: number): Promise<Schedule[]>;
  
  // Monthly settings management
  getMonthlySettings(month: number, year: number): Promise<MonthlySettings | undefined>;
  updateMonthlySettings(month: number, year: number, updates: Partial<InsertMonthlySettings>): Promise<MonthlySettings>;
  getPublicScheduleByToken(token: string): Promise<{ schedules: Schedule[], users: User[], settings: MonthlySettings } | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private schedules: Map<string, Schedule>;

  constructor() {
    this.users = new Map();
    this.schedules = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.name === name,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      isActive: insertUser.isActive ?? true,
      role: insertUser.role ?? 'physician',
      monthlyShiftLimit: insertUser.monthlyShiftLimit ?? 8
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUserSchedules(userId: string): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.userId === userId
    );
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async getSchedulesForMonth(month: number, year: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.month === month && schedule.year === year
    );
  }

  async getMonthlyScheduleCount(userId: string, month: number, year: number, excludeScheduleIds?: string[]): Promise<number> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.userId === userId && 
                 schedule.month === month && 
                 schedule.year === year &&
                 (!excludeScheduleIds || !excludeScheduleIds.includes(schedule.id))
    ).length;
  }

  async validateScheduleConstraints(schedule: InsertSchedule, excludeScheduleIds?: string[]): Promise<{ isValid: boolean; error?: string }> {
    // Check if user exists
    const user = await this.getUser(schedule.userId);
    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    // Check for duplicate schedule on same day for same user
    const existingSchedule = Array.from(this.schedules.values()).find(
      s => s.userId === schedule.userId && 
           s.month === schedule.month && 
           s.year === schedule.year && 
           s.day === schedule.day &&
           (!excludeScheduleIds || !excludeScheduleIds.includes(s.id))
    );
    if (existingSchedule) {
      return { isValid: false, error: "User is already scheduled for this day" };
    }

    // Check monthly limit
    const currentCount = await this.getMonthlyScheduleCount(schedule.userId, schedule.month, schedule.year, excludeScheduleIds);
    if (currentCount >= user.monthlyShiftLimit) {
      return { isValid: false, error: `User has reached their monthly shift limit of ${user.monthlyShiftLimit}` };
    }

    // Get all schedules for this day to check role constraints (excluding specified schedules)
    const daySchedules = Array.from(this.schedules.values()).filter(
      s => s.month === schedule.month && 
           s.year === schedule.year && 
           s.day === schedule.day &&
           (!excludeScheduleIds || !excludeScheduleIds.includes(s.id))
    );

    // Get users for existing schedules
    const scheduledUsers = await Promise.all(
      daySchedules.map(s => this.getUser(s.userId))
    );
    const validScheduledUsers = scheduledUsers.filter(u => u !== undefined) as User[];

    // Check role-based constraints
    if (user.role === 'physician') {
      const existingPhysicians = validScheduledUsers.filter(u => u.role === 'physician');
      if (existingPhysicians.length > 0) {
        return { isValid: false, error: "Only one physician can be scheduled per day" };
      }
    } else if (user.role === 'learner') {
      const existingLearners = validScheduledUsers.filter(u => u.role === 'learner');
      if (existingLearners.length > 0) {
        return { isValid: false, error: "Only one learner can be scheduled per day" };
      }
    }

    return { isValid: true };
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = randomUUID();
    const schedule: Schedule = {
      ...insertSchedule,
      id,
      createdAt: new Date(),
      status: insertSchedule.status ?? 'scheduled'
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    return this.schedules.delete(id);
  }

  async updateSchedule(id: string, updates: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...updates };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async getSchedulesForDay(month: number, year: number, day: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.month === month && schedule.year === year && schedule.day === day
    );
  }

  // Monthly settings methods - placeholder for MemStorage
  async getMonthlySettings(month: number, year: number): Promise<MonthlySettings | undefined> {
    // MemStorage doesn't persist monthly settings
    return undefined;
  }

  async updateMonthlySettings(month: number, year: number, updates: Partial<InsertMonthlySettings>): Promise<MonthlySettings> {
    // For MemStorage, return a basic mock settings object
    const id = randomUUID();
    return {
      id,
      month,
      year,
      isPublished: updates.isPublished ?? false,
      publicShareToken: updates.publicShareToken ?? null,
      createdAt: new Date(),
    };
  }

  async getPublicScheduleByToken(token: string): Promise<{ schedules: Schedule[], users: User[], settings: MonthlySettings } | undefined> {
    // MemStorage doesn't support public sharing
    return undefined;
  }
}

import { db } from "./db";
import { eq, and, inArray, notInArray } from "drizzle-orm";
import { users, schedules, monthlySettings } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserSchedules(userId: string): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.userId, userId));
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async getSchedulesForMonth(month: number, year: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.month, month), eq(schedules.year, year)));
  }

  async getMonthlyScheduleCount(userId: string, month: number, year: number, excludeScheduleIds?: string[]): Promise<number> {
    const conditions = [
      eq(schedules.userId, userId),
      eq(schedules.month, month),
      eq(schedules.year, year)
    ];
    
    // Add exclusion condition if excludeScheduleIds is provided
    if (excludeScheduleIds && excludeScheduleIds.length > 0) {
      conditions.push(notInArray(schedules.id, excludeScheduleIds));
    }
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schedules)
      .where(and(...conditions));
    
    return Number(result[0]?.count) || 0;
  }

  async validateScheduleConstraints(schedule: InsertSchedule, excludeScheduleIds?: string[]): Promise<{ isValid: boolean; error?: string }> {
    // Check if user exists
    const user = await this.getUser(schedule.userId);
    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    // Check for duplicate schedule on same day for same user
    const duplicateConditions = [
      eq(schedules.userId, schedule.userId),
      eq(schedules.month, schedule.month),
      eq(schedules.year, schedule.year),
      eq(schedules.day, schedule.day)
    ];
    
    // Add exclusion condition if excludeScheduleIds is provided
    if (excludeScheduleIds && excludeScheduleIds.length > 0) {
      duplicateConditions.push(notInArray(schedules.id, excludeScheduleIds));
    }
    
    const existingSchedules = await db
      .select()
      .from(schedules)
      .where(and(...duplicateConditions));
    
    if (existingSchedules.length > 0) {
      return { isValid: false, error: "User is already scheduled for this day" };
    }

    // Check monthly limit
    const currentCount = await this.getMonthlyScheduleCount(schedule.userId, schedule.month, schedule.year, excludeScheduleIds);
    if (currentCount >= user.monthlyShiftLimit) {
      return { isValid: false, error: `User has reached their monthly shift limit of ${user.monthlyShiftLimit}` };
    }

    // Get all schedules for this day to check role constraints (excluding specified schedules)
    const dayConditions = [
      eq(schedules.month, schedule.month),
      eq(schedules.year, schedule.year),
      eq(schedules.day, schedule.day)
    ];
    
    // Add exclusion condition if excludeScheduleIds is provided
    if (excludeScheduleIds && excludeScheduleIds.length > 0) {
      dayConditions.push(notInArray(schedules.id, excludeScheduleIds));
    }
    
    const daySchedules = await db
      .select()
      .from(schedules)
      .where(and(...dayConditions));

    if (daySchedules.length > 0) {
      // Get users for existing schedules
      const scheduledUserIds = daySchedules.map(s => s.userId);
      const scheduledUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, scheduledUserIds));

      // Check role-based constraints
      if (user.role === 'physician') {
        const existingPhysicians = scheduledUsers.filter(u => u.role === 'physician');
        if (existingPhysicians.length > 0) {
          return { isValid: false, error: "Only one physician can be scheduled per day" };
        }
      } else if (user.role === 'learner') {
        const existingLearners = scheduledUsers.filter(u => u.role === 'learner');
        if (existingLearners.length > 0) {
          return { isValid: false, error: "Only one learner can be scheduled per day" };
        }
      }
    }

    return { isValid: true };
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const result = await db
      .delete(schedules)
      .where(eq(schedules.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateSchedule(id: string, updates: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [schedule] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.id, id))
      .returning();
    return schedule || undefined;
  }

  async getSchedulesForDay(month: number, year: number, day: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.month, month),
        eq(schedules.year, year),
        eq(schedules.day, day)
      ));
  }

  // Monthly settings management
  async getMonthlySettings(month: number, year: number): Promise<MonthlySettings | undefined> {
    const [settings] = await db
      .select()
      .from(monthlySettings)
      .where(and(eq(monthlySettings.month, month), eq(monthlySettings.year, year)));
    return settings || undefined;
  }

  async updateMonthlySettings(month: number, year: number, updates: Partial<InsertMonthlySettings>): Promise<MonthlySettings> {
    // First try to find existing settings
    const existing = await this.getMonthlySettings(month, year);
    
    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(monthlySettings)
        .set(updates)
        .where(and(eq(monthlySettings.month, month), eq(monthlySettings.year, year)))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(monthlySettings)
        .values({
          month,
          year,
          isPublished: updates.isPublished ?? false,
          publicShareToken: updates.publicShareToken ?? null,
        })
        .returning();
      return created;
    }
  }

  async getPublicScheduleByToken(token: string): Promise<{ schedules: Schedule[], users: User[], settings: MonthlySettings } | undefined> {
    // Find the monthly settings with this token
    const [settings] = await db
      .select()
      .from(monthlySettings)
      .where(eq(monthlySettings.publicShareToken, token));
      
    if (!settings || !settings.isPublished) {
      return undefined;
    }

    // Get schedules and users for this month/year
    const [schedules, allUsers] = await Promise.all([
      this.getSchedulesForMonth(settings.month, settings.year),
      this.getAllUsers()
    ]);

    return { schedules, users: allUsers, settings };
  }
}

export const storage = new MemStorage();
