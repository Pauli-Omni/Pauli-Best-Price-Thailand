import '../services/delivery/cp_all_api_client.dart';
import 'shipment_status.dart';

/// Holt den aktuellen Abhol-Status einer 7-Eleven-Sendung.
/// TODO: An die CP-All-Tracking-API andocken, sobald API-Key vorliegt.
class SevenElevenTrackingService {
  SevenElevenTrackingService({CpAllApiClient? cpAll})
      : _cpAll = cpAll ?? HttpCpAllApiClient();

  // ignore: unused_field
  final CpAllApiClient _cpAll;

  Future<ShipmentUpdate?> latestStatus(String shipmentId) async {
    // TODO: GET /v1/seven-eleven/shipments/$shipmentId/status
    return null;
  }
}
