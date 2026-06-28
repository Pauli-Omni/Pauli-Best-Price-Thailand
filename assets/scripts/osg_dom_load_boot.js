/**
 * Coordinated DOM / window load hooks for avatar runtime + animations.
 */
(function (global) {
  "use strict";

  function whenDomReady(fn) {
    if (!global.document) return;
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function whenWindowLoad(fn) {
    if (!global.document) return;
    if (global.document.readyState === "complete") {
      fn();
    } else {
      global.addEventListener("load", fn, { once: true });
    }
  }

  function whenAvatarRuntimeReady(fn) {
    whenWindowLoad(function () {
      whenDomReady(fn);
    });
  }

  global.OSG_DOM_BOOT = {
    whenDomReady: whenDomReady,
    whenWindowLoad: whenWindowLoad,
    whenAvatarRuntimeReady: whenAvatarRuntimeReady,
  };
})(typeof window !== "undefined" ? window : globalThis);
