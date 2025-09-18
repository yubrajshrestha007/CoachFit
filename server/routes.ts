import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSessionSchema, insertWorkoutSetSchema, insertRecoveryLogSchema, insertPersonalRecordSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workout Days
  app.get("/api/workout-days", async (req, res) => {
    try {
      const workoutDays = await storage.getWorkoutDays();
      res.json(workoutDays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout days" });
    }
  });

  app.get("/api/workout-days/:id", async (req, res) => {
    try {
      const workoutDay = await storage.getWorkoutDay(req.params.id);
      if (!workoutDay) {
        return res.status(404).json({ message: "Workout day not found" });
      }
      res.json(workoutDay);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout day" });
    }
  });

  // Exercises
  app.get("/api/workout-days/:id/exercises", async (req, res) => {
    try {
      const exercises = await storage.getExercisesByWorkoutDay(req.params.id);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  // Workout Sessions
  app.post("/api/workout-sessions", async (req, res) => {
    try {
      const session = insertWorkoutSessionSchema.parse(req.body);
      const newSession = await storage.createWorkoutSession(session);
      res.status(201).json(newSession);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.get("/api/workout-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getWorkoutSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.get("/api/users/:userId/workout-sessions", async (req, res) => {
    try {
      const sessions = await storage.getUserWorkoutSessions(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user sessions" });
    }
  });

  app.patch("/api/workout-sessions/:id", async (req, res) => {
    try {
      const updated = await storage.updateWorkoutSession(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Workout Sets
  app.post("/api/workout-sets", async (req, res) => {
    try {
      const set = insertWorkoutSetSchema.parse(req.body);
      const newSet = await storage.createWorkoutSet(set);
      res.status(201).json(newSet);
    } catch (error) {
      res.status(400).json({ message: "Invalid set data" });
    }
  });

  app.get("/api/workout-sessions/:sessionId/sets", async (req, res) => {
    try {
      const sets = await storage.getWorkoutSetsBySession(req.params.sessionId);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sets" });
    }
  });

  app.patch("/api/workout-sets/:id", async (req, res) => {
    try {
      const updated = await storage.updateWorkoutSet(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Set not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update set" });
    }
  });

  // Recovery Logs
  app.post("/api/recovery-logs", async (req, res) => {
    try {
      const log = insertRecoveryLogSchema.parse(req.body);
      const newLog = await storage.createRecoveryLog(log);
      res.status(201).json(newLog);
    } catch (error) {
      res.status(400).json({ message: "Invalid recovery log data" });
    }
  });

  app.get("/api/users/:userId/recovery-logs", async (req, res) => {
    try {
      const logs = await storage.getUserRecoveryLogs(req.params.userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recovery logs" });
    }
  });

  app.get("/api/users/:userId/recovery-logs/latest", async (req, res) => {
    try {
      const log = await storage.getLatestRecoveryLog(req.params.userId);
      res.json(log || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest recovery log" });
    }
  });

  // Personal Records
  app.post("/api/personal-records", async (req, res) => {
    try {
      const pr = insertPersonalRecordSchema.parse(req.body);
      const newPR = await storage.createPersonalRecord(pr);
      res.status(201).json(newPR);
    } catch (error) {
      res.status(400).json({ message: "Invalid personal record data" });
    }
  });

  app.get("/api/users/:userId/personal-records", async (req, res) => {
    try {
      const records = await storage.getUserPersonalRecords(req.params.userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personal records" });
    }
  });

  app.get("/api/users/:userId/personal-records/:exerciseName", async (req, res) => {
    try {
      const record = await storage.getLatestPersonalRecord(req.params.userId, req.params.exerciseName);
      res.json(record || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personal record" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
