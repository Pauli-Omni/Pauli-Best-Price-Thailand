/// Die 6 unterstützten App-Sprachen.
enum AppLocale {
  de,
  en,
  th,
  pl,
  ru,
  zh;

  String get code => name;

  String get nativeName => switch (this) {
        AppLocale.de => 'Deutsch',
        AppLocale.en => 'English',
        AppLocale.th => 'ไทย',
        AppLocale.pl => 'Polski',
        AppLocale.ru => 'Русский',
        AppLocale.zh => '中文',
      };

  static AppLocale fromCode(String code) {
    final lower = code.toLowerCase();
    for (final l in AppLocale.values) {
      if (l.code == lower) return l;
    }
    return AppLocale.en;
  }
}
