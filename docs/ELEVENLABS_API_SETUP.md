# ElevenLabs API — reproduzierbare Einrichtung (P0)

**Projekt:** Omni Solutions Global  
**Teilprojekt:** Pauli Best Price Thailand  
**Architekturbereich:** Pauli Avatar — Sprachpipeline (Betrieb)  
**Dokumentversion:** 1.0.0  
**Status:** AKTIV — P0 Go-Live

---

## Ziel

Vollständig **automatische** Einrichtung von Pauli-Stimme (Voice Clone + Voice-ID + Render), ohne manuelle Voice-ID-Pflege.

**Kanonische Referenzdatei (einzige Vorlage für den Klon):**

`public/sounds/pauli/Einzige_Stimme_Paulis-Avatar.mp3`

---

## Erforderliche API-Key-Berechtigungen (Pflicht)

Beim Anlegen oder Bearbeiten des Keys im ElevenLabs-Dashboard müssen **alle** folgenden Rechte aktiv sein:

| Berechtigung (Dashboard) | API-Scope (intern) | Zweck |
|------------------------|-------------------|--------|
| **Text to Speech** | TTS | Live-Sprache über `/api/tts` |
| **Voices Read** | `voices_read` | Bestehenden Pauli-Klon erkennen (idempotent) |
| **Voices Write** | `voices_write` | Stimme anlegen/verwalten |
| **Instant Voice Clone** | `create_instant_voice_clone` | Klon aus Referenz-MP3 |

**Ohne diese vier Rechte** bricht der automatische Setup-Prozess ab — **kein manueller Workaround** (keine manuelle Voice-ID als Standardpfad).

---

## Dashboard — Key mit korrekten Rechten

1. [elevenlabs.io](https://elevenlabs.io) → **Profile** → **API Keys**
2. **Create API Key** (oder Restricted Key bearbeiten)
3. Alle vier Berechtigungen oben aktivieren
4. Key kopieren → `.env` Zeile `ELEVENLABS_API_KEY=` (Wert **niemals** in Chat, Commits oder Doku)
5. Speichern (`Cmd+S`)

---

## Automatischer Setup (ein Befehl)

```bash
node scripts/osg-elevenlabs-go-live-setup.mjs
```

**Ablauf (reproduzierbar):**

1. API-Key aus `.env` laden (ohne Ausgabe des Secrets)
2. Berechtigungen prüfen (`voices_read`, Clone, TTS)
3. Falls Pauli-Stimme existiert → wiederverwenden; sonst Instant Voice Clone aus `Einzige_Stimme_Paulis-Avatar.mp3`
4. `ELEVENLABS_VOICE_ID` in `.env` schreiben
5. `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` auf Render (`pauli-best-price-api`) setzen — **ohne Deploy**
6. `deploy-check.sh`, `render:verify-env`, `/api/health`, `/api/tts` prüfen

**Voice-Name im Klon:** `Pauli Best Price Thailand`

---

## Verifikation nach Setup

| Prüfung | Erwartung |
|---------|-----------|
| `bash deploy-check.sh` | OK (beide ElevenLabs-Variablen gesetzt) |
| `npm run render:verify-env` | OK (`ELEVENLABS_*` auf Render) |
| `GET /api/health` | HTTP 200 |
| `POST /api/tts` | HTTP 200, `audio/mpeg`, > 500 Bytes |

Prod-Test (ohne Key im Terminal):

```bash
curl -sS -o /tmp/pauli-tts-test.mp3 -w "%{http_code} %{size_download}\n" \
  -X POST "https://pauli-best-price-api.onrender.com/api/tts" \
  -H "Content-Type: application/json" \
  -H "Origin: https://pauli-best-price-api.onrender.com" \
  -d '{"text":"Sawadee Krab","lang":"th-TH"}'
```

---

## Fehler: `missing_permissions`

| Meldung | Lösung |
|---------|--------|
| `voices_read` | Voices Read im Dashboard aktivieren |
| `create_instant_voice_clone` | Instant Voice Clone aktivieren |
| TTS 401/403 nach Setup | Text to Speech aktivieren; Key in `.env` und Render prüfen |

Key ersetzen → Setup-Befehl erneut ausführen.

---

## Regeln

- API-Key und Voice-ID **nicht** in Git, Chat oder Markdown committen
- Kein `ELEVENLABS_VOICE_NAME_HINT` / kein Liam-Fallback in Produktion
- Nur `ELEVENLABS_VOICE_ID` aus automatischem Setup oder bestehendem Pauli-Klon

---

*Omni Solutions Global · Pauli Best Price Thailand*
