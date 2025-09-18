import { useQuery } from "@tanstack/react-query";
import { Dumbbell, User, TrendingUp } from "lucide-react";
import BottomNavigation from "@/components/layout/bottom-navigation";
import ProgressChart from "@/components/progress/progress-chart";
import type { WorkoutSession, PersonalRecord } from "@shared/schema";

export default function Progress() {
  // Mock user ID for demo
  const userId = "demo-user";

  const { data: sessions, isLoading: sessionsLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/users", userId, "workout-sessions"],
  });

  const { data: personalRecords, isLoading: recordsLoading } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/users", userId, "personal-records"],
  });

  const isLoading = sessionsLoading || recordsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading progress...</div>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockPRs = [
    { exercise: "Deadlift", current: 275, previous: 265, date: "3 days ago" },
    { exercise: "Bench Press", current: 185, previous: 180, date: "1 week ago" },
    { exercise: "Squat", current: 225, previous: 210, date: "5 days ago" },
    { exercise: "Overhead Press", current: 135, previous: 130, date: "1 week ago" },
  ];

  const mockWorkoutHistory = [
    { date: "2024-01-15", day: "Pull Focus", completed: true },
    { date: "2024-01-13", day: "Lower Squat", completed: true },
    { date: "2024-01-11", day: "Upper Push", completed: true },
    { date: "2024-01-09", day: "Lower Power", completed: false },
    { date: "2024-01-07", day: "Pull Focus", completed: true },
  ];

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
              <h1 className="text-lg font-bold text-foreground">Progress</h1>
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
        {/* Personal Records */}
        <section className="py-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center">
            <TrendingUp className="mr-2 text-accent" size={18} />
            Personal Records
          </h3>
          <div className="space-y-3">
            {mockPRs.map((pr) => (
              <div key={pr.exercise} className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{pr.exercise}</h4>
                    <p className="text-sm text-muted-foreground">Last updated {pr.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground" data-testid={`text-pr-${pr.exercise.toLowerCase().replace(' ', '-')}`}>
                      {pr.current} lbs
                    </p>
                    <p className="text-sm text-accent">+{pr.current - pr.previous} lbs</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Progress Chart */}
        <section className="mb-6">
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <h3 className="font-semibold text-foreground mb-4">Strength Progress</h3>
            <ProgressChart />
          </div>
        </section>

        {/* Workout History */}
        <section className="mb-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Workouts</h3>
          <div className="space-y-3">
            {mockWorkoutHistory.map((workout, index) => (
              <div key={index} className="bg-card rounded-lg border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{workout.day}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workout.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    workout.completed 
                      ? 'text-accent bg-accent/10' 
                      : 'text-muted-foreground bg-muted/50'
                  }`}>
                    {workout.completed ? 'Completed' : 'Incomplete'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Summary */}
        <section className="mb-6">
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <h3 className="font-semibold text-foreground mb-4">This Month</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground" data-testid="text-workouts-completed">12</p>
                <p className="text-sm text-muted-foreground">Workouts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground" data-testid="text-prs-set">3</p>
                <p className="text-sm text-muted-foreground">New PRs</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation currentPage="progress" />
    </div>
  );
}
