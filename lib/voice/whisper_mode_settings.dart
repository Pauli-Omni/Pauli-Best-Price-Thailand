/// Parametersatz für den hauchigen Nacht-Modus der Sprachausgabe.
class WhisperModeSettings {
  const WhisperModeSettings({
    this.volume = 0.18,
    this.pitch = 0.85,
    this.rate = 0.46,
    this.breathiness = 0.65,
  });

  final double volume;
  final double pitch;
  final double rate;
  final double breathiness;
}
