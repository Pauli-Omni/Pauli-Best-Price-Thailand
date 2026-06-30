/**
 * Pauli Best Price — Startablauf: AGB/Standort (erster Start), Session-Begrüßung (Wai + Sawadee).
 */
(function (global) {
  "use strict";

  var LS_TERMS = "osg-terms-accepted-v1";
  var LS_FIRST_BOOT = "osg-first-boot-complete-v1";
  var SS_SESSION_GREET = "osg-session-greet-v1";
  var LS_GREET_ROTATE = "osg-startup-greet-rotate-v1";
  /** Immer zuerst — unabhängig von der UI-Sprache (Einkauf in Thailand). */
  var OSG_THAI_SAWADEE_TTS = "Sawadee Krab.";
  var OSG_THAI_SAWADEE_BUBBLE = "Sawadee Krab";
  var OSG_PRE_WAI_PAUSE_MS = 500;
  var OSG_POST_SAWADEE_PAUSE_MS = 360;
  var LS_TRUST_LAUNCH_COUNT = "osg-trust-pledge-launch-count-v1";
  var LS_TRUST_LAST_SHOWN = "osg-trust-pledge-last-shown-v1";
  var LS_TRUST_NEXT_DUE = "osg-trust-pledge-next-due-v1";
  var SS_TRUST_LAUNCH_RECORDED = "osg-trust-pledge-launch-recorded-v1";
  var SS_TRUST_PLEDGE_SESSION_SHOWN = "osg-trust-pledge-session-shown-v1";
  var MS_DAY = 86400000;

  function readLs(key) {
    try {
      return String(global.localStorage.getItem(key) || "");
    } catch (_) {
      return "";
    }
  }

  function writeLs(key, val) {
    try {
      global.localStorage.setItem(key, val);
    } catch (_) {}
  }

  function readSs(key) {
    try {
      return String(global.sessionStorage.getItem(key) || "");
    } catch (_) {
      return "";
    }
  }

  function writeSs(key, val) {
    try {
      global.sessionStorage.setItem(key, val);
    } catch (_) {}
  }

  function termsAccepted() {
    return readLs(LS_TERMS) === "1";
  }

  function markTermsAccepted() {
    writeLs(LS_TERMS, "1");
    try {
      if (typeof global.osgPauliOnTermsAudioUnlock === "function") {
        global.osgPauliOnTermsAudioUnlock();
      }
    } catch (_) {}
  }

  function firstBootComplete() {
    return readLs(LS_FIRST_BOOT) === "1";
  }

  function markFirstBootComplete() {
    writeLs(LS_FIRST_BOOT, "1");
  }

  var sessionGreetInFlight = false;

  function sessionGreetDone() {
    return readSs(SS_SESSION_GREET) === "1";
  }

  function markSessionGreetDone() {
    writeSs(SS_SESSION_GREET, "1");
  }

  function resetSessionGreetState() {
    sessionGreetInFlight = false;
    try {
      global.sessionStorage.removeItem(SS_SESSION_GREET);
    } catch (_) {}
  }

  function tpl(line, name) {
    return String(line || "").replace(/\{NAME\}/g, name || "");
  }

  function pickSessionGreetLine(pack, firstName) {
    pack = pack || {};
    var nm = String(firstName || "").trim();
    var canonical = String(pack.avatarStartupGreetCanonical || "").trim();
    if (canonical) {
      return tpl(canonical, nm);
    }
    var lang = "en";
    try {
      if (global.__OSG_I18N && typeof global.__OSG_I18N.systemLangCode === "function") {
        lang = String(global.__OSG_I18N.systemLangCode() || "en").slice(0, 2);
      }
    } catch (_) {}
    if (lang === "de") {
      return "Ich bin Pauli. Dein persönlicher Einkaufsbegleiter. Ich helfe dir dabei, bessere Kaufentscheidungen zu treffen und Geld zu sparen. Was möchtest du heute kaufen?";
    }
    if (lang === "th") {
      return "ผมชื่อเปาลี ผู้ช่วยช้อปปิ้งส่วนตัวของคุณ ผมช่วยคุณตัดสินใจซื้อได้ดีขึ้นและประหยัดเงิน วันนี้อยากซื้ออะไรครับ";
    }
    return "I am Pauli. Your personal shopping companion. I help you make better purchase decisions and save money. What would you like to buy today?";
  }

  function pickSessionGreetIntroLine(pack, firstName) {
    pack = pack || {};
    var nm = String(firstName || "").trim();
    var pool = nm
      ? [
          pack.avatarStartupGreetWithName0,
          pack.avatarStartupGreetWithName1,
          pack.avatarStartupGreetWithName2,
        ]
      : [
          pack.avatarStartupGreetNoName0,
          pack.avatarStartupGreetNoName1,
          pack.avatarStartupGreetNoName2,
        ];
    pool = pool
      .map(function (s) {
        return String(s || "").trim();
      })
      .filter(Boolean);
    if (pool.length) {
      return tpl(pool[Math.floor(Math.random() * pool.length)], nm);
    }
    return pickSessionGreetLine(pack, firstName);
  }

  function pickSessionEntryPromptLine(pack) {
    return String((pack && pack.pauliLiveStartPrompt) || "").trim();
  }

  function startThaiWaiVisual() {
    var AV = global.OSG_PauliAvatarAnimations;
    if (AV && typeof AV.playWaiGreeting === "function") {
      AV.playWaiGreeting();
      return;
    }
    if (typeof global.osgAvatarBeginWai === "function") {
      global.osgAvatarBeginWai();
    }
  }

  function stopThaiWaiVisual() {
    var AV = global.OSG_PauliAvatarAnimations;
    if (AV && typeof AV.stopWaiGreeting === "function") {
      AV.stopWaiGreeting();
      return;
    }
    if (typeof global.osgAvatarEndWai === "function") {
      global.osgAvatarEndWai();
    }
  }

  async function playThaiSawadeeWithWai(speakApi, pack) {
    speakApi = speakApi || {};
    pack = pack || global.__OSG_CURRENT_PACK_CACHE || {};
    var sawadeeLine = String(
      pack.pauliSawadeeKrabTts ||
        pack.pauliSawadeeTts ||
        OSG_THAI_SAWADEE_TTS
    ).trim();
    var sawadeeBubble = String(
      pack.avatarStartupSawadeeBubble || OSG_THAI_SAWADEE_BUBBLE
    ).trim();
    startThaiWaiVisual();
    try {
      if (typeof global.pauliLiveCaptionShow === "function") {
        global.pauliLiveCaptionShow(sawadeeBubble);
      }
    } catch (_) {}
    if (typeof speakApi.speakLine === "function" && sawadeeLine) {
      await speakApi.speakLine(sawadeeLine, {
        gesture: "wai",
        langCode: "th",
        speechKey: "pauliSawadee",
        skipBridge: true,
        returnHome: false,
        skipWaiGesture: true,
        allowCloudTts: true,
      });
    }
    stopThaiWaiVisual();
  }

  function hydrateTermsGate(pack) {
    var ov = global.document.getElementById("osg-terms-gate-overlay");
    if (!ov || !pack) return;
    var h = global.document.getElementById("osg-terms-gate-heading");
    var lead = global.document.getElementById("osg-terms-gate-lead");
    var chkLbl = global.document.getElementById("osg-terms-gate-checkbox-label");
    var viewBtn = global.document.getElementById("osg-terms-gate-view-btn");
    var confirmBtn = global.document.getElementById("osg-terms-gate-confirm-btn");
    var chk = global.document.getElementById("osg-terms-gate-checkbox");
    var declineBtn = global.document.getElementById("osg-terms-gate-decline-btn");
    if (h) h.textContent = pack.termsGateTitle || "";
    if (lead) lead.textContent = pack.termsGateLead || "";
    if (chkLbl) chkLbl.textContent = pack.termsGateCheckboxLabel || "";
    if (viewBtn) {
      viewBtn.textContent = pack.termsGateViewTermsBtn || "";
      viewBtn.setAttribute(
        "aria-label",
        pack.termsGateViewTermsBtnAria || pack.termsGateViewTermsBtn || ""
      );
    }
    if (confirmBtn) {
      confirmBtn.textContent = pack.termsGateConfirmBtn || "";
      confirmBtn.setAttribute(
        "aria-label",
        pack.termsGateConfirmBtnAria || pack.termsGateConfirmBtn || ""
      );
      confirmBtn.disabled = !(chk && chk.checked);
    }
    if (declineBtn) {
      declineBtn.textContent = pack.termsGateDeclineBtn || "";
      declineBtn.setAttribute(
        "aria-label",
        pack.termsGateDeclineBtnAria || pack.termsGateDeclineBtn || ""
      );
    }
    if (chk) {
      chk.setAttribute(
        "aria-label",
        pack.termsGateCheckboxAria || pack.termsGateCheckboxLabel || ""
      );
    }
    ov.setAttribute(
      "aria-label",
      pack.termsGateAriaLabel || pack.termsGateTitle || ""
    );
  }

  function hydrateLocationGate(pack) {
    var ov = global.document.getElementById("osg-first-boot-location-overlay");
    if (!ov || !pack) return;
    var h = global.document.getElementById("osg-first-boot-location-heading");
    var lead = global.document.getElementById("osg-first-boot-location-lead");
    var privacy = global.document.getElementById("osg-first-boot-privacy-note");
    var allow = global.document.getElementById("osg-first-boot-location-allow");
    var decline = global.document.getElementById("osg-first-boot-location-decline");
    if (h) h.textContent = pack.firstBootLocationGateTitle || "";
    if (lead) lead.textContent = pack.firstBootLocationGateLead || "";
    if (privacy) privacy.textContent = pack.firstBootPrivacyLocalNote || "";
    if (allow) {
      allow.textContent =
        pack.firstBootLocationGateAllowBtn ||
        pack.personalMapsAllowBtn ||
        "";
    }
    if (decline) {
      decline.textContent =
        pack.firstBootLocationGateDeclineBtn ||
        pack.personalMapsDeclineBtn ||
        "";
    }
  }

  function showOverlay(id) {
    var ov = global.document.getElementById(id);
    if (!ov) return;
    ov.removeAttribute("hidden");
    ov.setAttribute("aria-hidden", "false");
    try {
      global.document.body.style.overflow = "hidden";
    } catch (_) {}
  }

  function hideOverlay(id) {
    var ov = global.document.getElementById(id);
    if (!ov) return;
    ov.setAttribute("hidden", "");
    ov.setAttribute("aria-hidden", "true");
    try {
      global.document.body.style.overflow = "";
    } catch (_) {}
  }

  function hydrateTermsDeclineOverlay(pack) {
    var h = global.document.getElementById("osg-terms-decline-heading");
    var lead = global.document.getElementById("osg-terms-decline-lead");
    var door = global.document.getElementById("osg-terms-decline-door");
    var exitBtn = global.document.getElementById("osg-terms-decline-exit-btn");
    if (h) h.textContent = pack.termsGateDeclineTitle || "";
    if (lead) lead.textContent = pack.termsGateDeclineLead || "";
    if (door) door.textContent = pack.termsGateDeclineDoorOpen || "";
    if (exitBtn) {
      exitBtn.textContent = pack.termsGateDeclineExitBtn || "";
      exitBtn.setAttribute(
        "aria-label",
        pack.termsGateDeclineExitBtnAria || pack.termsGateDeclineExitBtn || ""
      );
    }
    var ov = global.document.getElementById("osg-terms-decline-overlay");
    if (ov) {
      ov.setAttribute(
        "aria-label",
        pack.termsGateDeclineAriaLabel || pack.termsGateDeclineTitle || ""
      );
    }
  }

  function hideMainAppChrome() {
    try {
      var page = global.document.querySelector("main.page");
      if (page) page.setAttribute("hidden", "");
      var coin = global.document.getElementById("coin-stage");
      if (coin) coin.setAttribute("hidden", "");
    } catch (_) {}
  }

  /** Kein Sperr-Flag — Nutzer kann jederzeit neu installieren und akzeptieren. */
  function finalizeInstallationExit() {
    hideMainAppChrome();
    try {
      global.document.body.style.overflow = "hidden";
    } catch (_) {}
    try {
      global.close();
    } catch (_) {}
    setTimeout(function () {
      try {
        global.close();
      } catch (_) {}
    }, 120);
  }

  function showTermsDeclineFarewell(pack) {
    pack = pack || {};
    hideOverlay("osg-terms-gate-overlay");
    hydrateTermsDeclineOverlay(pack);
    showOverlay("osg-terms-decline-overlay");
    hideMainAppChrome();
    var exitBtn = global.document.getElementById("osg-terms-decline-exit-btn");
    if (!exitBtn) {
      finalizeInstallationExit();
      return;
    }
    function onExit() {
      exitBtn.removeEventListener("click", onExit);
      finalizeInstallationExit();
    }
    exitBtn.addEventListener("click", onExit);
    try {
      exitBtn.focus();
    } catch (_) {}
  }

  var termsGateWired = false;

  function wireTermsGateOnce() {
    if (termsGateWired) return;
    termsGateWired = true;
    var chk = global.document.getElementById("osg-terms-gate-checkbox");
    var confirmBtn = global.document.getElementById("osg-terms-gate-confirm-btn");
    var viewBtn = global.document.getElementById("osg-terms-gate-view-btn");
    var declineBtn = global.document.getElementById("osg-terms-gate-decline-btn");
    if (chk && confirmBtn) {
      chk.addEventListener("change", function () {
        confirmBtn.disabled = !chk.checked;
      });
    }
    if (viewBtn) {
      viewBtn.addEventListener("click", function () {
        try {
          if (typeof global.osgOpenLegalDocsPane === "function") {
            global.osgOpenLegalDocsPane("terms");
          }
        } catch (_) {}
      });
    }
  }

  function waitTermsGate(pack) {
    wireTermsGateOnce();
    hydrateTermsGate(pack);
    return new Promise(function (resolve) {
      if (termsAccepted()) {
        resolve();
        return;
      }
      var ov = global.document.getElementById("osg-terms-gate-overlay");
      var confirmBtn = global.document.getElementById("osg-terms-gate-confirm-btn");
      var declineBtn = global.document.getElementById("osg-terms-gate-decline-btn");
      var chk = global.document.getElementById("osg-terms-gate-checkbox");
      if (!ov || !confirmBtn) {
        return;
      }
      function cleanup() {
        confirmBtn.removeEventListener("click", onConfirm);
        if (declineBtn) declineBtn.removeEventListener("click", onDecline);
      }
      function done() {
        cleanup();
        hideOverlay("osg-terms-gate-overlay");
        resolve();
      }
      function onConfirm() {
        if (!chk || !chk.checked) return;
        markTermsAccepted();
        done();
      }
      function onDecline() {
        cleanup();
        showTermsDeclineFarewell(pack);
      }
      confirmBtn.addEventListener("click", onConfirm);
      if (declineBtn) declineBtn.addEventListener("click", onDecline);
      showOverlay("osg-terms-gate-overlay");
      try {
        if (chk) chk.focus();
      } catch (_) {}
    });
  }

  function waitLocationGate(pack, hooks) {
    hooks = hooks || {};
    hydrateLocationGate(pack);
    return new Promise(function (resolve) {
      if (firstBootComplete()) {
        resolve();
        return;
      }
      var allow = global.document.getElementById("osg-first-boot-location-allow");
      var decline = global.document.getElementById("osg-first-boot-location-decline");
      if (!allow || !decline) {
        markFirstBootComplete();
        resolve();
        return;
      }
      function finish() {
        allow.removeEventListener("click", onAllow);
        decline.removeEventListener("click", onDecline);
        markFirstBootComplete();
        hideOverlay("osg-first-boot-location-overlay");
        resolve();
      }
      function onAllow() {
        try {
          if (typeof hooks.onRequestGeo === "function") {
            hooks.onRequestGeo(pack);
          }
        } catch (_) {}
        finish();
      }
      function onDecline() {
        try {
          if (typeof global.osgMapConsentWrite === "function") {
            global.osgMapConsentWrite("declined");
          }
        } catch (_) {}
        finish();
      }
      allow.addEventListener("click", onAllow);
      decline.addEventListener("click", onDecline);
      showOverlay("osg-first-boot-location-overlay");
    });
  }

  function needsNameOnboarding() {
    try {
      if (typeof global.osgPersonalOnboardState === "function") {
        if (global.osgPersonalOnboardState()) return false;
      }
      if (typeof global.osgResolveCustomerDisplayName === "function") {
        if (global.osgResolveCustomerDisplayName()) return false;
      }
    } catch (_) {}
    return true;
  }

  function runFirstLaunchGates(pack, hooks) {
    hooks = hooks || {};
    pack = pack || {};
    return waitTermsGate(pack)
      .then(function () {
        return waitLocationGate(pack, hooks);
      });
  }

  /**
   * Session-Begrüßung — Audio nur bei explizitem Aufruf (opts.playAudio === true).
   * Standard: still markieren, kein Sawadee-/MP3-Autostart beim Seitenladen.
   */
  async function runSessionGreeting(pack, speakApi, greetOpts) {
    pack = pack || {};
    speakApi = speakApi || {};
    greetOpts = greetOpts || {};
    if (!termsAccepted()) return;
    if (sessionGreetDone() || sessionGreetInFlight) return;
    sessionGreetInFlight = true;
    try {
    var playAudio = greetOpts.playAudio === true;

    if (!playAudio) {
      return;
    }

    var firstName = "";
    try {
      if (typeof global.osgResolveCustomerDisplayName === "function") {
        firstName = global.osgResolveCustomerDisplayName() || "";
      }
    } catch (_) {}

    var greetLine = pickSessionGreetIntroLine(pack, firstName);
    var greetBubble = String(greetLine || pack.avatarCompanionIntroBubble || "").trim();
    var entryLine = pickSessionEntryPromptLine(pack);
    var entryBubble = String(entryLine || "").trim();
    var sawadeeDone = false;
    var greetDone = false;
    var entryDone = false;

    await new Promise(function (r) {
      setTimeout(r, OSG_PRE_WAI_PAUSE_MS);
    });

    await playThaiSawadeeWithWai(speakApi, pack);
    sawadeeDone = true;

    await new Promise(function (r) {
      setTimeout(r, OSG_POST_SAWADEE_PAUSE_MS);
    });

    if (greetLine && typeof speakApi.speakLine === "function") {
      try {
        if (typeof global.pauliLiveCaptionShow === "function" && greetBubble) {
          global.pauliLiveCaptionShow(greetBubble);
        }
      } catch (_) {}
      try {
        if (typeof speakApi.gesture === "function") {
          speakApi.gesture("greet");
        }
      } catch (_) {}
      await speakApi.speakLine(greetLine, {
        gesture: "greet",
        speechKey: "avatarStartupGreet",
        skipBridge: true,
        allowCloudTts: true,
        dynamicSpeech: true,
      });
      greetDone = true;
    }

    if (entryLine && typeof speakApi.speakLine === "function") {
      try {
        if (typeof global.pauliLiveCaptionShow === "function" && entryBubble) {
          global.pauliLiveCaptionShow(entryBubble);
        }
      } catch (_) {}
      await speakApi.speakLine(entryLine, {
        gesture: "greet",
        speechKey: "pauliLiveStartPrompt",
        skipBridge: true,
        allowCloudTts: true,
        clonedVoiceFirst: false,
        dynamicSpeech: true,
      });
      entryDone = true;
    }

    if (sawadeeDone && greetDone) {
      if (entryDone || !entryLine) {
        markSessionGreetDone();
      }
    }
    } finally {
      sessionGreetInFlight = false;
    }
  }

  function trustPledgeLaunchCount() {
    var n = parseInt(readLs(LS_TRUST_LAUNCH_COUNT), 10);
    return isFinite(n) && n > 0 ? n : 0;
  }

  /** Ein Zähler pro Tab-Session — ab 2. App-Start darf das Versprechen erscheinen. */
  function recordTrustPledgeLaunchOncePerSession() {
    if (readSs(SS_TRUST_LAUNCH_RECORDED) === "1") {
      return trustPledgeLaunchCount();
    }
    if (!termsAccepted()) return trustPledgeLaunchCount();
    writeSs(SS_TRUST_LAUNCH_RECORDED, "1");
    var n = trustPledgeLaunchCount() + 1;
    writeLs(LS_TRUST_LAUNCH_COUNT, String(n));
    return n;
  }

  function computeNextTrustPledgeDue(fromMs) {
    var baseDays = 15;
    var jitter = 0.72 + Math.random() * 0.56;
    var days = Math.round(baseDays * jitter);
    if (days < 11) days = 11;
    if (days > 19) days = 19;
    return fromMs + days * MS_DAY;
  }

  function shouldShowTrustPledgeAvatar() {
    if (trustPledgeLaunchCount() < 2) return false;
    if (readSs(SS_TRUST_PLEDGE_SESSION_SHOWN) === "1") return false;
    var lastShown = parseInt(readLs(LS_TRUST_LAST_SHOWN), 10) || 0;
    if (!lastShown) return true;
    var nextDue = parseInt(readLs(LS_TRUST_NEXT_DUE), 10) || 0;
    if (!nextDue) return true;
    return Date.now() >= nextDue;
  }

  function markTrustPledgeShown() {
    var now = Date.now();
    writeLs(LS_TRUST_LAST_SHOWN, String(now));
    writeLs(LS_TRUST_NEXT_DUE, String(computeNextTrustPledgeDue(now)));
    writeSs(SS_TRUST_PLEDGE_SESSION_SHOWN, "1");
  }

  function syncTrustPledgePanelVisibility() {
    var panel = global.document.getElementById("osg-trust-pledge-panel");
    if (!panel) return;
    var show = trustPledgeLaunchCount() >= 2;
    if (show) {
      panel.removeAttribute("hidden");
      panel.setAttribute("aria-hidden", "false");
    } else {
      panel.setAttribute("hidden", "");
      panel.setAttribute("aria-hidden", "true");
    }
  }

  function stripHtmlLite(html) {
    return String(html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function trustPledgeSegments(pack) {
    pack = pack || {};
    return [
      {
        tts:
          String(pack.avatarTrustPledgeAnonymTts || "").trim() ||
          stripHtmlLite(pack.trustPledgeAnonymHtml),
        bubble:
          String(pack.avatarTrustPledgeAnonymBubble || "").trim() ||
          stripHtmlLite(pack.trustPledgeAnonymHtml),
        speechKey: "avatarTrustPledgeAnonymTts",
      },
      {
        tts:
          String(pack.avatarTrustPledgeIndependenceTts || "").trim() ||
          stripHtmlLite(pack.trustPledgeIndependenceHtml),
        bubble:
          String(pack.avatarTrustPledgeIndependenceBubble || "").trim() ||
          stripHtmlLite(pack.trustPledgeIndependenceHtml),
        speechKey: "avatarTrustPledgeIndependenceTts",
      },
      {
        tts:
          String(pack.avatarTrustPledgeAdsTts || "").trim() ||
          stripHtmlLite(pack.trustPledgeAdsHtml),
        bubble:
          String(pack.avatarTrustPledgeAdsBubble || "").trim() ||
          stripHtmlLite(pack.trustPledgeAdsHtml),
        speechKey: "avatarTrustPledgeAdsTts",
      },
    ].filter(function (s) {
      return s.tts;
    });
  }

  /**
   * Ab 2. App-Start, ca. 2×/Monat (11–19 Tage, leicht variierend): Avatar + Panel-Spotlight.
   */
  async function runTrustPledgePresentation(pack, speakApi) {
    pack = pack || {};
    speakApi = speakApi || {};
    if (!termsAccepted()) return;
    if (!shouldShowTrustPledgeAvatar()) return;

    var segments = trustPledgeSegments(pack);
    if (!segments.length) return;

    var panel = global.document.getElementById("osg-trust-pledge-panel");
    if (panel) {
      panel.removeAttribute("hidden");
      panel.setAttribute("aria-hidden", "false");
      panel.classList.add("osg-trust-pledge-panel--spotlight");
      try {
        panel.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (_) {}
    }

    await new Promise(function (r) {
      setTimeout(r, 520);
    });

    for (var i = 0; i < segments.length; i += 1) {
      var seg = segments[i];
      try {
        if (typeof speakApi.gesture === "function") {
          speakApi.gesture(i === 0 ? "greet" : "help");
        }
      } catch (_) {}
      try {
        if (
          typeof global.pauliLiveCaptionShow === "function" &&
          seg.bubble
        ) {
          global.pauliLiveCaptionShow(seg.bubble);
        }
      } catch (_) {}
      if (typeof speakApi.speakLine === "function") {
        await speakApi.speakLine(seg.tts, {
          gesture: i === 0 ? "greet" : "help",
          speechKey: seg.speechKey,
          skipBridge: true,
          returnHome: i === segments.length - 1,
        });
      }
      if (i < segments.length - 1) {
        await new Promise(function (r) {
          setTimeout(r, 380);
        });
      }
    }

    markTrustPledgeShown();
    if (panel) {
      setTimeout(function () {
        panel.classList.remove("osg-trust-pledge-panel--spotlight");
      }, 900);
    }
  }

  global.OSG_STARTUP_BOOT = {
    LS_TERMS: LS_TERMS,
    LS_FIRST_BOOT: LS_FIRST_BOOT,
    SS_SESSION_GREET: SS_SESSION_GREET,
    termsAccepted: termsAccepted,
    markTermsAccepted: markTermsAccepted,
    firstBootComplete: firstBootComplete,
    markFirstBootComplete: markFirstBootComplete,
    sessionGreetDone: sessionGreetDone,
    markSessionGreetDone: markSessionGreetDone,
    resetSessionGreetState: resetSessionGreetState,
    pickSessionGreetLine: pickSessionGreetLine,
    pickSessionGreetIntroLine: pickSessionGreetIntroLine,
    pickSessionEntryPromptLine: pickSessionEntryPromptLine,
    hydrateTermsGate: hydrateTermsGate,
    hydrateTermsDeclineOverlay: hydrateTermsDeclineOverlay,
    hydrateLocationGate: hydrateLocationGate,
    runFirstLaunchGates: runFirstLaunchGates,
    runSessionGreeting: runSessionGreeting,
    needsNameOnboarding: needsNameOnboarding,
    recordTrustPledgeLaunchOncePerSession: recordTrustPledgeLaunchOncePerSession,
    trustPledgeLaunchCount: trustPledgeLaunchCount,
    shouldShowTrustPledgeAvatar: shouldShowTrustPledgeAvatar,
    syncTrustPledgePanelVisibility: syncTrustPledgePanelVisibility,
    runTrustPledgePresentation: runTrustPledgePresentation,
  };
})(typeof window !== "undefined" ? window : globalThis);
