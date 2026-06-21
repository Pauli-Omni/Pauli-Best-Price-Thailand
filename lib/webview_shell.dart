import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'config/app_web_url.dart';

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
      home: const PauliWebViewScreen(),
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

  @override
  void initState() {
    super.initState();
    final uri = Uri.tryParse(kPauliWebAppUrl);
    if (uri == null || !uri.hasScheme) {
      _error = 'invalid_url';
      _loading = false;
      return;
    }
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0D0D0D))
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
                  title: Text(_error!, maxLines: 2, overflow: TextOverflow.ellipsis),
                  trailing: IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: _reload,
                  ),
                ),
              ),
            Expanded(child: WebViewWidget(controller: _controller)),
          ],
        ),
      ),
    );
  }
}
