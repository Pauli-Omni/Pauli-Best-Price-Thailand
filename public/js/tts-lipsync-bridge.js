// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.

/**
 * tts-lipsync-bridge.js
 *
 * Steuert das visuelle Lip-Sync-Feedback auf dem Pauli-Avatar (Frontseite.jpeg)
 * über amplitude-basierte oder viseme-getimete Animationen.
 *
 * WICHTIG: Dieses Projekt hat KEIN 3D-Modell mit MorphTargets (Avatar_Head).
 * Die "Mundbewegung" wird über transform + filter auf .coin-visual-shadow-host--main
 * realisiert — direkt als inline styles (umgeht transition:none !important auf Klassen).
 *
 * Zwei Modi:
 *   A) Mit visemeData  → timeupdate-Pfad: präzises Frame-genaues Timing
 *   B) Ohne visemeData → AnalyserNode-Pfad: Echtzeit-Amplitudenmessung (60fps rAF)
 *
 * Hooks in bestehendes System:
 *   window.OSGLipSync.begin / stop  (index.html, Etappe 3)
 *   window.OSG_PauliAvatarAnimations.onSpeakStart / onSpeakStop
 */
(function (global) {
  "use strict";

  var _stage      = null;
  var _animFrame  = null;
  var _audioCtx   = null;

  // ── DOM-Helpers ──────────────────────────────────────────────────────────

  function coinStage() {
    if (!_stage) _stage = global.document && global.document.getElementById("coin-stage");
    return _stage;
  }

  function coinVisualHost() {
    var el = coinStage();
    return el ? el.querySelector(".coin-visual-shadow-host--main") : null;
  }

  // ── CSS-Treiber (ersetzt applyVisemeTo3DModel / MorphTargets) ────────────

  /**
   * Setzt transform + filter direkt als inline-style auf den Shadow-Host.
   * Inline styles umgehen "transition: none !important" auf CSS-Klassen,
   * da wir den Wert pro rAF-Frame aktualisieren (60fps = visuelle Glätte).
   *
   * @param {number} level  0.0 (still) … 1.0 (laut)
   */
  function applyLipsyncToCoinStage(level) {
    var host = coinVisualHost();
    if (!host) return;
    var clamped  = Math.max(0, Math.min(1, level));
    var scale    = 1 + clamped * 0.06;                        // max +6 %
    var bright   = 1 + clamped * 0.28;                        // max +28 % Helligkeit
    var glow     = Math.round(clamped * 14);                   // max 14px Glow
    var glowAlpha = (clamped * 0.75).toFixed(2);
    host.style.transform  = "scale(" + scale.toFixed(4) + ")";
    host.style.filter     = "brightness(" + bright.toFixed(3) + ")" +
                            " drop-shadow(0 0 " + glow + "px rgba(212,175,55," + glowAlpha + "))";
    host.style.willChange = "transform, filter";
  }

  function clearLipsyncStyles() {
    var host = coinVisualHost();
    if (!host) return;
    host.style.transform  = "";
    host.style.filter     = "";
    host.style.willChange = "";
  }

  /**
   * Visem-ID → Level-Mapping (ersetzt MorphTarget-Indexierung).
   * Standard-Visem-Sätze (z. B. Azure / ElevenLabs): 0 = Stille, 1–4 = Konsonanten,
   * 5–14 = Vokale / Diphthonge (höhere Mundöffnung).
   */
  function applyVisemeTo3DModel(visemeId, value) {
    var val = (value !== undefined && value !== null) ? Number(value) : 1;
    var base;
    if (visemeId === 0)        base = 0;          // Stille
    else if (visemeId <= 4)    base = 0.25;        // Konsonant
    else if (visemeId <= 9)    base = 0.55;        // mittlerer Vokal
    else                       base = 0.85;        // offener Vokal
    applyLipsyncToCoinStage(base * val);
  }

  // ── Lifecycle: Start / Stop ───────────────────────────────────────────────

  function onSpeechStart(analyser) {
    if (global.OSGLipSync && typeof global.OSGLipSync.begin === "function") {
      global.OSGLipSync.begin({ analyser: analyser, durationMs: 60000 });
    }
    if (
      global.OSG_PauliAvatarAnimations &&
      typeof global.OSG_PauliAvatarAnimations.onSpeakStart === "function"
    ) {
      global.OSG_PauliAvatarAnimations.onSpeakStart();
    }
  }

  function onSpeechEnd(ctx) {
    cancelAnimationFrame(_animFrame);
    _animFrame = null;
    clearLipsyncStyles();
    if (global.OSGLipSync && typeof global.OSGLipSync.stop === "function") {
      global.OSGLipSync.stop();
    }
    if (
      global.OSG_PauliAvatarAnimations &&
      typeof global.OSG_PauliAvatarAnimations.onSpeakStop === "function"
    ) {
      global.OSG_PauliAvatarAnimations.onSpeakStop();
    }
    try { if (ctx) ctx.close(); } catch (_) {}
    _audioCtx = null;
  }

  // ── Amplitude-Loop (Modus B — kein visemeData) ───────────────────────────

  function startAmplitudeLoop(audio, analyser) {
    var dataArray = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      if (!audio.paused && !audio.ended) {
        analyser.getByteFrequencyData(dataArray);
        var sum = 0;
        for (var i = 0; i < dataArray.length; i++) sum += dataArray[i];
        // 80 entspricht typischer Sprach-Amplitude (0–255); normiert auf 0–1
        applyLipsyncToCoinStage(Math.min(1, (sum / dataArray.length) / 80));
      }
      _animFrame = requestAnimationFrame(tick);
    }
    _animFrame = requestAnimationFrame(tick);
  }

  // ── Haupt-API ─────────────────────────────────────────────────────────────

  /**
   * Spielt Audio ab und treibt den Avatar-Lip-Sync.
   *
   * @param {string}   audioUrl    URL zur MP3/WAV-Datei
   * @param {Array}    visemeData  Optional: [{time, duration, id, value}, …]
   *                               Wenn vorhanden → timeupdate-Pfad (Modus A)
   *                               Wenn fehlt     → AnalyserNode-Pfad (Modus B)
   */
  global.playPauliSpeechWithLipsync = function (audioUrl, visemeData) {
    // Alten Kontext beenden
    if (_audioCtx) { try { _audioCtx.close(); } catch (_) {} }
    cancelAnimationFrame(_animFrame);
    clearLipsyncStyles();

    var AudioCtx = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtx) {
      console.warn("[tts-lipsync-bridge] AudioContext nicht unterstützt");
      return;
    }

    var ctx      = new AudioCtx();
    _audioCtx    = ctx;
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    var audio = new global.Audio(audioUrl);
    audio.crossOrigin = "anonymous";

    var source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    onSpeechStart(analyser);

    // Modus A — visemeData vorhanden: timeupdate-Pfad
    if (Array.isArray(visemeData) && visemeData.length) {
      audio.addEventListener("timeupdate", function () {
        var currentMs = audio.currentTime * 1000;
        var match = null;
        for (var i = 0; i < visemeData.length; i++) {
          var v = visemeData[i];
          if (currentMs >= v.time && currentMs <= (v.time + (v.duration || 80))) {
            match = v;
            break;
          }
        }
        if (match) {
          applyVisemeTo3DModel(match.id, match.value);
        } else {
          applyLipsyncToCoinStage(0);
        }
      });
    } else {
      // Modus B — kein visemeData: Echtzeit-Amplitudenmessung
      startAmplitudeLoop(audio, analyser);
    }

    var ended = false;
    function handleEnd() {
      if (ended) return;
      ended = true;
      onSpeechEnd(ctx);
    }
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("error", handleEnd);

    audio.play().catch(function (e) {
      console.warn("[tts-lipsync-bridge] Audio-Fehler:", e);
      handleEnd();
    });
  };

  /**
   * Bricht aktives Lip-Sync sofort ab (z. B. bei Nutzer-Interrupt).
   */
  global.stopPauliSpeech = function () {
    cancelAnimationFrame(_animFrame);
    _animFrame = null;
    clearLipsyncStyles();
    if (global.OSGLipSync && typeof global.OSGLipSync.stop === "function") {
      global.OSGLipSync.stop();
    }
    if (_audioCtx) { try { _audioCtx.close(); } catch (_) {} _audioCtx = null; }
  };

  /**
   * Verbindet Lip-Sync-Visuals an ein extern verwaltetes Audio-Element.
   * AudioContext + AnalyserNode werden vom Aufrufer bereitgestellt und
   * verwaltet — dieser Bridge schließt den Kontext nicht.
   * Lipsync läuft bis OSGLipsyncStopVisuals() aufgerufen wird oder bis
   * das Audio-Element ein "ended"/"error"-Event sendet.
   *
   * Genutzt von OSG_AUDIO_SEGMENT für Segment-Wiedergabe.
   *
   * @param {HTMLAudioElement} audio
   * @param {AnalyserNode|null} analyser  - bereits mit destination verbunden
   */
  global.OSGLipsyncBindToAudio = function (audio, analyser) {
    cancelAnimationFrame(_animFrame);
    clearLipsyncStyles();
    onSpeechStart(analyser);
    if (analyser) startAmplitudeLoop(audio, analyser);
  };

  /**
   * Stoppt Lip-Sync-Visuals ohne den AudioContext zu schließen.
   * Genutzt wenn der Segment-Service den AudioContext selbst verwaltet.
   */
  global.OSGLipsyncStopVisuals = function () {
    cancelAnimationFrame(_animFrame);
    _animFrame = null;
    clearLipsyncStyles();
    if (global.OSGLipSync && typeof global.OSGLipSync.stop === "function") {
      global.OSGLipSync.stop();
    }
    if (
      global.OSG_PauliAvatarAnimations &&
      typeof global.OSG_PauliAvatarAnimations.onSpeakStop === "function"
    ) {
      global.OSG_PauliAvatarAnimations.onSpeakStop();
    }
    if (global.notifyFlutterAvatar) global.notifyFlutterAvatar("SPEAK_END");
  };

})(typeof window !== "undefined" ? window : globalThis);
