// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Digital Human — Phase 7 Final Polish
 *
 * Additive orchestration layer. Does NOT modify Phase 1–6 source files.
 *
 * Goals:
 *   - Smooth transitions (spring-smoothed CSS vars)
 *   - Biological idle floor (never fully still)
 *   - Natural breath pauses (inhale / exhale holds)
 *   - Micro-reactions on phase, emotion, speech, gesture events
 *   - Performance: frame-skip sync, CSS write batching, visibility pause
 *
 * Output CSS vars (--dh7-*) consumed by osg_dh_final_polish.css.
 * No setInterval, no own rAF — tick from host animate() loop.
 */
(function (global) {
  "use strict";

  var _installed = false;
  var _enabled = true;
  var _paused = false;
  var _stage = null;
  var _t = 0;
  var _frameCount = 0;
  var _frameSkip = 1;

  // Smoothed outputs (spring targets)
  var _out = {
    microX: 0, microY: 0, microRx: 0, microRz: 0,
    microSx: 1, microSy: 1,
    breathHold: 1,
    reactRx: 0, reactRz: 0, reactBright: 1,
    phaseBlend: 1,
  };

  // Decaying impulse reactions
  var _impulse = { rx: 0, rz: 0, bright: 0, sx: 0 };

  // Breath pause cycle (deterministic, no per-frame random)
  var _breathCycle = {
    phase: 0,
    speed: 0.38,
    holdTimer: 0,
    inHold: false,
    holdDur: 0,
  };

  // Organic micro noise bands (same pattern as Phase 3)
  var _noise = {
    microX: [[0, 0.19, 0.35], [0, 0.41, 0.14], [0, 0.67, 0.06]],
    microY: [[0, 0.15, 0.28], [0, 0.33, 0.10], [0, 0.55, 0.04]],
    microRz: [[0, 0.11, 0.22], [0, 0.27, 0.08], [0, 0.43, 0.03]],
  };

  var _lastWritten = Object.create(null);
  var _phase = "idle";
  var _prevPhase = "idle";
  var _phaseMorph = 1;

  // ── Helpers ─────────────────────────────────────────────────────────────

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function lerp(a, b, k, dt) {
    return a + (b - a) * Math.min(1, k * dt);
  }

  function spring(current, target, velocity, stiffness, damping, dt) {
    var force = (target - current) * stiffness;
    velocity = (velocity + force * dt) * Math.exp(-damping * dt);
    current += velocity * dt;
    return { value: current, velocity: velocity };
  }

  var _springVel = { microX: 0, microY: 0, microRx: 0, microRz: 0, reactRx: 0, reactRz: 0 };

  function noiseSum(bands, dt) {
    var sum = 0;
    for (var i = 0; i < bands.length; i++) {
      bands[i][0] += bands[i][1] * dt;
      sum += Math.sin(bands[i][0]) * bands[i][2];
    }
    return sum;
  }

  function coinStage() {
    if (!_stage) _stage = global.document && global.document.getElementById("coin-stage");
    return _stage;
  }

  function setCssVar(el, name, value) {
    if (!el) return;
    if (_lastWritten[name] === value) return;
    _lastWritten[name] = value;
    el.style.setProperty(name, value);
  }

  function prefersReducedMotion() {
    if (!global.matchMedia) return false;
    try {
      return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  }

  function syncFrameSkip() {
    if (
      global.OSG_DIGITAL_HUMAN_MOTION &&
      typeof global.OSG_DIGITAL_HUMAN_MOTION.getState === "function"
    ) {
      var st = global.OSG_DIGITAL_HUMAN_MOTION.getState();
      if (st && st.perf && st.perf.frameSkip) {
        _frameSkip = st.perf.frameSkip;
      }
    }
    if (global.innerWidth <= 480) _frameSkip = Math.max(_frameSkip, 2);
  }

  // ── Micro-reactions ─────────────────────────────────────────────────────

  function addImpulse(type, strength) {
    strength = strength != null ? strength : 1;
    switch (type) {
      case "phase":
        _impulse.rx += -1.2 * strength;
        _impulse.rz += (Math.sin(_t * 7.3) > 0 ? 1 : -1) * 0.8 * strength;
        break;
      case "emotion":
        _impulse.bright += 0.04 * strength;
        _impulse.rz += 0.5 * strength;
        break;
      case "speak_start":
        _impulse.rx += -1.8 * strength;
        _impulse.sx += 0.012 * strength;
        break;
      case "speak_stop":
        _impulse.rx += 1.4 * strength;
        break;
      case "gesture":
        _impulse.rz += 1.6 * strength;
        _impulse.bright += 0.03 * strength;
        break;
      case "think":
        _impulse.rx += 2.0 * strength;
        break;
      case "blink_pair":
        _impulse.rz += 0.3 * strength;
        break;
      default:
        _impulse.rz += 0.4 * strength;
    }
  }

  function tickImpulse(dt) {
    var decay = Math.exp(-4.5 * dt);
    _impulse.rx *= decay;
    _impulse.rz *= decay;
    _impulse.bright *= decay;
    _impulse.sx *= decay;
    if (Math.abs(_impulse.rx) < 0.001) _impulse.rx = 0;
    if (Math.abs(_impulse.rz) < 0.001) _impulse.rz = 0;
    if (Math.abs(_impulse.bright) < 0.0001) _impulse.bright = 0;
    if (Math.abs(_impulse.sx) < 0.00001) _impulse.sx = 0;
  }

  // ── Breath pause (natural cadence) ────────────────────────────────────────

  function tickBreathPause(dt) {
    if (_breathCycle.inHold) {
      _breathCycle.holdTimer -= dt;
      if (_breathCycle.holdTimer <= 0) {
        _breathCycle.inHold = false;
        _breathCycle.holdDur = 0;
      }
      return 0.12 + 0.04 * Math.sin(_t * 0.5);
    }

    _breathCycle.phase += _breathCycle.speed * dt;
    var wave = Math.sin(_breathCycle.phase);
    var holdThreshold = 0.92;

    if (wave > holdThreshold && !_breathCycle.inHold) {
      _breathCycle.inHold = true;
      _breathCycle.holdTimer = 0.22 + (Math.sin(_breathCycle.phase * 3.1) + 1) * 0.08;
      _breathCycle.holdDur = _breathCycle.holdTimer;
    }

    var inhale = (wave + 1) * 0.5;
    return 0.55 + inhale * 0.45;
  }

  // ── Idle floor (never fully still) ──────────────────────────────────────

  function tickIdleFloor(dt, phase) {
    var floor = 1;
    var isBusy =
      phase.indexOf("speaking") === 0 ||
      phase === "wai" ||
      phase === "busy";

    if (isBusy) floor = 0.45;
    else if (phase.indexOf("thinking") === 0) floor = 0.75;
    else if (phase.indexOf("listening") === 0) floor = 0.65;

    var nx = noiseSum(_noise.microX, dt) * floor;
    var ny = noiseSum(_noise.microY, dt) * floor;
    var nrz = noiseSum(_noise.microRz, dt) * floor;
    var nrx = Math.sin(_t * 0.21) * 0.18 * floor + Math.sin(_t * 0.53) * 0.06 * floor;

    var targetX = nx * 1.4;
    var targetY = ny * 1.0;
    var targetRx = nrx;
    var targetRz = nrz * 0.9;
    var targetSx = 1 + Math.sin(_t * 0.31) * 0.0025 * floor + _impulse.sx;
    var targetSy = 1 + Math.sin(_t * 0.27 + 0.4) * 0.003 * floor;

    var s;
    s = spring(_out.microX, targetX, _springVel.microX, 18, 7, dt);
    _out.microX = s.value; _springVel.microX = s.velocity;
    s = spring(_out.microY, targetY, _springVel.microY, 18, 7, dt);
    _out.microY = s.value; _springVel.microY = s.velocity;
    s = spring(_out.microRx, targetRx + _impulse.rx, _springVel.microRx, 22, 8, dt);
    _out.microRx = s.value; _springVel.microRx = s.velocity;
    s = spring(_out.microRz, targetRz + _impulse.rz, _springVel.microRz, 22, 8, dt);
    _out.microRz = s.value; _springVel.microRz = s.velocity;

    _out.microSx = lerp(_out.microSx, targetSx, 6, dt);
    _out.microSy = lerp(_out.microSy, targetSy, 6, dt);
  }

  // ── Phase transition soft blend ───────────────────────────────────────────

  function onPhaseChange(next) {
    if (next === _phase) return;
    _prevPhase = _phase;
    _phase = next || "idle";
    _phaseMorph = 0;
    addImpulse("phase", 0.7);
  }

  function tickPhaseMorph(dt) {
    _phaseMorph = lerp(_phaseMorph, 1, 2.2, dt);
    _out.phaseBlend = _phaseMorph;
  }

  // ── Apply CSS ─────────────────────────────────────────────────────────────

  function applyCss() {
    var el = coinStage();
    if (!el) return;

    el.classList.add("is-dh7-active");
    el.setAttribute("data-dh7-phase", _phase);

    setCssVar(el, "--dh7-micro-x", _out.microX.toFixed(3) + "px");
    setCssVar(el, "--dh7-micro-y", _out.microY.toFixed(3) + "px");
    setCssVar(el, "--dh7-micro-rx", _out.microRx.toFixed(3) + "deg");
    setCssVar(el, "--dh7-micro-rz", _out.microRz.toFixed(3) + "deg");
    setCssVar(el, "--dh7-micro-sx", _out.microSx.toFixed(5));
    setCssVar(el, "--dh7-micro-sy", _out.microSy.toFixed(5));
    setCssVar(el, "--dh7-breath-hold", _out.breathHold.toFixed(4));
    setCssVar(el, "--dh7-phase-blend", _out.phaseBlend.toFixed(4));
    setCssVar(el, "--dh7-react-bright", (1 + _impulse.bright).toFixed(4));
  }

  // ── Event hooks ───────────────────────────────────────────────────────────

  function installEventHooks() {
    if (!global.document) return;
    var doc = global.document;

    doc.addEventListener("osg:digital-human:phase", function (e) {
      if (e.detail && e.detail.phase) onPhaseChange(e.detail.phase);
    });

    doc.addEventListener("osg:digital-human:emotion", function () {
      addImpulse("emotion", 0.5);
    });

    doc.addEventListener("osg:digital-human:speaking-start", function () {
      addImpulse("speak_start", 0.8);
    });

    doc.addEventListener("osg:digital-human:speaking-stop", function () {
      addImpulse("speak_stop", 0.6);
    });

    doc.addEventListener("osg:digital-human:thinking-start", function () {
      addImpulse("think", 0.5);
    });

    doc.addEventListener("osg:digital-human:gesture-intelligence", function () {
      addImpulse("gesture", 0.7);
    });

    doc.addEventListener("osg:digital-human:gesture", function () {
      addImpulse("gesture", 0.4);
    });

    doc.addEventListener("visibilitychange", function () {
      _paused = doc.hidden;
    });
  }

  // ── Main tick ─────────────────────────────────────────────────────────────

  function tick(dt) {
    if (!_installed || !_enabled) return;
    if (_paused) return;
    if (prefersReducedMotion()) return;

    syncFrameSkip();
    _frameCount = (_frameCount + 1) % (_frameSkip || 1);
    if (_frameCount !== 0) return;

    dt = Math.min(0.1, (dt || 0.016) * _frameSkip);
    _t += dt;

    if (global.OSG_DIGITAL_HUMAN && global.OSG_DIGITAL_HUMAN.state) {
      var ph = global.OSG_DIGITAL_HUMAN.state.phase;
      if (ph && ph !== _phase) onPhaseChange(ph);
    }

    tickImpulse(dt);
    _out.breathHold = lerp(_out.breathHold, tickBreathPause(dt), 8, dt);
    tickIdleFloor(dt, _phase);
    tickPhaseMorph(dt);
    applyCss();
  }

  function install() {
    if (_installed) return true;
    _installed = true;
    coinStage();
    installEventHooks();
    syncFrameSkip();
    applyCss();
    return true;
  }

  global.OSG_DH_FINAL_POLISH = {
    install: install,
    tick: tick,
    addImpulse: addImpulse,
    setEnabled: function (v) { _enabled = !!v; },
    getState: function () {
      return {
        t: _t,
        phase: _phase,
        phaseBlend: _out.phaseBlend,
        breathHold: _out.breathHold,
        impulse: Object.assign({}, _impulse),
        perf: { frameSkip: _frameSkip, paused: _paused },
      };
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
