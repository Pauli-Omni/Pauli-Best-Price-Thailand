import '../../models/product.dart';
import '../price_scraper.dart';
import 'barcode_scanner_service.dart';
import 'image_recognition_service.dart';
import 'instant_search_service.dart';

class ScannerSearchQuery {
  ScannerSearchQuery({required this.searchQuery, required this.source});

  /// Was als Suchbegriff an die landesweite Preis-API geschickt wird.
  final String searchQuery;

  /// 'barcode' oder 'image' — für Telemetrie/Analytics.
  final String source;
}

class ScannerResult {
  ScannerResult({required this.query, required this.products});
  final ScannerSearchQuery query;
  final List<Product> products;
}

/// Konsolidierte Engine für Barcode + Bilderkennung.
/// Wandelt Kamera-Input in einen `searchQuery` und ruft damit landesweit
/// alle registrierten Shop-Scraper auf.
class ScannerEngine {
  ScannerEngine({
    required List<PriceScraper> scrapers,
    BarcodeScannerService? barcodeScanner,
    ImageRecognitionService? imageRecognizer,
  })  : _scrapers = scrapers,
        _barcode = barcodeScanner,
        _image = imageRecognizer,
        _instant = InstantSearchService(
          scrapers: scrapers,
          barcodeScanner: barcodeScanner,
          imageRecognizer: imageRecognizer,
        );

  final List<PriceScraper> _scrapers;
  final BarcodeScannerService? _barcode;
  final ImageRecognitionService? _image;
  final InstantSearchService _instant;

  /// Nimmt einen Barcode-Scan auf und gibt sofort die landesweiten Treffer
  /// (sortiert nach finalPrice) zurück.
  Future<ScannerResult?> scanBarcode() async {
    final scan = await _barcode?.scanOnce();
    if (scan == null) return null;
    return _runQuery(searchQuery: scan.code, source: 'barcode');
  }

  /// Klassifiziert ein Foto und nutzt das beste Label als landesweiten
  /// Suchbegriff.
  Future<ScannerResult?> scanImage(String imagePath) async {
    final labels = await _image?.recognize(imagePath: imagePath);
    if (labels == null || labels.isEmpty) return null;
    labels.sort((a, b) => b.confidence.compareTo(a.confidence));
    return _runQuery(searchQuery: labels.first.label, source: 'image');
  }

  Future<ScannerResult> _runQuery({
    required String searchQuery,
    required String source,
  }) async {
    final products = <Product>[];
    for (final s in _scrapers) {
      products.addAll(await s.search(searchQuery));
    }
    products.sort((a, b) {
      final fa = a.finalPrice > 0 ? a.finalPrice : a.price;
      final fb = b.finalPrice > 0 ? b.finalPrice : b.price;
      return fa.compareTo(fb);
    });
    return ScannerResult(
      query: ScannerSearchQuery(searchQuery: searchQuery, source: source),
      products: products,
    );
  }

  /// Direktzugriff auf den darunterliegenden InstantSearchService — falls
  /// Aufrufer die alten Rückgabetypen brauchen.
  InstantSearchService get instant => _instant;
}
