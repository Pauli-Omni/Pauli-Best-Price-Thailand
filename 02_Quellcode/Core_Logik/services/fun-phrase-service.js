// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.

/**
 * Fun-Phrase-Service — liefert I18n-Key + Animation-Konstante für Pauli-Unterhaltungssprüche.
 * Text wird vom Aufrufer über OSGI18n.t(phrase.speechKey) abgerufen (aktive Locale).
 * 0 KI-Kosten; Frequenz-Bremse: maximal 1 Spruch alle 3 Interaktionen.
 */
const PHRASES = [
  { speechKey: "fun.crabInstinct",  animation: "CRAB_DANCE"    },
  { speechKey: "fun.greatCatch",    animation: "LAUGH_TRIUMPH" },
  { speechKey: "fun.smellsCheap",   animation: "WINK_SMILE"    },
  { speechKey: "fun.savingHappy",   animation: "HAPPY_JUMP"    },
];

class FunPhraseService {
  constructor() {
    this.interactionCounter = 0;
  }

  /**
   * Gibt einen zufälligen Spruch zurück, maximal einmal alle 3 Interaktionen.
   * @returns {{ speechKey: string, animation: string }|null}
   */
  triggerFunPhrase() {
    this.interactionCounter++;
    if (this.interactionCounter % 3 !== 0) return null;
    return PHRASES[Math.floor(Math.random() * PHRASES.length)];
  }
}

export default new FunPhraseService();
