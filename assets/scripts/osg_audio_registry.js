// osg_audio_registry.js — Zentrale Audio-Registry: Ein aktiver Pfad, vereinheitlichter Stop
// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
(function (global) {
  "use strict";

  var _active = null; // { id, kind, stop: fn }

  // _generation: zählt jeden stop() + jeden register()-Aufruf.
  // Alle async Callbacks snapshoten diesen Wert beim Start und vergleichen beim Feuern.
  // Ein abweichender Wert bedeutet: ein Abort ist seit dem Start aufgetreten → stale.
  var _generation = 0;

  // Abort-Epoch: wird in stopAll() gesetzt, in clearAbortEpoch() freigegeben.
  // Solange _abortEpoch > 0, blockiert register() jeden neuen Audio-Start,
  // es sei denn force:true wird übergeben.
  // Kein automatisches Ablaufen per Timeout — die TTS-Guard steuert die Freigabe.
  var _abortEpoch = 0;

  /**
   * Registriert eine neue Audioquelle als aktiven Pfad.
   * Stoppt automatisch die vorherige aktive Quelle.
   *
   * @param {string}   kind    Bezeichner der Quelle (z.B. "buffer", "segment", "web-speech", …)
   * @param {Function} stopFn  Funktion zum Stoppen dieser Quelle
   * @param {Object}   [opts]  { force: true } überspringt den Abort-Epoch-Guard
   * @returns {Object|null} entry — null wenn Abort-Epoch aktiv
   */
  function register(kind, stopFn, opts) {
    if (!(opts && opts.force) && _abortEpoch > 0) {
      return null;
    }

    _generation += 1;
    var id = _generation;

    // Vorherige Quelle stoppen
    if (_active && typeof _active.stop === "function") {
      try { _active.stop(); } catch (_) {}
    }

    var entry = {
      id: id,
      kind: kind,
      stop: function () {
        if (_active !== entry) return; // bereits überschrieben
        try { stopFn(); } catch (_) {}
        if (_active === entry) _active = null;
      },
    };
    _active = entry;
    return entry;
  }

  /**
   * Deregistriert eine Quelle ohne Stop-Aufruf (z.B. nach natürlichem Ende).
   * @param {Object} entry  Rückgabewert von register()
   */
  function unregister(entry) {
    if (entry && _active === entry) _active = null;
  }

  /**
   * Stoppt ALLE bekannten Audioquellen (Registry + Legacy-Globals + Browser-Speech).
   * Setzt Abort-Epoch — blockiert jeden neuen register()-Aufruf bis clearAbortEpoch().
   * Wird von stopAllSpeech() und osgPauliTtsAbort() aufgerufen.
   */
  function stopAll() {
    // Abort-Epoch setzen: blockiert register() für alle folgenden async Callbacks
    _abortEpoch += 1;

    // Generation hochzählen: Snapshot-Vergleiche in Callbacks erkennen Stale-State
    _generation += 1;

    // Aktive Registry-Quelle stoppen
    if (_active && typeof _active.stop === "function") {
      try { _active.stop(); } catch (_) {}
    }
    _active = null;

    // Legacy: Browser SpeechSynthesis
    try {
      if (typeof global.speechSynthesis !== "undefined") {
        global.speechSynthesis.cancel();
      }
    } catch (_) {}

    // Legacy: alle <audio>-Elemente im DOM
    try {
      if (global.document) {
        global.document.querySelectorAll("audio").forEach(function (a) {
          if (!a.paused) {
            try { a.pause(); a.currentTime = 0; } catch (_) {}
          }
        });
      }
    } catch (_) {}

    // Legacy: Segment-Service
    try {
      if (
        typeof global.OSG_AUDIO_SEGMENT !== "undefined" &&
        global.OSG_AUDIO_SEGMENT &&
        typeof global.OSG_AUDIO_SEGMENT.stop === "function"
      ) {
        global.OSG_AUDIO_SEGMENT.stop();
      }
    } catch (_) {}

    // Legacy: Lipsync-Bridge
    try {
      if (typeof global.stopPauliSpeech === "function") {
        global.stopPauliSpeech();
      }
    } catch (_) {}

    // Legacy: Avatar-Bridge expressive sound
    try {
      if (typeof global.osgAvatar3dBridgeStopAudio === "function") {
        global.osgAvatar3dBridgeStopAudio();
      }
    } catch (_) {}

    // Legacy: __OSG_activePauliBufferSource
    try {
      var src = global.__OSG_activePauliBufferSource;
      if (src) {
        src.stop();
        global.__OSG_activePauliBufferSource = null;
      }
    } catch (_) {}

    // Legacy: __OSG_activePauliHtmlAudio
    try {
      var htmlAud = global.__OSG_activePauliHtmlAudio;
      if (htmlAud) {
        htmlAud.pause();
        htmlAud.currentTime = 0;
        global.__OSG_activePauliHtmlAudio = null;
      }
    } catch (_) {}

    global.currentAudioSource = null;
  }

  /**
   * Gibt den Abort-Epoch-Guard frei.
   * Muss explizit von der TTS-Guard aufgerufen werden, nachdem alle async
   * Callbacks sicher beendet wurden (d.h. nach dem Re-Entry-Delay).
   * Kein automatisches Ablaufen — vollständig atomar gesteuert.
   */
  function clearAbortEpoch() {
    if (_abortEpoch > 0) _abortEpoch -= 1;
  }

  /**
   * Gibt zurück ob der Abort-Epoch-Guard aktiv ist.
   */
  function isAbortEpochActive() {
    return _abortEpoch > 0;
  }

  global.OSG_AUDIO_REGISTRY = {
    register: register,
    unregister: unregister,
    stopAll: stopAll,
    clearAbortEpoch: clearAbortEpoch,
    isAbortEpochActive: isAbortEpochActive,
    // Legacy-Alias — älterer Code der isReEntryBlocked() nutzt bleibt kompatibel
    isReEntryBlocked: isAbortEpochActive,
    getActive: function () { return _active; },
    isActive: function () { return !!_active; },
    getGeneration: function () { return _generation; },
  };

})(typeof window !== "undefined" ? window : globalThis);
