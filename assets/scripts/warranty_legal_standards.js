/**
 * Pauli Best Price — Garantie vs. gesetzlicher Referenzstandard (Datenbank-Check).
 * Keine Rechtsberatung: Referenzwerte für Kommunikations-Entwürfe, Formulierung „oft üblich“.
 */
(function (global) {
  "use strict";

  var LANGS = ["de", "en", "th", "pl", "ru", "zh"];

  /** Referenz-Mindestwerte in Tagen (Kommunikationshilfe, nicht rechtsverbindlich). */
  var LEGAL_WARRANTY_DB = {
    th: {
      default: { days: 365, refKey: "twelve_months" },
      electronics: { days: 365, refKey: "twelve_months" },
      apparel: { days: 180, refKey: "six_months" },
    },
    de: {
      default: { days: 730, refKey: "twenty_four_months" },
      electronics: { days: 730, refKey: "twenty_four_months" },
      apparel: { days: 730, refKey: "twenty_four_months" },
    },
    pl: {
      default: { days: 730, refKey: "twenty_four_months" },
      electronics: { days: 730, refKey: "twenty_four_months" },
      apparel: { days: 730, refKey: "twenty_four_months" },
    },
    default: {
      default: { days: 365, refKey: "twelve_months" },
      electronics: { days: 365, refKey: "twelve_months" },
      apparel: { days: 180, refKey: "six_months" },
    },
  };

  var REF_LABELS = {
    six_months: {
      de: "6 Monate",
      en: "6 months",
      th: "6 เดือน",
      pl: "6 miesięcy",
      ru: "6 месяцев",
      zh: "6个月",
    },
    twelve_months: {
      de: "12 Monate",
      en: "12 months",
      th: "12 เดือน",
      pl: "12 miesięcy",
      ru: "12 месяцев",
      zh: "12个月",
    },
    twenty_four_months: {
      de: "24 Monate",
      en: "24 months",
      th: "24 เดือน",
      pl: "24 miesiące",
      ru: "24 месяца",
      zh: "24个月",
    },
  };

  var CATEGORY_PATTERNS = {
    electronics: [
      /\b(phone|smartphone|handy|laptop|tablet|elektronik|electronics|คอม|โทรศัพท์|มือถือ|ноутбук|телефон|手机|电脑)\b/i,
    ],
    apparel: [
      /\b(kleidung|shirt|hose|schuh|apparel|clothes|เสื้อ|รองเท้า|odzież|одежд|服装)\b/i,
    ],
  };

  var WARRANTY_CONTEXT_PATTERNS = [
    /\b(garantie|gewährleistung|warranty|ประกัน|гарант|保修)\b/i,
    /\b(händler\s+sagt|seller\s+says|ร้านบอก|продавец\s+говорит|商家说)\b/i,
  ];

  function normalizeLang(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    if (c === "zh") return "zh";
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function line(bucket, lang) {
    var L = normalizeLang(lang);
    return String((bucket && (bucket[L] || bucket.en || bucket.de)) || "").trim();
  }

  function matchesAny(text, patterns) {
    var t = String(text || "");
    var i;
    for (i = 0; i < patterns.length; i++) {
      if (patterns[i].test(t)) return true;
    }
    return false;
  }

  function resolveJurisdiction(lang, text) {
    var t = String(text || "").toLowerCase();
    if (/\b(deutschland|german|bgb|zivilgesetzbuch)\b/i.test(t)) return "de";
    if (/\b(thailand|ไทย|ocpb|สคบ)\b/i.test(t)) return "th";
    if (/\b(polen|poland|polska)\b/i.test(t)) return "pl";
    if (/\b(lazada|shopee|7-?eleven)\b/i.test(t)) return "th";
    var L = normalizeLang(lang);
    if (L === "de") return "de";
    if (L === "th") return "th";
    if (L === "pl") return "pl";
    return "default";
  }

  function detectProductCategory(text) {
    var keys = Object.keys(CATEGORY_PATTERNS);
    var i;
    for (i = 0; i < keys.length; i++) {
      if (matchesAny(text, CATEGORY_PATTERNS[keys[i]])) return keys[i];
    }
    return "default";
  }

  function durationToDays(value, unit) {
    var n = Number(value);
    if (!n || n <= 0) return 0;
    var u = String(unit || "").toLowerCase();
    if (/tag|tage|day|วัน|天/.test(u)) return Math.round(n);
    if (/monat|monate|month|เดือน|мес|月/.test(u)) return Math.round(n * 30);
    if (/jahr|jahre|year|ปี|лет|年/.test(u)) return Math.round(n * 365);
    return 0;
  }

  function formatDaysLabel(lang, days) {
    lang = normalizeLang(lang);
    var d = Math.max(1, Math.round(Number(days) || 0));
    if (d >= 365 && d % 365 === 0) {
      var y = d / 365;
      if (lang === "de") return y + (y === 1 ? " Jahr" : " Jahre");
      if (lang === "th") return y + " ปี";
      if (lang === "pl") return y + (y === 1 ? " rok" : " lat");
      if (lang === "ru") return y + " " + (y === 1 ? "год" : "лет");
      if (lang === "zh") return y + "年";
      return y + (y === 1 ? " year" : " years");
    }
    if (d >= 30 && d % 30 === 0) {
      var m = d / 30;
      if (lang === "de") return m + (m === 1 ? " Monat" : " Monate");
      if (lang === "th") return m + " เดือน";
      if (lang === "pl") return m + (m === 1 ? " miesiąc" : " miesięcy");
      if (lang === "ru") return m + " мес.";
      if (lang === "zh") return m + "个月";
      return m + (m === 1 ? " month" : " months");
    }
    if (lang === "de") return d + (d === 1 ? " Tag" : " Tage");
    if (lang === "th") return d + " วัน";
    if (lang === "pl") return d + (d === 1 ? " dzień" : " dni");
    if (lang === "ru") return d + " дн.";
    if (lang === "zh") return d + "天";
    return d + (d === 1 ? " day" : " days");
  }

  function extractMerchantWarranty(text) {
    var t = String(text || "");
    if (!matchesAny(t, WARRANTY_CONTEXT_PATTERNS)) return null;
    var patterns = [
      /\b(?:nur|only|แค่|เพียง|tylko)?\s*(\d{1,3})\s*(tag|tage|days?|monat|monate|months?|jahr|jahre|years?|วัน|เดือน|ปี|dzień|dni|miesięcy|мес|лет|天|月|年)\b[^.]{0,48}\b(garantie|gewähr|warranty|ประกัน|гарант|保修)\b/i,
      /\b(garantie|gewähr|warranty|ประกัน|гарант|保修)\b[^.]{0,48}\b(?:nur|only|von|of|แค่)?\s*(\d{1,3})\s*(tag|tage|days?|monat|monate|months?|jahr|jahre|years?|วัน|เดือน|ปี|dzień|dni|miesięcy|мес|лет|天|月|年)\b/i,
      /\b(händler|seller|ร้าน|продавец|商家)[^.]{0,60}?(\d{1,3})\s*(tag|tage|days?|monat|monate|months?|jahr|jahre|years?|วัน|เดือน|ปี|dzień|dni|мес|лет|天|月|年)\b/i,
    ];
    var i;
    for (i = 0; i < patterns.length; i++) {
      var m = t.match(patterns[i]);
      if (!m) continue;
      var val = m[1] && /^\d/.test(m[1]) ? m[1] : m[2];
      var unit = m[2] && /^\d/.test(m[2]) ? m[3] : m[2];
      if (!val || !unit) {
        val = m[m.length - 2];
        unit = m[m.length - 1];
      }
      var days = durationToDays(val, unit);
      if (days > 0) {
        return { days: days, value: Number(val), unit: unit };
      }
    }
    return null;
  }

  function lookupLegalStandard(lang, text) {
    var jurisdiction = resolveJurisdiction(lang, text);
    var category = detectProductCategory(text);
    var bucket = LEGAL_WARRANTY_DB[jurisdiction] || LEGAL_WARRANTY_DB.default;
    var row = bucket[category] || bucket.default || LEGAL_WARRANTY_DB.default.default;
    return {
      jurisdiction: jurisdiction,
      category: category,
      days: row.days,
      label: line(REF_LABELS[row.refKey] || REF_LABELS.twelve_months, lang),
    };
  }

  function compareWarrantyGap(merchantDays, legalDays) {
    if (!merchantDays || !legalDays) return false;
    return merchantDays < legalDays * 0.85;
  }

  function buildWarrantyCheck(lang, text) {
    lang = normalizeLang(lang);
    var merchant = extractMerchantWarranty(text);
    if (!merchant) return null;
    var legal = lookupLegalStandard(lang, text);
    if (!compareWarrantyGap(merchant.days, legal.days)) return null;
    return {
      merchantDays: merchant.days,
      merchantLabel: formatDaysLabel(lang, merchant.days),
      legalDays: legal.days,
      legalLabel: legal.label,
      jurisdiction: legal.jurisdiction,
      category: legal.category,
    };
  }

  global.OSG_WARRANTY_LEGAL_STANDARDS = {
    LANGS: LANGS,
    LEGAL_WARRANTY_DB: LEGAL_WARRANTY_DB,
    resolveJurisdiction: resolveJurisdiction,
    detectProductCategory: detectProductCategory,
    extractMerchantWarranty: extractMerchantWarranty,
    lookupLegalStandard: lookupLegalStandard,
    compareWarrantyGap: compareWarrantyGap,
    buildWarrantyCheck: buildWarrantyCheck,
    formatDaysLabel: formatDaysLabel,
  };
})(typeof window !== "undefined" ? window : globalThis);
