#!/usr/bin/env node
/**
 * Refresh AUTO block in docs/00_Omni_Solutions_Global_Projekt_Start.md after commit or deploy.
 * Usage: node scripts/osg-update-omni-projekt-start.mjs [--deploy]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "docs", "00_Omni_Solutions_Global_Projekt_Start.md");
const PROD_BASE =
  process.env.OSG_PRODUCTION_BASE || "https://pauli-best-price-api-nzbl.onrender.com";
const deployFlag = process.argv.includes("--deploy");

function git(field) {
  try {
    return execSync(`git log -1 --format=${JSON.stringify(field)}`, {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function branch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "main";
  }
}

async function healthStatus() {
  try {
    const res = await fetch(`${PROD_BASE.replace(/\/$/, "")}/api/health`, {
      signal: AbortSignal.timeout(15000),
    });
    return res.ok ? `${res.status} OK` : `${res.status} FAIL`;
  } catch (e) {
    return `ERR (${String(e.message || e).slice(0, 80)})`;
  }
}

function readKnownIssuesBullets() {
  const p = path.join(ROOT, "docs", "KNOWN_ISSUES.md");
  if (!fs.existsSync(p)) return "- (KNOWN_ISSUES.md fehlt)";
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
  const bullets = [];
  for (const line of lines) {
    const m = line.match(/^\| (KI-\d+) \| ([^|]+) \|/);
    if (m && line.includes("| Offen |")) {
      bullets.push(`- **${m[1]}** ${m[2].trim()}`);
    }
  }
  return bullets.length ? bullets.join("\n") : "- Keine offenen Einträge in KNOWN_ISSUES.md";
}

const hash = git("%H");
const short = git("%h");
const subject = git("%s");
const date = git("%ci");
const now = new Date().toISOString().slice(0, 10);
const health = await healthStatus();
const deployLine = deployFlag
  ? `${now} — Production smoke PASS (--deploy)`
  : `${now} — letzter bekannter Deploy (health: ${health})`;

const autoBlock = `<!-- AUTO-START -->
## Live-Status (automatisch gepflegt)

| Feld | Wert |
|------|------|
| **Letzter Commit** | \`${short}\` — ${subject} |
| **Commit-Datum** | ${date} |
| **Commit-Hash (voll)** | \`${hash}\` |
| **Branch** | \`${branch()}\` |
| **Letzter erfolgreicher Deploy** | ${deployLine} |
| **Production URL** | ${PROD_BASE} |
| **Production /api/health** | ${health} (geprüft ${now}) |
| **Repo** | https://github.com/Pauli-Omni/Pauli-Best-Price-Thailand |

### Bekannte offene Punkte

${readKnownIssuesBullets()}

Details: [docs/KNOWN_ISSUES.md](./KNOWN_ISSUES.md)

*Zuletzt aktualisiert: ${now} (Script: osg-update-omni-projekt-start.mjs)*
<!-- AUTO-END -->`;

if (!fs.existsSync(TARGET)) {
  console.error("Missing docs/00_Omni_Solutions_Global_Projekt_Start.md — create template first.");
  process.exit(1);
}

let content = fs.readFileSync(TARGET, "utf8");
const re = /<!-- AUTO-START -->[\s\S]*?<!-- AUTO-END -->/;
if (!re.test(content)) {
  console.error("AUTO block markers not found in 00_Omni_Solutions_Global_Projekt_Start.md");
  process.exit(1);
}
content = content.replace(re, autoBlock);
fs.writeFileSync(TARGET, content, "utf8");
console.log("Updated docs/00_Omni_Solutions_Global_Projekt_Start.md", deployFlag ? "(deploy flag)" : "");
