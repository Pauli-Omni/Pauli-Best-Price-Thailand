import 'dart:convert';
import 'dart:io';

import '../../models/product.dart';
import '../price_scraper.dart';

class ShopeePriceScraper implements PriceScraper {
  @override
  String get retailerId => 'shopee';

  @override
  String get retailerName => 'Shopee';

  @override
  Future<List<Product>> search(String keyword) async {
    try {
      final uri = Uri.parse(
        'https://shopee.co.th/api/v4/search/search_items'
        '?keyword=${Uri.encodeQueryComponent(keyword)}',
      );

      final client = HttpClient();
      try {
        final request = await client.getUrl(uri);
        request.headers.set(HttpHeaders.acceptHeader, 'application/json');
        request.headers.set(
          HttpHeaders.userAgentHeader,
          'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
        );
        request.headers.set(HttpHeaders.refererHeader, 'https://shopee.co.th/');
        final response = await request.close();
        final body = await response.transform(utf8.decoder).join();

        if (response.statusCode != 200) {
          return [];
        }

        final decoded = jsonDecode(body);
        if (decoded is! Map<String, dynamic>) return [];

        final items = decoded['items'] as List<dynamic>? ?? [];
        return items
            .whereType<Map<String, dynamic>>()
            .map((item) => Product.fromJson(_mapItem(item)))
            .toList();
      } finally {
        client.close(force: true);
      }
    } catch (e) {
      // ignore: avoid_print
      print('Shopee API Fehler abgefangen: $e');
      return [];
    }
  }

  Map<String, dynamic> _mapItem(Map<String, dynamic> item) {
    final basic = item['item_basic'] as Map<String, dynamic>? ?? item;
    final shopId = basic['shopid'] ?? basic['shop_id'];
    final itemId = basic['itemid'] ?? basic['item_id'];
    final image = basic['image']?.toString() ?? '';
    return {
      'id': itemId?.toString() ?? '',
      'name': basic['name']?.toString() ?? 'Unbekanntes Produkt',
      'imageUrl': _imageUrl(image),
      'productUrl': shopId != null && itemId != null
          ? 'https://shopee.co.th/product/$shopId/$itemId'
          : '',
      'price': _normalizeShopeePrice(basic['price_min'] ?? basic['price'] ?? 0),
    };
  }

  double _normalizeShopeePrice(Object raw) {
    final n = raw is num
        ? raw.toDouble()
        : double.tryParse(raw.toString().replaceAll(RegExp(r'[^0-9.]'), '')) ??
            0;
    if (n <= 0) return 0;
    return n >= 100000 ? n / 100000 : n;
  }

  String _imageUrl(String image) {
    if (image.isEmpty) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    return 'https://cf.shopee.co.th/file/$image';
  }
}
