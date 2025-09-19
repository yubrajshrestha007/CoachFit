import { useQuery } from "@tanstack/react-query";
import { Dumbbell, User, Flame, CalendarCheck, HeartPulse, Clock, ChevronRight, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Routine, WorkoutDay } from "@shared/schema";
import RecoveryCheck from "@/components/workout/recovery-check";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    setLocation("/login");
    return null;
  }

  // Fetch active routine
  const { data: activeRoutine, isLoading: routineLoading } = useQuery<Routine | null>({
    queryKey: ["/api/routines/active"],
    enabled: !!user,
  });

  // Fetch workout days for active routine
  const { data: workoutDays, isLoading: daysLoading } = useQuery<WorkoutDay[]>({
    queryKey: [`/api/routines/${activeRoutine?.id}/workout-days`],
    enabled: !!activeRoutine,
  });

  const isLoading = routineLoading || daysLoading;
  const userId = user?.id || "demo-user";

  // Debug logging
  console.log("Home page debug:", { user, activeRoutine, workoutDays, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
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
              <div>
                <h1 className="text-lg font-bold text-foreground">CoachFit</h1>
                {activeRoutine && (
                  <p className="text-xs text-muted-foreground">{activeRoutine.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/routines")}
                className="w-10 h-10 rounded-full p-0"
                title="Manage Routines"
              >
                <Settings className="text-muted-foreground" size={16} />
              </Button>
              <span className="text-sm text-muted-foreground">
                {user?.username || "Guest"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-10 h-10 rounded-full p-0"
                data-testid="button-logout"
              >
                <LogOut className="text-muted-foreground" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-20">
        {/* Quick Stats */}
        <section className="py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Flame className="text-accent" size={16} />
                <span className="text-sm text-muted-foreground">Today's Goal</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1" data-testid="text-today-goal">
                {activeRoutine ? activeRoutine.name : "Choose Routine"}
              </p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="text-accent" size={16} />
                <span className="text-sm text-muted-foreground">Workout Days</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1" data-testid="text-week-progress">
                {workoutDays ? `${workoutDays.length} Days` : "0 Days"}
              </p>
            </div>
          </div>
        </section>

        {/* Recovery Check */}
        <section className="mb-6">
          <RecoveryCheck userId={userId} />
        </section>

        {/* Workout Selection */}
        <section className="mb-6">
          <h3 className="font-semibold text-foreground mb-4">Select Your Workout</h3>
          {!activeRoutine ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">No Active Routine</h4>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Choose a routine to start tracking your workouts
                </p>
                <Button onClick={() => setLocation("/routines")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Routines
                </Button>
              </CardContent>
            </Card>
          ) : workoutDays && workoutDays.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {workoutDays.map((day) => (
                <Link
                  key={day.id}
                  href={`/workout/${day.id}`}
                  className="block"
                >
                  <button
                    className="w-full bg-card border border-border rounded-lg p-4 text-left hover:shadow-md transition-all duration-200 hover:border-primary/50"
                    data-testid={`button-workout-day-${day.dayNumber}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full text-accent bg-accent/10">
                        Day {day.dayNumber}
                      </span>
                      <ChevronRight className="text-muted-foreground" size={12} />
                    </div>
                    <h4 className="font-semibold text-foreground">
                      {day.name}
                    </h4>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {day.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-1">
                      <Clock className="text-muted-foreground" size={12} />
                      <span className="text-xs text-muted-foreground">
                        {day.estimatedDuration}
                      </span>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">No Workout Days</h4>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Add workout days to your routine to get started
                </p>
                <Button onClick={() => setLocation(`/routines/${activeRoutine.id}/builder`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Build Routine
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Progress Preview */}
        <section className="mb-6">
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Progress Overview</h3>
              <Link href="/progress">
                <button
                  className="text-primary text-sm font-medium"
                  data-testid="button-view-progress"
                >
                  View All <ChevronRight className="inline ml-1" size={14} />
                </button>
              </Link>
            </div>

            <div className="space-y-4">
              {activeRoutine && workoutDays && workoutDays.length > 0 ? (
                <div className="text-center py-6">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Start tracking your workouts to see progress here</p>
                  <p className="text-sm text-muted-foreground mt-1">Complete exercises to build your personal records</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active routine</p>
                  <p className="text-sm text-muted-foreground mt-1">Choose a routine to start tracking your progress</p>
                </div>
              )}
            </div>

            {/* Simple progress chart */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-2">Weekly Volume Trend</p>
              <div className="h-16 bg-muted/30 rounded border border-border flex items-end justify-between px-2 py-2">
                <div className="w-4 bg-chart-1 rounded-t" style={{ height: '40%' }}></div>
                <div className="w-4 bg-chart-1 rounded-t" style={{ height: '60%' }}></div>
                <div className="w-4 bg-chart-1 rounded-t" style={{ height: '45%' }}></div>
                <div className="w-4 bg-chart-1 rounded-t" style={{ height: '80%' }}></div>
                <div className="w-4 bg-chart-1 rounded-t" style={{ height: '65%' }}></div>
                <div className="w-4 bg-chart-1 rounded-t" style={{ height: '90%' }}></div>
                <div className="w-4 bg-primary rounded-t" style={{ height: '75%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>7d</span>
                <span>6d</span>
                <span>5d</span>
                <span>4d</span>
                <span>3d</span>
                <span>2d</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation currentPage="home" />
    </div>
  );
}
