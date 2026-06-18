#!/usr/bin/env node
/**
 * Generiert alle Pauli-Stimmen-MP3s aus voice-script-de.json (OpenAI TTS).
 * Vorhandene Dateien (z. B. pauliIntro.mp3) werden übersprungen.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  console.error("OPENAI_API_KEY fehlt in .env");
  process.exit(1);
}

const scriptPath = path.join(root, "public/sounds/pauli/voice-script-de.json");
const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));

function pickVoice(speechKey) {
  if (speechKey === "pauliSawadee") return "nova";
  return "onyx";
}

async function synthesize(text, voice, outFile) {
  const dir = path.dirname(outFile);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(outFile)) {
    const st = fs.statSync(outFile);
    if (st.size > 512) {
      console.log("skip (exists):", path.relative(root, outFile));
      return "skipped";
    }
  }
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice,
      input: String(text || "").slice(0, 4096),
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`${res.status} ${err.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buf);
  console.log("wrote:", path.relative(root, outFile), `(${buf.length} B)`);
  return "written";
}

let written = 0;
let skipped = 0;
let failed = 0;

for (const rec of script.recordings) {
  const outFile = path.join(root, "public/sounds/pauli", rec.file);
  try {
    const result = await synthesize(
      rec.recordText,
      pickVoice(rec.speechKey),
      outFile
    );
    if (result === "written") written += 1;
    else skipped += 1;
    await new Promise((r) => setTimeout(r, 350));
  } catch (e) {
    failed += 1;
    console.error("FAIL", rec.speechKey, "—", e.message);
  }
}

console.log(`Done: ${written} written, ${skipped} skipped, ${failed} failed`);
