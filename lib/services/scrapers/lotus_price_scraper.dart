import '../../models/product.dart';
import '../price_scraper.dart';

/// Preis-Scraper für Lotus's Thailand (lotuss.com).
/// TODO: Thai-Produkt-API / Search-Endpoint anbinden.
class LotusPriceScraper implements PriceScraper {
  @override
  String get retailerId => 'lotus';

  @override
  String get retailerName => "Lotus's";

  @override
  Future<List<Product>> search(String keyword) async {
    // Platzhalter — später: API-Response → Product.fromJson(...)
    return [];
  }
}
