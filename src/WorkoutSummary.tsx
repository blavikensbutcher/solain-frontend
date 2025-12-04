import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Trophy, Activity, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { WorkoutAccountResult } from "./types/workout.types";

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
      records.sort((a, b) => b.account.timestamp.toNumber() - a.account.timestamp.toNumber());
      
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

    // Сортуємо вправи: спочатку ті, що робили нещодавно
    return summaries.sort((a, b) => b.lastPerformance.date.getTime() - a.lastPerformance.date.getTime());
  };

  const summaryData = getSummary();

  if (summaryData.length === 0) {
    return null; // Не показуємо нічого, якщо даних немає
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Exercise Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaryData.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:bg-muted transition-colors"
          >
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">{item.name}</h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Last: {item.lastPerformance.sets}×{item.lastPerformance.reps}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(item.lastPerformance.date, "MMM d")}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Total: {item.totalSessions}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Lvl {item.lastPerformance.difficulty}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
