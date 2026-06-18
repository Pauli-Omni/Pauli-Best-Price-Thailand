/**
 * Pauli Best Price Thailand — Empathy-Logic-Library (Schlüsselwort → Eskalations-Trigger).
 * Fokus: Zuhören zuerst, Verkauf als zweiter Hilfeschritt. Kein Druck.
 */
(function (global) {
  "use strict";

  var EMOTION_BY_TRIGGER = {
    verliebt_mode: "love",
    relationship_bridge: "separation",
    grief_relationship: "separation",
    sadness_anger: "anger",
  };

  var SS_EMPATHY_RETREAT = "osg-empathy-retreat-v1";

  var TRIGGERS = [
    {
      id: "verliebt_mode",
      emotion: "love",
      priority: 96,
      scrollTarget:
        'a.osg-affiliate-link[data-osg-partner="boots"], a.osg-affiliate-link[data-osg-partner="watsons"], #partner-affiliate-panel',
      patterns: [
        /\b(verliebt|verknallt|schwarm|crush|hin\s+und\s+weg|traumhaft|angebetet)\b/i,
        /\b(mädchen|junge|frau|typ)\b/i,
        /\b(smitten|head\s+over\s+heels|dreamy|dream\s+girl|in\s+love)\b/i,
        /\b(หลงรัก|ตกหลุมรัก|สาว|ฝัน|หลงใหล)\b/i,
        /\b(zakochany|zakochana|dziewczyna|zauroczony|marzenie)\b/i,
        /\b(влюбл|девушк|мечта|по\s+уши)\b/i,
        /\b(迷恋|暗恋|女孩|心动|梦幻)\b/i,
      ],
    },
    {
      id: "housing_stress",
      emotion: "stress",
      priority: 95,
      scrollTarget: 'a.osg-affiliate-link[data-osg-partner="real_estate_th"]',
      patterns: [
        /\b(immobilie|immobilien|wohnung|miete|mieten|haus\s+kaufen|eigentum|zu\s+teuer|krawatte|makler|hipflat|real\s*estate)\b/i,
        /\b(condo|rent|mortgage|landlord|property|housing)\b/i,
        /\b(ค่าเช่า|บ้าน|คอนโด|อสังหา|แพงเกิน)\b/i,
        /\b(mieszkanie|czynsz|nieruchom|za\s+drogo)\b/i,
        /\b(квартир|аренд|недвижим|ипотек|дорого)\b/i,
        /\b(房租|买房|公寓|太贵|房产)\b/i,
      ],
    },
    {
      id: "relationship_bridge",
      emotion: "separation",
      priority: 93,
      scrollTarget:
        'a.osg-affiliate-link[data-osg-partner="boots"], a.osg-affiliate-link[data-osg-partner="watsons"]',
      patterns: [
        /\b(streit|zank|entfremd|trennung|verlassen|herzschmerz|beziehung\s+vorbei|ex[\s-]?freund|eifersucht)\b/i,
        /\b(freundin\s+weg|freund\s+weg|einsam|allein\s+gelassen)\b/i,
        /\b(beziehung|partnerin|partner|freundin|freund|ehefrau|ehemann|vermiss)\b/i,
        /\b(arguing|breakup|dumped|lonely|heartbroken|left\s+me|she\s+left|he\s+left|make\s+up)\b/i,
        /\b(relationship|girlfriend|boyfriend|wife|husband|miss\s+her|miss\s+him)\b/i,
        /\b(ทะเลาะ|เลิกกัน|โดนทิ้ง|เหงา|อกหัก|แฟน|คู่รัก)\b/i,
        /\b(kłótnia|rozstanie|porzucił|porzuciła|samotn|związek|małżon)\b/i,
        /\b(ссор|бросил|бросила|одинок|расста|отношен)\b/i,
        /\b(吵架|分手|被甩|孤单|心碎|女朋友|男朋友|老婆|老公)\b/i,
      ],
    },
    {
      id: "grief_relationship",
      emotion: "separation",
      priority: 91,
      scrollTarget:
        'a.osg-affiliate-link[data-osg-partner="boots"], a.osg-affiliate-link[data-osg-partner="watsons"]',
      patterns: [
        /\b(freundin\s+weg|freund\s+weg|trennung|verlassen|einsam|allein\s+gelassen|herzschmerz|beziehung\s+vorbei|ex[\s-]?freund)\b/i,
        /\b(breakup|dumped|lonely|heartbroken|left\s+me|she\s+left|he\s+left)\b/i,
        /\b(เลิกกัน|โดนทิ้ง|เหงา|อกหัก)\b/i,
        /\b(rozstanie|porzucił|porzuciła|samotn|złamane\s+serce)\b/i,
        /\b(бросил|бросила|одинок|расста|разрыв)\b/i,
        /\b(分手|被甩|孤单|心碎)\b/i,
      ],
    },
    {
      id: "sadness_anger",
      emotion: "anger",
      priority: 80,
      scrollTarget: null,
      patterns: [
        /\b(traurig|trauer|deprim|niedergeschlagen|hilflos|weinen|ängstlich)\b/i,
        /\b(ärger|ärgerlich|wütend|sauer|genervt|frustriert|stress|gestresst|sauer\s+auf)\b/i,
        /\b(sad|depressed|angry|furious|stressed|upset|frustrated|mad\b|pissed)\b/i,
        /\b(เศร้า|เครียด|โกรธ|หงุดหงิด)\b/i,
        /\b(smutn|zły|zła|wkurz|stres)\b/i,
        /\b(грустн|злой|злая|стресс|расстроен)\b/i,
        /\b(难过|生气|压力|沮丧)\b/i,
      ],
    },
    {
      id: "new_beginning",
      priority: 70,
      scrollTarget: "#partner-affiliate-panel",
      patterns: [
        /\b(neuanfang|neu\s+anfangen|von\s+vorne|frischer\s+start|neuer\s+abschnitt)\b/i,
        /\b(fresh\s+start|new\s+chapter|start\s+over|turning\s+page)\b/i,
        /\b(เริ่มต้นใหม่|หน้าใหม่)\b/i,
        /\b(nowy\s+początek|zacząć\s+od\s+nowa)\b/i,
        /\b(новая\s+глава|начать\s+заново)\b/i,
        /\b(新开始|重新开始)\b/i,
      ],
    },
    {
      id: "improvement_wish",
      priority: 65,
      scrollTarget: "#partner-affiliate-panel",
      patterns: [
        /\b(verbesser|besser\s+werden|optimier|upgrade|wunsch|ich\s+will\s+besser)\b/i,
        /\b(improve|better\s+life|level\s+up|wish\s+to)\b/i,
        /\b(อยากดีขึ้น|ปรับปรุง|พัฒนา)\b/i,
        /\b(poprawić|chcę\s+lepiej)\b/i,
        /\b(улучш|хочу\s+лучше)\b/i,
        /\b(改善|想变得更好)\b/i,
      ],
    },
  ];

  function analyze(text) {
    var t = String(text || "").trim();
    if (!t || t.length < 4) return null;
    var best = null;
    var i;
    var j;
    for (i = 0; i < TRIGGERS.length; i++) {
      var tr = TRIGGERS[i];
      for (j = 0; j < tr.patterns.length; j++) {
        if (tr.patterns[j].test(t)) {
          if (!best || tr.priority > best.priority) {
            best = {
              triggerId: tr.id,
              emotion: tr.emotion || EMOTION_BY_TRIGGER[tr.id] || "other",
              priority: tr.priority,
            };
          }
          break;
        }
      }
    }
    return best;
  }

  function classifyEmotion(text) {
    var hit = analyze(text);
    if (!hit) return null;
    return {
      emotion: hit.emotion,
      triggerId: hit.triggerId,
      priority: hit.priority,
    };
  }

  function isEmpathyRetreatActive() {
    try {
      return sessionStorage.getItem(SS_EMPATHY_RETREAT) === "1";
    } catch (_) {
      return false;
    }
  }

  function markEmpathyRetreat() {
    try {
      sessionStorage.setItem(SS_EMPATHY_RETREAT, "1");
    } catch (_) {}
  }

  function clearEmpathyRetreat() {
    try {
      sessionStorage.removeItem(SS_EMPATHY_RETREAT);
    } catch (_) {}
  }

  function getScrollTarget(triggerId) {
    var id = String(triggerId || "");
    for (var i = 0; i < TRIGGERS.length; i++) {
      if (TRIGGERS[i].id === id) return TRIGGERS[i].scrollTarget || null;
    }
    return null;
  }

  function resolveTriggerId(triggerId) {
    var id = String(triggerId || "").trim();
    if (id === "grief_relationship") return "relationship_bridge";
    return id;
  }

  function focusPartnerHint(triggerId) {
    var sel = getScrollTarget(resolveTriggerId(triggerId));
    if (!sel) return false;
    try {
      var el = document.querySelector(sel);
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("osg-empathy-partner-hint");
      setTimeout(function () {
        try {
          el.classList.remove("osg-empathy-partner-hint");
        } catch (_) {}
      }, 4200);
      return true;
    } catch (_) {
      return false;
    }
  }

  global.OSG_EMPATHY_LOGIC = {
    TRIGGERS: TRIGGERS,
    EMOTION_BY_TRIGGER: EMOTION_BY_TRIGGER,
    analyze: analyze,
    classifyEmotion: classifyEmotion,
    isEmpathyRetreatActive: isEmpathyRetreatActive,
    markEmpathyRetreat: markEmpathyRetreat,
    clearEmpathyRetreat: clearEmpathyRetreat,
    getScrollTarget: getScrollTarget,
    resolveTriggerId: resolveTriggerId,
    focusPartnerHint: focusPartnerHint,
  };
})(typeof window !== "undefined" ? window : globalThis);
