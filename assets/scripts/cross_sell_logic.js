/**
 * Pauli Best Price — Cross-Selling & situative Anschluss-Ideen.
 * Skalierung: Sprüche pro Sprache in OSG_PSYCHOLOGY_PROMPTS; Länder via assets/locales/{lang}.json.
 */
(function (global) {
  "use strict";

  var PARTNER_GROUP = {
    homepro: "tools",
    boonthavorn: "carpet",
    honda_mofa: "moped",
    yamaha_mofa: "moped",
    kawasaki_th: "moped",
    suzuki_th: "moped",
    toyota_th: "auto",
    real_estate_th: "real_estate",
    boots: "beauty",
    watsons: "beauty",
    lazada_th: "marketplace",
    shopee_th: "marketplace",
    bigc: "retail",
    lotuss: "retail",
  };

  var MODULE_BY_GROUP = {
    tools: "cross_tools",
    carpet: "cross_carpet",
    moped: "cross_moped",
    auto: "cross_moped",
    beauty: "gift_bundle",
    retail: "gift_bundle",
    marketplace: "gift_bundle",
    real_estate: "cross_carpet",
  };

  function giftBundleModuleForLang(lang) {
    var g = global.OSG_I18N_LANG_GUARD;
    if (g && typeof g.giftBundleModuleForLang === "function") {
      return g.giftBundleModuleForLang(lang);
    }
    var L = String(lang || "en").toLowerCase().split("-")[0];
    if (L === "th") return "gift_bundle_th";
    if (L === "de") return "gift_bundle_de";
    return "gift_bundle";
  }

  function resolveUiLangForCrossSell() {
    var g = global.OSG_I18N_LANG_GUARD;
    if (g && typeof g.resolveUiLang === "function") {
      return g.resolveUiLang();
    }
    try {
      if (global.__OSG_CURRENT_LANG__) {
        return String(global.__OSG_CURRENT_LANG__).toLowerCase().split("-")[0];
      }
    } catch (_) {}
    return "en";
  }

  function mapGroupModule(group) {
    var base = MODULE_BY_GROUP[group] || "";
    if (base === "gift_bundle") {
      return giftBundleModuleForLang(resolveUiLangForCrossSell());
    }
    return base;
  }

  function moduleAfterPurchase(partner, channel, certRealm) {
    var p = String(partner || "").toLowerCase().trim();
    var ch = String(channel || "").toLowerCase().trim();
    var cert = String(certRealm || "").toLowerCase().trim();
    if (cert === "automotive") return "cross_moped";
    if (cert === "real_estate") return "cross_carpet";
    var group = PARTNER_GROUP[p];
    if (group) return mapGroupModule(group);
    if (ch === "marketplace") return giftBundleModuleForLang(resolveUiLangForCrossSell());
    if (ch === "beauty" || ch === "retail") {
      return giftBundleModuleForLang(resolveUiLangForCrossSell());
    }
    if (ch === "dealer") return "cross_moped";
    return "";
  }

  var TEXT_TRIGGERS = [
    {
      id: "gift_search",
      moduleId: "gift_bundle",
      priority: 88,
      patterns: [
        /\b(geschenk|blumen|pralinen|champagner|bouquet|überrasch)\b/i,
        /\b(gift|flowers|chocolate|champagne|present)\b/i,
        /\b(ของขวัญ|ดอกไม้|ช็อกโกแลต)\b/i,
        /\b(prezent|kwiaty|czekolad)\b/i,
        /\b(подарок|цветы|шоколад)\b/i,
        /\b(礼物|鲜花|巧克力)\b/i,
      ],
    },
    {
      id: "tools_text",
      moduleId: "cross_tools",
      priority: 75,
      patterns: [
        /\b(werkzeug|bohrer|schraube|hammer|renovier)\b/i,
        /\b(tool|drill|screwdriver|renovat)\b/i,
        /\b(เครื่องมือ|ช่าง)\b/i,
        /\b(narzędzi|wiertark)\b/i,
        /\b(инструмент|дрель)\b/i,
        /\b(工具|电钻)\b/i,
      ],
    },
    {
      id: "carpet_text",
      moduleId: "cross_carpet",
      priority: 74,
      patterns: [
        /\b(teppich|vorhang|einrichtung|möbel)\b/i,
        /\b(carpet|rug|curtain|furnish)\b/i,
        /\b(พรม|ผ้าม่าน|เฟอร์นิเจอร์)\b/i,
        /\b(dywan|zasłon)\b/i,
        /\b(ковер|штор)\b/i,
        /\b(地毯|窗帘)\b/i,
      ],
    },
    {
      id: "moped_text",
      moduleId: "cross_moped",
      priority: 76,
      patterns: [
        /\b(moped|motorrad|roller|scooter|mofa)\b/i,
        /\b(มอเตอร์ไซค์|สกู๊ตเตอร์)\b/i,
        /\b(skuter|motocykl)\b/i,
        /\b(мото|скутер)\b/i,
        /\b(摩托车|踏板车)\b/i,
      ],
    },
    {
      id: "parts_text",
      moduleId: "cross_authenticity",
      priority: 77,
      patterns: [
        /\b(ersatzteil|original|nachbau|fake|billig.*teil)\b/i,
        /\b(spare part|genuine|counterfeit|cheap part)\b/i,
        /\b(อะไหล่|ของแท้)\b/i,
        /\b(część zamienna|oryginał)\b/i,
        /\b(запчаст|оригинал)\b/i,
        /\b(零件|正品)\b/i,
      ],
    },
  ];

  function moduleForPartner(partner) {
    var p = String(partner || "").toLowerCase().trim();
    var group = PARTNER_GROUP[p];
    if (!group) return "";
    return mapGroupModule(group);
  }

  function scrollTargetForModule(moduleId) {
    var id = String(moduleId || "");
    if (id === "cross_tools") {
      return 'a.osg-affiliate-link[data-osg-partner="roojai"], a.osg-affiliate-link[data-osg-channel="insurance"]';
    }
    if (id === "cross_carpet") {
      return 'a.osg-affiliate-link[data-osg-partner="real_estate_th"], a.osg-affiliate-link[data-osg-channel="real_estate"]';
    }
    if (id === "cross_moped") {
      return 'a.osg-affiliate-link[data-osg-partner="roojai"], a.osg-affiliate-link[data-osg-channel="insurance"]';
    }
    if (id === "gift_bundle" || id === "gift_bundle_th" || id === "gift_bundle_de") {
      return 'a.osg-affiliate-link[data-osg-partner="boots"], a.osg-affiliate-link[data-osg-partner="watsons"]';
    }
    return "#partner-affiliate-panel";
  }

  function analyze(text) {
    var t = String(text || "").trim();
    if (!t || t.length < 3) return null;
    var best = null;
    var i;
    var j;
    for (i = 0; i < TEXT_TRIGGERS.length; i++) {
      var tr = TEXT_TRIGGERS[i];
      for (j = 0; j < tr.patterns.length; j++) {
        if (tr.patterns[j].test(t)) {
          if (!best || tr.priority > best.priority) {
            best = {
              moduleId: tr.moduleId,
              triggerId: tr.id,
              priority: tr.priority,
            };
          }
          break;
        }
      }
    }
    return best;
  }

  function analyzeResolved(text) {
    var hit = analyze(text);
    if (hit && hit.moduleId === "gift_bundle") {
      hit.moduleId = giftBundleModuleForLang(resolveUiLangForCrossSell());
    }
    return hit;
  }

  function focusHint(moduleId) {
    var sel = scrollTargetForModule(moduleId);
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

  global.OSG_CROSS_SELL_LOGIC = {
    PARTNER_GROUP: PARTNER_GROUP,
    MODULE_BY_GROUP: MODULE_BY_GROUP,
    moduleForPartner: moduleForPartner,
    moduleAfterPurchase: moduleAfterPurchase,
    analyze: analyze,
    analyzeResolved: analyzeResolved,
    giftBundleModuleForLang: giftBundleModuleForLang,
    scrollTargetForModule: scrollTargetForModule,
    focusHint: focusHint,
  };
})(typeof window !== "undefined" ? window : globalThis);
