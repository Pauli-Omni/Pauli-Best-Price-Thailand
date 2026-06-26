# OSG Audio Root-Cause Analysis — Pauli Avatar Speech

**Datum:** 2026-06-26  
**Modus:** QA / Audio-Debug (Feature Freeze — keine Fixes)  
**Symptom:** Avatar animiert und pulsiert normal, Dialogtext wird angezeigt, Avatar „spricht“ visuell — Ton ist unhörbar oder nahezu unhörbar.

---

## Executive Summary

Das Problem ist **kein einzelner Volume-Slider auf 0**, sondern eine **Kombination aus Code-Logik (Phase-4 Audio-Registry/Abort-Epoch) und Konfiguration (Cloud-TTS standardmäßig aus)**. Die **visuelle Sprech-Pipeline ist von der hörbaren Wiedergabe entkoppelt**: Lip-Sync und Digital-Human-Phasen starten auch dann, wenn kein Audiosignal die Lautsprecher erreicht.

**Primäre Root Cause (Code):** Jeder Sprechversuch ruft `stopAllSpeech()` → `OSG_AUDIO_REGISTRY.stopAll()` auf, was `_abortEpoch` **hochzählt, aber nach normalem Playback nicht zuverlässig zurücksetzt**. Folge: Segment-Wiedergabe, Web-Speech-Fallback und TTS-Guard blockieren nachfolgende (und teils auch laufende) Pfade — während die UI weiter „spricht“.

**Primäre Root Cause (Konfiguration):** Freie KI-Antworten benötigen `OSG_PAULI_ALLOW_CLOUD_TTS` in `osg-runtime-config.js`. Ohne diese Datei/Flag ist `/api/tts` für dynamischen Dialog **de facto aus**; lokale MP3s decken nur vordefinierte `speechKey`-Zeilen ab (~90 Dateien, fast nur `public/sounds/pauli/th/`).

---

## 1. Wo Sprache erzeugt wird

### 1.1 Client — Einstieg & Orchestrierung

| Stelle | Datei | Rolle |
|--------|-------|-------|
| Zentraler Sprech-API | `assets/scripts/osg-index-app-main.module.js` → `playPauliVoice()` | Caption, Pfadwahl, Fallback-Kette |
| Avatar-Zeilen | `osgAvatarSpeakLine()` (selbe Datei) | Gesten, Pointer, ruft `playPauliVoice` |
| Live-Dialog | `osgPauliLiveSpeakReply()` | Chunking, `whisper` bei Nacht, `allowCloudTts` nur mit Runtime-Flag |
| Digital Human | `assets/scripts/osg_digital_human_engine.js` → `speak()` | Setzt Emotion/Gesture, ruft `playPauliVoice` |
| Startup | `assets/scripts/startup_boot_logic.js` | Session-Greeting, Sawadee, Trust-Pledge via `speakApi.speakLine` |
| TTS-Mutex | `assets/scripts/osg_tts_guard.js` | Wrappt `playPauliVoice` in Queue + Abort-Epoch-Guards |
| Interrupt | `assets/scripts/osg_tts_interrupt.js` | Stoppt Audio bei Nutzer-Interrupt |

### 1.2 Client — Audio-Quellen (Priorität in `playPauliVoice`)

```
playPauliVoice(text, opts)
  ├─ 0. stopAllSpeech()                    ← setzt Abort-Epoch
  ├─ 1. OSG_AUDIO_SEGMENT.playSegment()    ← Master-MP3-Schnipsel (audio-segments.json)
  ├─ 2. playPauliLocalVoiceFile()          ← /sounds/pauli/{lang}/{speechKey}.mp3
  ├─ 3. playPauliBundledFallbackVoice()    ← nur pauliIntro / pauliSawadee / welcome_greeting
  ├─ 4. playElevenLabs() → POST /api/tts   ← nur wenn allowCloudTts + Runtime-Flag
  ├─ 5. playPauliWebSpeechFallback()       ← speechSynthesis (Browser)
  └─ 6. Bundled-Fallback (2. Versuch)
```

### 1.3 Server — Cloud-TTS

| Endpunkt | Datei | Backend |
|----------|-------|---------|
| `POST /api/tts` | `02_Quellcode/Core_Logik/server.js` | ElevenLabs Stream (`eleven_multilingual_v2`) oder OpenAI `tts-1` Fallback |

Request-Body: `{ text, whisper, lang }`. Serverseitig **kein expliziter Output-Gain** — Whisper ändert nur Voice-Settings (Stability/Speed), nicht dB.

### 1.4 Lokale Audio-Assets

- **Einzelclips:** `public/sounds/pauli/th/*.mp3` (~90 Dateien, Phase-1-Audit: 0 fehlende Manifest-Keys)
- **Master-Segmente:** `public/sounds/pauli/th/search_intro_long.mp3` + `public/sounds/pauli/audio-segments.json`
- **Bundled Fallback:** `public/sounds/pauli-avatar-voice.mp3`, `pauliIntro`, `pauliSawadee`
- **Generierung (Build, nicht Runtime):** `scripts/generate-pauli-voice-mp3.mjs`, `scripts/pauli-voice-rebuild-all.mjs`

### 1.5 Nicht genutzter Pfad

`public/js/tts-lipsync-bridge.js` → `playPauliSpeechWithLipsync()` ist **nirgends im Repo aufgerufen** (nur definiert). Produktionspfad nutzt `playPauliAudioBuffer` bzw. Segment-Service.

---

## 2. Wo Playback beginnt

| Pfad | Start-Funktion | Audio-Technologie | Lip-Sync-Trigger |
|------|----------------|-------------------|------------------|
| **Buffer (Hauptpfad)** | `playPauliAudioBuffer()` | `AudioContext` + `BufferSource` + `GainNode` → `destination` | `osgLipSyncBegin({ analyser })` oder `triggerAvatarAnimation(analyser)` |
| **HTML-Fallback** | `playPauliAudioBuffer()` wenn kein/kaputter Ctx oder `ctx.state === "suspended"` | `new Audio(blobUrl)` + `audio.play()` | `triggerAvatarAnimation(null)` → **synthetischer** Lip-Sync |
| **Segment** | `OSG_AUDIO_SEGMENT.playSegment()` → `playSegmentOnAudio()` | `new Audio(masterUrl)` + `createMediaElementSource` → Analyser → destination | `OSGLipsyncBindToAudio()` → `onSpeakStart()` |
| **Web Speech** | `playPauliWebSpeechFallback()` | `speechSynthesis.speak(utterance)` | `osgDhEnterSpeaking()` only |
| **Bridge-SFX** | `avatar-3d-bridge.js` → `playLocalSound()` | `new Audio(url)` | keine TTS-Lip-Sync-Kette |
| **Gesture-Unlock** | `unlockAudioSystemFromCoinGesture()` | Silent buffer + `audio.play()` Probe | — |

**Wiedergabe-Start konkret:**

- Buffer: `src.start(0)` in `playWithAnalyser()` (`osg-index-app-main.module.js` ~3727)
- HTML: `await audio.play()` (~3760 / ~3828)
- Segment: `audio.play()` in `onMeta()` (`osg_audio_segment_service.js` ~192)
- Cloud: nach `fetch("/api/tts")` → `playPauliAudioBuffer(arrayBuf)`

**Audio-Gate (Terms):** `assets/scripts/pauli_audio_gate.js` → `osgPauliAudioAllowed()` blockiert **alle** Pfade bis AGB bestätigt. Bei blockiertem Gate: kein Audio — aber andere UI kann trotzdem Text zeigen, wenn Aufrufer Caption separat setzen.

---

## 3. Jede gefundene Volume-/Gain-/Mute-Einstellung

### 3.1 Pauli-Sprachausgabe (relevant)

| Wert | Ort | Bedingung | Wirkung |
|------|-----|-----------|---------|
| **1.0** | `playPauliAudioBuffer` → `gainVal` | Normal, `fullVolume: true` | Volle WebAudio-Lautstärke |
| **0.28** | `playPauliAudioBuffer` → `gainVal` | `opts.whisper === true` | ~28 % — „nahezu unhörbar“ bei leiser Umgebung |
| **1.0** | `audio.volume = gainVal` | HTML-Fallback-Pfad | Native Element-Lautstärke |
| **0** | `unlockAudioSystemFromCoinGesture` → `g.gain.value = 0` | Autoplay-Unlock-Probe | Absichtlich stumm (nur Context-Resume) |
| **0.02** | `unlockAudioSystemFromCoinGesture` → `el.volume = 0.02` | Autoplay-Unlock-Probe | Absichtlich leise (~2 %), sofort pausiert |
| *(default 1.0)* | `tts-lipsync-bridge.js`, Segment-Service, `avatar-3d-bridge.js` | Kein explizites `volume` | Browser-Default |
| *(nicht gesetzt)* | `SpeechSynthesisUtterance` | — | Browser-Default (= 1.0) |

### 3.2 Andere Audio (nicht Pauli-Dialog, aber hardcoded)

| Wert | Ort | Zweck |
|------|-----|-------|
| **0.94** | `playCoinDropAudio()` | Münz-Klang Tags |
| **0.0001 → 0.38 → 0.0001** | Coin-Drop Synth `GainNode` envelope | Kurzer Synth-Impuls |
| **0.07** Peak | Coin-Drop Harmonics | Leiser Oberton |
| **0.18** | `lib/voice/whisper_mode_settings.dart` | Flutter VoiceEngine Whisper (WebView nutzt JS-Pipeline) |

### 3.3 Mute-Flags & Stopp-Mechanismen

| Mechanismus | Datei | Verhalten |
|-------------|-------|-----------|
| `osgPauliAudioAllowed()` | `pauli_audio_gate.js` | Komplett-Block bis Terms |
| `OSG_AUDIO_REGISTRY.stopAll()` / `_abortEpoch` | `osg_audio_registry.js` | Blockiert `register()` → Segment/WebSpeech/Lipsync-Bridge |
| `osgPauliTtsAbort()` | `osg_tts_guard.js` | Stop + Epoch; `clearAbortEpoch()` nur **80 ms** später, **−1** |
| `stopAllSpeech()` | `osg-index-app-main.module.js` | Ruft Registry `stopAll()` |
| `<video muted>` | `index.html` (#osg-clip-scan-video) | Nur Barcode-Scanner, **nicht** Avatar-TTS |
| `v.setAttribute("muted")` | `pauli_avatar_animations.js` | Avatar-**Video**-Element, nicht TTS |
| CSS `--text-muted` | `style.css` | Textfarbe, **kein** Audio |

### 3.4 CSS

**Keine CSS-Regel** im Repo dämpft HTML-Audio oder WebAudio. Avatar-Puls kommt von `transform`/`filter` auf `.coin-visual-shadow-host--main` (`tts-lipsync-bridge.js`, Digital-Human-CSS).

---

## 4. Aktuelle effektive Wiedergabe-Lautstärke

| Szenario | Erwartete effektive Lautstärke | Realität bei gemeldetem Bug |
|----------|----------------------------------|-----------------------------|
| Tag, normal, Buffer-Pfad OK | **100 %** (Gain 1.0) | Oft **0 %** (Pfad erreicht Lautsprecher nicht) |
| Nacht / `whisper: true` | **~28 %** (Gain 0.28) | Wahrnehmbar leise, nicht „stumm“ — wenn Audio überhaupt spielt |
| Cloud-TTS aktiv, Buffer OK | **100 %** | Abhängig von API-Erfolg + Unlock |
| Nur Lip-Sync / synthetischer Tick | **0 %** | **Häufigster Zustand bei Bug** — Animation läuft, kein Signal |
| Segment + suspended AudioContext | **0 %** (MediaElementSource) | Analyser/Animation kann trotzdem laufen |
| Web Speech nach `stopAllSpeech` | **0 %** (register → null) | Fallback tot bis Epoch cleared |
| TTS-Guard, Epoch aktiv | **0 %** (silent skip) | `playPauliVoice` wird nicht ausgeführt |

**Whisper-Aktivierung (28 % Gain):**

- Nacht: `!isPauliDayPhase()` — 21:01–06:59 lokale Zeit (`osg-index-app-main.module.js`)
- Live-Dialog: `effectiveWhisper = isNight \|\| !!window.osgUserInputIsWhisper`
- Akustische Flüster-Erkennung via Mikrofon-RMS (optional)

---

## 5. Konfiguration vs. Code

| Aspekt | Typ | Bewertung |
|--------|-----|-----------|
| `OSG_PAULI_ALLOW_CLOUD_TTS` nicht gesetzt | **Konfiguration** | Dynamischer KI-Text hat **keine** Audioquelle außer Browser-TTS |
| Keine `osg-runtime-config.js` im Repo | **Konfiguration** | Default = Cloud aus (`osg-runtime-config.example.js` nur kommentiert) |
| Abort-Epoch stackt, wird nicht pro Utterance cleared | **Code (Bug)** | Phase-4-Regression |
| `stopAllSpeech()` am Anfang jedes `playPauliVoice` | **Code (Design)** | Verschärft Epoch-Problem |
| `osgAvatarSpeakLine` ruft vorher `osgPauliTtsAbort()` | **Code (Design)** | Zusätzliche Epoch-Inkremente |
| Lip-Sync ohne verifiziertes Audio | **Code (Design)** | Erklärt „spricht sichtbar, hörbar stumm“ |
| Autoplay-Unlock nur bei Coin/Live-Gesture | **Code + Browser** | Session-Greeting ohne Unlock |
| `createMediaElementSource` ohne suspended-Fallback | **Code (Bug)** | Segment-Pfad stumm auf Mobile |
| Whisper 0.28 | **Code (Absicht)** | Erklärt „nahezu unhörbar“ nur nachts/flüsternd |
| ElevenLabs/OpenAI Keys auf Server | **Konfiguration/Deploy** | Ohne Keys: `/api/tts` 500 oder Fallback-Kette |
| Lokale MP3 nur `th/` | **Asset-Layout** | Nicht-Thai-Locale nutzt Thai-Fallback-Dateien (OK), aber kein Match für freien Text |

**Fazit:** Sowohl **Code** als auch **Konfiguration** tragen bei. Das sichtbare Symptom (Animation + Text, kein Ton) ist primär **code-seitig** (entkoppelte Visuals + Abort-Epoch + fehlende Audio-Pfade). „Nahezu unhörbar“ statt „tot“ deutet zusätzlich auf **Whisper-Nachtmodus (0.28)** oder extrem leise Wiedergabe bei teilweise funktionierendem Pfad.

---

## 6. Exakte Root Cause

### RC-1 — Abort-Epoch blockiert Audio-Pfade nach `stopAllSpeech()` (P0, Code)

**Mechanismus:**

1. `OSG_AUDIO_REGISTRY.stopAll()` inkrementiert `_abortEpoch` bei **jedem** Aufruf.
2. Solange `_abortEpoch > 0`: `register()` gibt `null` zurück → Segment, Web Speech, Lipsync-Bridge brechen ab.
3. `clearAbortEpoch()` wird **nur** aus `osgPauliTtsAbort()` nach **80 ms** aufgerufen und dekrementiert **nur um 1**.
4. Ein einziger Sprechversuch ruft `stopAllSpeech()` mehrfach auf:
   - `playPauliVoice()` (Zeile ~4033)
   - `playPauliAudioBuffer()` (~3643, ~3655)
   - `osgAvatarSpeakLine()` ruft vorher `osgPauliTtsAbort()` (~1700)
5. Nach normalem Ende **kein** vollständiges Epoch-Reset → `guardedPlayPauliVoice()` skippt still (`isEpochBlocked()` → `resolve()` ohne Audio).

**Betroffene Dateien:** `osg_audio_registry.js`, `osg_tts_guard.js`, `osg-index-app-main.module.js`, `osg_audio_segment_service.js`, `public/js/tts-lipsync-bridge.js`

### RC-2 — Cloud-TTS standardmäßig deaktiviert (P0, Konfiguration)

Freier Dialogtext matcht selten einen lokalen `speechKey`. Ohne `window.OSG_PAULI_ALLOW_CLOUD_TTS = true` in produktiver `osg-runtime-config.js` wird `playElevenLabs()` **nicht** aufgerufen (`playPauliVoice` ~4096–4106). Verbleibende Fallbacks: Web Speech (durch RC-1 oft blockiert) oder Stille.

### RC-3 — Visuelle Sprech-Anzeige ohne hörbares Audio (P0, Code)

`osgLipSyncBegin()` / `triggerAvatarAnimation(null)` starten **synthetischen** Mund-Puls (Sinus ~0.32±0.28) unabhängig davon, ob `audio.play()` erfolgreich war. `OSG_DIGITAL_HUMAN.enterSpeaking()` wird über Lip-Sync-Kette aktiviert. Nutzer wahrnimmt: „Pauli spricht“.

HTML-Fallback setzt Animation in `onloadedmetadata` **vor** `await audio.play()` — bei Autoplay-Reject: Animation ja, Ton nein.

### RC-4 — Autoplay / AudioContext ohne Nutzer-Geste (P1, Browser + Code)

`unlockAudioSystemFromCoinGesture()` wird bei Coin-Tap/Live-Start gesetzt (~5170), **nicht** bei automatischem Session-Greeting nach Terms (~3230). Mobile WebView/Safari: `AudioContext` bleibt `suspended`, `audio.play()` rejected → Stille trotz geladener MP3.

### RC-5 — Segment-Service: MediaElementSource bei suspended Context (P1, Code)

`osg_audio_segment_service.js` routet Audio **ausschließlich** über WebAudio (`createMediaElementSource`). Bei `suspended` Context: kein Output, während `play()` resolved und Lip-Sync bindet. (Zusätzlich durch RC-1 oft gar nicht erst erreicht.)

### RC-6 — Nacht-/Whisper-Modus (P2, Code)

`gainVal = 0.28` reduziert hörbare Lautstärke auf ~28 %. Erklärt „nahezu unhörbar“, nicht vollständige Stille — wenn RC-1/2/3/4 nicht greifen.

---

## End-to-End Pipeline (Ist-Zustand)

```mermaid
flowchart TD
  A[Nutzer / Boot / Live-Chat] --> B[playPauliVoice via TTS-Guard]
  B --> C{Epoch blockiert?}
  C -->|ja| Z[S Silent skip — kein Audio]
  C -->|nein| D[stopAllSpeech — Epoch++]
  D --> E[Caption anzeigen]
  E --> F{Segment}
  F -->|Epoch| G[false]
  F -->|OK| H[MediaElementSource — ggf. stumm]
  G --> I{Local MP3}
  I -->|speechKey match| J[playPauliAudioBuffer]
  I -->|kein Match| K{Cloud TTS?}
  K -->|Flag aus| L[skip]
  K -->|Flag an| M[/api/tts → Buffer]
  L --> N{Web Speech}
  N -->|Epoch| O[false]
  J --> P{AudioContext + play OK?}
  P -->|ja| Q[Hörbar ~100% oder 28% whisper]
  P -->|nein| R[Lip-Sync synthetisch — stumm]
  H --> R
  O --> R
  Z --> S
  R --> T[Avatar pulsiert — Nutzer: kein Ton]
  Q --> U[Avatar + Ton OK]
```

---

## Verifikations-Checkliste (für manuelles QA)

1. **DevTools Console:** `[TTS Guard]`, `[tts-lipsync-bridge] Audio-Fehler`, `[avatar-3d-bridge] Autoplay blockiert`
2. **`OSG_AUDIO_REGISTRY.isAbortEpochActive()`** nach erstem `playPauliVoice` — erwartet bei Bug: `true`
3. **`window.__OSG_audioCtxUnlock?.state`** — `running` vs. `suspended`
4. **Network:** `POST /api/tts` — wird er bei freiem Text überhaupt aufgerufen?
5. **Uhrzeit:** Nachtfenster 21:01–06:59 → Whisper 0.28
6. **`localStorage osg-terms-accepted-v1`** — muss `"1"` sein
7. **Gerät:** Systemmedien-Lautstärke / Stummschalter (außerhalb App, aber prüfen)

---

## Sprachwechsel & Geräte-Ausgabe

- **Sprachwechsel:** `langCode` steuert Pfad `/sounds/pauli/{lang}/` und BCP47 für `/api/tts`. Praktisch existieren MP3s fast nur unter `th/`; andere Locales fallen auf Thai-Dateien zurück. Dynamischer Text bleibt ohne Cloud-TTS stumm.
- **Geräte-Ausgabe:** Keine App-Logik für Bluetooth/Receiver-Auswahl. Alles über Browser/WebView Standardrouting. Flutter `VoiceEngine` ist TODO und beeinflusst WebView-TTS nicht.

---

## Dateien-Index (Audio-relevant)

| Datei | Relevanz |
|-------|----------|
| `assets/scripts/osg-index-app-main.module.js` | `playPauliVoice`, `playPauliAudioBuffer`, Gain, Unlock |
| `assets/scripts/osg_audio_registry.js` | Abort-Epoch, `stopAll` |
| `assets/scripts/osg_tts_guard.js` | Queue, Epoch-Release 80 ms |
| `assets/scripts/osg_audio_segment_service.js` | Master-MP3-Segmente |
| `assets/scripts/pauli_audio_gate.js` | Terms-Gate |
| `public/js/tts-lipsync-bridge.js` | Lip-Sync (ungenutzter `playPauliSpeechWithLipsync`) |
| `public/js/avatar-3d-bridge.js` | Expressive SFX |
| `assets/scripts/osg_digital_human_engine.js` | DH speak wrapper |
| `assets/scripts/pauli_avatar_animations.js` | Speak-State (visuell) |
| `assets/scripts/startup_boot_logic.js` | Boot-Greeting ohne Audio-Unlock |
| `02_Quellcode/Core_Logik/server.js` | `/api/tts` |
| `osg-runtime-config.example.js` | Cloud-TTS-Flag (nicht aktiv im Repo) |
| `public/sounds/pauli/audio-segments.json` | Segment-Mapping |

---

## Empfohlene Fix-Richtung (nur Hinweis — nicht umgesetzt)

1. Nach erfolgreichem/komplettem Utterance-Ende: `_abortEpoch` deterministisch auf 0 oder `clearAbortEpoch()` symmetrisch zu `stopAll()`.
2. `stopAllSpeech()` nicht am **Anfang** jedes Play aufrufen, oder `register(..., { force: true })` für den unmittelbar folgenden Start.
3. Lip-Sync/`enterSpeaking` erst **nach** bestätigtem `play()` / `src.start`.
4. `osg-runtime-config.js` mit `OSG_PAULI_ALLOW_CLOUD_TTS = true` in Produktion.
5. Segment-Service: suspended-Context-Fallback wie `playPauliAudioBuffer` (HTML direkt).
6. Session-Greeting: `unlockAudioSystemFromCoinGesture()` an Terms-Confirm-Geste koppeln.

---

*Feature Freeze eingehalten — keine Code-Änderungen in dieser Analyse.*
