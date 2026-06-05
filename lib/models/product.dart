class Product {
  final String id;
  final String name;
  final String imageUrl;
  final double price;
  final String productUrl;

  /// Vom CouponEngine berechneter Rabattbetrag (THB), 0 wenn kein Coupon greift.
  final double discountValue;

  /// Code des angewendeten Coupons, falls vorhanden.
  final String? appliedCouponCode;

  Product({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.price,
    required this.productUrl,
    this.discountValue = 0,
    this.appliedCouponCode,
  });

  /// Was der Kunde tatsächlich zahlt (price - discountValue, nie < 0).
  double get finalPrice =>
      (price - discountValue).clamp(0, double.infinity).toDouble();

  Product copyWith({
    double? discountValue,
    String? appliedCouponCode,
  }) =>
      Product(
        id: id,
        name: name,
        imageUrl: imageUrl,
        price: price,
        productUrl: productUrl,
        discountValue: discountValue ?? this.discountValue,
        appliedCouponCode: appliedCouponCode ?? this.appliedCouponCode,
      );

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unbekanntes Produkt',
      imageUrl: json['imageUrl']?.toString() ?? '',
      productUrl: json['productUrl']?.toString() ?? '',
      price: () {
        try {
          if (json['price'] == null) return 0.0;
          // Filtert alle thailändischen Währungszeichen oder Texte heraus
          final cleanPrice = json['price'].toString().replaceAll(RegExp(r'[^0-9.]'), '');
          return double.parse(cleanPrice);
        } catch (_) {
          return 0.0; // Verhindert den Absturz bei Fehlern!
        }
      }(),
    );
  }
}
