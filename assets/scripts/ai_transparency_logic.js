/**
 * Pauli Best Price — KI-Transparenz bei kritischen Themen (Recht/Finanzen).
 */
(function (global) {
  "use strict";

  var LANGS = [
    "th", "en", "de", "pl", "ru", "zh",
    "fr", "es", "it", "pt", "nl",
    "ar", "ja", "ko", "vi", "tr", "hi", "id",
  ];

  var AI_HINT = {
    de: "Da ich eine AI bin, bitte prüfe diesen Entwurf kurz gegen deinen Beleg.",
    en: "As an AI, please quickly check this draft against your proof of purchase.",
    th: "เพราะผมเป็น AI กรุณาตรวจร่างนี้กับหลักฐานการซื้อของคุณสั้น ๆ",
    pl: "Jako AI — szybko sprawdź ten szkic z dowodem zakupu.",
    ru: "Я ИИ — пожалуйста, сверьте этот черновик с вашим чеком.",
    zh: "我是人工智能，请对照您的购物凭证快速核对本草稿。",
  };

  var FINANCE_TOPIC_PATTERNS = [
    /\b(kredit|credit|zins|loan|versicher|insur|finance|finanz|bank|hypothek|mortgage|card|immobil|real[\s-]?estate|wohnung|haus|miete|auto[\s-]?kauf|fahrzeug|dealer|steuer|tax|invest)\b/i,
    /\b(บัตร|ประกัน|ดอกเบี้ย|อสังห|รถยนต์|ธนาคาร)\b/i,
    /\b(ubezpieczen|kredyt|odsetk|nieruchom)\b/i,
    /\b(кредит|страхов|недвижим|авто|банк)\b/i,
    /\b(贷款|保险|利息|房产|汽车|银行|税务)\b/i,
  ];

  function normalizeLang(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    if (c === "zh") return "zh";
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function line(bucket, lang) {
    return String((bucket && (bucket[normalizeLang(lang)] || bucket.en || bucket.de)) || "").trim();
  }

  function matchesAny(text, patterns) {
    var t = String(text || "");
    var i;
    for (i = 0; i < patterns.length; i++) {
      if (patterns[i].test(t)) return true;
    }
    return false;
  }

  function isFinanceTopic(text) {
    if (
      typeof global.osgAvatarFinanceTopicDetect === "function" &&
      global.osgAvatarFinanceTopicDetect(text)
    ) {
      return true;
    }
    return matchesAny(text, FINANCE_TOPIC_PATTERNS);
  }

  function isLegalTopic(text) {
    var RC = global.OSG_RECLAMATION_COMPLIANCE;
    if (!RC) return false;
    if (typeof RC.isReclamationTopic === "function" && RC.isReclamationTopic(text)) {
      return true;
    }
    if (typeof RC.referencesLaw === "function" && RC.referencesLaw(text)) {
      return true;
    }
    if (typeof RC.looksLikeDraft === "function" && RC.looksLikeDraft(text)) {
      return true;
    }
    return false;
  }

  function isCriticalTopic(userText, replyText) {
    var blob = String(userText || "") + " " + String(replyText || "");
    return isFinanceTopic(blob) || isLegalTopic(blob);
  }

  function aiHintFor(lang) {
    return line(AI_HINT, lang);
  }

  function hasAiHint(text) {
    return /da ich eine ai bin|da ich eine ki bin|as an ai|เป็น ai|jako ai|это ai|为 ai/i.test(
      String(text || "")
    );
  }

  function appendIfNeeded(replyText, lang, userText) {
    var body = String(replyText || "").trim();
    if (!body) return body;
    if (!isCriticalTopic(userText, body)) return body;
    var hint = aiHintFor(lang);
    if (!hint || hasAiHint(body)) return body;
    return body + "\n\n" + hint;
  }

  global.OSG_AI_TRANSPARENCY = {
    LANGS: LANGS,
    normalizeLang: normalizeLang,
    isCriticalTopic: isCriticalTopic,
    isFinanceTopic: isFinanceTopic,
    isLegalTopic: isLegalTopic,
    aiHintFor: aiHintFor,
    appendIfNeeded: appendIfNeeded,
    hasAiHint: hasAiHint,
  };
})(typeof window !== "undefined" ? window : globalThis);
