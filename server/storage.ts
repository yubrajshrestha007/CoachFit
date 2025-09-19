import {
  type User,
  type InsertUser,
  type Routine,
  type InsertRoutine,
  type WorkoutDay,
  type Exercise,
  type WorkoutSession,
  type WorkoutSet,
  type RecoveryLog,
  type PersonalRecord,
  type InsertWorkoutDay,
  type InsertExercise,
  type InsertWorkoutSession,
  type InsertWorkoutSet,
  type InsertRecoveryLog,
  type InsertPersonalRecord
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Routines
  getRoutines(userId: string): Promise<Routine[]>;
  getRoutine(id: string): Promise<Routine | undefined>;
  createRoutine(routine: InsertRoutine): Promise<Routine>;
  updateRoutine(id: string, updates: Partial<Routine>): Promise<Routine | undefined>;
  deleteRoutine(id: string): Promise<boolean>;
  setActiveRoutine(userId: string, routineId: string): Promise<void>;
  getActiveRoutine(userId: string): Promise<Routine | undefined>;
  copyTemplateRoutine(templateId: string, targetRoutineId: string): Promise<void>;

  // Workout Days
  getWorkoutDays(routineId: string): Promise<WorkoutDay[]>;
  getWorkoutDay(id: string): Promise<WorkoutDay | undefined>;
  createWorkoutDay(workoutDay: InsertWorkoutDay): Promise<WorkoutDay>;
  updateWorkoutDay(id: string, updates: Partial<WorkoutDay>): Promise<WorkoutDay | undefined>;
  deleteWorkoutDay(id: string): Promise<boolean>;

  // Exercises
  getExercisesByWorkoutDay(workoutDayId: string): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;

  // Workout Sessions
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  getWorkoutSession(id: string): Promise<WorkoutSession | undefined>;
  getUserWorkoutSessions(userId: string): Promise<WorkoutSession[]>;
  updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession | undefined>;

  // Workout Sets
  createWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet>;
  getWorkoutSet(id: string): Promise<WorkoutSet | undefined>;
  getWorkoutSetsBySession(sessionId: string): Promise<WorkoutSet[]>;
  updateWorkoutSet(id: string, updates: Partial<WorkoutSet>): Promise<WorkoutSet | undefined>;

  // Recovery Logs
  createRecoveryLog(log: InsertRecoveryLog): Promise<RecoveryLog>;
  getUserRecoveryLogs(userId: string): Promise<RecoveryLog[]>;
  getLatestRecoveryLog(userId: string): Promise<RecoveryLog | undefined>;

  // Personal Records
  createPersonalRecord(pr: InsertPersonalRecord): Promise<PersonalRecord>;
  getUserPersonalRecords(userId: string): Promise<PersonalRecord[]>;
  getLatestPersonalRecord(userId: string, exerciseName: string): Promise<PersonalRecord | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private routines: Map<string, Routine>;
  private workoutDays: Map<string, WorkoutDay>;
  private exercises: Map<string, Exercise>;
  private workoutSessions: Map<string, WorkoutSession>;
  private workoutSets: Map<string, WorkoutSet>;
  private recoveryLogs: Map<string, RecoveryLog>;
  private personalRecords: Map<string, PersonalRecord>;

  constructor() {
    this.users = new Map();
    this.routines = new Map();
    this.workoutDays = new Map();
    this.exercises = new Map();
    this.workoutSessions = new Map();
    this.workoutSets = new Map();
    this.recoveryLogs = new Map();
    this.personalRecords = new Map();

    this.initializeWorkoutData();
  }

  private initializeWorkoutData() {
    // Create demo user
    this.createDemoUser();
    // Create template routines
    this.createTemplateRoutines();
  }

  private createDemoUser() {
    const demoUser: User = {
      id: "demo-user",
      username: "demo",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    };
    this.users.set(demoUser.id, demoUser);
  }

  private createTemplateRoutines() {
    // Upper/Lower Split Template
    const upperLowerRoutine: Routine = {
      id: "template-upper-lower",
      userId: "system",
      name: "Upper/Lower Split",
      description: "4-day upper/lower body split routine",
      isTemplate: true,
      isActive: false,
      createdAt: new Date(),
    };
    this.routines.set(upperLowerRoutine.id, upperLowerRoutine);

    // Create workout days for Upper/Lower
    const upperLowerDays = [
      { id: "ul-upper-1", routineId: upperLowerRoutine.id, dayNumber: 1, name: "Upper Push", description: "Chest, Shoulders, Triceps", estimatedDuration: "45-60 min" },
      { id: "ul-lower-1", routineId: upperLowerRoutine.id, dayNumber: 2, name: "Lower Squat", description: "Quads, Glutes, Hamstrings", estimatedDuration: "50-65 min" },
      { id: "ul-upper-2", routineId: upperLowerRoutine.id, dayNumber: 3, name: "Upper Pull", description: "Back, Biceps, Rear Delts", estimatedDuration: "45-60 min" },
      { id: "ul-lower-2", routineId: upperLowerRoutine.id, dayNumber: 4, name: "Lower Power", description: "Deadlift, Power, Glutes", estimatedDuration: "55-70 min" },
    ];

    upperLowerDays.forEach(day => this.workoutDays.set(day.id, day));

    // Push/Pull/Legs Template
    const pplRoutine: Routine = {
      id: "template-ppl",
      userId: "system",
      name: "Push/Pull/Legs",
      description: "6-day push/pull/legs routine",
      isTemplate: true,
      isActive: false,
      createdAt: new Date(),
    };
    this.routines.set(pplRoutine.id, pplRoutine);

    // Create workout days for PPL
    const pplDays = [
      { id: "ppl-push-1", routineId: pplRoutine.id, dayNumber: 1, name: "Push A", description: "Chest, Shoulders, Triceps", estimatedDuration: "45-60 min" },
      { id: "ppl-pull-1", routineId: pplRoutine.id, dayNumber: 2, name: "Pull A", description: "Back, Biceps", estimatedDuration: "45-60 min" },
      { id: "ppl-legs-1", routineId: pplRoutine.id, dayNumber: 3, name: "Legs A", description: "Quads, Glutes, Hamstrings", estimatedDuration: "50-65 min" },
      { id: "ppl-push-2", routineId: pplRoutine.id, dayNumber: 4, name: "Push B", description: "Chest, Shoulders, Triceps", estimatedDuration: "45-60 min" },
      { id: "ppl-pull-2", routineId: pplRoutine.id, dayNumber: 5, name: "Pull B", description: "Back, Biceps", estimatedDuration: "45-60 min" },
      { id: "ppl-legs-2", routineId: pplRoutine.id, dayNumber: 6, name: "Legs B", description: "Quads, Glutes, Hamstrings", estimatedDuration: "50-65 min" },
    ];

    pplDays.forEach(day => this.workoutDays.set(day.id, day));

    // Full Body Template
    const fullBodyRoutine: Routine = {
      id: "template-full-body",
      userId: "system",
      name: "Full Body",
      description: "3-day full body routine",
      isTemplate: true,
      isActive: false,
      createdAt: new Date(),
    };
    this.routines.set(fullBodyRoutine.id, fullBodyRoutine);

    // Create workout days for Full Body
    const fullBodyDays = [
      { id: "fb-day-1", routineId: fullBodyRoutine.id, dayNumber: 1, name: "Full Body A", description: "Compound movements", estimatedDuration: "60-75 min" },
      { id: "fb-day-2", routineId: fullBodyRoutine.id, dayNumber: 2, name: "Full Body B", description: "Compound movements", estimatedDuration: "60-75 min" },
      { id: "fb-day-3", routineId: fullBodyRoutine.id, dayNumber: 3, name: "Full Body C", description: "Compound movements", estimatedDuration: "60-75 min" },
    ];

    fullBodyDays.forEach(day => this.workoutDays.set(day.id, day));

    // Add some sample exercises to the first day of each template
    this.addSampleExercises();
  }

  private addSampleExercises() {
    // Sample exercises for Upper/Lower - Upper Push
    const upperPushExercises = [
      { workoutDayId: "ul-upper-1", name: "Bench Press", sets: 4, reps: "6-8", notes: "Focus on controlled movement", orderIndex: 1 },
      { workoutDayId: "ul-upper-1", name: "Incline Dumbbell Press", sets: 3, reps: "8-10", notes: "45-degree angle", orderIndex: 2 },
      { workoutDayId: "ul-upper-1", name: "Overhead Press", sets: 3, reps: "6-8", notes: "Keep core tight", orderIndex: 3 },
      { workoutDayId: "ul-upper-1", name: "Lateral Raises", sets: 3, reps: "12-15", notes: "Light weight, control", orderIndex: 4 },
      { workoutDayId: "ul-upper-1", name: "Dips", sets: 3, reps: "8-12", notes: "Lean forward for chest", orderIndex: 5 },
    ];

    // Sample exercises for PPL - Push A
    const pushAExercises = [
      { workoutDayId: "ppl-push-1", name: "Barbell Bench Press", sets: 4, reps: "6-8", notes: "Focus on controlled movement", orderIndex: 1 },
      { workoutDayId: "ppl-push-1", name: "Incline Dumbbell Press", sets: 3, reps: "8-10", notes: "45-degree angle", orderIndex: 2 },
      { workoutDayId: "ppl-push-1", name: "Overhead Press", sets: 3, reps: "6-8", notes: "Keep core tight", orderIndex: 3 },
      { workoutDayId: "ppl-push-1", name: "Lateral Raises", sets: 3, reps: "12-15", notes: "Light weight, control", orderIndex: 4 },
      { workoutDayId: "ppl-push-1", name: "Tricep Dips", sets: 3, reps: "8-12", notes: "Lean forward for chest", orderIndex: 5 },
    ];

    // Sample exercises for Full Body - Day A
    const fullBodyAExercises = [
      { workoutDayId: "fb-day-1", name: "Squat", sets: 4, reps: "6-8", notes: "80-85% 1RM", orderIndex: 1 },
      { workoutDayId: "fb-day-1", name: "Bench Press", sets: 4, reps: "6-8", notes: "Focus on controlled movement", orderIndex: 2 },
      { workoutDayId: "fb-day-1", name: "Deadlift", sets: 3, reps: "5", notes: "85% 1RM", orderIndex: 3 },
      { workoutDayId: "fb-day-1", name: "Overhead Press", sets: 3, reps: "6-8", notes: "Keep core tight", orderIndex: 4 },
      { workoutDayId: "fb-day-1", name: "Pull-ups", sets: 3, reps: "8-12", notes: "Assisted if needed", orderIndex: 5 },
    ];

    [...upperPushExercises, ...pushAExercises, ...fullBodyAExercises].forEach(exercise => {
      const id = randomUUID();
      this.exercises.set(id, { ...exercise, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updated = { ...user, ...updates };
      this.users.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Routine methods
  async getRoutines(userId: string): Promise<Routine[]> {
    return Array.from(this.routines.values())
      .filter(routine => routine.userId === userId || routine.isTemplate)
      .sort((a, b) => {
        // Templates first, then user routines by creation date
        if (a.isTemplate && !b.isTemplate) return -1;
        if (!a.isTemplate && b.isTemplate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getRoutine(id: string): Promise<Routine | undefined> {
    return this.routines.get(id);
  }

  async createRoutine(routine: InsertRoutine): Promise<Routine> {
    const id = randomUUID();
    const newRoutine: Routine = { ...routine, id, createdAt: new Date() };
    this.routines.set(id, newRoutine);
    return newRoutine;
  }

  async updateRoutine(id: string, updates: Partial<Routine>): Promise<Routine | undefined> {
    const routine = this.routines.get(id);
    if (routine) {
      const updated = { ...routine, ...updates };
      this.routines.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteRoutine(id: string): Promise<boolean> {
    if (!this.routines.has(id)) {
      return false;
    }

    // Delete associated workout days and exercises
    const workoutDays = Array.from(this.workoutDays.values()).filter(day => day.routineId === id);
    workoutDays.forEach(day => {
      const exercises = Array.from(this.exercises.values()).filter(ex => ex.workoutDayId === day.id);
      exercises.forEach(ex => this.exercises.delete(ex.id));
      this.workoutDays.delete(day.id);
    });

    this.routines.delete(id);
    return true;
  }

  async setActiveRoutine(userId: string, routineId: string): Promise<void> {
    // Deactivate all user routines
    Array.from(this.routines.values())
      .filter(routine => routine.userId === userId)
      .forEach(routine => {
        this.routines.set(routine.id, { ...routine, isActive: false });
      });

    // Activate the selected routine
    const routine = this.routines.get(routineId);
    if (routine) {
      this.routines.set(routineId, { ...routine, isActive: true });
    }
  }

  async getActiveRoutine(userId: string): Promise<Routine | undefined> {
    return Array.from(this.routines.values())
      .find(routine => routine.userId === userId && routine.isActive);
  }

  async copyTemplateRoutine(templateId: string, targetRoutineId: string): Promise<void> {
    // Get template workout days
    const templateDays = Array.from(this.workoutDays.values())
      .filter(day => day.routineId === templateId)
      .sort((a, b) => a.dayNumber - b.dayNumber);

    // Copy workout days
    for (const day of templateDays) {
      const newDayId = randomUUID();
      const newDay: WorkoutDay = {
        ...day,
        id: newDayId,
        routineId: targetRoutineId,
      };
      this.workoutDays.set(newDayId, newDay);

      // Copy exercises for this day
      const templateExercises = Array.from(this.exercises.values())
        .filter(exercise => exercise.workoutDayId === day.id);

      for (const exercise of templateExercises) {
        const newExerciseId = randomUUID();
        const newExercise: Exercise = {
          ...exercise,
          id: newExerciseId,
          workoutDayId: newDayId,
        };
        this.exercises.set(newExerciseId, newExercise);
      }
    }
  }

  async getWorkoutDays(routineId: string): Promise<WorkoutDay[]> {
    return Array.from(this.workoutDays.values())
      .filter(day => day.routineId === routineId)
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }

  async getWorkoutDay(id: string): Promise<WorkoutDay | undefined> {
    return this.workoutDays.get(id);
  }

  async createWorkoutDay(workoutDay: InsertWorkoutDay): Promise<WorkoutDay> {
    const id = randomUUID();
    const newWorkoutDay: WorkoutDay = { ...workoutDay, id };
    this.workoutDays.set(id, newWorkoutDay);
    return newWorkoutDay;
  }

  async updateWorkoutDay(id: string, updates: Partial<WorkoutDay>): Promise<WorkoutDay | undefined> {
    const workoutDay = this.workoutDays.get(id);
    if (workoutDay) {
      const updated = { ...workoutDay, ...updates };
      this.workoutDays.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteWorkoutDay(id: string): Promise<boolean> {
    if (!this.workoutDays.has(id)) {
      return false;
    }
    this.workoutDays.delete(id);
    // Also delete associated exercises
    const exercisesToDelete = Array.from(this.exercises.values()).filter(
      (ex) => ex.workoutDayId === id,
    );
    exercisesToDelete.forEach((ex) => this.exercises.delete(ex.id));
    return true;
  }

  async getExercisesByWorkoutDay(workoutDayId: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.workoutDayId === workoutDayId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const id = randomUUID();
    const newExercise: Exercise = { ...exercise, id, notes: exercise.notes ?? null };
    this.exercises.set(id, newExercise);
    return newExercise;
  }

  async updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise | undefined> {
    const exercise = this.exercises.get(id);
    if (exercise) {
      const updated = { ...exercise, ...updates };
      this.exercises.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteExercise(id: string): Promise<boolean> {
    if (!this.exercises.has(id)) {
      return false;
    }
    this.exercises.delete(id);
    return true;
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const id = randomUUID();
    const newSession: WorkoutSession = {
      ...session,
      id,
      date: new Date(),
      completed: false,
      notes: session.notes ?? null
    };
    this.workoutSessions.set(id, newSession);
    return newSession;
  }

  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    return this.workoutSessions.get(id);
  }

  async getUserWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession | undefined> {
    const session = this.workoutSessions.get(id);
    if (session) {
      const updated = { ...session, ...updates };
      this.workoutSessions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async createWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet> {
    const id = randomUUID();
    const newSet: WorkoutSet = {
      ...set,
      id,
      weight: set.weight ?? null,
      reps: set.reps ?? null,
      completed: set.completed ?? false
    };
    this.workoutSets.set(id, newSet);
    return newSet;
  }

  async getWorkoutSet(id: string): Promise<WorkoutSet | undefined> {
    return this.workoutSets.get(id);
  }

  async getWorkoutSetsBySession(sessionId: string): Promise<WorkoutSet[]> {
    return Array.from(this.workoutSets.values())
      .filter(set => set.sessionId === sessionId)
      .sort((a, b) => a.setNumber - b.setNumber);
  }

  async updateWorkoutSet(id: string, updates: Partial<WorkoutSet>): Promise<WorkoutSet | undefined> {
    const set = this.workoutSets.get(id);
    if (set) {
      const updated = { ...set, ...updates };
      this.workoutSets.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async createRecoveryLog(log: InsertRecoveryLog): Promise<RecoveryLog> {
    const id = randomUUID();
    const newLog: RecoveryLog = {
      ...log,
      id,
      date: new Date(),
      recommendation: log.sorenessLevel >= 5
        ? "Consider active recovery or rest day"
        : "You're ready to train hard today!"
    };
    this.recoveryLogs.set(id, newLog);
    return newLog;
  }

  async getUserRecoveryLogs(userId: string): Promise<RecoveryLog[]> {
    return Array.from(this.recoveryLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getLatestRecoveryLog(userId: string): Promise<RecoveryLog | undefined> {
    const logs = await this.getUserRecoveryLogs(userId);
    return logs[0];
  }

  async createPersonalRecord(pr: InsertPersonalRecord): Promise<PersonalRecord> {
    const id = randomUUID();
    const newPR: PersonalRecord = {
      ...pr,
      id,
      date: new Date()
    };
    this.personalRecords.set(id, newPR);
    return newPR;
  }

  async getUserPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    return Array.from(this.personalRecords.values())
      .filter(pr => pr.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getLatestPersonalRecord(userId: string, exerciseName: string): Promise<PersonalRecord | undefined> {
    const records = Array.from(this.personalRecords.values())
      .filter(pr => pr.userId === userId && pr.exerciseName === exerciseName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return records[0];
  }
}

export const storage = new MemStorage();
