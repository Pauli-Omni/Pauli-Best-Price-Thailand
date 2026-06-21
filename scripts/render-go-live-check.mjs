#!/usr/bin/env node
/**
 * Live-Check für S1 Deploy — HTTP-Status der Pauli-Render-URLs.
 * Usage: node scripts/render-go-live-check.mjs
 */
const BASE = "https://pauli-best-price-api.onrender.com";

const PATHS = [
  { label: "Haupt-App & PWA", path: "/" },
  { label: "Download-Hub", path: "/download" },
  { label: "API-Health", path: "/api/health" },
  {
    label: "macOS-Download",
    path: "/downloads/pauli-best-price-macos.zip",
  },
];

async function checkOne(entry) {
  const url = BASE + entry.path;
  try {
    const res = await fetch(url, {
      method: entry.path === "/api/health" ? "GET" : "HEAD",
      redirect: "follow",
    });
    let detail = "";
    if (entry.path === "/api/health" && res.ok) {
      try {
        const j = await res.json();
        const aff = j?.involveAsia || j?.affiliate || {};
        detail =
          " involve=" +
          (aff.active ?? aff.ready ?? j?.affiliateActive ?? "?") +
          " reason=" +
          (aff.lastReason || aff.reason || "-");
      } catch (_) {}
    }
    return { ...entry, url, status: res.status, ok: res.ok, detail };
  } catch (err) {
    return {
      ...entry,
      url,
      status: 0,
      ok: false,
      detail: String(err?.message || err),
    };
  }
}

const rows = await Promise.all(PATHS.map(checkOne));
let allOk = true;
console.log("Pauli Best Price — Live-Check\n");
for (const r of rows) {
  const mark = r.ok ? "OK" : "FAIL";
  if (!r.ok) allOk = false;
  console.log(
    `[${mark}] HTTP ${r.status} — ${r.label}\n     ${r.url}${r.detail ? "\n     " + r.detail.trim() : ""}`,
  );
}
process.exit(allOk ? 0 : 1);
