/// Thailändische Postleitzahl (5-stellig). Erste Ziffer = Region:
/// 1 Zentral/BKK, 2 Ost, 3 Nordost (Isan), 4 Nord-Isan, 5 Nord, 6 Mitte-Nord,
/// 7 West, 8 Süd-Ost, 9 Süd. Wird vom CartController genutzt, um die
/// Lieferzone zu ermitteln — **ohne** regionale Sperren.
class ThaiPostalCode {
  ThaiPostalCode(String raw) : code = _normalize(raw) {
    if (code.length != 5 || int.tryParse(code) == null) {
      throw ArgumentError('Ungültige thailändische PLZ: $raw');
    }
  }

  final String code;

  /// Grobe Lieferzone (1–4) für die Lieferkosten-Tabelle.
  /// Greater Bangkok = 1, übriges Zentral/Ost/West = 2,
  /// Nord/Nordost = 3, ferner Süden / Inseln = 4.
  int get zone {
    final first = int.parse(code[0]);
    switch (first) {
      case 1:
        return 1;
      case 2:
      case 7:
        return 2;
      case 3:
      case 4:
      case 5:
      case 6:
        return 3;
      case 8:
      case 9:
        return 4;
      default:
        return 2;
    }
  }

  static String _normalize(String raw) => raw.replaceAll(RegExp(r'\s+'), '');

  @override
  String toString() => code;
}
