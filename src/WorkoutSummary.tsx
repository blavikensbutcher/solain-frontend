import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Activity,
  CalendarDays,
  Dumbbell,
  Clock,
  Flame,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { enUS, uk } from "date-fns/locale";
import { WorkoutAccountResult } from "./types/workout.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface WorkoutSummaryProps {
  workouts: WorkoutAccountResult[];
}

type ExerciseSummary = {
  name: string;
  lastPerformance: {
    reps: number;
    sets: number;
    difficulty: number;
    date: Date;
  };
  totalSessions: number;
};

export function WorkoutSummary({ workouts }: WorkoutSummaryProps) {
  const { t, i18n } = useTranslation();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [copiedExercise, setCopiedExercise] = useState<string | null>(null);

  const copyToClipboard = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExercise(text);
      setTimeout(() => setCopiedExercise(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getSummary = (): ExerciseSummary[] => {
    const groupedByName: Record<string, WorkoutAccountResult[]> = {};

    workouts.forEach((w) => {
      const name = w.account.name.trim();
      if (!groupedByName[name]) {
        groupedByName[name] = [];
      }
      groupedByName[name].push(w);
    });

    const summaries = Object.entries(groupedByName).map(([name, records]) => {
      records.sort(
        (a, b) =>
          b.account.timestamp.toNumber() - a.account.timestamp.toNumber()
      );

      const lastRecord = records[0];

      return {
        name: name,
        lastPerformance: {
          reps: lastRecord.account.reps,
          sets: lastRecord.account.sets,
          difficulty: lastRecord.account.difficulty,
          date: new Date(lastRecord.account.timestamp.toNumber() * 1000),
        },
        totalSessions: records.length,
      };
    });

    return summaries.sort(
      (a, b) =>
        b.lastPerformance.date.getTime() - a.lastPerformance.date.getTime()
    );
  };

  const getExerciseHistory = (exerciseName: string): WorkoutAccountResult[] => {
    return workouts
      .filter((w) => w.account.name.trim() === exerciseName)
      .sort(
        (a, b) =>
          b.account.timestamp.toNumber() - a.account.timestamp.toNumber()
      );
  };

  const summaryData = getSummary();

  if (summaryData.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t("Exercise Summary")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryData.map((item) => (
            <div
              key={item.name}
              onClick={() => setSelectedExercise(item.name)}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">{item.name}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {t("Last:")} {item.lastPerformance.sets}×
                    {item.lastPerformance.reps}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(item.lastPerformance.date, "MMM d")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {t("Total:")} {item.totalSessions}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("Lvl")} {item.lastPerformance.difficulty}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                {selectedExercise}
              </div>
              {selectedExercise && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => copyToClipboard(selectedExercise, e)}
                >
                  {copiedExercise === selectedExercise ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedExercise &&
              getExerciseHistory(selectedExercise).map((workout, idx, arr) => {
                const currentDate = new Date(
                  workout.account.timestamp.toNumber() * 1000
                );
                const showSeparator = idx > 0;
                const prevDate = showSeparator
                  ? new Date(arr[idx - 1].account.timestamp.toNumber() * 1000)
                  : null;

                const showDateSeparator =
                  showSeparator &&
                  prevDate &&
                  currentDate.toDateString() !== prevDate.toDateString();

                return (
                  <div key={idx}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-4 py-2">
                        <h4 className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {format(
                            currentDate,
                            i18n.language === "uk"
                              ? "d MMMM yyyy 'р.'"
                              : "MMM d, yyyy",
                            {
                              locale: i18n.language === "uk" ? uk : enUS,
                            }
                          )}
                        </h4>
                        <Separator className="flex-1" />
                      </div>
                    )}

                    <div className="p-4 rounded-lg border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {format(currentDate, "HH:mm")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            currentDate,
                            i18n.language === "uk"
                              ? "d MMMM yyyy 'р.'"
                              : "MMM d, yyyy",
                            {
                              locale: i18n.language === "uk" ? uk : enUS,
                            }
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-primary/70" />
                          <span>
                            {i18n.language === "uk" ? "Підходи:" : "Sets:"}{" "}
                            <span className="font-medium">
                              {workout.account.sets}
                            </span>{" "}
                            ×{" "}
                            <span className="font-medium">
                              {workout.account.reps}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary/70" />
                          <span>{workout.account.durationSec}с</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary/70" />
                          <span>
                            {t("Lvl")} {workout.account.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-primary/70" />
                          <span>
                            {workout.account.calories} {t("kcal")}
                          </span>
                        </div>

                        {workout.account.weightLifted !== null &&
                          workout.account.weightLifted !== undefined && (
                            <div className="flex items-center gap-2 col-span-2">
                              <Dumbbell className="h-4 w-4 text-primary/70 rotate-90" />
                              <span>
                                {t("Weight")}:{" "}
                                <span className="font-medium">
                                  {workout.account.weightLifted} {t("kg")}
                                </span>
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
