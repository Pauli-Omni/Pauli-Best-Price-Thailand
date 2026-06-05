import '../marketplace/service_category.dart';
import '../marketplace/sub_category.dart';
import 'call_to_action.dart';
import 'provider_trust_score.dart';

/// Standardisiertes Angebot eines Partners — identisch für alle 13
/// Hauptkategorien. Der `finalPrice` enthält bereits die versteckte
/// Plattform-Gebühr (siehe `TransactionEngine`).
class ProviderOffer {
  const ProviderOffer({
    required this.providerName,
    required this.finalPrice,
    required this.trustScore,
    required this.callToAction,
    required this.category,
    required this.subCategory,
    this.providerId = '',
    this.deepLink,
    this.metadata = const {},
    this.referencePrice,
    this.tags = const <String>{},
  });

  final String providerId;
  final String providerName;
  final double finalPrice;
  final ProviderTrustScore trustScore;
  final CallToAction callToAction;
  final ServiceCategory category;
  final SubCategory subCategory;
  final String? deepLink;
  final Map<String, Object?> metadata;

  /// Empfohlener Verkaufspreis (UVP) — wird vom NLP-/Trust-Evaluator
  /// genutzt, um extreme Rabatte zu erkennen und ggf. als "Promo" zu taggen.
  final double? referencePrice;

  /// Freie UI-Tags ("Promo", "Lockangebot", "Cross-Industry" …).
  final Set<String> tags;

  /// Ausgewiesener Rabatt in Prozent gegenüber `referencePrice`.
  double? get discountPercent {
    if (referencePrice == null || referencePrice! <= 0) return null;
    return ((referencePrice! - finalPrice) / referencePrice!) * 100;
  }

  ProviderOffer copyWith({
    double? finalPrice,
    Set<String>? tags,
  }) =>
      ProviderOffer(
        providerId: providerId,
        providerName: providerName,
        finalPrice: finalPrice ?? this.finalPrice,
        trustScore: trustScore,
        callToAction: callToAction,
        category: category,
        subCategory: subCategory,
        deepLink: deepLink,
        metadata: metadata,
        referencePrice: referencePrice,
        tags: tags ?? this.tags,
      );
}
