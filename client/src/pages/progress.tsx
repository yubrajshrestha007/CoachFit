import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Dumbbell, Trophy, Target, Flame, Calendar, Award, Zap, Star, TrendingUp } from "lucide-react";
import { formatDistanceToNow, isThisMonth, isThisWeek } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import type { WorkoutSession, PersonalRecord, WorkoutDay } from "@shared/schema";

export default function Progress() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const userId = user?.id || "demo-user";

  const { data: sessions, isLoading: sessionsLoading } = useQuery<WorkoutSession[]>({
    queryKey: [`/api/users/${userId}/workout-sessions`],
    enabled: !!user,
  });

  const { data: personalRecords, isLoading: recordsLoading } = useQuery<PersonalRecord[]>({
    queryKey: [`/api/users/${userId}/personal-records`],
    enabled: !!user,
  });

  const { data: activeRoutine } = useQuery({
    queryKey: ["/api/routines/active"],
    enabled: !!user,
  });

  const { data: workoutDays } = useQuery<WorkoutDay[]>({
    queryKey: [`/api/routines/${activeRoutine?.id}/workout-days`],
    enabled: !!activeRoutine,
  });

  const isLoading = sessionsLoading || recordsLoading;

  // Calculate stats and achievements
  const stats = useMemo(() => {
    if (!sessions) return {
      totalWorkouts: 0,
      thisWeekWorkouts: 0,
      thisMonthWorkouts: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      level: 1,
      xpToNextLevel: 100,
    };

    const completedSessions = sessions.filter(s => s.completed);
    const thisWeekSessions = completedSessions.filter(s => isThisWeek(new Date(s.date)));
    const thisMonthSessions = completedSessions.filter(s => isThisMonth(new Date(s.date)));

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedSessions = completedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (let i = 0; i < sortedSessions.length; i++) {
      const session = sortedSessions[i];
      const sessionDate = new Date(session.date);
      const prevSessionDate = i > 0 ? new Date(sortedSessions[i - 1].date) : null;

      if (i === 0 || (prevSessionDate && sessionDate.toDateString() === prevSessionDate.toDateString())) {
        tempStreak++;
      } else {
        if (i === 1) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    if (currentStreak === 0) currentStreak = tempStreak;
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate points and level
    const totalPoints = completedSessions.length * 10 + thisWeekSessions.length * 5 + currentStreak * 3;
    const level = Math.floor(totalPoints / 100) + 1;
    const xpToNextLevel = 100 - (totalPoints % 100);

    return {
      totalWorkouts: completedSessions.length,
      thisWeekWorkouts: thisWeekSessions.length,
      thisMonthWorkouts: thisMonthSessions.length,
      currentStreak,
      longestStreak,
      totalPoints,
      level,
      xpToNextLevel,
    };
  }, [sessions]);

  const achievements = useMemo(() => {
    const achievements = [];

    if (stats.totalWorkouts >= 1) achievements.push({ name: "First Workout", icon: "🎉", description: "Completed your first workout!" });
    if (stats.totalWorkouts >= 10) achievements.push({ name: "Getting Started", icon: "💪", description: "Completed 10 workouts!" });
    if (stats.totalWorkouts >= 50) achievements.push({ name: "Consistent", icon: "🔥", description: "Completed 50 workouts!" });
    if (stats.currentStreak >= 3) achievements.push({ name: "Streak Master", icon: "⚡", description: "3-day workout streak!" });
    if (stats.currentStreak >= 7) achievements.push({ name: "Week Warrior", icon: "🏆", description: "7-day workout streak!" });
    if (stats.currentStreak >= 30) achievements.push({ name: "Month Master", icon: "👑", description: "30-day workout streak!" });
    if (stats.level >= 5) achievements.push({ name: "Level Up", icon: "⭐", description: "Reached level 5!" });
    if (stats.level >= 10) achievements.push({ name: "Fitness Pro", icon: "🏅", description: "Reached level 10!" });

    return achievements;
  }, [stats]);

  const recentPRs = useMemo(() => {
    if (!personalRecords || personalRecords.length === 0) return [];

    const recordsByExercise: { [key: string]: PersonalRecord[] } = {};
    personalRecords.forEach(pr => {
      if (!recordsByExercise[pr.exerciseName]) {
        recordsByExercise[pr.exerciseName] = [];
      }
      recordsByExercise[pr.exerciseName].push(pr);
    });

    return Object.keys(recordsByExercise).map(exerciseName => {
      const records = recordsByExercise[exerciseName].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return records[0];
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [personalRecords]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading progress...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progress</h1>
            <p className="text-muted-foreground">Track your fitness journey</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">Level {stats.level}</div>
            <div className="text-xs text-muted-foreground">{stats.totalPoints} XP</div>
          </div>
        </div>

        {/* Level Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level Progress</span>
              <span className="text-sm text-muted-foreground">{stats.xpToNextLevel} XP to next level</span>
            </div>
            <ProgressBar value={100 - stats.xpToNextLevel} className="h-2" />
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Dumbbell className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
              <div className="text-sm text-muted-foreground">Total Workouts</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.thisWeekWorkouts}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{achievements.length}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Achievements
            </CardTitle>
            <CardDescription>
              Unlock achievements by completing workouts and building streaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    </div>
                    <Badge variant="default">Unlocked</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Complete workouts to unlock achievements!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Personal Records
            </CardTitle>
            <CardDescription>
              Your latest personal bests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPRs.length > 0 ? (
              <div className="space-y-3">
                {recentPRs.map((pr, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{pr.exerciseName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(pr.date), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{pr.weight} lbs</div>
                      <div className="text-sm text-muted-foreground">{pr.reps} reps</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No personal records yet</p>
                <p className="text-sm text-muted-foreground">Complete workouts to track your progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={() => setLocation("/")}
            >
              <Dumbbell className="h-4 w-4 mr-2" />
              Start Workout
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/routines")}
            >
              <Target className="h-4 w-4 mr-2" />
              Manage Routines
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="progress" />
    </div>
  );
}
