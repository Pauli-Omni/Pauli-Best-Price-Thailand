import '../../../models/coupon.dart';
import '../coupon_scraper.dart';

/// TODO: Lotus's Promotion-API / Mein-Lotus-App-Coupons.
class LotusCouponScraper implements CouponScraper {
  @override
  String get retailerId => 'lotus';

  @override
  Future<List<Coupon>> fetchActiveCoupons() async => const [];
}
