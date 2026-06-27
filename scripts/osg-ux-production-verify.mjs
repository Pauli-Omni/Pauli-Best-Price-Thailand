#!/usr/bin/env node
/**
 * Production smoke checks for UX priorities P1–P5.
 */
const BASE =
  process.env.OSG_PRODUCTION_URL ||
  "https://pauli-best-price-api.onrender.com";

async function fetchText(path) {
  const t0 = Date.now();
  const r = await fetch(BASE + path, {
    headers: { "User-Agent": "osg-ux-verify/1" },
  });
  const ms = Date.now() - t0;
  const text = await r.text();
  return { status: r.status, ms, text };
}

function pass(name, detail) {
  console.log("PASS", name, detail || "");
  return true;
}

function fail(name, detail) {
  console.error("FAIL", name, detail || "");
  return false;
}

async function main() {
  console.log("=== OSG UX Production Verify ===");
  console.log("BASE:", BASE);
  let ok = 0;
  let bad = 0;

  const mainJs = await fetchText(
    "/assets/scripts/osg-index-app-main.module.js"
  );
  if (mainJs.status !== 200) {
    bad++;
    fail("main_module", "HTTP " + mainJs.status);
  } else {
    ok++;
    if (mainJs.text.includes("clonedVoiceFirst")) {
      ok++;
      pass("p1_cloned_voice_first", "marker present");
    } else bad++, fail("p1_cloned_voice_first", "missing");
    if (mainJs.text.includes("playAudio: false")) {
      ok++;
      pass("p2_silent_boot", "marker present");
    } else bad++, fail("p2_silent_boot", "missing");
  }

  const motionJs = await fetchText(
    "/assets/scripts/osg_digital_human_motion.js"
  );
  if (motionJs.status === 200) {
    if (
      motionJs.text.includes("exclusively handled") ||
      !motionJs.text.includes("_blink.impulse * 0.35")
    ) {
      ok++;
      pass("p3_blink_fix", "stable blink scheduler");
    } else bad++, fail("p3_blink_fix", "old impulse blink");
  }

  const engineJs = await fetchText(
    "/assets/scripts/osg_digital_human_engine.js"
  );
  if (engineJs.status === 200) {
    if (engineJs.text.includes("exclusively handled by OSG_DIGITAL_HUMAN_MOTION")) {
      ok++;
      pass("p3_no_duplicate_blink", "engine blink removed");
    } else bad++, fail("p3_no_duplicate_blink", "duplicate blink may remain");
  }

  const animJs = await fetchText("/assets/scripts/pauli_avatar_animations.js");
  if (animJs.status === 200) {
    if (animJs.text.includes("is-anim-idle-spin")) {
      ok++;
      pass("p4_idle_spin", "marker present");
    } else bad++, fail("p4_idle_spin", "missing");
  }

  const css = await fetchText("/style.css");
  if (css.status === 200) {
    if (css.text.includes("is-anim-idle-spin") && css.text.includes("12s linear infinite")) {
      ok++;
      pass("p4_css_spin", "12s idle rotation");
    } else bad++, fail("p4_css_spin", "missing");
    if (
      css.text.includes("top: var(--coin-stage-position-top)") &&
      css.text.includes("bottom: auto") &&
      !css.text.match(/is-speaking[\s\S]{0,120}right:\s*auto/)
    ) {
      ok++;
      pass("p5_fixed_upper_right", "mobile top-right + no right:auto on speak");
    } else bad++, fail("p5_fixed_upper_right", "layout rule issue");
  }

  const tts = await fetch(BASE + "/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({ text: "Hallo, ich bin Pauli.", lang: "de-DE" }),
  });
  if (tts.status === 200) {
    ok++;
    pass("p1_tts_live", "HTTP 200 " + (await tts.arrayBuffer()).byteLength + " bytes");
  } else {
    bad++;
    fail("p1_tts_live", "HTTP " + tts.status);
  }

  console.log("\n=== Summary ===");
  console.log("Passed checks:", ok, "Failed:", bad);
  process.exit(bad > 0 ? 1 : 0);
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
