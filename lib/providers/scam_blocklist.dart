import 'dart:convert';
import 'dart:io';

class ScamBlocklistEntry {
  ScamBlocklistEntry({
    required this.providerId,
    required this.reason,
    required this.bannedAt,
    this.scamTerms = const <String>{},
  });

  final String providerId;
  final String reason;
  final DateTime bannedAt;
  final Set<String> scamTerms;

  Map<String, dynamic> toJson() => {
        'providerId': providerId,
        'reason': reason,
        'bannedAt': bannedAt.toIso8601String(),
        'scamTerms': scamTerms.toList(),
      };

  factory ScamBlocklistEntry.fromJson(Map<String, dynamic> json) =>
      ScamBlocklistEntry(
        providerId: json['providerId'].toString(),
        reason: json['reason']?.toString() ?? '',
        bannedAt:
            DateTime.tryParse(json['bannedAt']?.toString() ?? '') ?? DateTime.now(),
        scamTerms:
            (json['scamTerms'] as List?)?.map((e) => e.toString()).toSet() ??
                <String>{},
      );
}

/// Permanente Sperrliste. Sobald die NLP-Analyse einen Anbieter als Scam
/// identifiziert (Ware nicht geliefert, Lockvogel, Fake, …), wird er
/// **dauerhaft** hier eingetragen und aus den Suchergebnissen gelöscht.
abstract class ScamBlocklist {
  Future<bool> isBanned(String providerId);
  Future<void> ban(ScamBlocklistEntry entry);
  Future<List<ScamBlocklistEntry>> all();
}

class InMemoryScamBlocklist implements ScamBlocklist {
  final Map<String, ScamBlocklistEntry> _banned = {};

  @override
  Future<bool> isBanned(String providerId) async =>
      _banned.containsKey(providerId);

  @override
  Future<void> ban(ScamBlocklistEntry entry) async {
    _banned[entry.providerId] = entry;
  }

  @override
  Future<List<ScamBlocklistEntry>> all() async => _banned.values.toList();
}

class JsonFileScamBlocklist implements ScamBlocklist {
  JsonFileScamBlocklist(this.filePath);
  final String filePath;

  Future<Map<String, ScamBlocklistEntry>> _read() async {
    final f = File(filePath);
    if (!await f.exists()) return {};
    try {
      final list = (jsonDecode(await f.readAsString()) as List)
          .cast<Map<String, dynamic>>();
      return {
        for (final m in list)
          m['providerId'].toString(): ScamBlocklistEntry.fromJson(m),
      };
    } catch (_) {
      return {};
    }
  }

  Future<void> _write(Map<String, ScamBlocklistEntry> entries) async {
    final f = File(filePath);
    await f.parent.create(recursive: true);
    await f.writeAsString(
      jsonEncode(entries.values.map((e) => e.toJson()).toList()),
    );
  }

  @override
  Future<bool> isBanned(String providerId) async =>
      (await _read()).containsKey(providerId);

  @override
  Future<void> ban(ScamBlocklistEntry entry) async {
    final map = await _read();
    map[entry.providerId] = entry;
    await _write(map);
  }

  @override
  Future<List<ScamBlocklistEntry>> all() async => (await _read()).values.toList();
}
