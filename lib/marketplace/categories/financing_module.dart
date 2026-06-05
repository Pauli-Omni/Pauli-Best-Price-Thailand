import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class FinancingModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.financing;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'mortgage_loans', category: ServiceCategory.financing, labelDe: 'Immobilien-Kredite'),
    SubCategory(id: 'personal_loans', category: ServiceCategory.financing, labelDe: 'Privat-Kredite'),
    SubCategory(id: 'car_loans', category: ServiceCategory.financing, labelDe: 'Auto-Kredite'),
    SubCategory(id: 'credit_cards', category: ServiceCategory.financing, labelDe: 'Kreditkarten-Vergleich'),
  ];
}
