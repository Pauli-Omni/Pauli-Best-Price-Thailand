/**
 * Pauli Münz-Avatar — 5 Animations-Zustände (Video-Loop oder CSS-Fallback).
 * UI-Controller: Mount-Wai, TTS-Speak, Checkout-Kauf, Sperre + Bezahl-Modal.
 */
(function (global) {
  "use strict";

  var STATE_CLASSES = [
    "is-anim-wai",
    "is-anim-speak",
    "is-anim-purchase-std",
    "is-anim-purchase-premium",
    "is-anim-locked-flip",
    "is-anim-idle-spin",
  ];

  var CSS_BY_SLOT = {
    wai_greeting: "is-anim-wai",
    speak: "is-anim-speak",
    purchase_standard: "is-anim-purchase-std",
    purchase_premium: "is-anim-purchase-premium",
    locked_carousel: "is-anim-locked-flip",
  };

  var LS_MOUNT_WAI = "osg-avatar-mount-wai-v1";

  var manifest = function () {
    return global.OSG_AVATAR_ANIMATION_MANIFEST || null;
  };

  var root = {
    stage: null,
    host: null,
    img: null,
    flip: null,
    flipInner: null,
    backImg: null,
    video: null,
    payModal: null,
    payModalClose: null,
    current: "idle",
    locked: false,
    speakRefCount: 0,
    appMountDone: false,
    videoReady: Object.create(null),
    purchaseTimer: 0,
    waiTimer: 0,
    populatePayModal: null,
  };

  function isLicenseExpired() {
    if (typeof global.osgAvatarAccessUnlocked === "function") {
      return !global.osgAvatarAccessUnlocked();
    }
    return false;
  }

  function clearStateClasses() {
    if (!root.stage) return;
    STATE_CLASSES.forEach(function (c) {
      root.stage.classList.remove(c);
    });
  }

  function stopVideo() {
    if (!root.video) return;
    try {
      root.video.pause();
    } catch (_) {}
    root.video.removeAttribute("src");
    root.video.load();
    root.video.hidden = true;
    root.video.style.display = "none";
  }

  function showStatic(show) {
    if (root.img) root.img.hidden = !show;
    if (root.flip) root.flip.hidden = show;
  }

  function slotDef(key) {
    var M = manifest();
    return M && M.slots && M.slots[key] ? M.slots[key] : null;
  }

  function pickVideoSrc(slot) {
    if (!slot) return "";
    var v = global.document.createElement("video");
    if (slot.webm && v.canPlayType && v.canPlayType('video/webm; codecs="vp9"')) {
      return slot.webm;
    }
    return slot.mp4 || slot.webm || "";
  }

  function tryPlayVideo(key, onFail) {
    var slot = slotDef(key);
    if (!slot || !root.video) {
      onFail();
      return;
    }
    var src = pickVideoSrc(slot);
    if (!src) {
      onFail();
      return;
    }
    if (root.videoReady[src] === false) {
      onFail();
      return;
    }
    root.video.hidden = false;
    showStatic(false);
    if (root.video.getAttribute("data-src") !== src) {
      root.video.setAttribute("data-src", src);
      root.video.src = src;
      if (slot.poster) root.video.poster = slot.poster;
      root.video.loop = key !== "wai_greeting";
      root.video.load();
    }
    var played = root.video.play();
    if (played && typeof played.catch === "function") {
      played.catch(function () {
        root.videoReady[src] = false;
        stopVideo();
        onFail();
      });
    }
    root.video.onerror = function () {
      root.videoReady[src] = false;
      stopVideo();
      onFail();
    };
    root.video.onloadeddata = function () {
      root.videoReady[src] = true;
    };
  }

  function applyCssFallback(key) {
    stopVideo();
    showStatic(key !== "locked_carousel");
    clearStateClasses();
    if (key === "speak" || key === "wai_greeting") {
      return;
    }
    var cls = CSS_BY_SLOT[key];
    if (cls && root.stage) root.stage.classList.add(cls);
    if (key === "locked_carousel") {
      if (root.flip) root.flip.hidden = false;
      if (root.img) root.img.hidden = true;
    }
  }

  function applyIdleSpin() {
    if (root.locked) {
      applyCssFallback("locked_carousel");
      return;
    }
    if (!root.stage || !root.flip) {
      showStatic(true);
      return;
    }
    root.flip.hidden = false;
    if (root.img) root.img.hidden = true;
    root.stage.classList.add("is-anim-idle-spin");
  }

  function clearIdleSpin() {
    if (root.stage) root.stage.classList.remove("is-anim-idle-spin");
    if (root.flip) root.flip.hidden = true;
    if (root.img) root.img.hidden = false;
  }

  function setState(key) {
    key = String(key || "idle");
    if (root.locked && key !== "locked_carousel" && key !== "idle") return;
    if (key === "speak" && root.speakRefCount <= 0 && !root.locked) {
      key = "idle";
    }
    root.current = key;

    if (key === "purchase_standard" || key === "purchase_premium") {
      tryPlayVideo(key, function () {
        applyCssFallback(key);
      });
      return;
    }

    if (key === "locked_carousel") {
      stopVideo();
      applyCssFallback("locked_carousel");
      return;
    }

    if (key === "speak") {
      stopVideo();
      clearStateClasses();
      clearIdleSpin();
      showStatic(true);
      return;
    }

    if (key === "wai_greeting") {
      return;
    }

    stopVideo();
    clearStateClasses();
    applyIdleSpin();
  }

  function buildFlipLayer() {
    var M = manifest();
    if (!root.host || root.flip) return;
    var wrap = global.document.createElement("div");
    wrap.className = "pauli-avatar-flip";
    wrap.hidden = true;
    wrap.setAttribute("aria-hidden", "true");
    var inner = global.document.createElement("div");
    inner.className = "pauli-avatar-flip__inner";
    var front = global.document.createElement("img");
    front.className =
      "pauli-avatar-flip__face pauli-avatar-flip__face--front coin-visual-img coin-visual-img--light";
    front.src =
      (root.img && root.img.getAttribute("src")) ||
      (M && M.FRONT_IMAGE) ||
      "/Frontseite02.png";
    front.alt = "";
    front.draggable = false;
    front.decoding = "async";
    var back = global.document.createElement("img");
    back.className =
      "pauli-avatar-flip__face pauli-avatar-flip__face--back coin-visual-img coin-visual-img--light";
    back.src = (M && M.BACK_IMAGE) || "/hinterseite.png";
    back.alt = "";
    back.draggable = false;
    back.decoding = "async";
    inner.appendChild(front);
    inner.appendChild(back);
    wrap.appendChild(inner);
    root.host.appendChild(wrap);
    root.flip = wrap;
    root.flipInner = inner;
    root.backImg = back;
    root.frontFlipImg = front;
  }

  function buildVideoLayer() {
    if (!root.host || root.video) return;
    var v = global.document.createElement("video");
    v.className = "pauli-avatar-loop";
    v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    v.setAttribute("loop", "");
    v.setAttribute("preload", "none");
    v.hidden = true;
    root.host.appendChild(v);
    root.video = v;
  }

  function bindPayModal() {
    root.payModal = global.document.getElementById("osg-avatar-pay-modal");
    root.payModalClose = global.document.getElementById(
      "osg-avatar-pay-modal-close"
    );
    if (!root.payModal) return;
    var backdrop = root.payModal.querySelector(".osg-avatar-pay-modal__backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", closePaymentModal);
    }
    if (root.payModalClose) {
      root.payModalClose.addEventListener("click", closePaymentModal);
    }
    global.document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isPayModalOpen()) closePaymentModal();
    });
  }

  function isPayModalOpen() {
    return !!(root.payModal && !root.payModal.hasAttribute("hidden"));
  }

  function openPaymentModal() {
    if (!root.payModal) return;
    if (typeof root.populatePayModal === "function") {
      root.populatePayModal();
    }
    root.payModal.removeAttribute("hidden");
    global.__OSG_AVATAR_PAY_MODAL_OPEN__ = true;
    if (root.payModalClose) {
      try {
        root.payModalClose.focus();
      } catch (_) {}
    }
  }

  function closePaymentModal() {
    if (!root.payModal) return;
    root.payModal.setAttribute("hidden", "");
    global.__OSG_AVATAR_PAY_MODAL_OPEN__ = false;
  }

  function handleCoinClick() {
    if (isLicenseExpired() || root.locked) {
      openPaymentModal();
      return true;
    }
    return false;
  }

  function preloadSlotMetadata(key) {
    var slot = slotDef(key);
    if (!slot || !global.document) return;
    var src = pickVideoSrc(slot);
    if (!src || root.videoReady[src] === false) return;
    var link = global.document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = src;
    global.document.head.appendChild(link);
  }

  function init(opts) {
    opts = opts || {};
    root.stage = opts.stage || global.document.getElementById("coin-stage");
    root.img =
      opts.img || global.document.getElementById("pauli-main-avatar-img");
    root.host =
      opts.host ||
      (root.stage &&
        root.stage.querySelector(".coin-visual-shadow-host--main"));
    root.populatePayModal =
      typeof opts.populatePayModal === "function" ? opts.populatePayModal : null;
    if (!root.stage || !root.img || !root.host) return false;
    buildFlipLayer();
    buildVideoLayer();
    bindPayModal();
    refreshLockState(isLicenseExpired());
    if (root.video) {
      root.video.hidden = true;
      root.video.style.display = "none";
    }
    if (!root.locked) applyIdleSpin();
    try {
      global.addEventListener("osg-terms-audio-unlocked", function () {
        if (!termsAudioOk()) return;
        if (!root.appMountDone && !root.locked) onAppMount();
      });
    } catch (_) {}
    return true;
  }

  function refreshLockState(isLocked) {
    root.locked = !!isLocked;
    if (root.locked) {
      root.speakRefCount = 0;
      setState("idle");
      return;
    }
    closePaymentModal();
    if (root.current === "locked_carousel") setState("idle");
  }

  function termsAudioOk() {
    if (typeof global.osgPauliAudioAllowed === "function") {
      return global.osgPauliAudioAllowed();
    }
    return true;
  }

  function onAppMount() {
    if (!termsAudioOk()) return;
    root.appMountDone = true;
  }

  function syncSpeakAudio(delta) {
    if (root.locked) return;
    root.speakRefCount = Math.max(0, root.speakRefCount + (delta || 0));
    if (root.speakRefCount > 0) {
      stopVideo();
      clearStateClasses();
      clearIdleSpin();
      showStatic(true);
      root.current = "speak";
      return;
    }
    if (root.current === "speak") setState("idle");
  }

  function onSpeakStart() {
    if (!termsAudioOk()) return;
    syncSpeakAudio(1);
  }

  function onSpeakStop() {
    syncSpeakAudio(-1);
  }

  function onWaiStart() {
    playWaiGreeting();
  }

  function playWaiGreeting() {
    if (root.locked || !root.stage) return;
    root.current = "wai_greeting";
    clearStateClasses();
    clearIdleSpin();
    root.stage.classList.add("is-anim-wai");
    showStatic(true);
  }

  function stopWaiGreeting() {
    if (root.stage) root.stage.classList.remove("is-anim-wai");
    stopVideo();
    showStatic(true);
    if (root.current === "wai_greeting") root.current = "idle";
  }

  function onWaiStop() {
    if (root.locked) return;
    if (root.speakRefCount > 0) return;
    if (root.current === "wai_greeting") setState("idle");
  }

  function onCheckoutSuccess(amountThb, speakFn) {
    if (root.locked) return;
    var M = manifest();
    var min = (M && M.PREMIUM_PURCHASE_MIN_THB) || 500;
    var n = Number(amountThb);
    var key =
      Number.isFinite(n) && n >= min
        ? "purchase_premium"
        : "purchase_standard";
    setState(key);
    if (typeof speakFn === "function") {
      try {
        speakFn();
      } catch (_) {}
    }
    try {
      clearTimeout(root.purchaseTimer);
    } catch (_) {}
    root.purchaseTimer = global.setTimeout(function () {
      if (root.speakRefCount > 0) {
        setState("speak");
      } else {
        setState("idle");
      }
    }, key === "purchase_premium" ? 5200 : 3600);
    try {
      global.dispatchEvent(
        new CustomEvent("osg:avatar-checkout-success", {
          detail: { amountThb: n, tier: key },
        })
      );
    } catch (_) {}
  }

  function onPurchase(amountThb) {
    onCheckoutSuccess(amountThb, null);
  }

  global.OSG_PauliAvatarAnimations = {
    init: init,
    setState: setState,
    refreshLockState: refreshLockState,
    onAppMount: onAppMount,
    onCheckoutSuccess: onCheckoutSuccess,
    onPurchase: onPurchase,
    onSpeakStart: onSpeakStart,
    onSpeakStop: onSpeakStop,
    onWaiStart: onWaiStart,
    onWaiStop: onWaiStop,
    playWaiGreeting: playWaiGreeting,
    stopWaiGreeting: stopWaiGreeting,
    openPaymentModal: openPaymentModal,
    closePaymentModal: closePaymentModal,
    handleCoinClick: handleCoinClick,
    isLicenseExpired: isLicenseExpired,
    manifest: manifest,
  };
})(typeof window !== "undefined" ? window : globalThis);
