#!/usr/bin/env node
/**
 * Localhost asset + console audit for Pauli Best Price.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const BASE = process.env.OSG_LOCAL_BASE || "http://localhost:3000";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

const assetPaths = new Set();
const re = /(?:src|href)=["']([^"']+)["']/gi;
let m;
while ((m = re.exec(indexHtml))) {
  const u = m[1].trim();
  if (
    !u ||
    u.startsWith("http") ||
    u.startsWith("//") ||
    u.startsWith("data:") ||
    u.startsWith("about:") ||
    u.startsWith("#") ||
    u.startsWith("mailto:")
  ) {
    continue;
  }
  assetPaths.add(u.startsWith("/") ? u : "/" + u.replace(/^\.\//, ""));
}

const moduleRe = /from\s+["']([^"']+)["']/g;
while ((m = moduleRe.exec(indexHtml))) {
  const u = m[1].trim();
  if (u.startsWith("http") || u.startsWith("//")) continue;
  if (u.startsWith("/")) assetPaths.add(u);
}

const failures = [];
for (const p of [...assetPaths].sort()) {
  try {
    const res = await fetch(BASE + p, { redirect: "follow" });
    if (!res.ok) failures.push({ path: p, status: res.status });
  } catch (e) {
    failures.push({ path: p, status: String(e.message || e) });
  }
}

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err.message || err)));
  page.on("response", (res) => {
    const status = res.status();
    if (status >= 400) {
      failedRequests.push({ url: res.url(), status });
    }
  });

  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });

  const blockedBeforeGesture = await page.evaluate(() => {
    return (
      typeof window.osgPauliAudioAllowed === "function" &&
      !window.osgPauliAudioAllowed({ ignoreTerms: true })
    );
  });

  await page.evaluate(() => {
    try {
      localStorage.setItem("osg-terms-accepted-v1", "1");
    } catch (_) {}
  });
  await page.reload({ waitUntil: "networkidle2", timeout: 60000 });

  await page.evaluate(() => {
    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
  await new Promise((r) => setTimeout(r, 800));

  const state = await page.evaluate(() => ({
    gesture: window.__OSG_AUDIO_GESTURE_UNLOCKED__ === true,
    voices:
      window.OSG_SPEECH_VOICES &&
      typeof window.OSG_SPEECH_VOICES.isReady === "function" &&
      window.OSG_SPEECH_VOICES.isReady(),
    voiceCount:
      window.OSG_SPEECH_VOICES && window.OSG_SPEECH_VOICES.list
        ? window.OSG_SPEECH_VOICES.list().length
        : 0,
    animLoop: window.__OSG_ANIM_LOOP_STARTED__ === true,
    idleSpin: !!document.querySelector(".is-anim-idle-spin"),
  }));

  const report = {
    base: BASE,
    assetsChecked: assetPaths.size,
    assetFailures: failures,
    failedRequests: [...new Map(failedRequests.map((r) => [r.url, r])).values()],
    consoleErrors: [...new Set(consoleErrors)],
    pageErrors: [...new Set(pageErrors)],
    checks: {
      speechBlockedBeforeGesture: blockedBeforeGesture ? "PASS" : "FAIL",
      gestureUnlockAfterClick: state.gesture ? "PASS" : "FAIL",
      voicesLoadedAfterGesture: state.voices || state.voiceCount > 0 ? "PASS" : "WARN",
      animLoopAfterLoad: state.animLoop ? "PASS" : "FAIL",
      idleSpinAfterLoad: state.idleSpin ? "PASS" : "WARN",
    },
  };

  console.log(JSON.stringify(report, null, 2));
  const hardFail =
    failures.length > 0 ||
    pageErrors.length > 0 ||
    failedRequests.length > 0 ||
    consoleErrors.length > 0 ||
    report.checks.animLoopAfterLoad === "FAIL" ||
    report.checks.speechBlockedBeforeGesture === "FAIL" ||
    report.checks.gestureUnlockAfterClick === "FAIL";
  process.exit(hardFail ? 1 : 0);
} finally {
  await browser.close();
}
