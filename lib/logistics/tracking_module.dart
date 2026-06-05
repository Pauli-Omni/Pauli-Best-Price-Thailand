import '../marketplace/service_category.dart';
import '../services/alerts/push_notification_service.dart';
import 'seven_eleven_tracking_service.dart';
import 'shipment_status.dart';

/// Tracking-Modul für alle physischen Waren (Lebensmittel, Baumarkt,
/// Elektronik, Marketplace-Produkte). Verbindet 7-Eleven-Abholstatus mit
/// dem Push-Notification-Service.
class TrackingModule {
  TrackingModule({
    required SevenElevenTrackingService tracking,
    required PushNotificationService notifier,
  })  : _tracking = tracking,
        _notifier = notifier;

  final SevenElevenTrackingService _tracking;
  final PushNotificationService _notifier;

  bool supports(ServiceCategory c) => c.hasPhysicalLogistics;

  /// Holt den aktuellen Status zu einer Sendung und feuert bei
  /// Schlüssel-Stages (Abholbereit, Geliefert, Retoure) einen Push.
  Future<ShipmentUpdate?> poll({
    required String shipmentId,
    required String productName,
  }) async {
    final update = await _tracking.latestStatus(shipmentId);
    if (update == null) return null;
    if (update.stage.triggersCustomerPush) {
      await _notifier.notifyPriceDrop(
        productId: shipmentId,
        productName: productName,
        newPrice: 0,
        targetPrice: 0,
        retailerId: 'tracking_${update.stage.name}',
      );
    }
    return update;
  }
}
