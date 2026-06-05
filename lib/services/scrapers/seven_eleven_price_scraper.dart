import '../../models/product.dart';
import '../price_scraper.dart';

/// Preis-Scraper für 7-Eleven Thailand (7eleven.co.th / 7Delivery).
/// TODO: Thai-Produkt-API / Search-Endpoint anbinden.
class SevenElevenPriceScraper implements PriceScraper {
  @override
  String get retailerId => 'seven_eleven';

  @override
  String get retailerName => '7-Eleven';

  @override
  Future<List<Product>> search(String keyword) async {
    // Platzhalter — später: API-Response → Product.fromJson(...)
    return [];
  }
}
