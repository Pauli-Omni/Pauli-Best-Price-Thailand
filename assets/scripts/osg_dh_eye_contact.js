// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Digital Human — Phase 5 Eye Contact Engine
 *
 * Additive extension. Does NOT modify Phase 1/2/3/4 code.
 *
 * Architecture:
 *   Phase 2/3 tickEye() writes --dh2-eye-x/y (micro drift + saccades).
 *   Phase 4 tick() adds --dh4-eye-x/y (emotion offset).
 *   Phase 5 (this module) writes --dh5-eye-x/y (gaze-state driver).
 *   CSS combines all three:
 *     final gaze = dh2 + dh4 + dh5
 *
 * Gaze States (state machine):
 *   camera       — direct camera contact (default)
 *   user         — tracks cursor position (listening)
 *   away_think   — averted gaze (thinking: look down/side)
 *   away_recall  — look up (recalling a fact)
 *   scan_left    — glance left (speaking: reference point)
 *   scan_right   — glance right (speaking: reference point)
 *   return       — transitioning back to camera
 *
 * Transitions are phase-driven:
 *   idle          → camera
 *   thinking      → away_think → away_recall (random) → return → camera
 *   listening     → user (cursor tracking)
 *   speaking      → camera dominant, periodic scan_left/scan_right
 *
 * All interpolation via spring (critically damped) for organic feel.
 * No setInterval, no own rAF. Tick driven by host animate() loop via
 * OSG_DH_EYE_CONTACT.tick(dt).
 */
(function (global) {
  "use strict";

  // ── Virtual gaze points (normalized -1..1) ───────────────────────────────
  // These represent named look targets in the virtual scene.
  // x: -1=left, 0=center, +1=right
  // y: -1=up,   0=center, +1=down
  var GAZE_POINTS = {
    camera:      { x:  0.00, y:  0.00 },
    user:        { x:  0.00, y: -0.05 },   // slightly above center (face-level)
    away_think:  { x: -0.28, y:  0.22 },   // left-down
    away_recall: { x:  0.00, y: -0.30 },   // up (memory access)
    scan_left:   { x: -0.22, y:  0.05 },   // left (reference left)
    scan_right:  { x:  0.24, y:  0.05 },   // right (reference right)
    away_side:   { x:  0.32, y:  0.10 },   // far right (distraction)
    return:      { x:  0.00, y:  0.00 },   // same as camera
  };

  // ── State machine ─────────────────────────────────────────────────────────
  var _state = "camera";           // current gaze state
  var _prevState = "camera";
  var _phase = "idle";             // phase mirror from OSG_DIGITAL_HUMAN

  // Current interpolated gaze position (normalized)
  var _gaze = { x: 0, y: 0 };

  // Spring state
  var _spring = {
    x: 0, y: 0,       // current position
    vx: 0, vy: 0,     // velocity
    stiffness: 28,     // spring constant
    damping: 8.2,      // damping — critically damped at ~0.8
  };

  // Cursor tracking (from mousemove / touchmove)
  var _cursor = { x: 0, y: 0, active: false };

  function pointerState() {
    if (global.OSG_DH_POINTER_BUS && typeof global.OSG_DH_POINTER_BUS.getState === "function") {
      var ptr = global.OSG_DH_POINTER_BUS.getState();
      return {
        x: ptr.viewportX,
        y: ptr.viewportY,
        active: ptr.active,
      };
    }
    return _cursor;
  }

  // Timers
  var _stateTimer = 0;     // how long we've been in current state (s)
  var _holdMin = 0;        // minimum hold time before next transition (s)
  var _holdMax = 0;        // maximum hold time
  var _nextTransition = 0; // absolute time for next transition

  // Running time
  var _t = 0;

  // Control flags
  var _installed = false;
  var _stage = null;
  var _enabled = true;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function coinStage() {
    if (!_stage) _stage = global.document && global.document.getElementById("coin-stage");
    return _stage;
  }

  function setCssVar(el, name, value) {
    if (el) el.style.setProperty(name, value);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function rand(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  // Critically-damped spring integration (single axis)
  // Returns updated { pos, vel }.
  function springStep(pos, vel, target, stiff, damp, dt) {
    var f = -stiff * (pos - target) - damp * vel;
    var newVel = vel + f * dt;
    var newPos = pos + newVel * dt;
    return { pos: newPos, vel: newVel };
  }

  // ── State machine ─────────────────────────────────────────────────────────

  function scheduleHold(minS, maxS) {
    _holdMin = minS;
    _holdMax = maxS;
    _nextTransition = _t + rand(minS, maxS);
  }

  function enterState(name) {
    _prevState = _state;
    _state = name;
    _stateTimer = 0;
    dispatch("osg:eye-contact:state", { state: name, previous: _prevState });
  }

  // Choose next state for speaking phase (camera dominant, occasional scan)
  function nextSpeakingState() {
    var r = Math.random();
    if (r < 0.60) return "camera";
    if (r < 0.80) return "scan_left";
    if (r < 0.95) return "scan_right";
    return "away_recall";
  }

  // Choose next thinking state (away, then back)
  function nextThinkingState() {
    if (_state === "camera" || _state === "return") {
      return Math.random() < 0.7 ? "away_think" : "away_recall";
    }
    if (_state === "away_think" || _state === "away_recall") {
      return Math.random() < 0.5 ? "return" : "camera";
    }
    return "camera";
  }

  function transitionForPhase() {
    switch (_phase) {
      case "idle":
      case "idle_breathing":
        enterState("camera");
        scheduleHold(3, 8);
        break;

      case "thinking":
        enterState(nextThinkingState());
        scheduleHold(0.8, 2.2);
        break;

      case "thinking_deep":
        enterState(Math.random() < 0.6 ? "away_think" : "away_recall");
        scheduleHold(1.2, 3.0);
        break;

      case "listening":
      case "listening_focus":
        enterState(pointerState().active ? "user" : "camera");
        scheduleHold(1.5, 4.0);
        break;

      case "speaking":
      case "speaking_calm":
      case "speaking_professional":
        enterState(nextSpeakingState());
        scheduleHold(0.9, 2.4);
        break;

      case "speaking_sales":
        enterState(nextSpeakingState());
        scheduleHold(0.6, 1.8);
        break;

      default:
        enterState("camera");
        scheduleHold(2, 6);
    }
  }

  // ── Cursor tracking ───────────────────────────────────────────────────────

  function initCursorTracking() {
    if (global.OSG_DH_POINTER_BUS && typeof global.OSG_DH_POINTER_BUS.install === "function") {
      global.OSG_DH_POINTER_BUS.install();
    }
  }

  // ── Phase sync ────────────────────────────────────────────────────────────

  function setPhase(phase) {
    if (phase === _phase) return;
    _phase = phase || "idle";
    // Immediately trigger a transition for the new phase
    transitionForPhase();
  }

  // ── Gaze target resolution ────────────────────────────────────────────────

  function resolveTarget() {
    var ptr =
      global.OSG_DH_POINTER_BUS && typeof global.OSG_DH_POINTER_BUS.getState === "function"
        ? global.OSG_DH_POINTER_BUS.getState()
        : null;
    if (_state === "user" && ptr && ptr.active) {
      return {
        x: ptr.viewportX * 0.20,
        y: ptr.viewportY * 0.12,
      };
    }
    var pt = GAZE_POINTS[_state] || GAZE_POINTS["camera"];
    // Add tiny organic noise to static gaze points
    var noise = 0.018;
    return {
      x: pt.x + Math.sin(_t * 0.31) * noise,
      y: pt.y + Math.sin(_t * 0.23) * noise,
    };
  }

  // ── Main tick ─────────────────────────────────────────────────────────────

  function tick(dt) {
    if (!_installed || !_enabled) return;
    dt = Math.min(0.1, dt || 0.016);
    _t += dt;
    _stateTimer += dt;
    var ptr =
      global.OSG_DH_POINTER_BUS && typeof global.OSG_DH_POINTER_BUS.getState === "function"
        ? global.OSG_DH_POINTER_BUS.getState()
        : null;

    // Sync phase from Phase 1 if available
    if (global.OSG_DIGITAL_HUMAN && global.OSG_DIGITAL_HUMAN.state) {
      var ph = global.OSG_DIGITAL_HUMAN.state.phase;
      if (ph && ph !== _phase) setPhase(ph);
    }

    // State transition check
    if (_t >= _nextTransition) {
      transitionForPhase();
    }

    // During listening: keep "user" state fresh if cursor is active
    if (
      (_phase === "listening" || _phase === "listening_focus") &&
      ptr &&
      ptr.active &&
      _state !== "user"
    ) {
      enterState("user");
      scheduleHold(0.8, 2.5);
    }

    // Resolve gaze target
    var target = resolveTarget();

    // Spring integration for organic, non-linear motion
    var sx = springStep(_spring.x, _spring.vx, target.x, _spring.stiffness, _spring.damping, dt);
    var sy = springStep(_spring.y, _spring.vy, target.y, _spring.stiffness, _spring.damping, dt);
    _spring.x = sx.pos; _spring.vx = sx.vel;
    _spring.y = sy.pos; _spring.vy = sy.vel;

    // Clamp output
    _gaze.x = clamp(_spring.x, -0.5, 0.5);
    _gaze.y = clamp(_spring.y, -0.4, 0.4);

    // Write CSS vars (additive to Phase 2/3 --dh2-eye-* and Phase 4 --dh4-eye-*)
    var el = coinStage();
    setCssVar(el, "--dh5-eye-x", (_gaze.x * 9).toFixed(2) + "px");
    setCssVar(el, "--dh5-eye-y", (_gaze.y * 7).toFixed(2) + "px");
    setCssVar(el, "--dh5-gaze-x", _gaze.x.toFixed(4));
    setCssVar(el, "--dh5-gaze-y", _gaze.y.toFixed(4));
    // Write state as data attribute (CSS opacity + future SVG rig)
    if (el) el.setAttribute("data-dh5-state", _state);
  }

  // ── Events ────────────────────────────────────────────────────────────────

  function dispatch(name, detail) {
    try {
      global.document.dispatchEvent(
        new CustomEvent(name, { detail: detail || {}, bubbles: false })
      );
    } catch (_) {}
  }

  // ── Install ───────────────────────────────────────────────────────────────

  function install() {
    if (_installed) return true;
    _installed = true;
    coinStage();
    initCursorTracking();

    // Initial state
    enterState("camera");
    scheduleHold(2, 6);

    // Listen to Phase 1 phase events
    if (global.document) {
      global.document.addEventListener("osg:digital-human:phase", function (e) {
        if (e.detail && e.detail.phase) setPhase(e.detail.phase);
      });
    }

    return true;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  global.OSG_DH_EYE_CONTACT = {
    install: install,
    tick: tick,
    setPhase: setPhase,

    // Force a specific gaze state (overrides state machine for one cycle)
    lookAt: function (stateName, holdSeconds) {
      if (GAZE_POINTS[stateName] !== undefined) {
        enterState(stateName);
        scheduleHold(holdSeconds || 0.5, holdSeconds || 0.5);
      }
    },

    // Enable / disable the engine (e.g. for reduced-motion)
    setEnabled: function (v) { _enabled = !!v; },

    // Expose gaze points for external use / debugging
    getGazePoints: function () { return Object.assign({}, GAZE_POINTS); },
    addGazePoint: function (name, x, y) { GAZE_POINTS[name] = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) }; },

    // Status
    getState: function () {
      return {
        state: _state,
        phase: _phase,
        gaze: { x: _gaze.x, y: _gaze.y },
        cursor: pointerState(),
        timeInState: _stateTimer,
      };
    },
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
