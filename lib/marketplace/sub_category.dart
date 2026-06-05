import 'service_category.dart';

/// Eine konkrete Unterkategorie innerhalb einer der 13 Hauptkategorien.
/// `id` ist stabil und wird für Mikro-Gebühren-Klassifizierung,
/// Provider-Routing und Analytics genutzt.
class SubCategory {
  const SubCategory({
    required this.id,
    required this.category,
    required this.labelDe,
  });

  final String id;
  final ServiceCategory category;
  final String labelDe;

  @override
  String toString() => '${category.id}/$id';
}
