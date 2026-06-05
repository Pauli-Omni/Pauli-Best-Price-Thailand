import '../../models/product.dart';
import '../price_scraper.dart';
import 'barcode_scanner_service.dart';
import 'image_recognition_service.dart';

class InstantSearchResult {
  InstantSearchResult({required this.keyword, required this.products});
  final String keyword;
  final List<Product> products;
}

/// Verknüpft Kamera-Input (Barcode oder Foto) direkt mit der bestehenden
/// Preisvergleichs-Pipeline und liefert ohne Umwege Treffer aus allen
/// registrierten Shops.
class InstantSearchService {
  InstantSearchService({
    required List<PriceScraper> scrapers,
    BarcodeScannerService? barcodeScanner,
    ImageRecognitionService? imageRecognizer,
  })  : _scrapers = scrapers,
        _barcodeScanner = barcodeScanner,
        _imageRecognizer = imageRecognizer;

  final List<PriceScraper> _scrapers;
  final BarcodeScannerService? _barcodeScanner;
  final ImageRecognitionService? _imageRecognizer;

  Future<InstantSearchResult?> fromBarcode() async {
    final scan = await _barcodeScanner?.scanOnce();
    if (scan == null) return null;
    return _searchEverywhere(scan.code);
  }

  Future<InstantSearchResult?> fromImage(String imagePath) async {
    final labels = await _imageRecognizer?.recognize(imagePath: imagePath);
    if (labels == null || labels.isEmpty) return null;
    labels.sort((a, b) => b.confidence.compareTo(a.confidence));
    return _searchEverywhere(labels.first.label);
  }

  Future<InstantSearchResult> _searchEverywhere(String keyword) async {
    final all = <Product>[];
    for (final s in _scrapers) {
      all.addAll(await s.search(keyword));
    }
    return InstantSearchResult(keyword: keyword, products: all);
  }
}
