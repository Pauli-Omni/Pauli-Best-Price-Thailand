#!/usr/bin/env node
/**
 * P0: Reproduzierbare ElevenLabs-Einrichtung (Voice Clone + .env + Render).
 *
 * Voraussetzung: ELEVENLABS_API_KEY in .env mit Pflicht-Rechten:
 *   Text to Speech | Voices Read | Voices Write | Instant Voice Clone
 *
 * Doku: docs/ELEVENLABS_API_SETUP.md
 * Usage: node scripts/osg-elevenlabs-go-live-setup.mjs
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { OSG_CANONICAL_PRODUCTION_BASE } from "./osg-canonical-production-base.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const REF_MP3 = path.join(
  ROOT,
  "public/sounds/pauli/Einzige_Stimme_Paulis-Avatar.mp3",
);
const VOICE_NAME = "Pauli Best Price Thailand";
const SERVICE_NAME = "pauli-best-price-api";
const PROD_BASE = OSG_CANONICAL_PRODUCTION_BASE;

const REQUIRED_PERMISSIONS_DOC = [
  "Text to Speech",
  "Voices Read",
  "Voices Write",
  "Instant Voice Clone",
];

function mask(id) {
  const s = String(id || "");
  if (s.length < 8) return "(set)";
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function printPermissionGuide(missing = []) {
  console.error("\n=== ElevenLabs API-Key — erforderliche Berechtigungen ===");
  for (const p of REQUIRED_PERMISSIONS_DOC) {
    const flag = missing.length ? (missing.includes(p) ? "FEHLT" : "OK   ") : "PFLICHT";
    console.error(`  [${flag}] ${p}`);
  }
  console.error("\nDashboard: Profile → API Keys → Create/Edit Key");
  console.error("Doku: docs/ELEVENLABS_API_SETUP.md");
  console.error("Nach Key-Update: node scripts/osg-elevenlabs-go-live-setup.mjs\n");
}

function parseElevenError(data) {
  const d = data?.detail ?? data;
  if (typeof d === "string") return d;
  if (d?.message) return String(d.message);
  if (d?.status) return String(d.status);
  return JSON.stringify(d).slice(0, 200);
}

function permissionFromError(msg) {
  const m = String(msg || "");
  if (m.includes("voices_read")) return "Voices Read";
  if (m.includes("create_instant_voice_clone")) return "Instant Voice Clone";
  if (m.includes("voices_write")) return "Voices Write";
  if (m.includes("text_to_speech") || m.includes("tts")) return "Text to Speech";
  return null;
}

async function elevenFetch(apiKey, route, init = {}) {
  const res = await fetch(`https://api.elevenlabs.io/v1${route}`, {
    ...init,
    headers: {
      "xi-api-key": apiKey,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { res, data, text };
}

async function elevenFetchOk(apiKey, route, init = {}) {
  const { res, data, text } = await elevenFetch(apiKey, route, init);
  if (!res.ok) {
    const parsed = parseElevenError(data);
    const err = new Error(`ElevenLabs ${route} HTTP ${res.status}: ${parsed}`);
    err.permission = permissionFromError(parsed);
    err.status = res.status;
    throw err;
  }
  return data;
}

function writeEnvKey(key, value) {
  const v = String(value || "").trim();
  if (!v) throw new Error(`${key} leer — Abbruch`);
  let lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  let found = false;
  lines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${v}`;
    }
    return line;
  });
  if (!found) lines.push(`${key}=${v}`);
  fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n", "utf8");
}

function loadRenderApiKey() {
  const fromEnv = String(process.env.RENDER_API_KEY || "").trim();
  if (fromEnv) return fromEnv;
  const alt = path.resolve(
    ROOT,
    "../OmniSolutionsGlobal WEBSEITE/scripts/render.local.env",
  );
  if (!fs.existsSync(alt)) return "";
  for (const line of fs.readFileSync(alt, "utf8").split(/\r?\n/)) {
    const m = line.match(/^RENDER_API_KEY=(.+)$/);
    if (m) return m[1].trim();
  }
  return "";
}

async function verifyApiPermissions(apiKey) {
  const missing = new Set();
  let voices = [];

  try {
    const data = await elevenFetchOk(apiKey, "/voices");
    voices = data.voices || [];
    console.log("OK  Berechtigung: Voices Read");
  } catch (e) {
    if (e.permission) missing.add(e.permission);
    else missing.add("Voices Read");
    console.error("FAIL Berechtigung: Voices Read");
  }

  let probeVoiceId =
    voices.find((v) => String(v.name || "").toLowerCase() === VOICE_NAME.toLowerCase())
      ?.voice_id || voices[0]?.voice_id;

  if (!probeVoiceId) {
    try {
      await createVoiceClone(apiKey, { dryRunCheckOnly: false });
      const data2 = await elevenFetchOk(apiKey, "/voices");
      voices = data2.voices || [];
      probeVoiceId = findPauliVoice(voices)?.voice_id || voices[0]?.voice_id;
      console.log("OK  Berechtigung: Instant Voice Clone (+ Voices Write)");
    } catch (e) {
      if (e.permission === "Instant Voice Clone") missing.add("Instant Voice Clone");
      if (e.permission === "Voices Write") missing.add("Voices Write");
      if (!e.permission) missing.add("Instant Voice Clone");
      console.error("FAIL Berechtigung: Instant Voice Clone");
    }
  } else {
    console.log("OK  Bestehende Stimme(n) — Clone-Probe übersprungen");
  }

  if (probeVoiceId) {
    try {
      const url = `/text-to-speech/${probeVoiceId}/stream?output_format=mp3_44100_128`;
      const { res } = await elevenFetch(apiKey, url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({
          text: "Test",
          model_id: "eleven_multilingual_v2",
        }),
      });
      if (res.ok) {
        await res.arrayBuffer();
        console.log("OK  Berechtigung: Text to Speech");
      } else {
        missing.add("Text to Speech");
        console.error("FAIL Berechtigung: Text to Speech");
      }
    } catch (_) {
      missing.add("Text to Speech");
      console.error("FAIL Berechtigung: Text to Speech");
    }
  } else if (!missing.has("Instant Voice Clone")) {
    missing.add("Instant Voice Clone");
  }

  return { missing: [...missing], voices };
}

function findPauliVoice(voices) {
  return voices.find((v) => {
    const n = String(v.name || "").toLowerCase();
    return (
      n === VOICE_NAME.toLowerCase() ||
      (n.includes("pauli") && n.includes("best price"))
    );
  });
}

async function createVoiceClone(apiKey) {
  if (!fs.existsSync(REF_MP3)) {
    throw new Error(`Referenz fehlt: ${REF_MP3}`);
  }
  const buf = fs.readFileSync(REF_MP3);
  const form = new FormData();
  form.append("name", VOICE_NAME);
  form.append(
    "description",
    "Omni Solutions Global — Pauli Avatar (kanonisch: Einzige_Stimme_Paulis-Avatar.mp3)",
  );
  form.append(
    "files",
    new Blob([buf], { type: "audio/mpeg" }),
    "Einzige_Stimme_Paulis-Avatar.mp3",
  );
  const data = await elevenFetchOk(apiKey, "/voices/add", {
    method: "POST",
    body: form,
  });
  const voiceId = data.voice_id || data.voiceId;
  if (!voiceId) throw new Error("Voice Clone ohne voice_id in Antwort");
  return voiceId;
}

async function renderApi(renderKey, method, route, body) {
  const res = await fetch(`https://api.render.com/v1${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${renderKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(
      `Render ${method} ${route} HTTP ${res.status}: ${String(text).slice(0, 300)}`,
    );
  }
  return data;
}

async function findRenderService(renderKey) {
  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const url =
      `/services?limit=100` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const rows = await renderApi(renderKey, "GET", url);
    for (const row of rows) {
      const s = row?.service;
      if (s?.name === SERVICE_NAME) return s;
    }
    cursor = rows?.cursor || "";
    if (!cursor) break;
  }
  return null;
}

async function putRenderEnv(renderKey, serviceId, key, value) {
  const v = String(value || "").trim();
  if (!v) throw new Error(`Render ${key} leer`);
  await renderApi(
    renderKey,
    "PUT",
    `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
    { value: v },
  );
}

async function testTts(base, origin) {
  const res = await fetch(`${base}/api/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin || base,
    },
    body: JSON.stringify({ text: "Sawadee Krab", lang: "th-TH" }),
  });
  const buf = await res.arrayBuffer();
  return {
    status: res.status,
    contentType: res.headers.get("content-type") || "",
    bytes: buf.byteLength,
    ok: res.ok && buf.byteLength > 500,
  };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testTtsWithRetry(base, origin, attempts = 4) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      console.log(`…   /api/tts Retry ${i + 1}/${attempts} (Render-Neustart)`);
      await sleep(15000);
    }
    last = await testTts(base, origin);
    if (last.ok) return last;
  }
  return last;
}

async function main() {
  const report = {
    apiKeyRecognized: false,
    permissionsOk: false,
    voiceCloneCreated: false,
    voiceIdWritten: false,
    renderConfigured: false,
    renderNote: "",
    ttsProd: null,
  };

  const apiKey = String(process.env.ELEVENLABS_API_KEY || "").trim();
  if (!apiKey || apiKey.length < 10) {
    console.error("BLOCKED: ELEVENLABS_API_KEY fehlt in .env");
    printPermissionGuide();
    process.exit(2);
  }
  report.apiKeyRecognized = true;
  console.log("OK  ELEVENLABS_API_KEY erkannt (Wert nicht geloggt)\n");

  console.log("--- API-Berechtigungen prüfen ---");
  let voices = [];
  let voiceId = String(process.env.ELEVENLABS_VOICE_ID || "").trim();

  if (voiceId) {
    console.log(`OK  ELEVENLABS_VOICE_ID in .env (${mask(voiceId)}) — Voices Read optional`);
  } else {
    try {
      const data = await elevenFetchOk(apiKey, "/voices");
      voices = data.voices || [];
      console.log("OK  Voices Read");
    } catch (e) {
      printPermissionGuide([e.permission || "Voices Read"]);
      process.exit(3);
    }
  }

  const existing = voiceId
    ? voices.find((v) => v.voice_id === voiceId) || { voice_id: voiceId, name: "(aus .env)" }
    : findPauliVoice(voices);

  if (existing?.voice_id) {
    voiceId = existing.voice_id;
    if (existing.name !== "(aus .env)") {
      console.log(`OK  Bestehende Stimme: ${existing.name} (${mask(voiceId)})`);
    }
  } else if (voiceId) {
    console.log(`OK  Voice-ID aus .env (${mask(voiceId)})`);
  } else {
    console.log("…   Instant Voice Clone aus Einzige_Stimme_Paulis-Avatar.mp3");
    try {
      voiceId = await createVoiceClone(apiKey);
      report.voiceCloneCreated = true;
      console.log(`OK  Voice Clone erstellt (${mask(voiceId)})`);
    } catch (e) {
      const miss = e.permission ? [e.permission] : ["Instant Voice Clone"];
      printPermissionGuide(miss);
      process.exit(4);
    }
  }

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: "Sawadee Krab",
        model_id: "eleven_multilingual_v2",
      }),
    });
    const buf = await res.arrayBuffer();
    if (!res.ok || buf.byteLength < 500) {
      console.error("FAIL TTS probe HTTP", res.status, "bytes", buf.byteLength);
      printPermissionGuide(["Text to Speech"]);
      process.exit(5);
    }
    console.log("OK  Text to Speech (ElevenLabs direkt)");
    report.permissionsOk = true;
  } catch (e) {
    console.error("FAIL TTS probe", e.message || e);
    printPermissionGuide(["Text to Speech"]);
    process.exit(5);
  }

  writeEnvKey("ELEVENLABS_VOICE_ID", voiceId);
  report.voiceIdWritten = true;
  console.log("OK  ELEVENLABS_VOICE_ID in .env geschrieben");

  const renderKey = loadRenderApiKey();
  if (!renderKey) {
    report.renderNote = "RENDER_API_KEY fehlt — Render manuell oder RENDER_API_KEY in .env";
    console.warn("WARN", report.renderNote);
  } else {
    const service = await findRenderService(renderKey);
    if (!service?.id) {
      report.renderNote = `Service ${SERVICE_NAME} nicht gefunden`;
      console.warn("WARN", report.renderNote);
    } else {
      await putRenderEnv(renderKey, service.id, "ELEVENLABS_API_KEY", apiKey);
      await putRenderEnv(renderKey, service.id, "ELEVENLABS_VOICE_ID", voiceId);
      report.renderConfigured = true;
      console.log("OK  Render: ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (kein Deploy)");
      report.renderNote = "Variablen gesetzt — Neustart ~30–90 s möglich";
    }
  }

  console.log("\n--- Verifikation ---");

  let deployOk = false;
  try {
    const { spawn } = await import("child_process");
    const dc = spawn("bash", ["deploy-check.sh"], { cwd: ROOT, stdio: "inherit" });
    await new Promise((res, rej) =>
      dc.on("close", (c) => (c === 0 ? res() : rej(new Error(`exit ${c}`)))),
    );
    deployOk = true;
  } catch (e) {
    console.error("FAIL deploy-check.sh", e.message);
  }

  let renderVerifyOk = false;
  try {
    const { spawn } = await import("child_process");
    const rc = spawn("npm", ["run", "render:verify-env"], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, ELEVENLABS_API_KEY: apiKey, ELEVENLABS_VOICE_ID: voiceId },
    });
    await new Promise((res, rej) =>
      rc.on("close", (c) => (c === 0 ? res() : rej(new Error(`exit ${c}`)))),
    );
    renderVerifyOk = true;
  } catch (e) {
    console.error("FAIL render:verify-env", e.message);
  }

  try {
    const health = await fetch(`${PROD_BASE}/api/health`);
    console.log(health.ok ? "OK" : "FAIL", `/api/health → ${health.status}`);
  } catch (e) {
    console.error("FAIL /api/health", e.message);
  }

  try {
    report.ttsProd = await testTtsWithRetry(PROD_BASE, PROD_BASE);
    console.log(
      report.ttsProd.ok ? "OK" : "FAIL",
      `/api/tts (prod) → ${report.ttsProd.status}, ${report.ttsProd.bytes} bytes`,
    );
  } catch (e) {
    console.error("FAIL /api/tts (prod)", e.message);
  }

  const go =
    report.apiKeyRecognized &&
    report.permissionsOk &&
    report.voiceIdWritten &&
    deployOk &&
    renderVerifyOk &&
    report.ttsProd?.ok === true;

  console.log("\n=== Abschluss ===");
  console.log("API-Key erkannt:", report.apiKeyRecognized ? "ja" : "nein");
  console.log("Berechtigungen OK:", report.permissionsOk ? "ja" : "nein");
  console.log("Voice Clone neu:", report.voiceCloneCreated ? "ja" : "nein (bestehend)");
  console.log("Voice-ID in .env:", report.voiceIdWritten ? "ja" : "nein");
  console.log("Render konfiguriert:", report.renderConfigured ? "ja" : "nein");
  if (report.renderNote) console.log("Render-Hinweis:", report.renderNote);
  console.log(
    "TTS Prod:",
    report.ttsProd
      ? `${report.ttsProd.status} / ${report.ttsProd.bytes} bytes`
      : "nicht getestet",
  );
  console.log("GO/NO-GO:", go ? "GO" : "NO-GO");

  process.exit(go ? 0 : 1);
}

main().catch((err) => {
  if (err.permission) printPermissionGuide([err.permission]);
  console.error("FEHLER:", err.message || err);
  process.exit(1);
});
