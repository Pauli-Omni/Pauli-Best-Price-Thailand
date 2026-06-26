// osg_tts_guard.js - Synchronisierter globaler Mutex mit Promise-Queue + Interrupt-Support
// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
(function () {
  "use strict";

  var isSpeaking = false;
  var ttsQueue = [];
  var MAX_QUEUE_SIZE = 3;
  var _currentAbortResolve = null;
  var _wrappedFn = null;

  // Abort-Generation: zählt jeden osgPauliTtsAbort()-Aufruf.
  // processQueue() snapshoted diesen Wert beim Start.
  // Im finally-Block wird verglichen — abweichend = Abort während dieser Runde → kein Neustart.
  var _abortGeneration = 0;

  // Text-Batch-Guard: exakt derselbe normierte Text wird innerhalb _BATCH_BLOCK_MS
  // nach einem Abort nicht erneut gestartet.
  var _BATCH_BLOCK_MS = 2000;
  var _lastAbortedTextKey = '';
  var _lastAbortedAt = 0;

  // Epoch-Freigabe-Timer: nach Abort wird die Registry-Epoch nach _EPOCH_RELEASE_MS
  // freigegeben. Der Timer kann durch einen expliziten neuen play()-Aufruf vorzeitig
  // abgebrochen und durch einen force-Aufruf überschrieben werden.
  // KEIN Queue-Restart in diesem Timer — nur Epoch-Freigabe.
  var _EPOCH_RELEASE_MS = 80;
  var _epochReleaseTimer = null;

  window.osgCurrentTtsText = '';

  // ── Hilfsfunktionen ──────────────────────────────────────────────────────

  function normTextKey(text) {
    return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
  }

  function registryGen() {
    return (
      window.OSG_AUDIO_REGISTRY &&
      typeof window.OSG_AUDIO_REGISTRY.getGeneration === 'function'
    ) ? window.OSG_AUDIO_REGISTRY.getGeneration() : -1;
  }

  function releaseEpoch() {
    if (
      window.OSG_AUDIO_REGISTRY &&
      typeof window.OSG_AUDIO_REGISTRY.resetAbortEpoch === 'function'
    ) {
      window.OSG_AUDIO_REGISTRY.resetAbortEpoch();
    } else if (
      window.OSG_AUDIO_REGISTRY &&
      typeof window.OSG_AUDIO_REGISTRY.clearAbortEpoch === 'function'
    ) {
      window.OSG_AUDIO_REGISTRY.clearAbortEpoch();
    }
  }

  function beginAbortEpoch() {
    if (
      window.OSG_AUDIO_REGISTRY &&
      typeof window.OSG_AUDIO_REGISTRY.beginAbortEpoch === 'function'
    ) {
      window.OSG_AUDIO_REGISTRY.beginAbortEpoch();
    }
  }

  // ── Queue-Verarbeitung ────────────────────────────────────────────────────

  async function processQueue() {
    // Läuft bereits oder Queue leer → kein Start
    if (isSpeaking || ttsQueue.length === 0) return;

    isSpeaking = true;
    // Neuer Sprechauftrag: Abort-Gate freigeben — stale Callbacks via Generation-Guard
    releaseEpoch();
    var myGeneration = _abortGeneration;
    var myRegistryGen = registryGen();
    var current = ttsQueue.shift();

    try {
      window.osgCurrentTtsText = current.text;

      if (typeof _wrappedFn === 'function') {
        await new Promise(function (resolve, reject) {
          _currentAbortResolve = resolve;
          _wrappedFn(current.text, current.options)
            .then(resolve, reject);
        });
        current.resolve();
      } else {
        console.warn('[TTS Guard] playPauliVoice nicht registriert.');
        current.resolve();
      }
    } catch (error) {
      console.error('[TTS Guard] Fehler beim Abspielen:', error);
      current.reject(error);
    } finally {
      window.osgCurrentTtsText = '';
      _currentAbortResolve = null;
      isSpeaking = false;

      // Stale-Check: Abort seit diesem Lauf → Queue NICHT weiterführen.
      // processQueue() wird ausschließlich durch den nächsten guardedPlayPauliVoice()-Aufruf neu gestartet.
      var abortSince = _abortGeneration !== myGeneration;
      var registrySince = myRegistryGen >= 0 && registryGen() !== myRegistryGen;
      if (abortSince || registrySince) {
        // Stale: Queue leeren ohne Callbacks zu triggern (bereits durch Abort erledigt)
        ttsQueue.forEach(function (item) { item.resolve(); });
        ttsQueue = [];
      } else {
        // Normaler Abschluss: Abort-Epoch sicher zurücksetzen
        releaseEpoch();
      }
      // Kein processQueue()-Aufruf hier — nie, unter keinen Umständen.
    }
  }

  // ── Öffentliche API ───────────────────────────────────────────────────────

  function guardedPlayPauliVoice(text, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
      // Text-Batch-Guard
      var textKey = normTextKey(text);
      var now = typeof Date.now === 'function' ? Date.now() : 0;
      if (
        textKey &&
        textKey === _lastAbortedTextKey &&
        (now - _lastAbortedAt) < _BATCH_BLOCK_MS
      ) {
        resolve();
        return;
      }

      if (ttsQueue.length >= MAX_QUEUE_SIZE) {
        var dropped = ttsQueue.shift();
        dropped.resolve();
        console.log('[TTS Guard] Queue voll – älterer Eintrag übersprungen.');
      }
      ttsQueue.push({ text: text, options: options, resolve: resolve, reject: reject });
      processQueue();
    });
  }

  window.osgInstallPauliTtsGuard = function () {
    var base = window.playPauliVoice;
    if (typeof base !== 'function') return false;
    if (base.__osgTtsGuardWrapped) return true;
    _wrappedFn = base;
    guardedPlayPauliVoice.__osgTtsGuardWrapped = true;
    window.playPauliVoice = guardedPlayPauliVoice;
    return true;
  };

  window.osgIsPauliSpeaking = function () { return isSpeaking; };
  window.osgPauliTtsQueueLength = function () { return ttsQueue.length; };

  window.osgPauliTtsClearQueue = function () {
    ttsQueue.forEach(function (item) { item.resolve(); });
    ttsQueue = [];
  };

  window.osgPauliTtsAbort = function () {
    // Laufenden Text für Batch-Guard merken
    var abortedText = window.osgCurrentTtsText || '';
    _lastAbortedTextKey = normTextKey(abortedText);
    _lastAbortedAt = typeof Date.now === 'function' ? Date.now() : 0;

    // Abort-Generation hochzählen → finally-Blöcke erkennen Stale-State
    _abortGeneration += 1;

    // Interrupt-Epoch setzen (stopAllSpeech allein setzt sie nicht mehr)
    beginAbortEpoch();

    // Alle Audio-Quellen stoppen
    if (typeof window.stopAllSpeech === 'function') {
      window.stopAllSpeech();
    } else if (typeof window.osgPauliStopActivePlayback === 'function') {
      window.osgPauliStopActivePlayback();
    }

    // Laufenden Promise sofort auflösen, damit await nicht hängt
    if (typeof _currentAbortResolve === 'function') {
      _currentAbortResolve();
      _currentAbortResolve = null;
    }

    isSpeaking = false;
    window.osgPauliTtsClearQueue();

    // Epoch-Freigabe-Timer: gibt die Registry-Epoch frei, NACHDEM alle async
    // finally-Blöcke und onend-Callbacks gelaufen sind.
    // KEIN Queue-Restart in diesem Timer.
    if (_epochReleaseTimer) clearTimeout(_epochReleaseTimer);
    _epochReleaseTimer = setTimeout(function () {
      _epochReleaseTimer = null;
      releaseEpoch();
      // Nach Interrupt-Delay: wartende Queue-Einträge zulassen
      processQueue();
    }, _EPOCH_RELEASE_MS);
  };

  // Batch-Guard von außen zurücksetzen (z.B. nach explizitem Nutzer-Neustart)
  window.osgPauliTtsClearBatchGuard = function () {
    _lastAbortedTextKey = '';
    _lastAbortedAt = 0;
  };

  window.osgInstallPauliTtsGuard();
})();
