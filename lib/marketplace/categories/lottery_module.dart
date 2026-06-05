import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class LotteryModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.lottery;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'official_state_providers', category: ServiceCategory.lottery, labelDe: 'Offizielle staatliche Anbieter'),
    SubCategory(id: 'number_comparison', category: ServiceCategory.lottery, labelDe: 'Zahlen-Vergleich'),
  ];
}
