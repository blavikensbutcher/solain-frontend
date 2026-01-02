import React, { useState, useRef, useEffect, useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initializeWorkoutInstruction } from "@/lib/workoutInstructions";
import { useTranslation } from "react-i18next";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

export default function InitializeWorkoutForm(props: {
  provider: anchor.AnchorProvider | null;
  idl: any | null;
  programId: string;
  walletPubkey: PublicKey | null;
  onSuccess?: () => void;
  existingWorkouts?: string[];
}) {
  const {
    provider,
    idl,
    walletPubkey,
    onSuccess,
    existingWorkouts = [],
  } = props;
  const { t } = useTranslation();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<string>("STRENGTH");
  const [workoutName, setWorkoutName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const uniqueWorkoutNames = useMemo(() => {
    return Array.from(new Set(existingWorkouts)).sort();
  }, [existingWorkouts]);

  const filteredSuggestions = useMemo(() => {
    if (!workoutName.trim()) return uniqueWorkoutNames;
    return uniqueWorkoutNames.filter((name) =>
      name.toLowerCase().includes(workoutName.toLowerCase())
    );
  }, [workoutName, uniqueWorkoutNames]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (focusedIndex >= 0 && filteredSuggestions[focusedIndex]) {
          e.preventDefault();
          setWorkoutName(filteredSuggestions[focusedIndex]);
          setShowSuggestions(false);
          setFocusedIndex(-1);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const callInitializeWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !walletPubkey) {
      alert(t("Connect wallet first"));
      return;
    }

    setIsLoading(true);

    const formEl = e.target as HTMLFormElement;
    const name = workoutName || t("Push-ups");
    const reps = Number((formEl.elements.namedItem("reps") as any).value || 0);
    const sets = Number((formEl.elements.namedItem("sets") as any).value || 0);
    const duration_sec = Number(
      (formEl.elements.namedItem("duration_sec") as any).value || 0
    );
    const calories = Number(
      (formEl.elements.namedItem("calories") as any).value || 0
    );
    const difficulty = Number(
      (formEl.elements.namedItem("difficulty") as any).value || 1
    );
    const weight_lifted_raw = (
      formEl.elements.namedItem("weight_lifted") as any
    )?.value;
    const weight_lifted = weight_lifted_raw
      ? Number(weight_lifted_raw)
      : undefined;

    try {
      if (!idl) {
        alert("IDL not loaded");
        setIsLoading(false);
        return;
      }

      const program = new anchor.Program(idl, provider);
      setStatus(t("Submitting workout..."));

      const result = await initializeWorkoutInstruction({
        program,
        walletPubkey,
        form: {
          name,
          reps,
          sets,
          duration_sec,
          calories,
          difficulty,
          category,
          weight_lifted,
        },
      });

      setStatus(
        t("workoutCreated", {
          id: result.workoutId.toString(),
          tx: result.txSignature.substring(0, 8) + "...",
        })
      );

      formEl.reset();
      setCategory("STRENGTH");
      setWorkoutName("");
      setShowSuggestions(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Full error:", err);
      setStatus("Error: " + (err?.message || err?.toString?.()));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("Create Workout 💪")}</CardTitle>
        <CardDescription>
          {t("Add a new workout to your training program on Solana")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={callInitializeWorkout} className="space-y-4">
          <div className="space-y-2 relative">
            <Label htmlFor="name">{t("Workout Name")}</Label>
            <Input
              ref={inputRef}
              id="name"
              name="name"
              value={workoutName}
              onChange={(e) => {
                setWorkoutName(e.target.value);
                setShowSuggestions(true);
                setFocusedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={t("e.g., Push-ups")}
              autoComplete="off"
              required
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto"
              >
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {t("Recent workouts")}
                  </div>
                  {filteredSuggestions.map((name, index) => (
                    <div
                      key={name}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        index === focusedIndex
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={() => {
                        setWorkoutName(name);
                        setShowSuggestions(false);
                        setFocusedIndex(-1);
                      }}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reps">{t("Reps")}</Label>
              <Input
                id="reps"
                name="reps"
                type="number"
                defaultValue={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sets">{t("Sets")}</Label>
              <Input
                id="sets"
                name="sets"
                type="number"
                defaultValue={1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_sec">{t("Duration (seconds)")}</Label>
              <Input
                id="duration_sec"
                name="duration_sec"
                type="number"
                defaultValue={60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">{t("Calories")}</Label>
              <Input
                id="calories"
                name="calories"
                type="number"
                defaultValue={0}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">{t("Difficulty (1-10)")}</Label>
              <Input
                id="difficulty"
                name="difficulty"
                type="number"
                min={1}
                max={10}
                defaultValue={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_lifted">{t("Weight (kg)")}</Label>
              <Input
                id="weight_lifted"
                name="weight_lifted"
                type="number"
                min={0}
                step={0.5}
                placeholder={t("e.g., 60")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("Category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-background w-full">
                <SelectValue placeholder={t("Select category")} />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-background z-50">
                <SelectItem value="STRENGTH">{t("Strength")}</SelectItem>
                <SelectItem value="CARDIO">{t("Cardio")}</SelectItem>
                <SelectItem value="ENDURANCE">{t("Endurance")}</SelectItem>
                <SelectItem value="HIIT">{t("HIIT")}</SelectItem>
                <SelectItem value="FUNCTIONAL">{t("Functional")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t("Creating...") : t("Create Workout")}
          </Button>
        </form>

        {status && (
          <Alert
            className="mt-4"
            variant={status.startsWith("✅") ? "default" : "destructive"}
          >
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
