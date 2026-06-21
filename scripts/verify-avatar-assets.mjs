#!/usr/bin/env node
/**
 * Prüft die 5 Avatar-Loop-MP4s unter public/assets/avatar/.
 * Exit 1 wenn Dateien fehlen (Build-Gate für Store-Artefakte).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "public", "assets", "avatar");

const REQUIRED = [
  "01-wai-greeting.mp4",
  "02-speak-loop.mp4",
  "03-purchase-standard.mp4",
  "04-purchase-premium.mp4",
  "05-locked-carousel.mp4",
];

const missing = REQUIRED.filter((f) => !fs.existsSync(path.join(DIR, f)));

if (missing.length) {
  console.error("Avatar asset gate FAILED — missing in public/assets/avatar/:");
  missing.forEach((f) => console.error("  -", f));
  console.error("\nGenerate: npm run avatar:loops");
  console.error("Or copy OpenAI loops manually into public/assets/avatar/");
  process.exit(1);
}

console.log("Avatar asset gate OK — 5/5 loops present in public/assets/avatar/");
