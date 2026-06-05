import 'dart:convert';
import 'dart:io';

import '../../models/price_alert.dart';

abstract class PriceAlertStorage {
  Future<List<PriceAlert>> loadAll();
  Future<void> save(PriceAlert alert);
  Future<void> delete(String id);
}

/// In-Memory-Fallback (z. B. für Unit-Tests).
class InMemoryPriceAlertStorage implements PriceAlertStorage {
  final Map<String, PriceAlert> _alerts = {};

  @override
  Future<List<PriceAlert>> loadAll() async => _alerts.values.toList();

  @override
  Future<void> save(PriceAlert alert) async {
    _alerts[alert.id] = alert;
  }

  @override
  Future<void> delete(String id) async {
    _alerts.remove(id);
  }
}

/// Datei-basierte Persistenz (`<filePath>` z. B. unter
/// `getApplicationSupportDirectory()/price_alerts.json`). Kein zusätzliches
/// Paket nötig — speichert `targetPrice` & Co. dauerhaft auf dem Gerät.
class JsonFilePriceAlertStorage implements PriceAlertStorage {
  JsonFilePriceAlertStorage(this.filePath);

  final String filePath;

  Future<Map<String, PriceAlert>> _read() async {
    final f = File(filePath);
    if (!await f.exists()) return {};
    try {
      final raw = await f.readAsString();
      if (raw.trim().isEmpty) return {};
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      return {for (final m in list) m['id'].toString(): PriceAlert.fromJson(m)};
    } catch (_) {
      return {};
    }
  }

  Future<void> _write(Map<String, PriceAlert> alerts) async {
    final f = File(filePath);
    await f.parent.create(recursive: true);
    await f.writeAsString(
      jsonEncode(alerts.values.map((a) => a.toJson()).toList()),
    );
  }

  @override
  Future<List<PriceAlert>> loadAll() async => (await _read()).values.toList();

  @override
  Future<void> save(PriceAlert alert) async {
    final map = await _read();
    map[alert.id] = alert;
    await _write(map);
  }

  @override
  Future<void> delete(String id) async {
    final map = await _read();
    map.remove(id);
    await _write(map);
  }
}
