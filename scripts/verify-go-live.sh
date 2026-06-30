#!/usr/bin/env bash
# Go-Live smoke checks — GitHub sync, secrets, assets, DNS, Render health.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}OK${NC}  $*"; }
warn() { echo -e "${YELLOW}WARN${NC} $*"; }
fail() { echo -e "${RED}FAIL${NC} $*"; }

echo "=== Pauli Best Price Thailand — Go-Live Check ==="
echo ""

# --- Git / GitHub ---
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  LOCAL="$(git rev-parse HEAD)"
  if git remote get-url origin >/dev/null 2>&1; then
    REMOTE="$(git ls-remote origin refs/heads/main 2>/dev/null | awk '{print $1}')"
    if [[ -n "$REMOTE" && "$LOCAL" == "$REMOTE" ]]; then
      ok "GitHub sync: main = ${LOCAL:0:7}"
    elif [[ -z "$REMOTE" ]]; then
      fail "GitHub: origin/main nicht erreichbar (Push oder Auth prüfen)"
    else
      fail "GitHub out of sync (lokal ${LOCAL:0:7} ≠ remote ${REMOTE:0:7})"
    fi
  else
    warn "Kein git remote origin konfiguriert"
  fi

  BAD="$(git ls-tree -r --name-only HEAD | grep -iE '(^VIP Zugang/|vip_codes\.json|(^|/)\\.env$|osg-runtime-config\\.js$)' || true)"
  if [[ -z "$BAD" ]]; then
    ok "Keine sensiblen Pfade im letzten Commit"
  else
    fail "Sensible Dateien im Commit: $BAD"
  fi
else
  warn "Kein Git-Repository"
fi

# --- Assets ---
for f in public/Frontseite02.png public/hinterseite.jpg public/sounds/pauli-avatar-voice.m4a index.html server.js render.yaml; do
  if [[ -f "$f" ]]; then ok "Asset/Datei: $f"
  else fail "Fehlt: $f"
  fi
done

# --- DNS ---
DNS_OK=0
for host in omnisolutionsglobal.com www.omnisolutionsglobal.com api.omnisolutionsglobal.com; do
  if dig +short "$host" A "$host" CNAME 2>/dev/null | grep -q .; then
    ok "DNS $host löst auf"
    DNS_OK=1
  else
    warn "DNS $host: keine Einträge (Cloudflare CNAME → Render setzen)"
  fi
done
[[ "$DNS_OK" -eq 1 ]] || warn "Domain noch nicht live — Partner-HTTPS-Checks schlagen fehl"

# --- Render health ---
RENDER_URL="${RENDER_HEALTH_URL:-https://pauli-best-price-api-nzbl.onrender.com/api/health}"
HTTP_BODY="$(curl -sS -m 45 "$RENDER_URL" 2>/dev/null || true)"
if echo "$HTTP_BODY" | grep -q '"ok"'; then
  ok "Render health: $RENDER_URL"
else
  warn "Render nicht erreichbar oder cold start — Dashboard: Manual Deploy + Secrets prüfen"
fi

echo ""
echo "=== Ende ==="
