/**
 * Pauli developer tools — factory reset + first-start greeting simulation.
 */
(function (global) {
  "use strict";

  function shouldWipeKey(key) {
    var k = String(key || "");
    if (!k) return false;
    return (
      /^osg[-.]/i.test(k) ||
      /^pauli/i.test(k) ||
      /^__osg/i.test(k)
    );
  }

  function wipeStorage(store) {
    if (!store) return 0;
    var keys = [];
    var removed = 0;
    try {
      for (var i = 0; i < store.length; i += 1) {
        var key = store.key(i);
        if (key) keys.push(key);
      }
    } catch (_) {}
    keys.forEach(function (key) {
      if (!shouldWipeKey(key)) return;
      try {
        store.removeItem(key);
        removed += 1;
      } catch (_) {}
    });
    return removed;
  }

  function clearMemoryFlags() {
    var flags = [
      "__OSG_SESSION_GREET_RUNNING__",
      "__OSG_GREETING_DONE_PENDING_MIC__",
      "__OSG_SESSION_GREET_COMPLETE__",
      "__OSG_AVATAR_COMPANION_BOOT_RUNNING__",
      "__OSG_AVATAR_COMPANION_BOOT_DONE__",
      "__OSG_AVATAR_COMPANION_BOOT_RETRY__",
      "__OSG_AVATAR_COMPANION_BOOT_RETRY_COUNT__",
      "__OSG_AVATAR_PENDING_NAME_ASK__",
      "__OSG_AVATAR_VIP_GREET_PENDING__",
      "__OSG_GREET_TEST__",
      "__OSG_DRAFT_CONFIRM_HANDLER__",
      "__OSG_LAST_INTENT_SEGMENT_KEY__",
    ];
    flags.forEach(function (flag) {
      try {
        delete global[flag];
      } catch (_) {
        global[flag] = false;
      }
    });
    try {
      global.__OSG_AUDIO_GESTURE_UNLOCKED__ = false;
    } catch (_) {}
    try {
      global.osgPauliLiveActive = false;
    } catch (_) {}
    try {
      global.osgUserInputIsWhisper = false;
    } catch (_) {}
  }

  function stopActivePauliMedia() {
    try {
      if (typeof global.osgPauliStopActivePlayback === "function") {
        global.osgPauliStopActivePlayback();
        return;
      }
    } catch (_) {}
    try {
      if (typeof global.osgPauliTtsAbort === "function") {
        global.osgPauliTtsAbort();
        return;
      }
    } catch (_) {}
    try {
      if (typeof global.stopAllSpeech === "function") {
        global.stopAllSpeech();
      }
    } catch (_) {}
  }

  function clearSessionGreetMarkers() {
    var SB = global.OSG_STARTUP_BOOT;
    if (SB && typeof SB.resetSessionGreetState === "function") {
      SB.resetSessionGreetState();
      return;
    }
    try {
      global.sessionStorage.removeItem("osg-session-greet-v1");
    } catch (_) {}
  }

  function unlockAudioForDevGreeting() {
    try {
      if (typeof global.osgPauliMarkUserGestureForAudio === "function") {
        global.osgPauliMarkUserGestureForAudio();
      }
    } catch (_) {}
    try {
      global.__OSG_AUDIO_GESTURE_UNLOCKED__ = true;
    } catch (_) {}
    var SB = global.OSG_STARTUP_BOOT;
    if (SB && typeof SB.markTermsAccepted === "function") {
      try {
        SB.markTermsAccepted();
      } catch (_) {}
    }
  }

  async function clearAppCaches() {
    if (!global.caches || typeof global.caches.keys !== "function") return;
    try {
      var names = await global.caches.keys();
      await Promise.all(
        names.map(function (name) {
          return global.caches.delete(name);
        })
      );
    } catch (_) {}
  }

  function wipeAllPauliStorage() {
    var ls = wipeStorage(global.localStorage);
    var ss = wipeStorage(global.sessionStorage);
    clearMemoryFlags();
    return { localStorage: ls, sessionStorage: ss };
  }

  async function factoryReset() {
    stopActivePauliMedia();
    wipeAllPauliStorage();
    await clearAppCaches();
    global.location.reload();
  }

  async function simulateFirstStart() {
    stopActivePauliMedia();
    clearSessionGreetMarkers();
    clearMemoryFlags();
    unlockAudioForDevGreeting();

    if (typeof global.osgPauliRunUserSessionGreeting !== "function") {
      return { ok: false, reason: "greeting-fn-missing" };
    }

    var ran = await global.osgPauliRunUserSessionGreeting({
      fromCoin: true,
      devSimulate: true,
    });
    return { ok: !!ran };
  }

  global.OSG_PAULI_DEV_RESET = {
    shouldWipeKey: shouldWipeKey,
    wipeAllPauliStorage: wipeAllPauliStorage,
    clearSessionGreetMarkers: clearSessionGreetMarkers,
    factoryReset: factoryReset,
    simulateFirstStart: simulateFirstStart,
  };

  function wirePauliDevResetButtons() {
    var fullBtn = global.document.getElementById("pauli-dev-reset-full");
    var simBtn = global.document.getElementById("pauli-dev-simulate-first");
    if (fullBtn && !fullBtn.__osgDevResetBound) {
      fullBtn.__osgDevResetBound = true;
      fullBtn.addEventListener("click", function () {
        void factoryReset();
      });
    }
    if (simBtn && !simBtn.__osgDevResetBound) {
      simBtn.__osgDevResetBound = true;
      simBtn.addEventListener("click", function () {
        void simulateFirstStart();
      });
    }
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", wirePauliDevResetButtons);
    } else {
      wirePauliDevResetButtons();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
