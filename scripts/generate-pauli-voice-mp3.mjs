#!/usr/bin/env node
/**
 * Generiert Pauli-Stimmen-MP3s aus voice-script-de.json.
 * Reihenfolge: ElevenLabs (deine geklonte Stimme) → OpenAI TTS (Platzhalter).
 * Vorhandene Dateien werden übersprungen, außer mit --force.
 *
 *   node scripts/generate-pauli-voice-mp3.mjs
 *   node scripts/generate-pauli-voice-mp3.mjs --only=accessibility_activated,search_processing
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const openAiKey = String(process.env.OPENAI_API_KEY || "").trim();
const elevenKey = String(process.env.ELEVENLABS_API_KEY || "").trim();
const elevenVoiceId = String(process.env.ELEVENLABS_VOICE_ID || "").trim();

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlyKeys = onlyArg
  ? new Set(
      onlyArg
        .slice("--only=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  : null;
const force = args.includes("--force");

if (!openAiKey && !elevenKey) {
  console.error("OPENAI_API_KEY oder ELEVENLABS_API_KEY in .env erforderlich");
  process.exit(1);
}

const scriptPath = path.join(root, "public/sounds/pauli/voice-script-de.json");
const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));

function pickOpenAiVoice(speechKey) {
  if (speechKey === "pauliSawadee") return "nova";
  return "onyx";
}

async function synthesizeElevenLabs(text, outFile) {
  const voiceId = elevenVoiceId || "R6OIrb7V5SxlTzLEZVo";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": elevenKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: String(text || "").slice(0, 4096),
        model_id: "eleven_multilingual_v2",
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`elevenlabs ${res.status} ${err.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buf);
  return "elevenlabs";
}

async function synthesizeOpenAi(text, voice, outFile) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
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
    throw new Error(`openai ${res.status} ${err.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buf);
  return "openai";
}

async function synthesize(rec) {
  const outFile = path.join(root, "public/sounds/pauli", rec.file);
  const dir = path.dirname(outFile);
  fs.mkdirSync(dir, { recursive: true });
  if (!force && fs.existsSync(outFile)) {
    const st = fs.statSync(outFile);
    if (st.size > 512) {
      console.log("skip (exists):", path.relative(root, outFile));
      return "skipped";
    }
  }
  if (elevenKey) {
    try {
      const via = await synthesizeElevenLabs(rec.recordText, outFile);
      const buf = fs.statSync(outFile);
      console.log(
        "wrote:",
        path.relative(root, outFile),
        `(${buf.size} B, ${via})`
      );
      return "written";
    } catch (e) {
      console.warn("ElevenLabs fail, fallback OpenAI:", rec.speechKey, e.message);
    }
  }
  if (!openAiKey) throw new Error("openai_key_missing");
  const via = await synthesizeOpenAi(
    rec.recordText,
    pickOpenAiVoice(rec.speechKey),
    outFile
  );
  const buf = fs.statSync(outFile);
  console.log("wrote:", path.relative(root, outFile), `(${buf.size} B, ${via})`);
  return "written";
}

let written = 0;
let skipped = 0;
let failed = 0;

const recordings = script.recordings.filter(
  (rec) => !onlyKeys || onlyKeys.has(rec.speechKey)
);

for (const rec of recordings) {
  try {
    const result = await synthesize(rec);
    if (result === "written") written += 1;
    else skipped += 1;
    await new Promise((r) => setTimeout(r, 350));
  } catch (e) {
    failed += 1;
    console.error("FAIL", rec.speechKey, "—", e.message);
  }
}

console.log(`Done: ${written} written, ${skipped} skipped, ${failed} failed`);
