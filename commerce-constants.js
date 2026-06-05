/**
 * Zentrale THB-/Staffel‑Konstanten für Versand‑Demo, Aufschlag & 7‑Eleven‑Gutschein.
 * Bei Preisanpassungen nur diese Datei pflegen — i18n nutzt Platzhalter {SHIP_S} usw.
 */
(function (global) {
  /** @typedef {{SHIP_THB_TIER_S:number,SHIP_THB_TIER_M:number,SHIP_THB_TIER_L:number,PICKUP_SERVICE_MARGIN_THB:number,VOUCHER_THB_STORE:number,VOUCHER_MIN_STORE_PURCHASE_THB:number}} Commerce */
  /** @type {Commerce & { tiersSmL:function():number[], finalPickupPayableThb:function(number,number):number }} */
  var C = {
    SHIP_THB_TIER_S: 39,
    SHIP_THB_TIER_M: 59,
    /** Größenstufe L bzw. gebündeltes L/XL in der UI-Demo (ein THB-Wert) */
    SHIP_THB_TIER_L: 99,
    /**
     * Fester Plattform‑Aufschlag (System‑Infrastruktur) — im Demo‑Checkout zu jeder Summe aus
     * Produktschätzung + optionaler Fracht (7‑Eleven‑Staffeln); bei modellierter Hauslieferung
     * kann der Frachtteil 0 sein — der hier dokumentierte Aufschlag bleibt dennoch gültige Konstante für die UI‑Formel.
     */
    PICKUP_SERVICE_MARGIN_THB: 59,
    VOUCHER_THB_STORE: 15,
    /** Zusätzlicher Mindest‑Laden‑Einkauf beim selben Seven für Gutscheinlösung */
    VOUCHER_MIN_STORE_PURCHASE_THB: 45,
    tiersSmL: function tiersSmL() {
      return [C.SHIP_THB_TIER_S, C.SHIP_THB_TIER_M, C.SHIP_THB_TIER_L];
    },
    /** @returns {number} Produkt (+ Frachtteil, ggf. 0) + gleicher Plattform‑Aufschlag wie bei Abhol */
    finalPickupPayableThb: function finalPickupPayableThb(productThb, freightTierThb) {
      return (
        Math.round(Number(productThb) || 0) +
        Math.round(Number(freightTierThb) || 0) +
        C.PICKUP_SERVICE_MARGIN_THB
      );
    },
    /** Gleiche DEMO‑Summierung bei „Hauslieferung ohne separate Frachtzeile“: Frachtteil = 0 */
    checkoutDemoTotalThbWithOptionalFreight: function checkoutDemoTotalThbWithOptionalFreight(
      productThb,
      freightThbMaybeZero,
    ) {
      return C.finalPickupPayableThb(productThb, freightThbMaybeZero);
    },
    tierLetterForAmount: function tierLetterForAmount(amountThb) {
      var a = Math.round(Number(amountThb));
      if (a === C.SHIP_THB_TIER_S) return "S";
      if (a === C.SHIP_THB_TIER_M) return "M";
      if (a === C.SHIP_THB_TIER_L) return "L";
      return "?";
    },
  };

  global.OSG_COMMERCE = Object.freeze(C);
})(typeof window !== "undefined" ? window : globalThis);
