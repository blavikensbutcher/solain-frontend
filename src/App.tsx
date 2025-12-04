import { useState, useEffect, useCallback } from "react";
import * as anchor from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import idlJson from "./idl/solain.json";
import Header from "./components/Header";
import InitializeWorkoutForm from "./InitializeWorkoutForm";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkoutList from "./WorkoutList";
import { WorkoutAccountResult } from "./types/workout.types";
import { WorkoutSummary } from "./WorkoutSummary";

const PROGRAM_ID = idlJson.address;

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function App() {
  const [provider, setProvider] = useState<anchor.AnchorProvider | null>(null);
  const [walletPubkey, setWalletPubkey] = useState<PublicKey | null>(null);
  
  const [workouts, setWorkouts] = useState<WorkoutAccountResult[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  async function connectWallet() {
    if (!(window as any).solana) {
      alert("Please install Phantom wallet!");
      return;
    }
    try {
      const resp = await (window as any).solana.connect();
      const pubkey = new PublicKey(resp.publicKey.toString());
      setWalletPubkey(pubkey);

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const wallet = (window as any).solana;
      const prov = new AnchorProvider(connection, wallet, {
        preflightCommitment: "confirmed",
      });
      setProvider(prov);
    } catch (err) {
      console.error(err);
    }
  }

  async function disconnectWallet() {
    try {
      if ((window as any).solana) {
        await (window as any).solana.disconnect();
      }
      setWalletPubkey(null);
      setProvider(null);
      setWorkouts([]);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if ((window as any).solana?.isConnected) {
      connectWallet();
    }
  }, []);

  const fetchWorkouts = useCallback(async () => {
    if (!provider || !walletPubkey) return;

    setLoadingWorkouts(true);
    try {
      const program = new anchor.Program(idlJson as anchor.Idl, provider);
      
      const allWorkouts = await program.account.workout.all([
        {
          memcmp: {
            offset: 8, 
            bytes: walletPubkey.toBase58(),
          },
        },
      ]);
      
      setWorkouts(allWorkouts as unknown as WorkoutAccountResult[]);
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
    } finally {
      setLoadingWorkouts(false);
    }
  }, [provider, walletPubkey]);

  useEffect(() => {
    if (provider && walletPubkey) {
      fetchWorkouts();
    }
  }, [provider, walletPubkey, fetchWorkouts]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        walletPubkey={walletPubkey}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
      />

      <main className="container mx-auto py-8 px-4">
        {!walletPubkey ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="rounded-full bg-primary/10 p-6">
                  <Dumbbell className="h-16 w-16 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">
                    Welcome to Solain 👋
                  </h2>
                  <p className="text-muted-foreground">
                    Connect your wallet to start tracking your workouts on-chain
                  </p>
                </div>
                {!walletPubkey && isMobile() ? (
                  <Button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      window.open(
                        `https://phantom.app/ul/browse/${url}?ref=${url}`,
                        "_blank"
                      );
                    }}
                  >
                    Open in Phantom App
                  </Button>
                ) : (
                  <Button onClick={connectWallet}>
                    Connect Phantom Wallet
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-[60%] flex flex-col gap-6">
               <InitializeWorkoutForm
                provider={provider}
                idl={idlJson as anchor.Idl}
                programId={PROGRAM_ID}
                walletPubkey={walletPubkey}
                onSuccess={fetchWorkouts}
              />
              
              <WorkoutList
                workouts={workouts}
                loading={loadingWorkouts}
                provider={provider}
                idl={idlJson as anchor.Idl}
                walletPubkey={walletPubkey}
                onUpdate={fetchWorkouts}
              />
            </div>

            <div className="w-full lg:w-[40%]">
               <div className="sticky top-6">
                  <WorkoutSummary workouts={workouts} />
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
