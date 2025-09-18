import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Dumbbell, User, Play, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { WorkoutDay, Exercise, WorkoutSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import ExerciseCard from "@/components/workout/exercise-card";
import BottomNavigation from "@/components/layout/bottom-navigation";

export default function Workout() {
  const { dayId } = useParams();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  
  // Mock user ID for demo
  const userId = "demo-user";

  const { data: workoutDay, isLoading: dayLoading } = useQuery<WorkoutDay>({
    queryKey: ["/api/workout-days", dayId],
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/workout-days", dayId, "exercises"],
    enabled: !!dayId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: { userId: string; workoutDayId: string }) => {
      const response = await apiRequest("POST", "/api/workout-sessions", data);
      return response.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      toast({
        title: "Workout Started",
        description: "Your workout session has been created!",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (data: { sessionId: string; updates: Partial<WorkoutSession> }) => {
      const response = await apiRequest("PATCH", `/api/workout-sessions/${data.sessionId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "workout-sessions"] });
      toast({
        title: "Workout Saved",
        description: "Your progress has been saved successfully!",
      });
    },
  });

  const handleStartWorkout = () => {
    if (!dayId) return;
    
    createSessionMutation.mutate({
      userId,
      workoutDayId: dayId,
    });
  };

  const handleSaveWorkout = () => {
    if (!currentSession) return;
    
    updateSessionMutation.mutate({
      sessionId: currentSession.id,
      updates: { completed: true },
    });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="text-primary-foreground" size={16} />
              </div>
              <h1 className="text-lg font-bold text-foreground">CoachFit</h1>
            </div>
            <button 
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              data-testid="button-profile"
            >
              <User className="text-muted-foreground" size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-20">
        <section className="mb-6">
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Today's Workout: {workoutDay.name}
                </h3>
                {!currentSession ? (
                  <Button
                    onClick={handleStartWorkout}
                    disabled={createSessionMutation.isPending}
                    size="sm"
                    className="text-primary-foreground"
                    data-testid="button-start-workout"
                  >
                    <Play className="mr-1" size={14} />
                    Start
                  </Button>
                ) : (
                  <div className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
                    In Progress
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {exercises.length} exercises • Estimated {workoutDay.estimatedDuration}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  sessionId={currentSession?.id}
                  isActive={currentSession !== null}
                  isCompleted={index < 2} // Mock completion status
                />
              ))}
            </div>

            {currentSession && (
              <div className="p-4 border-t border-border">
                <Button
                  onClick={handleSaveWorkout}
                  disabled={updateSessionMutation.isPending}
                  className="w-full"
                  data-testid="button-save-workout"
                >
                  <Save className="mr-2" size={16} />
                  Save Workout
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNavigation currentPage="workouts" />
    </div>
  );
}
