import '../marketplace/service_category.dart';
import '../marketplace/sub_category.dart';
import '../providers/call_to_action.dart';
import '../providers/provider_offer.dart';
import 'i18n_keys.dart';
import 'i18n_service.dart';

/// Lokalisiert Kategorie-/Unterkategorie- und Offer-Felder ohne Hardcoding.
extension MarketplaceI18n on I18nService {
  String labelForCategory(ServiceCategory c) => t(I18nKeys.category(c.id));

  String labelForSubCategory(SubCategory s) => t(I18nKeys.subCategory(s.id));

  String labelForCta(CallToAction cta) => switch (cta) {
        CallToAction.buchen => t(I18nKeys.ctaBuchen),
        CallToAction.kaufen => t(I18nKeys.ctaKaufen),
        CallToAction.anfragen => t(I18nKeys.ctaAnfragen),
      };

  /// Holt aus dem ProviderOffer den Anbieternamen in der aktuellen Sprache.
  /// Affiliate-DTOs liefern unter `metadata['localized_names']`
  /// optional `{ 'th': '...', 'en': '...' }`. Fehlt der Eintrag, wird die
  /// Fallback-Kette via I18nService verwendet.
  String localizedProviderName(ProviderOffer offer) {
    final raw = offer.metadata['localized_names'];
    if (raw is Map) {
      final loc = raw.map((k, v) => MapEntry(k.toString(), v.toString()));
      final value = resolveFromMap(loc, rawFallback: offer.providerName);
      if (value.isNotEmpty) return value;
    }
    return offer.providerName;
  }
}
