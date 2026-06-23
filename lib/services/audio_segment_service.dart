import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart' show rootBundle;

/// Zeitfenster innerhalb einer Master-MP3 (z. B. [search_intro_long.mp3]).
class AudioSegment {
  const AudioSegment({required this.startMs, required this.endMs});

  final int startMs;
  final int endMs;
}

/// Spielt exakte Segmente aus einer langen Pauli-Aufnahme — ohne mehrere API-Calls.
class AudioSegmentService {
  AudioSegmentService({AudioPlayer? player}) : _player = player ?? AudioPlayer();

  final AudioPlayer _player;
  StreamSubscription<Duration>? _positionSub;
  Timer? _endTimer;
  var _playing = false;

  static const String masterAssetPath = 'audio/search_intro_long.mp3';
  static const String masterAssetBundle = 'assets/audio/search_intro_long.mp3';

  static const Map<String, AudioSegment> segments = {
    'welcome_short': AudioSegment(startMs: 0, endMs: 4000),
    'search_action': AudioSegment(startMs: 4000, endMs: 8000),
    'save_money': AudioSegment(startMs: 8000, endMs: 14000),
  };

  static const Map<String, String> speechKeyToSegment = {
    'pauliSawadee': 'welcome_short',
    'search_processing': 'search_action',
    'fun_crab_instinct': 'save_money',
    'accessibility_activated': 'welcome_short',
  };

  static String? segmentKeyFor({String? speechKey, String? segmentKey}) {
    if (segmentKey != null && segmentKey.isNotEmpty) return segmentKey;
    if (speechKey == null || speechKey.isEmpty) return null;
    return speechKeyToSegment[speechKey];
  }

  Future<bool> _masterAssetExists() async {
    try {
      await rootBundle.load(masterAssetBundle);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _cancelWatchers() async {
    _playing = false;
    _endTimer?.cancel();
    _endTimer = null;
    await _positionSub?.cancel();
    _positionSub = null;
  }

  /// [audioPath] — Asset-Pfad (Standard) oder optional Device-Pfad via [devicePath].
  Future<bool> playSegment(
    String segmentKey, {
    String audioPath = masterAssetPath,
    String? devicePath,
  }) async {
    final segment = segments[segmentKey];
    if (segment == null) return false;

    await stop();

    try {
      if (devicePath != null && devicePath.isNotEmpty) {
        await _player.setSource(DeviceFileSource(devicePath));
      } else {
        if (!await _masterAssetExists()) return false;
        await _player.setSource(AssetSource(audioPath));
      }

      await _player.seek(Duration(milliseconds: segment.startMs));
      _playing = true;
      await _player.resume();

      final endMs = segment.endMs;
      _positionSub = _player.onPositionChanged.listen((position) {
        if (!_playing) return;
        if (position.inMilliseconds >= endMs) {
          unawaited(stop());
        }
      });

      _endTimer = Timer(
        Duration(milliseconds: (endMs - segment.startMs) + 180),
        () {
          if (_playing) unawaited(stop());
        },
      );
      return true;
    } catch (_) {
      await _cancelWatchers();
      return false;
    }
  }

  Future<void> stop() async {
    await _cancelWatchers();
    try {
      await _player.pause();
    } catch (_) {}
  }

  Future<void> dispose() async {
    await stop();
    await _player.dispose();
  }
}
