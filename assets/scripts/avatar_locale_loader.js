/**
 * Avatar lädt Sprachpakete aus assets/locales/{lang}.json (UI + Thai-Brücke).
 */
(function (global) {
  "use strict";

  var GUARD = function () {
    return global.OSG_I18N_LANG_GUARD;
  };

  function resolveLang(opts) {
    opts = opts || {};
    var g = GUARD();
    if (opts.langCode) {
      return g ? g.normalizeLang(opts.langCode) : String(opts.langCode);
    }
    return g ? g.resolveUiLang() : "th";
  }

  function loadPack(lang) {
    var g = GUARD();
    if (g && typeof g.ensureLocalePackLoaded === "function") {
      return g.ensureLocalePackLoaded(lang);
    }
    return Promise.resolve(false);
  }

  function loadAvatarPacks(opts) {
    var g = GUARD();
    if (g && typeof g.ensureAvatarLocalePacks === "function") {
      return g.ensureAvatarLocalePacks(resolveLang(opts));
    }
    return loadPack(resolveLang(opts));
  }

  function packLine(lang, key) {
    var g = GUARD();
    if (g && typeof g.getPackLine === "function") {
      return g.getPackLine(lang, key);
    }
    return "";
  }

  function localizedLine(key, opts) {
    opts = opts || {};
    var uiLang = resolveLang(opts);
    var g = GUARD();
    var line = packLine(uiLang, key);
    if (g && line && typeof g.stripThaiLatinMix === "function") {
      line = g.stripThaiLatinMix(line, uiLang);
    }
    return line;
  }

  global.OSG_AVATAR_LOCALE = {
    resolveLang: resolveLang,
    loadPack: loadPack,
    loadAvatarPacks: loadAvatarPacks,
    packLine: packLine,
    localizedLine: localizedLine,
  };
})(typeof window !== "undefined" ? window : globalThis);
