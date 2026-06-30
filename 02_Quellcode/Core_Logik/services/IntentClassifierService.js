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
      DELIVERY_CHOOSE_SEVEN:
        /(?:ich\s+)?(?:möchte|will|wähle|nehme|nutze|lieber).*(?:7[\s-]*eleven|seven[\s-]*pickup|เซเว่น|รับที่\s*7)|(?:7[\s-]*eleven|abholung\s+bei\s+7|seven\s+pickup|pick\s*up\s+at\s+7|รับที่\s*7).*(?:bitte|danke|ja|please|ครับ|ค่ะ)?$|(?:^|\s)(?:7[\s-]*eleven|seven\s+pickup)(?:\s|$)/i,
      DELIVERY_CHOOSE_HOME:
        /(?:lieber|nach)\s+hause|home\s+deliver(?:y)?|hauslieferung|deliver(?:y)?\s+to\s+(?:my\s+)?home|ส่งถึงบ้าน|จัดส่งถึงบ้าน|do\s+domu|доставк[аи]\s+домой|送货上门|送回家/i,
      DELIVERY_RECOMMEND:
        /(?:was|welche).*(?:empfiehl|empfehl)|(?:empfiehl|recommend|empfehlung|แนะนำ).*(?:liefer|deliver|รับ|ส่ง)|(?:vorteile|benefits|ข้อดี).*(?:7[\s-]*eleven|seven|เซเว่น)|(?:7[\s-]*eleven|seven).*(?:vorteile|benefits|ข้อดี)/i,
      DELIVERY_COMPARE:
        /(?:welche\s+lieferung|liefer(?:ung|art).*(?:vergleich|unterschied|option)|compare.*deliver|delivery\s+compare|beide\s+(?:option|möglichkeit)|unterschied.*(?:haus|seven|7)|เปรียบเทียบ.*(?:ส่ง|รับ)|сравн.*достав)/i,
      DELIVERY_HOME_WAIT:
        /(?:muss\s+ich\s+(?:zu\s+)?hause|zu\s+hause\s+(?:sein|warten)|wait\s+at\s+home|home\s+when\s+deliver|ต้องอยู่บ้าน|ต้องรอที่บ้าน)/i,
      DELIVERY_SAFE:
        /(?:sicher(?:e)?\s+abhol|safe\s+pickup|vor\s+der\s+(?:tür|wohnung)|unbeaufsichtigt|nicht\s+vor\s+der\s+tür|nass|rampe|ปลอดภัย|หน้าประตู)/i,
      DELIVERY_PHONE:
        /(?:telefon|anruf|driver\s+call|phone\s+stress|โทร|รับสาย|звонок\s+курьер)/i,
      DELIVERY_BUNDLE:
        /(?:sammel|bündel|gebündelt|bundle|hub|mehrere\s+liefer|รวม.*ส่ง|склад.*достав)/i,
      DELIVERY_NIGHT:
        /(?:nachts?\s+abhol|abends?\s+abhol|nachts?\s+holen|rund\s+um\s+die\s+uhr|24\s*\/\s*7|open\s+late|กลางคืน|ดึก|ночью|夜间|晚上.*取)/i,
      READ_PRICE:
        /(?:price|cost|how\s+much(?!\s+time\b)|preis|kosten|wie\s+viel(?!\s*(?:uhr|ist\s+es|zeit\b)|$)|baht|euro|thb|zł|zloty|ราคา|เท่าไหร่|cena|koszt|сколько\s+стоит|стоит|价格|多少钱)/i,
      FUN_STUFF:
        /(?:joke|fun|laugh|witz|spaß|spass|krabbe|crab|humor|ล้อเล่น|ตลก|шутк|анекдот)/i,
    };

    this.deliveryIntentOrder = [
      ["DELIVERY_RECOMMEND", "delivery_recommend"],
      ["DELIVERY_COMPARE", "delivery_compare"],
      ["DELIVERY_HOME_WAIT", "delivery_home_wait"],
      ["DELIVERY_SAFE", "delivery_safe"],
      ["DELIVERY_PHONE", "delivery_phone"],
      ["DELIVERY_BUNDLE", "delivery_bundle"],
      ["DELIVERY_NIGHT", "delivery_night"],
      ["DELIVERY_CHOOSE_SEVEN", "delivery_choose_seven"],
      ["DELIVERY_CHOOSE_HOME", "delivery_choose_home"],
    ];

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
      delivery_choose_seven: {
        speechKey: "delivery.choiceConfirmSevenTts",
        packKey: "delivery.choiceConfirmSeven",
        segmentKey: "delivery_choice",
        action: "choose_seven",
      },
      delivery_choose_home: {
        speechKey: "delivery.choiceConfirmHomeTts",
        packKey: "delivery.choiceConfirmHome",
        segmentKey: "delivery_choice",
        action: "choose_home",
      },
      delivery_compare: {
        speechKey: "delivery.voice.compareShortTts",
        packKey: "delivery.voice.compareShortTts",
        segmentKey: "delivery_choice",
        action: "speak_compare",
      },
      delivery_recommend: {
        speechKey: "delivery.voice.recommendFullTts",
        packKey: "delivery.voice.recommendFullTts",
        segmentKey: "delivery_choice",
        action: "speak_recommend",
      },
      delivery_safe: {
        speechKey: "delivery.voice.safeTts",
        packKey: "delivery.voice.safeTts",
        segmentKey: "delivery_choice",
        action: "speak_safe",
      },
      delivery_phone: {
        speechKey: "delivery.voice.phoneTts",
        packKey: "delivery.voice.phoneTts",
        segmentKey: "delivery_choice",
        action: "speak_phone",
      },
      delivery_bundle: {
        speechKey: "delivery.voice.bundleTts",
        packKey: "delivery.voice.bundleTts",
        segmentKey: "delivery_choice",
        action: "speak_bundle",
      },
      delivery_night: {
        speechKey: "delivery.voice.nightTts",
        packKey: "delivery.voice.nightTts",
        segmentKey: "delivery_choice",
        action: "speak_night",
      },
      delivery_home_wait: {
        speechKey: "delivery.voice.homeWaitTts",
        packKey: "delivery.voice.homeWaitTts",
        segmentKey: "delivery_choice",
        action: "speak_home_wait",
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
    for (let di = 0; di < this.deliveryIntentOrder.length; di += 1) {
      const [patternKey, intentId] = this.deliveryIntentOrder[di];
      if (this.patterns[patternKey].test(text)) {
        return this._local(intentId);
      }
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
      action: meta.action || null,
    };
  }
}

export default new IntentClassifierService();
