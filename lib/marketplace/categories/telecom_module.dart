import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class TelecomModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.telecom;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'mobile_contracts', category: ServiceCategory.telecom, labelDe: 'Handyverträge'),
    SubCategory(id: 'prepaid_sim', category: ServiceCategory.telecom, labelDe: 'Prepaid-SIM-Karten'),
    SubCategory(id: 'landline_internet', category: ServiceCategory.telecom, labelDe: 'Festnetz-Internet'),
    SubCategory(id: 'fiber_optic', category: ServiceCategory.telecom, labelDe: 'Glasfaser-Anschlüsse'),
  ];
}
