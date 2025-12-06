import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export async function initializeConfig(
  program: anchor.Program,
  walletPubkey: PublicKey
) {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  try {

    const configAccount = await program.account.programConfig.fetch(configPda);
    console.log("Config already initialized:", configAccount);
    return configPda;
  } catch (err) {

    console.log("Initializing config...");
    
    const tx = await program.methods
      .initialize()
      .accounts({
        config: configPda,
        authority: walletPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Config initialized. TX:", tx);
    return configPda;
  }
}
