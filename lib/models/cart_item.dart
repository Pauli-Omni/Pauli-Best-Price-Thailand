/// Einkaufslisten-Position vor dem Optimierungslauf — produkt-/anbieter-agnostisch.
class CartItem {
  CartItem({
    required this.query,
    this.quantity = 1,
    this.preferredProductId,
  });

  /// Suchbegriff (Thai oder Englisch), nach dem in allen Shops geprüft wird.
  final String query;

  /// Stückzahl im Warenkorb.
  final int quantity;

  /// Optionale ID, falls der Kunde bereits ein konkretes Produkt gewählt hat.
  final String? preferredProductId;
}
