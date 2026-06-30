#!/usr/bin/env node
/**
 * Verify pauli-best-price-api has production-critical env vars on Render
 * before relying on GitHub auto-deploy (prevents OSG_INSTALL_FP_SALT race).
 *
 * Usage: RENDER_API_KEY=… node scripts/render-verify-production-env.mjs
 *        npm run render:verify-env
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const renderEnvPath = path.resolve(
  ROOT,
  "../OmniSolutionsGlobal WEBSEITE/scripts/render.local.env",
);
const SERVICE_NAME = "pauli-best-price-api";

/** Hard production start guards in server.js */
const REQUIRED = [
  "NODE_ENV",
  "OSG_INSTALL_FP_SALT",
  "OSG_API_ALLOWED_ORIGINS",
  "OSG_CORS_ORIGINS",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
];

/** Feature-critical — server starts but capability degraded */
const RECOMMENDED = [
  "OPENAI_API_KEY",
  "INVOLVE_ASIA_API_KEY",
  "INVOLVE_ASIA_API_SECRET",
  "OSG_SMTP_HOST",
  "OSG_SMTP_USER",
  "OSG_SMTP_PASS",
];

function loadRenderApiKey() {
  if (process.env.RENDER_API_KEY) return String(process.env.RENDER_API_KEY).trim();
  if (!fs.existsSync(renderEnvPath)) return "";
  for (const line of fs.readFileSync(renderEnvPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^RENDER_API_KEY=(.+)$/);
    if (m) return m[1].trim();
  }
  return "";
}

async function api(apiKey, method, route) {
  const res = await fetch(`https://api.render.com/v1${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${route} HTTP ${res.status}: ${String(text).slice(0, 300)}`);
  }
  return data;
}

async function listServices(apiKey) {
  const out = [];
  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const url =
      `/services?limit=100` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const rows = await api(apiKey, "GET", url);
    for (const row of rows) {
      if (row?.service) out.push(row.service);
    }
    cursor = rows?.cursor || "";
    if (!cursor) break;
  }
  return out;
}

async function listEnvVars(apiKey, serviceId) {
  const out = Object.create(null);
  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const url =
      `/services/${serviceId}/env-vars?limit=100` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const rows = await api(apiKey, "GET", url);
    for (const row of rows) {
      const ev = row.envVar || row;
      if (ev?.key) out[ev.key] = String(ev.value ?? "").trim();
    }
    cursor = rows?.cursor || "";
    if (!cursor) break;
  }
  return out;
}

const apiKey = loadRenderApiKey();
if (!apiKey) {
  console.error("RENDER_API_KEY fehlt (.env, Umgebung oder render.local.env).");
  process.exit(1);
}

const services = await listServices(apiKey);
const service = services.find((s) => s.name === SERVICE_NAME);
if (!service) {
  console.error(`Service "${SERVICE_NAME}" nicht gefunden. Zuerst Blueprint oder render:deploy-api.`);
  process.exit(1);
}

console.log("Render env verify —", service.name, service.id);
console.log("URL:", service.serviceDetails?.url || "(unknown)");
console.log(
  "Kanonisch:",
  service.serviceDetails?.url || "https://pauli-best-price-api-nzbl.onrender.com",
);
console.log(
  "Legacy-Hinweis: Service omni-solutions-global nutzt pauli-best-price-api.onrender.com — nicht für Voice-P0-Tests.",
);
console.log("");

const env = await listEnvVars(apiKey, service.id);
let fail = 0;
let warn = 0;

function check(key, level) {
  const v = env[key];
  if (!v) {
    console.log(`[${level}] MISSING ${key}`);
    return level === "FAIL" ? 1 : 0;
  }
  if (key === "OSG_CORS_ORIGINS" && v.split(",").map((s) => s.trim()).includes("*")) {
    console.log(`[FAIL] ${key} contains wildcard * (production guard blocks start)`);
    return 1;
  }
  if (key === "NODE_ENV" && v !== "production") {
    console.log(`[WARN] ${key}=${v} (expected production on Render)`);
    return 0;
  }
  console.log(`[OK]   ${key} (len=${v.length})`);
  return 0;
}

for (const key of REQUIRED) fail += check(key, "FAIL");
for (const key of RECOMMENDED) warn += check(key, "WARN");

console.log("");
if (fail > 0) {
  console.error(`BLOCKED: ${fail} required variable(s) missing — auto-deploy will fail start (exit 1).`);
  console.error("Fix: npm run render:deploy-api  OR  apply render.yaml Blueprint  OR  set vars in Dashboard.");
  process.exit(1);
}
if (warn > 0) {
  console.warn(`WARNING: ${warn} recommended variable(s) missing — degraded features.`);
}
console.log("Production env preflight passed.");
