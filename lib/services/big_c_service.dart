import '../models/product.dart';
import 'scrapers/big_c_price_scraper.dart';

class BigCService {
  BigCService({BigCPriceScraper? scraper}) : _scraper = scraper ?? BigCPriceScraper();

  final BigCPriceScraper _scraper;

  Future<List<Product>> fetchProducts(String keyword) => _scraper.search(keyword);
}
