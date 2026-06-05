import '../../../marketplace/service_category.dart';
import '../../call_to_action.dart';
import '../../provider_interface.dart';
import '../../provider_offer.dart';
import '../../provider_trust_score.dart';
import '../affiliate_provider.dart';
import 'involve_asia_api_client.dart';
import 'involve_asia_offer_dto.dart';

/// Affiliate-Anbindung an Involve Asia.
/// Zuständig für: Lebensmittel, Baumärkte, Elektronik, Gesundheit & Beauty.
class InvolveAsiaProvider extends AffiliateProvider {
  InvolveAsiaProvider({InvolveAsiaApiClient? client})
      : _client = client ?? HttpInvolveAsiaApiClient(),
        super(supportedCategories: const {
          ServiceCategory.groceries,
          ServiceCategory.hardware,
          ServiceCategory.electronics,
          ServiceCategory.healthBeauty,
        });

  final InvolveAsiaApiClient _client;

  @override
  String get providerId => 'affiliate_involveasia';

  @override
  String get providerName => 'Involve Asia';

  CallToAction _ctaFor(ServiceCategory c) {
    switch (c) {
      case ServiceCategory.healthBeauty:
        return CallToAction.buchen;
      case ServiceCategory.groceries:
      case ServiceCategory.hardware:
      case ServiceCategory.electronics:
        return CallToAction.kaufen;
      default:
        return CallToAction.kaufen;
    }
  }

  @override
  Future<List<ProviderOffer>> fetchOffers(ProviderQuery query) async {
    final raw = await _client.searchOffers(
      categorySlug: query.subCategory.id,
      keyword: query.searchTerm ?? query.subCategory.id,
      limit: query.maxResults,
      postalCode: query.postalCode,
    );
    return raw.map((dto) => _toOffer(dto, query)).toList();
  }

  ProviderOffer _toOffer(InvolveAsiaOfferDto dto, ProviderQuery query) {
    final cta = _ctaFor(query.subCategory.category);
    final trust = ProviderTrustScore(
      value: ((dto.rating ?? 0) / 5.0) * 100.0,
      verifiedReviews: 0,
      licenseVerified: true,
    );
    return ProviderOffer(
      providerId: 'involveasia_${dto.merchantId.isEmpty ? dto.skuId : dto.merchantId}',
      providerName: dto.merchantName,
      finalPrice: dto.priceThb,
      referencePrice: dto.originalPriceThb,
      trustScore: trust,
      callToAction: cta,
      category: query.subCategory.category,
      subCategory: query.subCategory,
      deepLink: dto.deeplink,
      metadata: {
        'affiliate': 'involve_asia',
        'brand': dto.brand,
        'image': dto.imageUrl,
        'localized_names': dto.localizedNames,
      },
    );
  }
}
