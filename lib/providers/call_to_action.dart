/// Aktionstyp, mit dem ein ProviderOffer in der UI dargestellt wird.
enum CallToAction {
  buchen,
  kaufen,
  anfragen;

  String get labelDe => switch (this) {
        CallToAction.buchen => 'Buchen',
        CallToAction.kaufen => 'Kaufen',
        CallToAction.anfragen => 'Anfragen',
      };
}
