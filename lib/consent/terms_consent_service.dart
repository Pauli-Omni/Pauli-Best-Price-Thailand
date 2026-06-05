import 'terms_consent_storage.dart';

/// AGB-Zwangszustimmung. Ohne aktive Bestätigung wird die App vom
/// `TermsGate`-Widget blockiert (siehe `terms_gate.dart`).
class TermsConsentService {
  TermsConsentService({
    required TermsConsentStorage storage,
    this.currentVersion = '1.0',
  }) : _storage = storage;

  final TermsConsentStorage _storage;
  final String currentVersion;

  Future<bool> hasAccepted() async {
    final accepted = await _storage.readAcceptedAt();
    return accepted != null;
  }

  Future<void> accept() =>
      _storage.writeAcceptedAt(DateTime.now(), currentVersion);

  Future<void> revoke() => _storage.clear();
}
