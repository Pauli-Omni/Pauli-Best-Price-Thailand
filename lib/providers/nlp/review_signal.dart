/// Was die NLP-Analyse aus einer Rezension herausliest.
enum ReviewSignal {
  /// Klare Bestätigung, dass die Ware physisch und einwandfrei
  /// beim Kunden angekommen ist.
  promoConfirmed,

  /// Klares Scam-/Lockvogel-/Nichtlieferungs-Signal.
  scamSignal,

  /// Keine eindeutige Aussage.
  neutral;
}
