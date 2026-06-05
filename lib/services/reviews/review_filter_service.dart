import '../../models/merchant_review.dart';

class MerchantTrustScore {
  MerchantTrustScore({
    required this.merchantId,
    required this.verifiedTHReviewCount,
    required this.averageRating,
    required this.authenticMentions,
    required this.fastDeliveryMentions,
    required this.trustScore,
  });

  final String merchantId;
  final int verifiedTHReviewCount;
  final double averageRating;
  final int authenticMentions;
  final int fastDeliveryMentions;

  /// 0–100. >= [ReviewFilterService.passingScore] gilt als vertrauenswürdig.
  final double trustScore;
}

/// "Shopfluence"-Schutzfilter.
///
/// Filtert Roboter-/Fake-Bewertungen heraus und priorisiert verifizierte
/// Käufer aus Thailand mit Erwähnung von "Originalware" und "schneller
/// Lieferung". Der Endkunde kann anschließend einen einzigen Toggle setzen,
/// um nur noch vertrauenswürdige Händler zu sehen.
class ReviewFilterService {
  const ReviewFilterService({
    this.minAuthorReviews = 2,
    this.passingScore = 65,
  });

  /// Min. Anzahl bisheriger Bewertungen, damit ein Autor ernst genommen wird.
  final int minAuthorReviews;

  /// Schwelle, ab der ein Händler den Trust-Check besteht.
  final double passingScore;

  Iterable<MerchantReview> sanitize(Iterable<MerchantReview> reviews) {
    return reviews.where(_looksHuman);
  }

  bool _looksHuman(MerchantReview r) {
    if (!r.verifiedPurchase) return false;
    if (r.authorReviewCount < minAuthorReviews) return false;
    if (r.text.trim().length < 8) return false;
    return true;
  }

  MerchantTrustScore scoreMerchant(
    String merchantId,
    Iterable<MerchantReview> rawReviews,
  ) {
    final clean = sanitize(rawReviews).toList();
    final thReviews = clean.where((r) => r.authorCountry == 'TH').toList();

    final n = thReviews.length;
    final avg = n == 0
        ? 0.0
        : thReviews.map((r) => r.rating).reduce((a, b) => a + b) / n;
    final authentic = thReviews.where((r) => r.mentionsAuthentic).length;
    final fast = thReviews.where((r) => r.mentionsFastDelivery).length;

    final ratingScore = avg / 5.0 * 60.0;
    final authenticBonus = n == 0 ? 0.0 : (authentic / n) * 25.0;
    final fastBonus = n == 0 ? 0.0 : (fast / n) * 15.0;
    final score = (ratingScore + authenticBonus + fastBonus).clamp(0, 100).toDouble();

    return MerchantTrustScore(
      merchantId: merchantId,
      verifiedTHReviewCount: n,
      averageRating: avg,
      authenticMentions: authentic,
      fastDeliveryMentions: fast,
      trustScore: score,
    );
  }

  /// Stutzt eine Liste von Händler-IDs auf nur die vertrauenswürdigen.
  /// Wird im UI an den "Nur verifizierte Händler"-Toggle gehängt.
  List<String> trustedOnly(Map<String, List<MerchantReview>> reviewsByMerchant) {
    return reviewsByMerchant.entries
        .map((e) => scoreMerchant(e.key, e.value))
        .where((s) => s.trustScore >= passingScore)
        .map((s) => s.merchantId)
        .toList();
  }
}
