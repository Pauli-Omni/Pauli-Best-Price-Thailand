import '../../models/pickup_location.dart';
import '../../models/thai_postal_code.dart';

/// Klient für die offizielle CP All / 7-Eleven-API.
/// TODO: Endpoint-URL und Auth-Header eintragen, sobald der Partner-Vertrag
/// steht. Bis dahin liefert die Klasse leere Listen — die App bleibt
/// landesweit funktionsfähig, nur ohne reale Filialkoordinaten.
abstract class CpAllApiClient {
  Future<List<PickupLocation>> pickupsForPostalCode(ThaiPostalCode plz);
  Future<double?> shippingFee({
    required ThaiPostalCode plz,
    required double basketSubtotal,
    required int itemCount,
  });
}

class HttpCpAllApiClient implements CpAllApiClient {
  HttpCpAllApiClient({this.baseUrl = 'https://api.cpall.co.th/v1', this.apiKey});

  final String baseUrl;
  final String? apiKey;

  @override
  Future<List<PickupLocation>> pickupsForPostalCode(ThaiPostalCode plz) async {
    // TODO: GET $baseUrl/seven-eleven/stores?postcode=${plz.code}
    return const [];
  }

  @override
  Future<double?> shippingFee({
    required ThaiPostalCode plz,
    required double basketSubtotal,
    required int itemCount,
  }) async {
    // TODO: GET $baseUrl/delivery/quote?postcode=...
    return null;
  }
}
