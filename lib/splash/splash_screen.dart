import 'dart:math' as math;

import 'package:flutter/material.dart';

class SplashAnimationScreen extends StatefulWidget {
  final VoidCallback onFinish;

  const SplashAnimationScreen({super.key, required this.onFinish});

  @override
  State<SplashAnimationScreen> createState() => _SplashAnimationScreenState();
}

class _SplashAnimationScreenState extends State<SplashAnimationScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();

    // Gesamtdauer exakt 1.5 Sekunden
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    // Phase 1: 0.0 bis 1.2 Sekunden → 360° Drehung mit easeInOutCubic
    _rotationAnimation = Tween<double>(begin: 0.0, end: 2 * math.pi).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.8, curve: Curves.easeInOutCubic),
      ),
    );

    // Phase 2: 1.2 bis 1.5 Sekunden → weiches Ausblenden (1.0 → 0.0)
    _opacityAnimation = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.8, 1.0, curve: Curves.linear),
      ),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onFinish();
      }
    });

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (ctx, child) {
            final angle = _rotationAnimation.value;
            final isFront =
                angle < math.pi / 2 || angle > 3 * math.pi / 2;

            return Opacity(
              opacity: _opacityAnimation.value,
              child: Transform(
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.002)
                  ..rotateY(angle),
                alignment: Alignment.center,
                child: isFront
                    ? Image.asset(
                        'assets/images/Frontseite02.png',
                        width: 180,
                        height: 180,
                      )
                    : Transform(
                        alignment: Alignment.center,
                        transform: Matrix4.identity()..rotateY(math.pi),
                        child: Image.asset(
                          'assets/images/hinterseite.png',
                          width: 180,
                          height: 180,
                        ),
                      ),
              ),
            );
          },
        ),
      ),
    );
  }
}
