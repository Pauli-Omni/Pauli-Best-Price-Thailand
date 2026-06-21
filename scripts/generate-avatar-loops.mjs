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
import sharp from "sharp";

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
const VIDEO_SIZE = process.env.OPENAI_SORA_SIZE || "720x1280";
const [TARGET_W, TARGET_H] = VIDEO_SIZE.split("x").map((n) => Number(n) || 0);

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

async function prepareReferenceDataUrl(refPath) {
  if (!refPath || !fs.existsSync(refPath)) return null;
  const w = TARGET_W > 0 ? TARGET_W : 720;
  const h = TARGET_H > 0 ? TARGET_H : 1280;
  const buf = await sharp(refPath)
    .resize(w, h, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function createVideoJob(apiKey, prompt, seconds, refDataUrl) {
  const body = {
    model: process.env.OPENAI_SORA_MODEL || "sora-2",
    prompt,
    size: VIDEO_SIZE,
    seconds: String(seconds),
  };
  if (refDataUrl) {
    body.input_reference = { image_url: refDataUrl };
  }

  const res = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`sora_create_failed:${res.status}:${detail.slice(0, 400)}`);
  }
  return res.json();
}

async function pollVideo(apiKey, videoId) {
  for (let i = 0; i < MAX_POLLS; i += 1) {
    let res = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      res = await fetch(
        `https://api.openai.com/v1/videos/${encodeURIComponent(videoId)}`,
        { headers: { Authorization: "Bearer " + apiKey } },
      );
      if (res.status !== 503 && res.status !== 502) break;
      console.log(`  poll 503 — retry ${attempt + 1}/5`);
      await sleep(5000);
    }
    if (!res || !res.ok) {
      const detail = res ? await res.text() : "no response";
      throw new Error(
        `sora_poll_failed:${res ? res.status : 0}:${detail.slice(0, 300)}`,
      );
    }
    const data = await res.json();
    const st = data.status || data.state;
    if (st === "completed" || st === "succeeded") return data;
    if (st === "failed" || st === "error") {
      throw new Error(`sora_failed:${JSON.stringify(data).slice(0, 300)}`);
    }
    const progress =
      data.progress != null ? ` (${data.progress}%)` : "";
    console.log(`  poll ${i + 1}/${MAX_POLLS} — ${st || "pending"}${progress}`);
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
    console.error("Tipp: cp public/Frontseite02.png . && cp public/hinterseite.png .");
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(FLUTTER_OUT, { recursive: true });
  const prompts = readManifestPrompts();
  const frontRef = await prepareReferenceDataUrl(FRONT);
  const backRef = fs.existsSync(BACK)
    ? await prepareReferenceDataUrl(BACK)
    : frontRef;

  console.log("Sora size:", VIDEO_SIZE);
  console.log("Output:", OUT);

  for (const slot of SLOTS) {
    const mp4 = path.join(OUT, `${slot.file}.mp4`);
    if (fs.existsSync(mp4) && fs.statSync(mp4).size > 50000) {
      console.log("\n==>", slot.key, "— skip (exists)");
      try {
        fs.copyFileSync(mp4, path.join(FLUTTER_OUT, `${slot.file}.mp4`));
      } catch (_) {}
      continue;
    }

    const prompt = prompts[slot.key];
    if (!prompt) {
      console.warn("Skip — prompt missing:", slot.key);
      continue;
    }
    console.log("\n==>", slot.key);
    const ref =
      slot.key === "locked_carousel" && backRef ? backRef : frontRef;
    const job = await createVideoJob(apiKey, prompt, slot.seconds, ref);
    const id = job.id || job.video?.id;
    if (!id) throw new Error("no_video_id");
    console.log("  job:", id);
    await pollVideo(apiKey, id);
    await downloadVideo(apiKey, id, mp4);
    console.log("  saved:", mp4, `(${(fs.statSync(mp4).size / 1024 / 1024).toFixed(2)} MB)`);
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
