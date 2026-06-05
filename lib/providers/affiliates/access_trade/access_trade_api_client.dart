import 'access_trade_offer_dto.dart';

/// Klient für die AccessTrade-Affiliate-API (Thailand).
/// TODO: `baseUrl`, `apiKey`, `publisherId` einsetzen, sobald die
/// Affiliate-Freischaltung erteilt wurde.
abstract class AccessTradeApiClient {
  Future<List<AccessTradeOfferDto>> searchOffers({
    required String campaignCategory,
    required String keyword,
    int limit = 20,
    String? postalCode,
  });
}

class HttpAccessTradeApiClient implements AccessTradeApiClient {
  HttpAccessTradeApiClient({
    this.baseUrl = 'https://api.accesstrade.in.th/v1',
    this.apiKey,
    this.publisherId,
  });

  final String baseUrl;
  final String? apiKey;
  final String? publisherId;

  @override
  Future<List<AccessTradeOfferDto>> searchOffers({
    required String campaignCategory,
    required String keyword,
    int limit = 20,
    String? postalCode,
  }) async {
    // TODO: GET $baseUrl/offers?campaign=$campaignCategory&q=$keyword
    //       headers: { 'Authorization': 'Bearer $apiKey', 'X-Publisher': $publisherId }
    return const [];
  }
}
