import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class GroceriesModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.groceries;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'supermarkets', category: ServiceCategory.groceries, labelDe: 'Supermärkte'),
    SubCategory(id: 'local_fresh_markets', category: ServiceCategory.groceries, labelDe: 'Lokale Frischmärkte'),
    SubCategory(id: 'online_delivery', category: ServiceCategory.groceries, labelDe: 'Online-Lieferdienste'),
    SubCategory(id: 'beverage_delivery', category: ServiceCategory.groceries, labelDe: 'Getränkelieferungen'),
  ];
}
