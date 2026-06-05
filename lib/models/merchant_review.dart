/// Händlerbewertung aus einem Marketplace (Shopee/Lazada/...).
/// Wird vom ReviewFilterService analysiert, um Fake-/Bot-Bewertungen
/// zu erkennen.
class MerchantReview {
  MerchantReview({
    required this.id,
    required this.merchantId,
    required this.rating,
    required this.authorCountry,
    this.text = '',
    this.verifiedPurchase = false,
    this.authorReviewCount = 0,
    this.submittedAt,
    this.mentionsAuthentic = false,
    this.mentionsFastDelivery = false,
  });

  final String id;
  final String merchantId;

  /// 1–5 Sterne.
  final double rating;

  /// ISO-Country-Code des Bewertenden ("TH" für Thailand).
  final String authorCountry;
  final String text;

  /// True, wenn der Marketplace die Bestellung bestätigt hat.
  final bool verifiedPurchase;

  /// Anzahl bisheriger Bewertungen des Autors — Indikator gegen Botfarmen.
  final int authorReviewCount;
  final DateTime? submittedAt;

  /// Vorgelagerte Tags aus NLP — wird vom Filter genutzt.
  final bool mentionsAuthentic;
  final bool mentionsFastDelivery;
}
