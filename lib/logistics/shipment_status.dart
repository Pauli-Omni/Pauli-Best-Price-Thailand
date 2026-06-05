/// Status-Modell für physische Waren-Lieferungen (Lebensmittel, Baumarkt,
/// Elektronik, Marketplace-Produkte wie Shopee/Lazada).
enum ShipmentStage {
  ordered,
  packed,
  inTransit,
  arrivedAtSevenEleven,
  pickedUp,
  deliveredHome,
  returnedToSender;

  String get labelDe => switch (this) {
        ShipmentStage.ordered => 'Bestellt',
        ShipmentStage.packed => 'Verpackt',
        ShipmentStage.inTransit => 'Unterwegs',
        ShipmentStage.arrivedAtSevenEleven => 'Im 7-Eleven zur Abholung',
        ShipmentStage.pickedUp => 'Abgeholt',
        ShipmentStage.deliveredHome => 'Nach Hause geliefert',
        ShipmentStage.returnedToSender => 'Retoure',
      };

  bool get triggersCustomerPush => switch (this) {
        ShipmentStage.arrivedAtSevenEleven ||
        ShipmentStage.deliveredHome ||
        ShipmentStage.returnedToSender =>
          true,
        _ => false,
      };
}

class ShipmentUpdate {
  ShipmentUpdate({
    required this.shipmentId,
    required this.stage,
    required this.occurredAt,
    this.sevenElevenStoreId,
    this.note,
  });

  final String shipmentId;
  final ShipmentStage stage;
  final DateTime occurredAt;
  final String? sevenElevenStoreId;
  final String? note;
}
