import '../../models/pickup_location.dart';
import '../../models/thai_postal_code.dart';
import 'cp_all_api_client.dart';

/// Liefert 7-Eleven-Abholstationen **landesweit** — entweder per
/// Geokoordinaten (Google Places, TODO) oder per thailändischer PLZ
/// über die CP-All-API. Keine regionalen Filter.
class SevenElevenPickupService {
  SevenElevenPickupService({CpAllApiClient? cpAll})
      : _cpAll = cpAll ?? HttpCpAllApiClient();

  final CpAllApiClient _cpAll;

  Future<List<PickupLocation>> nearby({
    required double latitude,
    required double longitude,
    double radiusMeters = 2000,
  }) async {
    // TODO: Google-Maps-Places-API anbinden (Suche nach "7-Eleven" + Geocoding).
    return const [];
  }

  /// Nationale Abdeckung: liefert die offiziellen 7-Eleven-Stores zu jeder
  /// thailändischen PLZ — ohne regionale Sperre.
  Future<List<PickupLocation>> forPostalCode(String postalCode) {
    return _cpAll.pickupsForPostalCode(ThaiPostalCode(postalCode));
  }
}
