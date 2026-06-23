/**
 * Pauli Best Price — Dynamische Sprach-Steuerung (I18N-Switch).
 * Nutzer hat das letzte Wort; Avatar bietet Wechsel an und bestätigt monolingual.
 */
(function (global) {
  "use strict";

  var SS_PENDING = "osg-lang-switch-pending-v1";
  var SS_PROACTIVE_DONE = "osg-lang-switch-proactive-v1";

  var LANGS = [
    "th", "en", "de", "pl", "ru", "zh",
    "fr", "es", "it", "pt", "nl",
    "ar", "ja", "ko", "vi", "tr", "hi", "id",
  ];

  function resolveLangList() {
    var wl = global.OSG_WORLD_LANG;
    if (wl && wl.CORE_UI_LANGS && wl.CORE_UI_LANGS.length) {
      return wl.CORE_UI_LANGS.slice();
    }
    return LANGS.slice();
  }

  var LANG_NAMES = {
    de: {
      de: "Deutsch",
      en: "German",
      th: "เยอรมัน",
      pl: "niemiecki",
      ru: "немецкий",
      zh: "德语",
    },
    en: {
      de: "Englisch",
      en: "English",
      th: "อังกฤษ",
      pl: "angielski",
      ru: "английский",
      zh: "英语",
    },
    th: {
      de: "Thai",
      en: "Thai",
      th: "ไทย",
      pl: "tajski",
      ru: "тайский",
      zh: "泰语",
    },
    pl: {
      de: "Polnisch",
      en: "Polish",
      th: "โปแลนด์",
      pl: "polski",
      ru: "польский",
      zh: "波兰语",
    },
    ru: {
      de: "Russisch",
      en: "Russian",
      th: "รัสเซีย",
      pl: "rosyjski",
      ru: "русский",
      zh: "俄语",
    },
    zh: {
      de: "Chinesisch",
      en: "Chinese",
      th: "จีน",
      pl: "chiński",
      ru: "китайский",
      zh: "中文",
    },
  };

  var REQUEST_PATTERNS = [
    {
      lang: "de",
      re: /\b(auch\s+)?(auf\s+)?(deutsch|german|englisch|english|thai|thailändisch|thailaendisch|polnisch|polish|russisch|russian|chinesisch|chinese|mandarin)\b/i,
    },
    {
      lang: "en",
      re: /\b(can you|could you|do you)\s+(also\s+)?(speak|talk)\s+(in\s+)?(german|deutsch|english|thai|polish|polski|russian|chinese|mandarin|chinesisch)\b/i,
    },
    {
      lang: "en",
      re: /\b(speak|switch)\s+(to\s+)?(german|english|thai|polish|russian|chinese)\b/i,
    },
    {
      lang: "th",
      re: /(พูด|คุย).{0,12}(ภาษา)?(ไทย|อังกฤษ|เยอรมัน|โปแลนด์|รัสเซีย|จีน)/i,
    },
    {
      lang: "pl",
      re: /\b(po\s+)?(polsku|niemiecku|angielsku|tajsku|rosyjsku|chińsku|chinski)\b/i,
    },
    {
      lang: "pl",
      re: /\b(mówisz|mowisz|umiesz).{0,16}(po\s+)?(polsku|niemiecku|angielsku)\b/i,
    },
    {
      lang: "ru",
      re: /(говоришь|говорите|можешь).{0,20}(по-)?(русски|немецки|английски|тайски|польски|китайски)/i,
    },
    {
      lang: "zh",
      re: /(会说|能说|讲).{0,8}(中文|德语|英语|泰语|波兰语|俄语)/i,
    },
    {
      lang: "any",
      re: /\b(kannst du|koennst du|könntest du).{0,24}(auch\s+)?(deutsch|englisch|thai|polnisch|russisch|chinesisch)\b/i,
    },
    {
      lang: "any",
      re: /\b(auf\s+)(deutsch|englisch|thai|polnisch|russisch|chinesisch)\b/i,
    },
  ];

  var TOKEN_TO_LANG = [
    { re: /\b(deutsch|german)\b/i, code: "de" },
    { re: /\b(englisch|english)\b/i, code: "en" },
    { re: /\b(thai|thailändisch|thailaendisch|tajski|тайск|泰语|ไทย)\b/i, code: "th" },
    { re: /\b(polnisch|polish|polsku|polski|польск|波兰)\b/i, code: "pl" },
    { re: /\b(russisch|russian|rosyjski|русск|俄语|รัสเซีย)\b/i, code: "ru" },
    { re: /\b(chinesisch|chinese|mandarin|chiński|chinski|китай|中文|จีน)\b/i, code: "zh" },
    { re: /\b(indonesisch|indonesian|bahasa indonesia|bahasa)\b/i, code: "id" },
    { re: /\b(französisch|french|français|francais)\b/i, code: "fr" },
    { re: /\b(spanisch|spanish|español|espanol)\b/i, code: "es" },
    { re: /\b(japanisch|japanese|日本語)\b/i, code: "ja" },
    { re: /\b(koreanisch|korean|한국어)\b/i, code: "ko" },
    { re: /\b(vietnamesisch|vietnamese|tiếng việt)\b/i, code: "vi" },
    { re: /(ภาษา)?อังกฤษ/i, code: "en" },
    { re: /(ภาษา)?เยอรมัน/i, code: "de" },
    { re: /(ภาษา)?ไทย/i, code: "th" },
    { re: /(ภาษา)?โปแลนด์/i, code: "pl" },
    { re: /(ภาษา)?รัสเซีย/i, code: "ru" },
    { re: /(ภาษา)?จีน/i, code: "zh" },
    { re: /(po\s+)?(niemiecku)/i, code: "de" },
    { re: /(po\s+)?(angielsku)/i, code: "en" },
    { re: /(po\s+)?(tajsku)/i, code: "th" },
    { re: /(по-)?(немецки)/i, code: "de" },
    { re: /(по-)?(английски)/i, code: "en" },
    { re: /(德语|英语|泰语|波兰语|俄语|中文)/i, code: "zh" },
  ];

  var AFFIRMATIVE = [
    /\b(ja[,.]?\s*)?(mach das|mach's|machs|stell um|umstellen|switch|wechsel)\b/i,
    /\b(ja|jap|jo|jawohl|gerne|klar|ok|okay|bitte|go ahead)\b/i,
    /^(ใช่|ได้|โอเค|ตกลง|จัดมา|เปลี่ยน|ทำเลย)/i,
    /^(tak|pewnie|jasne|ok|proszę|zrób to|zrob to)/i,
    /^(да|конечно|давай|ок|хорошо|сделай)/i,
    /^(好|可以|行|切换|换|做吧)/i,
    /\b(yes|yep|sure|please|do it|go ahead)\b/i,
  ];

  var NEGATIVE = [
    /\b(nein|nee|nö|ne|nicht|lass|bleib|no|nope|cancel|stop|don't)\b/i,
    /^(ไม่|ไม่ต้อง|ยกเลิก)/i,
    /^(nie|anuluj|zostaw)/i,
    /^(нет|не надо|отмена)/i,
    /^(不|不要|取消)/i,
  ];

  function normalizeLang(code) {
    var g = global.OSG_I18N_LANG_GUARD;
    if (g && typeof g.normalizeLang === "function") {
      return g.normalizeLang(code);
    }
    var c = String(code || "en").toLowerCase().split("-")[0];
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function resolveUiLang() {
    var g = global.OSG_I18N_LANG_GUARD;
    if (g && typeof g.resolveUiLang === "function") {
      return g.resolveUiLang();
    }
    return "en";
  }

  function detectNavigatorLang() {
    try {
      var nav =
        (global.navigator &&
          global.navigator.languages &&
          global.navigator.languages[0]) ||
        (global.navigator && global.navigator.language) ||
        "";
      return normalizeLang(nav);
    } catch (_) {
      return "en";
    }
  }

  function langDisplayName(targetLang, uiLang) {
    var t = normalizeLang(targetLang);
    var u = normalizeLang(uiLang);
    var bucket = LANG_NAMES[t];
    if (bucket && bucket[u]) return bucket[u];
    if (bucket && bucket.en) return bucket.en;
    return t;
  }

  function extractTargetLang(text) {
    var t = String(text || "");
    var i;
    for (i = 0; i < TOKEN_TO_LANG.length; i++) {
      if (TOKEN_TO_LANG[i].re.test(t)) {
        return TOKEN_TO_LANG[i].code;
      }
    }
    return "";
  }

  function isLanguageRequest(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    var i;
    for (i = 0; i < REQUEST_PATTERNS.length; i++) {
      if (REQUEST_PATTERNS[i].re.test(t)) return true;
    }
    return /\b(sprache|language|ภาษา|język|язык|语言)\b/i.test(t) &&
      !!extractTargetLang(t);
  }

  function readPending() {
    try {
      var raw = sessionStorage.getItem(SS_PENDING);
      if (!raw) return null;
      var code = normalizeLang(raw);
      return LANGS.indexOf(code) >= 0 ? code : null;
    } catch (_) {
      return null;
    }
  }

  function writePending(lang) {
    try {
      sessionStorage.setItem(SS_PENDING, normalizeLang(lang));
      return true;
    } catch (_) {
      return false;
    }
  }

  function clearPending() {
    try {
      sessionStorage.removeItem(SS_PENDING);
    } catch (_) {}
  }

  function isAffirmative(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    var i;
    for (i = 0; i < AFFIRMATIVE.length; i++) {
      if (AFFIRMATIVE[i].test(t)) return true;
    }
    return false;
  }

  function isNegative(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    var i;
    for (i = 0; i < NEGATIVE.length; i++) {
      if (NEGATIVE[i].test(t)) return true;
    }
    return false;
  }

  function analyze(text, uiLang) {
    var t = String(text || "").trim();
    if (!t) return null;
    uiLang = normalizeLang(uiLang || resolveUiLang());

    if (readPending()) {
      if (isAffirmative(t)) {
        return { type: "confirm_yes", targetLang: readPending() };
      }
      if (isNegative(t)) {
        return { type: "confirm_no", targetLang: readPending() };
      }
    }

    if (isLanguageRequest(t)) {
      var target = extractTargetLang(t);
      if (target && target !== uiLang) {
        return { type: "request", targetLang: target, uiLang: uiLang };
      }
      if (target && target === uiLang) {
        return { type: "already", targetLang: target, uiLang: uiLang };
      }
    }

    return null;
  }

  function proactiveAltLang(uiLang) {
    uiLang = normalizeLang(uiLang || resolveUiLang());
    var nav = detectNavigatorLang();
    if (nav && nav !== uiLang) return nav;
    if (uiLang !== "th") return "th";
    if (uiLang !== "en") return "en";
    return "";
  }

  function markProactiveOffered() {
    try {
      sessionStorage.setItem(SS_PROACTIVE_DONE, "1");
    } catch (_) {}
  }

  function mayProactiveOffer(uiLang) {
    try {
      if (sessionStorage.getItem(SS_PROACTIVE_DONE) === "1") return false;
    } catch (_) {}
    var alt = proactiveAltLang(uiLang);
    return !!alt && alt !== normalizeLang(uiLang);
  }

  function splitSequentialBlocks(text) {
    return String(text || "")
      .split(/\n{2,}|\s*\|\|\s*/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  global.OSG_LANG_SWITCH_LOGIC = {
    LANGS: LANGS,
    LANG_NAMES: LANG_NAMES,
    normalizeLang: normalizeLang,
    langDisplayName: langDisplayName,
    analyze: analyze,
    readPending: readPending,
    writePending: writePending,
    clearPending: clearPending,
    isAffirmative: isAffirmative,
    isNegative: isNegative,
    isLanguageRequest: isLanguageRequest,
    extractTargetLang: extractTargetLang,
    proactiveAltLang: proactiveAltLang,
    mayProactiveOffer: mayProactiveOffer,
    markProactiveOffered: markProactiveOffered,
    splitSequentialBlocks: splitSequentialBlocks,
    detectNavigatorLang: detectNavigatorLang,
  };
})(typeof window !== "undefined" ? window : globalThis);
