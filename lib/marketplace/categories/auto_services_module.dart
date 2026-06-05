import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class AutoServicesModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.autoServices;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'oil_change', category: ServiceCategory.autoServices, labelDe: 'Ölwechsel'),
    SubCategory(id: 'maintenance', category: ServiceCategory.autoServices, labelDe: 'Wartung'),
    SubCategory(id: 'repairs', category: ServiceCategory.autoServices, labelDe: 'Reparaturen'),
    SubCategory(id: 'tyre_change', category: ServiceCategory.autoServices, labelDe: 'Reifenwechsel'),
    SubCategory(id: 'car_wash', category: ServiceCategory.autoServices, labelDe: 'Autowäsche'),
    SubCategory(id: 'diagnostics', category: ServiceCategory.autoServices, labelDe: 'Fehler-Diagnostik'),
  ];
}
