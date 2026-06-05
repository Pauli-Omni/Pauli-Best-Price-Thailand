import 'review_signal.dart';
import 'review_text.dart';

class ReviewNlpReport {
  ReviewNlpReport({
    required this.total,
    required this.confirmedDelivery,
    required this.scamHits,
    required this.scamTerms,
  });

  final int total;
  final int confirmedDelivery;
  final int scamHits;
  final Set<String> scamTerms;

  double get confirmedRate => total == 0 ? 0 : confirmedDelivery / total;
  double get scamRate => total == 0 ? 0 : scamHits / total;
}

/// Vertrag für einen NLP-Analysierer. Liefert pro Rezension ein Signal und
/// aggregiert die ganze Rezensionsliste zu einem Report. Tauschbar gegen
/// eine echte ML-Pipeline (z. B. Google Cloud NL oder eigenes Modell).
abstract class ReviewNlpAnalyzer {
  ReviewSignal classify(ReviewText review);
  ReviewNlpReport aggregate(Iterable<ReviewText> reviews);
}

/// Default: Keyword-basierter Analyzer für Thai, Englisch und Deutsch.
/// Erkennt sowohl Lieferbestätigungen ("erhalten", "ได้รับสินค้า") als auch
/// Scam-Marker ("Fake", "Betrug", "nicht geliefert", "Lockvogel", "Scam",
/// "หลอกลวง", "ของไม่ส่ง", "ปลอม").
class KeywordReviewNlpAnalyzer implements ReviewNlpAnalyzer {
  const KeywordReviewNlpAnalyzer({
    this.scamTerms = const {
      // Deutsch
      'fake', 'betrug', 'betrueger', 'nicht geliefert', 'lockvogel', 'scam',
      'abzocke', 'lockangebot', 'kam nie an',
      // English
      'fraud', 'never arrived', 'never delivered', 'bait', 'fake item',
      // Thai (transliteriert/Unicode)
      'หลอกลวง', 'ของไม่ส่ง', 'ปลอม', 'โกง', 'หลอก',
    },
    this.deliveryConfirmationTerms = const {
      'erhalten', 'geliefert', 'kam an', 'einwandfrei', 'perfekt', 'qualität ok',
      'received', 'delivered', 'arrived', 'as described', 'genuine', 'authentic',
      'ได้รับสินค้า', 'ส่งเร็ว', 'ของแท้', 'สินค้าตรงปก',
    },
  });

  final Set<String> scamTerms;
  final Set<String> deliveryConfirmationTerms;

  static String _normalize(String s) =>
      s.toLowerCase().replaceAll(RegExp(r'\s+'), ' ').trim();

  bool _containsAny(String haystack, Set<String> needles) {
    for (final n in needles) {
      if (haystack.contains(n.toLowerCase())) return true;
    }
    return false;
  }

  Set<String> _matches(String haystack, Set<String> needles) =>
      needles.where((n) => haystack.contains(n.toLowerCase())).toSet();

  @override
  ReviewSignal classify(ReviewText review) {
    final t = _normalize(review.text);
    if (t.isEmpty) return ReviewSignal.neutral;
    final scam = _containsAny(t, scamTerms);
    final delivered = _containsAny(t, deliveryConfirmationTerms);

    if (scam && !delivered) return ReviewSignal.scamSignal;
    if (delivered && !scam) return ReviewSignal.promoConfirmed;
    if (delivered && scam) {
      // Widerspruch: schaut auf Sterne und Verified-Purchase.
      if (review.verifiedPurchase && (review.rating ?? 0) >= 4) {
        return ReviewSignal.promoConfirmed;
      }
      return ReviewSignal.scamSignal;
    }
    return ReviewSignal.neutral;
  }

  @override
  ReviewNlpReport aggregate(Iterable<ReviewText> reviews) {
    final all = reviews.toList();
    var confirmed = 0;
    var scam = 0;
    final hitTerms = <String>{};
    for (final r in all) {
      final signal = classify(r);
      if (signal == ReviewSignal.promoConfirmed) confirmed++;
      if (signal == ReviewSignal.scamSignal) {
        scam++;
        hitTerms.addAll(_matches(_normalize(r.text), scamTerms));
      }
    }
    return ReviewNlpReport(
      total: all.length,
      confirmedDelivery: confirmed,
      scamHits: scam,
      scamTerms: hitTerms,
    );
  }
}
