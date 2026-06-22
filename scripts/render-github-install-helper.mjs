#!/usr/bin/env node
/**
 * Opens Render GitHub App install + Blueprint pages (macOS).
 * Polls Render API until pauli-best-price-api can be created or already exists.
 */
import "dotenv/config";
import { execSync } from "child_process";

const SERVICE = "pauli-best-price-api";
const OWNER = "tea-d8hf2q9kh4rs73ed263g";
const REPO = "https://github.com/Pauli-Omni/Pauli-Best-Price-Thailand";

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
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function findService() {
  const { data } = await api("GET", "/services?limit=100");
  for (const row of data) {
    if (row?.service?.name === SERVICE) return row.service;
  }
  return null;
}

async function tryCreate() {
  return api("POST", "/services", {
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
}

function openPages() {
  if (process.platform !== "darwin") return;
  for (const url of [
    "https://github.com/apps/render/installations/new",
    "https://dashboard.render.com/blueprint/new",
  ]) {
    try {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } catch (_) {}
  }
}

const existing = await findService();
if (existing) {
  console.log("OK service exists:", existing.serviceDetails?.url || existing.id);
  process.exit(0);
}

openPages();
console.log("Warte auf GitHub Render-App Install + Blueprint …");

for (let i = 0; i < 48; i++) {
  await new Promise((r) => setTimeout(r, 15_000));
  const hit = await findService();
  if (hit) {
    console.log("Service live:", hit.serviceDetails?.url || hit.id);
    process.exit(0);
  }
  if (i % 4 === 0) console.log(`… warte auf Blueprint (${Math.round(((i + 1) * 15) / 60)} min)`);
}

console.error("Timeout — GitHub Render App installieren und Blueprint apply.");
process.exit(2);
