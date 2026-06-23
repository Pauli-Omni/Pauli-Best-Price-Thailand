import 'package:flutter/material.dart';

enum AvatarState { idle, waving, laughing, winking, dancing }

/// Übersetzt Animations-Befehle aus dem Backend/FunPhraseService in
/// Flutter-Avatar-Zustände und setzt den Avatar nach [_resetAfterMs] ms
/// automatisch in [AvatarState.idle] zurück.
class AvatarAnimationService extends ChangeNotifier {
  AvatarState _currentState = AvatarState.idle;

  static const Duration _resetAfterMs = Duration(seconds: 4);

  AvatarState get currentState => _currentState;

  /// Schlüssel müssen mit den Konstanten in `fun-phrase-service.js` übereinstimmen.
  void playAnimation(String animationKey) {
    switch (animationKey) {
      case 'WINK_SMILE':
        _currentState = AvatarState.winking;
      case 'LAUGH_TRIUMPH':
        _currentState = AvatarState.laughing;
      case 'CRAB_DANCE':
      case 'HAPPY_JUMP':
        _currentState = AvatarState.dancing;
      case 'GREETING':
        _currentState = AvatarState.waving;
      default:
        _currentState = AvatarState.idle;
    }

    notifyListeners();

    Future.delayed(_resetAfterMs, () {
      _currentState = AvatarState.idle;
      notifyListeners();
    });
  }
}
