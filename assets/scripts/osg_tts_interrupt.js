// osg_tts_interrupt.js — Pauli Interrupt Engine (Business Logic)
// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
//
// Implements the 4-rule interrupt contract:
//   1. Sofortiger Stopp — audio halts within ~180 ms after user speaks
//   2. Kein Datenverlust — window.lastInterruptedStatement sichert den unterbrochenen Satz
//   3. Dialog-Historie heilig — LLM-Kontext wird mit Interrupt-Marker angereichert
//   4. Verkaufs-Weiche — Fall A (neue Frage) vs. Fall B (Entschuldigung / Weitermachen)
(function () {
  'use strict';

  // ─── Public State ────────────────────────────────────────────────────────────

  /** Full text Pauli was saying when the user interrupted. Never silently discarded. */
  window.lastInterruptedStatement = null;

  /**
   * LLM context object. Passed into conversation history so the model knows
   * what Pauli had started saying before the interrupt occurred.
   */
  window.OSG_INTERRUPT_CONTEXT = {
    wasInterrupted: false,
    interruptedText: null,
    interruptedAt: null,
    interruptReason: null,
  };

  // ─── Core Interrupt ──────────────────────────────────────────────────────────

  /**
   * Call this the moment the user speaks / taps while Pauli is talking.
   * Stops audio, secures the interrupted text, marks LLM context.
   *
   * @param {string} [reason] - 'user_spoke' | 'user_tap' | 'manual'
   * @returns {Promise<void>} resolves after audio has settled (~180 ms)
   */
  window.osgPauliInterrupt = async function (reason) {
    // Capture BEFORE clearing so we don't lose the text
    const currentText = String(window.osgCurrentTtsText || '').trim();

    // 1. Kill queue — no more pending speech after an interrupt
    if (typeof window.osgPauliTtsClearQueue === 'function') {
      window.osgPauliTtsClearQueue();
    }

    // 2. Stop Web Speech API utterance (if active)
    try {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}

    // 3. Pause every <audio> element on the page
    try {
      document.querySelectorAll('audio').forEach(function (a) {
        if (!a.paused) { a.pause(); a.currentTime = 0; }
      });
    } catch (_) {}

    // 4. Release the TTS guard mutex so processQueue() can accept new items
    if (typeof window.osgPauliTtsAbort === 'function') {
      window.osgPauliTtsAbort();
    }

    // 5. Stop lip-sync visuals
    if (typeof window.OSGLipsyncStopVisuals === 'function') {
      try { window.OSGLipsyncStopVisuals(); } catch (_) {}
    }

    // 6. Secure interrupted text and mark LLM context — only when something was playing
    if (currentText) {
      window.lastInterruptedStatement = currentText;
      window.OSG_INTERRUPT_CONTEXT = {
        wasInterrupted: true,
        interruptedText: currentText,
        interruptedAt: Date.now(),
        interruptReason: reason || 'user_interrupt',
      };
    }

    // 7. Brief silence so audio hardware can settle (feels natural, not abrupt)
    await new Promise(function (r) { setTimeout(r, 180); });
  };

  // ─── Intent Detection (Fall A vs Fall B) ─────────────────────────────────────

  /**
   * Determines whether the user's text is a "resume" request (Fall B)
   * or a brand-new question (Fall A). Uses i18n keys — no hardcoded phrase lists.
   *
   * @param {string} userText
   * @param {string} langCode  - active language code
   * @returns {'resume' | 'new_question' | 'none'}
   */
  window.osgDetectInterruptIntent = function (userText, langCode) {
    if (!window.OSG_INTERRUPT_CONTEXT || !window.OSG_INTERRUPT_CONTEXT.wasInterrupted) {
      return 'none';
    }
    const norm = String(userText || '').toLowerCase().trim();
    if (!norm) return 'none';

    const I = window.__OSG_I18N;
    const pack = I ? (I.T[langCode] || I.T['en'] || {}) : {};
    const triggersRaw = String(pack['interrupt.resumeTriggers'] || '');

    if (triggersRaw) {
      const triggers = triggersRaw.split(',').map(function (t) { return t.trim().toLowerCase(); });
      if (triggers.some(function (t) { return t && norm.includes(t); })) {
        return 'resume';
      }
    }
    // Anything else while wasInterrupted = true → new question (Fall A)
    return 'new_question';
  };

  // ─── Fall B: Resume ───────────────────────────────────────────────────────────

  /**
   * Build the resume speech text (Fall B).
   * Uses i18n key interrupt.resumePrefix, then appends the saved statement.
   * Clears the interrupt context after building so it only fires once.
   *
   * @param {Object} pack  - current i18n pack
   * @returns {string}     - ready-to-speak text, or '' if nothing was saved
   */
  window.osgBuildResumeText = function (pack) {
    const saved = String(window.lastInterruptedStatement || '').trim();
    if (!saved) return '';

    const prefix = String((pack && pack['interrupt.resumePrefix']) || '...').trim();

    // Reset interrupt state — resume is a one-shot action
    window.OSG_INTERRUPT_CONTEXT.wasInterrupted = false;
    window.lastInterruptedStatement = null;

    return prefix + ' ' + saved;
  };

  // ─── Fall A: LLM Context Enrichment ──────────────────────────────────────────

  /**
   * Build a system-level hint to inject into the LLM conversation history
   * when Pauli was interrupted. The model sees what was said and can reference
   * it naturally without losing the thread.
   *
   * Uses i18n key interrupt.llmContextHint with {TEXT} placeholder.
   *
   * @param {string} langCode
   * @returns {string} - system hint, or '' if no active interrupt context
   */
  window.osgBuildInterruptContextHint = function (langCode) {
    const ctx = window.OSG_INTERRUPT_CONTEXT;
    if (!ctx || !ctx.wasInterrupted || !ctx.interruptedText) return '';

    const I = window.__OSG_I18N;
    const pack = I ? (I.T[langCode] || I.T['en'] || {}) : {};
    const tpl = String(
      pack['interrupt.llmContextHint'] ||
      '[System: Pauli was speaking when the user interrupted. ' +
      'Pauli had started saying: "{TEXT}". ' +
      'Keep this in mind for natural conversational continuity.]'
    );
    // Truncate saved text so it doesn't bloat the context window
    const snippet = ctx.interruptedText.slice(0, 140);
    return tpl.replace('{TEXT}', snippet);
  };

  /**
   * Consume the interrupt context hint (marks as used so it's injected only once).
   * Call AFTER injecting it into the LLM history.
   */
  window.osgConsumeInterruptContext = function () {
    if (window.OSG_INTERRUPT_CONTEXT) {
      window.OSG_INTERRUPT_CONTEXT.wasInterrupted = false;
    }
  };

})();
