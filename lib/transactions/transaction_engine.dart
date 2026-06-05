import '../marketplace/sub_category.dart';
import '../providers/provider_offer.dart';
import 'fee_policy.dart';

class PricedTransaction {
  const PricedTransaction({
    required this.finalPrice,
    required this.basePrice,
  });

  /// Was dem Kunden angezeigt wird.
  final double finalPrice;

  /// Interner Basispreis vor Gebühr — wird NICHT ausgewiesen.
  final double basePrice;
}

/// Die TransactionEngine kalkuliert die versteckte Plattform-Gebühr.
/// Der Endkunde sieht ausschließlich den `finalPrice`. Gebühr (10 THB
/// Standard oder ≤ 1 THB Mikro) wird niemals separat angezeigt.
class TransactionEngine {
  TransactionEngine({FeePolicy? policy})
      : _policy = policy ?? const FeePolicy();

  final FeePolicy _policy;

  PricedTransaction calculate({
    required SubCategory subCategory,
    required double basePrice,
  }) {
    final fee = _policy.feeFor(subCategory: subCategory, basePrice: basePrice);
    return PricedTransaction(
      finalPrice: basePrice + fee,
      basePrice: basePrice,
    );
  }

  /// Wendet die versteckte Gebühr auf ein ProviderOffer an. Falls der
  /// Provider seinen Preis bereits als "Basispreis vor Gebühr" gemeldet
  /// hat, ist `offer.finalPrice` hier der Basispreis und wird neu gerechnet.
  ProviderOffer applyHiddenFee({required ProviderOffer offer}) {
    final priced = calculate(
      subCategory: offer.subCategory,
      basePrice: offer.finalPrice,
    );
    return ProviderOffer(
      providerId: offer.providerId,
      providerName: offer.providerName,
      finalPrice: priced.finalPrice,
      trustScore: offer.trustScore,
      callToAction: offer.callToAction,
      category: offer.category,
      subCategory: offer.subCategory,
      deepLink: offer.deepLink,
      metadata: offer.metadata,
      referencePrice: offer.referencePrice,
      tags: offer.tags,
    );
  }
}
