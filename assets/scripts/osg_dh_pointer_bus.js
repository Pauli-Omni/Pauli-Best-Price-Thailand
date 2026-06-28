// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Digital Human — P1 Pointer Bus
 *
 * Single document-level pointer pipeline for DH motion + eye contact.
 * No requestAnimationFrame, no setInterval.
 */
(function (global) {
  "use strict";

  var _installed = false;
  var _stage = null;
  var _state = {
    active: false,
    viewportX: 0,
    viewportY: 0,
    coinX: 0,
    coinY: 0,
  };

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function coinStage() {
    if (!_stage) _stage = global.document && global.document.getElementById("coin-stage");
    return _stage;
  }

  function updatePointer(clientX, clientY) {
    var vw = global.innerWidth || 800;
    var vh = global.innerHeight || 600;
    _state.active = true;
    _state.viewportX = clamp((clientX - vw / 2) / (vw * 0.5), -1, 1);
    _state.viewportY = clamp((clientY - vh / 2) / (vh * 0.5), -1, 1);
    var el = coinStage();
    if (el) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      _state.coinX = clamp((clientX - cx) / (vw * 0.5), -1, 1);
      _state.coinY = clamp((clientY - cy) / (vh * 0.5), -1, 1);
    }
  }

  function onPointerLeave() {
    _state.active = false;
  }

  function install() {
    if (_installed || !global.document) return true;
    _installed = true;
    coinStage();
    global.document.addEventListener(
      "mousemove",
      function (e) {
        updatePointer(e.clientX, e.clientY);
      },
      { passive: true }
    );
    global.document.addEventListener(
      "touchmove",
      function (e) {
        if (e.touches && e.touches[0]) {
          updatePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );
    global.document.addEventListener("mouseleave", onPointerLeave);
    return true;
  }

  global.OSG_DH_POINTER_BUS = {
    install: install,
    getState: function () {
      return {
        active: _state.active,
        viewportX: _state.viewportX,
        viewportY: _state.viewportY,
        coinX: _state.coinX,
        coinY: _state.coinY,
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
