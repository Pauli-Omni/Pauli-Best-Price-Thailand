#!/usr/bin/env bash
# Multi-store artifact export for Pauli Best Price (Flutter).
# Requires: Flutter SDK (./.flutter-sdk), Android SDK (ANDROID_HOME), Xcode for iOS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLUTTER="${ROOT}/.flutter-sdk/bin/flutter"
OUT="${ROOT}/build/store-exports"
export FLUTTER_SUPPRESS_ANALYTICS=true

mkdir -p "$OUT"

echo "==> Pauli Best Price — store artifacts"
echo "    Package: com.omnisolutions.pauli_best_price"
echo "    Output:  $OUT"
echo ""

if [[ ! -x "$FLUTTER" ]]; then
  echo "ERROR: Flutter not found at $FLUTTER"
  exit 1
fi

cd "$ROOT"

build_android() {
  if [[ -z "${ANDROID_HOME:-}" ]] && [[ ! -d "$HOME/Library/Android/sdk" ]]; then
    echo "SKIP Android: ANDROID_HOME not set / no SDK"
    return 1
  fi
  export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

  echo "==> flutter build appbundle (Google Play / Samsung / Xiaomi …)"
  "$FLUTTER" build appbundle --release
  cp -f build/app/outputs/bundle/release/app-release.aab "$OUT/pauli-best-price-google-play.aab"

  echo "==> flutter build apk (Side-load / Aptoide / testing)"
  "$FLUTTER" build apk --release
  cp -f build/app/outputs/flutter-apk/app-release.apk "$OUT/pauli-best-price-universal.apk"

  echo "OK Android artifacts in $OUT"
}

build_ios() {
  if ! command -v xcodebuild >/dev/null 2>&1; then
    echo "SKIP iOS: Xcode not available"
    return 1
  fi
  echo "==> flutter build ipa (Apple App Store — signing required)"
  echo "    Configure signing in Xcode: ios/Runner.xcworkspace"
  "$FLUTTER" build ipa --release || {
    echo "WARN: ipa build failed — set Team + Distribution cert in Xcode first"
    return 1
  }
  if compgen -G "build/ios/ipa/*.ipa" >/dev/null; then
    cp -f build/ios/ipa/*.ipa "$OUT/" 2>/dev/null || true
  fi
  echo "OK iOS artifact (if signing succeeded)"
}

build_android || true
build_ios || true

echo ""
echo "Done. Upload matrix:"
echo "  Google Play     → pauli-best-price-google-play.aab"
echo "  Samsung/Xiaomi  → .aab or .apk per portal"
echo "  Aptoide         → pauli-best-price-universal.apk"
echo "  Apple           → .ipa via Transporter"
