import '../../models/price_alert.dart';
import '../../models/product.dart';
import '../price_scraper.dart';
import 'price_alert_storage.dart';
import 'push_notification_service.dart';

/// CRUD für Preisalarme plus täglicher Check, der alle registrierten
/// Anbieter abfragt und bei Unterschreitung des Wunschpreises eine
/// Push-Benachrichtigung auslöst.
class PriceAlertService {
  PriceAlertService({
    required PriceAlertStorage storage,
    required PushNotificationService notifier,
    required List<PriceScraper> scrapers,
  })  : _storage = storage,
        _notifier = notifier,
        _scrapers = scrapers;

  final PriceAlertStorage _storage;
  final PushNotificationService _notifier;
  final List<PriceScraper> _scrapers;

  Future<List<PriceAlert>> all() => _storage.loadAll();

  Future<PriceAlert> create({
    required String productId,
    required String productName,
    required double targetPrice,
  }) async {
    final alert = PriceAlert(
      id: '${DateTime.now().microsecondsSinceEpoch}_$productId',
      productId: productId,
      productName: productName,
      targetPrice: targetPrice,
    );
    await _storage.save(alert);
    return alert;
  }

  Future<void> remove(String id) => _storage.delete(id);

  /// Wird vom Background-Scheduler (z. B. einmal pro Tag) aufgerufen.
  /// Alias: [checkPriceAlerts] (gleicher Effekt, eindeutigere Benennung).
  Future<void> runDailyCheck() => checkPriceAlerts();

  /// Landesweiter Trigger: prüft bei jedem Preisupdate aller Anbieter,
  /// ob `currentPrice <= targetPrice`, und sendet sofort einen Push-Event.
  Future<void> checkPriceAlerts({Iterable<Product>? freshlyFetchedProducts}) async {
    final alerts = (await _storage.loadAll()).where((a) => a.active).toList();
    if (alerts.isEmpty) return;

    if (freshlyFetchedProducts != null) {
      await _checkAgainstSnapshot(alerts, freshlyFetchedProducts);
      return;
    }

    for (final alert in alerts) {
      double? cheapest;
      String? cheapestRetailer;

      for (final scraper in _scrapers) {
        final hits = await scraper.search(alert.productName);
        for (final p in hits) {
          final price = p.finalPrice > 0 ? p.finalPrice : p.price;
          if (price <= 0) continue;
          if (cheapest == null || price < cheapest) {
            cheapest = price;
            cheapestRetailer = scraper.retailerId;
          }
        }
      }

      await _maybeTrigger(alert, cheapest, cheapestRetailer);
    }
  }

  Future<void> _checkAgainstSnapshot(
    List<PriceAlert> alerts,
    Iterable<Product> products,
  ) async {
    for (final alert in alerts) {
      double? cheapest;
      for (final p in products) {
        if (p.id != alert.productId) continue;
        final price = p.finalPrice > 0 ? p.finalPrice : p.price;
        if (price <= 0) continue;
        if (cheapest == null || price < cheapest) cheapest = price;
      }
      await _maybeTrigger(alert, cheapest, null);
    }
  }

  Future<void> _maybeTrigger(
    PriceAlert alert,
    double? currentPrice,
    String? retailerId,
  ) async {
    if (currentPrice == null || currentPrice > alert.targetPrice) return;
    await _notifier.notifyPriceDrop(
      productId: alert.productId,
      productName: alert.productName,
      newPrice: currentPrice,
      targetPrice: alert.targetPrice,
      retailerId: retailerId ?? 'unknown',
    );
    await _storage.save(alert.copyWith(lastTriggeredAt: DateTime.now()));
  }
}
