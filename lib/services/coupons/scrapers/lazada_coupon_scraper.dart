import '../../../models/coupon.dart';
import '../coupon_scraper.dart';

/// TODO: Lazada-TH Voucher-Seite parsen (https://www.lazada.co.th/voucher/).
class LazadaCouponScraper implements CouponScraper {
  @override
  String get retailerId => 'lazada';

  @override
  Future<List<Coupon>> fetchActiveCoupons() async => const [];
}
