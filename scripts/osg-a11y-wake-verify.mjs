#!/usr/bin/env node
/** Static checks for voice/tap accessibility wake paths. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const main = readFileSync(
  join(root, "assets/scripts/osg-index-app-main.module.js"),
  "utf8"
);
const html = readFileSync(join(root, "index.html"), "utf8");
const en = JSON.parse(readFileSync(join(root, "assets/locales/en.json"), "utf8"));

const checks = [
  ["wake_no_busy_gate", !main.includes("if (busy) return;\n            if (SR)")],
  ["boot_allows_wake", main.includes("opts.fromWake || opts.fromCoin")],
  ["tap_live_helper", main.includes("osgWakeStartLiveFromAccessibility")],
  ["keyboard_shortcut", main.includes('ev.key || "").toLowerCase() !== "p"')],
  ["a11y_hint_html", html.includes("pauli-a11y-access-hint")],
  ["wake_live_region", html.includes('id="pauli-wake-status"')],
  ["en_coin_aria", !!en.coinAriaLabel],
  ["en_wake_aria", !!en.pauliWakeMicAria],
  ["paulie_wake", main.includes("paulie")],
];

let fail = 0;
for (const [name, ok] of checks) {
  console.log(ok ? "PASS" : "FAIL", name);
  if (!ok) fail += 1;
}
process.exit(fail ? 1 : 0);
