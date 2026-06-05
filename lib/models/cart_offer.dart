import 'product.dart';

/// Eine Position in einem konkreten Shop-Angebot mit Stückzahl.
class CartOfferItem {
  CartOfferItem({required this.product, required this.quantity});

  final Product product;
  final int quantity;

  double get lineTotal => product.price * quantity;
}

/// Aggregiertes Angebot für die komplette Einkaufsliste in EINEM Shop.
/// Vom CartOptimizer pro Anbieter erzeugt und nach Endpreis sortiert.
class CartOffer {
  CartOffer({
    required this.retailerId,
    required this.retailerName,
    required this.items,
    required this.subtotal,
    required this.couponDiscount,
    required this.deliveryFee,
    this.pickupLocationId,
    this.missingQueries = const <String>[],
  });

  final String retailerId;
  final String retailerName;
  final List<CartOfferItem> items;
  final double subtotal;
  final double couponDiscount;
  final double deliveryFee;
  final String? pickupLocationId;

  /// Begriffe aus der Einkaufsliste, die der Shop nicht liefern konnte.
  final List<String> missingQueries;

  double get total => (subtotal - couponDiscount + deliveryFee).clamp(0, double.infinity).toDouble();
  bool get isComplete => missingQueries.isEmpty;
}
