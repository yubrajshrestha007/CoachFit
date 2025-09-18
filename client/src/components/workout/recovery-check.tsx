import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HeartPulse, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { RecoveryLog } from "@shared/schema";

interface RecoveryCheckProps {
  userId: string;
}

export default function RecoveryCheck({ userId }: RecoveryCheckProps) {
  const [selectedSoreness, setSelectedSoreness] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: latestLog } = useQuery<RecoveryLog>({
    queryKey: ["/api/users", userId, "recovery-logs", "latest"],
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: { userId: string; sorenessLevel: number }) => {
      const response = await apiRequest("POST", "/api/recovery-logs", data);
      return response.json();
    },
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "recovery-logs"] });
      toast({
        title: "Recovery logged",
        description: log.recommendation,
      });
    },
  });

  const handleSorenessSelect = (level: number) => {
    setSelectedSoreness(level);
    createLogMutation.mutate({ userId, sorenessLevel: level });
  };

  const currentSoreness = selectedSoreness || latestLog?.sorenessLevel || 5;
  const isReadyToTrain = currentSoreness < 5;

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <h3 className="font-semibold text-foreground mb-3 flex items-center">
        <HeartPulse className="text-accent mr-2" size={18} />
        Daily Recovery Check
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            How sore do you feel? (1-10)
          </label>
          <div className="flex space-x-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleSorenessSelect(num)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  currentSoreness === num
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border border-border hover:bg-muted'
                }`}
                data-testid={`button-soreness-${num}`}
                disabled={createLogMutation.isPending}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        {currentSoreness && (
          <div className={`rounded-lg p-3 border ${
            isReadyToTrain 
              ? 'bg-accent/10 border-accent/20' 
              : 'bg-destructive/10 border-destructive/20'
          }`}>
            <div className="flex items-center space-x-2">
              {isReadyToTrain ? (
                <CheckCircle className="text-accent" size={16} />
              ) : (
                <AlertTriangle className="text-destructive" size={16} />
              )}
              <span className={`text-sm font-medium ${
                isReadyToTrain ? 'text-accent-foreground' : 'text-destructive-foreground'
              }`}>
                {isReadyToTrain 
                  ? "Great! You're ready to train hard today."
                  : "Consider active recovery or a rest day."
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
