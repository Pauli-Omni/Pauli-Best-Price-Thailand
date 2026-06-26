# OSG RC-1 Fix Report — Speech State Machine

**Datum:** 2026-06-26  
**Scope:** Nur Root Cause RC-1 aus `docs/OSG-AUDIO-ROOTCAUSE.md`  
**Feature Freeze:** Keine Änderungen an RC-2–RC-6, Onboarding, TTS-Providern oder Audio-Architektur

---

## Root Cause Confirmation

**RC-1:** `OSG_AUDIO_REGISTRY.stopAll()` erhöhte `_abortEpoch` bei **jedem** Aufruf von `stopAllSpeech()`. Ein einzelner Sprechversuch rief `stopAllSpeech()` mehrfach auf (`playPauliVoice` → `playPauliAudioBuffer` → inneres `playWithAnalyser`). `clearAbortEpoch()` dekrementierte nur um 1 und nur nach `osgPauliTtsAbort()` (80 ms Timer).

**Folge:** `_abortEpoch` blieb dauerhaft > 0 → `register()` gab `null` zurück → Segment/Web-Speech blockiert; `guardedPlayPauliVoice()` skippte neue Anfragen still (`isEpochBlocked()`).

---

## Fix Summary

Die Abort-Epoch ist jetzt **nur noch ein Interrupt-Signal**, kein Nebenprodukt von normalem Stop.

| Aktion | Vorher | Nachher |
|--------|--------|---------|
| `stopAll()` / `stopAllSpeech()` | `_abortEpoch += 1` | Stoppt Quellen + Generation++, **kein** Epoch-Inkrement |
| `osgPauliTtsAbort()` | `stopAllSpeech()` → Epoch++ | `beginAbortEpoch()` + `stopAllSpeech()` |
| Normaler Sprechabschluss | Kein Reset | `resetAbortEpoch()` in `processQueue` finally |
| Neuer Queue-Start | Blockiert bei Epoch | `releaseEpoch()` beim Start + kein Guard-Skip beim Enqueue |
| Nach Interrupt (80 ms) | `clearAbortEpoch()` (−1) | `resetAbortEpoch()` + `processQueue()` |

Stale async Callbacks werden weiterhin über `_generation`-Snapshots abgefangen (unverändert).

---

## Files Changed

| Datei | Änderung |
|-------|----------|
| `assets/scripts/osg_audio_registry.js` | `stopAll(opts)` mit optionalem `{ abort: true }`; `beginAbortEpoch()`, `resetAbortEpoch()`; normales `stopAll()` setzt Epoch nicht mehr |
| `assets/scripts/osg_tts_guard.js` | Epoch-Reset bei normalem Abschluss; `beginAbortEpoch()` im Abort-Pfad; Enqueue-/Queue-Start nicht mehr epoch-blockiert; Timer nutzt `resetAbortEpoch()` + `processQueue()` |
| `scripts/osg-rc1-audio-state-verify.mjs` | **Neu** — automatisierter State-Machine-Test |

**Nicht geändert:** `osg-index-app-main.module.js`, Segment-Service, Lipsync-Bridge, Onboarding, Runtime-Config, Server-TTS.

---

## Runtime Verification

Automatisierter Lauf:

```bash
node scripts/osg-rc1-audio-state-verify.mjs
```

**Ergebnis:** `ok: true` (Exit 0)

| # | Szenario | Ergebnis | Nachweis |
|---|----------|----------|----------|
| 1 | App start | **PASS** | Registry init; 3× `stopAll()` → `isAbortEpochActive() === false`; `register()` erfolgreich |
| 2 | Greeting | **PASS** | `playPauliVoice("Sawadee krab")` ausgeführt; Epoch nach 3× internem `stopAllSpeech` weiterhin frei |
| 3 | „Hi Pauli“ | **PASS** | `playPauliVoice("Hi Pauli")` ausgeführt |
| 4 | Second question | **PASS** | `playPauliVoice("What is the price?")` ausgeführt |
| 5 | Third question | **PASS** | `playPauliVoice("Any coupons?")` ausgeführt |
| 6 | Complaint dialogue | **PASS** | `playPauliVoice("I want to complain about my order")` ausgeführt |
| 7 | Abort recovery | **PASS** | Nach `osgPauliTtsAbort()` + neuer Sprechzeile: Epoch reset, Play ausgeführt |

### Verifikations-Hinweis

Der Test simuliert die **Speech State Machine** (Registry + TTS-Guard + `playPauliVoice`-Stop-Kette) in Node/vm. Er bestätigt, dass jeder Sprechschritt **nicht mehr epoch-blockiert** wird und `register()` während normalem Play funktioniert.

**Browser-Hörbarkeit** hängt weiterhin von RC-2–RC-6 ab (Cloud-TTS-Config, Autoplay-Unlock, lokale MP3-Matches, etc.). RC-1-Fix stellt sicher, dass die State Machine neue Sprechanfragen **nicht mehr still verwirft**.

---

## Remaining Audio Issues (unchanged — RC-2–RC-6)

| ID | Thema | Status |
|----|-------|--------|
| RC-2 | Cloud-TTS standardmäßig aus (`OSG_PAULI_ALLOW_CLOUD_TTS`) | Offen — Konfiguration |
| RC-3 | Lip-Sync/Animation ohne verifiziertes Audio | Offen — Code |
| RC-4 | Autoplay-Unlock fehlt beim Session-Greeting | Offen — Browser + Code |
| RC-5 | Segment-Service: `MediaElementSource` bei suspended AudioContext | Offen — Code |
| RC-6 | Nacht-Whisper Gain 0.28 | Offen — Absicht |

Diese Punkte können weiterhin dazu führen, dass **kein Ton hörbar** ist, obwohl die State Machine korrekt durchläuft. Nach RC-1 ist der Blocker „permanent aborted state“ behoben.

---

## Manual QA (empfohlen)

1. Terms bestätigen → Session-Greeting: DevTools `OSG_AUDIO_REGISTRY.isAbortEpochActive()` → sollte `false` sein nach Sprech-Ende.
2. Coin tippen → „Hi Pauli“ → zwei Folgefragen: jede `playPauliVoice`-Anfrage in Network/Console nicht epoch-skipped.
3. Während Pauli spricht tippen (Interrupt) → danach erneut sprechen: Audio startet nach ~80 ms ohne Reload.

---

*RC-1 Fix abgeschlossen. Keine weiteren Audio-Redesigns in diesem Change.*
