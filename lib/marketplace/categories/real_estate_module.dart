import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class RealEstateModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.realEstate;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'houses_buy', category: ServiceCategory.realEstate, labelDe: 'Häuser kaufen'),
    SubCategory(id: 'houses_rent', category: ServiceCategory.realEstate, labelDe: 'Häuser mieten'),
    SubCategory(id: 'apartments_buy', category: ServiceCategory.realEstate, labelDe: 'Wohnungen kaufen'),
    SubCategory(id: 'apartments_rent', category: ServiceCategory.realEstate, labelDe: 'Wohnungen mieten'),
    SubCategory(id: 'land', category: ServiceCategory.realEstate, labelDe: 'Grundstücke'),
  ];
}
