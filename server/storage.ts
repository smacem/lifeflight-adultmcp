import { type User, type InsertUser, type Schedule, type InsertSchedule, type ShiftTrade, type InsertShiftTrade } from "@shared/schema";
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
  getMonthlyScheduleCount(userId: string, month: number, year: number): Promise<number>;
  validateScheduleConstraints(schedule: InsertSchedule): Promise<{ isValid: boolean; error?: string }>;
  
  getShiftTrade(id: string): Promise<ShiftTrade | undefined>;
  createShiftTrade(trade: InsertShiftTrade): Promise<ShiftTrade>;
  getShiftTrades(): Promise<ShiftTrade[]>;
  getPendingTradesForSchedule(scheduleId: string): Promise<ShiftTrade[]>;
  updateShiftTrade(id: string, status: 'approved' | 'rejected' | 'cancelled'): Promise<ShiftTrade | undefined>;
  executeShiftTrade(tradeId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private schedules: Map<string, Schedule>;
  private shiftTrades: Map<string, ShiftTrade>;

  constructor() {
    this.users = new Map();
    this.schedules = new Map();
    this.shiftTrades = new Map();
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

  async getMonthlyScheduleCount(userId: string, month: number, year: number): Promise<number> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.userId === userId && schedule.month === month && schedule.year === year
    ).length;
  }

  async validateScheduleConstraints(schedule: InsertSchedule): Promise<{ isValid: boolean; error?: string }> {
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
           s.day === schedule.day
    );
    if (existingSchedule) {
      return { isValid: false, error: "User is already scheduled for this day" };
    }

    // Check monthly limit
    const currentCount = await this.getMonthlyScheduleCount(schedule.userId, schedule.month, schedule.year);
    if (currentCount >= user.monthlyShiftLimit) {
      return { isValid: false, error: `User has reached their monthly shift limit of ${user.monthlyShiftLimit}` };
    }

    // Get all schedules for this day to check role constraints
    const daySchedules = Array.from(this.schedules.values()).filter(
      s => s.month === schedule.month && s.year === schedule.year && s.day === schedule.day
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

  async createShiftTrade(insertTrade: InsertShiftTrade): Promise<ShiftTrade> {
    const id = randomUUID();
    const trade: ShiftTrade = {
      ...insertTrade,
      id,
      status: insertTrade.status ?? 'pending',
      requestedAt: new Date(),
      respondedAt: null
    };
    this.shiftTrades.set(id, trade);
    return trade;
  }

  async getShiftTrade(id: string): Promise<ShiftTrade | undefined> {
    return this.shiftTrades.get(id);
  }

  async getShiftTrades(): Promise<ShiftTrade[]> {
    return Array.from(this.shiftTrades.values());
  }

  async getPendingTradesForSchedule(scheduleId: string): Promise<ShiftTrade[]> {
    return Array.from(this.shiftTrades.values()).filter(
      trade => trade.scheduleId === scheduleId && trade.status === 'pending'
    );
  }

  async executeShiftTrade(tradeId: string): Promise<void> {
    const trade = this.shiftTrades.get(tradeId);
    if (!trade) {
      throw new Error("Trade not found");
    }

    const schedule = this.schedules.get(trade.scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Transfer the schedule to the new user
    const updatedSchedule = { ...schedule, userId: trade.toUserId };
    this.schedules.set(trade.scheduleId, updatedSchedule);
  }

  async updateShiftTrade(id: string, status: 'approved' | 'rejected' | 'cancelled'): Promise<ShiftTrade | undefined> {
    const trade = this.shiftTrades.get(id);
    if (!trade) return undefined;
    
    const updatedTrade = { 
      ...trade, 
      status, 
      respondedAt: new Date() 
    };
    this.shiftTrades.set(id, updatedTrade);
    return updatedTrade;
  }
}

import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users, schedules, shiftTrades } from "@shared/schema";

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
    return result.rowCount > 0;
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

  async getMonthlyScheduleCount(userId: string, month: number, year: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schedules)
      .where(and(
        eq(schedules.userId, userId),
        eq(schedules.month, month),
        eq(schedules.year, year)
      ));
    return Number(result[0]?.count) || 0;
  }

  async validateScheduleConstraints(schedule: InsertSchedule): Promise<{ isValid: boolean; error?: string }> {
    // Check if user exists
    const user = await this.getUser(schedule.userId);
    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    // Check for duplicate schedule on same day for same user
    const existingSchedules = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.userId, schedule.userId),
        eq(schedules.month, schedule.month),
        eq(schedules.year, schedule.year),
        eq(schedules.day, schedule.day)
      ));
    
    if (existingSchedules.length > 0) {
      return { isValid: false, error: "User is already scheduled for this day" };
    }

    // Check monthly limit
    const currentCount = await this.getMonthlyScheduleCount(schedule.userId, schedule.month, schedule.year);
    if (currentCount >= user.monthlyShiftLimit) {
      return { isValid: false, error: `User has reached their monthly shift limit of ${user.monthlyShiftLimit}` };
    }

    // Get all schedules for this day to check role constraints
    const daySchedules = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.month, schedule.month),
        eq(schedules.year, schedule.year),
        eq(schedules.day, schedule.day)
      ));

    if (daySchedules.length > 0) {
      // Get users for existing schedules
      const scheduledUserIds = daySchedules.map(s => s.userId);
      const scheduledUsers = await db
        .select()
        .from(users)
        .where(sql`${users.id} = ANY(${scheduledUserIds})`);

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

  async createShiftTrade(insertTrade: InsertShiftTrade): Promise<ShiftTrade> {
    const [trade] = await db
      .insert(shiftTrades)
      .values(insertTrade)
      .returning();
    return trade;
  }

  async getShiftTrade(id: string): Promise<ShiftTrade | undefined> {
    const [trade] = await db.select().from(shiftTrades).where(eq(shiftTrades.id, id));
    return trade || undefined;
  }

  async getShiftTrades(): Promise<ShiftTrade[]> {
    return await db.select().from(shiftTrades);
  }

  async getPendingTradesForSchedule(scheduleId: string): Promise<ShiftTrade[]> {
    return await db
      .select()
      .from(shiftTrades)
      .where(and(
        eq(shiftTrades.scheduleId, scheduleId),
        eq(shiftTrades.status, 'pending')
      ));
  }

  async executeShiftTrade(tradeId: string): Promise<void> {
    const trade = await this.getShiftTrade(tradeId);
    if (!trade) {
      throw new Error("Trade not found");
    }

    // Transfer the schedule to the new user
    await db
      .update(schedules)
      .set({ userId: trade.toUserId })
      .where(eq(schedules.id, trade.scheduleId));
  }

  async updateShiftTrade(id: string, status: 'approved' | 'rejected' | 'cancelled'): Promise<ShiftTrade | undefined> {
    const [trade] = await db
      .update(shiftTrades)
      .set({ 
        status, 
        respondedAt: new Date() 
      })
      .where(eq(shiftTrades.id, id))
      .returning();
    return trade || undefined;
  }
}

export const storage = new DatabaseStorage();
