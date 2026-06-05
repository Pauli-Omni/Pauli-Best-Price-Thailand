/// Rohstruktur einer Antwort des AccessTrade-Endpoints — wird vom
/// `AccessTradeProvider` in ein `ProviderOffer` übersetzt.
class AccessTradeOfferDto {
  AccessTradeOfferDto({
    required this.id,
    required this.merchantName,
    required this.basePriceThb,
    required this.trackingUrl,
    this.referencePriceThb,
    this.rating,
    this.localizedNames = const {},
    this.merchantId = '',
    this.campaign = '',
    this.thumbnailUrl,
  });

  final String id;
  final String merchantId;
  final String merchantName;
  final double basePriceThb;
  final double? referencePriceThb;
  final String trackingUrl;
  final double? rating;
  final String campaign;
  final String? thumbnailUrl;

  /// Optional vom Affiliate gelieferte Übersetzungen: { 'en': 'Insurance ...', 'th': 'ประกัน...' }.
  final Map<String, String> localizedNames;

  factory AccessTradeOfferDto.fromJson(Map<String, dynamic> json) {
    final loc = (json['localized_names'] as Map?)?.cast<String, dynamic>() ?? {};
    return AccessTradeOfferDto(
      id: json['id'].toString(),
      merchantId: json['merchant_id']?.toString() ?? '',
      merchantName: json['merchant_name']?.toString() ?? 'AccessTrade Partner',
      basePriceThb: (json['price'] as num?)?.toDouble() ?? 0,
      referencePriceThb: (json['msrp'] as num?)?.toDouble(),
      trackingUrl: json['tracking_url']?.toString() ?? '',
      rating: (json['rating'] as num?)?.toDouble(),
      campaign: json['campaign']?.toString() ?? '',
      thumbnailUrl: json['thumbnail_url']?.toString(),
      localizedNames: loc.map((k, v) => MapEntry(k, v.toString())),
    );
  }
}
