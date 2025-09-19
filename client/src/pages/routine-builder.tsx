import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Plus, Edit, Trash2, GripVertical, Clock, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import BottomNavigation from "@/components/layout/bottom-navigation";
import type { Routine, WorkoutDay, Exercise } from "@shared/schema";

export default function RoutineBuilder() {
  const { routineId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDayDialogOpen, setIsCreateDayDialogOpen] = useState(false);
  const [isCreateExerciseDialogOpen, setIsCreateExerciseDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<WorkoutDay | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const { data: routine, isLoading: routineLoading } = useQuery<Routine>({
    queryKey: [`/api/routines/${routineId}`],
    enabled: !!routineId,
  });

  const { data: workoutDays, isLoading: daysLoading } = useQuery<WorkoutDay[]>({
    queryKey: [`/api/routines/${routineId}/workout-days`],
    enabled: !!routineId,
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: [`/api/workout-days/${selectedDayId}/exercises`],
    enabled: !!selectedDayId,
  });

  const createDayMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; estimatedDuration: string }) => {
      const response = await fetch(`/api/routines/${routineId}/workout-days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          dayNumber: (workoutDays?.length || 0) + 1,
        }),
      });
      if (!response.ok) throw new Error("Failed to create workout day");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/routines/${routineId}/workout-days`] });
      setIsCreateDayDialogOpen(false);
    },
  });

  const updateDayMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WorkoutDay> }) => {
      const response = await fetch(`/api/workout-days/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update workout day");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/routines/${routineId}/workout-days`] });
      setEditingDay(null);
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/workout-days/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete workout day");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/routines/${routineId}/workout-days`] });
      if (selectedDayId === workoutDays?.find(d => d.id === selectedDayId)?.id) {
        setSelectedDayId(null);
      }
    },
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (data: { name: string; sets: number; reps: string; notes?: string }) => {
      const response = await fetch(`/api/workout-days/${selectedDayId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          orderIndex: (exercises?.length || 0) + 1,
        }),
      });
      if (!response.ok) throw new Error("Failed to create exercise");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workout-days/${selectedDayId}/exercises`] });
      setIsCreateExerciseDialogOpen(false);
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Exercise> }) => {
      const response = await fetch(`/api/exercises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update exercise");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workout-days/${selectedDayId}/exercises`] });
      setEditingExercise(null);
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/exercises/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete exercise");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workout-days/${selectedDayId}/exercises`] });
    },
  });

  if (routineLoading || daysLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading routine...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Routine not found.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{routine.name}</h1>
            <p className="text-muted-foreground">{routine.description}</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/routines")}>
            Back to Routines
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workout Days Sidebar */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Workout Days</h2>
              <Dialog open={isCreateDayDialogOpen} onOpenChange={setIsCreateDayDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Day
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Workout Day</DialogTitle>
                    <DialogDescription>
                      Create a new workout day for this routine.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateDayForm
                    onSubmit={(data) => createDayMutation.mutate(data)}
                    isLoading={createDayMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {workoutDays && workoutDays.length > 0 ? (
                workoutDays.map((day) => (
                  <Card
                  key={day.id}
                  className={`cursor-pointer transition-colors ${
                    selectedDayId === day.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedDayId(day.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{day.name}</h3>
                        <p className="text-sm text-muted-foreground">{day.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{day.estimatedDuration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDay(day);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDayMutation.mutate(day.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">No workout days yet</p>
                  <p className="text-sm text-muted-foreground">Add your first workout day to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Exercises Panel */}
          <div className="lg:col-span-2">
            {selectedDayId ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {workoutDays?.find(d => d.id === selectedDayId)?.name} Exercises
                  </h2>
                  <Dialog open={isCreateExerciseDialogOpen} onOpenChange={setIsCreateExerciseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Exercise
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Exercise</DialogTitle>
                        <DialogDescription>
                          Add a new exercise to this workout day.
                        </DialogDescription>
                      </DialogHeader>
                      <CreateExerciseForm
                        onSubmit={(data) => createExerciseMutation.mutate(data)}
                        isLoading={createExerciseMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {exercisesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading exercises...</div>
                  </div>
                ) : exercises && exercises.length > 0 ? (
                  <div className="space-y-3">
                    {exercises.map((exercise) => (
                      <Card key={exercise.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <h3 className="font-medium">{exercise.name}</h3>
                              <div className="flex items-center gap-4 mt-1">
                                <Badge variant="outline">{exercise.sets} sets</Badge>
                                <Badge variant="outline">{exercise.reps} reps</Badge>
                                {exercise.notes && (
                                  <span className="text-sm text-muted-foreground">{exercise.notes}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingExercise(exercise)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteExerciseMutation.mutate(exercise.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No exercises yet</p>
                      <Button onClick={() => setIsCreateExerciseDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Exercise
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Workout Day</h3>
                  <p className="text-muted-foreground text-center">
                    Choose a workout day from the sidebar to view and manage exercises.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Day Dialog */}
        <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Workout Day</DialogTitle>
              <DialogDescription>
                Update the workout day details.
              </DialogDescription>
            </DialogHeader>
            {editingDay && (
              <EditDayForm
                day={editingDay}
                onSubmit={(data) => updateDayMutation.mutate({ id: editingDay.id, data })}
                onCancel={() => setEditingDay(null)}
                isLoading={updateDayMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Exercise Dialog */}
        <Dialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
              <DialogDescription>
                Update the exercise details.
              </DialogDescription>
            </DialogHeader>
            {editingExercise && (
              <EditExerciseForm
                exercise={editingExercise}
                onSubmit={(data) => updateExerciseMutation.mutate({ id: editingExercise.id, data })}
                onCancel={() => setEditingExercise(null)}
                isLoading={updateExerciseMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <BottomNavigation currentPage="routines" />
    </div>
  );
}

function CreateDayForm({
  onSubmit,
  isLoading
}: {
  onSubmit: (data: { name: string; description: string; estimatedDuration: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || "No description",
      estimatedDuration: estimatedDuration.trim() || "45-60 min"
    });
    setName("");
    setDescription("");
    setEstimatedDuration("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="day-name">Day Name</Label>
        <Input
          id="day-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Upper Push, Leg Day"
          required
        />
      </div>
      <div>
        <Label htmlFor="day-description">Description</Label>
        <Textarea
          id="day-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the focus of this workout day"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="day-duration">Estimated Duration</Label>
        <Input
          id="day-duration"
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)}
          placeholder="e.g., 45-60 min"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Creating..." : "Create Day"}
        </Button>
      </div>
    </form>
  );
}

function EditDayForm({
  day,
  onSubmit,
  onCancel,
  isLoading
}: {
  day: WorkoutDay;
  onSubmit: (data: Partial<WorkoutDay>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(day.name);
  const [description, setDescription] = useState(day.description);
  const [estimatedDuration, setEstimatedDuration] = useState(day.estimatedDuration);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      estimatedDuration: estimatedDuration.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-day-name">Day Name</Label>
        <Input
          id="edit-day-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Upper Push, Leg Day"
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-day-description">Description</Label>
        <Textarea
          id="edit-day-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the focus of this workout day"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="edit-day-duration">Estimated Duration</Label>
        <Input
          id="edit-day-duration"
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)}
          placeholder="e.g., 45-60 min"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Updating..." : "Update Day"}
        </Button>
      </div>
    </form>
  );
}

function CreateExerciseForm({
  onSubmit,
  isLoading
}: {
  onSubmit: (data: { name: string; sets: number; reps: string; notes?: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reps.trim()) return;
    onSubmit({
      name: name.trim(),
      sets,
      reps: reps.trim(),
      notes: notes.trim() || undefined
    });
    setName("");
    setSets(3);
    setReps("");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="exercise-name">Exercise Name</Label>
        <Input
          id="exercise-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bench Press, Squat"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="exercise-sets">Sets</Label>
          <Input
            id="exercise-sets"
            type="number"
            value={sets}
            onChange={(e) => setSets(parseInt(e.target.value) || 0)}
            min="1"
            required
          />
        </div>
        <div>
          <Label htmlFor="exercise-reps">Reps</Label>
          <Input
            id="exercise-reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="e.g., 8-10, 12-15"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="exercise-notes">Notes (Optional)</Label>
        <Textarea
          id="exercise-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., 80% 1RM, Control the negative"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || !name.trim() || !reps.trim()}>
          {isLoading ? "Creating..." : "Create Exercise"}
        </Button>
      </div>
    </form>
  );
}

function EditExerciseForm({
  exercise,
  onSubmit,
  onCancel,
  isLoading
}: {
  exercise: Exercise;
  onSubmit: (data: Partial<Exercise>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState(exercise.sets);
  const [reps, setReps] = useState(exercise.reps);
  const [notes, setNotes] = useState(exercise.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reps.trim()) return;
    onSubmit({
      name: name.trim(),
      sets,
      reps: reps.trim(),
      notes: notes.trim() || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-exercise-name">Exercise Name</Label>
        <Input
          id="edit-exercise-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bench Press, Squat"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-exercise-sets">Sets</Label>
          <Input
            id="edit-exercise-sets"
            type="number"
            value={sets}
            onChange={(e) => setSets(parseInt(e.target.value) || 0)}
            min="1"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-exercise-reps">Reps</Label>
          <Input
            id="edit-exercise-reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="e.g., 8-10, 12-15"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="edit-exercise-notes">Notes</Label>
        <Textarea
          id="edit-exercise-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., 80% 1RM, Control the negative"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim() || !reps.trim()}>
          {isLoading ? "Updating..." : "Update Exercise"}
        </Button>
      </div>
    </form>
  );
}
