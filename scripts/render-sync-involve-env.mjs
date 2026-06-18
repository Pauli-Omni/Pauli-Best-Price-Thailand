#!/usr/bin/env node
/**
 * Sync Involve Asia env vars from local .env → Render (pauli-best-price-api) + redeploy.
 * Requires RENDER_API_KEY in OmniSolutionsGlobal WEBSEITE/scripts/render.local.env
 * Usage: node scripts/render-sync-involve-env.mjs
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const renderEnvPath = path.resolve(
  __dirname,
  "../../OmniSolutionsGlobal WEBSEITE/scripts/render.local.env",
);

function loadRenderApiKey() {
  if (process.env.RENDER_API_KEY) return String(process.env.RENDER_API_KEY).trim();
  if (!fs.existsSync(renderEnvPath)) return "";
  for (const line of fs.readFileSync(renderEnvPath, "utf8").split("\n")) {
    const m = line.match(/^RENDER_API_KEY=(.+)$/);
    if (m) return m[1].trim();
  }
  return "";
}

const SERVICE_NAME = "pauli-best-price-api";
const ENV_KEYS = [
  "INVOLVE_ASIA_API_KEY",
  "INVOLVE_ASIA_API_SECRET",
  "INVOLVE_ASIA_AFFILIATE_ID",
  "OSG_AFFILIATE_PUBLISHER",
  "INVOLVE_ASIA_OFFER_LOTUS_TH",
];

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

async function listServices() {
  const out = [];
  let cursor = "";
  for (let page = 0; page < 10; page++) {
    const url =
      `https://api.render.com/v1/services?limit=100` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`services list HTTP ${res.status}`);
    const rows = await res.json();
    for (const row of rows) {
      if (row?.service) out.push(row.service);
    }
    cursor = rows?.cursor || "";
    if (!cursor) break;
  }
  return out;
}

async function upsertEnv(serviceId, key, value) {
  const listRes = await fetch(
    `https://api.render.com/v1/services/${serviceId}/env-vars?limit=100`,
    { headers },
  );
  if (!listRes.ok) throw new Error(`env list HTTP ${listRes.status}`);
  const rows = await listRes.json();
  const cur = rows.find((r) => r?.envVar?.key === key)?.envVar;
  if (cur?.value === value) {
    console.log(`  unchanged ${key}`);
    return;
  }
  if (cur?.id) {
    const putRes = await fetch(
      `https://api.render.com/v1/services/${serviceId}/env-vars/${cur.id}`,
      { method: "PUT", headers, body: JSON.stringify({ value }) },
    );
    if (!putRes.ok) throw new Error(`put ${key} HTTP ${putRes.status}`);
    console.log(`  updated ${key}`);
    return;
  }
  const postRes = await fetch(
    `https://api.render.com/v1/services/${serviceId}/env-vars`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ envVar: { key, value } }),
    },
  );
  if (!postRes.ok) throw new Error(`post ${key} HTTP ${postRes.status}`);
  console.log(`  created ${key}`);
}

const services = await listServices();
const service = services.find((s) => s.name === SERVICE_NAME);
if (!service) {
  console.error(`Service "${SERVICE_NAME}" nicht gefunden. Verfügbar:`);
  for (const s of services) console.error(`  - ${s.name}`);
  process.exit(1);
}

console.log(`Service: ${service.name} (${service.id})`);
console.log("Env vars:");

for (const key of ENV_KEYS) {
  const value = String(process.env[key] || "").trim();
  if (!value) {
    console.log(`  skip ${key} (leer in .env)`);
    continue;
  }
  await upsertEnv(service.id, key, value);
}

console.log("Deploy auslösen …");
const depRes = await fetch(
  `https://api.render.com/v1/services/${service.id}/deploys`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({ clearCache: "do_not_clear" }),
  },
);
if (!depRes.ok) {
  console.error("Deploy fehlgeschlagen:", depRes.status, await depRes.text());
  process.exit(1);
}
const dep = await depRes.json();
console.log("Deploy gestartet:", dep?.id || dep?.deploy?.id || "ok");
