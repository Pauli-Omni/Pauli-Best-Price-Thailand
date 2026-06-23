// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.

/**
 * avatar-3d-bridge.js
 *
 * Bidirektionale Brücke zwischen Flutter (WebViewController) und
 * dem Pauli-Avatar-System im Web-Layer (CSS-Animationen auf #coin-stage).
 *
 * Flutter → Web:  window.trigger3DAvatar('ACTION')
 *                 — wird von Flutter per runJavaScript() aufgerufen
 *
 * Web → Flutter:  window.notifyFlutterAvatar('ANIM_KEY')
 *                 — sendet Schlüssel an AvatarAnimationService via JS-Channel
 *
 * Ausdrucksstarke Aktionen (Sound + Animation):
 *                 window.triggerPauliExpressiveAction('LAUGHING')
 *                 window.triggerPauliExpressiveAction('CLAPPING')
 *
 * WICHTIG: Dieses Projekt verwendet KEIN Three.js AnimationMixer / GLTF.
 * Animationen laufen über CSS-Keyframes auf #coin-stage (OSG_PauliAvatarAnimations).
 * Sound-Pfade sind immer locale-aware: /sounds/pauli/{lang}/{key}.mp3
 */
(function (global) {
  "use strict";

  // ── Animations-Registry ──────────────────────────────────────────────────

  /**
   * Mapping: interner Animations-Name → CSS-Klasse auf #coin-stage + Dauer (ms).
   * Dauer muss zur CSS-Animation-Duration passen, damit die Klasse rechtzeitig
   * entfernt wird und eine Wiederholung möglich bleibt.
   */
  var BRIDGE_ANIMS = {
    pauli_lean_forward:    { cls: "is-speak-forward", ms: 1000 },
    pauli_exit_coin:       { cls: "is-exit-coin",     ms: 1400 },
    pauli_sit_with_coffee: { cls: "is-sit-coffee",    ms: 3200 },
    pauli_enter_coin:      { cls: "is-enter-coin",    ms:  900 },
    pauli_laugh_animation: { cls: "is-bridge-laugh",  ms: 2200 },
    pauli_applause_animation: { cls: "is-bridge-clap", ms: 2800 },
  };

  // ── Sound-Registry ────────────────────────────────────────────────────────

  /**
   * Locale-aware Sounds für expressive Aktionen.
   * Pfadmuster: /sounds/pauli/{lang}/{key}.mp3
   * Sound-Dateien müssen pro Sprache im jeweiligen Unterordner abgelegt werden.
   * Fehlende Dateien werden still ignoriert (kein Absturz).
   *
   * Vorhandene fun-Sounds (Stand 2026-06-23):
   *   th/fun_crab_instinct.mp3  ← Vorlage für weitere fun-Sounds
   *
   * Zu ergänzen:
   *   {lang}/fun_laugh.mp3
   *   {lang}/fun_clapping.mp3
   */
  var EXPRESSIVE_SOUNDS = {
    LAUGHING: "fun_laugh",
    CLAPPING: "fun_clapping",
  };

  var _stage       = null;
  var _timers      = Object.create(null);
  var _activeAudio = null;

  // ── DOM-Helpers ───────────────────────────────────────────────────────────

  function coinStage() {
    if (!_stage) {
      _stage = global.document && global.document.getElementById("coin-stage");
    }
    return _stage;
  }

  /**
   * Liest die aktive UI-Sprache — identisch zu index.html Zeile 14408.
   * Fallback: "th" (primäre App-Sprache).
   */
  function currentLang() {
    var lang = global.document
      ? (global.document.documentElement.getAttribute("lang") || "th")
      : "th";
    // Normalisierung: "th-TH" → "th", "de-DE" → "de"
    return lang.split("-")[0].toLowerCase() || "th";
  }

  // ── Animations-Engine ─────────────────────────────────────────────────────

  /**
   * Setzt CSS-Klasse auf #coin-stage und entfernt sie nach cfg.ms automatisch.
   * Entspricht semantisch dem AnimationMixer.reset().fadeIn().play()-Pattern —
   * hier über CSS-Keyframes realisiert (kein Three.js vorhanden).
   */
  function play3DAnimation(animName) {
    var cfg = BRIDGE_ANIMS[animName];
    var el  = coinStage();
    if (!el) return;
    if (!cfg) {
      console.warn("[avatar-3d-bridge] Unbekannte Animation:", animName);
      return;
    }
    el.classList.add(cfg.cls);
    clearTimeout(_timers[animName]);
    _timers[animName] = setTimeout(function () {
      if (el) el.classList.remove(cfg.cls);
    }, cfg.ms);
  }

  /**
   * Stoppt alle laufenden Bridge-Animationen sofort.
   * Verhindert Überlappungen wenn eine neue expressive Aktion gestartet wird.
   */
  function stopAllCurrent3DAnimations() {
    var el = coinStage();
    Object.keys(BRIDGE_ANIMS).forEach(function (name) {
      clearTimeout(_timers[name]);
      if (el) el.classList.remove(BRIDGE_ANIMS[name].cls);
    });
  }

  // ── Sound-Engine ──────────────────────────────────────────────────────────

  /**
   * Spielt eine lokale Sound-Datei ab.
   * - Respektiert den Audio-Gate der App (window.osgPauliAudioAllowed)
   * - Locale-aware: Pfad muss bereits aufgelöst sein (z. B. /sounds/pauli/th/fun_laugh.mp3)
   * - Fehlt die Datei (404), wird still ignoriert (kein Absturz, nur Console-Info)
   *
   * @param {string} url  Vollständiger URL-Pfad zur Sound-Datei
   */
  function playLocalSound(url) {
    if (
      typeof global.osgPauliAudioAllowed === "function" &&
      !global.osgPauliAudioAllowed()
    ) {
      return; // Audio-Gate: Nutzer hat Audio nicht erlaubt
    }
    if (_activeAudio) {
      try { _activeAudio.pause(); } catch (_) {}
      _activeAudio = null;
    }
    var audio = new global.Audio(url);
    audio.onerror = function () {
      console.info(
        "[avatar-3d-bridge] Sound nicht gefunden (Datei noch nicht erstellt?):", url
      );
    };
    _activeAudio = audio;
    audio.play().catch(function (e) {
      console.info("[avatar-3d-bridge] Autoplay blockiert:", e.message || e);
    });
  }

  /**
   * Gibt den locale-aware Pfad für einen expressive Sound zurück.
   * Muster: /sounds/pauli/{lang}/{soundKey}.mp3
   */
  function expressiveSoundUrl(actionType) {
    var key = EXPRESSIVE_SOUNDS[actionType];
    if (!key) return null;
    return "/sounds/pauli/" + currentLang() + "/" + key + ".mp3";
  }

  // ── Flutter → Web ─────────────────────────────────────────────────────────

  // ── 3D-Coin-Spin ─────────────────────────────────────────────────────────

  /**
   * Schaltet die 3D-Münzrotation (5 s / 360°) ein oder aus.
   * Setzt die CSS-Klasse is-bridge-3d-spin auf #coin-stage.
   *
   * Automatischer Freeze-Fallback: Wenn der Rest des Systems einfriert,
   * bleibt die Münze sichtbar und rotiert — Pauli steht in der Ecke.
   *
   * @param {boolean} [enable=true]  true = starten, false = stoppen
   */
  function setCoinSpin(enable) {
    var el = coinStage();
    if (!el) return;
    if (enable === false) {
      el.classList.remove("is-bridge-3d-spin");
    } else {
      el.classList.add("is-bridge-3d-spin");
    }
    console.log("[avatar-3d-bridge] 3D-Spin:", enable === false ? "AUS" : "EIN");
  }

  // Öffentlich zugänglich für andere Skripte
  global.triggerPauliCoinSpin = setCoinSpin;

  // ── Flutter → Web ─────────────────────────────────────────────────────────

  /**
   * Wird von Flutter per runJavaScript() aufgerufen:
   *   widget.webController.runJavaScript(
   *     "if(window.trigger3DAvatar) window.trigger3DAvatar('SPEAK_FORWARD');"
   *   )
   */
  global.trigger3DAvatar = function (action) {
    console.log("[avatar-3d-bridge] Befehl empfangen:", action);

    switch (action) {
      case "SPEAK_FORWARD":
        play3DAnimation("pauli_lean_forward");
        break;

      case "EXIT_COIN_CHAIR":
        play3DAnimation("pauli_exit_coin");
        play3DAnimation("pauli_sit_with_coffee");
        break;

      case "RETURN_TO_COIN":
        play3DAnimation("pauli_enter_coin");
        break;

      case "START_COIN_SPIN":
        setCoinSpin(true);
        break;

      case "STOP_COIN_SPIN":
        setCoinSpin(false);
        break;

      default:
        console.warn("[avatar-3d-bridge] Unbekannter Befehl:", action);
    }
  };

  /**
   * Ausdrucksstarke Aktionen mit Sound + Animation.
   * Stoppt laufende Animationen vor dem Start (kein Überlappen).
   *
   * Aufruf intern (andere Web-Skripte):
   *   window.triggerPauliExpressiveAction('LAUGHING')
   *
   * Aufruf von Flutter:
   *   widget.webController.runJavaScript(
   *     "if(window.triggerPauliExpressiveAction) window.triggerPauliExpressiveAction('CLAPPING');"
   *   )
   */
  global.triggerPauliExpressiveAction = function (actionType) {
    console.log("[avatar-3d-bridge] Ausdrucksstarke Aktion:", actionType);

    stopAllCurrent3DAnimations();

    switch (actionType) {
      case "LAUGHING":
        play3DAnimation("pauli_laugh_animation");
        playLocalSound(expressiveSoundUrl("LAUGHING"));
        // Flutter ebenfalls benachrichtigen (für AvatarAnimationService-Tracking)
        global.notifyFlutterAvatar && global.notifyFlutterAvatar("LAUGH_TRIUMPH");
        break;

      case "CLAPPING":
        play3DAnimation("pauli_applause_animation");
        playLocalSound(expressiveSoundUrl("CLAPPING"));
        global.notifyFlutterAvatar && global.notifyFlutterAvatar("HAPPY_JUMP");
        break;

      default:
        console.warn("[avatar-3d-bridge] Unbekannte expressive Aktion:", actionType);
    }
  };

  // ── Web → Flutter ─────────────────────────────────────────────────────────

  /**
   * Sendet Animations-Schlüssel an AvatarAnimationService in Flutter.
   * Flutter-Seite: addJavaScriptChannel('AvatarAnimationChannel', ...)
   *
   * Beispiel: window.notifyFlutterAvatar('CRAB_DANCE')
   */
  global.notifyFlutterAvatar = function (animKey) {
    var ch = global.AvatarAnimationChannel;
    if (ch && typeof ch.postMessage === "function") {
      ch.postMessage(String(animKey));
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
