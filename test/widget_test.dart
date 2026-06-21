import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pauli_best_price/webview_shell.dart';

void main() {
  testWidgets('Pauli web shell app builds', (tester) async {
    await tester.pumpWidget(const PauliWebShellApp());
    await tester.pump();
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
