// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Digital Human — Phase 1 state engine (additive, backward-compatible).
 * Extends the avatar layer with CSS-fallback states; does not replace existing APIs.
 */
(function (global) {
  "use strict";

  var DH_PREFIX = "is-dh-";
  var ALL_PHASES = [
    "idle",
    "idle_breathing",
    "idle_blink",
    "listening",
    "listening_focus",
    "thinking",
    "thinking_deep",
    "speaking",
    "speaking_calm",
    "speaking_professional",
    "speaking_sales",
    "confirm",
    "celebrate",
    "welcome",
    "goodbye",
    "point_left",
    "point_right",
    "show_product",
    "show_voucher",
    "show_hotel",
    "show_insurance",
    "show_booking",
    "wait",
    "busy",
    "searching",
    "loading",
    "sympathy",
    "serious",
    "happy",
    "neutral",
    "curious",
    "confused",
    "error",
    "warning",
    "success",
    "purchase_standard",
    "purchase_premium",
    "offer_premium",
    "offer_standard",
    "partner_recommendation",
    "wai",
    "greeting",
    "resume",
    "interrupted",
    "resume_speaking",
    "conversation_finished",
    "conversation_restart",
  ];

  var EMOTIONS = [
    "neutral",
    "happy",
    "sympathy",
    "professional",
    "serious",
    "confident",
    "curious",
    "friendly",
    "sales",
    "separation",
    "anger",
    "love",
    "stress",
  ];

  var GESTURES = [
    "acknowledge",
    "confirm",
    "help",
    "greet",
    "wai",
    "point_left",
    "point_right",
    "nod",
    "wait",
    "celebrate",
  ];

  /** Maps empathy_logic emotions → digital-human emotion keys */
  var EMPATHY_TO_DH = {
    love: "happy",
    stress: "serious",
    separation: "sympathy",
    anger: "serious",
    other: "neutral",
  };

  /** Phase → optional legacy CSS class (additive, never removed by legacy code) */
  var PHASE_LEGACY = {
    wai: "is-anim-wai",
    greeting: "is-anim-wai",
    welcome: "is-anim-wai",
    purchase_standard: "is-anim-purchase-std",
    purchase_premium: "is-anim-purchase-premium",
    speaking: "is-anim-speak",
    speaking_calm: "is-anim-speak",
    speaking_professional: "is-anim-speak",
    speaking_sales: "is-anim-speak",
    resume_speaking: "is-anim-speak",
    busy: "is-busy",
  };

  var root = {
    stage: null,
    host: null,
    phase: "idle",
    emotion: "neutral",
    gesture: null,
    lookTarget: "camera",
    busy: false,
    installed: false,
    speakDepth: 0,
    thinkDepth: 0,
    listenDepth: 0,
    idleSince: 0,
    lastBlinkAt: 0,
    nextBlinkAt: 0,
    _orig: {},
  };

  function coinStage() {
    if (!root.stage) {
      root.stage = global.document && global.document.getElementById("coin-stage");
    }
    return root.stage;
  }

  function coinHost() {
    if (!root.host) {
      var el = coinStage();
      root.host = el && el.querySelector(".coin-visual-shadow-host--main");
    }
    return root.host;
  }

  function dispatch(name, detail) {
    try {
      global.document.dispatchEvent(
        new CustomEvent(name, { detail: detail || {}, bubbles: true })
      );
    } catch (_) {}
  }

  function clearDhPhaseClasses(el) {
    if (!el || !el.classList) return;
    var toRemove = [];
    el.classList.forEach(function (c) {
      if (c.indexOf(DH_PREFIX) === 0) toRemove.push(c);
    });
    toRemove.forEach(function (c) {
      el.classList.remove(c);
    });
  }

  function setPhase(phase, opts) {
    opts = opts || {};
    phase = String(phase || "idle");
    if (ALL_PHASES.indexOf(phase) < 0) phase = "idle";

    var el = coinStage();
    if (!el) return false;

    var prev = root.phase;
    root.phase = phase;
    root.busy =
      opts.busy != null
        ? !!opts.busy
        : /^(thinking|listening|speaking|busy|loading|searching|wait)/.test(phase);

    clearDhPhaseClasses(el);
    el.setAttribute("data-dh-phase", phase);
    el.classList.add(DH_PREFIX + phase.replace(/_/g, "-"));

    var legacy = PHASE_LEGACY[phase];
    if (legacy && opts.skipLegacy !== true) {
      el.classList.add(legacy);
    }

    if (phase === "idle" || phase === "idle_breathing") {
      root.idleSince = performance.now();
      scheduleBlink();
    }

    dispatch("osg:digital-human:phase", {
      phase: phase,
      previous: prev,
      opts: opts,
    });
    return true;
  }

  function setEmotion(emotion, opts) {
    opts = opts || {};
    emotion = String(emotion || "neutral");
    if (EMOTIONS.indexOf(emotion) < 0) emotion = "neutral";
    root.emotion = emotion;
    var el = coinStage();
    if (el) el.setAttribute("data-dh-emotion", emotion);
    dispatch("osg:digital-human:emotion", { emotion: emotion, opts: opts });
    return true;
  }

  function setGesture(gesture, opts) {
    opts = opts || {};
    gesture = gesture ? String(gesture) : null;
    root.gesture = gesture;
    var el = coinStage();
    if (el) {
      if (gesture) el.setAttribute("data-dh-gesture", gesture);
      else el.removeAttribute("data-dh-gesture");
    }
    if (gesture && typeof global.osgAvatarGestureStart === "function") {
      try {
        global.osgAvatarGestureStart(gesture, (opts && opts.durationMs) || 3200);
      } catch (_) {}
    }
    dispatch("osg:digital-human:gesture", { gesture: gesture, opts: opts });
    return true;
  }

  function scheduleBlink() {
    root.nextBlinkAt = performance.now() + 2200 + Math.random() * 3800;
  }

  function detectEmotion(userText) {
    var hit = null;
    if (
      global.OSG_EMPATHY_LOGIC &&
      typeof global.OSG_EMPATHY_LOGIC.classifyEmotion === "function"
    ) {
      hit = global.OSG_EMPATHY_LOGIC.classifyEmotion(userText);
    }
    var raw = hit && hit.emotion ? hit.emotion : "neutral";
    var mapped = EMPATHY_TO_DH[raw] || raw;
    if (EMOTIONS.indexOf(mapped) < 0) mapped = "neutral";
    setEmotion(mapped, { triggerId: hit && hit.triggerId, source: "empathy" });
    return mapped;
  }

  function chooseGesture(reply) {
    var text = String(reply || "").toLowerCase();
    var gesture = "acknowledge";
    if (/[?？]/.test(text)) gesture = "help";
    if (/\b(congrat|celebr|success|gewonn|freu|ยินดี|恭喜)\b/i.test(text)) {
      gesture = "celebrate";
      setPhase("celebrate", { skipLegacy: true });
    } else if (/\b(kauf|buy|angebot|offer|deal|rabatt|discount|promo)\b/i.test(text)) {
      gesture = "confirm";
      setPhase("speaking_sales", { skipLegacy: true });
    } else if (/\b(hotel|booking|buchen|reserv|insurance|versicher|voucher|gutschein)\b/i.test(text)) {
      gesture = "help";
    } else if (/\b(hallo|welcome|sawadee|greet|willkommen|สวัสดี)\b/i.test(text)) {
      gesture = "greet";
    }
    setGesture(gesture, { durationMs: 4200 });
    return gesture;
  }

  function enterThinking(deep) {
    root.thinkDepth += 1;
    setPhase(deep ? "thinking_deep" : "thinking");
    setEmotion(root.emotion === "neutral" ? "curious" : root.emotion);
    dispatch("osg:digital-human:thinking-start", { deep: !!deep });
  }

  function leaveThinking() {
    root.thinkDepth = Math.max(0, root.thinkDepth - 1);
    if (root.thinkDepth === 0 && root.speakDepth === 0 && root.listenDepth === 0) {
      setPhase("idle_breathing");
    }
    dispatch("osg:digital-human:thinking-stop", {});
  }

  function enterListening(focus) {
    root.listenDepth += 1;
    setPhase(focus ? "listening_focus" : "listening");
    setGesture("acknowledge", { durationMs: 8000 });
    dispatch("osg:digital-human:listening-start", { focus: !!focus });
  }

  function leaveListening() {
    root.listenDepth = Math.max(0, root.listenDepth - 1);
    if (root.listenDepth === 0) {
      if (root.thinkDepth > 0) setPhase("thinking");
      else if (root.speakDepth === 0) setPhase("idle_breathing");
    }
    dispatch("osg:digital-human:listening-stop", {});
  }

  function enterSpeaking(variant) {
    root.speakDepth += 1;
    var phase = variant || "speaking";
    if (ALL_PHASES.indexOf(phase) < 0) phase = "speaking";
    setPhase(phase);
    dispatch("osg:digital-human:speaking-start", { variant: phase });
  }

  function leaveSpeaking() {
    root.speakDepth = Math.max(0, root.speakDepth - 1);
    if (root.speakDepth === 0) {
      setPhase("idle_breathing");
      setGesture(null);
    }
    dispatch("osg:digital-human:speaking-stop", {});
  }

  function tick(now, delta) {
    if (!coinStage()) return;
    var t = now || performance.now();
    delta = delta || 0.016;

    /* Blink: exclusively handled by OSG_DIGITAL_HUMAN_MOTION — no duplicate here. */

    if (root.phase === "thinking" || root.phase === "thinking_deep") {
      var host = coinHost();
      if (host && !host.style.transform) {
        var micro = Math.sin(t * 0.003) * 0.4;
        host.style.setProperty("--dh-micro-y", micro.toFixed(3) + "deg");
      }
    }
  }

  function resolveSpeakingVariant(opts) {
    opts = opts || {};
    if (global.__OSG_DH_SPEAKING_VARIANT__) return global.__OSG_DH_SPEAKING_VARIANT__;
    if (opts.emotion === "sales" || /sales/i.test(String(opts.intent || ""))) {
      return "speaking_sales";
    }
    if (opts.emotion === "professional") return "speaking_professional";
    if (opts.whisper) return "speaking_calm";
    return "speaking";
  }

  function wrapLipSync() {
    var LS = global.OSGLipSync;
    if (!LS || root._orig.lipSyncBegin) return;
    // P0: DH speaking sync lives in osgLipSyncBegin/Stop (index.html choke point).
    // Wrap preserves originals only — no duplicate enterSpeaking/leaveSpeaking here.
    if (typeof LS.begin === "function") {
      root._orig.lipSyncBegin = LS.begin;
      LS.begin = function (opts) {
        return root._orig.lipSyncBegin.call(LS, opts);
      };
    }
    if (typeof LS.start === "function") {
      root._orig.lipSyncStart = LS.start;
      LS.start = function (durationMs) {
        return root._orig.lipSyncStart.call(LS, durationMs);
      };
    }
    if (typeof LS.stop === "function") {
      root._orig.lipSyncStop = LS.stop;
      LS.stop = function () {
        return root._orig.lipSyncStop.call(LS);
      };
    }
  }

  function wrapPlayPauliVoice() {
    if (root._orig.playPauliVoice || typeof global.playPauliVoice !== "function") return;
    root._orig.playPauliVoice = global.playPauliVoice;
    global.playPauliVoice = async function (text, opts) {
      opts = opts || {};
      if (opts.emotion) setEmotion(opts.emotion);
      if (opts.gesture) setGesture(opts.gesture);
      var variant = resolveSpeakingVariant(opts);
      global.__OSG_DH_SPEAKING_VARIANT__ = variant;
      try {
        return await root._orig.playPauliVoice.call(global, text, opts);
      } finally {
        try {
          delete global.__OSG_DH_SPEAKING_VARIANT__;
        } catch (_) {
          global.__OSG_DH_SPEAKING_VARIANT__ = undefined;
        }
      }
    };
  }

  function bindDocumentEvents() {
    global.document.addEventListener("osg:digital-human:set-phase", function (e) {
      if (e.detail && e.detail.phase) setPhase(e.detail.phase, e.detail);
    });
    global.document.addEventListener("osg:digital-human:thinking", function (e) {
      if (e.detail && e.detail.stop) leaveThinking();
      else enterThinking(!!(e.detail && e.detail.deep));
    });
    global.document.addEventListener("osg:digital-human:listening", function (e) {
      if (e.detail && e.detail.stop) leaveListening();
      else enterListening(!!(e.detail && e.detail.focus));
    });
  }

  function install() {
    if (root.installed) return true;
    coinStage();
    wrapLipSync();
    wrapPlayPauliVoice();
    bindDocumentEvents();
    setPhase("idle_breathing");
    setEmotion("neutral");
    root.installed = true;
    dispatch("osg:digital-human:ready", { phases: ALL_PHASES.slice() });
    return true;
  }

  async function processInput(userText) {
    setPhase("thinking");
    detectEmotion(userText);
    var fetchFn = global.osgPauliChatFetch;
    if (typeof fetchFn !== "function") {
      leaveThinking();
      return "";
    }
    var lang =
      global.__OSG_I18N && global.__OSG_I18N.systemLangCode
        ? global.__OSG_I18N.systemLangCode()
        : "en";
    var reply = "";
    try {
      reply = await fetchFn(userText, lang);
    } finally {
      leaveThinking();
    }
    await prepareReply(reply);
    return reply;
  }

  async function prepareReply(reply) {
    chooseGesture(reply);
    await speak(reply);
    setPhase("conversation_finished");
    global.setTimeout(function () {
      if (root.speakDepth === 0 && root.listenDepth === 0 && root.thinkDepth === 0) {
        setPhase("idle_breathing");
      }
    }, 480);
  }

  async function speak(reply) {
    if (typeof global.playPauliVoice !== "function") return;
    var opts = {
      speechKey: "",
      gesture: root.gesture,
      emotion: root.emotion,
    };
    if (global.OSG_PAULI_ALLOW_CLOUD_TTS && !global.OSG_PAULI_DISABLE_CLOUD_TTS) {
      opts.allowCloudTts = true;
    }
    opts.dynamicSpeech = true;
    await global.playPauliVoice(String(reply || ""), opts);
  }

  var api = {
    ALL_PHASES: ALL_PHASES,
    EMOTIONS: EMOTIONS,
    GESTURES: GESTURES,
    state: root,
    install: install,
    setPhase: setPhase,
    setEmotion: setEmotion,
    setGesture: setGesture,
    detectEmotion: detectEmotion,
    chooseGesture: chooseGesture,
    enterThinking: enterThinking,
    leaveThinking: leaveThinking,
    enterListening: enterListening,
    leaveListening: leaveListening,
    enterSpeaking: enterSpeaking,
    leaveSpeaking: leaveSpeaking,
    tick: tick,
    processInput: processInput,
    prepareReply: prepareReply,
    speak: speak,
    getMatrix: function () {
      return {
        phases: ALL_PHASES.slice(),
        emotions: EMOTIONS.slice(),
        gestures: GESTURES.slice(),
        empathyMap: Object.assign({}, EMPATHY_TO_DH),
        legacyPhaseMap: Object.assign({}, PHASE_LEGACY),
      };
    },
  };

  global.OSG_DIGITAL_HUMAN = api;

  /** Alias for Phase-2 orchestration (additive, optional) */
  global.OSG_AVATAR = {
    state: {
      get phase() {
        return root.phase;
      },
      get emotion() {
        return root.emotion;
      },
      get gesture() {
        return root.gesture;
      },
      get lookTarget() {
        return root.lookTarget;
      },
      get busy() {
        return root.busy;
      },
    },
    setPhase: setPhase,
    setEmotion: setEmotion,
    setGesture: setGesture,
    detectEmotion: detectEmotion,
    chooseGesture: chooseGesture,
    processInput: processInput,
    prepareReply: prepareReply,
    speak: speak,
    install: install,
    tick: tick,
  };

  function osgDhBootInstall() {
    try {
      install();
    } catch (_) {}
  }

  if (global.document) {
    if (
      global.OSG_DOM_BOOT &&
      typeof global.OSG_DOM_BOOT.whenAvatarRuntimeReady === "function"
    ) {
      global.OSG_DOM_BOOT.whenAvatarRuntimeReady(osgDhBootInstall);
    } else if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", osgDhBootInstall);
    } else {
      osgDhBootInstall();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
