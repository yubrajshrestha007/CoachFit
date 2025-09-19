import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutDaySchema, insertWorkoutSessionSchema, insertWorkoutSetSchema, insertRecoveryLogSchema, insertPersonalRecordSchema, insertUserSchema, insertRoutineSchema, insertExerciseSchema } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = newUser.id;
      req.session.username = newUser.username;

      res.status(201).json({
        id: newUser.id,
        username: newUser.username
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({
        id: user.id,
        username: user.username
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err: Error | null) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { username } = req.body;
      if (!username || username.trim().length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }

      // Check if username is already taken by another user
      const existingUser = await storage.getUserByUsername(username.trim());
      if (existingUser && existingUser.id !== req.session.userId) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Update user
      const updatedUser = await storage.updateUser(req.session.userId, { username: username.trim() });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Routine Management Routes
  app.get("/api/routines", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const routines = await storage.getRoutines(req.session.userId);
      res.json(routines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch routines" });
    }
  });

  app.get("/api/routines/:id", async (req, res) => {
    try {
      const routine = await storage.getRoutine(req.params.id);
      if (!routine) {
        return res.status(404).json({ message: "Routine not found" });
      }
      res.json(routine);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch routine" });
    }
  });

  app.post("/api/routines", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const routineData = insertRoutineSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const newRoutine = await storage.createRoutine(routineData);
      res.status(201).json(newRoutine);
    } catch (error) {
      res.status(400).json({ message: "Invalid routine data" });
    }
  });

  app.patch("/api/routines/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const updated = await storage.updateRoutine(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Routine not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update routine" });
    }
  });

  app.delete("/api/routines/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const wasDeleted = await storage.deleteRoutine(req.params.id);
      if (!wasDeleted) {
        return res.status(404).json({ message: "Routine not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete routine" });
    }
  });

  app.post("/api/routines/:id/activate", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      console.log("Activating routine:", req.params.id, "for user:", req.session.userId);
      await storage.setActiveRoutine(req.session.userId, req.params.id);
      console.log("Routine activated successfully");
      res.json({ message: "Routine activated successfully" });
    } catch (error) {
      console.error("Failed to activate routine:", error);
      res.status(500).json({ message: "Failed to activate routine" });
    }
  });

  app.get("/api/routines/active", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      console.log("Getting active routine for user:", req.session.userId);
      const activeRoutine = await storage.getActiveRoutine(req.session.userId);
      console.log("Active routine found:", activeRoutine);
      res.json(activeRoutine || null);
    } catch (error) {
      console.error("Failed to fetch active routine:", error);
      res.status(500).json({ message: "Failed to fetch active routine" });
    }
  });

  app.post("/api/routines/:id/copy", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { targetRoutineId } = req.body;
      const templateId = req.params.id;

      console.log("Copying template:", templateId, "to routine:", targetRoutineId);
      await storage.copyTemplateRoutine(templateId, targetRoutineId);
      res.json({ message: "Template copied successfully" });
    } catch (error) {
      console.error("Failed to copy template:", error);
      res.status(500).json({ message: "Failed to copy template" });
    }
  });

  // Workout Days
  app.get("/api/routines/:routineId/workout-days", async (req, res) => {
    try {
      const workoutDays = await storage.getWorkoutDays(req.params.routineId);
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

  app.post("/api/routines/:routineId/workout-days", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const workoutDayData = insertWorkoutDaySchema.parse({
        ...req.body,
        routineId: req.params.routineId,
      });
      const newWorkoutDay = await storage.createWorkoutDay(workoutDayData);
      res.status(201).json(newWorkoutDay);
    } catch (error) {
      res.status(400).json({ message: "Invalid workout day data" });
    }
  });

  app.patch("/api/workout-days/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const updated = await storage.updateWorkoutDay(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Workout day not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workout day" });
    }
  });

  app.delete("/api/workout-days/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const wasDeleted = await storage.deleteWorkoutDay(req.params.id);
      if (!wasDeleted) {
        return res.status(404).json({ message: "Workout day not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workout day" });
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

  app.get("/api/exercises/:id", async (req, res) => {
    try {
      const exercise = await storage.getExercise(req.params.id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise" });
    }
  });

  app.post("/api/workout-days/:workoutDayId/exercises", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const exerciseData = insertExerciseSchema.parse({
        ...req.body,
        workoutDayId: req.params.workoutDayId,
      });
      const newExercise = await storage.createExercise(exerciseData);
      res.status(201).json(newExercise);
    } catch (error) {
      res.status(400).json({ message: "Invalid exercise data" });
    }
  });

  app.patch("/api/exercises/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const updated = await storage.updateExercise(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update exercise" });
    }
  });

  app.delete("/api/exercises/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const wasDeleted = await storage.deleteExercise(req.params.id);
      if (!wasDeleted) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exercise" });
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

  app.get("/api/workout-sets/:id", async (req, res) => {
    try {
      const set = await storage.getWorkoutSet(req.params.id);
      if (!set) {
        return res.status(404).json({ message: "Set not found" });
      }
      res.json(set);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch set" });
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
