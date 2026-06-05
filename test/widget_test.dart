import 'package:flutter_test/flutter_test.dart';

import 'package:pauli_best_price/consent/terms_consent_service.dart';
import 'package:pauli_best_price/consent/terms_consent_storage.dart';
import 'package:pauli_best_price/i18n/app_locale.dart';
import 'package:pauli_best_price/i18n/i18n_service.dart';
import 'package:pauli_best_price/main.dart';

void main() {
  testWidgets('AGB-Gate blockt beim ersten Start (EN-Default)', (tester) async {
    final consent = TermsConsentService(storage: InMemoryTermsConsentStorage());
    final i18n = I18nService(initial: AppLocale.en);
    await tester.pumpWidget(PauliBestPriceApp(consent: consent, i18n: i18n));
    await tester.pumpAndSettle();

    expect(find.text('Terms of Service required'), findsOneWidget);
    expect(find.text('PAULI BESTPRICE'), findsNothing);
  });

  testWidgets('Sprachwechsel funktioniert auf der AGB-Seite', (tester) async {
    final consent = TermsConsentService(storage: InMemoryTermsConsentStorage());
    final i18n = I18nService(initial: AppLocale.en);
    await tester.pumpWidget(PauliBestPriceApp(consent: consent, i18n: i18n));
    await tester.pumpAndSettle();

    i18n.setLocale(AppLocale.de);
    await tester.pumpAndSettle();
    expect(find.text('AGB-Zustimmung erforderlich'), findsOneWidget);
  });

  testWidgets('Nach Zustimmung erscheint die App', (tester) async {
    final consent = TermsConsentService(storage: InMemoryTermsConsentStorage());
    final i18n = I18nService(initial: AppLocale.en);
    await consent.accept();
    await tester.pumpWidget(PauliBestPriceApp(consent: consent, i18n: i18n));
    await tester.pumpAndSettle();

    expect(find.text('Pauli Best Price Thailand'), findsOneWidget);
  });
}
