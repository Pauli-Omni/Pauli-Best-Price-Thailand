#!/usr/bin/env node
/**
 * Production QA — assets, dialogue (10+ turns), latency, no marketing/errors.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { OSG_CANONICAL_PRODUCTION_BASE } from "./osg-canonical-production-base.mjs";

const BASE = (process.argv[2] || OSG_CANONICAL_PRODUCTION_BASE).replace(/\/$/, "");
const ORIGIN = BASE;

const MARKETING_PATTERNS = [
  /amazon\s+prime/i,
  /baumarkt\s+samstag/i,
  /prime\s+day/i,
  /trend-phrase/i,
  /culturalTrend/i,
  /save_money/i,
  /search_intro_long/i,
];

const ERROR_PATTERNS = [
  /chat gerade nicht erreichbar/i,
  /chat unavailable right now/i,
  /chat_unavailable/i,
  /origin_not_allowed/i,
  /Der Entwurf wartet noch/i,
];

const QUESTIONS = [
  { id: "greet", text: "Hallo Pauli", expectOpenAI: false },
  { id: "time", text: "Wie spät ist es?", expectOpenAI: true },
  { id: "time2", text: "Wie viel Uhr ist es?", expectOpenAI: true },
  { id: "shop_tv", text: "Ich suche einen Fernseher.", expectOpenAI: true },
  { id: "shop_boots", text: "Wo finde ich günstige Gummistiefel?", expectOpenAI: true },
  { id: "general", text: "Erzähl mir einen kurzen Witz.", expectOpenAI: true },
  { id: "price", text: "Wie viel kostet ein Smartphone ungefähr?", expectOpenAI: true },
  { id: "thai_greet", text: "สวัสดี", expectOpenAI: false },
  { id: "complaint", text: "Schreibe eine Reklamation wegen defekter Ware.", expectOpenAI: true },
  { id: "followup", text: "Was empfiehlst du für Lazada?", expectOpenAI: true },
  { id: "smalltalk", text: "Wie geht es dir heute?", expectOpenAI: true },
  { id: "en_time", text: "What time is it?", expectOpenAI: true },
];

const results = [];
let fail = 0;

function record(id, ok, detail) {
  results.push({ id, ok, detail });
  if (!ok) fail += 1;
  console.log(ok ? "PASS" : "FAIL", id, detail || "");
}

async function timedFetch(url, opts) {
  const t0 = performance.now();
  const res = await fetch(url, opts);
  const ms = Math.round(performance.now() - t0);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { res, ms, text, json };
}

async function chat(userText, lang = "de") {
  const { res, ms, text } = await timedFetch(`${BASE}/api/pauli-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
    },
    body: JSON.stringify({
      lang,
      messages: [{ role: "user", content: userText }],
    }),
  });
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, ms, json, raw: text.slice(0, 300) };
}

function loadClientClassifier() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const src = readFileSync(join(root, "assets/scripts/osg_intent_classifier.js"), "utf8");
  const sandbox = vm.createContext({ window: {} });
  sandbox.window = sandbox;
  vm.runInContext(src, sandbox, { filename: "osg_intent_classifier.js" });
  return sandbox.OSG_INTENT_CLASSIFIER.classify;
}

console.log("=== OSG Production QA ===");
console.log("BASE:", BASE);
console.log("");

// 1. Health + latency
try {
  const health = await timedFetch(`${BASE}/api/health`);
  let healthJson;
  try {
    healthJson = JSON.parse(health.text);
  } catch {
    healthJson = null;
  }
  record(
    "health",
    health.res.status === 200 && healthJson?.ok === true,
    `HTTP ${health.res.status} ${health.ms}ms`
  );
} catch (e) {
  record("health", false, String(e.message));
}

// 2. Critical assets from index.html
const indexRes = await timedFetch(`${BASE}/`);
const indexHtml = indexRes.text;
record("index_html", indexRes.res.status === 200, `${indexRes.ms}ms`);

const assetRe = /(?:src|href)=["']([^"']+\.(?:js|css))["']/gi;
const assets = new Set();
let m;
while ((m = assetRe.exec(indexHtml))) {
  let p = m[1];
  if (p.startsWith("/")) p = p.slice(1);
  if (!p.startsWith("http")) assets.add(p);
}

const criticalAssets = [
  "style.css",
  "assets/scripts/osg-index-app-main.module.js",
  "assets/scripts/osg_intent_classifier.js",
  "assets/scripts/osg_audio_registry.js",
  "assets/scripts/startup_boot_logic.js",
  "assets/scripts/draft_ownership_logic.js",
  "public/js/avatar-3d-bridge.js",
  "assets/scripts/pauli_avatar_animations.js",
];

for (const a of criticalAssets) assets.add(a);

let assetFail = 0;
for (const path of [...assets].sort()) {
  if (path.includes("osg-admin-secret") || path.includes("runtime-config")) continue;
  try {
    const url = path.startsWith("http") ? path : `${BASE}/${path.replace(/^\//, "")}`;
    const r = await timedFetch(url, { method: "HEAD" }).catch(async () => timedFetch(url));
    const ok = r.res.status === 200;
    if (!ok) {
      assetFail += 1;
      console.log("FAIL asset", path, r.res.status);
    }
  } catch (e) {
    assetFail += 1;
    console.log("FAIL asset", path, e.message);
  }
}
record("assets", assetFail === 0, `${assets.size} checked, ${assetFail} failed`);

// runtime-config expected 404 on co-host (relative /api used)
const rc = await timedFetch(`${BASE}/osg-runtime-config.js`);
record(
  "runtime_config",
  rc.res.status === 200 || rc.res.status === 404,
  rc.res.status === 404
    ? "404 OK — same-origin /api (no split config)"
    : `HTTP ${rc.res.status}`
);

// 3. Main module dialogue markers
const mainJs = await timedFetch(`${BASE}/assets/scripts/osg-index-app-main.module.js`);
const markers = [
  "osgPauliLiveDialogueOnly",
  "dynamicSpeech",
  "osgPauliHandleDraftPendingTurn",
  "osgResetComplaintLiveContext",
];
const missing = markers.filter((k) => !mainJs.text.includes(k));
record(
  "dialogue_markers",
  missing.length === 0,
  missing.length ? `missing: ${missing.join(", ")}` : "all present"
);

// 4. Intent classifier (local mirror)
const classify = loadClientClassifier();
record(
  "intent_time_de",
  classify("Wie spät ist es?").intent === "TIME_QUERY",
  classify("Wie spät ist es?").intent
);
record(
  "intent_price_de",
  classify("Wie viel kostet das?").intent === "READ_PRICE",
  classify("Wie viel kostet das?").intent
);

// 5. Live conversation — 12 questions
const latencies = [];
for (const q of QUESTIONS) {
  try {
    const hit = await chat(q.text, q.text.match(/[\u0E00-\u0E7F]/) ? "th" : q.text.match(/^[A-Za-z]/) && !q.text.match(/^(Hallo|Wie|Ich|Erzähl|Was|Schreibe)/) ? "en" : "de");
    latencies.push(hit.ms);

    if (hit.status === 403 && hit.json?.error === "origin_not_allowed") {
      record(`chat_${q.id}`, false, "403 origin_not_allowed");
      continue;
    }
    if (hit.status === 503) {
      record(`chat_${q.id}`, false, "503 chat_unavailable");
      continue;
    }
    if (hit.status !== 200) {
      record(`chat_${q.id}`, false, `HTTP ${hit.status} ${hit.raw}`);
      continue;
    }

    const reply = String(hit.json?.reply || hit.json?.packKey || "").trim();
    const local = !!hit.json?.local;
    const line = local
      ? `[local:${hit.json?.intent}]`
      : reply.slice(0, 120);

    let bad = false;
    for (const p of ERROR_PATTERNS) {
      if (p.test(reply) || p.test(hit.raw)) {
        record(`chat_${q.id}`, false, `error pattern: ${p} in ${line}`);
        bad = true;
        break;
      }
    }
    if (bad) continue;

    for (const p of MARKETING_PATTERNS) {
      if (p.test(reply)) {
        record(`chat_${q.id}`, false, `marketing in reply: ${line}`);
        bad = true;
        break;
      }
    }
    if (bad) continue;

    if (!reply && !local) {
      record(`chat_${q.id}`, false, "empty reply");
      continue;
    }

    if (q.expectOpenAI && local && hit.json?.intent === "READ_PRICE" && /uhr|spät|time/i.test(q.text)) {
      record(`chat_${q.id}`, false, "time misrouted to READ_PRICE");
      continue;
    }

    record(`chat_${q.id}`, true, `${hit.ms}ms ${line}`);
  } catch (e) {
    record(`chat_${q.id}`, false, e.message);
  }
}

const avgLat = latencies.length
  ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
  : 0;
const maxLat = latencies.length ? Math.max(...latencies) : 0;
record("latency_avg", avgLat < 15000, `avg ${avgLat}ms max ${maxLat}ms`);

// 6. STT endpoint smoke (no audio — expect 400 not 500)
try {
  const stt = await timedFetch(`${BASE}/api/stt/wake`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ audioBase64: "", mime: "audio/webm", lang: "de" }),
  });
  record(
    "stt_endpoint",
    stt.res.status === 400 || stt.res.status === 200,
    `HTTP ${stt.res.status} (not 500/403)`
  );
} catch (e) {
  record("stt_endpoint", false, e.message);
}

// 7. TTS endpoint smoke
try {
  const tts = await timedFetch(`${BASE}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ text: "Test", lang: "de" }),
  });
  record(
    "tts_endpoint",
    tts.res.status === 200 || tts.res.status === 429 || tts.res.status === 503,
    `HTTP ${tts.res.status} ${tts.ms}ms`
  );
} catch (e) {
  record("tts_endpoint", false, e.message);
}

// 8. Mobile viewport meta
record(
  "mobile_viewport",
  /width=device-width/.test(indexHtml) && /viewport-fit=cover/.test(indexHtml),
  "viewport meta present"
);

console.log("");
console.log("=== Summary ===");
console.log(`Total: ${results.length}, Failed: ${fail}`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const r of results.filter((x) => !x.ok)) {
    console.log(" -", r.id, r.detail);
  }
  process.exit(1);
}
console.log("ALL QA CHECKS PASSED");
