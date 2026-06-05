import '../../models/coupon.dart';
import '../../models/product.dart';
import '../coupons/coupon_aggregator.dart';

class IntegratedPrice {
  IntegratedPrice({
    required this.product,
    required this.retailerId,
    required this.grossPrice,
    required this.appliedCoupon,
    required this.discount,
  });

  final Product product;
  final String retailerId;
  final double grossPrice;
  final Coupon? appliedCoupon;
  final double discount;

  double get finalPrice =>
      (grossPrice - discount).clamp(0, double.infinity).toDouble();
}

/// Verbindet Produktpreise mit dem CouponAggregator, sodass dem Kunden
/// kein Code zum Kopieren angezeigt werden muss — der Endpreis ist
/// bereits rabattiert.
class PriceIntegrator {
  PriceIntegrator(this._coupons);

  final CouponAggregator _coupons;

  Future<IntegratedPrice> integrate({
    required Product product,
    required String retailerId,
  }) async {
    final coupon = await _coupons.bestCouponFor(
      retailerId: retailerId,
      productId: product.id,
      subtotal: product.price,
    );
    final discount = coupon?.discountFor(product.price) ?? 0;
    return IntegratedPrice(
      product: product,
      retailerId: retailerId,
      grossPrice: product.price,
      appliedCoupon: coupon,
      discount: discount,
    );
  }

  Future<List<IntegratedPrice>> integrateAll({
    required List<Product> products,
    required String retailerId,
  }) async {
    return Future.wait(
      products.map((p) => integrate(product: p, retailerId: retailerId)),
    );
  }
}
