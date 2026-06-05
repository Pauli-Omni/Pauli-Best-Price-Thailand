import '../models/product.dart';
import 'scrapers/lotus_price_scraper.dart';

class LotusService {
  LotusService({LotusPriceScraper? scraper}) : _scraper = scraper ?? LotusPriceScraper();

  final LotusPriceScraper _scraper;

  Future<List<Product>> fetchProducts(String keyword) => _scraper.search(keyword);
}
