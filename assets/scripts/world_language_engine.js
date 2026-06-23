/**
 * Pauli Best Price — World speech + UI fallback (unbegrenzte Sprach-Tags).
 * UI + Avatar-TTS: 18 Locales (th → en → de bevorzugt), BCP47 für eleven_multilingual_v2.
 */
(function (global) {
  "use strict";

  var CORE_UI_LANGS = [
    "th", "en", "de", "pl", "ru", "zh",
    "fr", "es", "it", "pt", "nl",
    "ar", "ja", "ko", "vi", "tr", "hi", "id",
  ];

  var NAME_TO_BCP = {
    de: "de-DE",
    german: "de-DE",
    deutsch: "de-DE",
    en: "en-US",
    english: "en-US",
    englisch: "en-US",
    th: "th-TH",
    thai: "th-TH",
    thailändisch: "th-TH",
    thailaendisch: "th-TH",
    pl: "pl-PL",
    polish: "pl-PL",
    polnisch: "pl-PL",
    polski: "pl-PL",
    ru: "ru-RU",
    russian: "ru-RU",
    russisch: "ru-RU",
    zh: "zh-CN",
    chinese: "zh-CN",
    chinesisch: "zh-CN",
    mandarin: "zh-CN",
    fr: "fr-FR",
    french: "fr-FR",
    französisch: "fr-FR",
    es: "es-ES",
    spanish: "es-ES",
    spanisch: "es-ES",
    it: "it-IT",
    italian: "it-IT",
    italienisch: "it-IT",
    pt: "pt-PT",
    portuguese: "pt-PT",
    "pt-br": "pt-BR",
    nl: "nl-NL",
    dutch: "nl-NL",
    ar: "ar-SA",
    arabic: "ar-SA",
    hi: "hi-IN",
    hindi: "hi-IN",
    ja: "ja-JP",
    japanese: "ja-JP",
    ko: "ko-KR",
    korean: "ko-KR",
    vi: "vi-VN",
    vietnamese: "vi-VN",
    tr: "tr-TR",
    turkish: "tr-TR",
    id: "id-ID",
    ind: "id-ID",
    indonesian: "id-ID",
    indonesisch: "id-ID",
    "bahasa indonesia": "id-ID",
    ms: "ms-MY",
    malay: "ms-MY",
    fil: "fil-PH",
    tagalog: "fil-PH",
    sv: "sv-SE",
    swedish: "sv-SE",
    da: "da-DK",
    danish: "da-DK",
    no: "nb-NO",
    norwegian: "nb-NO",
    fi: "fi-FI",
    finnish: "fi-FI",
    cs: "cs-CZ",
    czech: "cs-CZ",
    sk: "sk-SK",
    slovak: "sk-SK",
    hu: "hu-HU",
    hungarian: "hu-HU",
    ro: "ro-RO",
    romanian: "ro-RO",
    uk: "uk-UA",
    ukrainian: "uk-UA",
    el: "el-GR",
    greek: "el-GR",
    he: "he-IL",
    hebrew: "he-IL",
  };

  function normalizeKey(raw) {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
  }

  function resolveSpeechTag(raw) {
    var norm = normalizeKey(raw);
    if (!norm) return "en-US";
    if (NAME_TO_BCP[norm]) return NAME_TO_BCP[norm];
    if (/^[a-z]{2}$/i.test(norm)) return norm.toLowerCase();
    if (/^[a-z]{2}-[a-z]{2,4}$/i.test(norm)) return norm;
    return norm;
  }

  function normalizeUiLang(code) {
    var base = normalizeKey(code).split("-")[0];
    if (base === "zh") return "zh";
    return CORE_UI_LANGS.indexOf(base) >= 0 ? base : "en";
  }

  function uiPackFallbackChain(code) {
    var primary = normalizeUiLang(code);
    var chain = [primary];
    ["en", "de", "th"].forEach(function (fb) {
      if (chain.indexOf(fb) < 0) chain.push(fb);
    });
    return chain;
  }

  function getSystemSpeechTag() {
    try {
      var nav =
        (global.navigator &&
          global.navigator.languages &&
          global.navigator.languages[0]) ||
        (global.navigator && global.navigator.language) ||
        "en-US";
      return resolveSpeechTag(nav);
    } catch (_) {
      return "en-US";
    }
  }

  function speechTagForUiLang(uiLang) {
    var map = {
      th: "th-TH", en: "en-US", de: "de-DE", pl: "pl-PL", ru: "ru-RU", zh: "zh-CN",
      fr: "fr-FR", es: "es-ES", it: "it-IT", pt: "pt-PT", nl: "nl-NL",
      ar: "ar-SA", ja: "ja-JP", ko: "ko-KR", vi: "vi-VN", tr: "tr-TR", hi: "hi-IN", id: "id-ID",
    };
    return map[normalizeUiLang(uiLang)] || resolveSpeechTag(uiLang);
  }

  global.OSG_WORLD_LANG = {
    CORE_UI_LANGS: CORE_UI_LANGS,
    resolveSpeechTag: resolveSpeechTag,
    normalizeUiLang: normalizeUiLang,
    uiPackFallbackChain: uiPackFallbackChain,
    getSystemSpeechTag: getSystemSpeechTag,
    speechTagForUiLang: speechTagForUiLang,
  };
})(typeof window !== "undefined" ? window : globalThis);
