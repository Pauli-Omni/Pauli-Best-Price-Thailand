import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class VehiclePurchaseModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.vehiclePurchase;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'new_cars', category: ServiceCategory.vehiclePurchase, labelDe: 'Neuwagen'),
    SubCategory(id: 'used_cars', category: ServiceCategory.vehiclePurchase, labelDe: 'Gebrauchtwagen'),
    SubCategory(id: 'motorcycles', category: ServiceCategory.vehiclePurchase, labelDe: 'Motorräder'),
    SubCategory(id: 'scooters', category: ServiceCategory.vehiclePurchase, labelDe: 'Roller'),
  ];
}
