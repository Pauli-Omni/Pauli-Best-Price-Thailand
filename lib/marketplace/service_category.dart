/// Die 13 Hauptkategorien der Pauli BestPrice Super-App.
/// Jede Kategorie wird durch ein eigenständiges Modul abgedeckt
/// (siehe `lib/marketplace/categories/`).
enum ServiceCategory {
  autoServices,
  vehiclePurchase,
  realEstate,
  financing,
  insurance,
  groceries,
  hardware,
  electronics,
  travel,
  telecom,
  homeServices,
  healthBeauty,
  lottery;

  /// Stabile ID für Persistenz, Analytics und Routing.
  String get id => switch (this) {
        ServiceCategory.autoServices => 'auto_services',
        ServiceCategory.vehiclePurchase => 'vehicle_purchase',
        ServiceCategory.realEstate => 'real_estate',
        ServiceCategory.financing => 'financing',
        ServiceCategory.insurance => 'insurance',
        ServiceCategory.groceries => 'groceries',
        ServiceCategory.hardware => 'hardware',
        ServiceCategory.electronics => 'electronics',
        ServiceCategory.travel => 'travel',
        ServiceCategory.telecom => 'telecom',
        ServiceCategory.homeServices => 'home_services',
        ServiceCategory.healthBeauty => 'health_beauty',
        ServiceCategory.lottery => 'lottery',
      };

  String get labelDe => switch (this) {
        ServiceCategory.autoServices => 'Auto-Services',
        ServiceCategory.vehiclePurchase => 'Fahrzeug-Kauf',
        ServiceCategory.realEstate => 'Immobilien',
        ServiceCategory.financing => 'Finanzierungen',
        ServiceCategory.insurance => 'Versicherungen',
        ServiceCategory.groceries => 'Lebensmittel',
        ServiceCategory.hardware => 'Baumärkte',
        ServiceCategory.electronics => 'Elektronik',
        ServiceCategory.travel => 'Reisen & Transport',
        ServiceCategory.telecom => 'Telekommunikation',
        ServiceCategory.homeServices => 'Home-Services',
        ServiceCategory.healthBeauty => 'Gesundheit & Beauty',
        ServiceCategory.lottery => 'Lotto',
      };

  /// Kategorien mit physischer Logistik (Tracking & 7-Eleven-Pickup).
  bool get hasPhysicalLogistics => switch (this) {
        ServiceCategory.groceries ||
        ServiceCategory.hardware ||
        ServiceCategory.electronics =>
          true,
        _ => false,
      };
}
