#!/usr/bin/env node
/**
 * Pauli session greeting vision — static + optional localhost runtime checks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0;

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL", msg);
    fail += 1;
  } else {
    console.log("PASS", msg);
  }
}

const main = read("assets/scripts/osg-index-app-main.module.js");
const boot = read("assets/scripts/startup_boot_logic.js");
const anim = read("assets/scripts/pauli_avatar_animations.js");
const de = read("assets/locales/de.json");
const en = read("assets/locales/en.json");

assert(
  /if \(!playAudio\) \{\s*return;/.test(boot),
  "playAudio:false returns without marking session greet done"
);
assert(
  boot.includes("OSG_PRE_WAI_PAUSE_MS") && boot.includes("500"),
  "0.5s pre-Wai pause configured"
);
assert(
  /if \(sawadeeDone && greetDone\)/.test(boot),
  "markSessionGreetDone only after Wai+Sawadee and locale greet audio"
);
assert(
  anim.includes('tryPlayVideo("wai_greeting"'),
  "Wai greeting uses avatar video loop (not CSS-only)"
);
assert(
  main.includes("osgPauliRunUserSessionGreeting"),
  "user-initiated session greeting entry exists"
);
assert(
  main.includes('{ playAudio: true }'),
  "session greeting uses playAudio:true on user start"
);
assert(
  !main.includes("afterSessionGreet"),
  "no auto-live afterSessionGreet coin path"
);
assert(
  !main.includes("_osgAnyClickMicStart"),
  "no document-wide auto-mic after greeting"
);
assert(
  !main.includes("pack.pauliLiveStartPrompt ||") ||
    !/listenOnce[\s\S]{0,1600}pack\.pauliLiveStartPrompt/.test(main),
  "listenOnce must not auto-play pauliLiveStartPrompt"
);
assert(
  main.includes("Browser speechSynthesis disabled for Pauli"),
  "speechSynthesis fallback disabled for Pauli"
);
assert(
  !main.includes("new SpeechSynthesisUtterance"),
  "no SpeechSynthesisUtterance in main module"
);
assert(
  main.includes("osgPauliWaitTtsIdle") && main.includes("osgPauliTtsIsActive"),
  "STT waits until TTS idle (echo guard)"
);
assert(
  de.includes("Was möchtest du heute kaufen") &&
    en.includes("What would you like to buy today") &&
    en.includes('pauliLiveStartPrompt": ""'),
  "canonical Phase-2 greet + empty pauliLiveStartPrompt in locale JSON"
);
assert(
  boot.includes("Sawadee Krab"),
  "Sawadee Krab configured in startup boot"
);
assert(
  boot.includes("playThaiSawadeeWithWai") && boot.includes("startThaiWaiVisual"),
  "Wai visual hook present in startup boot"
);
assert(
  /if \(SB\.sessionGreetDone\(\)\)/.test(main) &&
    main.includes("__OSG_SESSION_GREET_RUNNING__"),
  "session greeting guarded against duplicate per session"
);
assert(
  !/osgAvatarCompanionBoot[\s\S]{0,3500}runSessionGreeting/.test(main),
  "silent companion boot must not invoke runSessionGreeting"
);
assert(
  !/Ich höre zu\. Erzähl mir/.test(main) &&
    !/Ich höre zu\. Erzähl mir/.test(boot),
  "deprecated Ich höre zu prompt not hardcoded in greeting pipeline"
);
assert(
  !/sessionGreetDone\(\)[\s\S]{0,120}startPauliLiveConversation/.test(main),
  "completed session greet must not auto-start live on coin"
);

const runRuntime = process.argv.includes("--runtime");
if (runRuntime) {
  const puppeteer = await import("puppeteer").then((m) => m.default);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.goto("http://localhost:3000/", {
      waitUntil: "networkidle2",
      timeout: 90000,
    });
    await page.evaluate(() => {
      try {
        localStorage.setItem("osg-terms-accepted-v1", "1");
        localStorage.setItem("osg-personal-onboard-v1", "1");
        localStorage.setItem("osg-age-gate-th15-v1", "1");
        sessionStorage.removeItem("osg-session-greet-v1");
      } catch (_) {}
      window.__OSG_GREET_TEST__ = { speechCalls: 0, greetCalls: 0, liveStarts: 0 };
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
        window.speechSynthesis.speak = function () {
          window.__OSG_GREET_TEST__.speechCalls += 1;
          return origSpeak.apply(this, arguments);
        };
      }
      if (typeof window.startPauliLiveConversation === "function") {
        const origLive = window.startPauliLiveConversation.bind(window);
        window.startPauliLiveConversation = function (opts) {
          window.__OSG_GREET_TEST__.liveStarts += 1;
          return origLive(opts);
        };
      }
      if (typeof window.osgPauliMarkUserGestureForAudio === "function") {
        window.osgPauliMarkUserGestureForAudio();
      }
    });
    await page.reload({ waitUntil: "networkidle2", timeout: 90000 });
    await page.evaluate(() => {
      if (typeof window.osgPauliMarkUserGestureForAudio === "function") {
        window.osgPauliMarkUserGestureForAudio();
      }
    });
    const greeted = await page.evaluate(async () => {
      if (typeof window.osgPauliRunUserSessionGreeting !== "function") {
        return { ok: false, reason: "no-fn" };
      }
      const stage = document.getElementById("coin-stage");
      const hadWaiClass = () =>
        !!(
          stage &&
          (stage.classList.contains("is-wai") ||
            stage.classList.contains("is-anim-wai"))
        );
      const video = stage && stage.querySelector("video.pauli-avatar-loop");
      const before = hadWaiClass();
      const t = window.__OSG_GREET_TEST__ || {
        speechCalls: 0,
        greetCalls: 0,
        liveStarts: 0,
      };
      t.greetCalls += 1;
      const p1 = window.osgPauliRunUserSessionGreeting({ fromCoin: true });
      await new Promise((r) => setTimeout(r, 600));
      const during = hadWaiClass();
      const videoDuring =
        !!video && !video.hidden && String(video.currentSrc || video.src || "").includes("wai");
      try {
        await Promise.race([p1, new Promise((r) => setTimeout(r, 20000))]);
      } catch (_) {}
      t.greetCalls += 1;
      const liveBeforeDup = t.liveStarts;
      const p2 = window.osgPauliRunUserSessionGreeting({ fromCoin: true });
      await Promise.race([p2, new Promise((r) => setTimeout(r, 800))]);
      const SB = window.OSG_STARTUP_BOOT;
      return {
        ok: true,
        before,
        during,
        videoDuring,
        sessionDone: SB && SB.sessionGreetDone && SB.sessionGreetDone(),
        speechCalls: t.speechCalls,
        greetCalls: t.greetCalls,
        liveStartsDuringGreet: t.liveStarts - liveBeforeDup,
        pendingMic: !!window.__OSG_GREETING_DONE_PENDING_MIC__,
      };
    });
    assert(greeted.ok, "runtime greeting function callable");
    assert(
      greeted.during || greeted.before || greeted.videoDuring,
      "Wai observed on #coin-stage during greeting"
    );
    assert(greeted.sessionDone, "session greet marked done after user greeting");
    assert(
      (greeted.speechCalls || 0) === 0,
      "speechSynthesis.speak not used during greeting runtime"
    );
    assert(
      (greeted.liveStartsDuringGreet || 0) === 0,
      "live conversation not auto-started during greeting"
    );
    assert(
      greeted.pendingMic,
      "greeting ends in await-user state (mic not auto-started)"
    );
  } finally {
    await browser.close();
  }
} else {
  console.log("(skip runtime — use --runtime with local dev server)");
}

if (fail > 0) process.exit(1);
console.log("PASS osg-pauli-greeting-vision-verify.mjs");
