#!/usr/bin/env node
/**
 * Wait for Render POST /services rate limit, create service once, sync env, deploy, go-live check.
 */
import "dotenv/config";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OWNER = "tea-d8hf2q9kh4rs73ed263g";
const REPO = "https://github.com/Pauli-Omni/Pauli-Best-Price-Thailand";
const SERVICE = "pauli-best-price-api";

function apiKey() {
  return String(process.env.RENDER_API_KEY || "").trim();
}

async function api(method, route, body) {
  const res = await fetch(`https://api.render.com/v1${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const reset = Number(res.headers.get("ratelimit-reset") || 0);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data, reset };
}

async function findService() {
  const { data } = await api("GET", "/services?limit=100");
  for (const row of data) {
    if (row?.service?.name === SERVICE) return row.service;
  }
  return null;
}

async function waitForCreateQuota() {
  const probe = await api("GET", "/services?limit=1");
  if (!probe.ok) throw new Error(`Render API ${probe.status}`);
  const createProbe = await api("POST", "/services", {
    type: "web_service",
    name: SERVICE,
    ownerId: OWNER,
    repo: REPO,
    branch: "main",
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
  if (createProbe.ok) return createProbe.data?.service || createProbe.data;
  if (createProbe.status !== 429) {
    throw new Error(
      `Create failed ${createProbe.status}: ${JSON.stringify(createProbe.data).slice(0, 300)}`,
    );
  }
  const waitSec = Math.min(Math.max(createProbe.reset || 120, 60), 3600);
  console.log(`Render API Pause (${waitSec}s) — danach erneuter Versuch …`);
  await new Promise((r) => setTimeout(r, waitSec * 1000));
  const retry = await api("POST", "/services", {
    type: "web_service",
    name: SERVICE,
    ownerId: OWNER,
    repo: REPO,
    branch: "main",
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
  if (!retry.ok) {
    throw new Error(
      `Create failed ${retry.status}: ${JSON.stringify(retry.data).slice(0, 300)}`,
    );
  }
  return retry.data?.service || retry.data;
}

function runNpm(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${script} exit ${code}`)),
    );
  });
}

let service = await findService();
if (!service) {
  console.log("Erstelle Service (einmalig) …");
  service = await waitForCreateQuota();
  console.log("Service erstellt:", service?.serviceDetails?.url || service?.id);
} else {
  console.log("Service existiert:", service.serviceDetails?.url || service.id);
}

await runNpm("render:deploy-api");
await runNpm("render:go-live-check");
console.log("Go-Live abgeschlossen.");
