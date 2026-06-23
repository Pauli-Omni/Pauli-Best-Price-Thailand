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
    fr: "En tant qu'IA, vérifiez rapidement ce brouillon par rapport à votre preuve d'achat.",
    es: "Como IA, verifica rápidamente este borrador con tu comprobante de compra.",
    it: "Come IA, verifica rapidamente questa bozza con la tua prova d'acquisto.",
    pt: "Como IA, verifique rapidamente este rascunho com o seu comprovante de compra.",
    nl: "Als AI, controleer dit concept snel aan de hand van uw aankoopbewijs.",
    ar: "بوصفي ذكاءً اصطناعياً، يرجى التحقق من هذا المسودة مقابل إيصال الشراء.",
    ja: "AIとして、このドラフトを購入証明書と照らし合わせてご確認ください。",
    ko: "AI로서, 이 초안을 구매 영수증과 빠르게 대조해 주세요.",
    vi: "Là AI, hãy nhanh chóng kiểm tra bản thảo này với hóa đơn mua hàng.",
    tr: "Bir yapay zeka olarak, lütfen bu taslağı satın alma kanıtınızla hızlıca karşılaştırın.",
    hi: "एक AI के रूप में, कृपया इस ड्राफ्ट को अपने खरीद प्रमाण के विरुद्ध जल्दी से जांचें।",
    id: "Sebagai AI, mohon periksa draf ini dengan bukti pembelian Anda sebentar.",
  };

  // Finance topics + Real estate + Auto + Credit cards (all 18 languages)
  var FINANCE_TOPIC_PATTERNS = [
    // European / Latin (de, en, fr, es, it, pt, nl, pl)
    /\b(kredit(?:karte)?|credit[\s-]?card|kreditkarte|zins|effektivzins|loan|versicher|insur|finance|finanz|bank|hypothek|mortgage|kreditlimit|card\b|immobil|real[\s-]?estate|wohnung|haus|miete|mietvertrag|auto[\s-]?kauf|fahrzeug|dealer|pkw|kfz|steuer|tax|invest|rente|rendite|depot|wertpapier|aktien)\b/i,
    // Thai (insurance, interest, real estate, car, bank, credit card, mortgage)
    /\b(บัตรเครดิต|บัตร|ประกัน|ดอกเบี้ย|อสังหาริมทรัพย์|อสังห|รถยนต์|รถ|ธนาคาร|สินเชื่อ|จำนอง|ลงทุน|กู้|เช่า|อพาร์ต)\b/i,
    // Polish
    /\b(ubezpieczen|kredyt|karta(?:\s+kredytowa)?|odsetk|nieruchom|samochod|pojazd|banku|hipoteka|leasing|inwestycj)\b/i,
    // Russian
    /\b(кредит(?:ная\s+карта)?|страхов|недвижим|авто(?:кредит)?|банк|ипотека|рассрочка|инвестиц|процент)\b/i,
    // Chinese
    /\b(贷款|保险|利息|房产|汽车|银行|税务|信用卡|按揭|投资|租房|车贷)\b/i,
    // Japanese
    /\b(クレジット|ローン|保険|金利|不動産|自動車|銀行|住宅|ローン|投資)\b/i,
    // Korean
    /\b(신용카드|대출|보험|금리|부동산|자동차|은행|담보|투자|렌트)\b/i,
    // Arabic
    /\b(قرض|ائتمان|بطاقة[\s\u0600-\u06FF]*ائتمان|تأمين|فائدة|عقار|سيارة|بنك|رهن|استثمار)\b/i,
    // Hindi
    /\b(ऋण|बीमा|ब्याज|संपत्ति|कार|बैंक|क्रेडिट|निवेश|किराया|वाहन)\b/i,
    // Vietnamese
    /\b(vay|thẻ[\s-]*tín[\s-]*dụng|bảo[\s-]*hiểm|lãi[\s-]*suất|bất[\s-]*động[\s-]*sản|ô[\s-]*tô|ngân[\s-]*hàng|đầu[\s-]*tư|thế[\s-]*chấp)\b/i,
    // Turkish
    /\b(kredi[\s-]*kart|kredi|sigorta|faiz|gayrimenkul|araba|banka|yatırım|ipotek|kiralık)\b/i,
    // Indonesian/Malay
    /\b(kredit|kartu[\s-]*kredit|asuransi|bunga|properti|mobil|bank|investasi|kpr|cicilan)\b/i,
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
