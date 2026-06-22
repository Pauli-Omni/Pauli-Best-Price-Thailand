#!/usr/bin/env node
/**
 * Opens Render/GitHub setup URLs (macOS), polls until pauli-best-price-api exists,
 * then runs render:deploy-api + render:go-live-check.
 */
import "dotenv/config";
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SERVICE_NAME = "pauli-best-price-api";
const POLL_MS = 15_000;
const MAX_WAIT_MS = 12 * 60_000;

function loadRenderApiKey() {
  if (process.env.RENDER_API_KEY) return String(process.env.RENDER_API_KEY).trim();
  const renderEnv = path.resolve(
    ROOT,
    "../OmniSolutionsGlobal WEBSEITE/scripts/render.local.env",
  );
  if (!fs.existsSync(renderEnv)) return "";
  for (const line of fs.readFileSync(renderEnv, "utf8").split(/\r?\n/)) {
    const m = line.match(/^RENDER_API_KEY=(.+)$/);
    if (m) return m[1].trim();
  }
  return "";
}

async function findService(apiKey) {
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
  const rows = await fetch("https://api.render.com/v1/services?limit=100", {
    headers,
  }).then((r) => r.json());
  for (const row of rows) {
    const s = row?.service;
    if (s?.name === SERVICE_NAME) return s;
  }
  return null;
}

function openUrls() {
  if (process.platform !== "darwin") {
    console.log("Hinweis: Browser-URLs manuell öffnen (nicht macOS).");
    return;
  }
  const urls = [
    "https://github.com/apps/render/installations/new",
    "https://dashboard.render.com/blueprint/new",
  ];
  for (const url of urls) {
    try {
      execSync(`open "${url}"`, { stdio: "ignore" });
    } catch (_) {}
  }
  console.log("Browser geöffnet:");
  console.log("  1) GitHub → Render App installieren → Repo Pauli-Best-Price-Thailand wählen");
  console.log("  2) Render Blueprint → Pauli-Omni/Pauli-Best-Price-Thailand · main · render.yaml → Apply");
}

function runNpm(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${script} exit ${code}`))));
  });
}

async function main() {
  const apiKey = loadRenderApiKey();
  if (!apiKey) {
    console.error("RENDER_API_KEY fehlt.");
    process.exit(1);
  }

  let service = await findService(apiKey);
  if (!service) {
    console.log("Service noch nicht da — öffne Setup-URLs und warte …");
    openUrls();
    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_MS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      service = await findService(apiKey);
      if (service) break;
      const min = Math.round((Date.now() - start) / 60_000);
      console.log(`… warte (${min} min) — Blueprint im Dashboard abschließen`);
    }
  }

  if (!service) {
      console.error("\nTimeout: Service wurde nicht angelegt.");
      console.error("Render GitHub App auf github.com/apps/render installieren, dann Blueprint apply.");
      console.error("Erneut: npm run render:bootstrap");
    process.exit(2);
  }

  console.log("\nService gefunden:", service.name, service.serviceDetails?.url || "");
  await runNpm("render:deploy-api");
  await runNpm("render:go-live-check");
  console.log("\nGo-Live abgeschlossen.");
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
