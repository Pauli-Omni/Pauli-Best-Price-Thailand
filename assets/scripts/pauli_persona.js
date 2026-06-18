/**
 * Pauli Best Price Thailand — Master-Persona (Victoria Stein / Pauli-Assistent).
 * Wegweiser, Kumpel, Lebensmakler — kein Hard-Sell.
 */
(function (global) {
  "use strict";

  var SS_HERO_BUFFER = "osg-hero-checkout-buffer-v1";

  var COMPLIANCE_CHANNELS = [
    "bank",
    "finance",
    "credit",
    "insurance",
    "real_estate",
    "immo",
    "dealer",
    "automotive",
  ];

  var HERO_COUPON_MIN_THB = 20;
  var HERO_COUPON_MAX_THB = 50;

  function isComplianceChannel(channel, certRealm) {
    var ch = String(channel || "").toLowerCase().trim();
    var cert = String(certRealm || "").toLowerCase().trim();
    if (ch === "bank") return true;
    if (cert === "automotive" || cert === "real_estate") return true;
    if (cert === "insurance") return true;
    return COMPLIANCE_CHANNELS.indexOf(ch) >= 0;
  }

  function isRetailPurchaseIntent(channel, intent, certRealm) {
    if (isComplianceChannel(channel, certRealm)) return false;
    var lint = String(intent || "").toLowerCase().trim();
    var ch = String(channel || "").toLowerCase().trim();
    if (lint === "purchase") return true;
    if (
      ch === "marketplace" ||
      ch === "dealer" ||
      ch === "retail" ||
      ch === "beauty"
    ) {
      return lint !== "consult";
    }
    return false;
  }

  function pickHeroCouponThb() {
    var span = HERO_COUPON_MAX_THB - HERO_COUPON_MIN_THB + 1;
    return HERO_COUPON_MIN_THB + Math.floor(Math.random() * span);
  }

  function readHeroBuffer() {
    try {
      var raw = sessionStorage.getItem(SS_HERO_BUFFER);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : null;
    } catch (_) {
      return null;
    }
  }

  function primeHeroCheckoutBuffer() {
    var existing = readHeroBuffer();
    if (existing && !existing.revealed) return existing.markup || pickHeroCouponThb();
    var markup = pickHeroCouponThb();
    try {
      sessionStorage.setItem(
        SS_HERO_BUFFER,
        JSON.stringify({ markup: markup, revealed: false, coupon: 0 })
      );
    } catch (_) {}
    return markup;
  }

  function revealHeroCheckoutBuffer(couponThb) {
    var amount =
      typeof couponThb === "number" && couponThb > 0
        ? couponThb
        : pickHeroCouponThb();
    var buf = readHeroBuffer() || {};
    try {
      sessionStorage.setItem(
        SS_HERO_BUFFER,
        JSON.stringify({
          markup: buf.markup || amount,
          revealed: true,
          coupon: amount,
        })
      );
    } catch (_) {}
    return amount;
  }

  function checkoutDisplayThb(baseThb) {
    var base = Number(baseThb) || 0;
    var buf = readHeroBuffer();
    if (!buf || buf.revealed) {
      return {
        base: base,
        show: base,
        markup: 0,
        inflated: false,
        coupon: buf && buf.revealed ? buf.coupon || 0 : 0,
      };
    }
    var markup = Number(buf.markup) || pickHeroCouponThb();
    return {
      base: base,
      show: base + markup,
      markup: markup,
      inflated: true,
      coupon: 0,
    };
  }

  function formatAmountLine(template, amount) {
    return String(template || "")
      .replace(/\{AMOUNT\}/g, String(amount))
      .replace(/\{THB\}/g, String(amount));
  }

  global.OSG_PAULI_PERSONA = {
    id: "pauli_assistant",
    personaName: "Victoria Stein",
    assistantName: "Pauli",
    roleRef: "Victoria Stein / Pauli",
    style: "locker, witzig, direkt, kumpel",
    RECLAMATION_ROLE: {
      id: "communication_assistant_wegweiser",
      labelRef: "communication_assistant_wegweiser",
      isLawyer: false,
      isAttorney: false,
      isWegweiser: true,
    },
    COMPLIANCE_CHANNELS: COMPLIANCE_CHANNELS,
    HERO_COUPON_MIN_THB: HERO_COUPON_MIN_THB,
    HERO_COUPON_MAX_THB: HERO_COUPON_MAX_THB,
    isComplianceChannel: isComplianceChannel,
    isRetailPurchaseIntent: isRetailPurchaseIntent,
    pickHeroCouponThb: pickHeroCouponThb,
    primeHeroCheckoutBuffer: primeHeroCheckoutBuffer,
    revealHeroCheckoutBuffer: revealHeroCheckoutBuffer,
    checkoutDisplayThb: checkoutDisplayThb,
    readHeroBuffer: readHeroBuffer,
    formatAmountLine: formatAmountLine,
  };
})(typeof window !== "undefined" ? window : globalThis);
