import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'avatar/avatar_animation_service.dart';
import 'config/app_web_url.dart';
import 'splash/splash_screen.dart';

class PauliWebShellApp extends StatelessWidget {
  const PauliWebShellApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFD4AF37)),
        scaffoldBackgroundColor: const Color(0xFF0D0D0D),
        useMaterial3: true,
      ),
      // Splash zuerst, dann WebView — kein Home-Import in splash_screen.dart nötig
      initialRoute: '/',
      routes: {
        '/':    (_) => const PauliSplashScreen(),
        '/app': (_) => const PauliWebViewScreen(),
      },
    );
  }
}

class PauliWebViewScreen extends StatefulWidget {
  const PauliWebViewScreen({super.key});

  @override
  State<PauliWebViewScreen> createState() => _PauliWebViewScreenState();
}

class _PauliWebViewScreenState extends State<PauliWebViewScreen> {
  late final WebViewController _controller;
  var _loading = true;
  String? _error;

  // Cached after first didChangeDependencies — safe to use in callbacks.
  late AvatarAnimationService _avatarSvc;
  bool _controllerReady = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _avatarSvc = context.read<AvatarAnimationService>();
    if (!_controllerReady) {
      _controllerReady = true;
      _initController();
    }
  }

  void _initController() {
    final uri = Uri.tryParse(kPauliWebAppUrl);
    if (uri == null || !uri.hasScheme) {
      setState(() {
        _error = 'invalid_url';
        _loading = false;
      });
      return;
    }
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0D0D0D))
      // JavaScript-Brücke: Web-App ruft
      //   window.AvatarAnimationChannel.postMessage('CRAB_DANCE')
      // → Flutter empfängt und spielt Animation ab.
      ..addJavaScriptChannel(
        'AvatarAnimationChannel',
        onMessageReceived: (msg) {
          if (!mounted) return;
          _avatarSvc.playAnimation(msg.message);
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (err) {
            if (!mounted) return;
            setState(() {
              _loading = false;
              _error = err.description;
            });
          },
        ),
      )
      ..loadRequest(uri);
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    await _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    if (_error == 'invalid_url') {
      return const Scaffold(
        body: Center(child: Text('Invalid PAULI_WEB_URL')),
      );
    }
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            if (_loading) const LinearProgressIndicator(minHeight: 2),
            if (_error != null)
              Material(
                color: Colors.orange.shade900,
                child: ListTile(
                  title: Text(
                    _error!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: _reload,
                  ),
                ),
              ),
            Expanded(
              child: Stack(
                children: [
                  WebViewWidget(controller: _controller),
                  // Unsichtbare Touch-Zone über der 3D-Münze.
                  // Das echte Visual ist das Three.js-Coin-Objekt im WebView darunter.
                  _AvatarAnimationOverlay(webController: _controller),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Avatar-Touch-Zone — unsichtbar, draggable, steuert Three.js via JS-Bridge
//
// Kein eigenes Visual: die 3D-Münze (Frontseite.jpeg in Three.js) im WebView
// ist Paulis echte Darstellung. Dieses Widget ist nur die greifbare Eingabe-Fläche.
//
// Flutter → Web:   runJavaScript  → window.trigger3DAvatar(key)
// Web    → Flutter: AvatarAnimationChannel.postMessage(key) → AvatarAnimationService
// ---------------------------------------------------------------------------

class _AvatarAnimationOverlay extends StatefulWidget {
  const _AvatarAnimationOverlay({required this.webController});

  final WebViewController webController;

  @override
  State<_AvatarAnimationOverlay> createState() =>
      _AvatarAnimationOverlayState();
}

class _AvatarAnimationOverlayState extends State<_AvatarAnimationOverlay> {
  /// Startposition deckt die Münze im Standard-Layout ab — frei verschiebbar.
  Offset _position = const Offset(200.0, 500.0);

  void _triggerJS(String animKey) {
    widget.webController.runJavaScript(
      "if(window.trigger3DAvatar) window.trigger3DAvatar('$animKey');",
    );
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: _position.dx,
      top: _position.dy,
      child: GestureDetector(
        // Transparent-Zone muss explizit auf Touches reagieren
        behavior: HitTestBehavior.opaque,
        onTap: () => _triggerJS('SPEAK_FORWARD'),
        onPanStart: (_) => _triggerJS('EXIT_COIN_CHAIR'),
        onPanUpdate: (details) {
          setState(() => _position += details.delta);
        },
        child: const MouseRegion(
          cursor: SystemMouseCursors.grab,
          // Unsichtbare 80×80-Fläche — Three.js rendert die Münze darunter
          child: SizedBox(width: 80, height: 80),
        ),
      ),
    );
  }
}
