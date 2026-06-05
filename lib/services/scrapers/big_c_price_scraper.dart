import '../../models/product.dart';
import '../price_scraper.dart';

/// Preis-Scraper für Big C Thailand (bigc.co.th).
/// TODO: Thai-Produkt-API / Search-Endpoint anbinden.
class BigCPriceScraper implements PriceScraper {
  @override
  String get retailerId => 'big_c';

  @override
  String get retailerName => 'Big C';

  @override
  Future<List<Product>> search(String keyword) async {
    // Platzhalter — später: API-Response → Product.fromJson(...)
    return [];
  }
}
