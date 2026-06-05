import '../marketplace/categories/travel_module.dart';
import '../marketplace/sub_category.dart';

/// Regeln für die versteckte Plattform-Gebühr.
///
/// Standard-Transaktion: 10 THB.
/// Mikro-Transaktion (Bustickets, Nahverkehr BTS/MRT, Minivans
/// **oder** Artikel < 50 THB): max. 1 THB.
class FeePolicy {
  const FeePolicy({
    this.standardFeeThb = 10.0,
    this.maxMicroFeeThb = 1.0,
    this.microPriceThreshold = 50.0,
  });

  final double standardFeeThb;
  final double maxMicroFeeThb;
  final double microPriceThreshold;

  bool isMicroTransaction({
    required SubCategory subCategory,
    required double basePrice,
  }) {
    if (TravelModule.microTransactionSubCategoryIds.contains(subCategory.id)) {
      return true;
    }
    if (basePrice < microPriceThreshold) return true;
    return false;
  }

  double feeFor({
    required SubCategory subCategory,
    required double basePrice,
  }) {
    if (isMicroTransaction(subCategory: subCategory, basePrice: basePrice)) {
      // Dynamisch, aber maximal 1 THB; bei sehr kleinen Preisen anteilig.
      final dynamicFee = basePrice * 0.02;
      return dynamicFee.clamp(0.0, maxMicroFeeThb).toDouble();
    }
    return standardFeeThb;
  }
}
