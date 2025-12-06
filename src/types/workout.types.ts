import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export interface WorkoutListProps {
  workouts: WorkoutAccountResult[];
  loading: boolean;
  provider: anchor.AnchorProvider | null;
  idl: anchor.Idl | null;
  walletPubkey: PublicKey | null;
  onUpdate: () => void;
}


export interface WorkoutFormState {
  name: string;
  reps: number;
  sets: number;
  duration_sec: number;
  calories: number;
  difficulty: number;
  category: string;
  weight_lifted?: number;
}

export interface ProgramConfig {
  admin: PublicKey;
  nextWorkoutId: anchor.BN; // u64 -> BN 
  totalWorkouts: anchor.BN; // u64 -> BN
  paused: boolean;
  bump: number;
}


export interface WorkoutAccount {
  workoutId: anchor.BN;      // u64 -> BN
  workoutAuthor: PublicKey;
  name: string;
  timestamp: anchor.BN;      // i64 -> BN 
  reps: number;              // u16
  sets: number;              // u8
  durationSec: number;       // u32 -> duration_sec стає durationSec
  calories: number;          // u16
  difficulty: number;        // u8
  category: string;
  weightLifted: number;
  bump: number;
}

export interface WorkoutAccountResult {
  publicKey: PublicKey;
  account: WorkoutAccount;
}
