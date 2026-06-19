import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../i18n/i18n_keys.dart';
import '../i18n/i18n_service.dart';
import 'terms_consent_service.dart';

/// Start-Logik: AGB beim ersten App-Start. Ohne Zustimmung kein Zugriff;
/// bei Ablehnung freundlicher Hinweis und sauberer Abbruch — ohne Sperr-Flag.
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
  bool _declined = false;

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

  void _showDeclineFarewell() {
    setState(() => _declined = true);
  }

  void _exitAfterDecline() {
    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.i18n,
      builder: (context, _) {
        if (_declined) {
          return _DeclineFarewellScreen(
            i18n: widget.i18n,
            onExit: _exitAfterDecline,
          );
        }
        return FutureBuilder<bool>(
          future: _accepted,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            if (snap.data == true) return widget.child;
            return _ConsentScreen(
              i18n: widget.i18n,
              onAccept: _accept,
              onDecline: _showDeclineFarewell,
            );
          },
        );
      },
    );
  }
}

class _ConsentScreen extends StatefulWidget {
  const _ConsentScreen({
    required this.i18n,
    required this.onAccept,
    required this.onDecline,
  });

  final I18nService i18n;
  final Future<void> Function() onAccept;
  final VoidCallback onDecline;

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
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        widget.onDecline();
      },
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
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
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
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: widget.onDecline,
                  child: Text(t(I18nKeys.consentDecline)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DeclineFarewellScreen extends StatelessWidget {
  const _DeclineFarewellScreen({
    required this.i18n,
    required this.onExit,
  });

  final I18nService i18n;
  final VoidCallback onExit;

  @override
  Widget build(BuildContext context) {
    final t = i18n.t;
    return PopScope(
      canPop: false,
      child: Scaffold(
        appBar: AppBar(
          title: Text(t(I18nKeys.consentDeclineTitle)),
          automaticallyImplyLeading: false,
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  t(I18nKeys.consentDeclineLead),
                  style: const TextStyle(fontSize: 16, height: 1.45),
                ),
                const SizedBox(height: 16),
                Text(
                  t(I18nKeys.consentDeclineDoorOpen),
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.45,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: onExit,
                  child: Text(t(I18nKeys.consentDeclineExit)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
