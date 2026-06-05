import '../service_category.dart';
import '../sub_category.dart';

/// Vertrag, den jedes der 13 Kategorie-Module einhalten muss.
abstract class CategoryModule {
  ServiceCategory get category;

  /// Alle vom Auftraggeber wörtlich genannten Unterkategorien.
  List<SubCategory> get subCategories;

  SubCategory subCategoryById(String id) {
    return subCategories.firstWhere(
      (s) => s.id == id,
      orElse: () => throw ArgumentError(
        'Unbekannte Unterkategorie "$id" in ${category.id}',
      ),
    );
  }
}
