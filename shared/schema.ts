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

// Insert schemas with validation rules
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)\.]{10,20}$/, "Phone number must be valid (10-20 digits)"),
  monthlyShiftLimit: z.number().int().min(1, "Monthly shift limit must be at least 1").max(31, "Monthly shift limit cannot exceed 31"),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
}).extend({
  month: z.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  year: z.number().int().min(2020, "Year must be 2020 or later").max(2100, "Year must be 2100 or earlier"),
  day: z.number().int().min(1, "Day must be between 1 and 31").max(31, "Day must be between 1 and 31"),
  userId: z.string().uuid("User ID must be a valid UUID"),
});

export const insertShiftTradeSchema = createInsertSchema(shiftTrades).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
}).extend({
  fromUserId: z.string().uuid("From User ID must be a valid UUID"),
  toUserId: z.string().uuid("To User ID must be a valid UUID"),
  scheduleId: z.string().uuid("Schedule ID must be a valid UUID"),
}).refine(data => data.fromUserId !== data.toUserId, {
  message: "Cannot trade shift with yourself",
  path: ["toUserId"],
});

export const insertMonthlySettingsSchema = createInsertSchema(monthlySettings).omit({
  id: true,
  createdAt: true,
}).extend({
  month: z.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  year: z.number().int().min(2020, "Year must be 2020 or later").max(2100, "Year must be 2100 or earlier"),
  isPublished: z.boolean().optional(),
  publicShareToken: z.string().optional(),
});

// API request validation schemas
export const monthYearQuerySchema = z.object({
  month: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Month must be a number");
    return num;
  }).pipe(z.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12")),
  year: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Year must be a number");
    return num;
  }).pipe(z.number().int().min(2020, "Year must be 2020 or later").max(2100, "Year must be 2100 or earlier")),
});

export const tradeStatusUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled'], {
    errorMap: () => ({ message: "Status must be 'approved', 'rejected', or 'cancelled'" })
  }),
});

export const uuidParamSchema = z.string().uuid("ID must be a valid UUID");

// Immediate trade operation schemas
export const reassignScheduleSchema = z.object({
  scheduleId: z.string().uuid(),
  toUserId: z.string().uuid()
});

export const swapSchedulesSchema = z.object({
  scheduleIdA: z.string().uuid(),
  scheduleIdB: z.string().uuid()
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

// Relations
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  schedules: many(schedules),
  fromTrades: many(shiftTrades, { relationName: "fromUser" }),
  toTrades: many(shiftTrades, { relationName: "toUser" }),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  user: one(users, {
    fields: [schedules.userId],
    references: [users.id],
  }),
  trades: many(shiftTrades),
}));

export const shiftTradesRelations = relations(shiftTrades, ({ one }) => ({
  fromUser: one(users, {
    fields: [shiftTrades.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [shiftTrades.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
  schedule: one(schedules, {
    fields: [shiftTrades.scheduleId],
    references: [schedules.id],
  }),
}));

// Extended types for API responses
export type ScheduleWithUser = Schedule & {
  user: User;
};

export type ShiftTradeWithUsers = ShiftTrade & {
  fromUser: User;
  toUser: User;
  schedule: ScheduleWithUser;
};