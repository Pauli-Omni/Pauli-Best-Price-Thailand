/**
 * OSG TTS-Guard — Serialisiert alle playPauliVoice-Aufrufe.
 *
 * Ohne diesen Guard können mehrere Stellen (Avatar-Boot, Tour, Psychologie-Trigger,
 * Konversations-Antwort) gleichzeitig playPauliVoice aufrufen, was zu simultanen
 * Sprach-Überlappungen führt.
 *
 * Strategie: window.playPauliVoice wird durch eine Queue-Variante ersetzt.
 * Neue Aufrufe warten, bis der aktuelle Aufruf vollständig beendet ist.
 * Max. Queue-Tiefe: 3 (ältester Eintrag wird verworfen, um Endlosaufstau zu vermeiden).
 */
(function (global) {
  "use strict";

  var MAX_QUEUE = 3;
  var _queue = [];
  var _running = false;
  var _original = null;

  function drainQueue() {
    if (_running || !_queue.length) return;
    var task = _queue.shift();
    _running = true;
    Promise.resolve()
      .then(function () {
        return _original.call(null, task.text, task.opts);
      })
      .then(function (result) {
        task.resolve(result);
      })
      .catch(function (err) {
        task.reject(err);
      })
      .finally(function () {
        _running = false;
        drainQueue();
      });
  }

  function queuedPlayPauliVoice(text, opts) {
    // Sofort starten wenn idle
    if (!_running && !_queue.length) {
      _running = true;
      return Promise.resolve()
        .then(function () {
          return _original.call(null, text, opts);
        })
        .finally(function () {
          _running = false;
          drainQueue();
        });
    }

    // Warteschlange voll: ältesten Eintrag verwerfen
    if (_queue.length >= MAX_QUEUE) {
      var dropped = _queue.shift();
      dropped.resolve(); // still lösen, nicht hängen lassen
    }

    return new Promise(function (resolve, reject) {
      _queue.push({ text: text, opts: opts, resolve: resolve, reject: reject });
    });
  }

  function patchWhenReady() {
    if (typeof global.playPauliVoice !== "function") {
      // Noch nicht geladen — kurz warten und nochmal versuchen
      setTimeout(patchWhenReady, 120);
      return;
    }
    if (global.playPauliVoice._osgGuarded) return; // Schon gepatcht
    _original = global.playPauliVoice;
    queuedPlayPauliVoice._osgGuarded = true;
    global.playPauliVoice = queuedPlayPauliVoice;

    // Hilfsfunktionen für externe Abfrage
    global.osgIsPauliSpeaking = function () { return _running; };
    global.osgPauliTtsQueueLength = function () { return _queue.length; };
    global.osgPauliTtsClearQueue = function () {
      _queue.forEach(function (t) { t.resolve(); });
      _queue = [];
    };
  }

  // Patch nach vollständigem DOM-/Script-Load
  if (global.document && global.document.readyState === "complete") {
    setTimeout(patchWhenReady, 50);
  } else {
    global.addEventListener("load", function () {
      setTimeout(patchWhenReady, 50);
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
