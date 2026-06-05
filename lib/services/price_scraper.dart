import '../models/product.dart';

/// Gemeinsame Schnittstelle für thailändische Retail-Preis-Scraper.
/// Konkrete Implementierungen binden später die jeweilige Shop-API an.
abstract class PriceScraper {
  String get retailerId;

  String get retailerName;

  /// Produktsuche nach Stichwort (Thai oder Englisch).
  Future<List<Product>> search(String keyword);
}
