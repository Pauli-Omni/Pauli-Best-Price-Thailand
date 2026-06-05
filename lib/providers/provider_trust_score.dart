/// Vertrauensindex eines Anbieters (0–100). Wird in **allen 13** Kategorien
/// einheitlich genutzt, damit Fake-Anbieter ausgefiltert werden.
class ProviderTrustScore {
  const ProviderTrustScore({
    required this.value,
    this.verifiedReviews = 0,
    this.complaintsLast90Days = 0,
    this.licenseVerified = false,
  });

  final double value;
  final int verifiedReviews;
  final int complaintsLast90Days;
  final bool licenseVerified;

  bool get isTrusted => value >= 70.0;
}
