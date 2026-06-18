/**
 * Pauli Best Price — Sprach-Wächter: strikte Trennung, Thai-first-Brücke, Kultur-Profile.
 * Lebensqualitäts-Makler: Vertrauen durch klare, monolinguale Kommunikation.
 */
(function (global) {
  "use strict";

  var LANGS = ["de", "en", "th", "pl", "ru", "zh"];
  var THAI_RE = /[\u0E00-\u0E7F]/;
  var LATIN_RE = /[A-Za-zÄÖÜäöüß]/;

  function normalizeLang(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    if (c === "zh") return "zh";
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function resolveUiLang() {
    try {
      if (global.__OSG_CURRENT_LANG__) {
        return normalizeLang(global.__OSG_CURRENT_LANG__);
      }
    } catch (_) {}
    try {
      var stored = global.localStorage && global.localStorage.getItem("osg-lang");
      if (stored) return normalizeLang(stored);
    } catch (_) {}
    try {
      var nav =
        (global.navigator &&
          global.navigator.languages &&
          global.navigator.languages[0]) ||
        (global.navigator && global.navigator.language) ||
        "th";
      return normalizeLang(nav);
    } catch (_) {
      return "th";
    }
  }

  function lineHasThai(text) {
    return THAI_RE.test(String(text || ""));
  }

  function lineHasLatin(text) {
    return LATIN_RE.test(String(text || ""));
  }

  /** Verboten: Thai + Deutsch/Latein in einem Satz mischen. */
  function isMonolingualLine(text, lang) {
    var line = String(text || "").trim();
    if (!line) return true;
    var L = normalizeLang(lang);
    var hasTh = lineHasThai(line);
    var hasLat = lineHasLatin(line);
    if (L === "th") return !hasLat || !hasTh;
    if (L === "de") return !hasTh;
    if (hasTh && hasLat) return false;
    return true;
  }

  function stripThaiLatinMix(line, lang) {
    var L = normalizeLang(lang);
    if (isMonolingualLine(line, L)) return String(line || "").trim();
    if (L === "de" || L === "en" || L === "pl" || L === "ru" || L === "zh") {
      return String(line || "")
        .replace(/[\u0E00-\u0E7F]+/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^[\s,;—–-]+|[\s,;—–-]+$/g, "")
        .trim();
    }
    if (L === "th") {
      return String(line || "")
        .replace(/\b(Sawatdee khrap!?|sawatdee khrap!?)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
    return String(line || "").trim();
  }

  /**
   * Thai-first-Brücke: UI ≠ th → erst vollständig Thai, dann Übersetzung (UI-Sprache).
   */
  function needsThaiFirstBridge(uiLang, opts) {
    opts = opts || {};
    if (opts.skipBridge === true) return false;
    if (opts.translationOnly === true) return false;
    var ui = normalizeLang(uiLang);
    if (ui === "th") return false;
    if (opts.bridge === false) return false;
    return true;
  }

  function cultureProfile(lang) {
    var L = normalizeLang(lang);
    if (L === "th") {
      return {
        id: "th_sanuk",
        tone: "sanuk",
        giftModuleId: "gift_bundle_th",
        respect: ["face", "wai"],
        giftFocus: ["flowers", "jewelry", "time"],
      };
    }
    if (L === "de") {
      return {
        id: "de_pralines",
        tone: "direct_warm",
        giftModuleId: "gift_bundle_de",
        giftFocus: ["pralines", "time"],
      };
    }
    return {
      id: "neutral",
      tone: "friendly",
      giftModuleId: "gift_bundle",
    };
  }

  function giftBundleModuleForLang(lang) {
    return cultureProfile(lang).giftModuleId;
  }

  function getPackForLang(lang) {
    lang = normalizeLang(lang);
    try {
      if (global.__OSG_I18N && global.__OSG_I18N.T && global.__OSG_I18N.T[lang]) {
        return global.__OSG_I18N.T[lang];
      }
    } catch (_) {}
    try {
      if (typeof T !== "undefined" && T[lang]) return T[lang];
    } catch (_) {}
    return null;
  }

  function getPackLine(lang, key) {
    var pack = getPackForLang(lang);
    if (!pack || !key) return "";
    return String(pack[key] || "").trim();
  }

  function ensureLocalePackLoaded(lang) {
    lang = normalizeLang(lang);
    if (
      typeof global.osgLoadLocaleOverlay === "function" &&
      typeof global.osgLocaleHasJsonOverlay === "function" &&
      global.osgLocaleHasJsonOverlay(lang)
    ) {
      return global.osgLoadLocaleOverlay(lang);
    }
    return Promise.resolve(false);
  }

  function ensureAvatarLocalePacks(uiLang) {
    var ui = normalizeLang(uiLang || resolveUiLang());
    var chain = ensureLocalePackLoaded(ui);
    if (ui !== "th") {
      chain = chain.then(function () {
        return ensureLocalePackLoaded("th");
      });
    }
    return chain;
  }

  global.OSG_I18N_LANG_GUARD = {
    LANGS: LANGS,
    normalizeLang: normalizeLang,
    resolveUiLang: resolveUiLang,
    isMonolingualLine: isMonolingualLine,
    stripThaiLatinMix: stripThaiLatinMix,
    needsThaiFirstBridge: needsThaiFirstBridge,
    cultureProfile: cultureProfile,
    giftBundleModuleForLang: giftBundleModuleForLang,
    getPackForLang: getPackForLang,
    getPackLine: getPackLine,
    ensureLocalePackLoaded: ensureLocalePackLoaded,
    ensureAvatarLocalePacks: ensureAvatarLocalePacks,
  };
})(typeof window !== "undefined" ? window : globalThis);
