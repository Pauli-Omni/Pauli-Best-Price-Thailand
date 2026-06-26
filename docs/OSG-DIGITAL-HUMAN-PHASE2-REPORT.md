# OSG Digital Human — Phase 2 Report

**Generated:** 2026-06-26  
**Scope:** Production Motion System (additive, backward-compatible)  
**Basis:** Phase 1 (`osg_digital_human_engine.js`, `osg_digital_human.css`) unverändert

---

## Neue Dateien

| Datei | Zweck |
|-------|-------|
| `assets/scripts/osg_digital_human_motion.js` | Motion Engine (alle Layer) |
| `assets/styles/osg_digital_human_motion.css` | CSS für Motion-Zustände |

---

## Neue CSS-Klassen

### Phase-Klassen (auf `#coin-stage`)

| Klasse | Trigger | Zweck |
|--------|---------|-------|
| `is-dh2-phase-{phase}` | `setPhase()` | Phase-spezifische CSS-Marker |
| `is-dh2-thinking` | Phase `thinking` / `thinking_deep` | Kombinierter Thinking-Marker |
| `is-dh2-listening` | Phase `listening` / `listening_focus` | Listening-Marker |
| `is-dh2-speaking` | Phase `speaking*` / `resume_speaking` | Speaking-Marker |
| `is-dh2-idle` | Phase `idle` / `idle_breathing` | Idle-Glow-Animation |
| `is-dh2-blinking` | Blink-Tick | Blink-Overlay (180 ms) |

### Emotion-Klassen

| Klasse | Emotion |
|--------|---------|
| `is-dh2-emotion-neutral` | neutral |
| `is-dh2-emotion-happy` | happy |
| `is-dh2-emotion-sad` | sad |
| `is-dh2-emotion-anger` | anger |
| `is-dh2-emotion-separation` | separation |
| `is-dh2-emotion-surprised` | surprised |
| `is-dh2-emotion-confident` | confident |
| `is-dh2-emotion-thinking` | thinking |
| `is-dh2-emotion-listening` | listening |
| `is-dh2-emotion-love` | love |
| `is-dh2-emotion-stress` | stress |
| `is-dh2-emotion-curious` | curious |
| `is-dh2-emotion-professional` | professional |
| `is-dh2-emotion-serious` | serious |
| `is-dh2-emotion-friendly` | friendly |
| `is-dh2-emotion-sales` | sales |

### Gesture-Klassen (additiv zu Emotion)

| Klasse | Geste |
|--------|-------|
| `is-dh2-gesture-{gesture}` | beliebige Geste |
| `is-dh2-gesture-celebrate` | Glow-Animation |
| `is-dh2-gesture-nod` / `-acknowledge` / `-confirm` | Nod-Pulse |

---

## CSS Custom Properties (geschrieben von Motion JS auf `#coin-stage`)

| Property | Wertebereich | Beschreibung |
|----------|-------------|--------------|
| `--dh2-breath-sy` | 0.99–1.02 | Brust-Atmung Y-Scale |
| `--dh2-breath-sx` | 0.996–1.006 | Brust-Atmung X-Scale |
| `--dh2-sway-x` | ±1.2 px | Body Sway X |
| `--dh2-sway-y` | ±0.5 px | Body Sway Y |
| `--dh2-sway-z` | ±0.5 deg | Body Sway Rotation |
| `--dh2-head-rx` | ±8 deg | Kopf Pitch |
| `--dh2-head-ry` | ±4 deg | Kopf Yaw |
| `--dh2-head-rz` | ±5 deg | Kopf Roll |
| `--dh2-head-ty` | ±5 px | Kopf Vertikal |
| `--dh2-eye-x` | ±2 px | Augen X-Offset (Glanzpunkt) |
| `--dh2-eye-y` | ±1.5 px | Augen Y-Offset |
| `--dh2-blink` | 0–1 | Blink-Progress (Overlay-Alpha) |

---

## Neue APIs

### `window.OSG_DIGITAL_HUMAN_MOTION`

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `install()` | `() → boolean` | Motor initialisieren (auto bei DOMContentLoaded) |
| `update(nowMs, deltaS)` | `(number, number) → void` | Master-Tick (aus animate()-Loop) |
| `setPhase(phase)` | `(string) → void` | Phase setzen + CSS-Klassen |
| `setEmotion(emotion)` | `(string) → void` | Emotion setzen + CSS-Klassen |
| `setGesture(gesture)` | `(string\|null) → void` | Geste setzen + CSS-Klassen |
| `getState()` | `() → object` | Aktuellen Motor-Status lesen |
| `scheduleBlink()` | `() → void` | Nächsten Blink-Timer setzen |

---

## Motion-Layer-Architektur

```
animate() Loop (index.html)
  │
  ├─ osgLipSyncTick()          ← unverändert
  ├─ OSG_DIGITAL_HUMAN.tick()  ← Phase 1 (Blink CSS, Mikro)
  ├─ OSG_DIGITAL_HUMAN_MOTION.update()  ← Phase 2 (alle Layer)
  │    ├─ tickBreath()   → --dh2-breath-*, --dh2-sway-*
  │    ├─ tickHead()     → --dh2-head-*
  │    ├─ tickEye()      → --dh2-eye-*
  │    └─ tickBlink()    → --dh2-blink, is-dh2-blinking
  └─ osgAvatarGestureTick()   ← unverändert
```

---

## Hooks (additiv)

### Event-Listener (auf `document`)

| Event | Trigger | Aktion |
|-------|---------|--------|
| `osg:digital-human:phase` | Phase 1 Engine | `setPhase()` |
| `osg:digital-human:emotion` | Phase 1 Engine | `setEmotion()` |
| `osg:digital-human:gesture` | Phase 1 Engine | `setGesture()` |

### Mouse-Event

- `mousemove` → `_eye.cursorX/Y` — Augenblickkontakt zur Maus während Listening

### Keine Eingriffe in

- `playPauliVoice()` — unverändert
- `OSGLipSync` — unverändert
- `OSG_AUDIO_REGISTRY` — unverändert
- `OSG_EMPATHY_LOGIC` — unverändert (Emotion kommt via Phase-1-Event)
- `osgApplyAvatarTransform` — unverändert
- `osgAvatarGestureTick` — unverändert

---

## Motion-Verhalten je Phase

| Phase | Kopf | Atmung | Augen | Blink-Impulse |
|-------|------|--------|-------|---------------|
| `idle` / `idle_breathing` | 0° | Normal | Kamera | 0 |
| `thinking` | Leicht unten (4°), Drift | Langsamer (×0.8) | Seite + unten | 0.6× |
| `thinking_deep` | Mehr unten (5°) | Noch langsamer (×0.7) | Mehr Drift | 0.4× |
| `listening` | Vorne (-4°), links | Normal | Cursor + häufig | 1.2× |
| `listening_focus` | Mehr vorne (-5°) | Normal | Cursor intensiv | 1.4× |
| `speaking` | -1° | Schneller (×1.1) | Kamera | 0.8× |
| `speaking_calm` | 0° | Langsamer (×0.9) | Kamera | 0.7× |
| `speaking_professional` | -1° | Normal | Kamera | 0.6× |
| `speaking_sales` | -2°, yaw | Schneller (×1.2) | Kamera + yaw | 0.9× |
| `celebrate` | -3° | Lebhaft (×1.3) | Breit | 1.0× |
| `wai` | +4° (Neigung) | Ruhig (×0.8) | Kamera | 0 |
| `sympathy` | +4° | Ruhiger (×0.85) | Unten | 0.4× |

---

## Emotion-Overlays

Alle Emotionen sind additiv zu Phase-Motion. Kein Blocking von Gesten.

| Emotion | Kopf-Offset | Sway | Atmung | CSS-Effekt |
|---------|-------------|------|--------|------------|
| happy | -3°, +2°Z | ×1.7 | ×1.3 | Goldener Glow |
| sad | +6°, -2°Z | ×0.6 | ×0.7 | Dimming |
| anger | +2°, +1°Z | ×1.2 | ×1.4 | Kontrast-Pulse |
| separation | +5°, -3°Z | ×0.7 | ×0.8 | Dimming |
| love | -2°, +3°Z | ×1.3 | ×1.2 | Rosa Glow |
| confident | -1°, +1°Z | ×1.1 | ×1.1 | Shine |
| curious | -3°, +4°Z | ×1.2 | ×1.1 | Sättigung |
| professional | 0° | ×0.8 | ×0.85 | Kein Extra |

---

## Blink-System

- Intervall: 2–7 s (zufällig, Laplace-Verteilung via `Math.random()`)
- Dauer: 160 ms (ease-in-out)
- Blink-Impulse: Phase-abhängig (Listening = 1.4×, Idle = 0)
- Kein Konflikt mit Phase-1-Blink (Phase 1 schreibt nur `--dh2-blink` via CSS-Klasse `is-dh-idle-blink`; Phase 2 hat eigenes `is-dh2-blinking` + Overlay)

---

## Eye Contact (Aufgabe 7)

| Modus | Trigger | Verhalten |
|-------|---------|-----------|
| Kamera-Gaze | `idle`, `speaking` | Mikrodrift ±0.04 normalisiert |
| Thinking-Gaze | `thinking*` | Links/unten, langsam wandernd |
| Cursor-Gaze | `listening*` + Maus aktiv | Blick folgt Cursor (25 % Intensität) |
| Mikro-Sakkaden | alle | 0.8–2.4 s Intervall, ±0.12 Auslenkung |
| Gaze-Shift | alle | 2–6 s Intervall, sanfter Übergang |

Alle Übergänge via Lerp (lerpK = 4–12 je Phase) — keine abrupten Sprünge.

---

## Regression-Prüfung (Aufgabe 12)

| Funktion | Status |
|----------|--------|
| Thinking-Animation | ✔ `enterThinking()` → `setPhase("thinking")` → Motion |
| Listening-Animation | ✔ `enterListening()` → `setPhase("listening")` → Motion |
| Speaking-Animation | ✔ via LipSync-Hook → `is-dh2-speaking` |
| Emotion | ✔ `detectEmotion()` → Phase-1-Event → Motion `setEmotion()` |
| Gesture | ✔ `chooseGesture()` → Phase-1-Event → Motion `setGesture()` |
| LipSync (Amplitude) | ✔ Unverändert — läuft auf `.coin-visual-shadow-host--main` inline style |
| Wake Mode | ✔ Unverändert — `is-listening` auf Wake-Button, Motion reagiert auf Phase |
| Live Chat | ✔ `processUserText` → Thinking/Listening/Speaking korrekt |
| Cloud TTS | ✔ `OSG_PAULI_ALLOW_CLOUD_TTS` Flag unverändert |
| Lokale MP3 | ✔ `playPauliLocalVoiceFile` unverändert |
| Web Speech Fallback | ✔ `playPauliWebSpeechFallback` unverändert |
| Legacy `is-speaking` | ✔ Motion deaktiviert auf `#coin-stage.is-speaking` (`:not(.is-speaking)`) |
| Legacy `is-wai` | ✔ Motion deaktiviert auf `#coin-stage.is-wai` |
| Legacy `transform: none !important` | ✔ Motion schreibt auf shadow-host, nicht auf `#coin-stage` |
| Reduced Motion | ✔ `@media (prefers-reduced-motion: reduce)` — alle Motion-Transforms off |
| Mobile ≤480px | ✔ Sway deaktiviert per CSS-Override |

---

## Architektur-Entscheidungen

### Warum `.coin-visual-shadow-host--main` (nicht `#coin-stage`)?

`style.css` setzt `transform: none !important` auf `#coin-stage.is-speaking`, `.is-wai`, `.is-busy`, `.is-avatar-running`. Um keine Regression zu erzeugen, schreibt die Motion Engine ihren CSS-Compound-Transform auf den inneren Shadow-Host. Inline-Styles von `tts-lipsync-bridge.js` (Lip-Sync) überschreiben CSS mit höherer Priorität und laufen damit korrekt während Speaking.

### Warum kein eigenes `requestAnimationFrame`?

Phase 2 hängt sich in den bestehenden `animate()`-Loop ein (`window.OSG_DIGITAL_HUMAN_MOTION.update(now, delta)`). Damit gibt es genau einen rAF-Zyklus für alle Subsysteme.

---

## Offene Punkte

1. **Viseme-Lip-Sync** — Mund-Öffnungsgrad noch amplitude-basiert; für Phase 3 Azure/ElevenLabs Viseme-Timestamps anbinden.
2. **Speak-Video-Assets** — `02-speak-loop.webm/mp4` noch nicht produziert; wenn vorhanden in `pauli_avatar_animations.js` Zeile 336 reaktivieren.
3. **Sakkaden-Kalibrierung** — Augenbewegungen aktuell als Glow-Offset auf `::before`; für Phase 3 separate Eye-Overlay-Sprites.
4. **Mobile Sway** — Per CSS komplett deaktiviert; feine Kalibrierung auf echten Thailand-Geräten empfohlen.
5. **Gesture-Dauer** — `is-dh2-gesture-*` Klassen laufen unbegrenzt; Phase 3 sollte Auto-Timeout einführen.

---

## Empfehlungen für Phase 3

1. **Echtes 3D-Gesicht** — SVG-Layer-System für Mund, Augen, Augenbrauen als separate Elemente
2. **Viseme-Stream** — Azure Cognitive Speech oder ElevenLabs Timestamps → echte Lip-Sync-Synchronisation
3. **Motion-Capture-Integration** — OpenAI Sora-generierte Loops pro Emotions-/Phasen-Kombination
4. **Gaze-Tracking** — MediaPipe Face Detection → Blickrichtung basierend auf echtem Nutzergesicht
5. **Procedural Audio-Reaktion** — Atemgeräusch-Amplitude → Breath-Layer-Multiplikator
6. **Haptic Feedback** (Mobile) — Kleine Vibration beim Wai/Greeting via `navigator.vibrate`
