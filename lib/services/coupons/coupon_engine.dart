import '../../models/product.dart';
import 'coupon_aggregator.dart';

/// Zentrale Engine, die jedem Produkt sofort den finalPrice
/// (price − discountValue) anhaftet. Die Sicht des Kunden ist damit immer
/// der bereits rabattierte Endpreis — Code-Kopieren entfällt.
class CouponEngine {
  CouponEngine(this._aggregator);

  final CouponAggregator _aggregator;

  /// Wendet automatisch den besten Coupon je Anbieter an.
  Future<Product> applyTo({
    required Product product,
    required String retailerId,
  }) async {
    final coupon = await _aggregator.bestCouponFor(
      retailerId: retailerId,
      productId: product.id,
      subtotal: product.price,
    );
    if (coupon == null) return product;
    final discount = coupon.discountFor(product.price);
    if (discount <= 0) return product;
    return product.copyWith(
      discountValue: discount,
      appliedCouponCode: coupon.code,
    );
  }

  Future<List<Product>> applyToAll({
    required List<Product> products,
    required String retailerId,
  }) {
    return Future.wait(
      products.map((p) => applyTo(product: p, retailerId: retailerId)),
    );
  }
}
