import 'package:flutter/material.dart';

import 'consent/terms_consent_service.dart';
import 'consent/terms_consent_storage.dart';
import 'consent/terms_gate.dart';
import 'i18n/app_locale.dart';
import 'i18n/i18n_keys.dart';
import 'i18n/i18n_service.dart';
import 'models/product.dart';
import 'services/shopee_service.dart';

void main() {
  final consent = TermsConsentService(storage: InMemoryTermsConsentStorage());
  final i18n = I18nService(initial: AppLocale.en);
  runApp(PauliBestPriceApp(consent: consent, i18n: i18n));
}

class PauliBestPriceApp extends StatelessWidget {
  const PauliBestPriceApp({super.key, required this.consent, required this.i18n});

  final TermsConsentService consent;
  final I18nService i18n;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: i18n,
      builder: (context, _) => MaterialApp(
        title: i18n.t(I18nKeys.appTitle),
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFD4AF37)),
          useMaterial3: true,
        ),
        home: TermsGate(
          consent: consent,
          i18n: i18n,
          child: ProductSearchScreen(i18n: i18n),
        ),
      ),
    );
  }
}

class ProductSearchScreen extends StatefulWidget {
  const ProductSearchScreen({super.key, required this.i18n});

  final I18nService i18n;

  @override
  State<ProductSearchScreen> createState() => _ProductSearchScreenState();
}

class _ProductSearchScreenState extends State<ProductSearchScreen> {
  final _controller = TextEditingController(text: 'smartphone');
  final _shopee = ShopeeService();
  List<Product> _products = [];
  bool _loading = false;
  String? _errorKey;

  Future<void> _search() async {
    final q = _controller.text.trim();
    if (q.isEmpty) return;
    setState(() {
      _loading = true;
      _errorKey = null;
    });
    final results = await _shopee.fetchProducts(q);
    if (!mounted) return;
    setState(() {
      _products = results;
      _loading = false;
      if (results.isEmpty) {
        _errorKey = I18nKeys.searchNoResults;
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _changeLocale(AppLocale? l) {
    if (l != null) widget.i18n.setLocale(l);
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.i18n.t;
    return Scaffold(
      appBar: AppBar(
        title: Text(t(I18nKeys.appTitle).toUpperCase()),
        backgroundColor: const Color(0xFF1C0638),
        foregroundColor: const Color(0xFFF6F0DC),
        actions: [
          PopupMenuButton<AppLocale>(
            tooltip: t(I18nKeys.navSettings),
            initialValue: widget.i18n.locale,
            onSelected: _changeLocale,
            itemBuilder: (_) => [
              for (final l in AppLocale.values)
                PopupMenuItem(value: l, child: Text(l.nativeName)),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(child: Text(widget.i18n.locale.code.toUpperCase())),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      labelText: t(I18nKeys.searchHint),
                      border: const OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _search(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _loading ? null : _search,
                  child: Text(t(I18nKeys.searchButton)),
                ),
              ],
            ),
          ),
          if (_loading) const LinearProgressIndicator(minHeight: 2),
          if (_errorKey != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(t(_errorKey!), style: const TextStyle(color: Colors.orange)),
            ),
          Expanded(
            child: ListView.builder(
              itemCount: _products.length,
              itemBuilder: (context, index) {
                final p = _products[index];
                return ListTile(
                  title: Text(p.name),
                  subtitle: Text(
                    '${p.finalPrice.toStringAsFixed(2)} THB · ${p.productUrl}',
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
