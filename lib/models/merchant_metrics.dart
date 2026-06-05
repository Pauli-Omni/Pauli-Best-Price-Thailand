/// Aggregierte Qualitätskennzahlen eines Händlers, wie sie vom
/// Marketplace-Backend bzw. unserer Aggregations-API geliefert werden.
class MerchantMetrics {
  MerchantMetrics({
    required this.merchantId,
    required this.merchantName,
    required this.verifiedBuyerRating,
    required this.shippingReliability,
    required this.verifiedReviewCount,
    this.country = 'TH',
    this.authenticItemRate = 1.0,
  });

  final String merchantId;
  final String merchantName;

  /// Ø Sterne aus verifizierten Käufer-Bewertungen (1.0–5.0).
  final double verifiedBuyerRating;

  /// Anteil pünktlich gelieferter Bestellungen in Prozent (0–100).
  final double shippingReliability;

  final int verifiedReviewCount;
  final String country;

  /// Anteil Originalware (0.0–1.0) — `1.0` = nie Fälschungen gemeldet.
  final double authenticItemRate;
}
