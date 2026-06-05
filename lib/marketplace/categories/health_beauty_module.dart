import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class HealthBeautyModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.healthBeauty;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'hospital_checkups', category: ServiceCategory.healthBeauty, labelDe: 'Krankenhaus-Check-ups'),
    SubCategory(id: 'dentist_appointments', category: ServiceCategory.healthBeauty, labelDe: 'Zahnarzttermine'),
    SubCategory(id: 'massage_bookings', category: ServiceCategory.healthBeauty, labelDe: 'Massage-Buchungen'),
  ];
}
