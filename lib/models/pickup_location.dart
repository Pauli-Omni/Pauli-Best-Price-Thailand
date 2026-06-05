/// 7-Eleven-Abholstation (oder anderer Pickup-Point) für die Lieferkosten-
/// kalkulation in der Warenkorb-Optimierung.
class PickupLocation {
  PickupLocation({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.address,
    this.provider = 'seven_eleven',
  });

  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final String? address;
  final String provider;
}
