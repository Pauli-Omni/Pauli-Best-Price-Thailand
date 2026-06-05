/// Vom Kunden gesetzter Preis-Alarm. Schlägt aus, sobald der täglich
/// abgefragte Preis bei mindestens einem Anbieter den Schwellenwert
/// unterschreitet.
class PriceAlert {
  PriceAlert({
    required this.id,
    required this.productId,
    required this.productName,
    required this.targetPrice,
    DateTime? createdAt,
    this.lastTriggeredAt,
    this.active = true,
  }) : createdAt = createdAt ?? DateTime.now();

  final String id;
  final String productId;
  final String productName;
  final double targetPrice;
  final DateTime createdAt;
  final DateTime? lastTriggeredAt;
  final bool active;

  PriceAlert copyWith({DateTime? lastTriggeredAt, bool? active}) => PriceAlert(
        id: id,
        productId: productId,
        productName: productName,
        targetPrice: targetPrice,
        createdAt: createdAt,
        lastTriggeredAt: lastTriggeredAt ?? this.lastTriggeredAt,
        active: active ?? this.active,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'productId': productId,
        'productName': productName,
        'targetPrice': targetPrice,
        'createdAt': createdAt.toIso8601String(),
        'lastTriggeredAt': lastTriggeredAt?.toIso8601String(),
        'active': active,
      };

  factory PriceAlert.fromJson(Map<String, dynamic> json) => PriceAlert(
        id: json['id'].toString(),
        productId: json['productId'].toString(),
        productName: json['productName'].toString(),
        targetPrice: (json['targetPrice'] as num).toDouble(),
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
        lastTriggeredAt: json['lastTriggeredAt'] == null
            ? null
            : DateTime.tryParse(json['lastTriggeredAt'].toString()),
        active: json['active'] == true,
      );
}
