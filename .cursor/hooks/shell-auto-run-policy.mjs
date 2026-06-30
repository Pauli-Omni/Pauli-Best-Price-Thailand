#!/usr/bin/env node
/**
 * Pauli Best Price — beforeShellExecution Auto-Run policy.
 * allow = ohne Run-Klick | ask = Gründerfreigabe
 */
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const raw = String(input.command || "").trim();

function out(permission, user_message = "", agent_message = "") {
  const body = { permission };
  if (user_message) body.user_message = user_message;
  if (agent_message) body.agent_message = agent_message;
  console.log(JSON.stringify(body));
  process.exit(0);
}

const BLOCK = [
  /\bgit\s+push\b/i,
  /\bgit\s+commit\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\b/i,
  /\bnpm\s+publish\b/i,
  /\brm\s+-rf\b/i,
  /\brm\s+-fr\b/i,
  /\bunlink\s*\(/i,
  /\brender:deploy\b/i,
  /\brender-deploy\b/i,
  /\brender:sync-involve\b/i,
  /\brender:finish\b/i,
  /\brender:bootstrap\b/i,
  /\bosg-elevenlabs-go-live-setup\b/i,
  /api\.render\.com\/v1\/services/i,
  /\bsuspend\b/i,
  /\bDELETE\b/i,
  />\s*\.env\b/i,
  /\btee\b.*\.env\b/i,
  /\bsed\s+-i\b.*\.env\b/i,
];

const ALLOW = [
  /^npm run render:verify-env\b/,
  /^npm run render:go-live-check\b/,
  /^bash deploy-check\.sh\b/,
  /^node scripts\/osg-pauli-greeting-vision-verify\.mjs\b/,
  /^node scripts\/osg-rcd-dialogue-verify\.mjs\b/,
  /^node scripts\/osg-production-qa\.mjs\b/,
  /^node scripts\/osg-backend-production-verify\.mjs\b/,
  /^node scripts\/render-go-live-check\.mjs\b/,
  /^node scripts\/render-verify-production-env\.mjs\b/,
  /^npm test\b/,
  /^(ls|cat|grep|rg|find|pwd|head|tail|file|wc|test)\b/,
  /^git\s+(status|diff|log|show|branch|rev-parse|ls-files)\b/i,
  /^curl\b/i,
];

const PROD_BASE =
  process.env.OSG_PRODUCTION_BASE ||
  "pauli-best-price-api-nzbl.onrender.com";

function stripCd(part) {
  return part.replace(/^cd\s+(?:"[^"]+"|'[^']+'|\S+)\s+&&\s+/i, "").trim();
}

function partsOf(cmd) {
  return cmd
    .split(/\s*(?:&&|;)\s*/)
    .map((p) => stripCd(p.trim()))
    .filter(Boolean);
}

function isBlocked(part) {
  return BLOCK.some((re) => re.test(part));
}

function isAllowed(part) {
  if (!part || part === "true" || part === "false") return true;
  if (ALLOW.some((re) => re.test(part))) {
    if (/^curl\b/i.test(part) && /api\.render\.com/i.test(part)) return false;
    if (/^curl\b/i.test(part) && /-X\s+POST/i.test(part) && /render\.com\/v1/i.test(part))
      return false;
    return true;
  }
  if (/^curl\b/i.test(part) && /\/api\/(health|tts|pauli-chat)\b/i.test(part))
    return true;
  if (/^curl\b/i.test(part) && PROD_BASE && part.includes(PROD_BASE)) return true;
  return false;
}

for (const part of partsOf(raw)) {
  if (isBlocked(part)) {
    out(
      "ask",
      "Dieser Befehl erfordert Gründerfreigabe (Deploy, Git-Schreiben, Render-API, Löschen oder .env).",
      "Blocked by Pauli shell-auto-run-policy.",
    );
  }
}

const parts = partsOf(raw);
if (parts.length && parts.every(isAllowed)) {
  out("allow");
}

out(
  "ask",
  "Befehl nicht auf der Pauli Auto-Run-Allowlist — bitte kurz bestätigen.",
  "Unknown or mixed shell command — ask user per pauli-auto-run-policy.",
);
