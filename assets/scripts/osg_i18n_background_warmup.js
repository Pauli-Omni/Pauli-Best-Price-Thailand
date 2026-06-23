/**
 * Pauli — 18 Locales im Hintergrund vorladen (th → en → de zuerst).
 * Läuft nach AGB-Freigabe / idle, blockiert UI nicht (max. 2 parallel).
 */
(function (global) {
  "use strict";

  var PRIORITY = ["th", "en", "de"];
  var PARALLEL = 2;
  var running = false;
  var done = Object.create(null);

  function allLocales() {
    var wl = global.OSG_WORLD_LANG;
    if (wl && wl.CORE_UI_LANGS && wl.CORE_UI_LANGS.length) {
      return wl.CORE_UI_LANGS.slice();
    }
    var g = global.OSG_I18N_LANG_GUARD;
    if (g && g.LANGS && g.LANGS.length) return g.LANGS.slice();
    return PRIORITY.concat(["pl", "ru", "zh"]);
  }

  function orderedLocales() {
    var all = allLocales();
    var head = PRIORITY.filter(function (c) {
      return all.indexOf(c) >= 0;
    });
    var tail = all.filter(function (c) {
      return head.indexOf(c) < 0;
    });
    return head.concat(tail);
  }

  function loadOne(lang) {
    if (done[lang]) return Promise.resolve(true);
    var g = global.OSG_I18N_LANG_GUARD;
    var p =
      g && typeof g.ensureLocalePackLoaded === "function"
        ? g.ensureLocalePackLoaded(lang)
        : typeof global.osgLoadLocaleOverlay === "function"
          ? global.osgLoadLocaleOverlay(lang)
          : Promise.resolve(false);
    return Promise.resolve(p).then(function (ok) {
      done[lang] = !!ok;
      return ok;
    });
  }

  function runWarmup() {
    if (running || global.__OSG_I18N_WARMUP_DONE__) return;
    if (
      typeof global.osgPauliAudioAllowed === "function" &&
      !global.osgPauliAudioAllowed()
    ) {
      return;
    }
    running = true;
    var queue = orderedLocales();
    var idx = 0;

    function next() {
      if (idx >= queue.length) {
        running = false;
        global.__OSG_I18N_WARMUP_DONE__ = true;
        try {
          global.dispatchEvent(
            new CustomEvent("osg-i18n-warmup-done", {
              detail: { locales: queue.length, loaded: done },
            })
          );
        } catch (_) {}
        return;
      }
      var batch = queue.slice(idx, idx + PARALLEL);
      idx += batch.length;
      Promise.all(batch.map(loadOne)).then(function () {
        var idle = global.requestIdleCallback || function (fn) {
          setTimeout(fn, 100);
        };
        idle(next);
      });
    }

    next();
  }

  function scheduleWarmup() {
    if (global.__OSG_I18N_WARMUP_SCHEDULED__) return;
    global.__OSG_I18N_WARMUP_SCHEDULED__ = true;
    var idle = global.requestIdleCallback || function (fn) {
      setTimeout(fn, 900);
    };
    idle(runWarmup);
  }

  global.OSG_I18N_BACKGROUND_WARMUP = {
    locales: allLocales,
    orderedLocales: orderedLocales,
    start: runWarmup,
    schedule: scheduleWarmup,
    isDone: function () {
      return !!global.__OSG_I18N_WARMUP_DONE__;
    },
  };

  global.addEventListener("osg-terms-audio-unlocked", scheduleWarmup);

  if (
    typeof global.osgPauliAudioAllowed !== "function" ||
    global.osgPauliAudioAllowed()
  ) {
    if (global.document && global.document.readyState === "complete") {
      scheduleWarmup();
    } else {
      global.addEventListener("load", scheduleWarmup, { once: true });
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
