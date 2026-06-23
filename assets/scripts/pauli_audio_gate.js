/**
 * Pauli — Audio-Sperre bis AGB bestätigt („Einverständnis speichern & fortfahren“).
 */
(function (global) {
  "use strict";

  var LS_TERMS = "osg-terms-accepted-v1";

  function termsAccepted() {
    try {
      if (
        global.OSG_STARTUP_BOOT &&
        typeof global.OSG_STARTUP_BOOT.termsAccepted === "function"
      ) {
        return global.OSG_STARTUP_BOOT.termsAccepted();
      }
    } catch (_) {}
    try {
      return String(global.localStorage.getItem(LS_TERMS) || "") === "1";
    } catch (_) {
      return false;
    }
  }

  /** @param {{ ignoreTerms?: boolean }} [opts] */
  function osgPauliAudioAllowed(opts) {
    opts = opts || {};
    if (opts.ignoreTerms) return true;
    return termsAccepted();
  }

  function osgPauliOnTermsAudioUnlock() {
    try {
      global.dispatchEvent(new CustomEvent("osg-terms-audio-unlocked"));
    } catch (_) {}
  }

  global.osgPauliAudioAllowed = osgPauliAudioAllowed;
  global.osgPauliTermsAudioUnlocked = termsAccepted;
  global.osgPauliOnTermsAudioUnlock = osgPauliOnTermsAudioUnlock;
})(typeof window !== "undefined" ? window : globalThis);
