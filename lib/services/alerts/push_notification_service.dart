/// Push-Versand für ausgelöste Preisalarme.
/// TODO: Mit Firebase Cloud Messaging (firebase_messaging) und optional
/// flutter_local_notifications implementieren.
abstract class PushNotificationService {
  Future<void> notifyPriceDrop({
    required String productId,
    required String productName,
    required double newPrice,
    required double targetPrice,
    required String retailerId,
  });
}

class LoggingPushNotificationService implements PushNotificationService {
  @override
  Future<void> notifyPriceDrop({
    required String productId,
    required String productName,
    required double newPrice,
    required double targetPrice,
    required String retailerId,
  }) async {
    // ignore: avoid_print
    print(
      'PriceDrop: $productName @ $retailerId ist auf $newPrice gefallen '
      '(Zielpreis $targetPrice).',
    );
  }
}
