#!/usr/bin/env node
/**
 * Pauli Master-Stimme anhören — nur Einzige_Stimme_Paulis-Avatar.mp3
 *
 *   node scripts/pauli-hear-voice.mjs
 *
 * Schnipsel sind deaktiviert. Neue Sätze später per:
 *   node scripts/generate-pauli-voice-mp3.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MASTER_NAME = "Einzige_Stimme_Paulis-Avatar.mp3";
const MASTER_PATH = path.join(root, "public/sounds/pauli", MASTER_NAME);

function afplay(file) {
  return new Promise((resolve, reject) => {
    const p = spawn("afplay", [file], { stdio: "inherit" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("afplay " + code))));
  });
}

async function main() {
  console.log("\n=== Pauli Master-Stimme ===\n");
  if (!fs.existsSync(MASTER_PATH)) {
    console.error(`FEHLT: public/sounds/pauli/${MASTER_NAME}`);
    process.exit(1);
  }
  console.log(`▶ ${MASTER_NAME} — vollständig:`);
  console.log(`   public/sounds/pauli/${MASTER_NAME}`);
  console.log(
    "\n   Avatar-Sätze in der App: nur ElevenLabs (/api/tts). Schnipsel-Ordner th/ ist leer bis generate-pauli-voice-mp3.mjs.\n",
  );
  await afplay(MASTER_PATH);
  console.log("\n✓ Fertig.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
