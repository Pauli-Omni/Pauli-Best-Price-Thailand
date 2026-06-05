/// Eine einzelne Nutzer-Rezension, die durch den NLP-Filter geschickt wird.
class ReviewText {
  ReviewText({
    required this.text,
    this.language = 'th',
    this.verifiedPurchase = false,
    this.rating,
    this.authorCountry = 'TH',
    this.submittedAt,
  });

  final String text;
  final String language;
  final bool verifiedPurchase;
  final double? rating;
  final String authorCountry;
  final DateTime? submittedAt;
}
