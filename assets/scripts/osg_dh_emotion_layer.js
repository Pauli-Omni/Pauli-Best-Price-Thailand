// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Digital Human — Phase 4 Emotion Layer
 *
 * Additive extension. Does NOT modify any Phase 1/2/3 APIs.
 *
 * Architecture:
 *   - Blend stack: up to N emotions active simultaneously, each with
 *     weight 0–1 (maps to 0–100 % intensity).
 *   - Crossfade: every emotion fades in / out smoothly over a
 *     configurable transition duration (default 0.6 s).
 *   - Three independent channels per emotion:
 *       face   → CSS filter modifiers (brightness, saturation, contrast)
 *       eye    → gaze offset target modifier (additive to Phase 2/3 eye)
 *       head   → head-pitch / roll offset modifier (additive to Phase 2/3)
 *   - All output written as CSS custom properties on #coin-stage:
 *       --dh4-face-bright, --dh4-face-sat, --dh4-face-contrast
 *       --dh4-head-rx, --dh4-head-rz   (additive deg)
 *       --dh4-eye-x,  --dh4-eye-y     (additive px)
 *   - CSS applies them via a dedicated filter + transform layer (class
 *     is-dh4-active on #coin-stage).
 *   - Zero setInterval, zero own rAF. Tick is called from the host
 *     animate() loop via OSG_DH_EMOTION_LAYER.tick(dt).
 *
 * Backward compatibility:
 *   - Existing setEmotion() in Phase 2/3 still works unmodified.
 *   - Phase 4 listens to "osg:digital-human:emotion" events and adds
 *     the emotion at weight 1.0, replacing it with a blend transition.
 *   - Callers can still use the simple setEmotion() API; Phase 4 then
 *     crossfades automatically.
 */
(function (global) {
  "use strict";

  // ── Emotion definitions ──────────────────────────────────────────────────
  // Each emotion has three channel descriptors (target values at weight=1):
  //   face: { bright, sat, contrast }  (multipliers; 1 = neutral)
  //   eye:  { x, y }                   (additive deg to Phase-2/3 eye target)
  //   head: { rx, rz }                 (additive deg to Phase-2/3 head)
  // Values are additive on top of Phase 2/3 neutral pose.

  var EMOTION_DEFS = {
    neutral: {
      face: { bright: 1.00, sat: 1.00, contrast: 1.00 },
      eye:  { x: 0,    y: 0    },
      head: { rx: 0,   rz: 0   },
    },
    happy: {
      face: { bright: 1.10, sat: 1.12, contrast: 1.02 },
      eye:  { x: 0,    y: -1.2 },   // eyes slightly upward
      head: { rx: -2,  rz:  1.5 },  // chin up, slight tilt
    },
    sad: {
      face: { bright: 0.90, sat: 0.82, contrast: 0.96 },
      eye:  { x: 0,    y:  1.8 },   // eyes downward
      head: { rx:  5,  rz: -1.5 },  // head down
    },
    anger: {
      face: { bright: 0.96, sat: 1.18, contrast: 1.08 },
      eye:  { x: 0,    y:  0.6 },
      head: { rx:  2,  rz: -0.8 },
    },
    separation: {
      face: { bright: 0.88, sat: 0.78, contrast: 0.94 },
      eye:  { x: -0.8, y:  2.0 },   // averted gaze
      head: { rx:  6,  rz: -2.5 },
    },
    sympathy: {
      face: { bright: 0.92, sat: 0.86, contrast: 0.97 },
      eye:  { x: -0.5, y:  1.6 },
      head: { rx:  4,  rz: -2.0 },
    },
    surprised: {
      face: { bright: 1.06, sat: 1.10, contrast: 1.04 },
      eye:  { x: 0,    y: -2.0 },   // wide eyes
      head: { rx: -4,  rz:  0   },
    },
    confident: {
      face: { bright: 1.04, sat: 1.05, contrast: 1.03 },
      eye:  { x: 0,    y: -0.5 },
      head: { rx: -1,  rz:  1   },
    },
    thinking: {
      face: { bright: 0.97, sat: 0.95, contrast: 1.00 },
      eye:  { x: -1.5, y:  1.0 },   // looking aside/down
      head: { rx:  3,  rz: -1.5 },
    },
    listening: {
      face: { bright: 1.02, sat: 1.02, contrast: 1.00 },
      eye:  { x:  0,   y: -0.8 },
      head: { rx: -3,  rz:  1.0 },
    },
    love: {
      face: { bright: 1.08, sat: 1.20, contrast: 1.01 },
      eye:  { x:  0,   y: -1.5 },
      head: { rx: -2,  rz:  2.5 },
    },
    stress: {
      face: { bright: 0.94, sat: 1.08, contrast: 1.06 },
      eye:  { x:  0.6, y:  0.8 },
      head: { rx:  2,  rz: -0.5 },
    },
    curious: {
      face: { bright: 1.04, sat: 1.06, contrast: 1.01 },
      eye:  { x:  1.0, y: -0.8 },   // slight side glance
      head: { rx: -2,  rz:  3.5 },
    },
    professional: {
      face: { bright: 1.00, sat: 0.98, contrast: 1.01 },
      eye:  { x:  0,   y:  0    },
      head: { rx:  0,  rz:  0   },
    },
    serious: {
      face: { bright: 0.96, sat: 0.92, contrast: 1.04 },
      eye:  { x:  0,   y:  0.5 },
      head: { rx:  1,  rz: -0.5 },
    },
    friendly: {
      face: { bright: 1.07, sat: 1.10, contrast: 1.01 },
      eye:  { x:  0,   y: -1.0 },
      head: { rx: -1,  rz:  2.0 },
    },
    sales: {
      face: { bright: 1.08, sat: 1.14, contrast: 1.03 },
      eye:  { x:  0,   y: -0.8 },
      head: { rx: -1,  rz:  1.5 },
    },
  };

  // ── Blend stack ───────────────────────────────────────────────────────────
  // Each entry: { name, weight, targetWeight, fadeDuration, fadeTimer, channel }
  // channel: "all" | "face" | "eye" | "head"
  // weight is the current interpolated weight (0–1).
  // targetWeight is the desired end weight.

  var _stack = [];           // active emotions
  var _maxStack = 4;         // max simultaneous emotions
  var _defaultFade = 0.6;    // seconds
  var _installed = false;
  var _stage = null;

  // Blended result (recalculated every tick)
  var _blended = {
    face: { bright: 1.0, sat: 1.0, contrast: 1.0 },
    eye:  { x: 0, y: 0 },
    head: { rx: 0, rz: 0 },
  };

  // Channel intensity overrides (0–1 per channel; default 1)
  var _channelIntensity = { face: 1.0, eye: 1.0, head: 1.0 };

  // ── Helpers ───────────────────────────────────────────────────────────────

  function coinStage() {
    if (!_stage) {
      _stage = global.document && global.document.getElementById("coin-stage");
    }
    return _stage;
  }

  function setCssVar(el, name, value) {
    if (el) el.style.setProperty(name, value);
  }

  function lerp(a, b, t) {
    return a + (b - a) * Math.min(1, Math.max(0, t));
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function defFor(name) {
    return EMOTION_DEFS[name] || EMOTION_DEFS["neutral"];
  }

  // ── Stack management ──────────────────────────────────────────────────────

  function findEntry(name, channel) {
    channel = channel || "all";
    for (var i = 0; i < _stack.length; i++) {
      if (_stack[i].name === name && _stack[i].channel === channel) {
        return _stack[i];
      }
    }
    return null;
  }

  /**
   * Add or update an emotion in the blend stack.
   * @param {string} name          Emotion key (e.g. "happy")
   * @param {number} [intensity]   0–100 (maps to weight 0–1). Default 100.
   * @param {object} [opts]
   *   opts.fadeDuration  Crossfade duration in seconds. Default 0.6.
   *   opts.channel       "all" | "face" | "eye" | "head". Default "all".
   */
  function addEmotion(name, intensity, opts) {
    opts = opts || {};
    if (!EMOTION_DEFS[name]) name = "neutral";
    var targetWeight = clamp01((intensity != null ? intensity : 100) / 100);
    var fadeDuration = opts.fadeDuration != null ? opts.fadeDuration : _defaultFade;
    var channel = opts.channel || "all";

    var entry = findEntry(name, channel);
    if (entry) {
      entry.targetWeight = targetWeight;
      entry.fadeDuration = Math.max(0.05, fadeDuration);
      entry.fadeTimer = 0;
      return entry;
    }

    // Evict lowest-weight entry when stack is full
    if (_stack.length >= _maxStack) {
      var minW = 1;
      var minIdx = 0;
      for (var i = 0; i < _stack.length; i++) {
        if (_stack[i].weight < minW) { minW = _stack[i].weight; minIdx = i; }
      }
      _stack.splice(minIdx, 1);
    }

    var newEntry = {
      name: name,
      weight: 0,
      targetWeight: targetWeight,
      fadeDuration: Math.max(0.05, fadeDuration),
      fadeTimer: 0,
      channel: channel,
    };
    _stack.push(newEntry);
    return newEntry;
  }

  /**
   * Remove (fade out) an emotion from the stack.
   * @param {string} name
   * @param {string} [channel]
   * @param {number} [fadeDuration]
   */
  function removeEmotion(name, channel, fadeDuration) {
    channel = channel || "all";
    var entry = findEntry(name, channel);
    if (!entry) return;
    entry.targetWeight = 0;
    entry.fadeDuration = Math.max(0.05, fadeDuration != null ? fadeDuration : _defaultFade);
    entry.fadeTimer = 0;
  }

  /**
   * Replace all active emotions with a single one (hard crossfade).
   * Compatible with the legacy setEmotion(name) call path.
   */
  function setEmotionBlend(name, intensity, opts) {
    opts = opts || {};
    var fadeDuration = opts.fadeDuration != null ? opts.fadeDuration : _defaultFade;
    // Fade out all others except "neutral" base
    for (var i = 0; i < _stack.length; i++) {
      if (_stack[i].name !== name) {
        _stack[i].targetWeight = 0;
        _stack[i].fadeDuration = fadeDuration;
        _stack[i].fadeTimer = 0;
      }
    }
    addEmotion(name, intensity != null ? intensity : 100, opts);
  }

  /**
   * Set per-channel intensity (0–100).
   * Does not affect which emotions are in the stack — only scales their output.
   */
  function setChannelIntensity(channel, pct) {
    if (channel === "face" || channel === "all") _channelIntensity.face = clamp01(pct / 100);
    if (channel === "eye"  || channel === "all") _channelIntensity.eye  = clamp01(pct / 100);
    if (channel === "head" || channel === "all") _channelIntensity.head = clamp01(pct / 100);
  }

  // ── Tick ─────────────────────────────────────────────────────────────────

  function tick(dt) {
    if (!_installed) return;
    dt = Math.min(0.1, dt || 0.016);

    // 1. Advance weights for all entries
    var toRemove = [];
    for (var i = 0; i < _stack.length; i++) {
      var e = _stack[i];
      e.fadeTimer += dt;
      var progress = e.fadeDuration > 0 ? e.fadeTimer / e.fadeDuration : 1;
      var eased = easeInOut(clamp01(progress));
      e.weight = lerp(e.weight, e.targetWeight, eased);

      // Snap very close values
      if (Math.abs(e.weight - e.targetWeight) < 0.002) {
        e.weight = e.targetWeight;
      }
      // Prune fully faded-out entries (except neutral baseline)
      if (e.weight <= 0 && e.targetWeight <= 0 && e.name !== "neutral") {
        toRemove.push(i);
      }
    }
    for (var r = toRemove.length - 1; r >= 0; r--) {
      _stack.splice(toRemove[r], 1);
    }

    // 2. Blend all active emotions
    var sumW = 0;
    var face = { bright: 0, sat: 0, contrast: 0 };
    var eye  = { x: 0, y: 0 };
    var head = { rx: 0, rz: 0 };

    for (var j = 0; j < _stack.length; j++) {
      var en = _stack[j];
      if (en.weight <= 0) continue;
      var def = defFor(en.name);
      var w = en.weight;
      var ch = en.channel;

      if (ch === "all" || ch === "face") {
        face.bright   += (def.face.bright   - 1) * w;
        face.sat      += (def.face.sat      - 1) * w;
        face.contrast += (def.face.contrast - 1) * w;
      }
      if (ch === "all" || ch === "eye") {
        eye.x += def.eye.x * w;
        eye.y += def.eye.y * w;
      }
      if (ch === "all" || ch === "head") {
        head.rx += def.head.rx * w;
        head.rz += def.head.rz * w;
      }
      sumW += w;
    }

    // 3. Apply channel intensity scaling
    var fI = _channelIntensity.face;
    var eI = _channelIntensity.eye;
    var hI = _channelIntensity.head;

    _blended.face.bright   = 1 + face.bright   * fI;
    _blended.face.sat      = 1 + face.sat       * fI;
    _blended.face.contrast = 1 + face.contrast  * fI;
    _blended.eye.x  = eye.x  * eI;
    _blended.eye.y  = eye.y  * eI;
    _blended.head.rx = head.rx * hI;
    _blended.head.rz = head.rz * hI;

    // 4. Write CSS vars
    var el = coinStage();
    if (!el) return;

    setCssVar(el, "--dh4-face-bright",   _blended.face.bright.toFixed(4));
    setCssVar(el, "--dh4-face-sat",      _blended.face.sat.toFixed(4));
    setCssVar(el, "--dh4-face-contrast", _blended.face.contrast.toFixed(4));
    setCssVar(el, "--dh4-head-rx",       _blended.head.rx.toFixed(3) + "deg");
    setCssVar(el, "--dh4-head-rz",       _blended.head.rz.toFixed(3) + "deg");
    setCssVar(el, "--dh4-eye-x",         (_blended.eye.x * 7).toFixed(2) + "px");
    setCssVar(el, "--dh4-eye-y",         (_blended.eye.y * 5).toFixed(2) + "px");

    // 5. CSS class for filter activation
    if (_stack.length > 0 && sumW > 0.01) {
      if (!el.classList.contains("is-dh4-active")) el.classList.add("is-dh4-active");
    } else {
      el.classList.remove("is-dh4-active");
    }

    // 6. Update dominant emotion class (for legacy Phase 2/3 integration)
    var dominant = "neutral";
    var maxW = 0;
    for (var k = 0; k < _stack.length; k++) {
      if (_stack[k].weight > maxW) { maxW = _stack[k].weight; dominant = _stack[k].name; }
    }
    var newClass = "is-dh4-emotion-" + dominant;
    if (!el.classList.contains(newClass)) {
      // Remove stale dh4 emotion classes
      var rmCls = [];
      el.classList.forEach(function (c) {
        if (c.indexOf("is-dh4-emotion-") === 0) rmCls.push(c);
      });
      rmCls.forEach(function (c) { el.classList.remove(c); });
      el.classList.add(newClass);
    }
  }

  // ── Install ───────────────────────────────────────────────────────────────

  function install() {
    if (_installed) return true;
    _installed = true;
    coinStage();

    // Seed neutral as baseline (always present at weight 1)
    addEmotion("neutral", 100, { fadeDuration: 0 });

    // Listen to Phase 1 emotion events — translate to blend
    if (global.document) {
      global.document.addEventListener("osg:digital-human:emotion", function (e) {
        if (e.detail && e.detail.emotion) {
          setEmotionBlend(e.detail.emotion, 100);
        }
      });
    }

    return true;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  global.OSG_DH_EMOTION_LAYER = {
    // Core
    install: install,
    tick: tick,

    // Emotion control
    addEmotion: addEmotion,          // addEmotion(name, intensity0to100, opts)
    removeEmotion: removeEmotion,    // removeEmotion(name, channel, fadeDuration)
    setEmotion: setEmotionBlend,     // setEmotion(name, intensity, opts) — crossfade

    // Channel control
    setChannelIntensity: setChannelIntensity, // setChannelIntensity("face"|"eye"|"head"|"all", 0–100)

    // Config
    setDefaultFade: function (s) { _defaultFade = Math.max(0.05, s); },
    setMaxStack: function (n) { _maxStack = Math.max(1, Math.min(8, n | 0)); },

    // Inspect
    getStack: function () {
      return _stack.map(function (e) {
        return {
          name: e.name,
          weight: Math.round(e.weight * 100),
          targetWeight: Math.round(e.targetWeight * 100),
          channel: e.channel,
        };
      });
    },
    getBlended: function () {
      return {
        face: Object.assign({}, _blended.face),
        eye:  Object.assign({}, _blended.eye),
        head: Object.assign({}, _blended.head),
        channelIntensity: Object.assign({}, _channelIntensity),
      };
    },
    getEmotionDefs: function () { return Object.keys(EMOTION_DEFS); },

    // Convenience: blend two emotions with weights
    blendTwo: function (nameA, pctA, nameB, pctB, opts) {
      setEmotionBlend(nameA, pctA, opts);
      addEmotion(nameB, pctB, opts);
    },
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
