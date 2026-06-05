import '../../models/coupon.dart';
import 'coupon_scraper.dart';

/// Sammelt im Hintergrund von allen registrierten Coupon-Scrapern die
/// aktuellen Codes ein, cached sie kurz und liefert den besten Coupon
/// für einen Anbieter/Produkt.
class CouponAggregator {
  CouponAggregator({
    required List<CouponScraper> scrapers,
    Duration cacheTtl = const Duration(minutes: 30),
  })  : _scrapers = scrapers,
        _cacheTtl = cacheTtl;

  final List<CouponScraper> _scrapers;
  final Duration _cacheTtl;
  final Map<String, List<Coupon>> _cache = {};
  DateTime? _cachedAt;

  Future<void> refresh() async {
    _cache.clear();
    await Future.wait(_scrapers.map((s) async {
      try {
        _cache[s.retailerId] = await s.fetchActiveCoupons();
      } catch (_) {
        _cache[s.retailerId] = const [];
      }
    }));
    _cachedAt = DateTime.now();
  }

  Future<List<Coupon>> couponsFor(String retailerId) async {
    if (_cachedAt == null || DateTime.now().difference(_cachedAt!) > _cacheTtl) {
      await refresh();
    }
    return _cache[retailerId] ?? const [];
  }

  /// Wählt den Coupon mit dem höchsten effektiven Rabatt für einen Subtotal.
  Future<Coupon?> bestCouponFor({
    required String retailerId,
    String? productId,
    required double subtotal,
  }) async {
    final coupons = await couponsFor(retailerId);
    Coupon? best;
    double bestDiscount = 0;
    for (final c in coupons) {
      if (!c.appliesTo(retailerId: retailerId, productId: productId)) continue;
      final d = c.discountFor(subtotal);
      if (d > bestDiscount) {
        best = c;
        bestDiscount = d;
      }
    }
    return best;
  }
}
