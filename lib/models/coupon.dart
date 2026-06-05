/// Rabatt-Code/Coupon, der im Hintergrund eingesammelt und automatisch
/// auf den Produktpreis angewendet wird.
class Coupon {
  Coupon({
    required this.code,
    required this.retailerId,
    required this.discountValue,
    required this.isPercentage,
    this.minBasketValue = 0,
    this.maxDiscount,
    this.productIds = const <String>{},
    this.validUntil,
  });

  final String code;
  final String retailerId;
  final double discountValue;
  final bool isPercentage;
  final double minBasketValue;
  final double? maxDiscount;
  final Set<String> productIds;
  final DateTime? validUntil;

  bool get isExpired =>
      validUntil != null && validUntil!.isBefore(DateTime.now());

  bool appliesTo({required String retailerId, required String? productId}) {
    if (this.retailerId != retailerId) return false;
    if (isExpired) return false;
    if (productIds.isEmpty) return true;
    return productId != null && productIds.contains(productId);
  }

  /// Berechnet den effektiven Rabatt für einen gegebenen Bruttobetrag.
  double discountFor(double subtotal) {
    if (subtotal < minBasketValue) return 0;
    final raw = isPercentage ? subtotal * (discountValue / 100.0) : discountValue;
    final capped = maxDiscount != null && raw > maxDiscount! ? maxDiscount! : raw;
    return capped.clamp(0, subtotal).toDouble();
  }
}
