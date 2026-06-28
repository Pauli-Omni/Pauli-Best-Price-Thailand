#!/usr/bin/env node
/**
 * Deep localhost audit: assets, console, network, API smoke, audio/animation hooks.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const BASE = process.env.OSG_LOCAL_BASE || "http://localhost:3000";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function collectAssets() {
  const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const paths = new Set();
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
    paths.add(u.startsWith("/") ? u : "/" + u.replace(/^\.\//, ""));
  }
  return paths;
}

async function apiSmoke() {
  const out = [];
  const headers = {
    "Content-Type": "application/json",
    Origin: BASE.replace(/\/$/, ""),
    Referer: BASE + "/",
  };
  const tests = [
    ["GET", "/api/health", null],
    ["GET", "/osg-runtime-config.js", null],
    ["GET", "/hinterseite.png", null],
    ["GET", "/Frontseite02.png", null],
    [
      "POST",
      "/api/pauli-id/register",
      JSON.stringify({ cid: "deep-audit-" + Date.now() }),
    ],
    [
      "POST",
      "/api/avatar/status",
      JSON.stringify({ deviceId: "deep-audit" }),
    ],
    [
      "POST",
      "/api/pauli-chat",
      JSON.stringify({ message: "ping", lang: "en", sessionId: "audit" }),
    ],
    [
      "POST",
      "/api/tts",
      JSON.stringify({ text: "Hello", lang: "en" }),
    ],
  ];
  for (const [method, p, body] of tests) {
    try {
      const res = await fetch(BASE + p, {
        method,
        headers: body ? headers : { Origin: headers.Origin },
        body: body || undefined,
      });
      out.push({
        path: p,
        method,
        status: res.status,
        ok: res.ok,
      });
    } catch (e) {
      out.push({ path: p, method, status: "ERR", error: String(e.message || e) });
    }
  }
  return out;
}

const assetPaths = collectAssets();
const assetFailures = [];
for (const p of [...assetPaths].sort()) {
  const res = await fetch(BASE + p, { redirect: "follow" });
  if (!res.ok) assetFailures.push({ path: p, status: res.status });
}

const apiResults = await apiSmoke();

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
let runtimeState = {};

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

  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 });

  await page.evaluate(() => {
    try {
      localStorage.setItem("osg-terms-accepted-v1", "1");
    } catch (_) {}
  });
  await page.reload({ waitUntil: "networkidle2", timeout: 90000 });
  await page.evaluate(() => {
    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
  await new Promise((r) => setTimeout(r, 1200));

  runtimeState = await page.evaluate(() => ({
    gesture: window.__OSG_AUDIO_GESTURE_UNLOCKED__ === true,
    audioAllowed: typeof window.osgPauliAudioAllowed === "function" && window.osgPauliAudioAllowed(),
    playPauliVoice: typeof window.playPauliVoice === "function",
    wakeStart: typeof window.osgWakeStart === "function",
    dhEngine: !!window.OSG_DIGITAL_HUMAN,
    dhMotion: !!window.OSG_DIGITAL_HUMAN_MOTION,
    dhEmotion: !!window.OSG_DIGITAL_HUMAN_EMOTION,
    dhEye: !!window.OSG_DH_EYE_CONTACT,
    dhGesture: !!window.OSG_DH_GESTURE_INTELLIGENCE,
    lipSync: typeof window.OSGLipSync !== "undefined",
    avatarAnim: !!window.OSG_PauliAvatarAnimations,
    animLoop: window.__OSG_ANIM_LOOP_STARTED__ === true,
    idleSpin: !!document.querySelector(".is-anim-idle-spin"),
    coinStage: !!document.getElementById("coin-stage"),
    voiceCount:
      window.OSG_SPEECH_VOICES && window.OSG_SPEECH_VOICES.list
        ? window.OSG_SPEECH_VOICES.list().length
        : 0,
    speechKeys: !!window.OSG_AUDIO_SEGMENT,
  }));
} finally {
  await browser.close();
}

const report = {
  base: BASE,
  assetsChecked: assetPaths.size,
  assetFailures,
  apiResults,
  failedRequests: [...new Map(failedRequests.map((r) => [r.url, r])).values()],
  consoleErrors: [...new Set(consoleErrors)],
  pageErrors: [...new Set(pageErrors)],
  runtimeState,
};

console.log(JSON.stringify(report, null, 2));

const hardFail =
  assetFailures.length > 0 ||
  pageErrors.length > 0 ||
  apiResults.some((r) => r.path === "/osg-runtime-config.js" && r.status !== 200) ||
  apiResults.some((r) => r.path === "/api/pauli-id/register" && r.status === 403);

process.exit(hardFail ? 1 : 0);
