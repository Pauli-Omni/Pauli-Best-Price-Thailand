#!/usr/bin/env node
/**
 * Erzwingt: alle Pauli-MP3s stammen aus liam-voice-reference.mp3.
 * Löscht Abweichungen, erzeugt Fehlendes neu.
 *
 *   node scripts/pauli-voice-enforce-template.mjs
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(root, "public/sounds/pauli/liam-voice-reference.mp3");
const TH_DIR = path.join(root, "public/sounds/pauli/th");
const MANIFEST = path.join(root, "public/sounds/pauli/manifest.json");
const SEGMENTS_JSON = path.join(root, "public/sounds/pauli/audio-segments.json");
const TEMPLATE_COPY_KEYS = new Set(["pauliIntro", "search_intro_long"]);
const OTHER_VOICE_GLOBS = [
  path.join(root, "public/sounds/pauli-avatar-voice.mp3"),
  path.join(root, "public/sounds/pauli-avatar-voice.m4a"),
];

function md5File(fp) {
  return crypto.createHash("md5").update(fs.readFileSync(fp)).digest("hex");
}

function extractToTemp(startMs, endMs) {
  const tmp = path.join(root, ".tmp-pauli-seg-verify.mp3");
  const startSec = (startMs / 1000).toFixed(3);
  const durationSec = ((endMs - startMs) / 1000).toFixed(3);
  const r = spawnSync(
    ffmpegPath,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      TEMPLATE,
      "-ss",
      startSec,
      "-t",
      durationSec,
      "-acodec",
      "libmp3lame",
      "-q:a",
      "4",
      tmp,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(r.stderr || "ffmpeg failed");
  const h = md5File(tmp);
  try {
    fs.unlinkSync(tmp);
  } catch (_) {}
  return h;
}

function segmentForKey(speechKey) {
  const sk = String(speechKey || "").toLowerCase();
  if (TEMPLATE_COPY_KEYS.has(speechKey)) return "full";
  if (
    sk.includes("search") ||
    sk.includes("price") ||
    sk.includes("scan") ||
    sk.includes("processing") ||
    sk.includes("hero") ||
    sk.includes("booking") ||
    sk.includes("handoff")
  ) {
    return "search_action";
  }
  if (
    sk.includes("fun") ||
    sk.includes("crab") ||
    sk.includes("save") ||
    sk.includes("spruch") ||
    sk.includes("voucher") ||
    sk.includes("certificate") ||
    sk.includes("finance") ||
    sk.includes("psych") ||
    sk.includes("tourstep")
  ) {
    return "save_money";
  }
  return "welcome_short";
}

function expectedMd5(speechKey, segments) {
  if (TEMPLATE_COPY_KEYS.has(speechKey)) return md5File(TEMPLATE);
  const segName = segmentForKey(speechKey);
  const seg = segments[segName];
  if (!seg) throw new Error("segment missing: " + segName);
  return extractToTemp(seg.startMs, seg.endMs);
}

function main() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error("FEHLT Master:", TEMPLATE);
    process.exit(1);
  }

  for (const fp of OTHER_VOICE_GLOBS) {
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      console.log("DELETE legacy:", path.relative(root, fp));
    }
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const segments = JSON.parse(fs.readFileSync(SEGMENTS_JSON, "utf8")).segments;
  const allowed = new Set(manifest.files.map((k) => k + ".mp3"));
  const templateMd5 = md5File(TEMPLATE);
  const bad = [];
  const missing = [];

  if (fs.existsSync(TH_DIR)) {
    for (const name of fs.readdirSync(TH_DIR)) {
      if (!name.endsWith(".mp3")) continue;
      const fp = path.join(TH_DIR, name);
      if (!allowed.has(name)) {
        fs.unlinkSync(fp);
        console.log("DELETE orphan:", "th/" + name);
        continue;
      }
      const key = name.replace(/\.mp3$/, "");
      try {
        const exp = expectedMd5(key, segments);
        const got = md5File(fp);
        if (got !== exp) {
          bad.push(key);
          console.log("MISMATCH:", key);
        }
      } catch (e) {
        bad.push(key);
        console.log("VERIFY FAIL:", key, e.message);
      }
    }
  }

  for (const key of manifest.files) {
    const fp = path.join(TH_DIR, key + ".mp3");
    if (!fs.existsSync(fp)) missing.push(key);
  }

  console.log("\nTemplate MD5:", templateMd5);
  console.log("Manifest keys:", manifest.files.length);
  console.log("Missing:", missing.length, "Mismatch:", bad.length);

  if (missing.length || bad.length) {
    console.log("\n→ Rebuild aus liam-voice-reference.mp3 …\n");
    const r = spawnSync(process.execPath, ["scripts/pauli-voice-rebuild-all.mjs"], {
      cwd: root,
      stdio: "inherit",
    });
    process.exit(r.status || 0);
  }

  console.log("\n✓ Alle Aufnahmen entsprechen liam-voice-reference.mp3\n");
}

main();
