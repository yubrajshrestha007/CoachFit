import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const workoutDays = pgTable("workout_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayNumber: integer("day_number").notNull(), // 1-4
  name: text("name").notNull(), // "Upper Push", "Lower Squat", etc.
  description: text("description").notNull(),
  estimatedDuration: text("estimated_duration").notNull(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutDayId: varchar("workout_day_id").notNull().references(() => workoutDays.id),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(), // e.g., "6", "8-10", "12-15"
  notes: text("notes"), // guidance like "85% 1RM", "Control the negative"
  orderIndex: integer("order_index").notNull(),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  workoutDayId: varchar("workout_day_id").notNull().references(() => workoutDays.id),
  date: timestamp("date").notNull().defaultNow(),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
});

export const workoutSets = pgTable("workout_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => workoutSessions.id),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  completed: boolean("completed").notNull().default(false),
});

export const recoveryLogs = pgTable("recovery_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull().defaultNow(),
  sorenessLevel: integer("soreness_level").notNull(), // 1-10
  recommendation: text("recommendation").notNull(),
});

export const personalRecords = pgTable("personal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  exerciseName: text("exercise_name").notNull(),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  date: true,
});

export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({
  id: true,
});

export const insertRecoveryLogSchema = createInsertSchema(recoveryLogs).omit({
  id: true,
  date: true,
});

export const insertPersonalRecordSchema = createInsertSchema(personalRecords).omit({
  id: true,
  date: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type WorkoutDay = typeof workoutDays.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type RecoveryLog = typeof recoveryLogs.$inferSelect;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type InsertRecoveryLog = z.infer<typeof insertRecoveryLogSchema>;
export type InsertPersonalRecord = z.infer<typeof insertPersonalRecordSchema>;
