/**
 * Spielt Zeit-Segmente aus einer Master-MP3 (z. B. search_intro_long.mp3).
 * Fallback: false → Aufrufer nutzt einzelne speechKey-MP3s.
 */
(function (global) {
  "use strict";

  var CONFIG_URL = "/sounds/pauli/audio-segments.json";
  var configCache = null;
  var configLoading = null;
  var activeAudio = null;
  var activeStopTimer = null;
  var activeTimeHandler = null;

  // Geteilter AudioContext für Lipsync-Analyser (bleibt offen zwischen Segmenten)
  var _segCtx = null;

  function getSegCtx() {
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try {
      if (!_segCtx || _segCtx.state === "closed") _segCtx = new AC();
      if (_segCtx.state === "suspended") _segCtx.resume().catch(function () {});
    } catch (_) { return null; }
    return _segCtx;
  }

  function clearActivePlayback() {
    if (activeStopTimer) {
      clearTimeout(activeStopTimer);
      activeStopTimer = null;
    }
    if (activeAudio && activeTimeHandler) {
      try {
        activeAudio.removeEventListener("timeupdate", activeTimeHandler);
      } catch (_) {}
      activeTimeHandler = null;
    }
    if (activeAudio) {
      try {
        activeAudio.pause();
      } catch (_) {}
    }
  }

  function loadConfig() {
    if (configCache) return Promise.resolve(configCache);
    if (configLoading) return configLoading;
    configLoading = fetch(CONFIG_URL, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("segment_config_missing");
        return res.json();
      })
      .then(function (cfg) {
        configCache = cfg || {};
        return configCache;
      })
      .catch(function () {
        configCache = { segments: {}, speechKeyToSegment: {}, intentToSegment: {} };
        return configCache;
      })
      .finally(function () {
        configLoading = null;
      });
    return configLoading;
  }

  function resolveSegmentKey(opts) {
    opts = opts || {};
    if (opts.segmentKey) return String(opts.segmentKey).trim();
    var speechKey = String(opts.speechKey || "").trim();
    var intent = String(opts.intent || "").trim();
    if (!configCache) return "";
    if (speechKey && configCache.speechKeyToSegment) {
      var fromSpeech = configCache.speechKeyToSegment[speechKey];
      if (fromSpeech) return fromSpeech;
    }
    if (intent && configCache.intentToSegment) {
      var fromIntent = configCache.intentToSegment[intent];
      if (fromIntent) return fromIntent;
    }
    return "";
  }

  function masterUrls(cfg) {
    var urls = [];
    if (cfg.masterUrl) urls.push(String(cfg.masterUrl));
    if (Array.isArray(cfg.masterFallbackUrls)) {
      cfg.masterFallbackUrls.forEach(function (u) {
        if (u) urls.push(String(u));
      });
    }
    return urls;
  }

  function probeMasterUrl(url) {
    return fetch(url, { method: "HEAD", credentials: "same-origin" })
      .then(function (res) {
        return res.ok;
      })
      .catch(function () {
        return false;
      });
  }

  function isEpochBlocked() {
    return !!(
      global.OSG_AUDIO_REGISTRY &&
      typeof global.OSG_AUDIO_REGISTRY.isAbortEpochActive === "function" &&
      global.OSG_AUDIO_REGISTRY.isAbortEpochActive()
    );
  }

  function playSegmentOnAudio(audio, segment) {
    clearActivePlayback();
    activeAudio = audio;

    // Epoch-Guard: Abort noch aktiv → kein Start
    if (isEpochBlocked()) {
      return Promise.resolve(false);
    }

    // Generation-Snapshot: alle async Callbacks prüfen diesen Wert.
    // Abweichung = stopAll() wurde seit Start aufgerufen → stale.
    var startGeneration =
      global.OSG_AUDIO_REGISTRY &&
      typeof global.OSG_AUDIO_REGISTRY.getGeneration === "function"
        ? global.OSG_AUDIO_REGISTRY.getGeneration()
        : -1;

    // Registrierung in zentraler AudioRegistry
    var _segRegEntry = null;
    if (global.OSG_AUDIO_REGISTRY && typeof global.OSG_AUDIO_REGISTRY.register === "function") {
      _segRegEntry = global.OSG_AUDIO_REGISTRY.register("segment", function () {
        clearActivePlayback();
        if (global.OSGLipsyncStopVisuals) global.OSGLipsyncStopVisuals();
      });
      // register() gibt null zurück wenn Epoch gesperrt
      if (_segRegEntry === null) {
        return Promise.resolve(false);
      }
    }

    // Lipsync-Analyser aufbauen (same-origin Master-MP3, kein crossOrigin nötig)
    var analyser = null;
    try {
      var ctx = getSegCtx();
      if (ctx) {
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        var src = ctx.createMediaElementSource(audio);
        src.connect(analyser);
        analyser.connect(ctx.destination);
      }
    } catch (_) { analyser = null; }

    return new Promise(function (resolve, reject) {
      var ended = false;

      function isStale() {
        if (isEpochBlocked()) return true;
        if (startGeneration < 0) return false;
        return (
          global.OSG_AUDIO_REGISTRY &&
          typeof global.OSG_AUDIO_REGISTRY.getGeneration === "function" &&
          global.OSG_AUDIO_REGISTRY.getGeneration() !== startGeneration
        );
      }

      function finish(ok) {
        if (ended) return;
        ended = true;
        clearActivePlayback();
        if (_segRegEntry && global.OSG_AUDIO_REGISTRY && typeof global.OSG_AUDIO_REGISTRY.unregister === "function") {
          global.OSG_AUDIO_REGISTRY.unregister(_segRegEntry);
        }
        // Stale: Visuals aufräumen, aber kein resolve(true) — kein Signal zurück an Queue
        if (isStale()) {
          if (global.OSGLipsyncStopVisuals) global.OSGLipsyncStopVisuals();
          resolve(false);
          return;
        }
        if (global.OSGLipsyncStopVisuals) global.OSGLipsyncStopVisuals();
        resolve(!!ok);
      }

      function onMeta() {
        if (isStale()) { finish(false); return; }
        try {
          audio.currentTime = Math.max(0, segment.startMs / 1000);
        } catch (_) {}
        var playPr = audio.play();
        if (playPr && typeof playPr.catch === "function") {
          playPr.catch(function (e) {
            finish(false);
            reject(e);
          });
        }
        var durationMs = Math.max(80, segment.endMs - segment.startMs);

        if (global.OSGLipsyncBindToAudio) {
          global.OSGLipsyncBindToAudio(audio, analyser);
        }

        activeStopTimer = setTimeout(function () {
          if (isStale()) return;
          finish(true);
        }, durationMs + 120);

        activeTimeHandler = function () {
          if (isStale()) return;
          if (audio.currentTime * 1000 >= segment.endMs - 20) {
            finish(true);
          }
        };
        audio.addEventListener("timeupdate", activeTimeHandler);
      }

      audio.addEventListener("loadedmetadata", onMeta, { once: true });
      audio.addEventListener("error", function () {
        finish(false);
        reject(new Error("segment_audio_error"));
      }, { once: true });
      if (audio.readyState >= 1) onMeta();
    });
  }

  async function playSegment(opts) {
    void opts;
    /* Schnipsel-Wiedergabe aus — Sätze nur per ElevenLabs (ELEVENLABS_VOICE_ID).
       Referenz: public/sounds/pauli/Einzige_Stimme_Paulis-Avatar.mp3 */
    return false;
  }

  function segmentKeyFor(opts) {
    if (!configCache) return "";
    return resolveSegmentKey(opts || {});
  }

  global.OSG_AUDIO_SEGMENT = {
    loadConfig: loadConfig,
    playSegment: playSegment,
    segmentKeyFor: segmentKeyFor,
    stop: clearActivePlayback,
  };
})(typeof window !== "undefined" ? window : globalThis);
