class ScannedBarcode {
  ScannedBarcode({required this.code, required this.format});
  final String code;
  final String format;
}

/// Plattform-Schnittstelle für den Kamera-Barcode-Scanner.
/// TODO: Mit dem Paket `mobile_scanner` implementieren (Android: CAMERA-
/// Permission, iOS: NSCameraUsageDescription in Info.plist).
abstract class BarcodeScannerService {
  Future<ScannedBarcode?> scanOnce();
  Stream<ScannedBarcode> scanStream();
}
