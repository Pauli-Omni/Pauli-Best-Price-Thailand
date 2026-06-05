class RecognizedProduct {
  RecognizedProduct({required this.label, required this.confidence});
  final String label;
  final double confidence;
}

/// Bildbasierte Produkterkennung für Fotos aus der App-Kamera.
/// TODO: Anbinden an Google ML Kit Image Labeling
/// (`google_mlkit_image_labeling`) oder eigenes Vision-Modell.
abstract class ImageRecognitionService {
  Future<List<RecognizedProduct>> recognize({required String imagePath});
}
