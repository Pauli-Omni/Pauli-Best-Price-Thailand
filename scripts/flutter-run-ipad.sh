#!/usr/bin/env bash
# Wartet auf ein bereites iPad und startet die Flutter-App.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLUTTER="$ROOT/.flutter-sdk/bin/flutter"
DEVICE_ID="${1:-e4c127d7d45514bb5e65cd6b4e458a47e287ed50}"
MAX_WAIT="${MAX_WAIT:-600}"

cd "$ROOT"

echo "Warte auf iPad (max. ${MAX_WAIT}s) …"
echo "Bitte iPad entsperren, per USB verbinden und „Diesem Computer vertrauen“ bestätigen."
deadline=$((SECONDS + MAX_WAIT))
while (( SECONDS < deadline )); do
  if xcrun xcdevice list 2>/dev/null | python3 -c "
import json, sys
devices = json.load(sys.stdin)
for d in devices:
    if d.get('identifier') == '$DEVICE_ID' and d.get('available') is True:
        sys.exit(0)
sys.exit(1)
" 2>/dev/null; then
    echo "iPad bereit."
    break
  fi
  sleep 5
done

if ! xcrun xcdevice list 2>/dev/null | python3 -c "
import json, sys
devices = json.load(sys.stdin)
for d in devices:
    if d.get('identifier') == '$DEVICE_ID' and d.get('available') is True:
        sys.exit(0)
sys.exit(1)
" 2>/dev/null; then
  echo "iPad noch nicht bereit. Fehlerdetails:"
  xcrun xcdevice list 2>/dev/null | python3 -c "
import json, sys
for d in json.load(sys.stdin):
    if d.get('platform') == 'com.apple.platform.iphoneos':
        print('-', d.get('name'), '| available:', d.get('available'), '|', (d.get('error') or {}).get('description', ''))
" || true
  exit 1
fi

echo "Starte Flutter auf iPad …"
exec "$FLUTTER" run -d "$DEVICE_ID"
