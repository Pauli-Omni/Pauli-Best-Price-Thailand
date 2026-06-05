import '../../models/cart_item.dart';
import '../../models/cart_offer.dart';
import '../../models/pickup_location.dart';
import '../../models/product.dart';
import '../coupons/coupon_aggregator.dart';
import '../delivery/delivery_cost_calculator.dart';
import '../price_scraper.dart';

/// Gesamt-Warenkorb-Optimierer.
///
/// Wirft die komplette Einkaufsliste virtuell in jeden Shop, zieht
/// automatische Coupons ab, addiert die Lieferkosten zur gewählten
/// 7-Eleven-Station (oder nach Hause) und sortiert die Anbieter nach
/// Endpreis. Der erste Eintrag der Rückgabe ist der billigste Komplett-Shop.
class CartOptimizer {
  CartOptimizer({
    required List<PriceScraper> scrapers,
    required CouponAggregator coupons,
    required DeliveryCostCalculator delivery,
  })  : _scrapers = scrapers,
        _coupons = coupons,
        _delivery = delivery;

  final List<PriceScraper> _scrapers;
  final CouponAggregator _coupons;
  final DeliveryCostCalculator _delivery;

  Future<List<CartOffer>> optimize({
    required List<CartItem> cart,
    PickupLocation? pickup,
    String? destinationPostalCode,
  }) async {
    final offers = await Future.wait(
      _scrapers.map((s) => _buildOfferFor(s, cart, pickup, destinationPostalCode)),
    );

    offers.sort((a, b) {
      if (a.isComplete != b.isComplete) return a.isComplete ? -1 : 1;
      return a.total.compareTo(b.total);
    });
    return offers;
  }

  Future<CartOffer> _buildOfferFor(
    PriceScraper scraper,
    List<CartItem> cart,
    PickupLocation? pickup,
    String? destinationPostalCode,
  ) async {
    final offerItems = <CartOfferItem>[];
    final missing = <String>[];

    for (final item in cart) {
      final hits = await scraper.search(item.query);
      final Product? match = _pickBestMatch(hits, item);
      if (match == null) {
        missing.add(item.query);
        continue;
      }
      offerItems.add(CartOfferItem(product: match, quantity: item.quantity));
    }

    final subtotal = offerItems.fold<double>(0, (s, it) => s + it.lineTotal);

    final coupon = await _coupons.bestCouponFor(
      retailerId: scraper.retailerId,
      productId: null,
      subtotal: subtotal,
    );
    final couponDiscount = coupon?.discountFor(subtotal) ?? 0;

    final fee = await _delivery.estimate(
      retailerId: scraper.retailerId,
      basketSubtotal: subtotal - couponDiscount,
      itemCount: offerItems.fold(0, (s, it) => s + it.quantity),
      pickup: pickup,
      destinationPostalCode: destinationPostalCode,
    );

    return CartOffer(
      retailerId: scraper.retailerId,
      retailerName: scraper.retailerName,
      items: offerItems,
      subtotal: subtotal,
      couponDiscount: couponDiscount,
      deliveryFee: fee,
      pickupLocationId: pickup?.id,
      missingQueries: missing,
    );
  }

  Product? _pickBestMatch(List<Product> hits, CartItem item) {
    if (hits.isEmpty) return null;
    if (item.preferredProductId != null) {
      for (final p in hits) {
        if (p.id == item.preferredProductId) return p;
      }
    }
    final priced = hits.where((p) => p.price > 0).toList()
      ..sort((a, b) => a.price.compareTo(b.price));
    return priced.isNotEmpty ? priced.first : hits.first;
  }
}
