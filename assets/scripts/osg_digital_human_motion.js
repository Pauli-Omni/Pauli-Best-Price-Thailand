// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Digital Human — Phase 2 + Phase 3 Motion Engine
 *
 * Additive layer on top of Phase 1 (osg_digital_human_engine.js).
 *
 * Phase 2 layers:
 *   - Idle breathing + micro body sway
 *   - Natural blink (2–7 s, irregular)
 *   - Eye movement (camera, cursor, micro saccades)
 *   - Head movement (phase-driven)
 *   - Emotion overlays (additive CSS custom properties)
 *   - Gesture layer (independent of emotion)
 *   - Thinking / Listening / Speaking posture layers
 *
 * Phase 3 additions (Micro Motion):
 *   - Shoulder layer (independent CSS var, additive)
 *   - Weight shift (slow lateral body lean, 4–8 s cycle)
 *   - Multi-frequency noise (overlapping sine bands for organic feel)
 *   - Performance budget (frame-skip on low-end / mobile)
 *   - Page-visibility pause (no tick when tab hidden)
 *   - Reduced-motion guard at runtime (not just CSS)
 *
 * Rules:
 *   - One shared rAF slot from host animate() loop — no own rAF.
 *   - All layers are additive CSS vars on #coin-stage only.
 *   - Zero setInterval.
 *   - No changes to playPauliVoice, OSGLipSync, AudioRegistry, EmpathyLogic.
 */
(function (global) {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────

  var _installed = false;
  var _stage = null;
  var _t = 0; // running time (s)

  // ── Phase 3: Performance budget ─────────────────────────────────────────
  // Frame-skip: on low-end devices only update motion every N frames.
  // Detected once at install; never changes at runtime.
  var _frameSkip = 1;        // 1 = every frame, 2 = every other frame, etc.
  var _frameCount = 0;
  var _paused = false;       // true when tab is hidden (Page Visibility)

  // ── Phase 3: Multi-frequency noise accumulators ─────────────────────────
  // Each axis has 3 sine oscillators at incommensurable frequencies,
  // weighted and summed. Produces pseudo-random organic drift without
  // Math.random() per frame (deterministic, zero GC).
  var _noise = {
    // [phase_rad, freq_rad_per_s, amplitude]
    headX: [[0, 0.23, 0.60], [0, 0.47, 0.28], [0, 0.79, 0.12]],
    headY: [[0, 0.17, 0.50], [0, 0.37, 0.22], [0, 0.61, 0.08]],
    headZ: [[0, 0.13, 0.40], [0, 0.29, 0.18], [0, 0.53, 0.07]],
    bodyX: [[0, 0.11, 1.20], [0, 0.19, 0.40], [0, 0.31, 0.15]],
    bodyZ: [[0, 0.07, 0.45], [0, 0.13, 0.18], [0, 0.23, 0.07]],
  };

  // ── Phase 3: Shoulder layer ─────────────────────────────────────────────
  var _shoulder = {
    rz: 0,        // current roll offset (deg) — additive to head-rz
    targetRz: 0,
    phase: 0,
    speed: 0.14,  // rad/s — slower than sway
    amplitude: 0.8, // deg
  };

  // ── Phase 3: Weight shift ────────────────────────────────────────────────
  var _weight = {
    x: 0,          // current lateral offset (px)
    targetX: 0,
    phase: 0,
    speed: 0.09,   // rad/s — very slow (4–8 s cycle)
    amplitude: 1.8, // px
    shiftTimer: 0,  // seconds until voluntary weight shift
    nextShift: 0,
  };

  // Sub-layer accumulators (written per tick, applied via CSS vars)
  var _breath = {
    scaleY: 1,    // 0.99–1.02
    scaleX: 1,
    phase: 0,
    speed: 0.26,  // rad/s; slower in thinking
  };

  var _sway = {
    x: 0,        // px
    y: 0,
    angleZ: 0,   // deg
    phase: 0,
    speed: 0.18,
  };

  var _head = {
    rx: 0,       // deg pitch
    ry: 0,       // deg yaw
    rz: 0,       // deg roll
    tx: 0,       // px horizontal
    ty: 0,       // px vertical
    targetRx: 0,
    targetRy: 0,
    targetRz: 0,
    lerpK: 5,    // lerp factor per second
  };

  var _eye = {
    x: 0,        // -1..1 normalized
    y: 0,
    targetX: 0,
    targetY: 0,
    lerpK: 8,
    sacTimer: 0,   // seconds until next micro saccade
    lookTimer: 0,  // seconds until next gaze shift
    cursorX: 0,
    cursorY: 0,
    useCursor: false,
  };

  var _blink = {
    timer: 0,          // countdown (s)
    nextInterval: 3.5, // next blink delay
    blinking: false,
    blinkProgress: 0,  // 0..1
    blinkDuration: 0.16, // s
    impulse: 0,        // extra blink nudge when speaking/thinking
  };

  var _emotion = {
    current: "neutral",
    // per-emotion target overrides for head/eye/sway
    targets: {
      neutral:      { rx:  0,   rz:  0, swaySpeed: 0.18, breathSpeed: 0.26, eyeLookK: 8 },
      happy:        { rx: -3,   rz:  2, swaySpeed: 0.30, breathSpeed: 0.34, eyeLookK: 9 },
      sad:          { rx:  6,   rz: -2, swaySpeed: 0.10, breathSpeed: 0.18, eyeLookK: 5 },
      anger:        { rx:  2,   rz:  1, swaySpeed: 0.22, breathSpeed: 0.36, eyeLookK: 11 },
      separation:   { rx:  5,   rz: -3, swaySpeed: 0.12, breathSpeed: 0.20, eyeLookK: 5 },
      surprised:    { rx: -5,   rz:  0, swaySpeed: 0.28, breathSpeed: 0.40, eyeLookK: 12 },
      confident:    { rx: -1,   rz:  1, swaySpeed: 0.20, breathSpeed: 0.28, eyeLookK: 8 },
      thinking:     { rx:  4,   rz: -2, swaySpeed: 0.13, breathSpeed: 0.19, eyeLookK: 4 },
      listening:    { rx: -4,   rz:  1, swaySpeed: 0.16, breathSpeed: 0.24, eyeLookK: 10 },
      love:         { rx: -2,   rz:  3, swaySpeed: 0.24, breathSpeed: 0.30, eyeLookK: 7 },
      stress:       { rx:  3,   rz: -1, swaySpeed: 0.20, breathSpeed: 0.38, eyeLookK: 10 },
      curious:      { rx: -3,   rz:  4, swaySpeed: 0.22, breathSpeed: 0.28, eyeLookK: 10 },
      professional: { rx:  0,   rz:  0, swaySpeed: 0.15, breathSpeed: 0.22, eyeLookK: 7 },
      serious:      { rx:  2,   rz: -1, swaySpeed: 0.14, breathSpeed: 0.22, eyeLookK: 7 },
      friendly:     { rx: -2,   rz:  2, swaySpeed: 0.26, breathSpeed: 0.32, eyeLookK: 9 },
      sales:        { rx: -1,   rz:  1, swaySpeed: 0.28, breathSpeed: 0.34, eyeLookK: 10 },
    },
  };

  var _phase = {
    current: "idle",     // from OSG_DIGITAL_HUMAN
    gesture: null,
  };

  // Phase-specific motion overrides (additive to emotion)
  var PHASE_MOTION = {
    thinking:          { rx:  3, ry: -2, rz: -1, ty:  2, breathMult: 0.8, blinkImpulse: 0.6 },
    thinking_deep:     { rx:  5, ry: -3, rz: -2, ty:  4, breathMult: 0.7, blinkImpulse: 0.4 },
    listening:         { rx: -4, ry:  1, rz:  1, ty: -3, breathMult: 1.0, blinkImpulse: 1.2 },
    listening_focus:   { rx: -5, ry:  2, rz:  1, ty: -4, breathMult: 1.0, blinkImpulse: 1.4 },
    speaking:          { rx: -1, ry:  0, rz:  0, ty: -1, breathMult: 1.1, blinkImpulse: 0.8 },
    speaking_calm:     { rx:  0, ry:  0, rz:  0, ty: -1, breathMult: 0.9, blinkImpulse: 0.7 },
    speaking_professional: { rx: -1, ry: 0, rz: 0, ty: -1, breathMult: 1.0, blinkImpulse: 0.6 },
    speaking_sales:    { rx: -2, ry:  1, rz:  1, ty: -2, breathMult: 1.2, blinkImpulse: 0.9 },
    idle:              { rx:  0, ry:  0, rz:  0, ty:  0, breathMult: 1.0, blinkImpulse: 0 },
    idle_breathing:    { rx:  0, ry:  0, rz:  0, ty:  0, breathMult: 1.0, blinkImpulse: 0 },
    confirm:           { rx: -2, ry:  0, rz:  0, ty: -2, breathMult: 1.0, blinkImpulse: 0.5 },
    celebrate:         { rx: -3, ry:  2, rz:  2, ty: -3, breathMult: 1.3, blinkImpulse: 1.0 },
    welcome:           { rx: -3, ry:  0, rz:  0, ty: -2, breathMult: 1.0, blinkImpulse: 0.5 },
    wai:               { rx:  4, ry:  0, rz:  0, ty:  3, breathMult: 0.8, blinkImpulse: 0 },
    greeting:          { rx: -2, ry:  0, rz:  1, ty: -1, breathMult: 1.0, blinkImpulse: 0.5 },
    sympathy:          { rx:  4, ry: -1, rz: -2, ty:  2, breathMult: 0.85, blinkImpulse: 0.4 },
    serious:           { rx:  1, ry:  0, rz: -1, ty:  1, breathMult: 0.9, blinkImpulse: 0.3 },
    curious:           { rx: -2, ry:  3, rz:  3, ty: -1, breathMult: 1.0, blinkImpulse: 0.6 },
    error:             { rx:  2, ry: -2, rz: -2, ty:  2, breathMult: 1.1, blinkImpulse: 1.0 },
    interrupted:       { rx:  1, ry:  1, rz:  0, ty:  0, breathMult: 1.0, blinkImpulse: 1.0 },
  };

  // ── Helpers ────────────────────────────────────────────────────────────

  function lerp(a, b, k, dt) {
    return a + (b - a) * Math.min(1, k * dt);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function sin(x) { return Math.sin(x); }

  // Phase 3: multi-frequency noise sum for one axis
  function noiseSum(bands, dt) {
    var sum = 0;
    for (var i = 0; i < bands.length; i++) {
      bands[i][0] += bands[i][1] * dt;  // advance phase
      sum += Math.sin(bands[i][0]) * bands[i][2];
    }
    return sum;
  }

  // Phase 3: detect low-end device (≤2 CPU cores or small screen)
  function detectFrameSkip() {
    var cores = navigator.hardwareConcurrency || 2;
    var narrow = global.innerWidth <= 480;
    if (cores <= 2 || narrow) return 2;   // every other frame
    return 1;
  }

  // Phase 3: Page Visibility — pause when tab hidden
  function installVisibilityPause() {
    if (!global.document || !("hidden" in global.document)) return;
    global.document.addEventListener("visibilitychange", function () {
      _paused = global.document.hidden;
    });
  }

  function coinStage() {
    if (!_stage) {
      _stage = global.document && global.document.getElementById("coin-stage");
    }
    return _stage;
  }

  function setCssVar(el, name, value) {
    if (el) el.style.setProperty(name, value);
  }

  function addCssClass(el, cls) {
    if (el && !el.classList.contains(cls)) el.classList.add(cls);
  }

  function removeCssClass(el, cls) {
    if (el) el.classList.remove(cls);
  }

  // ── Eye contact (Aufgabe 7) ────────────────────────────────────────────

  function initEyeController() {
    if (global.OSG_DH_POINTER_BUS && typeof global.OSG_DH_POINTER_BUS.install === "function") {
      global.OSG_DH_POINTER_BUS.install();
    }
    _eye.sacTimer = 1.2 + Math.random() * 1.8;
    _eye.lookTimer = 2.5 + Math.random() * 3;
  }

  function tickEye(dt) {
    _eye.sacTimer -= dt;
    _eye.lookTimer -= dt;

    var em = _emotion.targets[_emotion.current] || _emotion.targets["neutral"];
    _eye.lerpK = em.eyeLookK;

    // Determine target based on phase
    var ph = _phase.current;
    var ptr =
      global.OSG_DH_POINTER_BUS && typeof global.OSG_DH_POINTER_BUS.getState === "function"
        ? global.OSG_DH_POINTER_BUS.getState()
        : null;
    var useCursor =
      (ph === "listening" || ph === "listening_focus") &&
      ptr &&
      ptr.active &&
      ptr.coinX !== 0;

    if (useCursor) {
      _eye.targetX = ptr.coinX * 0.25;
      _eye.targetY = ptr.coinY * 0.18;
    } else if (
      ph === "thinking" || ph === "thinking_deep"
    ) {
      // Look slightly down and to side while thinking
      _eye.targetX = -0.15 + sin(_t * 0.4) * 0.08;
      _eye.targetY =  0.12 + sin(_t * 0.27) * 0.05;
    } else {
      // Camera gaze with micro drift
      _eye.targetX = sin(_t * 0.11) * 0.04;
      _eye.targetY = sin(_t * 0.17) * 0.03;
    }

    // Micro saccade
    if (_eye.sacTimer <= 0) {
      _eye.targetX += (Math.random() - 0.5) * 0.12;
      _eye.targetY += (Math.random() - 0.5) * 0.08;
      _eye.sacTimer = 0.8 + Math.random() * 2.4;
    }

    // Slow gaze shift
    if (_eye.lookTimer <= 0) {
      _eye.targetX = (Math.random() - 0.5) * 0.22;
      _eye.targetY = (Math.random() - 0.5) * 0.14;
      _eye.lookTimer = 2 + Math.random() * 4;
    }

    _eye.x = lerp(_eye.x, _eye.targetX, _eye.lerpK, dt);
    _eye.y = lerp(_eye.y, _eye.targetY, _eye.lerpK, dt);

    // Publish as CSS vars
    var el = coinStage();
    setCssVar(el, "--dh2-eye-x", (_eye.x * 8).toFixed(2) + "px");
    setCssVar(el, "--dh2-eye-y", (_eye.y * 6).toFixed(2) + "px");
  }

  // ── Blink system (Aufgabe 8) ───────────────────────────────────────────

  function scheduleBlink() {
    _blink.timer = 2 + Math.random() * 5;
    _blink.nextInterval = _blink.timer;
  }

  function tickBlink(dt) {
    // Phase-based impulse shortens interval
    var ph = _phase.current;
    var impulse = (PHASE_MOTION[ph] || {}).blinkImpulse || 0;
    _blink.impulse = lerp(_blink.impulse, impulse, 3, dt);

    _blink.timer -= dt * (1 + _blink.impulse * 0.35);

    var el = coinStage();
    if (_blink.blinking) {
      _blink.blinkProgress = Math.min(1, _blink.blinkProgress + dt / _blink.blinkDuration);
      // ease in-out
      var eased = _blink.blinkProgress < 0.5
        ? 2 * _blink.blinkProgress * _blink.blinkProgress
        : 1 - Math.pow(-2 * _blink.blinkProgress + 2, 2) / 2;
      setCssVar(el, "--dh2-blink", eased.toFixed(3));
      if (_blink.blinkProgress >= 1) {
        _blink.blinking = false;
        _blink.blinkProgress = 0;
        setCssVar(el, "--dh2-blink", "0");
        scheduleBlink();
      }
    } else if (_blink.timer <= 0) {
      _blink.blinking = true;
      _blink.blinkProgress = 0;
      addCssClass(el, "is-dh2-blinking");
      global.setTimeout(function () {
        removeCssClass(coinStage(), "is-dh2-blinking");
      }, Math.ceil(_blink.blinkDuration * 1000));
    }
  }

  // ── Breathing + body sway (Phase 2 + Phase 3 multi-frequency) ────────

  function tickBreath(dt) {
    var ph = _phase.current;
    var pm = PHASE_MOTION[ph] || {};
    var breathMult = pm.breathMult != null ? pm.breathMult : 1.0;
    var em = _emotion.targets[_emotion.current] || _emotion.targets["neutral"];
    var speed = em.breathSpeed * breathMult;

    _breath.phase += speed * dt;

    // Phase 3: two-frequency breathing (main + secondary overtone)
    var mainBreathe = sin(_breath.phase) * 0.012 * breathMult;
    var overtone    = sin(_breath.phase * 1.87 + 0.9) * 0.003 * breathMult;
    _breath.scaleY  = 1 + mainBreathe + overtone;
    _breath.scaleX  = 1 + (mainBreathe * 0.45) + (overtone * 0.2);

    // Phase 3: multi-frequency sway (noise bands — no Math.random per frame)
    var swayAmp = em.swaySpeed / 0.18; // normalize to 1.0 at neutral
    _sway.x     = noiseSum(_noise.bodyX, dt) * swayAmp;
    _sway.angleZ = noiseSum(_noise.bodyZ, dt) * swayAmp;
    _sway.y     = sin(_breath.phase * 0.53) * 0.4 * breathMult;

    var el = coinStage();
    setCssVar(el, "--dh2-breath-sy", _breath.scaleY.toFixed(4));
    setCssVar(el, "--dh2-breath-sx", _breath.scaleX.toFixed(4));
    setCssVar(el, "--dh2-sway-x", _sway.x.toFixed(2) + "px");
    setCssVar(el, "--dh2-sway-y", _sway.y.toFixed(2) + "px");
    setCssVar(el, "--dh2-sway-z", _sway.angleZ.toFixed(2) + "deg");
  }

  // ── Head movement (Phase 2 + Phase 3 noise drift) ─────────────────────

  function tickHead(dt) {
    var ph = _phase.current;
    var pm = PHASE_MOTION[ph] || {};
    var em = _emotion.targets[_emotion.current] || _emotion.targets["neutral"];

    // Base from emotion + phase offset
    var baseRx = (em.rx || 0) + (pm.rx || 0);
    var baseRy = (pm.ry || 0);
    var baseRz = (em.rz || 0) + (pm.rz || 0);
    var baseTy = pm.ty || 0;

    // Phase 3: multi-frequency organic drift (replaces plain sinus from P2)
    var micro = (ph === "thinking" || ph === "thinking_deep") ? 1.7 : 1.0;
    var driftRx = noiseSum(_noise.headX, dt) * micro;
    var driftRy = noiseSum(_noise.headY, dt) * micro;
    var driftRz = noiseSum(_noise.headZ, dt) * micro;

    _head.targetRx = baseRx + driftRx;
    _head.targetRy = baseRy + driftRy;
    _head.targetRz = baseRz + driftRz;
    _head.ty = baseTy;

    _head.rx = lerp(_head.rx, _head.targetRx, _head.lerpK, dt);
    _head.ry = lerp(_head.ry, _head.targetRy, _head.lerpK, dt);
    _head.rz = lerp(_head.rz, _head.targetRz, _head.lerpK, dt);

    var el = coinStage();
    setCssVar(el, "--dh2-head-rx", _head.rx.toFixed(3) + "deg");
    setCssVar(el, "--dh2-head-ry", _head.ry.toFixed(3) + "deg");
    setCssVar(el, "--dh2-head-rz", _head.rz.toFixed(3) + "deg");
    setCssVar(el, "--dh2-head-ty", (_head.ty + _sway.y).toFixed(2) + "px");
  }

  // ── Phase 3: Shoulder layer ────────────────────────────────────────────

  function tickShoulder(dt) {
    var ph = _phase.current;
    var pm = PHASE_MOTION[ph] || {};
    var breathMult = pm.breathMult != null ? pm.breathMult : 1.0;

    _shoulder.phase += _shoulder.speed * dt;

    // Shoulder counter-rotates slightly opposite to body sway for realism
    _shoulder.targetRz = sin(_shoulder.phase) * _shoulder.amplitude * breathMult;
    _shoulder.rz = lerp(_shoulder.rz, _shoulder.targetRz, 4, dt);

    var el = coinStage();
    // Published as separate var; CSS adds it to head-rz optionally
    setCssVar(el, "--dh2-shoulder-rz", _shoulder.rz.toFixed(3) + "deg");
  }

  // ── Phase 3: Weight shift ──────────────────────────────────────────────

  function tickWeightShift(dt) {
    _weight.shiftTimer -= dt;

    // Voluntary weight shift: every 4–10 s, pick a new lean direction
    if (_weight.shiftTimer <= 0) {
      _weight.targetX = (Math.random() - 0.5) * _weight.amplitude * 2;
      _weight.shiftTimer = 4 + Math.random() * 6;
    }

    // Passive oscillation under the voluntary target
    _weight.phase += _weight.speed * dt;
    var passiveX = sin(_weight.phase) * _weight.amplitude * 0.4;

    var totalX = _weight.targetX * 0.6 + passiveX;
    _weight.x = lerp(_weight.x, totalX, 1.8, dt);

    var el = coinStage();
    setCssVar(el, "--dh2-weight-x", _weight.x.toFixed(2) + "px");
  }

  // ── Emotion overlay (Aufgabe 5) ───────────────────────────────────────

  function setEmotion(emotion) {
    if (!emotion) emotion = "neutral";
    var avail = Object.keys(_emotion.targets);
    if (avail.indexOf(emotion) < 0) emotion = "neutral";
    _emotion.current = emotion;
    var el = coinStage();
    if (el) {
      // Remove old dh2-emotion classes
      var rm = [];
      el.classList.forEach(function (c) {
        if (c.indexOf("is-dh2-emotion-") === 0) rm.push(c);
      });
      rm.forEach(function (c) { el.classList.remove(c); });
      el.classList.add("is-dh2-emotion-" + emotion);
    }
  }

  // ── Phase (Aufgabe 2/3/4) ────────────────────────────────────────────

  function setPhase(phase) {
    if (!phase) phase = "idle";
    _phase.current = phase;
    var el = coinStage();
    if (!el) return;
    // Mirror motion-specific classes
    var rm = [];
    el.classList.forEach(function (c) {
      if (c.indexOf("is-dh2-") === 0 && c !== "is-dh2-blinking") rm.push(c);
    });
    rm.forEach(function (c) { el.classList.remove(c); });
    el.classList.add("is-dh2-phase-" + phase.replace(/_/g, "-"));
    if (phase === "thinking" || phase === "thinking_deep") {
      el.classList.add("is-dh2-thinking");
    }
    if (phase === "listening" || phase === "listening_focus") {
      el.classList.add("is-dh2-listening");
    }
    if (
      phase === "speaking" ||
      phase === "speaking_calm" ||
      phase === "speaking_professional" ||
      phase === "speaking_sales" ||
      phase === "resume_speaking"
    ) {
      el.classList.add("is-dh2-speaking");
    }
    if (phase === "idle" || phase === "idle_breathing") {
      el.classList.add("is-dh2-idle");
    }
  }

  // ── Gesture layer (Aufgabe 6) ─────────────────────────────────────────

  function setGesture(gesture) {
    _phase.gesture = gesture || null;
    var el = coinStage();
    if (!el) return;
    var rm = [];
    el.classList.forEach(function (c) {
      if (c.indexOf("is-dh2-gesture-") === 0) rm.push(c);
    });
    rm.forEach(function (c) { el.classList.remove(c); });
    if (gesture) {
      el.classList.add("is-dh2-gesture-" + gesture.replace(/_/g, "-"));
    }
  }

  // ── Phase 3: reduced-motion runtime check ────────────────────────────

  function prefersReducedMotion() {
    if (!global.matchMedia) return false;
    try {
      return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  }

  // ── Master update (Phase 2 + Phase 3) ────────────────────────────────

  function update(nowMs, deltaS) {
    if (!_installed) return;

    // Phase 3: Page Visibility pause
    if (_paused) return;

    // Phase 3: reduced-motion runtime guard (check cheap media query)
    if (prefersReducedMotion()) return;

    // Phase 3: frame-skip budget
    _frameCount = (_frameCount + 1) % (_frameSkip || 1);
    if (_frameCount !== 0) return;

    var dt = Math.min(0.1, deltaS || 0.016);
    // Phase 3: compensate accumulated time for skipped frames
    var effectiveDt = dt * _frameSkip;
    _t += effectiveDt;

    // Sync state from Phase 1 if available
    if (global.OSG_DIGITAL_HUMAN && global.OSG_DIGITAL_HUMAN.state) {
      var s = global.OSG_DIGITAL_HUMAN.state;
      if (s.phase && s.phase !== _phase.current) setPhase(s.phase);
      if (s.emotion && s.emotion !== _emotion.current) setEmotion(s.emotion);
      if (s.gesture !== _phase.gesture) setGesture(s.gesture);
    }

    tickBreath(effectiveDt);
    tickHead(effectiveDt);
    tickEye(effectiveDt);
    tickBlink(effectiveDt);
    tickShoulder(effectiveDt);   // Phase 3
    tickWeightShift(effectiveDt); // Phase 3
  }

  // ── Install (Aufgabe 11) ──────────────────────────────────────────────

  function install() {
    if (_installed) return true;
    coinStage();
    initEyeController();
    scheduleBlink();

    // Phase 3: detect performance tier
    _frameSkip = detectFrameSkip();

    // Phase 3: page visibility pause
    installVisibilityPause();

    // Phase 3: weight-shift initial timer
    _weight.shiftTimer = 3 + Math.random() * 5;
    _weight.nextShift = _weight.shiftTimer;

    // Listen to Phase 1 events (additive hookups, no API changes)
    if (global.document) {
      global.document.addEventListener("osg:digital-human:phase", function (e) {
        if (e.detail && e.detail.phase) setPhase(e.detail.phase);
      });
      global.document.addEventListener("osg:digital-human:emotion", function (e) {
        if (e.detail && e.detail.emotion) setEmotion(e.detail.emotion);
      });
      global.document.addEventListener("osg:digital-human:gesture", function (e) {
        setGesture(e.detail && e.detail.gesture ? e.detail.gesture : null);
      });
    }

    _installed = true;
    return true;
  }

  // ── Public API ────────────────────────────────────────────────────────

  global.OSG_DIGITAL_HUMAN_MOTION = {
    install: install,
    update: update,
    setPhase: setPhase,
    setEmotion: setEmotion,
    setGesture: setGesture,
    getState: function () {
      return {
        t: _t,
        phase: _phase.current,
        gesture: _phase.gesture,
        emotion: _emotion.current,
        head: Object.assign({}, _head),
        eye: { x: _eye.x, y: _eye.y },
        blink: { active: _blink.blinking, progress: _blink.blinkProgress },
        breath: { scaleY: _breath.scaleY },
        shoulder: { rz: _shoulder.rz },    // Phase 3
        weight: { x: _weight.x },          // Phase 3
        perf: { frameSkip: _frameSkip, paused: _paused }, // Phase 3
      };
    },
    scheduleBlink: scheduleBlink,
    // Phase 3 extras
    setFrameSkip: function (n) { _frameSkip = Math.max(1, Math.min(4, n | 0)); },
    pause: function () { _paused = true; },
    resume: function () { _paused = false; },
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
