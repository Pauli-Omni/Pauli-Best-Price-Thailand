import '../../models/merchant_metrics.dart';

/// Landesweiter Qualitäts-Check für thailändische Händler.
/// Schließt automatisch Fake-/Bot-Shops aus, sortiert die verbleibenden
/// nach Vertrauenswürdigkeit und stellt damit den "Shopfluence"-Toggle
/// in der UI bereit.
class ShopTrustFilter {
  const ShopTrustFilter({
    this.minVerifiedBuyerRating = 4.5,
    this.minShippingReliability = 90.0,
    this.minVerifiedReviews = 25,
    this.requireThailandOrigin = true,
  });

  final double minVerifiedBuyerRating;
  final double minShippingReliability;
  final int minVerifiedReviews;
  final bool requireThailandOrigin;

  bool passes(MerchantMetrics m) {
    if (requireThailandOrigin && m.country != 'TH') return false;
    if (m.verifiedReviewCount < minVerifiedReviews) return false;
    if (m.verifiedBuyerRating <= minVerifiedBuyerRating) return false;
    if (m.shippingReliability <= minShippingReliability) return false;
    return true;
  }

  /// Filtert Fake-Händler heraus und sortiert verbleibende nach
  /// Vertrauensindex (Rating + Reliability + Originalware).
  List<MerchantMetrics> trusted(Iterable<MerchantMetrics> merchants) {
    final ok = merchants.where(passes).toList();
    ok.sort((a, b) => _trustIndex(b).compareTo(_trustIndex(a)));
    return ok;
  }

  /// Sortierschlüssel für UI-Listen (höher = besser, 0–100).
  double trustIndex(MerchantMetrics m) => _trustIndex(m);

  double _trustIndex(MerchantMetrics m) {
    final rating = (m.verifiedBuyerRating / 5.0) * 50.0;
    final reliability = (m.shippingReliability / 100.0) * 35.0;
    final authentic = m.authenticItemRate * 15.0;
    return (rating + reliability + authentic).clamp(0, 100).toDouble();
  }
}
