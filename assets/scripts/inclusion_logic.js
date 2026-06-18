/**
 * Pauli Best Price — Inklusions-/Kumpel-Logik (Augenhöhe, kein Mitleid).
 * Erkennung über Nutzer-Eingabe + optionale Geräte-Signale.
 */
(function (global) {
  "use strict";

  var CLICK_ASSIST = [
    /\b(klick.*für mich|für mich klick|kann nicht klicken|klick du|mach du das)\b/i,
    /\b(click for me|can.?t click|you click)\b/i,
    /\b(กดให้|ช่วยกด|กดแทน)\b/i,
    /\b(kliknij za mnie|nie mogę klikać)\b/i,
    /\b(нажми за меня|не могу нажимать)\b/i,
    /\b(帮我点|帮我点击|不会操作)\b/i,
    /\b(keine ahnung von technik|technik ist nichts|bin zu doof für)\b/i,
    /\b(no idea.*tech|not good with tech|tech confus)\b/i,
    /\b(ไม่เก่งเทค|งงเทคโนโลยี)\b/i,
    /\b(motorisch|tremor|eingeschränkt|behinderung|barrierefrei)\b/i,
    /\b(accessibility|screen.?reader|a11y|disabled)\b/i,
  ];

  var READ_ALOUD = [
    /\b(vorlesen|lies mir vor|kann nicht lesen|sehbehindert|blind)\b/i,
    /\b(read (?:it )?aloud|can.?t read|visually impaired)\b/i,
    /\b(อ่านให้|อ่านออกเสียง|มองไม่เห็น)\b/i,
    /\b(przeczytaj|nie widzę dobrze)\b/i,
    /\b(прочитай|плохо вижу)\b/i,
    /\b(读给我听|看不清)\b/i,
  ];

  function analyze(text) {
    var t = String(text || "").trim();
    if (!t || t.length < 4) return null;
    var i;
    for (i = 0; i < READ_ALOUD.length; i++) {
      if (READ_ALOUD[i].test(t)) {
        return { mode: "read_aloud", moduleId: "inclusion_read" };
      }
    }
    for (i = 0; i < CLICK_ASSIST.length; i++) {
      if (CLICK_ASSIST[i].test(t)) {
        return { mode: "click_assist", moduleId: "inclusion_click" };
      }
    }
    return null;
  }

  function detectSensorHints() {
    var hints = [];
    try {
      if (
        global.matchMedia &&
        global.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        hints.push("motion_reduce");
      }
    } catch (_) {}
    try {
      if (global.navigator && global.navigator.maxTouchPoints === 0) {
        hints.push("no_touch");
      }
    } catch (_) {}
    return hints;
  }

  function persistPrefs(mode) {
    try {
      if (typeof global.osgPersistUserProfile === "function") {
        var patch = { inclusionBuddy: true };
        if (mode === "read_aloud") patch.inclusionReadAloud = true;
        if (mode === "click_assist") patch.inclusionClickAssist = true;
        global.osgPersistUserProfile(patch);
      }
    } catch (_) {}
  }

  function interpolateName(line, name) {
    var n = String(name || "").trim();
    var repl = n || "du";
    return String(line || "").replace(/\{NAME\}/g, n || repl);
  }

  global.OSG_INCLUSION_LOGIC = {
    analyze: analyze,
    detectSensorHints: detectSensorHints,
    persistPrefs: persistPrefs,
    interpolateName: interpolateName,
  };
})(typeof window !== "undefined" ? window : globalThis);
