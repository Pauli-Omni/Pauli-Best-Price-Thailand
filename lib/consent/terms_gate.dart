import 'package:flutter/material.dart';

import '../i18n/i18n_keys.dart';
import '../i18n/i18n_service.dart';
import 'terms_consent_service.dart';

/// Harte Start-Logik: zeigt die AGB beim ersten App-Start und blockiert
/// jeden weiteren Zugriff, solange der Nutzer nicht aktiv zustimmt.
/// Sämtliche Texte kommen aus dem I18nService — kein Hardcoding.
class TermsGate extends StatefulWidget {
  const TermsGate({
    super.key,
    required this.consent,
    required this.i18n,
    required this.child,
  });

  final TermsConsentService consent;
  final I18nService i18n;
  final Widget child;

  @override
  State<TermsGate> createState() => _TermsGateState();
}

class _TermsGateState extends State<TermsGate> {
  late Future<bool> _accepted;

  @override
  void initState() {
    super.initState();
    _accepted = widget.consent.hasAccepted();
  }

  Future<void> _accept() async {
    await widget.consent.accept();
    if (!mounted) return;
    setState(() => _accepted = Future.value(true));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.i18n,
      builder: (context, _) {
        return FutureBuilder<bool>(
          future: _accepted,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Scaffold(body: Center(child: CircularProgressIndicator()));
            }
            if (snap.data == true) return widget.child;
            return _ConsentScreen(i18n: widget.i18n, onAccept: _accept);
          },
        );
      },
    );
  }
}

class _ConsentScreen extends StatefulWidget {
  const _ConsentScreen({required this.i18n, required this.onAccept});

  final I18nService i18n;
  final Future<void> Function() onAccept;

  @override
  State<_ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<_ConsentScreen> {
  bool _checked = false;

  @override
  Widget build(BuildContext context) {
    final t = widget.i18n.t;
    return PopScope(
      canPop: false,
      child: Scaffold(
        appBar: AppBar(
          title: Text(t(I18nKeys.consentTitle)),
          automaticallyImplyLeading: false,
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  t(I18nKeys.appTitle),
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: SingleChildScrollView(
                    child: Text(t(I18nKeys.consentBody)),
                  ),
                ),
                CheckboxListTile(
                  value: _checked,
                  onChanged: (v) => setState(() => _checked = v ?? false),
                  title: Text(t(I18nKeys.consentCheckbox)),
                ),
                FilledButton(
                  onPressed: _checked ? () => widget.onAccept() : null,
                  child: Text(t(I18nKeys.consentAccept)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
