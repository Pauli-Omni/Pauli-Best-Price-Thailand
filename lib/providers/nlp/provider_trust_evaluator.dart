import '../provider_offer.dart';
import '../scam_blocklist.dart';
import 'review_nlp_analyzer.dart';
import 'review_text.dart';

/// Was der Evaluator für ein Angebot entscheidet.
enum TrustVerdictType {
  allow,
  allowAsPromo,
  block,
  permanentBan,
}

class TrustVerdict {
  TrustVerdict({
    required this.type,
    required this.offer,
    required this.report,
    this.reason = '',
  });

  final TrustVerdictType type;
  final ProviderOffer offer;
  final ReviewNlpReport report;
  final String reason;
}

/// NLP-basierter Trust-Evaluator. Wird in ALLEN 13 Kategorien verwendet.
///
/// Regeln:
///  - **Echte Promos** (extreme Rabatte, branchenfremde Lockangebote) bleiben
///    drin und werden mit Tag `Promo` markiert, wenn die NLP-Analyse
///    bestätigt, dass die Ware physisch & einwandfrei geliefert wurde.
///  - **Scam-Signale** (Fake, Betrug, nicht geliefert, Lockvogel, Scam, …)
///    führen sofort zum **permanenten Ban** des Anbieters in der
///    ScamBlocklist; das Angebot wird aus der Datenbank gelöscht.
class ProviderTrustEvaluator {
  ProviderTrustEvaluator({
    required ReviewNlpAnalyzer analyzer,
    required ScamBlocklist blocklist,
    this.scamRateThreshold = 0.25,
    this.minScamHits = 3,
    this.confirmedRateForPromo = 0.6,
    this.extremeDiscountPercent = 80.0,
    this.extremeAbsolutePriceThb = 5.0,
    this.crossIndustryAllowed = true,
  })  : _analyzer = analyzer,
        _blocklist = blocklist;

  final ReviewNlpAnalyzer _analyzer;
  final ScamBlocklist _blocklist;

  /// Ab welchem Anteil scam-positiver Rezensionen permanent gesperrt wird.
  final double scamRateThreshold;

  /// Minimale Treffer-Anzahl, ab der die Sperre greift (Schutz vor
  /// 1-zu-1-Trollen).
  final int minScamHits;

  /// Anteil verifizierter Lieferbestätigungen, damit ein extremer Rabatt
  /// als "Promo" zugelassen wird.
  final double confirmedRateForPromo;

  /// Ab dieser Rabattquote (gegenüber `referencePrice`) gilt es als
  /// extremer Rabatt.
  final double extremeDiscountPercent;

  /// Alternativ: Absoluter Preis (z. B. Wasser für 1 THB) gilt immer
  /// als extremer Rabatt.
  final double extremeAbsolutePriceThb;

  /// Branchenübergreifende Werbung (z. B. Autohaus verkauft Wasser) ist
  /// ausdrücklich erlaubt.
  final bool crossIndustryAllowed;

  /// Hauptmethode. Wertet ein Angebot inkl. Rezensionen aus und sperrt
  /// Scam-Anbieter dauerhaft.
  Future<TrustVerdict> evaluate({
    required ProviderOffer offer,
    required Iterable<ReviewText> reviews,
  }) async {
    if (offer.providerId.isNotEmpty &&
        await _blocklist.isBanned(offer.providerId)) {
      return TrustVerdict(
        type: TrustVerdictType.permanentBan,
        offer: offer,
        report: _analyzer.aggregate(const []),
        reason: 'Anbieter bereits dauerhaft gesperrt.',
      );
    }

    final report = _analyzer.aggregate(reviews);
    final extreme = _isExtremeDiscount(offer);

    if (report.scamHits >= minScamHits &&
        report.scamRate >= scamRateThreshold) {
      if (offer.providerId.isNotEmpty) {
        await _blocklist.ban(ScamBlocklistEntry(
          providerId: offer.providerId,
          reason:
              'NLP-Scam-Anteil ${(report.scamRate * 100).toStringAsFixed(1)}% '
              'in ${report.total} Rezensionen.',
          bannedAt: DateTime.now(),
          scamTerms: report.scamTerms,
        ));
      }
      return TrustVerdict(
        type: TrustVerdictType.permanentBan,
        offer: offer,
        report: report,
        reason: 'Scam-Signale dominieren — Anbieter dauerhaft gelöscht.',
      );
    }

    if (extreme) {
      if (report.total == 0 ||
          report.confirmedRate >= confirmedRateForPromo) {
        final tags = {...offer.tags, 'Promo'};
        if (crossIndustryAllowed) tags.add('Cross-Industry');
        return TrustVerdict(
          type: TrustVerdictType.allowAsPromo,
          offer: offer.copyWith(tags: tags),
          report: report,
          reason: 'Extreme Rabatt-Promo durch NLP bestätigt.',
        );
      }
      return TrustVerdict(
        type: TrustVerdictType.block,
        offer: offer,
        report: report,
        reason:
            'Extreme Rabatt-Promo ohne NLP-Lieferbestätigung — temporär ausgeblendet.',
      );
    }

    return TrustVerdict(
      type: TrustVerdictType.allow,
      offer: offer,
      report: report,
      reason: 'Standard-Angebot, NLP unauffällig.',
    );
  }

  bool _isExtremeDiscount(ProviderOffer offer) {
    if (offer.finalPrice > 0 && offer.finalPrice <= extremeAbsolutePriceThb) {
      return true;
    }
    final pct = offer.discountPercent;
    if (pct != null && pct >= extremeDiscountPercent) return true;
    return false;
  }
}
