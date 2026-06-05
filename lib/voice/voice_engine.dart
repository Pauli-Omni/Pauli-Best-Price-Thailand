import 'voice_mode.dart';
import 'whisper_mode_settings.dart';

class VoicePlayback {
  const VoicePlayback({
    required this.text,
    required this.mode,
    required this.volume,
    required this.pitch,
    required this.rate,
  });

  final String text;
  final VoiceMode mode;
  final double volume;
  final double pitch;
  final double rate;
}

/// Universelle Sprachausgabe-Engine für alle Bereiche der App.
/// Unterstützt den WhisperMode (hauchige, leise Sprachausgabe bei Nacht).
/// TODO: Konkrete Implementierung mit `flutter_tts` bzw. ElevenLabs-Stream
/// im Webclient (siehe `index.html`).
abstract class VoiceEngine {
  VoiceMode get currentMode;
  Future<void> setMode(VoiceMode mode);
  Future<void> speak(String text);
}

/// Default-Implementierung — bereitet bereits die korrekten Audio-Parameter
/// vor. Eine konkrete TTS-Lib muss `play()` überschreiben.
abstract class BaseVoiceEngine implements VoiceEngine {
  BaseVoiceEngine({
    this.normalVolume = 0.9,
    this.normalPitch = 1.0,
    this.normalRate = 0.5,
    WhisperModeSettings? whisper,
  }) : whisper = whisper ?? const WhisperModeSettings();

  final double normalVolume;
  final double normalPitch;
  final double normalRate;
  final WhisperModeSettings whisper;

  VoiceMode _mode = VoiceMode.normal;

  @override
  VoiceMode get currentMode => _mode;

  @override
  Future<void> setMode(VoiceMode mode) async {
    _mode = mode;
  }

  @override
  Future<void> speak(String text) {
    final params = _mode.isWhisper
        ? VoicePlayback(
            text: text,
            mode: _mode,
            volume: whisper.volume,
            pitch: whisper.pitch,
            rate: whisper.rate,
          )
        : VoicePlayback(
            text: text,
            mode: _mode,
            volume: normalVolume,
            pitch: normalPitch,
            rate: normalRate,
          );
    return play(params);
  }

  /// In der konkreten TTS-Implementierung überschreiben.
  Future<void> play(VoicePlayback playback);
}

/// Test-/Fallback-Implementierung, die keine echte Audioausgabe macht,
/// aber die Parameter-Pipeline verifiziert.
class LoggingVoiceEngine extends BaseVoiceEngine {
  final List<VoicePlayback> history = [];

  @override
  Future<void> play(VoicePlayback playback) async {
    history.add(playback);
  }
}
