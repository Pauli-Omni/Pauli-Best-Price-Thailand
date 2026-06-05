import '../models/product.dart';
import 'scrapers/shopee_price_scraper.dart';

class ShopeeService {
  ShopeeService({ShopeePriceScraper? scraper}) : _scraper = scraper ?? ShopeePriceScraper();

  final ShopeePriceScraper _scraper;

  Future<List<Product>> fetchProducts(String keyword) => _scraper.search(keyword);
}
