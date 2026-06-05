/// Sprachausgabemodi der VoiceEngine.
enum VoiceMode {
  normal,
  whisper;

  bool get isWhisper => this == VoiceMode.whisper;
}
