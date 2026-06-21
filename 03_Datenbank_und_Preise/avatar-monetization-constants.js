/**
 * Pauli Avatar — Business-Konstanten (Zero-Cloud, zentral pflegen).
 */
(function (global) {
  "use strict";

  var C = {
    AVATAR_TRIAL_DAYS: 90,
    AVATAR_EXTENSION_PRICE_THB: 49.9,
    AVATAR_REFERRAL_TARGET: 3,
    /** Affiliate-/Händlernetz für qualifizierte Kauf-Empfehlungen */
    AVATAR_MERCHANT_NETWORK_SIZE: 40,
    SOCIAL_TYPES: ["disability_card", "welfare_card", "red_cross_id"],
  };

  global.OSG_AVATAR_MONETIZATION = Object.freeze(C);
})(typeof window !== "undefined" ? window : globalThis);
