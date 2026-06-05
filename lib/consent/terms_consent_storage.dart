import 'dart:convert';
import 'dart:io';

abstract class TermsConsentStorage {
  Future<DateTime?> readAcceptedAt();
  Future<void> writeAcceptedAt(DateTime when, String version);
  Future<void> clear();
}

class InMemoryTermsConsentStorage implements TermsConsentStorage {
  DateTime? _accepted;
  String? acceptedVersion;

  @override
  Future<DateTime?> readAcceptedAt() async => _accepted;

  @override
  Future<void> writeAcceptedAt(DateTime when, String version) async {
    _accepted = when;
    acceptedVersion = version;
  }

  @override
  Future<void> clear() async {
    _accepted = null;
    acceptedVersion = null;
  }
}

class JsonFileTermsConsentStorage implements TermsConsentStorage {
  JsonFileTermsConsentStorage(this.filePath);
  final String filePath;

  Future<Map<String, dynamic>> _read() async {
    final f = File(filePath);
    if (!await f.exists()) return {};
    try {
      return (jsonDecode(await f.readAsString()) as Map).cast<String, dynamic>();
    } catch (_) {
      return {};
    }
  }

  @override
  Future<DateTime?> readAcceptedAt() async {
    final raw = await _read();
    final iso = raw['acceptedAt'];
    return iso is String ? DateTime.tryParse(iso) : null;
  }

  @override
  Future<void> writeAcceptedAt(DateTime when, String version) async {
    final f = File(filePath);
    await f.parent.create(recursive: true);
    await f.writeAsString(jsonEncode({
      'acceptedAt': when.toIso8601String(),
      'version': version,
    }));
  }

  @override
  Future<void> clear() async {
    final f = File(filePath);
    if (await f.exists()) await f.delete();
  }
}
