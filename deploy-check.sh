#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SERVER_PATH="$ROOT/02_Quellcode/Core_Logik/server.js"
DATA_DIR="$ROOT/03_Datenbank_und_Preise/data"
ENV_FILE="$ROOT/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}OK${NC}  $*"; }
warn() { echo -e "${YELLOW}WARN${NC} $*"; }
fail() { echo -e "${RED}FAIL${NC} $*"; }

FAIL_COUNT=0

echo "=== Deploy Check (Wave 1 paths) ==="
echo "Root: $ROOT"
echo ""

# 1) Server path check
if [[ -f "$SERVER_PATH" ]]; then
  ok "Server entry exists: 02_Quellcode/Core_Logik/server.js"
else
  fail "Missing server entry: 02_Quellcode/Core_Logik/server.js"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 2) Data dir writability check
if [[ -d "$DATA_DIR" ]]; then
  if [[ -w "$DATA_DIR" ]]; then
    ok "Data dir writable: 03_Datenbank_und_Preise/data/"
  else
    fail "Data dir not writable: 03_Datenbank_und_Preise/data/"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
else
  fail "Missing data dir: 03_Datenbank_und_Preise/data/"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 3) .env variables check
if [[ ! -f "$ENV_FILE" ]]; then
  fail "Missing .env file in project root"
  FAIL_COUNT=$((FAIL_COUNT + 1))
else
  ok ".env file found"
fi

# Required for production safety/start constraints in server.js
REQUIRED_VARS=(
  NODE_ENV
  PORT
  OSG_INSTALL_FP_SALT
  OSG_CORS_ORIGINS
  OSG_API_ALLOWED_ORIGINS
)

# Required for Pauli voice (P0 go-live)
VOICE_REQUIRED_VARS=(
  ELEVENLABS_API_KEY
  ELEVENLABS_VOICE_ID
)

# Recommended for full live feature set
RECOMMENDED_VARS=(
  OPENAI_API_KEY
  INVOLVE_ASIA_API_KEY
  INVOLVE_ASIA_API_SECRET
)

if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r key; do
    if rg -n "^${key}=.+" "$ENV_FILE" >/dev/null 2>&1; then
      ok ".env has ${key}"
    else
      fail ".env missing required ${key}"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  done < <(printf "%s\n" "${REQUIRED_VARS[@]}")

  while IFS= read -r key; do
    if rg -n "^${key}=.+" "$ENV_FILE" >/dev/null 2>&1; then
      ok ".env has ${key} (voice P0)"
    else
      fail ".env missing voice P0 ${key}"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  done < <(printf "%s\n" "${VOICE_REQUIRED_VARS[@]}")

  while IFS= read -r key; do
    if rg -n "^${key}=.+" "$ENV_FILE" >/dev/null 2>&1; then
      ok ".env has ${key}"
    else
      warn ".env missing recommended ${key}"
    fi
  done < <(printf "%s\n" "${RECOMMENDED_VARS[@]}")
fi

echo ""
echo "=== Render preflight (remote host) ==="
echo "Lokal reicht .env — auf Render müssen Pflichtvariablen im Dashboard/Blueprint stehen,"
echo "bevor autoDeploy auf main läuft (sonst OSG_INSTALL_FP_SALT-Race → start exit 1)."
echo "Remote prüfen: npm run render:verify-env"
echo "Doku: docs/OSG-INFRASTRUCTURE-HARDENING.md"
echo ""

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  fail "Deploy check failed with ${FAIL_COUNT} blocking issue(s)."
  exit 1
fi

ok "Deploy check passed."
