import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Dumbbell, Play, Save, Check, Plus, Minus, Trophy, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import BottomNavigation from "@/components/layout/bottom-navigation";
import type { WorkoutDay, Exercise, WorkoutSession, WorkoutSet } from "@shared/schema";

interface ExerciseWithSets extends Exercise {
  sets: WorkoutSet[];
}

export default function Workout() {
  const { dayId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<string, WorkoutSet[]>>({});
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const userId = user?.id || "demo-user";

  const { data: workoutDay, isLoading: dayLoading } = useQuery<WorkoutDay>({
    queryKey: [`/api/workout-days/${dayId}`],
    enabled: !!dayId,
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: [`/api/workout-days/${dayId}/exercises`],
    enabled: !!dayId,
  });

  const { data: session, isLoading: sessionLoading } = useQuery<WorkoutSession | null>({
    queryKey: [`/api/workout-sessions/${currentSession?.id}`],
    enabled: !!currentSession?.id,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: { userId: string; workoutDayId: string }) => {
      const response = await fetch("/api/workout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      setIsWorkoutActive(true);
      toast({
        title: "Workout Started!",
        description: "Let's crush this workout! 💪",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (data: { sessionId: string; updates: Partial<WorkoutSession> }) => {
      const response = await fetch(`/api/workout-sessions/${data.sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/workout-sessions`] });
      toast({
        title: "Workout Completed!",
        description: "Great job! Your progress has been saved.",
      });
    },
  });

  const createSetMutation = useMutation({
    mutationFn: async (data: { sessionId: string; exerciseId: string; setNumber: number; weight?: number; reps?: number }) => {
      const response = await fetch("/api/workout-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create set");
      return response.json();
    },
    onSuccess: (newSet) => {
      queryClient.invalidateQueries({ queryKey: [`/api/workout-sessions/${currentSession?.id}/sets`] });
      // Update local state
      setExerciseSets(prev => ({
        ...prev,
        [newSet.exerciseId]: [...(prev[newSet.exerciseId] || []), newSet]
      }));
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: async (data: { setId: string; updates: Partial<WorkoutSet> }) => {
      const response = await fetch(`/api/workout-sets/${data.setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update set");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workout-sessions/${currentSession?.id}/sets`] });
    },
  });

  const handleStartWorkout = () => {
    if (!dayId) return;
    createSessionMutation.mutate({
      userId,
      workoutDayId: dayId,
    });
  };

  const handleCompleteWorkout = () => {
    if (!currentSession) return;
    updateSessionMutation.mutate({
      sessionId: currentSession.id,
      updates: { completed: true },
    });
    setIsWorkoutActive(false);
  };

  const addSet = (exerciseId: string) => {
    if (!currentSession) return;

    const currentSets = exerciseSets[exerciseId] || [];
    const setNumber = currentSets.length + 1;

    createSetMutation.mutate({
      sessionId: currentSession.id,
      exerciseId,
      setNumber,
    });
  };

  const updateSet = (setId: string, updates: Partial<WorkoutSet>) => {
    updateSetMutation.mutate({
      setId,
      updates,
    });
  };

  const getExerciseProgress = (exercise: Exercise) => {
    const sets = exerciseSets[exercise.id] || [];
    const completedSets = sets.filter(set => set.completed).length;
    return {
      completed: completedSets,
      total: exercise.sets,
      percentage: (completedSets / exercise.sets) * 100
    };
  };

  const getOverallProgress = () => {
    if (!exercises) return 0;
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const completedSets = exercises.reduce((sum, ex) => {
      const sets = exerciseSets[ex.id] || [];
      return sum + sets.filter(set => set.completed).length;
    }, 0);
    return (completedSets / totalSets) * 100;
  };

  if (dayLoading || exercisesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading workout...</div>
        </div>
      </div>
    );
  }

  if (!workoutDay || !exercises) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Workout not found</div>
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="text-primary-foreground" size={16} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{workoutDay.name}</h1>
                <p className="text-xs text-muted-foreground">{workoutDay.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{workoutDay.estimatedDuration}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isWorkoutActive && (
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <ProgressBar value={overallProgress} className="h-2" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {!isWorkoutActive ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">Ready to Work Out?</h2>
              <p className="text-muted-foreground text-center mb-6">
                {exercises.length} exercises • {exercises.reduce((sum, ex) => sum + ex.sets, 0)} total sets
              </p>
              <Button onClick={handleStartWorkout} size="lg" className="w-full">
                <Play className="mr-2 h-5 w-5" />
                Start Workout
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Workout Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-medium">Workout in Progress</span>
                  </div>
                  <Button onClick={handleCompleteWorkout} variant="outline" size="sm">
                    <Check className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exercises */}
            {exercises.map((exercise) => {
              const progress = getExerciseProgress(exercise);
              const sets = exerciseSets[exercise.id] || [];

              return (
                <Card key={exercise.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                        <CardDescription>
                          {exercise.sets} sets • {exercise.reps} reps
                        </CardDescription>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{exercise.notes}</p>
                        )}
                      </div>
                      <Badge variant={progress.percentage === 100 ? "default" : "secondary"}>
                        {progress.completed}/{progress.total}
                      </Badge>
                    </div>
                    <ProgressBar value={progress.percentage} className="h-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sets.map((set, index) => (
                        <div key={set.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium w-8">Set {set.setNumber}</span>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`weight-${set.id}`} className="text-xs">Weight (lbs)</Label>
                              <Input
                                id={`weight-${set.id}`}
                                type="number"
                                value={set.weight || ""}
                                onChange={(e) => updateSet(set.id, { weight: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`reps-${set.id}`} className="text-xs">Reps</Label>
                              <Input
                                id={`reps-${set.id}`}
                                type="number"
                                value={set.reps || ""}
                                onChange={(e) => updateSet(set.id, { reps: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="h-8"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={set.completed ? "default" : "outline"}
                            onClick={() => updateSet(set.id, { completed: !set.completed })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {sets.length < exercise.sets && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exercise.id)}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Set {sets.length + 1}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation currentPage="workouts" />
    </div>
  );
}
