#!/usr/bin/env node
/**
 * Pauli-Stimme lokal anhören — ohne Deploy.
 * 1) Lokale Klon-MP3 (Sawadee)
 * 2) Cloud /api/tts mit ELEVENLABS_VOICE_ID aus .env
 *
 *   node scripts/pauli-hear-voice.mjs
 * Voraussetzung: Server läuft auf http://localhost:3000
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import dotenv from "dotenv";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });

function afplay(file) {
  return new Promise((resolve, reject) => {
    const p = spawn("afplay", [file], { stdio: "inherit" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("afplay " + code))));
  });
}

async function main() {
  const masterTemplate = path.join(root, "public/sounds/pauli/liam-voice-reference.mp3");
  const localSawadee = path.join(root, "public/sounds/pauli/th/pauliSawadee.mp3");
  const voiceId = String(process.env.ELEVENLABS_VOICE_ID || "").trim();
  const hasKey = !!String(process.env.ELEVENLABS_API_KEY || "").trim();

  console.log("\n=== Pauli Stimmen-Vorschau (lokal) ===\n");
  console.log("Master-Vorlage:", fs.existsSync(masterTemplate) ? "liam-voice-reference.mp3" : "FEHLT");
  console.log("ELEVENLABS_API_KEY:", hasKey ? "gesetzt" : "FEHLT (nur Schritt 3)");
  console.log("ELEVENLABS_VOICE_ID:", voiceId ? "gesetzt" : "FEHLT (nur Schritt 3)");
  console.log("");

  if (!fs.existsSync(masterTemplate)) {
    console.error("FEHLT: public/sounds/pauli/liam-voice-reference.mp3");
    process.exit(1);
  }

  console.log("▶ 1/3 — Deine Master-Vorlage (alle weiteren Clips/API daraus):");
  console.log("   public/sounds/pauli/liam-voice-reference.mp3");
  await afplay(masterTemplate);

  if (fs.existsSync(localSawadee)) {
    console.log("\n▶ 2/3 — Daraus geschnittene Sawadee-Zeile (lokal):");
    console.log("   public/sounds/pauli/th/pauliSawadee.mp3");
    await afplay(localSawadee);
  } else {
    console.log("\n▶ 2/3 — Sawadee-Schnipsel fehlt noch (Rebuild aus Vorlage nötig).");
  }

  if (!hasKey || !voiceId) {
    console.log(
      "\n▶ 3/3 — Cloud-Klon übersprungen (.env: ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID).",
    );
    console.log(
      "\nWenn Schritt 1 deine Vorlage ist: node scripts/pauli-voice-rebuild-all.mjs\n",
    );
    return;
  }

  console.log("\n▶ 3/3 — Cloud-Stimme (/api/tts, gleicher Klon wie ElevenLabs-Vorlage):");
  const sample =
    "Sawadee Krab. Ich bin Pauli. Wie kann ich dir heute helfen?";
  const out = path.join(root, ".tmp-pauli-voice-preview.mp3");
  try {
    const res = await fetch("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sample, lang: "de" }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("TTS fehlgeschlagen:", res.status, err.slice(0, 200));
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(out, buf);
    console.log("   Gespeichert:", path.relative(root, out), "(" + buf.length + " bytes)");
    await afplay(out);
  } catch (e) {
    console.error(
      "Server nicht erreichbar. Bitte starten:\n  node 02_Quellcode/Core_Logik/server.js",
    );
    console.error(e.message || e);
    process.exit(1);
  }

  console.log("\n✓ Fertig. Schritt 1 = deine Vorlage. Schritte 2+3 müssen gleich klingen.");
  console.log("  Alle lokalen MP3s neu aus Vorlage: node scripts/pauli-voice-rebuild-all.mjs\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
