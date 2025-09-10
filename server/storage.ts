import { type User, type InsertUser, type Schedule, type InsertSchedule, type ShiftTrade, type InsertShiftTrade } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  getSchedulesForMonth(month: number, year: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  deleteSchedule(id: string): Promise<boolean>;
  
  createShiftTrade(trade: InsertShiftTrade): Promise<ShiftTrade>;
  getShiftTrades(): Promise<ShiftTrade[]>;
  updateShiftTrade(id: string, status: 'approved' | 'rejected' | 'cancelled'): Promise<ShiftTrade | undefined>;
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

  async getSchedulesForMonth(month: number, year: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.month === month && schedule.year === year
    );
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

  async getShiftTrades(): Promise<ShiftTrade[]> {
    return Array.from(this.shiftTrades.values());
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

export const storage = new MemStorage();
