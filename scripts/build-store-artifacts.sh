#!/usr/bin/env bash
# Multi-platform artifacts: Android APK/AAB, iOS IPA, macOS, Windows, Linux + public/downloads sync.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLUTTER="${ROOT}/.flutter-sdk/bin/flutter"
OUT="${ROOT}/build/store-exports"
DL="${ROOT}/public/downloads"
PAULI_WEB_URL="${PAULI_WEB_URL:-https://pauli-best-price-api-nzbl.onrender.com/}"
DART_DEFINE=(--dart-define="PAULI_WEB_URL=${PAULI_WEB_URL}")
export FLUTTER_SUPPRESS_ANALYTICS=true

mkdir -p "$OUT" "$DL"

echo "==> Avatar asset gate (5 loops required for store builds)"
node "$ROOT/scripts/verify-avatar-assets.mjs"

sync_avatar_assets() {
  local src="$ROOT/public/assets/avatar"
  local dst="$ROOT/assets/avatar"
  mkdir -p "$dst"
  if compgen -G "$src/*.mp4" >/dev/null; then
    cp -f "$src"/*.mp4 "$dst"/ 2>/dev/null || true
    echo "    synced avatar MP4 → assets/avatar/"
  fi
}
sync_avatar_assets

echo "==> Pauli Best Price — multi-platform store / sideload exports"
echo "    WebView URL: $PAULI_WEB_URL"
echo "    Package:     com.omnisolutions.pauli_best_price"
echo "    Output:      $OUT"
echo "    Downloads:   $DL"
echo ""

if [[ ! -x "$FLUTTER" ]]; then
  if command -v flutter >/dev/null 2>&1; then
    FLUTTER="$(command -v flutter)"
  else
    echo "ERROR: Flutter not found (.flutter-sdk or PATH)."
    exit 1
  fi
fi

cd "$ROOT"
"$FLUTTER" pub get

ensure_platforms() {
  local need=()
  [[ ! -d windows ]] && need+=(windows)
  [[ ! -d linux ]] && need+=(linux)
  [[ ! -d web ]] && need+=(web)
  if ((${#need[@]})); then
    echo "==> flutter create --platforms=$(IFS=,; echo "${need[*]}")"
    "$FLUTTER" create --platforms="$(IFS=,; echo "${need[*]}")" .
  fi
}

sync_downloads() {
  local names=(
    pauli-best-price-universal.apk
    pauli-best-price-macos.zip
    pauli-best-price-windows.zip
    pauli-best-price-linux.tar.gz
  )
  for n in "${names[@]}"; do
    if [[ -f "$OUT/$n" ]]; then
      cp -f "$OUT/$n" "$DL/$n"
      echo "    synced → public/downloads/$n"
    fi
  done
}

build_android() {
  if [[ -z "${ANDROID_HOME:-}" ]] && [[ ! -d "$HOME/Library/Android/sdk" ]]; then
    echo "SKIP Android: ANDROID_HOME not set / no SDK"
    return 1
  fi
  export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  echo "==> flutter build appbundle"
  "$FLUTTER" build appbundle --release "${DART_DEFINE[@]}" || return 1
  cp -f build/app/outputs/bundle/release/app-release.aab "$OUT/pauli-best-price-google-play.aab"
  echo "==> flutter build apk (Aptoide / sideload)"
  "$FLUTTER" build apk --release "${DART_DEFINE[@]}" || return 1
  cp -f build/app/outputs/flutter-apk/app-release.apk "$OUT/pauli-best-price-universal.apk"
  echo "OK Android"
}

build_ios() {
  if ! command -v xcodebuild >/dev/null 2>&1; then
    echo "SKIP iOS: Xcode not available"
    return 1
  fi
  echo "==> flutter build ipa (Apple signing required for device install)"
  "$FLUTTER" build ipa --release "${DART_DEFINE[@]}" || {
    echo "WARN: ipa failed — use PWA on iPhone/iPad or configure Xcode signing"
    return 1
  }
  if compgen -G "build/ios/ipa/*.ipa" >/dev/null; then
    cp -f build/ios/ipa/*.ipa "$OUT/" 2>/dev/null || true
  fi
  echo "OK iOS (if signing succeeded)"
}

build_macos() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "SKIP macOS: not on Darwin host"
    return 1
  fi
  echo "==> flutter build macos"
  "$FLUTTER" build macos --release "${DART_DEFINE[@]}"
  local app="build/macos/Build/Products/Release/pauli_best_price.app"
  if [[ -d "$app" ]]; then
    (cd "$(dirname "$app")" && zip -r -y "$OUT/pauli-best-price-macos.zip" "$(basename "$app")")
    echo "OK macOS zip"
  else
    echo "WARN: macOS .app not found at $app"
    return 1
  fi
}

build_windows() {
  if [[ "$(uname -s)" == "Darwin" ]] || [[ "$(uname -s)" == "Linux" ]]; then
    echo "SKIP Windows: build on Windows host (or CI)"
    return 1
  fi
  echo "==> flutter build windows"
  "$FLUTTER" build windows --release "${DART_DEFINE[@]}"
  local dir="build/windows/x64/runner/Release"
  if [[ -d "$dir" ]]; then
    (cd "$dir" && zip -r -y "$OUT/pauli-best-price-windows.zip" .)
    echo "OK Windows zip"
  fi
}

build_linux() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    echo "SKIP Linux: build on Linux host (or CI)"
    return 1
  fi
  echo "==> flutter build linux"
  "$FLUTTER" build linux --release "${DART_DEFINE[@]}"
  local dir="build/linux/x64/release/bundle"
  if [[ -d "$dir" ]]; then
    tar -czf "$OUT/pauli-best-price-linux.tar.gz" -C "$dir" .
    echo "OK Linux tar.gz"
  fi
}

ensure_platforms
build_android || true
build_ios || true
build_macos || true
build_windows || true
build_linux || true
sync_downloads

echo ""
echo "Done. Distribution matrix:"
echo "  PWA (all)       → /download  (iPhone, iPad, Android, Mac, Win, Linux browsers)"
echo "  Android APK     → public/downloads/pauli-best-price-universal.apk (Aptoide / sideload)"
echo "  macOS           → public/downloads/pauli-best-price-macos.zip"
echo "  Windows         → public/downloads/pauli-best-price-windows.zip"
echo "  Linux           → public/downloads/pauli-best-price-linux.tar.gz"
echo "  Apple IPA       → build/store-exports/*.ipa (TestFlight / AltStore — signing required)"
echo "  Google Play     → build/store-exports/pauli-best-price-google-play.aab"
