import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Exercise } from "@shared/schema";

interface ExerciseCardProps {
  exercise: Exercise;
  sessionId?: string;
  isActive: boolean;
  isCompleted?: boolean;
}

interface SetData {
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export default function ExerciseCard({ 
  exercise, 
  sessionId, 
  isActive, 
  isCompleted = false 
}: ExerciseCardProps) {
  const [sets, setSets] = useState<SetData[]>(
    Array.from({ length: exercise.sets }, () => ({
      weight: null,
      reps: null,
      completed: false,
    }))
  );
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const createSetMutation = useMutation({
    mutationFn: async (data: {
      sessionId: string;
      exerciseId: string;
      setNumber: number;
      weight?: number;
      reps?: number;
      completed: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/workout-sets", data);
      return response.json();
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/workout-sessions", sessionId, "sets"] });
      }
      toast({
        title: "Set logged",
        description: "Your set has been recorded!",
      });
    },
  });

  const handleSetToggle = (setIndex: number) => {
    if (!sessionId || !isActive) return;

    const currentSet = sets[setIndex];
    const newCompleted = !currentSet.completed;

    // Update local state
    const newSets = [...sets];
    newSets[setIndex] = { ...currentSet, completed: newCompleted };
    setSets(newSets);

    // Save to backend
    createSetMutation.mutate({
      sessionId,
      exerciseId: exercise.id,
      setNumber: setIndex + 1,
      weight: currentSet.weight || undefined,
      reps: currentSet.reps || undefined,
      completed: newCompleted,
    });
  };

  const handleSetDataChange = (setIndex: number, field: 'weight' | 'reps', value: string) => {
    const numValue = value === '' ? null : Number(value);
    const newSets = [...sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: numValue };
    setSets(newSets);
  };

  const isUpcoming = !isActive || isCompleted;

  return (
    <div className={`rounded-lg p-3 border ${
      isCompleted 
        ? 'bg-accent/10 border-accent/30' 
        : isActive 
          ? 'bg-muted/30 border-border' 
          : 'bg-muted/20 border-border/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-medium ${
          isUpcoming ? 'text-muted-foreground' : 'text-foreground'
        }`}>
          {exercise.name}
        </h4>
        <button 
          className={`text-sm ${
            isUpcoming ? 'text-muted-foreground' : 'text-primary'
          }`}
          data-testid={`button-info-${exercise.name.toLowerCase().replace(' ', '-')}`}
        >
          <Info size={16} />
        </button>
      </div>
      
      <p className={`text-sm mb-3 ${
        isUpcoming ? 'text-muted-foreground/80' : 'text-muted-foreground'
      }`}>
        {exercise.sets} sets × {exercise.reps} reps • {exercise.notes}
      </p>

      {isUpcoming ? (
        <p className="text-xs text-muted-foreground">
          {isCompleted ? "Exercise completed" : "Tap to start this exercise"}
        </p>
      ) : (
        <div className="space-y-2">
          {sets.map((set, index) => (
            <div key={index} className="flex items-center space-x-3 bg-card rounded-md p-2">
              <span className="text-sm font-medium text-muted-foreground w-8">
                Set {index + 1}
              </span>
              <div className="flex-1 flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Weight"
                  className="w-20 text-sm"
                  value={set.weight || ''}
                  onChange={(e) => handleSetDataChange(index, 'weight', e.target.value)}
                  data-testid={`input-weight-${exercise.name.toLowerCase().replace(' ', '-')}-${index + 1}`}
                />
                <span className="text-xs text-muted-foreground">lbs ×</span>
                <Input
                  type="number"
                  placeholder="Reps"
                  className="w-16 text-sm"
                  value={set.reps || ''}
                  onChange={(e) => handleSetDataChange(index, 'reps', e.target.value)}
                  data-testid={`input-reps-${exercise.name.toLowerCase().replace(' ', '-')}-${index + 1}`}
                />
              </div>
              <Button
                size="sm"
                variant={set.completed ? "default" : "outline"}
                className={`w-8 h-8 p-0 ${
                  set.completed 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleSetToggle(index)}
                disabled={createSetMutation.isPending}
                data-testid={`button-complete-set-${exercise.name.toLowerCase().replace(' ', '-')}-${index + 1}`}
              >
                <Check size={14} />
              </Button>
            </div>
          ))}

          <div className="mt-3">
            <Textarea
              placeholder="Notes (e.g., 'felt strong', 'increase weight next time')"
              className="w-full text-sm resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid={`textarea-notes-${exercise.name.toLowerCase().replace(' ', '-')}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
