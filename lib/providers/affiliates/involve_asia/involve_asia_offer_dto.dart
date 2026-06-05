/// Rohstruktur einer Antwort der Involve-Asia-DataFeed-API.
class InvolveAsiaOfferDto {
  InvolveAsiaOfferDto({
    required this.skuId,
    required this.merchantName,
    required this.priceThb,
    required this.deeplink,
    this.merchantId = '',
    this.originalPriceThb,
    this.rating,
    this.localizedNames = const {},
    this.imageUrl,
    this.brand,
  });

  final String skuId;
  final String merchantId;
  final String merchantName;
  final double priceThb;
  final double? originalPriceThb;
  final double? rating;
  final String deeplink;
  final String? imageUrl;
  final String? brand;

  /// Optional vom Affiliate gelieferte Übersetzungen pro Sprachcode.
  final Map<String, String> localizedNames;

  factory InvolveAsiaOfferDto.fromJson(Map<String, dynamic> json) {
    final loc = (json['localized_names'] as Map?)?.cast<String, dynamic>() ?? {};
    return InvolveAsiaOfferDto(
      skuId: json['sku_id']?.toString() ?? json['offer_id'].toString(),
      merchantId: json['merchant_id']?.toString() ?? '',
      merchantName: json['merchant_name']?.toString() ?? 'Involve Asia Partner',
      priceThb: (json['price'] as num?)?.toDouble() ?? 0,
      originalPriceThb: (json['original_price'] as num?)?.toDouble(),
      deeplink: json['deeplink']?.toString() ?? '',
      rating: (json['rating'] as num?)?.toDouble(),
      imageUrl: json['image_url']?.toString(),
      brand: json['brand']?.toString(),
      localizedNames: loc.map((k, v) => MapEntry(k, v.toString())),
    );
  }
}
