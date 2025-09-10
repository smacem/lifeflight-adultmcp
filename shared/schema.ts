import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['physician', 'learner', 'admin']);
export const shiftStatusEnum = pgEnum('shift_status', ['available', 'scheduled', 'unavailable']);
export const tradeStatusEnum = pgEnum('trade_status', ['pending', 'approved', 'rejected', 'cancelled']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: userRoleEnum("role").notNull().default('physician'),
  isActive: boolean("is_active").notNull().default(true),
  monthlyShiftLimit: integer("monthly_shift_limit").notNull().default(8),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  day: integer("day").notNull(), // 1-31
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: shiftStatusEnum("status").notNull().default('scheduled'),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const shiftTrades = pgTable("shift_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  scheduleId: varchar("schedule_id").references(() => schedules.id).notNull(),
  status: tradeStatusEnum("status").notNull().default('pending'),
  requestedAt: timestamp("requested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  respondedAt: timestamp("responded_at"),
});

export const monthlySettings = pgTable("monthly_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  publicShareToken: varchar("public_share_token").unique(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export const insertShiftTradeSchema = createInsertSchema(shiftTrades).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
});

export const insertMonthlySettingsSchema = createInsertSchema(monthlySettings).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

export type InsertShiftTrade = z.infer<typeof insertShiftTradeSchema>;
export type ShiftTrade = typeof shiftTrades.$inferSelect;

export type InsertMonthlySettings = z.infer<typeof insertMonthlySettingsSchema>;
export type MonthlySettings = typeof monthlySettings.$inferSelect;

// Extended types for API responses
export type ScheduleWithUser = Schedule & {
  user: User;
};

export type ShiftTradeWithUsers = ShiftTrade & {
  fromUser: User;
  toUser: User;
  schedule: ScheduleWithUser;
};