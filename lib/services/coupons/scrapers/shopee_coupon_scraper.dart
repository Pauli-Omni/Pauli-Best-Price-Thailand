import '../../../models/coupon.dart';
import '../coupon_scraper.dart';

/// TODO: Shopee-TH Voucher-API (`/api/v2/voucher_wallet/...`) anbinden.
class ShopeeCouponScraper implements CouponScraper {
  @override
  String get retailerId => 'shopee';

  @override
  Future<List<Coupon>> fetchActiveCoupons() async => const [];
}
