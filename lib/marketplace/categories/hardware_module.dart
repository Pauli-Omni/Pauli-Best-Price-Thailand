import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class HardwareModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.hardware;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'tools', category: ServiceCategory.hardware, labelDe: 'Werkzeuge'),
    SubCategory(id: 'building_materials', category: ServiceCategory.hardware, labelDe: 'Baumaterialien'),
    SubCategory(id: 'gardening', category: ServiceCategory.hardware, labelDe: 'Gartenbedarf'),
    SubCategory(id: 'paints', category: ServiceCategory.hardware, labelDe: 'Farben'),
    SubCategory(id: 'sanitary', category: ServiceCategory.hardware, labelDe: 'Sanitärbedarf'),
  ];
}
