import '../service_category.dart';
import '../sub_category.dart';
import 'category_module.dart';

class TravelModule extends CategoryModule {
  @override
  ServiceCategory get category => ServiceCategory.travel;

  @override
  final List<SubCategory> subCategories = const [
    SubCategory(id: 'domestic_flights', category: ServiceCategory.travel, labelDe: 'Inlandsflüge'),
    SubCategory(id: 'international_flights', category: ServiceCategory.travel, labelDe: 'Internationale Flüge'),
    SubCategory(id: 'hotel_bookings', category: ServiceCategory.travel, labelDe: 'Hotelbuchungen'),
    SubCategory(id: 'train_tickets', category: ServiceCategory.travel, labelDe: 'Zugtickets'),
    SubCategory(id: 'bus_tickets', category: ServiceCategory.travel, labelDe: 'Bustickets'),
    SubCategory(id: 'ferry_tickets', category: ServiceCategory.travel, labelDe: 'Fährtickets'),
    SubCategory(id: 'public_transport', category: ServiceCategory.travel, labelDe: 'Nahverkehr (BTS, MRT)'),
    SubCategory(id: 'taxis', category: ServiceCategory.travel, labelDe: 'Taxis'),
    SubCategory(id: 'minivans', category: ServiceCategory.travel, labelDe: 'Minivans'),
  ];

  /// Unterkategorien, die unter die Mikro-Gebühren-Regel fallen
  /// (Bustickets, Nahverkehr, Minivans).
  static const Set<String> microTransactionSubCategoryIds = {
    'bus_tickets',
    'public_transport',
    'minivans',
  };
}
