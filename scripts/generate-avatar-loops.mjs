#!/usr/bin/env node
/**
 * Generiert 5 transparente Pauli-Münz-Loops via OpenAI Video (Sora).
 * Voraussetzung: OPENAI_API_KEY, Frontseite02.png + hinterseite.png im Projekt-Root.
 *
 * Usage: npm run avatar:loops
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "assets", "avatar");
const FLUTTER_OUT = path.join(ROOT, "assets", "avatar");
const MANIFEST_PATH = path.join(
  ROOT,
  "03_Datenbank_und_Preise",
  "avatar-animation-manifest.js",
);

const FRONT = path.join(ROOT, "Frontseite02.png");
const BACK = path.join(ROOT, "hinterseite.png");
const POLL_MS = 8000;
const MAX_POLLS = 180;

const SLOTS = [
  { key: "wai_greeting", file: "01-wai-greeting", seconds: "8" },
  { key: "speak", file: "02-speak-loop", seconds: "12" },
  { key: "purchase_standard", file: "03-purchase-standard", seconds: "8" },
  { key: "purchase_premium", file: "04-purchase-premium", seconds: "12" },
  { key: "locked_carousel", file: "05-locked-carousel", seconds: "12" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readManifestPrompts() {
  const src = fs.readFileSync(MANIFEST_PATH, "utf8");
  const out = Object.create(null);
  for (const slot of SLOTS) {
    const re = new RegExp(
      slot.key +
        '[\\s\\S]*?prompt:\\s*"([\\s\\S]*?)",\\s*\\n\\s*webm:',
      "m",
    );
    const m = src.match(re);
    if (m) out[slot.key] = m[1].replace(/\\"/g, '"');
  }
  return out;
}

async function createVideoJob(apiKey, prompt, seconds, refPath) {
  const form = new FormData();
  form.append("model", process.env.OPENAI_SORA_MODEL || "sora-2");
  form.append("prompt", prompt);
  form.append("size", process.env.OPENAI_SORA_SIZE || "720x720");
  form.append("seconds", seconds);
  if (refPath && fs.existsSync(refPath)) {
    const blob = new Blob([fs.readFileSync(refPath)], { type: "image/png" });
    form.append("input_reference", blob, path.basename(refPath));
  }
  const res = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`sora_create_failed:${res.status}:${detail.slice(0, 400)}`);
  }
  return res.json();
}

async function pollVideo(apiKey, videoId) {
  for (let i = 0; i < MAX_POLLS; i += 1) {
    const res = await fetch(
      `https://api.openai.com/v1/videos/${encodeURIComponent(videoId)}`,
      { headers: { Authorization: "Bearer " + apiKey } },
    );
    const data = await res.json();
    const st = data.status || data.state;
    if (st === "completed" || st === "succeeded") return data;
    if (st === "failed" || st === "error") {
      throw new Error(`sora_failed:${JSON.stringify(data).slice(0, 300)}`);
    }
    console.log(`  poll ${i + 1}/${MAX_POLLS} — ${st || "pending"}`);
    await sleep(POLL_MS);
  }
  throw new Error("sora_timeout");
}

async function downloadVideo(apiKey, videoId, dest) {
  const res = await fetch(
    `https://api.openai.com/v1/videos/${encodeURIComponent(videoId)}/content`,
    { headers: { Authorization: "Bearer " + apiKey } },
  );
  if (!res.ok) throw new Error(`download_failed:${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("OPENAI_API_KEY fehlt in .env");
    process.exit(1);
  }
  if (!fs.existsSync(FRONT)) {
    console.error("Front coin image missing:", FRONT);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(FLUTTER_OUT, { recursive: true });
  const prompts = readManifestPrompts();

  for (const slot of SLOTS) {
    const prompt = prompts[slot.key];
    if (!prompt) {
      console.warn("Skip — prompt missing:", slot.key);
      continue;
    }
    console.log("\n==>", slot.key);
    const ref =
      slot.key === "locked_carousel" && fs.existsSync(BACK) ? BACK : FRONT;
    const job = await createVideoJob(apiKey, prompt, slot.seconds, ref);
    const id = job.id || job.video?.id;
    if (!id) throw new Error("no_video_id");
    console.log("  job:", id);
    await pollVideo(apiKey, id);
    const mp4 = path.join(OUT, `${slot.file}.mp4`);
    await downloadVideo(apiKey, id, mp4);
    console.log("  saved:", mp4);
    try {
      fs.copyFileSync(mp4, path.join(FLUTTER_OUT, `${slot.file}.mp4`));
    } catch (_) {}
  }
  console.log("\nDone. Loops in public/assets/avatar/ (+ assets/avatar/ for Flutter).");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
