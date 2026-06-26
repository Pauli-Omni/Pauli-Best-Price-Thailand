# OSG Digital Human — P0 Release Stabilization Report

**Datum:** 2026-06-26  
**Issue:** R-01 — Speaking Phase Synchronisation  
**Scope:** Release-Blocker only — kein Feature-Freeze-Bruch

---

## Problem (vor Fix)

Während TTS-Wiedergabe wurde `osgLipSyncStart()` / `osgLipSyncBegin()` / `osgLipSyncStop()` direkt aufgerufen. Die Engine hookte nur `OSGLipSync.begin/stop`, nicht `start` und nicht die Closure-Funktionen. `wrapPlayPauliVoice()` rief `enterSpeaking()` nur auf, wenn `OSGLipSync` fehlte — es existiert aber immer.

**Folge:** `OSG_DIGITAL_HUMAN.state.phase` blieb auf `idle_breathing`, während nur die Legacy-Klasse `is-speaking` (LipSync-Flag) gesetzt wurde.

---

## Gefundene Aufrufpfade

### LipSync — direkte Aufrufe (index.html)

| Funktion | Aufrufer | Zeilen (ca.) |
|----------|----------|--------------|
| `osgLipSyncBegin()` | `osgLipSyncStart`, `triggerAvatarAnimation`, `playPauliAudioBuffer` (Buffer-Pfad) | 12216, 12239, 14354 |
| `osgLipSyncStart()` | `OSGLipSync.start`, `playPauliAudioBuffer` (HTML-Audio-Fallback) | 12271, 14398, 14466 |
| `osgLipSyncStop()` | `osgLipSyncTick` (Timeout), `stopAvatarAnimation`, `stopAllSpeech`, `playPauliAudioBuffer` onended, Live-Chat `finally`, Tour/Avatar-Fehlerpfade | 12228, 12249, 12288, 14384, 14423, 14491, 12431, 15725, 15776 |

### Indirekte LipSync-Pfade

| Pfad | Mechanismus | DH vor Fix |
|------|-------------|------------|
| `playPauliAudioBuffer` (AudioContext) | `triggerAvatarAnimation(analyser)` → `osgLipSyncBegin` | ✘ |
| `playPauliAudioBuffer` (HTML Audio) | `osgLipSyncStart` | ✘ |
| `playPauliLocalVoiceFile` | → `playPauliAudioBuffer` | ✘ |
| `playElevenLabs` | → `playPauliAudioBuffer` | ✘ |
| `playPauliBundledFallbackVoice` | → `playPauliAudioBuffer` | ✘ |
| `OSG_AUDIO_SEGMENT.playSegment` | `OSGLipsyncBindToAudio` → `OSGLipSync.begin` | ✘ (Wrap doppelt/fehlend) |
| `tts-lipsync-bridge.js` | `onSpeechStart` → `OSGLipSync.begin` | ✘ |
| `playPauliWebSpeechFallback` | **kein LipSync** | ✘✘ |
| `playPauliVoice` (Wrap) | `enterSpeaking` nur wenn kein OSGLipSync | ✘ |
| `stopAllSpeech` / Registry-Abort | `osgLipSyncStop` | ✘ |

### Audio-Infrastruktur (unverändert, geprüft)

| Komponente | Rolle | Status |
|------------|-------|--------|
| `OSG_AUDIO_REGISTRY` | Ein aktiver Pfad, Generation-Guard | ✔ intakt |
| `osg_tts_guard.js` | Mutex, Queue, Abort-Epoch | ✔ intakt |
| `osg_tts_interrupt.js` | Interrupt + `OSGLipsyncStopVisuals` | ✔ intakt |
| Generation-Snapshot in Callbacks | Stale-Guard in Buffer/HTML/Segment | ✔ intakt |

---

## Behobene Stellen

### 1. Zentraler Choke-Point — `index.html`

Neue interne Helfer (keine API-Änderung):

```js
osgDhEnterSpeaking()  → OSG_DIGITAL_HUMAN.enterSpeaking(variant)
osgDhLeaveSpeaking()  → OSG_DIGITAL_HUMAN.leaveSpeaking()
```

**`osgLipSyncBegin`:** ruft `osgDhEnterSpeaking()` am Anfang auf.  
**`osgLipSyncStop`:** ruft `osgDhLeaveSpeaking()` am Ende auf.

Damit laufen **alle** direkten und indirekten LipSync-Pfade durch die DH-State-Machine.

### 2. WebSpeech-Fallback — `index.html`

**`playPauliWebSpeechFallback`:**

- `osgDhEnterSpeaking()` vor `speechSynthesis.speak()`
- `osgDhLeaveSpeaking()` in `done()` (inkl. Stale-Guard-Pfad)

### 3. Speaking-Variant — `osg_digital_human_engine.js`

**`wrapPlayPauliVoice`:**

- Setzt `window.__OSG_DH_SPEAKING_VARIANT__` (`speaking`, `speaking_sales`, `speaking_professional`, `speaking_calm`)
- Entfernt fehlerhafte `lipSyncWillRun`-Logik (kein vorzeitiges `enterSpeaking` mehr)

**`osgDhEnterSpeaking`** liest diese Variante — Whisper/Night → `speaking_calm`, Sales → `speaking_sales`, etc.

### 4. Engine LipSync-Wrap — Doppelung entfernt

**`wrapLipSync`:** entfernt `enterSpeaking`/`leaveSpeaking` aus dem Wrap (verhindert Doppel-Zählung in `speakDepth`). Wrap dokumentiert jetzt `start`/`begin`/`stop` als Passthrough. DH-Sync liegt ausschließlich in `osgLipSyncBegin`/`Stop`.

---

## Keine API-Änderungen

| API | Status |
|-----|--------|
| `OSG_DIGITAL_HUMAN.enterSpeaking / leaveSpeaking` | Unverändert |
| `osgLipSyncBegin / Start / Stop` | Unverändert (Signatur) |
| `OSGLipSync.begin / start / stop` | Unverändert |
| `playPauliVoice()` | Unverändert (Wrap-Verhalten korrigiert) |
| `stopAllSpeech()` | Unverändert |

---

## Regressionen (Analyse)

| Bereich | Risiko | Bewertung |
|---------|--------|-----------|
| `speakDepth`-Zähler | Doppel-`leaveSpeaking` (Audio-Ende + Live-Chat `finally`) | **Niedrig** — `Math.max(0, depth-1)` verhindert Unterlauf |
| `stopAllSpeech` vor neuem Play | `leaveSpeaking` bei Stop, `enterSpeaking` bei neuem Begin | **Korrekt** |
| Segment `OSGLipsyncStopVisuals` → `OSGLipSync.stop` → `osgLipSyncStop` | Ein `leaveSpeaking` | **Korrekt** |
| WebSpeech Abort (Generation) | `leaveSpeaking` im Stale-Pfad | **Korrekt** |
| Thinking/Listening-Phasen | Unverändert | **Keine Regression** |
| TTS-Registry / Interrupt | Nicht berührt | **Keine Regression** |

---

## Verbleibende Risiken (nicht P0)

| ID | Priorität | Beschreibung |
|----|-----------|--------------|
| P1-E01 | P1 | `sympathy` fehlt in Phase-4-`EMOTION_DEFS` |
| P1-AR01 | P1 | Kein zentraler Phase-Orchestrator (4 Module syncen unabhängig) |
| P2-R02 | P2 | `OSG_AVATAR.chooseGesture` nicht gewrappt |
| P2-WS | P2 | WebSpeech ohne LipSync-Visuals — DH-Phase korrekt, Mundbewegung weiterhin minimal |
| P3 | P3 | `.bak-phase4`-Artefakte im Repo |

---

## Bewertung

| Kriterium | Vor P0 | Nach P0 |
|-----------|--------|---------|
| Speaking-Phase-Sync | ✘ | **✔** |
| Eye Contact bei Speech | ✘ | **✔** (Phase-Sync) |
| Motion-Posture bei Speech | ✘ | **✔** (Phase-Sync) |
| WebSpeech-Pfad | ✘ | **✔** |
| API-Stabilität | ✔ | **✔** |
| Feature-Freeze eingehalten | — | **✔** |

**P0 R-01: Behoben.**

**Produktionsreife (geschätzt):** 76 % → **82 %** (P0 gelöst; P1-Punkte aus Final-Audit weiterhin offen)

---

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `index.html` | `osgDhEnterSpeaking`/`osgDhLeaveSpeaking`, Hooks in LipSync + WebSpeech |
| `assets/scripts/osg_digital_human_engine.js` | Variant-Flag in `wrapPlayPauliVoice`, DH-Logik aus `wrapLipSync` entfernt |
| `docs/OSG-DIGITAL-HUMAN-P0-REPORT.md` | Dieser Report |

**Keine weiteren Änderungen. Feature Freeze aktiv.**
