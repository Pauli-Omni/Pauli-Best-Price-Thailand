#!/usr/bin/env node
/**
 * Ensure Render web service "pauli-best-price-api" exists for pauli-bestpreis-Thailand,
 * sync env from local .env + render.yaml defaults, trigger deploy.
 *
 * Requires RENDER_API_KEY in OmniSolutionsGlobal WEBSEITE/scripts/render.local.env
 * Usage: node scripts/render-deploy-pauli-api.mjs
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
const pauliEnvPath = path.join(ROOT, ".env");

const SERVICE_NAME = "pauli-best-price-api";
const REPO = "https://github.com/Pauli-Omni/pauli-bestpreis-Thailand";
const BRANCH = "main";

const STATIC_ENV = {
  NODE_VERSION: "20",
  NODE_ENV: "production",
  PORT: "3000",
  OSG_CORS_ORIGINS:
    "https://omnisolutionsglobal.com,https://www.omnisolutionsglobal.com",
  OSG_API_ALLOWED_ORIGINS:
    "https://omnisolutionsglobal.com,https://www.omnisolutionsglobal.com",
  DISABLE_HTTPS: "1",
  OSG_PUBLIC_ORIGIN: "https://omnisolutionsglobal.com",
  OSG_API_PUBLIC_ORIGIN: "https://api.omnisolutionsglobal.com",
  OPENAI_MODEL: "gpt-4o-mini",
  OPENAI_VISION_MODEL: "gpt-4o-mini",
  OSG_RL_TTS_MAX: "50",
  OSG_RL_STT_MAX: "60",
  OSG_RL_CLIP_MAX: "30",
  OSG_RL_PRICES_MAX: "180",
  OSG_AI_DAILY_MAX: "220",
  OSG_SUPPORT_EMAIL: "support@omnisolutionsglobal.com",
  OSG_SUPPORT_TICKET_START: "10001",
  OSG_INFO_EMAIL: "info@omnisolutionsglobal.com",
  OSG_SMTP_PORT: "587",
  OSG_IMAP_PORT: "993",
  OSG_RL_ECHO_PROTOCOL_MAX: "120",
  INVOLVE_ASIA_AFFILIATE_ID: "1085689",
  OSG_AFFILIATE_PUBLISHER: "Omni Solutions Global",
  INVOLVE_ASIA_OFFER_LOTUS_TH: "4760",
  OSG_RL_SUPPORT_TICKET_MAX: "24",
};

const SECRET_KEYS = [
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "OPENAI_API_KEY",
  "OSG_SMTP_HOST",
  "OSG_SMTP_USER",
  "OSG_SMTP_PASS",
  "OSG_SMTP_FROM",
  "OSG_IMAP_HOST",
  "INVOLVE_ASIA_API_KEY",
  "INVOLVE_ASIA_API_SECRET",
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

function parseEnvFile(filePath) {
  const out = Object.create(null);
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

const apiKey = loadRenderApiKey();
if (!apiKey) {
  console.error("RENDER_API_KEY fehlt (render.local.env oder Umgebung).");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function api(method, route, body) {
  const res = await fetch(`https://api.render.com/v1${route}`, {
    method,
    headers,
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
    const msg =
      typeof data === "string"
        ? data.slice(0, 500)
        : JSON.stringify(data).slice(0, 500);
    throw new Error(`${method} ${route} HTTP ${res.status}: ${msg}`);
  }
  return data;
}

async function listServices() {
  const out = [];
  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const url =
      `/services?limit=100` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const rows = await api("GET", url);
    for (const row of rows) {
      if (row?.service) out.push(row.service);
    }
    cursor = rows?.cursor || "";
    if (!cursor) break;
  }
  return out;
}

async function putEnv(serviceId, key, value) {
  const v = String(value ?? "").trim();
  if (!v) {
    console.log(`  skip ${key} (leer)`);
    return;
  }
  await api(
    "PUT",
    `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
    { value: v },
  );
  console.log(`  set ${key} (len=${v.length})`);
}

async function ensureService(ownerId) {
  const services = await listServices();
  let service = services.find((s) => s.name === SERVICE_NAME);
  if (service) {
    console.log(
      "Service existiert:",
      service.name,
      service.id,
      service.serviceDetails?.url || "",
    );
    return service;
  }

  console.log("Service fehlt — lege an:", SERVICE_NAME);
  let created;
  try {
    created = await api("POST", "/services", {
      type: "web_service",
      name: SERVICE_NAME,
      ownerId,
      repo: REPO,
      branch: BRANCH,
      rootDir: ".",
      autoDeploy: "yes",
      serviceDetails: {
        env: "node",
        envSpecificDetails: {
          buildCommand: "npm ci --omit=dev",
          startCommand: "node 02_Quellcode/Core_Logik/server.js",
        },
        healthCheckPath: "/api/health",
        plan: "free",
        region: "frankfurt",
      },
    });
  } catch (err) {
    const msg = String(err?.message || err);
    if (/unfetchable|invalid or unfetchable/i.test(msg)) {
      console.error("\nRender kann das GitHub-Repo noch nicht lesen.");
      console.error("Ursache: pauli-bestpreis-Thailand ist nicht an Render angebunden.");
      console.error("\nEinmalig im Browser (ca. 2 Minuten):");
      console.error("1) https://github.com/settings/installations → Render → Configure");
      console.error("   Repository „pauli-bestpreis-Thailand“ freigeben.");
      console.error("2) https://dashboard.render.com/blueprint/new");
      console.error(`   Repo: ${REPO} · Branch ${BRANCH} · Blueprint: render.yaml`);
      console.error("3) Secrets eintragen (sync:false): OPENAI, ELEVENLABS, INVOLVE_ASIA_*");
      console.error("4) Erneut: npm run render:deploy-api");
      console.error("5) Prüfen: npm run render:go-live-check");
      process.exit(2);
    }
    throw err;
  }
  service = created.service || created;
  console.log(
    "Service erstellt:",
    service.name,
    service.id,
    service.serviceDetails?.url || "",
  );
  return service;
}

async function resolveOwnerId() {
  const services = await listServices();
  for (const s of services) {
    const oid = s.ownerId || s.owner?.id;
    if (oid) return oid;
  }
  const owners = await api("GET", "/owners?limit=20");
  const owner = (Array.isArray(owners) ? owners[0] : null)?.owner || owners[0];
  return owner?.id || owner?.ownerId || "";
}

async function main() {
  const ownerId = await resolveOwnerId();
  if (!ownerId) throw new Error("Kein Render-Workspace gefunden.");

  const service = await ensureService(ownerId);
  const localEnv = { ...parseEnvFile(pauliEnvPath), ...process.env };

  console.log("Env vars sync …");
  for (const [key, value] of Object.entries(STATIC_ENV)) {
    await putEnv(service.id, key, value);
  }
  for (const key of SECRET_KEYS) {
    await putEnv(service.id, key, localEnv[key]);
  }

  if (
    String(localEnv.INVOLVE_ASIA_API_KEY || "").trim() === "general" ||
    !String(localEnv.INVOLVE_ASIA_API_SECRET || "").trim()
  ) {
    console.warn(
      "[warn] INVOLVE_ASIA credentials look invalid locally — set real key/secret in Render Dashboard.",
    );
  }
  if (!String(localEnv.OSG_SMTP_HOST || "").trim()) {
    console.warn(
      "[warn] OSG_SMTP_* missing locally — set mail.privateemail.com credentials on Render for support mail.",
    );
  }

  if (!localEnv.OSG_INSTALL_FP_SALT) {
    await api(
      "PUT",
      `/services/${service.id}/env-vars/${encodeURIComponent("OSG_INSTALL_FP_SALT")}`,
      { generateValue: true },
    );
    console.log("  set OSG_INSTALL_FP_SALT (generated)");
  } else {
    await putEnv(service.id, "OSG_INSTALL_FP_SALT", localEnv.OSG_INSTALL_FP_SALT);
  }

  console.log("Deploy auslösen …");
  const dep = await api("POST", `/services/${service.id}/deploys`, {
    clearCache: "do_not_clear",
  });
  const deployId = dep?.id || dep?.deploy?.id || "ok";
  console.log("Deploy gestartet:", deployId);
  console.log(
    "Health:",
    `${service.serviceDetails?.url || `https://${SERVICE_NAME}.onrender.com`}/api/health`,
  );
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
