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

  function playSegmentOnAudio(audio, segment) {
    clearActivePlayback();
    activeAudio = audio;
    return new Promise(function (resolve, reject) {
      var ended = false;
      function finish(ok) {
        if (ended) return;
        ended = true;
        clearActivePlayback();
        resolve(!!ok);
      }

      function onMeta() {
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
        activeStopTimer = setTimeout(function () {
          finish(true);
        }, durationMs + 120);
        activeTimeHandler = function () {
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
    opts = opts || {};
    if (
      typeof global.osgPauliAudioAllowed === "function" &&
      !global.osgPauliAudioAllowed()
    ) {
      return false;
    }
    var cfg = await loadConfig();
    var segmentKey = resolveSegmentKey(opts);
    if (!segmentKey || !cfg.segments || !cfg.segments[segmentKey]) {
      return false;
    }
    var segment = cfg.segments[segmentKey];
    var urls = masterUrls(cfg);
    for (var i = 0; i < urls.length; i += 1) {
      var url = urls[i];
      var ok = await probeMasterUrl(url);
      if (!ok) continue;
      try {
        var audio = new Audio(url);
        audio.preload = "auto";
        audio.setAttribute("playsinline", "");
        await playSegmentOnAudio(audio, segment);
        return true;
      } catch (_) {}
    }
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
