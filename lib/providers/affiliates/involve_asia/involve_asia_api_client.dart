import 'involve_asia_offer_dto.dart';

/// Klient für die Involve-Asia-Affiliate-API.
/// TODO: `baseUrl`, `apiKey`, `affiliateId` setzen, sobald die Freischaltung
/// vorliegt. Authentifizierung läuft i.d.R. via `POST /token` mit
/// API-Key → JWT, danach `Authorization: Bearer ...` im Header.
abstract class InvolveAsiaApiClient {
  Future<List<InvolveAsiaOfferDto>> searchOffers({
    required String categorySlug,
    required String keyword,
    int limit = 20,
    String? postalCode,
  });
}

class HttpInvolveAsiaApiClient implements InvolveAsiaApiClient {
  HttpInvolveAsiaApiClient({
    this.baseUrl = 'https://api.involve.asia/api',
    this.apiKey,
    this.affiliateId,
  });

  final String baseUrl;
  final String? apiKey;
  final String? affiliateId;

  @override
  Future<List<InvolveAsiaOfferDto>> searchOffers({
    required String categorySlug,
    required String keyword,
    int limit = 20,
    String? postalCode,
  }) async {
    // TODO: POST $baseUrl/datafeeds/search { category: $categorySlug, keyword: $keyword, limit }
    //       Authorization: Bearer $jwt
    return const [];
  }
}
