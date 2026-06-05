import '../providers/nlp/provider_trust_evaluator.dart';
import '../providers/nlp/review_text.dart';
import '../providers/provider_interface.dart';
import '../providers/provider_offer.dart';
import '../providers/scam_blocklist.dart';
import '../transactions/transaction_engine.dart';
import 'categories/auto_services_module.dart';
import 'categories/category_module.dart';
import 'categories/electronics_module.dart';
import 'categories/financing_module.dart';
import 'categories/groceries_module.dart';
import 'categories/hardware_module.dart';
import 'categories/health_beauty_module.dart';
import 'categories/home_services_module.dart';
import 'categories/insurance_module.dart';
import 'categories/lottery_module.dart';
import 'categories/real_estate_module.dart';
import 'categories/telecom_module.dart';
import 'categories/travel_module.dart';
import 'categories/vehicle_purchase_module.dart';
import 'service_category.dart';
import 'sub_category.dart';

/// Universelle MarketplaceEngine.
///
/// Hält alle 13 Kategorie-Module, registriert Provider per
/// Unterkategorie-ID und gibt Angebote zurück, deren `finalPrice` bereits
/// die versteckte Plattform-Gebühr enthält (TransactionEngine).
class MarketplaceEngine {
  MarketplaceEngine({
    TransactionEngine? transactionEngine,
    ScamBlocklist? scamBlocklist,
    ProviderTrustEvaluator? trustEvaluator,
  })  : _txEngine = transactionEngine ?? TransactionEngine(),
        _scamBlocklist = scamBlocklist ?? InMemoryScamBlocklist(),
        _trustEvaluator = trustEvaluator;

  final TransactionEngine _txEngine;
  final ScamBlocklist _scamBlocklist;
  final ProviderTrustEvaluator? _trustEvaluator;

  final Map<ServiceCategory, CategoryModule> _modules = {
    ServiceCategory.autoServices: AutoServicesModule(),
    ServiceCategory.vehiclePurchase: VehiclePurchaseModule(),
    ServiceCategory.realEstate: RealEstateModule(),
    ServiceCategory.financing: FinancingModule(),
    ServiceCategory.insurance: InsuranceModule(),
    ServiceCategory.groceries: GroceriesModule(),
    ServiceCategory.hardware: HardwareModule(),
    ServiceCategory.electronics: ElectronicsModule(),
    ServiceCategory.travel: TravelModule(),
    ServiceCategory.telecom: TelecomModule(),
    ServiceCategory.homeServices: HomeServicesModule(),
    ServiceCategory.healthBeauty: HealthBeautyModule(),
    ServiceCategory.lottery: LotteryModule(),
  };

  final Map<String, List<ProviderInterface>> _providersBySubCategoryId = {};

  /// Alle vom Auftraggeber genannten Unterkategorien aller 13 Kategorien.
  List<SubCategory> allSubCategories() =>
      _modules.values.expand((m) => m.subCategories).toList();

  CategoryModule module(ServiceCategory c) => _modules[c]!;

  void registerProvider(ProviderInterface provider) {
    for (final id in provider.supportedSubCategoryIds) {
      _providersBySubCategoryId.putIfAbsent(id, () => []).add(provider);
    }
  }

  /// Fragt alle für die Unterkategorie registrierten Provider parallel ab,
  /// überspringt gesperrte Anbieter (ScamBlocklist), wendet die versteckte
  /// Plattform-Gebühr an und optional den NLP-Trust-Evaluator.
  ///
  /// `reviewsByProvider`: bekannte Rezensionen je Anbieter — der Evaluator
  /// stuft damit Promos als 'Promo' ein oder verbannt Scam-Anbieter dauerhaft.
  Future<List<ProviderOffer>> quote(
    ProviderQuery query, {
    Map<String, List<ReviewText>> reviewsByProvider = const {},
  }) async {
    final providers = _providersBySubCategoryId[query.subCategory.id] ?? [];

    final activeProviders = <ProviderInterface>[];
    for (final p in providers) {
      if (await _scamBlocklist.isBanned(p.providerId)) continue;
      activeProviders.add(p);
    }

    final raw = await Future.wait(activeProviders.map((p) async {
      try {
        return await p.quote(query);
      } catch (_) {
        return <ProviderOffer>[];
      }
    }));

    final priced =
        raw.expand((x) => x).map((o) => _txEngine.applyHiddenFee(offer: o));

    final out = <ProviderOffer>[];
    for (final offer in priced) {
      if (_trustEvaluator == null) {
        out.add(offer);
        continue;
      }
      final reviews = reviewsByProvider[offer.providerId] ?? const [];
      final verdict =
          await _trustEvaluator.evaluate(offer: offer, reviews: reviews);
      switch (verdict.type) {
        case TrustVerdictType.permanentBan:
        case TrustVerdictType.block:
          continue;
        case TrustVerdictType.allow:
        case TrustVerdictType.allowAsPromo:
          out.add(verdict.offer);
      }
    }

    out.sort((a, b) => a.finalPrice.compareTo(b.finalPrice));
    return out;
  }
}
