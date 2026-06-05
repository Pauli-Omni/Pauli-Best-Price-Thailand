import '../../models/coupon.dart';

/// Schnittstelle für händlerspezifische Coupon-Scraper.
/// Implementierungen ziehen sich Rabatt-Codes im Hintergrund.
abstract class CouponScraper {
  String get retailerId;

  Future<List<Coupon>> fetchActiveCoupons();
}
