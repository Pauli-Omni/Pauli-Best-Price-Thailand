import '../../marketplace/categories/auto_services_module.dart';
import '../../marketplace/categories/category_module.dart';
import '../../marketplace/categories/electronics_module.dart';
import '../../marketplace/categories/financing_module.dart';
import '../../marketplace/categories/groceries_module.dart';
import '../../marketplace/categories/hardware_module.dart';
import '../../marketplace/categories/health_beauty_module.dart';
import '../../marketplace/categories/insurance_module.dart';
import '../../marketplace/categories/telecom_module.dart';
import '../../marketplace/service_category.dart';
import '../provider_interface.dart';
import '../provider_offer.dart';

/// Basisklasse für Affiliate-Connectoren (AccessTrade, Involve Asia, …).
///
/// Verwaltet die unterstützten Kategorien und die daraus abgeleiteten
/// Unterkategorie-IDs. Liefert ProviderOffer-Objekte **ohne** die versteckte
/// Plattform-Gebühr; die `TransactionEngine` rechnet diese im
/// `MarketplaceEngine.quote()`-Flow automatisch ein (10 THB Standard,
/// ≤ 1 THB Mikro).
abstract class AffiliateProvider implements ProviderInterface {
  AffiliateProvider({required this.supportedCategories});

  final Set<ServiceCategory> supportedCategories;

  static final Map<ServiceCategory, CategoryModule> _moduleLookup = {
    ServiceCategory.autoServices: AutoServicesModule(),
    ServiceCategory.financing: FinancingModule(),
    ServiceCategory.insurance: InsuranceModule(),
    ServiceCategory.telecom: TelecomModule(),
    ServiceCategory.electronics: ElectronicsModule(),
    ServiceCategory.groceries: GroceriesModule(),
    ServiceCategory.hardware: HardwareModule(),
    ServiceCategory.healthBeauty: HealthBeautyModule(),
  };

  @override
  Set<String> get supportedSubCategoryIds => {
        for (final c in supportedCategories)
          ..._moduleLookup[c]!.subCategories.map((s) => s.id),
      };

  @override
  Future<List<ProviderOffer>> quote(ProviderQuery query) async {
    if (!supportedSubCategoryIds.contains(query.subCategory.id)) {
      return const [];
    }
    return fetchOffers(query);
  }

  /// Liefert rohe Provider-Angebote (Basispreis vor versteckter Gebühr).
  Future<List<ProviderOffer>> fetchOffers(ProviderQuery query);
}
