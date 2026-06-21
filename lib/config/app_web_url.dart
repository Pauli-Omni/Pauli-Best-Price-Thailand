/// Native shell loads the live Pauli web app (override at build time).
/// Example: flutter build apk --dart-define=PAULI_WEB_URL=https://example.com/
const String kPauliWebAppUrl = String.fromEnvironment(
  'PAULI_WEB_URL',
  defaultValue: 'https://pauli-best-price-api.onrender.com/',
);
