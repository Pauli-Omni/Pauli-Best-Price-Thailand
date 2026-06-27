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
      TIME_QUERY:
        /(?:what\s+time(?:\s+is\s+it)?|what(?:'s|\s+is)\s+the\s+time|how\s+late(?:\s+is\s+it)?|current\s+time|time\s+now|wie\s+(?:viel\s+uhr|spät)(?:\s+ist\s+(?:es|s)?)?|uhrzeit|welche\s+(?:uhr|zeit)|what\s+o['']?clock|กี่โมง(?:แล้ว)?|(?:ตอ)?(?:นี้)?กี่โมง|(?:เวลา)?กี่(?:โมง|นาฬิกา)|która\s+godzina|jaka\s+(?:jest\s+)?godzina|сколько\s+времени|который\s+(?:сейчас\s+)?час|几点(?:了|钟)?|现在几点|幾點|何時)/i,
      READ_PRICE:
        /(?:price|cost|how\s+much(?!\s+time\b)|preis|kosten|wie\s+viel(?!\s*(?:uhr|ist\s+es|zeit\b)|$)|baht|euro|thb|zł|zloty|ราคา|เท่าไหร่|cena|koszt|сколько\s+стоит|стоит|价格|多少钱)/i,
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
    if (this.patterns.TIME_QUERY.test(text)) {
      return {
        intent: "TIME_QUERY",
        allowOpenAI: true,
        speechKey: null,
        packKey: null,
        segmentKey: null,
      };
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
