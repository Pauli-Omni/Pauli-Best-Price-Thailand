// osg_tts_guard.js - Synchronisierter globaler Mutex mit Promise-Queue + Interrupt-Support
// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
(function () {
  let isSpeaking = false;
  let ttsQueue = [];
  const MAX_QUEUE_SIZE = 3;
  const originalPlayPauliVoice = window.playPauliVoice;

  // Abort handle: osgPauliTtsAbort() calls this to release the current await early
  let _currentAbortResolve = null;

  // Publicly readable: text Pauli is speaking right now ('' when silent)
  window.osgCurrentTtsText = '';

  async function processQueue() {
    if (isSpeaking || ttsQueue.length === 0) return;

    isSpeaking = true;
    const current = ttsQueue.shift();

    try {
      window.osgCurrentTtsText = current.text;

      if (typeof originalPlayPauliVoice === 'function') {
        // Abortable await: interrupt engine can call _currentAbortResolve() to escape early
        await new Promise(function (resolve, reject) {
          _currentAbortResolve = resolve;
          originalPlayPauliVoice(current.text, current.options)
            .then(resolve, reject);
        });
        current.resolve();
      } else {
        console.warn('[TTS Guard] Originales playPauliVoice nicht gefunden!');
        current.resolve();
      }
    } catch (error) {
      console.error('[TTS Guard] Fehler beim Abspielen:', error);
      current.reject(error);
    } finally {
      window.osgCurrentTtsText = '';
      _currentAbortResolve = null;
      isSpeaking = false;
      processQueue(); // nächsten Eintrag anstoßen
    }
  }

  // Gepatchte playPauliVoice — gibt echtes Promise zurück
  window.playPauliVoice = function (text, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
      if (ttsQueue.length >= MAX_QUEUE_SIZE) {
        const dropped = ttsQueue.shift();
        dropped.resolve(); // alten Eintrag entsperren
        console.log('[TTS Guard] Queue voll – älterer Eintrag übersprungen.');
      }
      ttsQueue.push({ text: text, options: options, resolve: resolve, reject: reject });
      processQueue();
    });
  };

  // --- Globale Hilfsfunktionen ---

  window.osgIsPauliSpeaking = function () { return isSpeaking; };
  window.osgPauliTtsQueueLength = function () { return ttsQueue.length; };

  window.osgPauliTtsClearQueue = function () {
    ttsQueue.forEach(function (item) { item.resolve(); });
    ttsQueue = [];
    console.log('[TTS Guard] Queue vollständig geleert.');
  };

  /**
   * Bricht den laufenden TTS-Await sofort ab (für osg_tts_interrupt).
   * Stoppt Web-Audio-BufferSource und Segment-Wiedergabe.
   */
  window.osgPauliTtsAbort = function () {
    if (typeof window.stopAllSpeech === 'function') {
      window.stopAllSpeech();
    } else if (typeof window.osgPauliStopActivePlayback === 'function') {
      window.osgPauliStopActivePlayback();
    }
    if (typeof _currentAbortResolve === 'function') {
      _currentAbortResolve();
      _currentAbortResolve = null;
    }
  };
})();
