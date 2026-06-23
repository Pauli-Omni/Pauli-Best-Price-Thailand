import 'dart:math';

import 'package:flutter/material.dart';

/// Zeigt beim App-Start eine 360°-Coin-Spin-Animation (≈1.2 s),
/// danach Fade-Out → Navigator wechselt zur Haupt-App ('/app').
class PauliSplashScreen extends StatefulWidget {
  const PauliSplashScreen({super.key});

  @override
  State<PauliSplashScreen> createState() => _PauliSplashScreenState();
}

class _PauliSplashScreenState extends State<PauliSplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  /// Coin dreht sich von 0 → 2π (volle 360°) in den ersten 80 % der Zeit.
  late final Animation<double> _spin;

  /// Splash blendet sich in den letzten 20 % aus.
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();

    _ctrl = AnimationController(
      vsync: this,
      // 1.2 s Spin + 0.3 s Fade = 1.5 s gesamt
      duration: const Duration(milliseconds: 1500),
    );

    _spin = Tween<double>(begin: 0.0, end: 2 * pi).animate(
      CurvedAnimation(
        parent: _ctrl,
        // EaseInOutCubic: startet weich, dreht sich knackig durch die Mitte
        curve: const Interval(0.0, 0.80, curve: Curves.easeInOutCubic),
      ),
    );

    _fade = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.80, 1.0, curve: Curves.easeIn),
      ),
    );

    _ctrl.forward().whenComplete(() {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/app');
      }
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final coinSize = MediaQuery.of(context).size.width * 0.60;

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      body: AnimatedBuilder(
        animation: _ctrl,
        builder: (context, _) {
          final angle = _spin.value;
          // Zeige Vorderseite wenn cos(angle) ≥ 0, sonst Rückseite
          final showFront = cos(angle) >= 0;

          return Opacity(
            opacity: _fade.value,
            child: Center(
              child: Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.0008) // Perspektive
                  ..rotateY(angle),
                child: showFront
                    ? Image.asset(
                        'Frontseite02.png',
                        width: coinSize,
                        height: coinSize,
                        fit: BoxFit.contain,
                      )
                    // Rückseite: gegen-rotieren damit sie nicht gespiegelt erscheint
                    : Transform(
                        alignment: Alignment.center,
                        transform: Matrix4.identity()..rotateY(pi),
                        child: Image.asset(
                          'hinterseite.png',
                          width: coinSize,
                          height: coinSize,
                          fit: BoxFit.contain,
                        ),
                      ),
              ),
            ),
          );
        },
      ),
    );
  }
}
