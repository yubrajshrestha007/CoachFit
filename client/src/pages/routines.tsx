import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Play, Copy, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import BottomNavigation from "@/components/layout/bottom-navigation";
import type { Routine } from "@shared/schema";

export default function Routines() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const { data: routines, isLoading, error } = useQuery<Routine[]>({
    queryKey: ["/api/routines"],
    enabled: !!user,
  });

  const createRoutineMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create routine");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateRoutineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Routine> }) => {
      const response = await fetch(`/api/routines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update routine");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      setEditingRoutine(null);
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/routines/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete routine");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
    },
  });

  const activateRoutineMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/routines/${id}/activate`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to activate routine");
    },
    onSuccess: () => {
      console.log("Routine activated successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/routines/active"] });
    },
  });

  const copyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = routines?.find(r => r.id === templateId);
      if (!template) throw new Error("Template not found");

      // Create the routine
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
        }),
      });
      if (!response.ok) throw new Error("Failed to copy template");
      const newRoutine = await response.json();

      // Copy workout days and exercises
      const copyResponse = await fetch(`/api/routines/${templateId}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetRoutineId: newRoutine.id }),
      });
      if (!copyResponse.ok) throw new Error("Failed to copy template content");

      return newRoutine;
    },
    onSuccess: (newRoutine) => {
      console.log("Template copied successfully, activating routine:", newRoutine.id);
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      // Automatically activate the copied routine
      setTimeout(() => {
        activateRoutineMutation.mutate(newRoutine.id);
        // Redirect to routine builder to add more content
        setTimeout(() => {
          window.location.href = `/routines/${newRoutine.id}/builder`;
        }, 500);
      }, 100);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading routines...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Failed to load routines. Please try again.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const templates = routines?.filter(r => r.isTemplate) || [];
  const userRoutines = routines?.filter(r => !r.isTemplate) || [];

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workout Routines</h1>
            <p className="text-muted-foreground">Manage your workout routines and templates</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Routine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Routine</DialogTitle>
                <DialogDescription>
                  Create a custom workout routine tailored to your goals.
                </DialogDescription>
              </DialogHeader>
              <CreateRoutineForm
                onSubmit={(data) => createRoutineMutation.mutate(data)}
                isLoading={createRoutineMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onEdit={() => setEditingRoutine(routine)}
                onDelete={() => deleteRoutineMutation.mutate(routine.id)}
                onActivate={() => copyTemplateMutation.mutate(routine.id)}
                onCopy={() => copyTemplateMutation.mutate(routine.id)}
                isActivating={copyTemplateMutation.isPending}
                isCopying={copyTemplateMutation.isPending}
              />
            ))}
          </div>
        </section>

        {/* User Routines Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Your Routines</h2>
          {userRoutines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No custom routines yet</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Routine
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onEdit={() => setEditingRoutine(routine)}
                  onDelete={() => deleteRoutineMutation.mutate(routine.id)}
                onActivate={() => activateRoutineMutation.mutate(routine.id)}
                isActivating={activateRoutineMutation.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* Edit Dialog */}
        <Dialog open={!!editingRoutine} onOpenChange={() => setEditingRoutine(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Routine</DialogTitle>
              <DialogDescription>
                Update your routine details.
              </DialogDescription>
            </DialogHeader>
            {editingRoutine && (
              <EditRoutineForm
                routine={editingRoutine}
                onSubmit={(data) => updateRoutineMutation.mutate({ id: editingRoutine.id, data })}
                onCancel={() => setEditingRoutine(null)}
                isLoading={updateRoutineMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <BottomNavigation currentPage="routines" />
    </div>
  );
}

function RoutineCard({
  routine,
  onEdit,
  onDelete,
  onActivate,
  onCopy,
  isActivating = false,
  isCopying = false
}: {
  routine: Routine;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onCopy?: () => void;
  isActivating?: boolean;
  isCopying?: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{routine.name}</CardTitle>
            <CardDescription className="mt-1">
              {routine.description || "No description"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {routine.isActive && (
              <Badge variant="default">Active</Badge>
            )}
            {routine.isTemplate && (
              <Badge variant="secondary">Template</Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onActivate} disabled={isActivating}>
                  <Play className="mr-2 h-4 w-4" />
                  {isActivating ? (routine.isTemplate ? "Creating..." : "Activating...") : (routine.isTemplate ? "Use Template" : "Activate")}
                </DropdownMenuItem>
                {onCopy && (
                  <DropdownMenuItem onClick={onCopy} disabled={isCopying}>
                    <Copy className="mr-2 h-4 w-4" />
                    {isCopying ? "Copying..." : "Copy Template"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={onActivate}
          disabled={isActivating}
          className="w-full"
          variant={routine.isTemplate ? "default" : "outline"}
        >
          <Play className="mr-2 h-4 w-4" />
          {isActivating ? (routine.isTemplate ? "Creating..." : "Activating...") : (routine.isTemplate ? "Use Template" : "Activate")}
        </Button>
        {!routine.isTemplate && (
          <Button
            onClick={() => window.location.href = `/routines/${routine.id}/builder`}
            variant="outline"
            className="w-full"
          >
            <Edit className="mr-2 h-4 w-4" />
            Build Routine
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CreateRoutineForm({
  onSubmit,
  isLoading
}: {
  onSubmit: (data: { name: string; description?: string }) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined });
    setName("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Routine Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter routine name"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your routine"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Creating..." : "Create Routine"}
        </Button>
      </div>
    </form>
  );
}

function EditRoutineForm({
  routine,
  onSubmit,
  onCancel,
  isLoading
}: {
  routine: Routine;
  onSubmit: (data: Partial<Routine>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(routine.name);
  const [description, setDescription] = useState(routine.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Routine Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter routine name"
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your routine"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? "Updating..." : "Update Routine"}
        </Button>
      </div>
    </form>
  );
}
