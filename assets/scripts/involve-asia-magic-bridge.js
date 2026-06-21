/**
 * Involve Asia Magic auto.js — Checkout-Bridge parallel zur Backend-Deeplink-API.
 * Magic konvertiert Shop-URLs; bei Kauf-Intent → osgAvatarOnCheckoutSuccess.
 */
(function (global) {
  "use strict";

  var INVOLVE_TRACK_RE = /invl\.co|involve\.asia/i;
  var SHOP_HOST_RE =
    /(?:^|\.)?(lazada\.co\.th|shopee\.co\.th|bigc\.co\.th|lotuss\.com)/i;

  function trackedHref(href) {
    var h = String(href || "").trim();
    return INVOLVE_TRACK_RE.test(h) ? h : "";
  }

  function estimateThb(anchor) {
    if (typeof global.osgEstimateAffiliatePurchaseThb === "function") {
      return global.osgEstimateAffiliatePurchaseThb(anchor);
    }
    return 0;
  }

  function isPurchaseAnchor(anchor) {
    if (!anchor) return false;
    var lint = String(anchor.getAttribute("data-osg-intent") || "").trim();
    if (lint === "purchase") return true;
    var ch = String(anchor.getAttribute("data-osg-channel") || "").trim();
    if (
      ch === "marketplace" ||
      ch === "dealer" ||
      ch === "retail" ||
      ch === "beauty"
    ) {
      return true;
    }
    var href = String(anchor.getAttribute("href") || "").trim();
    return SHOP_HOST_RE.test(href) || INVOLVE_TRACK_RE.test(href);
  }

  function emitCheckout(anchor) {
    if (
      typeof global.osgAvatarAccessUnlocked === "function" &&
      !global.osgAvatarAccessUnlocked()
    ) {
      return;
    }
    var amount = estimateThb(anchor);
    if (typeof global.osgAvatarOnCheckoutSuccess === "function") {
      global.osgAvatarOnCheckoutSuccess(amount);
    } else if (typeof global.osgAvatarCelebratePurchase === "function") {
      global.osgAvatarCelebratePurchase(amount);
    }
  }

  global.osgInvolveMagicFallbackHref = function (anchor) {
    if (!anchor) return "";
    return trackedHref(anchor.getAttribute("href"));
  };

  global.osgInvolveMagicCheckoutFromAnchor = function (anchor) {
    if (!anchor || !isPurchaseAnchor(anchor)) return false;
    emitCheckout(anchor);
    return true;
  };

  function wireMagicCheckoutOnce() {
    if (global.__OSG_INVOLVE_MAGIC_CHECKOUT__) return;
    global.__OSG_INVOLVE_MAGIC_CHECKOUT__ = true;
    global.document.addEventListener(
      "click",
      function (e) {
        if (e.button !== 0) return;
        var a =
          e.target && e.target.closest
            ? e.target.closest("a[href]")
            : null;
        if (!a || !global.document.body.contains(a)) return;
        if (a.classList && a.classList.contains("osg-affiliate-link")) return;
        var href = String(a.getAttribute("href") || "").trim();
        if (!trackedHref(href) && !SHOP_HOST_RE.test(href)) return;
        if (!isPurchaseAnchor(a)) return;
        emitCheckout(a);
      },
      false
    );
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", wireMagicCheckoutOnce);
  } else {
    wireMagicCheckoutOnce();
  }
})(typeof window !== "undefined" ? window : globalThis);
