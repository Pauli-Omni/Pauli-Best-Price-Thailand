/**
 * Pauli Premium — Business-Konstanten (Zero-Cloud, zentral pflegen).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * GESCHÄFTSREGEL — Pauli Best Price Thailand (Premium / Encoder)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1) PREMIUM-TESTPHASE (kostenlos)
 *    • Ab erster Installation: AVATAR_TRIAL_DAYS Kalendertage (30).
 *    • In dieser Zeit: Pauli Premium voll nutzbar (Avatar, Stimme, Interaktion).
 *
 * 2) FREISCHALTUNG INNERHALB DER TESTPHASE (entweder / oder)
 *    A) AVATAR_EXTENSION_PRICE_THB einmalig bezahlen (49,90 THB), oder
 *    B) AVATAR_REFERRAL_TARGET qualifizierte Kauf-Empfehlungen — nur INNERHALB
 *       der 30-Tage-Testphase (Händlerkauf nachgewiesen).
 *
 * 3) NACH ABLAUF DER TESTPHASE (Tag 31+)
 *    • Premium gesperrt, wenn weder A noch B erfüllt wurde.
 *    • Nur noch Freischaltung über AVATAR_EXTENSION_PRICE_THB (49,90 THB).
 *    • Empfehlungs-Freischaltung gilt NICHT mehr nach Testende.
 *    • Ausnahmen: VIP, Lifetime (Legacy-Flag), soziale Befreiung, bereits bezahlt.
 *
 * 4) PREIS (Stand Encoder)
 *    • Einmalige Premium-Freischaltung: 49,90 THB (AVATAR_EXTENSION_PRICE_THB).
 *
 * Technik: window.OSG_AVATAR_MONETIZATION — Konstantennamen historisch (Avatar-*).
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function (global) {
  "use strict";

  var C = {
    /** Kalendertage kostenlose Premium-Testphase ab Installationsdatum. */
    AVATAR_TRIAL_DAYS: 30,
    /** Einmaliger Premium-Freischaltpreis in THB (nach Testphase oder sofort). */
    AVATAR_EXTENSION_PRICE_THB: 49.9,
    /** Qualifizierte Kauf-Empfehlungen — nur innerhalb AVATAR_TRIAL_DAYS. */
    AVATAR_REFERRAL_TARGET: 3,
    /** Empfehlungsfenster = Premium-Testphase; danach nur Bezahl-Freischaltung. */
    AVATAR_REFERRAL_WINDOW_DAYS: 30,
    /** Affiliate-/Händlernetz für qualifizierte Kauf-Empfehlungen */
    AVATAR_MERCHANT_NETWORK_SIZE: 40,
    SOCIAL_TYPES: ["disability_card", "welfare_card", "red_cross_id"],
  };

  global.OSG_AVATAR_MONETIZATION = Object.freeze(C);
})(typeof window !== "undefined" ? window : globalThis);
