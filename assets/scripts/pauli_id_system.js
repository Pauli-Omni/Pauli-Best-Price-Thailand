/**
 * Pauli ID System — client-side logic
 * - Assigns a sequential human-readable ID ("1 M 000 001") per device
 * - Displays as QR code + plain text in the profile section
 * - Handles "Geworben von" referral input during download
 * - Exposes window.OSG_PAULI_ID for other modules
 *
 * CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
 */
(function (global) {
  "use strict";

  var LS_KEY_PAULI_ID = "osg_pauli_id";
  var LS_KEY_REFERRER = "osg_referred_by";
  var LS_KEY_REF_SENT = "osg_ref_sent";

  // ── ID Format helpers ────────────────────────────────────────────────────

  function pad3(n) {
    return String(Math.max(0, Math.floor(n))).padStart(3, "0");
  }

  /** Format raw counter integer as display ID. */
  function formatPauliId(n) {
    if (n <= 1999999) {
      var offset = n - 1000000;
      return "1 M " + pad3(Math.floor(offset / 1000)) + " " + pad3(offset % 1000);
    }
    var offset2 = n - 2000000;
    return "1 T " + pad3(Math.floor(offset2 / 1000)) + " " + pad3(offset2 % 1000);
  }

  /** Validate and normalise a user-entered display ID. Returns normalised string or null. */
  function normalisePauliId(raw) {
    var s = String(raw || "").replace(/\s+/g, " ").trim().toUpperCase();
    if (/^\d\s[MT]\s\d{3}\s\d{3}$/.test(s)) return s;
    // Accept without spaces: "1M000001"
    var compact = s.replace(/\s/g, "");
    var m = compact.match(/^(\d)([MT])(\d{3})(\d{3})$/);
    if (m) return m[1] + " " + m[2] + " " + m[3] + " " + m[4];
    return null;
  }

  // ── Local storage helpers ───────────────────────────────────────────────

  function readLocalId() {
    try { return localStorage.getItem(LS_KEY_PAULI_ID) || null; } catch (_) { return null; }
  }

  function writeLocalId(id) {
    try { localStorage.setItem(LS_KEY_PAULI_ID, id); } catch (_) {}
  }

  function readReferrer() {
    try { return localStorage.getItem(LS_KEY_REFERRER) || null; } catch (_) { return null; }
  }

  function writeReferrer(id) {
    try { localStorage.setItem(LS_KEY_REFERRER, id); } catch (_) {}
  }

  // ── API calls ────────────────────────────────────────────────────────────

  function osgApiFetch(url, opts) {
    if (typeof window.osgApiFetch === "function") return window.osgApiFetch(url, opts);
    return fetch(url, opts);
  }

  function getClientCid() {
    try { return localStorage.getItem("osg_cid") || null; } catch (_) { return null; }
  }

  async function registerInstall(cid) {
    try {
      var res = await osgApiFetch("/api/pauli-id/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: cid }),
      });
      if (!res.ok) return null;
      var data = await res.json();
      return data.ok ? data.pauliId : null;
    } catch (_) { return null; }
  }

  async function sendReferrer(cid, referrerPauliId) {
    try {
      var res = await osgApiFetch("/api/pauli-id/set-referrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: cid, referrerPauliId: referrerPauliId }),
      });
      if (!res.ok) return false;
      var data = await res.json();
      return !!data.ok;
    } catch (_) { return false; }
  }

  // ── QR code rendering (uses qrcodejs or canvas fallback) ────────────────

  function renderQr(container, text) {
    if (!container) return;
    container.innerHTML = "";
    // Try qrcodejs if loaded
    if (typeof global.QRCode === "function") {
      try {
        new global.QRCode(container, {
          text: text,
          width: 160,
          height: 160,
          colorDark: "#d4af37",
          colorLight: "#0c041c",
          correctLevel: global.QRCode.CorrectLevel.M,
        });
        return;
      } catch (_) {}
    }
    // Minimal SVG QR fallback using a Google Charts-style URL (no external call needed)
    // We just show the text nicely formatted if QR lib not available
    var pre = document.createElement("pre");
    pre.style.cssText = "color:#d4af37;font-size:1.2rem;letter-spacing:0.18em;text-align:center;padding:0.5rem 0;margin:0;font-family:monospace;font-weight:bold;";
    pre.textContent = text;
    container.appendChild(pre);
  }

  // ── UI rendering ─────────────────────────────────────────────────────────

  function i18nT(key, fallback) {
    try {
      var I = window.__OSG_I18N;
      if (I && typeof I.t === "function") return I.t(key) || fallback;
    } catch (_) {}
    return fallback;
  }

  function renderProfileBlock(pauliId) {
    var el = document.getElementById("osg-pauli-id-profile-block");
    if (!el) return;
    el.innerHTML = "";
    el.removeAttribute("hidden");

    var heading = document.createElement("h3");
    heading.className = "pauli-id-profile__heading";
    heading.textContent = i18nT("pauliId.profileHeading", "Mein Pauli-Code");

    var idText = document.createElement("p");
    idText.className = "pauli-id-profile__id-text";
    idText.textContent = pauliId;
    idText.setAttribute("aria-label", i18nT("pauliId.idAriaLabel", "Deine Pauli-ID: ") + pauliId);

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "pauli-id-profile__copy-btn booking-btn-secondary";
    copyBtn.textContent = i18nT("pauliId.copyBtn", "Kopieren");
    copyBtn.addEventListener("click", function () {
      try {
        navigator.clipboard.writeText(pauliId);
        copyBtn.textContent = i18nT("pauliId.copied", "Kopiert ✓");
        setTimeout(function () {
          copyBtn.textContent = i18nT("pauliId.copyBtn", "Kopieren");
        }, 2000);
      } catch (_) {}
    });

    var qrWrap = document.createElement("div");
    qrWrap.className = "pauli-id-profile__qr";
    qrWrap.setAttribute("aria-label", i18nT("pauliId.qrAriaLabel", "QR-Code für Pauli-ID"));
    renderQr(qrWrap, pauliId);

    var hint = document.createElement("p");
    hint.className = "pauli-id-profile__hint";
    hint.textContent = i18nT("pauliId.profileHint", "Teile diesen Code oder QR, um Freunde zu werben.");

    el.appendChild(heading);
    el.appendChild(qrWrap);
    el.appendChild(idText);
    el.appendChild(copyBtn);
    el.appendChild(hint);

    // Update all ID display elements
    document.querySelectorAll("[data-pauli-id-display]").forEach(function (node) {
      node.textContent = pauliId;
    });
  }

  // ── Referral input wiring ────────────────────────────────────────────────

  function wireReferralInput() {
    var input = document.getElementById("osg-pauli-referred-by-input");
    var btn = document.getElementById("osg-pauli-referred-by-btn");
    var status = document.getElementById("osg-pauli-referred-by-status");
    if (!input || !btn) return;

    // Pre-fill from URL param ?referred_by=...
    try {
      var urlRef = new URLSearchParams(location.search).get("referred_by");
      if (urlRef && normalisePauliId(urlRef) && !input.value) {
        input.value = normalisePauliId(urlRef);
      }
    } catch (_) {}

    // Pre-fill from localStorage
    var stored = readReferrer();
    if (stored && !input.value) input.value = stored;

    btn.addEventListener("click", async function () {
      var norm = normalisePauliId(input.value);
      if (!norm) {
        if (status) {
          status.textContent = i18nT("pauliId.referralInvalid", "Ungültiges Format. Beispiel: 1 M 000 123");
          status.className = "pauli-id-referral__status is-error";
        }
        return;
      }
      writeReferrer(norm);
      if (status) {
        status.textContent = i18nT("pauliId.referralSaved", "Gespeichert ✓");
        status.className = "pauli-id-referral__status is-ok";
      }
      // Send to server if we already have our own ID
      var cid = getClientCid();
      var sentFlag = false;
      try { sentFlag = localStorage.getItem(LS_KEY_REF_SENT) === "1"; } catch (_) {}
      if (cid && !sentFlag) {
        var ok = await sendReferrer(cid, norm);
        if (ok) {
          try { localStorage.setItem(LS_KEY_REF_SENT, "1"); } catch (_) {}
        }
      }
    });
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  async function boot() {
    var cid = getClientCid();
    if (!cid) {
      // CID not yet assigned — retry after a short delay
      setTimeout(boot, 1800);
      return;
    }

    var pauliId = readLocalId();

    if (!pauliId) {
      pauliId = await registerInstall(cid);
      if (pauliId) writeLocalId(pauliId);
    }

    if (pauliId) {
      renderProfileBlock(pauliId);

      // If a referrer was saved locally but not yet sent, send now
      var sentFlag = false;
      try { sentFlag = localStorage.getItem(LS_KEY_REF_SENT) === "1"; } catch (_) {}
      var referrer = readReferrer();
      if (referrer && !sentFlag) {
        var ok = await sendReferrer(cid, referrer);
        if (ok) {
          try { localStorage.setItem(LS_KEY_REF_SENT, "1"); } catch (_) {}
        }
      }
    }

    wireReferralInput();

    global.OSG_PAULI_ID = {
      get: function () { return readLocalId(); },
      format: formatPauliId,
      normalise: normalisePauliId,
    };
  }

  // Run after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    setTimeout(boot, 0);
  }

})(window);
