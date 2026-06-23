/**
 * Lokale Intent-Erkennung (Regex) — schützt OpenAI-Budget bei Standard-Anfragen.
 * Anzeigetexte kommen aus i18n (packKey), nicht aus diesem Modul.
 */
class IntentClassifierService {
  constructor() {
    this.patterns = {
      GREETING:
        /^(?:hello|hi|hey|howdy|sawadee|sawatdee|hallo|guten\s+tag|moin|servus|สวัสดี|ดี(?:ครับ|ค่ะ)?|dzień\s+dobry|cześć|witaj|привет|здравствуй|你好|您好)\b/i,
      ACCESSIBILITY:
        /(?:read(?:\s+aloud)?|show|contrast|screen\s*reader|vorlesen|vorlese|text(?:größe|groesse)?|barriere(?:frei)?|blind|sehhilfe|a11y|accessibility|barrierefrei|kontrast|größer|groesser|увелич|контраст|dostępno|无障碍|朗读)/i,
      READ_PRICE:
        /(?:price|cost|how\s+much|preis|kosten|wie\s+viel|baht|euro|thb|zł|zloty|ราคา|เท่าไหร่|cena|koszt|сколько|стоит|价格|多少钱)/i,
      FUN_STUFF:
        /(?:joke|fun|laugh|witz|spaß|spass|krabbe|crab|humor|ล้อเล่น|ตลก|шутк|анекдот)/i,
    };

    this.intentMeta = {
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
  }

  /**
   * @param {string} utterance
   * @param {string} [_lang] BCP-like UI language (reserved for future rules)
   * @returns {{ intent: string, allowOpenAI: boolean, speechKey: string|null, packKey: string|null }}
   */
  classify(utterance, _lang) {
    const text = String(utterance || "").trim();
    if (!text) {
      return {
        intent: "EMPTY",
        allowOpenAI: false,
        speechKey: null,
        packKey: null,
      };
    }

    if (this.patterns.GREETING.test(text)) {
      return this._local("GREETING");
    }
    if (this.patterns.ACCESSIBILITY.test(text)) {
      return this._local("ACCESSIBILITY");
    }
    if (this.patterns.READ_PRICE.test(text)) {
      return this._local("READ_PRICE");
    }
    if (this.patterns.FUN_STUFF.test(text)) {
      return this._local("FUN_SMALLTALK");
    }

    return {
      intent: "COMPLEX_PRODUCT_COMPARISON",
      allowOpenAI: true,
      speechKey: null,
      packKey: null,
    };
  }

  _local(intent) {
    const meta = this.intentMeta[intent] || {};
    return {
      intent,
      allowOpenAI: false,
      speechKey: meta.speechKey || null,
      packKey: meta.packKey || null,
      segmentKey: meta.segmentKey || null,
    };
  }
}

export default new IntentClassifierService();
