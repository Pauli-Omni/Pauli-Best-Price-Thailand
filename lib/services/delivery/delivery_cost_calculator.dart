import '../../models/pickup_location.dart';
import '../../models/thai_postal_code.dart';
import 'cp_all_api_client.dart';

/// Schnittstelle für Lieferkosten-Berechnung je Anbieter.
/// Implementierungen können Pauschalen oder reale Tarif-APIs (Kerry/Flash/J&T)
/// nutzen — abhängig davon, ob nach Hause oder an eine 7-Eleven-Station
/// geliefert wird.
abstract class DeliveryCostCalculator {
  /// `pickup` ist null, wenn nach Hause geliefert wird.
  Future<double> estimate({
    required String retailerId,
    required double basketSubtotal,
    required int itemCount,
    PickupLocation? pickup,
    String? destinationPostalCode,
  });
}

/// Nationale Pauschal-Berechnung als Fallback, falls die Carrier-/CP-All-API
/// keine Antwort liefert. Tarife je Zone (1–4) gemäß `ThaiPostalCode.zone`,
/// keine regionalen Sperren.
class FlatRateDeliveryCalculator implements DeliveryCostCalculator {
  const FlatRateDeliveryCalculator({
    this.freeShippingThreshold = 500,
    this.homePickupFees = const {1: 25, 2: 35, 3: 45, 4: 65},
    this.homeDeliveryFees = const {1: 49, 2: 69, 3: 89, 4: 129},
  });

  final double freeShippingThreshold;
  final Map<int, double> homePickupFees;
  final Map<int, double> homeDeliveryFees;

  @override
  Future<double> estimate({
    required String retailerId,
    required double basketSubtotal,
    required int itemCount,
    PickupLocation? pickup,
    String? destinationPostalCode,
  }) async {
    if (basketSubtotal >= freeShippingThreshold) return 0;
    final zone = destinationPostalCode != null
        ? ThaiPostalCode(destinationPostalCode).zone
        : 1;
    final table = pickup != null ? homePickupFees : homeDeliveryFees;
    return table[zone] ?? table.values.last;
  }
}

/// Bevorzugt die Live-Lieferquote der CP-All-/7-Eleven-API und fällt nur
/// im Fehlerfall auf die nationale Pauschaltabelle zurück.
class NationalDeliveryCostCalculator implements DeliveryCostCalculator {
  NationalDeliveryCostCalculator({
    required CpAllApiClient cpAll,
    DeliveryCostCalculator? fallback,
  })  : _cpAll = cpAll,
        _fallback = fallback ?? const FlatRateDeliveryCalculator();

  final CpAllApiClient _cpAll;
  final DeliveryCostCalculator _fallback;

  @override
  Future<double> estimate({
    required String retailerId,
    required double basketSubtotal,
    required int itemCount,
    PickupLocation? pickup,
    String? destinationPostalCode,
  }) async {
    if (destinationPostalCode != null) {
      try {
        final quote = await _cpAll.shippingFee(
          plz: ThaiPostalCode(destinationPostalCode),
          basketSubtotal: basketSubtotal,
          itemCount: itemCount,
        );
        if (quote != null) return quote;
      } catch (_) {}
    }
    return _fallback.estimate(
      retailerId: retailerId,
      basketSubtotal: basketSubtotal,
      itemCount: itemCount,
      pickup: pickup,
      destinationPostalCode: destinationPostalCode,
    );
  }
}
