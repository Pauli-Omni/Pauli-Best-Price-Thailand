/**
 * Browser speechSynthesis voice cache — getVoices() + voiceschanged.
 */
(function (global) {
  "use strict";

  var cache = [];
  var ready = false;

  function refresh() {
    try {
      if (typeof global.speechSynthesis === "undefined") {
        cache = [];
        return cache;
      }
      var list = global.speechSynthesis.getVoices() || [];
      cache = list.slice();
      ready = cache.length > 0;
    } catch (_) {
      cache = [];
    }
    try {
      global.dispatchEvent(
        new CustomEvent("osg-speech-voices-ready", {
          detail: { count: cache.length },
        }),
      );
    } catch (_) {}
    return cache;
  }

  function pickForLang(tag) {
    var voices = cache.length ? cache : refresh();
    if (!voices.length) return null;
    var t = String(tag || "en-US").toLowerCase();
    var lang = t.split("-")[0];
    var i;
    for (i = 0; i < voices.length; i++) {
      if (String(voices[i].lang || "").toLowerCase() === t) return voices[i];
    }
    for (i = 0; i < voices.length; i++) {
      var vl = String(voices[i].lang || "").toLowerCase();
      if (vl.indexOf(lang) === 0) return voices[i];
    }
    for (i = 0; i < voices.length; i++) {
      if (voices[i].default) return voices[i];
    }
    return voices[0];
  }

  function install() {
    if (typeof global.speechSynthesis === "undefined") return;
    refresh();
    try {
      global.speechSynthesis.addEventListener("voiceschanged", refresh);
    } catch (_) {
      try {
        global.speechSynthesis.onvoiceschanged = refresh;
      } catch (_) {}
    }
  }

  if (global.document && global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  global.OSG_SPEECH_VOICES = {
    refresh: refresh,
    pickForLang: pickForLang,
    list: function () {
      return cache.slice();
    },
    isReady: function () {
      return ready;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
