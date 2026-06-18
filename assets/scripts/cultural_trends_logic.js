/**
 * Pauli Best Price — Kulturelle Etikette, Trend-Rotation (30 Tage), Social Coach.
 */
(function (global) {
  "use strict";

  var LANGS = ["de", "en", "th", "pl", "ru", "zh"];
  var ROTATION_MS = 30 * 24 * 60 * 60 * 1000;
  var SS_TREND = "osg-cultural-trend-used-v1-";
  var SS_SOCIAL = "osg-cultural-social-used-v1-";

  function normalizeLang(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    if (c === "zh") return "zh";
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function regionForLang(lang) {
    var L = normalizeLang(lang);
    if (L === "th") return "th";
    if (L === "de") return "de";
    return "default";
  }

  function poolsRoot() {
    return global.OSG_CULTURAL_TREND_POOLS || null;
  }

  function poolForRegion(region) {
    var root = poolsRoot();
    if (!root) return [];
    if (region === "th") return root.TH || [];
    if (region === "de") return root.DE || [];
    return root.default || [];
  }

  function socialPoolForRegion(region) {
    var root = poolsRoot();
    if (!root) return [];
    if (region === "th") return root.SOCIAL_TH || [];
    if (region === "de") return root.SOCIAL_DE || [];
    return root.SOCIAL_DEF || [];
  }

  function readHistory(key) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function writeHistory(key, arr) {
    try {
      global.localStorage.setItem(key, JSON.stringify(arr));
    } catch (_) {}
  }

  function pruneHistory(history, maxAgeMs) {
    var now = Date.now();
    var out = [];
    var i;
    for (i = 0; i < history.length; i++) {
      var e = history[i];
      if (!e || typeof e.i !== "number" || !isFinite(e.at)) continue;
      if (now - e.at < maxAgeMs) out.push(e);
    }
    return out;
  }

  function pickFromPool(pool, historyKey, speechPrefix) {
    if (!pool || !pool.length) return null;
    var history = pruneHistory(readHistory(historyKey), ROTATION_MS);
    var used = {};
    var i;
    for (i = 0; i < history.length; i++) {
      used[history[i].i] = true;
    }
    var available = [];
    for (i = 0; i < pool.length; i++) {
      if (!used[i]) available.push(i);
    }
    var pickIdx;
    if (available.length) {
      pickIdx = available[Math.floor(Math.random() * available.length)];
    } else {
      history.sort(function (a, b) {
        return a.at - b.at;
      });
      pickIdx = history[0] ? history[0].i : 0;
      history = history.filter(function (e) {
        return e.i !== pickIdx;
      });
    }
    history.push({ i: pickIdx, at: Date.now() });
    writeHistory(historyKey, history);
    var phrase = pool[pickIdx];
    return {
      index: pickIdx,
      phrase: phrase,
      speechKey: speechPrefix + String(pickIdx).padStart(2, "0"),
    };
  }

  function lineFromPhrase(phrase, lang) {
    if (!phrase) return "";
    var L = normalizeLang(lang);
    return String(phrase[L] || phrase.en || phrase.de || "").trim();
  }

  function pickTrendPhrase(lang) {
    var region = regionForLang(lang);
    var pool = poolForRegion(region);
    var hit = pickFromPool(pool, SS_TREND + region, "culturalTrend" + region + "_");
    if (!hit) return null;
    var text = lineFromPhrase(hit.phrase, lang);
    if (!text) return null;
    return {
      text: text,
      speechKey: hit.speechKey,
      index: hit.index,
      region: region,
    };
  }

  function pickSocialCoach(lang) {
    var region = regionForLang(lang);
    var pool = socialPoolForRegion(region);
    var hit = pickFromPool(pool, SS_SOCIAL + region, "culturalSocial" + region + "_");
    if (!hit) return null;
    var tts = lineFromPhrase(hit.phrase, lang);
    if (!tts) return null;
    return {
      tts: tts,
      bubble: tts.length > 72 ? tts.slice(0, 69) + "…" : tts,
      speechKey: hit.speechKey,
      index: hit.index,
      region: region,
    };
  }

  function thaiEtiquetteHint(lang) {
    var L = normalizeLang(lang);
    var hints = {
      de: "Dezent wie ein leichtes Wai: niemand verliert das Gesicht.",
      en: "Soft like a gentle wai — nobody loses face.",
      th: "ไหว้เบา ๆ พอ — รักษาน้ำหน้าทั้งสองฝ่ายนะครับ",
      pl: "Delikatnie jak lekkie wai — nikt nie traci twarzy.",
      ru: "Мягко, как лёгкий wai — никто не теряет лицо.",
      zh: "像轻轻合十一样——双方都保全面子。",
    };
    return hints[L] || hints.en;
  }

  function enrichGiftModule(moduleId, mod, lang) {
    if (!mod || !mod.tts) return mod;
    moduleId = String(moduleId || "");
    var tts = String(mod.tts).trim();
    var bubble = String(mod.bubble || mod.tts).trim();
    if (moduleId === "gift_bundle_th") {
      var L = normalizeLang(lang);
      var hint = thaiEtiquetteHint(lang);
      if (
        L !== "th" &&
        hint &&
        tts.indexOf(hint) < 0 &&
        !/ไหว้|น้ำหน้า|wai|face/i.test(tts)
      ) {
        tts = hint + " " + tts;
      }
    }
    return {
      speechKey: mod.speechKey,
      tts: tts,
      bubble: bubble,
      complianceDisclaimer: mod.complianceDisclaimer,
    };
  }

  function giftModuleForLang(lang) {
    var L = normalizeLang(lang);
    if (L === "th") return "gift_bundle_th";
    if (L === "de") return "gift_bundle_de";
    return "gift_bundle";
  }

  global.OSG_CULTURAL_TRENDS = {
    LANGS: LANGS,
    ROTATION_MS: ROTATION_MS,
    normalizeLang: normalizeLang,
    regionForLang: regionForLang,
    pickTrendPhrase: pickTrendPhrase,
    pickSocialCoach: pickSocialCoach,
    thaiEtiquetteHint: thaiEtiquetteHint,
    enrichGiftModule: enrichGiftModule,
    giftModuleForLang: giftModuleForLang,
  };
})(typeof window !== "undefined" ? window : globalThis);
