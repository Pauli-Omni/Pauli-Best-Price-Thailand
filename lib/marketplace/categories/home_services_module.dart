import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class HomeServicesModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.homeServices;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'aircon_cleaning', category: ServiceCategory.homeServices, labelDe: 'Klimaanlagen-Reinigung'),
    SubCategory(id: 'cleaners', category: ServiceCategory.homeServices, labelDe: 'Putzkräfte'),
    SubCategory(id: 'plumbers', category: ServiceCategory.homeServices, labelDe: 'Klempner'),
    SubCategory(id: 'electricians', category: ServiceCategory.homeServices, labelDe: 'Elektriker'),
    SubCategory(id: 'pest_control', category: ServiceCategory.homeServices, labelDe: 'Schädlingsbekämpfung'),
  ];
}
