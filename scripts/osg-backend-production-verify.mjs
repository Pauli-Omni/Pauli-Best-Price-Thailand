#!/usr/bin/env node
/**
 * Production backend verification — health, pauli-chat origin, email status.
 * Usage: node scripts/osg-backend-production-verify.mjs [baseUrl]
 */
import { OSG_CANONICAL_PRODUCTION_BASE } from "./osg-canonical-production-base.mjs";

const BASE =
  (process.argv[2] || OSG_CANONICAL_PRODUCTION_BASE).replace(/\/$/, "");

const ORIGINS = [
  BASE,
  OSG_CANONICAL_PRODUCTION_BASE,
  "https://omnisolutionsglobal.com",
  "https://www.omnisolutionsglobal.com",
];

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text: text.slice(0, 500) };
}

async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, text: await res.text() };
}

async function postChat(origin) {
  const base = origin.replace(/\/$/, "");
  const res = await fetch(`${base}/api/pauli-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({
      lang: "de",
      messages: [{ role: "user", content: "Antworte nur: OK" }],
    }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, origin };
}

function fail(msg) {
  console.error("FAIL", msg);
  process.exitCode = 1;
}

function ok(msg) {
  console.log("OK  ", msg);
}

console.log("Backend verify —", BASE);
console.log("");

const health = await get("/api/health");
if (health.status !== 200 || !health.json?.ok) {
  fail(`/api/health HTTP ${health.status}`);
} else {
  ok("/api/health ok=true");
  const email = health.json.emailSystem;
  if (email) {
    console.log("     emailSystem.level:", email.level, "|", email.label || "");
    console.log("     emailSystem.lastError:", email.lastError || "(none)");
  }
}

let chatPass = 0;
for (const origin of ORIGINS) {
  const hit = await postChat(origin);
  if (hit.status === 403 && hit.json?.error === "origin_not_allowed") {
    fail(`pauli-chat Origin ${origin} → 403 origin_not_allowed`);
  } else if (hit.status === 200 && hit.json?.reply) {
    ok(`pauli-chat Origin ${origin} → 200 reply`);
    chatPass += 1;
  } else if (hit.status === 503) {
    ok(`pauli-chat Origin ${origin} → 503 chat_unavailable (key issue, not CORS)`);
    chatPass += 1;
  } else {
    fail(`pauli-chat Origin ${origin} → HTTP ${hit.status} ${JSON.stringify(hit.json).slice(0, 120)}`);
  }
}

const mainJs = await fetchText("/assets/scripts/osg-index-app-main.module.js");
if (mainJs.status === 200 && mainJs.text.includes("osgPauliLiveDialogueOnly")) {
  ok("dialogue recovery markers in main.module.js");
} else if (mainJs.status === 200) {
  fail("dialogue recovery markers missing in deployed main.module.js");
} else {
  fail(`main.module.js HTTP ${mainJs.status}`);
}

console.log("");
if (process.exitCode) {
  console.error("Verification FAILED");
  process.exit(1);
}
console.log(`Verification PASSED (${chatPass}/${ORIGINS.length} chat origins OK)`);
