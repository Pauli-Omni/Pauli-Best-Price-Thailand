import 'package:flutter/foundation.dart';

import 'app_locale.dart';
import 'translations/translations_de.dart';
import 'translations/translations_en.dart';
import 'translations/translations_pl.dart';
import 'translations/translations_ru.dart';
import 'translations/translations_th.dart';
import 'translations/translations_zh.dart';

/// Zentraler I18n-Service.
///
/// Pflichtregel: Es darf **kein** UI-String hartkodiert werden — alles läuft
/// über `t(I18nKeys.xxx)`. Fehlende Übersetzungen fallen automatisch über
/// die Kette `requested → EN → TH → Key` zurück.
class I18nService extends ChangeNotifier {
  I18nService({AppLocale initial = AppLocale.en}) : _locale = initial;

  AppLocale _locale;

  AppLocale get locale => _locale;

  /// Reihenfolge: angefragte Sprache → EN → TH → roher Schlüssel.
  static const List<AppLocale> fallbackChain = [AppLocale.en, AppLocale.th];

  static const Map<AppLocale, Map<String, String>> _bundles = {
    AppLocale.de: translationsDe,
    AppLocale.en: translationsEn,
    AppLocale.th: translationsTh,
    AppLocale.pl: translationsPl,
    AppLocale.ru: translationsRu,
    AppLocale.zh: translationsZh,
  };

  void setLocale(AppLocale locale) {
    if (_locale == locale) return;
    _locale = locale;
    notifyListeners();
  }

  /// Holt einen Text. Optional kann ein Map mit Platzhaltern übergeben werden
  /// (`{name}` → "Foo").
  String t(String key, {Map<String, String>? params}) {
    final raw = _lookup(key);
    if (params == null || params.isEmpty) return raw;
    var out = raw;
    params.forEach((k, v) => out = out.replaceAll('{$k}', v));
    return out;
  }

  /// Wählt aus einer vom Backend gelieferten Map (`{ 'th': '...', 'en': '...' }`)
  /// die beste Übersetzung gemäß Fallback-Kette.
  String resolveFromMap(Map<String, String> localized, {String? rawFallback}) {
    if (localized.containsKey(_locale.code)) return localized[_locale.code]!;
    for (final l in fallbackChain) {
      if (localized.containsKey(l.code)) return localized[l.code]!;
    }
    if (localized.isNotEmpty) return localized.values.first;
    return rawFallback ?? '';
  }

  String _lookup(String key) {
    final primary = _bundles[_locale]?[key];
    if (primary != null) return primary;
    for (final l in fallbackChain) {
      final fb = _bundles[l]?[key];
      if (fb != null) return fb;
    }
    return key;
  }

  /// True, wenn für die aktuelle Sprache eine direkte Übersetzung existiert
  /// (kein Fallback). Hilfreich für Debug-Overlays.
  bool hasDirect(String key) => _bundles[_locale]?.containsKey(key) ?? false;
}
