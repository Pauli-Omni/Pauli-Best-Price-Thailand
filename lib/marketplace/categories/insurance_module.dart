import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class InsuranceModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.insurance;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'car_insurance', category: ServiceCategory.insurance, labelDe: 'KFZ-Versicherung'),
    SubCategory(id: 'motorcycle_insurance', category: ServiceCategory.insurance, labelDe: 'Motorrad-Versicherung'),
    SubCategory(id: 'moped_insurance', category: ServiceCategory.insurance, labelDe: 'Mofa-Versicherung'),
    SubCategory(id: 'scooter_insurance', category: ServiceCategory.insurance, labelDe: 'Roller-Versicherung'),
    SubCategory(id: 'truck_insurance', category: ServiceCategory.insurance, labelDe: 'LKW-Versicherung'),
    SubCategory(id: 'health_insurance', category: ServiceCategory.insurance, labelDe: 'Krankenversicherung'),
    SubCategory(id: 'life_insurance', category: ServiceCategory.insurance, labelDe: 'Lebensversicherung'),
    SubCategory(id: 'accident_insurance', category: ServiceCategory.insurance, labelDe: 'Unfallversicherung'),
    SubCategory(id: 'home_contents_insurance', category: ServiceCategory.insurance, labelDe: 'Hausratversicherung'),
    SubCategory(id: 'building_insurance', category: ServiceCategory.insurance, labelDe: 'Gebäudeversicherung'),
    SubCategory(id: 'travel_health_insurance', category: ServiceCategory.insurance, labelDe: 'Auslandskrankenversicherung'),
    SubCategory(id: 'travel_cancellation_insurance', category: ServiceCategory.insurance, labelDe: 'Reiserücktrittsversicherung'),
  ];
}
