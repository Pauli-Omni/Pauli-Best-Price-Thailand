import '../../../models/coupon.dart';
import '../coupon_scraper.dart';

/// TODO: 7-Eleven / All-Member Coupons.
class SevenElevenCouponScraper implements CouponScraper {
  @override
  String get retailerId => 'seven_eleven';

  @override
  Future<List<Coupon>> fetchActiveCoupons() async => const [];
}
