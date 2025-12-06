import { useState, useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dumbbell,
  Clock,
  Flame,
  TrendingUp,
  Pencil,
  Trash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { EditWorkoutDialog } from "./components/EditWorkoutDialog";
import {
  WorkoutListProps,
  WorkoutFormState,
  WorkoutAccountResult,
} from "./types/workout.types";
import {
  updateWorkoutInstruction,
  deleteWorkoutInstruction,
} from "@/lib/workoutInstructions";

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

export default function WorkoutList({
  workouts,
  loading,
  provider,
  idl,
  walletPubkey,
  onUpdate,
}: WorkoutListProps) {
  const { t } = useTranslation();
  const [editingWorkout, setEditingWorkout] =
    useState<WorkoutAccountResult | null>(null);
  const [form, setForm] = useState<WorkoutFormState>({
    name: "",
    reps: 0,
    sets: 0,
    duration_sec: 0,
    calories: 0,
    difficulty: 1,
    category: "",
    weight_lifted: undefined,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] =
    useState<WorkoutAccountResult | null>(null);

  const groupedWorkouts = useMemo(() => {
    const groups: Record<string, WorkoutAccountResult[]> = {};
    const order: string[] = [];

    workouts.forEach((workout) => {
      const ts = workout.account.timestamp
        ? workout.account.timestamp.toNumber() * 1000
        : Date.now();

      const date = new Date(ts);

      let groupTitle = date.toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (isToday(date)) {
        groupTitle = t("Today");
      } else if (isYesterday(date)) {
        groupTitle = t("Yesterday");
      }

      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
        order.push(groupTitle);
      }
      groups[groupTitle].push(workout);
    });

    return order.map((title) => ({
      title,
      items: groups[title],
    }));
  }, [workouts, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "name" || name === "category" ? value : Number(value),
    }));
  };

  const openEditDialog = (workout: WorkoutAccountResult) => {
    setEditingWorkout(workout);
    setForm({
      name: workout.account.name,
      reps: workout.account.reps,
      sets: workout.account.sets,
      duration_sec: workout.account.durationSec,
      calories: workout.account.calories,
      difficulty: workout.account.difficulty,
      category: workout.account.category,
      weight_lifted: workout.account.weightLifted || undefined,
    });
  };

  const closeEditDialog = () => {
    setEditingWorkout(null);
  };

  const updateWorkout = async () => {
    if (!provider || !idl || !walletPubkey || !editingWorkout) return;
    try {
      const program = new anchor.Program(idl, provider);
      await updateWorkoutInstruction({
        program,
        walletPubkey,
        workoutPublicKey: editingWorkout.publicKey,
        workoutId: editingWorkout.account.workoutId,
        form,
      });
      closeEditDialog();
      if (onUpdate) onUpdate();
    } catch (e) {
      alert("Failed to update workout: " + e);
    }
  };

  const deleteWorkout = async () => {
    if (!provider || !idl || !walletPubkey || !workoutToDelete) return;
    try {
      const program = new anchor.Program(idl, provider);
      await deleteWorkoutInstruction({
        program,
        walletPubkey,
        workoutPublicKey: workoutToDelete.publicKey,
        workoutId: workoutToDelete.account.workoutId,
      });
      setShowDeleteConfirm(false);
      setWorkoutToDelete(null);
      if (onUpdate) onUpdate();
    } catch (e) {
      alert("Failed to delete workout: " + e);
    }
  };

  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
      STRENGTH:
        "bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400",
      CARDIO: "bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-400",
      ENDURANCE:
        "bg-orange-500/20 border-orange-500/30 text-orange-700 dark:text-orange-400",
      HIIT: "bg-pink-500/20 border-pink-500/30 text-pink-700 dark:text-pink-400",
      FUNCTIONAL:
        "bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-400",
    };
    return (
      styles[category.toUpperCase()] ||
      "bg-gray-500/20 border-gray-500/30 text-gray-700 dark:text-gray-400"
    );
  };

  return (
    <Card className="border-none shadow-none bg-transparent h-full flex flex-col">
      <CardHeader className="px-0 pt-0 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl">{t("Your Workouts")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onUpdate}
            className="h-8"
          >
            {t("Refresh")}
          </Button>
        </div>
      </CardHeader>

      <div className="px-0 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
        <CardContent className="px-0 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                {t("Fetching data...")}
              </p>
            </div>
          ) : workouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center border border-dashed rounded-xl bg-background/50">
              <div className="rounded-full bg-muted p-4">
                <Dumbbell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{t("No workouts found")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("Create your first workout to get started")}
                </p>
              </div>
            </div>
          ) : (
            groupedWorkouts.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                <div className="flex items-center gap-4 pt-2 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {group.title}
                  </h4>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-3">
                  {group.items.map((workout, idx) => (
                    <div
                      key={idx}
                      className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 space-y-3 sm:space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg leading-none tracking-tight">
                              {workout.account.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`w-fit text-[10px] sm:text-xs px-2 py-0.5 border ${getCategoryStyle(
                                workout.account.category
                              )}`}
                            >
                              {t(
                                workout.account.category.charAt(0) +
                                  workout.account.category.slice(1).toLowerCase()
                              )}
                            </Badge>
                          </div>

                          {/* МОБІЛЬНІ КНОПКИ - ПРОСТІ ТА НАДІЙНІ */}
                          <div className="sm:hidden flex gap-1 pt-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50"
                              onClick={() => openEditDialog(workout)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setWorkoutToDelete(workout);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground pt-1 sm:pt-2">
                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            <Dumbbell className="h-3.5 w-3.5 text-primary/70" />
                            <span>
                              {t("Sets")}:{" "}
                              <span className="font-medium text-foreground">
                                {workout.account.sets}
                              </span>{" "}
                              ×{" "}
                              <span className="font-medium text-foreground">
                                {workout.account.reps}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            <span>{workout.account.durationSec}с</span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            <TrendingUp className="h-3.5 w-3.5 text-primary/70" />
                            <span>
                              {t("Lvl")} {workout.account.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            <Flame className="h-3.5 w-3.5 text-primary/70" />
                            <span>
                              {workout.account.calories} {t("kcal")}
                            </span>
                          </div>

                          {workout.account.weightLifted !== null &&
                            workout.account.weightLifted !== undefined && (
                              <div className="flex items-center gap-1.5 min-w-[80px]">
                                <Dumbbell className="h-3.5 w-3.5 text-primary/70 rotate-90" />
                                <span>
                                  {t("Weight")}:{" "}
                                  <span className="font-medium text-foreground">
                                    {workout.account.weightLifted} {t("kg")}
                                  </span>
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* ДЕСКТОПНІ КНОПКИ */}
                      <div className="hidden sm:flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(workout)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setWorkoutToDelete(workout);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <EditWorkoutDialog
            open={!!editingWorkout}
            onOpenChange={(open) => !open && closeEditDialog()}
            form={form}
            onChange={handleInputChange}
            onSave={updateWorkout}
            onCancel={closeEditDialog}
          />

          <ConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title={t("Confirm Deletion")}
            description={t("This action cannot be undone.")}
            onConfirm={deleteWorkout}
            confirmText={t("Delete")}
            cancelText={t("Cancel")}
          >
            <p>
              {t("Are you sure you want to delete the workout")} "
              {workoutToDelete?.account.name}"?
            </p>
          </ConfirmDialog>
        </CardContent>
      </div>
    </Card>
  );
}
