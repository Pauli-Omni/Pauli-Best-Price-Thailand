#!/usr/bin/env node
/**
 * Pauli Avatar-Stimme — Rebuild aus MP3-Vorlage (lokal, ohne Cloud-TTS).
 * Extrahiert Segmente aus liam-voice-reference.mp3, ersetzt falsche MP3s, löscht Orphans.
 *
 *   node scripts/pauli-voice-rebuild-all.mjs
 *   node scripts/pauli-voice-rebuild-all.mjs --dry-run
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import vm from "vm";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvMap(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const dryRun = process.argv.includes("--dry-run");

const TEMPLATE_PATH = path.join(root, "public/sounds/pauli/liam-voice-reference.mp3");
const TH_DIR = path.join(root, "public/sounds/pauli/th");
const VOICE_SCRIPT = path.join(root, "public/sounds/pauli/voice-script-de.json");
const MANIFEST = path.join(root, "public/sounds/pauli/manifest.json");
const SEGMENTS_JSON = path.join(root, "public/sounds/pauli/audio-segments.json");
const AUDIT_OUT = path.join(root, "public/sounds/pauli/voice-audit.json");

const TEMPLATE_COPY_KEYS = new Set(["pauliIntro", "search_intro_long"]);

function md5File(fp) {
  return crypto.createHash("md5").update(fs.readFileSync(fp)).digest("hex");
}

function loadDeLocale() {
  const src = fs.readFileSync(path.join(root, "i18n-locales.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox);
  return sandbox.window.OSG_LOCALES?.de || {};
}

function collectDeSpeech(map, node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectDeSpeech(map, item));
    return;
  }
  if (node.de) collectDeSpeech(map, node.de);
  if (node.speechKey && node.tts && typeof node.tts === "string") {
    map[node.speechKey] = node.tts;
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") collectDeSpeech(map, v);
  }
}

function loadPsychDeTts() {
  const src = fs.readFileSync(
    path.join(root, "assets/scripts/psychology_prompts.js"),
    "utf8"
  );
  const sandbox = { window: {}, globalThis: {} };
  sandbox.window = sandbox.globalThis;
  vm.runInNewContext(src, sandbox);
  const PSY = sandbox.window.OSG_PSYCHOLOGY_PROMPTS;
  const map = {};
  if (!PSY) return map;
  collectDeSpeech(map, PSY.MODULES);
  collectDeSpeech(map, PSY.NO_PRESSURE);
  collectDeSpeech(map, PSY.EMPATHY_CHAINS);
  collectDeSpeech(map, PSY.RELATIONSHIP_BRIDGE);
  collectDeSpeech(map, PSY.VERLIEBT_CHAIN);
  return map;
}

function normalizeRecordText(text, speechKey) {
  let t = String(text || "").trim();
  if (!t) return "";
  t = t.replace(/\{NAME\}/g, "Max");
  t = t.replace(/\{KW\}/g, "");
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/\s+/g, " ").trim();
  if (speechKey === "pauliSawadee" || speechKey === "avatarStartupSawadeeTts") {
    return "สวัสดีครับ";
  }
  return t;
}

function buildCatalog() {
  const de = loadDeLocale();
  const psych = loadPsychDeTts();
  const script = JSON.parse(fs.readFileSync(VOICE_SCRIPT, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const byKey = new Map();

  for (const rec of script.recordings) {
    byKey.set(rec.speechKey, {
      speechKey: rec.speechKey,
      file: rec.file || `th/${rec.speechKey}.mp3`,
      recordText: normalizeRecordText(rec.recordText, rec.speechKey),
      source: "voice-script",
    });
  }

  for (const key of manifest.files) {
    if (byKey.has(key)) continue;
    const fromPsych = psych[key];
    const fromDe = de[key];
    const text = normalizeRecordText(fromPsych || fromDe || "", key);
    byKey.set(key, {
      speechKey: key,
      file: `th/${key}.mp3`,
      recordText: text,
      source: fromPsych ? "psychology-de" : fromDe ? "i18n-de" : "missing-text",
    });
  }

  return [...byKey.values()];
}

function loadSegments() {
  const cfg = JSON.parse(fs.readFileSync(SEGMENTS_JSON, "utf8"));
  return cfg.segments || {};
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
  if (
    sk.includes("sawadee") ||
    sk.includes("greet") ||
    sk.includes("intro") ||
    sk.includes("accessibility") ||
    sk.includes("tourintro") ||
    sk.includes("tourdone") ||
    sk.includes("agegate")
  ) {
    return "welcome_short";
  }
  return "welcome_short";
}

function extractSegment(input, output, startMs, endMs) {
  if (!ffmpegPath) throw new Error("ffmpeg-static nicht verfügbar");
  const startSec = (startMs / 1000).toFixed(3);
  const durationSec = ((endMs - startMs) / 1000).toFixed(3);
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    input,
    "-ss",
    startSec,
    "-t",
    durationSec,
    "-acodec",
    "libmp3lame",
    "-q:a",
    "4",
    output,
  ];
  const r = spawnSync(ffmpegPath, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(r.stderr || "ffmpeg segment failed");
  }
  return fs.statSync(output).size;
}

function copyTemplate(outFile) {
  if (dryRun) return fs.statSync(TEMPLATE_PATH).size;
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.copyFileSync(TEMPLATE_PATH, outFile);
  return fs.statSync(outFile).size;
}

async function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error("FEHLT: public/sounds/pauli/liam-voice-reference.mp3");
    process.exit(1);
  }

  const templateMd5 = md5File(TEMPLATE_PATH);
  const catalog = buildCatalog();
  const segments = loadSegments();
  const audit = {
    generatedAt: new Date().toISOString(),
    mode: "local-template-segments",
    templateMd5,
    templatePath: "public/sounds/pauli/liam-voice-reference.mp3",
    dryRun,
    items: [],
    deleted: [],
    skipped: [],
    errors: [],
  };

  console.log("Template MD5:", templateMd5);
  console.log("Catalog entries:", catalog.length);

  const allowed = new Set();

  for (const rec of catalog) {
    const outFile = path.join(root, "public/sounds/pauli", rec.file);
    const rel = path.relative(root, outFile);
    const item = {
      speechKey: rec.speechKey,
      file: rel,
      source: rec.source,
      status: "pending",
    };
    audit.items.push(item);
    allowed.add(`${rec.speechKey}.mp3`);

    try {
      let bytes = 0;
      if (TEMPLATE_COPY_KEYS.has(rec.speechKey)) {
        bytes = copyTemplate(outFile);
        item.status = "template_copy";
        item.via = "user-template-full";
      } else {
        const segName = segmentForKey(rec.speechKey);
        const seg = segments[segName];
        if (!seg) throw new Error(`segment missing: ${segName}`);
        if (!dryRun) {
          fs.mkdirSync(path.dirname(outFile), { recursive: true });
          bytes = extractSegment(
            TEMPLATE_PATH,
            outFile,
            seg.startMs,
            seg.endMs
          );
        } else {
          bytes = 0;
        }
        item.status = "template_segment";
        item.via = segName;
        item.segmentMs = `${seg.startMs}-${seg.endMs}`;
      }
      item.bytes = bytes;
      console.log("OK", rec.speechKey, item.via || item.status, `(${bytes} B)`);
    } catch (e) {
      item.status = "error";
      item.error = e.message;
      audit.errors.push({ speechKey: rec.speechKey, error: e.message });
      console.error("FAIL", rec.speechKey, e.message);
    }
  }

  const flutterOut = path.join(root, "assets/audio/search_intro_long.mp3");
  if (!dryRun) {
    fs.mkdirSync(path.dirname(flutterOut), { recursive: true });
    fs.copyFileSync(TEMPLATE_PATH, flutterOut);
    fs.copyFileSync(TEMPLATE_PATH, path.join(TH_DIR, "search_intro_long.mp3"));
    fs.copyFileSync(TEMPLATE_PATH, path.join(TH_DIR, "pauliIntro.mp3"));
  }

  if (fs.existsSync(TH_DIR)) {
    for (const name of fs.readdirSync(TH_DIR)) {
      if (!name.endsWith(".mp3")) continue;
      const delPath = path.join(TH_DIR, name);
      if (name.endsWith("-whisper.mp3")) {
        if (!dryRun) fs.unlinkSync(delPath);
        audit.deleted.push(`th/${name}`);
        console.log("DELETE whisper:", name);
        continue;
      }
      if (!allowed.has(name)) {
        if (!dryRun) fs.unlinkSync(delPath);
        audit.deleted.push(`th/${name}`);
        console.log("DELETE orphan:", name);
        continue;
      }
      const h = md5File(delPath);
      if (
        (name === "pauliIntro.mp3" || name === "search_intro_long.mp3") &&
        h !== templateMd5 &&
        !dryRun
      ) {
        fs.copyFileSync(TEMPLATE_PATH, delPath);
        console.log("RE-COPY template:", name);
      }
    }
  }

  if (!dryRun) {
    const script = JSON.parse(fs.readFileSync(VOICE_SCRIPT, "utf8"));
    const statusByKey = Object.fromEntries(
      audit.items.map((i) => [i.speechKey, i.status])
    );
    script.recordings = script.recordings.map((rec) => ({
      ...rec,
      status: statusByKey[rec.speechKey] || "local_template",
    }));
    fs.writeFileSync(VOICE_SCRIPT, JSON.stringify(script, null, 2) + "\n");
    fs.writeFileSync(AUDIT_OUT, JSON.stringify(audit, null, 2) + "\n");
  }

  console.log("\n--- Summary ---");
  console.log(
    "OK:",
    audit.items.filter((i) => i.status.startsWith("template")).length
  );
  console.log("Errors:", audit.errors.length);
  console.log("Deleted:", audit.deleted.length);
  if (!dryRun) console.log("Audit:", path.relative(root, AUDIT_OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
