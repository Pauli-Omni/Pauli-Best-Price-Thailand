import '../marketplace/service_category.dart';
import 'provider_offer.dart';

/// Filter, der in allen 13 Kategorien Fake-Anbieter aussortiert.
class ProviderTrustFilter {
  const ProviderTrustFilter({this.minScore = 70.0});

  final double minScore;

  bool passes(ProviderOffer offer) {
    if (!offer.trustScore.isTrusted) return false;
    if (offer.trustScore.value < minScore) return false;
    return true;
  }

  List<ProviderOffer> filter(Iterable<ProviderOffer> offers) =>
      offers.where(passes).toList();

  Map<ServiceCategory, List<ProviderOffer>> filterByCategory(
    Iterable<ProviderOffer> offers,
  ) {
    final result = <ServiceCategory, List<ProviderOffer>>{};
    for (final o in offers) {
      if (!passes(o)) continue;
      result.putIfAbsent(o.category, () => []).add(o);
    }
    return result;
  }
}
