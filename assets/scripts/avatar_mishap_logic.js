/**
 * Pauli Avatar — Pannen-Logik (Menschlichkeit beim Hinlaufen / Zeigen).
 */
(function (global) {
  "use strict";

  var MISHAP_TYPES = ["stumble", "snag", "trip", "tumble"];
  var TRIGGER_CHANCE = 0.26;
  var TOUR_TRIGGER_CHANCE = 0.14;

  function prefersReducedMotion() {
    try {
      return (
        global.matchMedia &&
        global.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (_) {
      return false;
    }
  }

  function shouldTrigger(opts) {
    opts = opts || {};
    if (opts.force === true) return true;
    if (opts.allowMishap === false) return false;
    if (prefersReducedMotion()) return false;
    var chance =
      opts.tourMode === true ? TOUR_TRIGGER_CHANCE : TRIGGER_CHANCE;
    return Math.random() < chance;
  }

  function pickType() {
    return MISHAP_TYPES[Math.floor(Math.random() * MISHAP_TYPES.length)];
  }

  function moduleIdForType(type) {
    return "mishap_" + String(type || "stumble");
  }

  function durationFor(type) {
    var map = {
      stumble: 840,
      snag: 1120,
      trip: 960,
      tumble: 1240,
    };
    return map[String(type || "")] || 900;
  }

  function travelDurationMs(viewportWidth) {
    var w = typeof viewportWidth === "number" ? viewportWidth : 800;
    return w <= 480 ? 560 : 740;
  }

  function mishapAtProgress(type) {
    var map = {
      stumble: 0.48,
      snag: 0.62,
      trip: 0.44,
      tumble: 0.52,
    };
    return map[String(type || "")] || 0.5;
  }

  global.OSG_AVATAR_MISHAP_LOGIC = {
    MISHAP_TYPES: MISHAP_TYPES,
    TRIGGER_CHANCE: TRIGGER_CHANCE,
    shouldTrigger: shouldTrigger,
    pickType: pickType,
    moduleIdForType: moduleIdForType,
    durationFor: durationFor,
    travelDurationMs: travelDurationMs,
    mishapAtProgress: mishapAtProgress,
    prefersReducedMotion: prefersReducedMotion,
  };
})(typeof window !== "undefined" ? window : globalThis);
