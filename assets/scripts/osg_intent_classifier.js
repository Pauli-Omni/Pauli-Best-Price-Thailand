/**
 * Client-Spiegel von IntentClassifierService — gleiche Regex, kein OpenAI für Standard-Intents.
 */
(function (global) {
  "use strict";

  var PATTERNS = {
    GREETING:
      /^(?:hello|hi|hey|howdy|sawadee|sawatdee|hallo|guten\s+tag|moin|servus|สวัสดี|ดี(?:ครับ|ค่ะ)?|dzień\s+dobry|cześć|witaj|привет|здравствуй|你好|您好)\b/i,
    ACCESSIBILITY:
      /(?:read(?:\s+aloud)?|show|contrast|screen\s*reader|vorlesen|vorlese|text(?:größe|groesse)?|barriere(?:frei)?|blind|sehhilfe|a11y|accessibility|barrierefrei|kontrast|größer|groesser|увелич|контраст|dostępno|无障碍|朗读)/i,
    READ_PRICE:
      /(?:price|cost|how\s+much|preis|kosten|wie\s+viel|baht|euro|thb|zł|zloty|ราคา|เท่าไหร่|cena|koszt|сколько|стоит|价格|多少钱)/i,
    FUN_STUFF:
      /(?:joke|fun|laugh|witz|spaß|spass|krabbe|crab|humor|ล้อเล่น|ตลก|шутк|анекдот)/i,
  };

  var META = {
    GREETING: {
      speechKey: "pauliSawadee",
      packKey: "pauliSawadeeTts",
      segmentKey: "welcome_short",
    },
    ACCESSIBILITY: {
      speechKey: "accessibility_activated",
      packKey: "intentAccessibilityTts",
      segmentKey: "welcome_short",
    },
    READ_PRICE: {
      speechKey: "search_processing",
      packKey: "intentReadPriceTts",
      segmentKey: "search_action",
    },
    FUN_SMALLTALK: {
      speechKey: "fun_crab_instinct",
      packKey: "intentFunCrabTts",
      segmentKey: "save_money",
    },
  };

  function localHit(intent) {
    var meta = META[intent] || {};
    return {
      intent: intent,
      allowOpenAI: false,
      speechKey: meta.speechKey || null,
      packKey: meta.packKey || null,
      segmentKey: meta.segmentKey || null,
    };
  }

  function classify(utterance, _lang) {
    var text = String(utterance || "").trim();
    if (!text) {
      return {
        intent: "EMPTY",
        allowOpenAI: false,
        speechKey: null,
        packKey: null,
      };
    }
    if (PATTERNS.GREETING.test(text)) return localHit("GREETING");
    if (PATTERNS.ACCESSIBILITY.test(text)) return localHit("ACCESSIBILITY");
    if (PATTERNS.READ_PRICE.test(text)) return localHit("READ_PRICE");
    if (PATTERNS.FUN_STUFF.test(text)) return localHit("FUN_SMALLTALK");
    return {
      intent: "COMPLEX_PRODUCT_COMPARISON",
      allowOpenAI: true,
      speechKey: null,
      packKey: null,
    };
  }

  global.OSG_INTENT_CLASSIFIER = { classify: classify };
})(typeof window !== "undefined" ? window : globalThis);
