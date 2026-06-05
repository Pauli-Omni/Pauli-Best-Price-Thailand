import '../../../models/coupon.dart';
import '../coupon_scraper.dart';

/// TODO: Big-C-Rabattcodes (Newsletter/App-Promotions) abgreifen.
class BigCCouponScraper implements CouponScraper {
  @override
  String get retailerId => 'big_c';

  @override
  Future<List<Coupon>> fetchActiveCoupons() async => const [];
}
