import '../marketplace/sub_category.dart';
import 'provider_offer.dart';

class ProviderQuery {
  ProviderQuery({
    required this.subCategory,
    this.searchTerm,
    this.postalCode,
    this.maxResults = 20,
    this.params = const {},
  });

  final SubCategory subCategory;
  final String? searchTerm;
  final String? postalCode;
  final int maxResults;
  final Map<String, Object?> params;
}

/// Universelle Schnittstelle für jeden Partner, unabhängig davon, ob er
/// Versicherungen, Bustickets oder Lebensmittel anbietet. Liefert ProviderOffer
/// mit den vier Pflichtfeldern: Name, finaler Preis, Trust-Score, CTA.
abstract class ProviderInterface {
  String get providerId;
  String get providerName;
  Set<String> get supportedSubCategoryIds;

  Future<List<ProviderOffer>> quote(ProviderQuery query);
}
