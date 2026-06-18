/**
 * Pauli Best Price — Detektiv-Logik: kein „Verstehe ich nicht“, Hypothesen, Mut zum Handeln.
 */
(function (global) {
  "use strict";

  var LANGS = ["de", "en", "th", "pl", "ru", "zh"];
  var SS_PENDING = "osg-detective-pending-v1";
  var ACT_THRESHOLD = 0.8;
  var HYPOTHESIS_THRESHOLD = 0.42;

  var BANNED_PATTERNS = [
    /\b(tut mir leid|es tut mir leid|entschuldige|entschuldigung)\b/i,
    /\b(ich kann(?:\s+)?nicht|kann ich nicht|das kann ich nicht)\b/i,
    /\b(verstehe ich nicht|ich verstehe(?:\s+)?nicht|habe ich nicht verstanden|nicht verstanden|keine ahnung was du meinst)\b/i,
    /\b(i(?:'m| am) sorry|i cannot|i can't help|can't help|cannot help)\b/i,
    /\b(i don'?t understand|didn'?t understand|don'?t know what you mean)\b/i,
    /\b(ขอโทษ|ไม่เข้าใจ|ทำไม่ได้|ช่วยไม่ได้)\b/i,
    /\b(przepraszam|nie rozumiem|nie mogę pomóc)\b/i,
    /\b(извини|прости|не понимаю|не могу помочь)\b/i,
    /\b(抱歉|对不起|不明白|听不懂|做不到)\b/i,
  ];

  var AFFIRM_PATTERNS = [
    /^(ja|jap|jo|ok|okay|oke|klar|genau|stimmt|bitte|los|go|yep|yes|sure|right)\b/i,
    /^(ใช่|โอเค|ตกลง|เอา|ได้)\b/i,
    /^(tak|dobrze|jasne|ok)\b/i,
    /^(да|ок|хорошо|верно)\b/i,
    /^(对|好|行|可以|嗯)\b/i,
  ];

  var CORRECTION_PATTERNS = [
    /\b(falsch|nicht das|anderes|korrigier|falsch abgebogen|meinte ich nicht|nicht so)\b/i,
    /\b(wrong|not that|correct|fix that|meant something else)\b/i,
    /\b(ไม่ใช่|ผิด|แก้|หมายถึงอย่างอื่น)\b/i,
    /\b(źle|nie to|popraw|inne)\b/i,
    /\b(не то|не так|исправ|другое)\b/i,
    /\b(不对|不是|改一下|另一个)\b/i,
  ];

  var LABELS = {
    autoservice: {
      de: "Werkstatt / Auto-Service",
      en: "workshop / auto service",
      th: "อู่ซ่อม / บริการรถ",
      pl: "warsztat / serwis auta",
      ru: "мастерская / автосервис",
      zh: "修车行 / 汽车服务",
    },
    smartphones: {
      de: "Smartphones",
      en: "smartphones",
      th: "สมาร์ทโฟน",
      pl: "smartfony",
      ru: "смартфоны",
      zh: "智能手机",
    },
    internet: {
      de: "Internet / WLAN",
      en: "internet / Wi‑Fi",
      th: "อินเทอร์เน็ต / Wi‑Fi",
      pl: "internet / Wi‑Fi",
      ru: "интернет / Wi‑Fi",
      zh: "网络 / Wi‑Fi",
    },
    tariff: {
      de: "Handy-Tarife",
      en: "mobile tariffs",
      th: "แพ็กเกจมือถือ",
      pl: "taryfy komórkowe",
      ru: "мобильные тарифы",
      zh: "手机套餐",
    },
    vip: {
      de: "VIP / Gutschein",
      en: "VIP / voucher",
      th: "VIP / คูปอง",
      pl: "VIP / voucher",
      ru: "VIP / купон",
      zh: "VIP / 优惠券",
    },
    support: {
      de: "Kontakt / Support",
      en: "contact / support",
      th: "ติดต่อ / ซัพพอร์ต",
      pl: "kontakt / wsparcie",
      ru: "контакт / поддержка",
      zh: "联系 / 客服",
    },
    gift: {
      de: "Geschenk / Blumen",
      en: "gift / flowers",
      th: "ของขวัญ / ดอกไม้",
      pl: "prezent / kwiaty",
      ru: "подарок / цветы",
      zh: "礼物 / 鲜花",
    },
    finance: {
      de: "Finanzen / Kredit",
      en: "finance / credit",
      th: "การเงิน / สินเชื่อ",
      pl: "finanse / kredyt",
      ru: "финансы / кредит",
      zh: "金融 / 信贷",
    },
  };

  var INTENT_SCORERS = [
    {
      cmdId: "goAutoservice",
      labelKey: "autoservice",
      patterns: [
        /\b(werkstatt|autoservice|auto\s*service|reparatur|kfz|garage|mechanik)\b/i,
        /\b(อู่|ซ่อมรถ|บริการรถ)\b/i,
        /\b(warsztat|serwis\s*aut)\b/i,
        /\b(автосервис|мастерск|ремонт\s*авто)\b/i,
        /\b(修车|汽修|保养)\b/i,
      ],
    },
    {
      cmdId: "goSmartphones",
      labelKey: "smartphones",
      patterns: [
        /\b(smartphone|handy|mobiltelefon|telefon|iphone|android)\b/i,
        /\b(สมาร์ทโฟน|มือถือ|โทรศัพท์)\b/i,
        /\b(smartfon|telefon)\b/i,
        /\b(смартфон|телефон)\b/i,
        /\b(手机|智能手机)\b/i,
      ],
    },
    {
      cmdId: "goInternet",
      labelKey: "internet",
      patterns: [
        /\b(internet|wlan|wifi|wi-fi|breitband|glasfaser|fiber)\b/i,
        /\b(อินเทอร์เน็ต|ไวไฟ|เน็ตบ้าน)\b/i,
        /\b(internet|wi-?fi)\b/i,
        /\b(интернет|вай-?фай)\b/i,
        /\b(宽带|网络|光纤)\b/i,
      ],
    },
    {
      cmdId: "goTariff",
      labelKey: "tariff",
      patterns: [
        /\b(tarif|handytarif|mobilfunk|vertrag|sim)\b/i,
        /\b(แพ็กเกจ|ซิม|ค่ายมือถือ)\b/i,
        /\b(taryf|abonament)\b/i,
        /\b(тариф|симк)\b/i,
        /\b(套餐|资费|流量)\b/i,
      ],
    },
    {
      cmdId: "goVip",
      labelKey: "vip",
      patterns: [
        /\b(vip|gutschein|coupon|rabatt|einl[oö]sen)\b/i,
        /\b(วีไอพี|คูปอง|ส่วนลด)\b/i,
        /\b(voucher|rabat)\b/i,
        /\b(купон|скидк)\b/i,
        /\b(优惠券|VIP)\b/i,
      ],
    },
    {
      cmdId: "openSupport",
      labelKey: "support",
      patterns: [
        /\b(kontakt|support|hilfe|problem|frage)\b/i,
        /\b(ติดต่อ|ช่วย|ปัญหา)\b/i,
        /\b(kontakt|pomoc|wsparcie)\b/i,
        /\b(поддержк|контакт|помощ)\b/i,
        /\b(联系|客服|帮助)\b/i,
      ],
    },
    {
      cmdId: null,
      labelKey: "gift",
      patterns: [
        /\b(geschenk|blumen|pralinen|bouquet)\b/i,
        /\b(gift|flowers|present)\b/i,
        /\b(ของขวัญ|ดอกไม้)\b/i,
        /\b(prezent|kwiat)\b/i,
        /\b(подарок|цвет)\b/i,
        /\b(礼物|鲜花)\b/i,
      ],
    },
    {
      cmdId: null,
      labelKey: "finance",
      patterns: [
        /\b(kredit|zins|bank|versicherung|finanz)\b/i,
        /\b(credit|loan|insurance|finance)\b/i,
        /\b(สินเชื่อ|ธนาคาร|ประกัน)\b/i,
        /\b(kredyt|ubezpieczen)\b/i,
        /\b(кредит|страхов|банк)\b/i,
        /\b(贷款|保险|银行)\b/i,
      ],
    },
  ];

  var LINES = {
    pivot: {
      de: "Kurz sortieren: was genau brauchst du gerade?",
      en: "Let me sort this — what do you need right now?",
      th: "ขอจัดให้ชัดหน่อย — ตอนนี้อยากได้อะไรเป็นพิเศษครับ?",
      pl: "Ułóżmy to: czego dokładnie potrzebujesz?",
      ru: "Давай разложим: что тебе сейчас нужно?",
      zh: "我先理清一下——你现在最需要什么？",
    },
    ack: {
      de: "Alles klar — ich leg los.",
      en: "Got it — I'm on it.",
      th: "โอเค — ผมลงมือเลยครับ",
      pl: "Jasne — działam.",
      ru: "Понял — делаю.",
      zh: "好——我这就办。",
    },
  };

  function normalizeLang(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    if (c === "zh") return "zh";
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function line(lang, bucket, key) {
    var L = normalizeLang(lang);
    var b = LINES[bucket];
    if (!b) return "";
    return String(b[L] || b.en || b.de || "").trim();
  }

  function labelFor(lang, labelKey) {
    var L = normalizeLang(lang);
    var bucket = LABELS[labelKey];
    if (!bucket) return String(labelKey || "");
    return String(bucket[L] || bucket.en || bucket.de || labelKey).trim();
  }

  function isBanned(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    for (var i = 0; i < BANNED_PATTERNS.length; i++) {
      if (BANNED_PATTERNS[i].test(t)) return true;
    }
    return false;
  }

  function sanitizeReply(text, lang) {
    var t = String(text || "").trim();
    if (!t || !isBanned(t)) return t;
    return line(lang, "pivot");
  }

  function isAffirm(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    for (var i = 0; i < AFFIRM_PATTERNS.length; i++) {
      if (AFFIRM_PATTERNS[i].test(t)) return true;
    }
    return false;
  }

  function isCorrection(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    for (var i = 0; i < CORRECTION_PATTERNS.length; i++) {
      if (CORRECTION_PATTERNS[i].test(t)) return true;
    }
    if (global.OSG_PSYCHOLOGY_PROMPTS && typeof global.OSG_PSYCHOLOGY_PROMPTS.isDecline === "function") {
      return global.OSG_PSYCHOLOGY_PROMPTS.isDecline(t);
    }
    return false;
  }

  function scoreIntents(text) {
    var t = String(text || "").trim();
    var out = [];
    var i;
    var j;
    for (i = 0; i < INTENT_SCORERS.length; i++) {
      var sc = INTENT_SCORERS[i];
      var hits = 0;
      for (j = 0; j < sc.patterns.length; j++) {
        if (sc.patterns[j].test(t)) hits += 1;
      }
      if (hits > 0) {
        out.push({
          cmdId: sc.cmdId,
          labelKey: sc.labelKey,
          score: Math.min(1, 0.45 + hits * 0.22),
        });
      }
    }
    out.sort(function (a, b) {
      return b.score - a.score;
    });
    return out;
  }

  function defaultHypotheses(lang) {
    return [
      { labelKey: "autoservice", cmdId: "goAutoservice" },
      { labelKey: "smartphones", cmdId: "goSmartphones" },
      { labelKey: "support", cmdId: "openSupport" },
    ];
  }

  function analyze(text, lang) {
    var t = String(text || "").trim();
    if (!t || t.length < 2) {
      return { kind: "unclear", hypotheses: defaultHypotheses(lang) };
    }
    if (t.length < 4 && !/\d/.test(t)) {
      return { kind: "unclear", hypotheses: defaultHypotheses(lang) };
    }
    var scored = scoreIntents(t);
    var top = scored[0];
    var second = scored[1];
    if (!top) {
      return { kind: "unclear", hypotheses: defaultHypotheses(lang) };
    }
    top.label = labelFor(lang, top.labelKey);
    if (second) second.label = labelFor(lang, second.labelKey);
    if (
      top.score >= ACT_THRESHOLD &&
      top.cmdId &&
      (!second || top.score - second.score >= 0.18)
    ) {
      return {
        kind: "act",
        cmdId: top.cmdId,
        labelKey: top.labelKey,
        label: top.label,
        confidence: top.score,
      };
    }
    if (
      top.score >= HYPOTHESIS_THRESHOLD &&
      second &&
      second.score >= HYPOTHESIS_THRESHOLD - 0.08
    ) {
      return {
        kind: "hypothesis",
        hypotheses: [top, second],
        topScore: top.score,
      };
    }
    if (top.score >= HYPOTHESIS_THRESHOLD) {
      return {
        kind: "hypothesis",
        hypotheses: [top, second || defaultHypotheses(lang)[1]],
        topScore: top.score,
      };
    }
    return { kind: "unclear", hypotheses: defaultHypotheses(lang), topScore: 0 };
  }

  function buildHypothesis(lang, hypotheses) {
    var L = normalizeLang(lang);
    var items = (hypotheses || []).slice(0, 2);
    var a = items[0]
      ? items[0].label || labelFor(L, items[0].labelKey)
      : labelFor(L, "autoservice");
    var b = items[1]
      ? items[1].label || labelFor(L, items[1].labelKey)
      : labelFor(L, "smartphones");
    var templates = {
      de: "Hmm — meinst du eher " + a + " oder " + b + "?",
      en: "Hmm — do you mean " + a + " or " + b + "?",
      th: "อืม — หมายถึง " + a + " หรือ " + b + " ครับ?",
      pl: "Hmm — chodzi o " + a + " czy " + b + "?",
      ru: "Хм — ты про " + a + " или " + b + "?",
      zh: "嗯——你是说" + a + "还是" + b + "？",
    };
    return String(templates[L] || templates.en).trim();
  }

  function buildActWithCheck(lang, topicLabel) {
    var L = normalizeLang(lang);
    var topic = String(topicLabel || "").trim() || labelFor(L, "support");
    var templates = {
      de: "Ich würde das mal auf " + topic + " legen — passt das so, okay?",
      en: "I'd set this up for " + topic + " — does that work, okay?",
      th: "ผมจะจัดให้ทาง " + topic + " ก่อนนะ — โอเคไหมครับ?",
      pl: "Ustawię to na " + topic + " — pasuje, okay?",
      ru: "Я бы направил это в " + topic + " — так норм, ок?",
      zh: "我先按" + topic + "来安排——这样可以吗？",
    };
    return String(templates[L] || templates.en).trim();
  }

  function buildCorrection(lang, topicLabel) {
    var L = normalizeLang(lang);
    var topic = String(topicLabel || "").trim();
    var templates = {
      de: topic
        ? "Da bin ich falsch abgebogen — lass uns das mit " + topic + " korrigieren."
        : "Da bin ich falsch abgebogen — lass uns das korrigieren.",
      en: topic
        ? "Wrong turn there — let's fix this with " + topic + "."
        : "Wrong turn there — let's correct course.",
      th: topic
        ? "ผมเลี้ยวผิดทาง — มาแก้ทาง " + topic + " กันครับ"
        : "ผมเลี้ยวผิดทาง — มาแก้ทางใหม่กันครับ",
      pl: topic
        ? "Zły skręt — poprawmy to na " + topic + "."
        : "Zły skręt — poprawmy kurs.",
      ru: topic
        ? "Свернул не туда — давай поправим через " + topic + "."
        : "Свернул не туда — давай поправим курс.",
      zh: topic
        ? "我走岔了——咱们按" + topic + "纠正一下。"
        : "我走岔了——咱们纠正一下。",
    };
    return String(templates[L] || templates.en).trim();
  }

  function readPending() {
    try {
      var raw = global.sessionStorage.getItem(SS_PENDING);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : null;
    } catch (_) {
      return null;
    }
  }

  function savePending(cmdId, labelKey, label) {
    if (!cmdId) return;
    try {
      global.sessionStorage.setItem(
        SS_PENDING,
        JSON.stringify({
          cmdId: String(cmdId),
          labelKey: String(labelKey || ""),
          label: String(label || ""),
          at: Date.now(),
        })
      );
    } catch (_) {}
  }

  function clearPending() {
    try {
      global.sessionStorage.removeItem(SS_PENDING);
    } catch (_) {}
  }

  function lastTopicLabel(lang) {
    var p = readPending();
    if (!p) return "";
    if (p.label) return p.label;
    if (p.labelKey) return labelFor(lang, p.labelKey);
    return "";
  }

  function resolveTurn(userText, lang) {
    lang = normalizeLang(lang);
    var text = String(userText || "").trim();
    if (isCorrection(text)) {
      clearPending();
      return { type: "correction", line: buildCorrection(lang, lastTopicLabel(lang)) };
    }
    var pending = readPending();
    if (pending && pending.cmdId && isAffirm(text)) {
      return {
        type: "execute",
        cmdId: pending.cmdId,
        line: line(lang, "ack"),
        pending: pending,
      };
    }
    if (pending && isCorrection(text)) {
      clearPending();
      return { type: "correction", line: buildCorrection(lang, pending.label) };
    }
    var analysis = analyze(text, lang);
    if (analysis.kind === "act" && analysis.cmdId) {
      savePending(analysis.cmdId, analysis.labelKey, analysis.label);
      return {
        type: "act_check",
        line: buildActWithCheck(lang, analysis.label),
        analysis: analysis,
      };
    }
    if (analysis.kind === "hypothesis" || analysis.kind === "unclear") {
      if (!analysis.topScore || analysis.topScore < HYPOTHESIS_THRESHOLD) {
        return null;
      }
      return {
        type: "hypothesis",
        line: buildHypothesis(lang, analysis.hypotheses),
        analysis: analysis,
      };
    }
    return null;
  }

  global.OSG_DETECTIVE_LOGIC = {
    LANGS: LANGS,
    ACT_THRESHOLD: ACT_THRESHOLD,
    BANNED_PATTERNS: BANNED_PATTERNS,
    normalizeLang: normalizeLang,
    isBanned: isBanned,
    sanitizeReply: sanitizeReply,
    isAffirm: isAffirm,
    isCorrection: isCorrection,
    analyze: analyze,
    buildHypothesis: buildHypothesis,
    buildActWithCheck: buildActWithCheck,
    buildCorrection: buildCorrection,
    defaultHypotheses: defaultHypotheses,
    readPending: readPending,
    savePending: savePending,
    clearPending: clearPending,
    resolveTurn: resolveTurn,
    labelFor: labelFor,
  };
})(typeof window !== "undefined" ? window : globalThis);
