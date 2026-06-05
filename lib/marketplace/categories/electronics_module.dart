import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class ElectronicsModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.electronics;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'smartphones', category: ServiceCategory.electronics, labelDe: 'Smartphones'),
    SubCategory(id: 'tablets', category: ServiceCategory.electronics, labelDe: 'Tablets'),
    SubCategory(id: 'computers', category: ServiceCategory.electronics, labelDe: 'Computer'),
    SubCategory(id: 'televisions', category: ServiceCategory.electronics, labelDe: 'Fernseher'),
    SubCategory(id: 'household_appliances', category: ServiceCategory.electronics, labelDe: 'Haushaltsgeräte'),
    SubCategory(id: 'air_conditioners', category: ServiceCategory.electronics, labelDe: 'Klimaanlagen'),
  ];
}
