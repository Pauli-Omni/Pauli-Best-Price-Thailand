import '../models/product.dart';
import 'scrapers/seven_eleven_price_scraper.dart';

class SevenElevenService {
  SevenElevenService({SevenElevenPriceScraper? scraper})
      : _scraper = scraper ?? SevenElevenPriceScraper();

  final SevenElevenPriceScraper _scraper;

  Future<List<Product>> fetchProducts(String keyword) => _scraper.search(keyword);
}
