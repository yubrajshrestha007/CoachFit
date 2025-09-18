import { useQuery } from "@tanstack/react-query";
import { Dumbbell, User, Flame, CalendarCheck, HeartPulse, Clock, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { WorkoutDay } from "@shared/schema";
import RecoveryCheck from "@/components/workout/recovery-check";
import BottomNavigation from "@/components/layout/bottom-navigation";

export default function Home() {
  const { data: workoutDays, isLoading } = useQuery<WorkoutDay[]>({
    queryKey: ["/api/workout-days"],
  });

  // Mock user ID for demo
  const userId = "demo-user";

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
        {/* Quick Stats */}
        <section className="py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <Flame className="text-accent" size={16} />
                <span className="text-sm text-muted-foreground">Today's Goal</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1" data-testid="text-today-goal">
                Pull Focus
              </p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="text-accent" size={16} />
                <span className="text-sm text-muted-foreground">Week Progress</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1" data-testid="text-week-progress">
                2/4 Days
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
          <div className="grid grid-cols-2 gap-3">
            {workoutDays?.map((day) => (
              <Link 
                key={day.id}
                href={`/workout/${day.id}`}
                className="block"
              >
                <button 
                  className={`w-full bg-card border border-border rounded-lg p-4 text-left hover:shadow-md transition-all duration-200 hover:border-primary/50 ${
                    day.dayNumber === 3 ? 'bg-primary border-primary shadow-md' : ''
                  }`}
                  data-testid={`button-workout-day-${day.dayNumber}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      day.dayNumber === 3 
                        ? 'text-primary-foreground bg-white/20' 
                        : 'text-accent bg-accent/10'
                    }`}>
                      Day {day.dayNumber}
                    </span>
                    <ChevronRight 
                      className={day.dayNumber === 3 ? 'text-primary-foreground' : 'text-muted-foreground'} 
                      size={12} 
                    />
                  </div>
                  <h4 className={`font-semibold ${
                    day.dayNumber === 3 ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {day.name}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    day.dayNumber === 3 ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {day.description}
                  </p>
                  <div className="flex items-center mt-2 space-x-1">
                    <Clock 
                      className={day.dayNumber === 3 ? 'text-primary-foreground/80' : 'text-muted-foreground'} 
                      size={12} 
                    />
                    <span className={`text-xs ${
                      day.dayNumber === 3 ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {day.estimatedDuration}
                    </span>
                  </div>
                </button>
              </Link>
            ))}
          </div>
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
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">Deadlift 1RM</p>
                  <p className="text-sm text-muted-foreground">Last updated 3 days ago</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-foreground" data-testid="text-deadlift-pr">275 lbs</p>
                  <p className="text-sm text-accent">+10 lbs from last month</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">Bench Press 1RM</p>
                  <p className="text-sm text-muted-foreground">Last updated 1 week ago</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-foreground" data-testid="text-bench-pr">185 lbs</p>
                  <p className="text-sm text-accent">+5 lbs from last month</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">Squat 1RM</p>
                  <p className="text-sm text-muted-foreground">Last updated 5 days ago</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-foreground" data-testid="text-squat-pr">225 lbs</p>
                  <p className="text-sm text-accent">+15 lbs from last month</p>
                </div>
              </div>
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
