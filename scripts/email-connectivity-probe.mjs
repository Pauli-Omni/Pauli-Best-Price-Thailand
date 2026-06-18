#!/usr/bin/env node
/**
 * OSG E-Mail-Konnektivitäts-Probe (SMTP/IMAP + App-Registry).
 * Usage: node scripts/email-connectivity-probe.mjs
 */
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const mod = await import(
  path.join(root, "02_Quellcode", "Core_Logik", "services", "osg-email-connectivity.js")
);

const probe = await mod.runEmailConnectivityProbe();
const apps = mod.verifyAppEmailRegistry();

console.log("=== OSG E-Mail Probe ===");
console.log("Info:", mod.OSG_INFO_EMAIL);
console.log("Support:", mod.OSG_SUPPORT_EMAIL);
console.log("Status:", probe.status?.label || probe.status?.level);
console.log("SMTP configured:", mod.isSmtpConfigured());
console.log("");
console.log("SMTP host:", probe.smtp?.host, `(${probe.smtp?.hostSource || "—"})`);
console.log("SMTP TCP:", probe.smtp?.tcp);
console.log("SMTP Auth:", probe.smtp?.auth);
console.log("IMAP host:", probe.imap?.host, `(${probe.imap?.hostSource || "—"})`);
console.log("IMAP TCP:", probe.imap?.tcp);
console.log("MX:", probe.mx);
console.log("");
console.log("Echo log:", probe.echoLog?.file || "—");
console.log("Echo test mail:", probe.echoTest);
console.log("");
console.log("App registry:");
apps.forEach((a) => {
  console.log(
    ` - ${a.appId}: support=${a.supportEmail} ${a.supportOk ? "OK" : "MISMATCH"}`
  );
});

if (probe.status?.critical) {
  process.exitCode = 2;
}
