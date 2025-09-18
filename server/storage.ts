import { 
  type User, 
  type InsertUser, 
  type WorkoutDay, 
  type Exercise, 
  type WorkoutSession,
  type WorkoutSet,
  type RecoveryLog,
  type PersonalRecord,
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
  
  // Workout Days
  getWorkoutDays(): Promise<WorkoutDay[]>;
  getWorkoutDay(id: string): Promise<WorkoutDay | undefined>;
  
  // Exercises
  getExercisesByWorkoutDay(workoutDayId: string): Promise<Exercise[]>;
  
  // Workout Sessions
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  getWorkoutSession(id: string): Promise<WorkoutSession | undefined>;
  getUserWorkoutSessions(userId: string): Promise<WorkoutSession[]>;
  updateWorkoutSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession | undefined>;
  
  // Workout Sets
  createWorkoutSet(set: InsertWorkoutSet): Promise<WorkoutSet>;
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
  private workoutDays: Map<string, WorkoutDay>;
  private exercises: Map<string, Exercise>;
  private workoutSessions: Map<string, WorkoutSession>;
  private workoutSets: Map<string, WorkoutSet>;
  private recoveryLogs: Map<string, RecoveryLog>;
  private personalRecords: Map<string, PersonalRecord>;

  constructor() {
    this.users = new Map();
    this.workoutDays = new Map();
    this.exercises = new Map();
    this.workoutSessions = new Map();
    this.workoutSets = new Map();
    this.recoveryLogs = new Map();
    this.personalRecords = new Map();
    
    this.initializeWorkoutData();
  }

  private initializeWorkoutData() {
    // Initialize workout days
    const days: WorkoutDay[] = [
      {
        id: "day-1",
        dayNumber: 1,
        name: "Upper Push",
        description: "Chest, Shoulders, Triceps",
        estimatedDuration: "45-60 min"
      },
      {
        id: "day-2",
        dayNumber: 2,
        name: "Lower Squat",
        description: "Quads, Glutes, Hamstrings",
        estimatedDuration: "50-65 min"
      },
      {
        id: "day-3",
        dayNumber: 3,
        name: "Pull Focus",
        description: "Back, Biceps, Rear Delts",
        estimatedDuration: "45-60 min"
      },
      {
        id: "day-4",
        dayNumber: 4,
        name: "Lower Power",
        description: "Deadlift, Power, Glutes",
        estimatedDuration: "55-70 min"
      }
    ];

    days.forEach(day => this.workoutDays.set(day.id, day));

    // Initialize exercises
    const exerciseData = [
      // Day 1: Upper Push
      { workoutDayId: "day-1", name: "Bench Press", sets: 4, reps: "6-8", notes: "Focus on controlled movement", orderIndex: 1 },
      { workoutDayId: "day-1", name: "Incline Dumbbell Press", sets: 3, reps: "8-10", notes: "45-degree angle", orderIndex: 2 },
      { workoutDayId: "day-1", name: "Overhead Press", sets: 3, reps: "6-8", notes: "Keep core tight", orderIndex: 3 },
      { workoutDayId: "day-1", name: "Lateral Raises", sets: 3, reps: "12-15", notes: "Light weight, control", orderIndex: 4 },
      { workoutDayId: "day-1", name: "Dips", sets: 3, reps: "8-12", notes: "Lean forward for chest", orderIndex: 5 },
      { workoutDayId: "day-1", name: "Plank", sets: 3, reps: "30-60s", notes: "Hold position", orderIndex: 6 },

      // Day 2: Lower Squat
      { workoutDayId: "day-2", name: "Squat", sets: 4, reps: "6-8", notes: "80-85% 1RM", orderIndex: 1 },
      { workoutDayId: "day-2", name: "Romanian Deadlift", sets: 3, reps: "8-10", notes: "Feel the stretch", orderIndex: 2 },
      { workoutDayId: "day-2", name: "Bulgarian Split Squat", sets: 3, reps: "10-12", notes: "Each leg", orderIndex: 3 },
      { workoutDayId: "day-2", name: "Hip Thrust", sets: 3, reps: "12-15", notes: "Squeeze glutes", orderIndex: 4 },
      { workoutDayId: "day-2", name: "Calf Raise", sets: 3, reps: "15-20", notes: "Full range", orderIndex: 5 },
      { workoutDayId: "day-2", name: "Leg Raises", sets: 3, reps: "12-15", notes: "Control the negative", orderIndex: 6 },

      // Day 3: Pull Focus
      { workoutDayId: "day-3", name: "Deadlift", sets: 4, reps: "6", notes: "85% 1RM", orderIndex: 1 },
      { workoutDayId: "day-3", name: "Lat Pulldown", sets: 3, reps: "8-10", notes: "Control the negative", orderIndex: 2 },
      { workoutDayId: "day-3", name: "Barbell Rows", sets: 3, reps: "8-10", notes: "Chest supported", orderIndex: 3 },
      { workoutDayId: "day-3", name: "Face Pulls", sets: 3, reps: "12-15", notes: "High rep range", orderIndex: 4 },
      { workoutDayId: "day-3", name: "Bicep Curls", sets: 3, reps: "10-12", notes: "Slow controlled", orderIndex: 5 },
      { workoutDayId: "day-3", name: "Hammer Curls", sets: 3, reps: "10-12", notes: "Neutral grip", orderIndex: 6 },

      // Day 4: Lower Power
      { workoutDayId: "day-4", name: "Deadlift Heavy", sets: 4, reps: "3-5", notes: "90-95% 1RM", orderIndex: 1 },
      { workoutDayId: "day-4", name: "Front Squat", sets: 3, reps: "6-8", notes: "Upright torso", orderIndex: 2 },
      { workoutDayId: "day-4", name: "Lunges", sets: 3, reps: "10-12", notes: "Each leg", orderIndex: 3 },
      { workoutDayId: "day-4", name: "Glute Bridge", sets: 3, reps: "15-20", notes: "Hold at top", orderIndex: 4 },
      { workoutDayId: "day-4", name: "Calf Raise", sets: 3, reps: "15-20", notes: "Explosive up", orderIndex: 5 },
      { workoutDayId: "day-4", name: "Core Circuit", sets: 3, reps: "30s", notes: "Various movements", orderIndex: 6 }
    ];

    exerciseData.forEach(exercise => {
      const id = randomUUID();
      this.exercises.set(id, { ...exercise, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
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

  async getWorkoutDays(): Promise<WorkoutDay[]> {
    return Array.from(this.workoutDays.values()).sort((a, b) => a.dayNumber - b.dayNumber);
  }

  async getWorkoutDay(id: string): Promise<WorkoutDay | undefined> {
    return this.workoutDays.get(id);
  }

  async getExercisesByWorkoutDay(workoutDayId: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.workoutDayId === workoutDayId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
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
