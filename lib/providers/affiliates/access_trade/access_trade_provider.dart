import '../../../marketplace/service_category.dart';
import '../../call_to_action.dart';
import '../../provider_interface.dart';
import '../../provider_offer.dart';
import '../../provider_trust_score.dart';
import '../affiliate_provider.dart';
import 'access_trade_api_client.dart';
import 'access_trade_offer_dto.dart';

/// Affiliate-Anbindung an AccessTrade.
/// Zuständig für: Finanzierungen, Versicherungen, Telekommunikation,
/// Auto-Services, Elektronik.
class AccessTradeProvider extends AffiliateProvider {
  AccessTradeProvider({AccessTradeApiClient? client})
      : _client = client ?? HttpAccessTradeApiClient(),
        super(supportedCategories: const {
          ServiceCategory.financing,
          ServiceCategory.insurance,
          ServiceCategory.telecom,
          ServiceCategory.autoServices,
          ServiceCategory.electronics,
        });

  final AccessTradeApiClient _client;

  @override
  String get providerId => 'affiliate_accesstrade';

  @override
  String get providerName => 'AccessTrade';

  CallToAction _ctaFor(ServiceCategory c) {
    switch (c) {
      case ServiceCategory.financing:
      case ServiceCategory.insurance:
      case ServiceCategory.telecom:
        return CallToAction.anfragen;
      case ServiceCategory.autoServices:
        return CallToAction.buchen;
      case ServiceCategory.electronics:
        return CallToAction.kaufen;
      default:
        return CallToAction.anfragen;
    }
  }

  @override
  Future<List<ProviderOffer>> fetchOffers(ProviderQuery query) async {
    final raw = await _client.searchOffers(
      campaignCategory: query.subCategory.id,
      keyword: query.searchTerm ?? query.subCategory.id,
      limit: query.maxResults,
      postalCode: query.postalCode,
    );
    return raw.map((dto) => _toOffer(dto, query)).toList();
  }

  ProviderOffer _toOffer(AccessTradeOfferDto dto, ProviderQuery query) {
    final cta = _ctaFor(query.subCategory.category);
    final trust = ProviderTrustScore(
      value: ((dto.rating ?? 0) / 5.0) * 100.0,
      verifiedReviews: 0,
      licenseVerified: true,
    );
    return ProviderOffer(
      providerId: 'accesstrade_${dto.merchantId.isEmpty ? dto.id : dto.merchantId}',
      providerName: dto.merchantName,
      finalPrice: dto.basePriceThb,
      referencePrice: dto.referencePriceThb,
      trustScore: trust,
      callToAction: cta,
      category: query.subCategory.category,
      subCategory: query.subCategory,
      deepLink: dto.trackingUrl,
      metadata: {
        'affiliate': 'accesstrade',
        'campaign': dto.campaign,
        'thumbnail': dto.thumbnailUrl,
        'localized_names': dto.localizedNames,
      },
    );
  }
}
