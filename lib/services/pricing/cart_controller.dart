import '../../models/cart_item.dart';
import '../../models/cart_offer.dart';
import '../../models/pickup_location.dart';
import '../../models/thai_postal_code.dart';
import '../delivery/seven_eleven_pickup_service.dart';
import 'cart_optimizer.dart';

/// Top-Level-Controller für die landesweite Warenkorb-Optimierung.
/// Gleicht jede thailändische Postleitzahl gegen CP-All / 7-Eleven ab —
/// **ohne regionale Sperren**.
class CartController {
  CartController({
    required CartOptimizer optimizer,
    required SevenElevenPickupService pickupService,
  })  : _optimizer = optimizer,
        _pickupService = pickupService;

  final CartOptimizer _optimizer;
  final SevenElevenPickupService _pickupService;

  /// Liefert die nach Endpreis sortierten Komplett-Angebote pro Anbieter.
  /// Position 0 = günstigster Shop für den gesamten Einkauf.
  Future<List<CartOffer>> bestOffersForPostalCode({
    required List<CartItem> cart,
    required String destinationPostalCode,
    PickupLocation? preferredPickup,
  }) async {
    // PLZ-Validierung — wirft sofort bei ungültiger Eingabe.
    final plz = ThaiPostalCode(destinationPostalCode);

    final pickup = preferredPickup ?? await _firstPickupNear(plz);
    return _optimizer.optimize(
      cart: cart,
      pickup: pickup,
      destinationPostalCode: plz.code,
    );
  }

  Future<List<PickupLocation>> availablePickupsForPostalCode(String plz) {
    return _pickupService.forPostalCode(plz);
  }

  Future<PickupLocation?> _firstPickupNear(ThaiPostalCode plz) async {
    final pickups = await _pickupService.forPostalCode(plz.code);
    return pickups.isEmpty ? null : pickups.first;
  }
}
