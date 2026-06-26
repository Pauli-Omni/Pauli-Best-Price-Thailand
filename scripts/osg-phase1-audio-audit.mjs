#!/usr/bin/env node
/**
 * OSG Digital Human Phase 1 — Audio/SpeechKey audit
 * Usage: node scripts/osg-phase1-audio-audit.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const MANIFEST = join(ROOT, "public/sounds/pauli/manifest.json");
const TH_DIR = join(ROOT, "public/sounds/pauli/th");
const INDEX_HTML = join(ROOT, "index.html");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function md5File(path) {
  const buf = readFileSync(path);
  return createHash("md5").update(buf).digest("hex");
}

function scanSpeechKeysInRepo() {
  const html = readFileSync(INDEX_HTML, "utf8");
  const keys = new Set();
  const re = /speechKey:\s*["']([a-zA-Z0-9_]+)["']/g;
  let m;
  while ((m = re.exec(html))) keys.add(m[1]);
  return keys;
}

function main() {
  const manifest = readJson(MANIFEST);
  const manifestKeys = manifest.files || [];
  const mp3Files = readdirSync(TH_DIR).filter((f) => f.endsWith(".mp3"));
  const onDisk = new Set(mp3Files.map((f) => f.replace(/\.mp3$/, "")));

  const missing = manifestKeys.filter((k) => !onDisk.has(k));
  const unusedOnDisk = [...onDisk].filter((k) => !manifestKeys.includes(k));
  const extraNotInManifest = unusedOnDisk;

  const hashMap = new Map();
  const duplicates = [];
  for (const file of mp3Files) {
    const full = join(TH_DIR, file);
    const hash = md5File(full);
    const size = statSync(full).size;
    if (hashMap.has(hash)) {
      duplicates.push({
        a: hashMap.get(hash),
        b: { file, size, hash },
      });
    } else {
      hashMap.set(hash, { file, size, hash });
    }
  }

  const repoKeys = scanSpeechKeysInRepo();
  const unreachable = [...repoKeys].filter((k) => !onDisk.has(k) && !manifestKeys.includes(k));

  const aliases = {
    pauliSawadeeTts: "pauliSawadee",
    avatarStartupSawadeeTts: "pauliSawadee",
    pauliIntroTts: "pauliIntro",
    intentAccessibilityTts: "accessibility_activated",
    intentReadPriceTts: "search_processing",
    intentFunCrabTts: "fun_crab_instinct",
  };

  const wrongMappings = [];
  for (const [alias, target] of Object.entries(aliases)) {
    if (onDisk.has(alias) && onDisk.has(target)) {
      const a = md5File(join(TH_DIR, alias + ".mp3"));
      const b = md5File(join(TH_DIR, target + ".mp3"));
      if (a !== b) wrongMappings.push({ alias, target, note: "both exist, different content" });
    }
    if (!onDisk.has(target) && repoKeys.has(alias)) {
      wrongMappings.push({ alias, target, note: "alias referenced, target missing" });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    manifestKeyCount: manifestKeys.length,
    onDiskMp3Count: mp3Files.length,
    missingFiles: missing.map((k) => ({ speechKey: k, expected: `public/sounds/pauli/th/${k}.mp3` })),
    unusedOnDisk: extraNotInManifest,
    duplicates,
    repoSpeechKeyReferences: [...repoKeys].sort(),
    unreachableKeys: unreachable.sort(),
    wrongMappings,
    summary: {
      missingCount: missing.length,
      duplicatePairCount: duplicates.length,
      unusedOnDiskCount: extraNotInManifest.length,
      unreachableCount: unreachable.length,
    },
  };

  const outPath = join(ROOT, "docs/OSG-DIGITAL-HUMAN-PHASE1-AUDIO-AUDIT.json");
  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log("Full report:", outPath);
}

main();
