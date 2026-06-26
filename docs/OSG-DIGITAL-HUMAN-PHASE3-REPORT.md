# OSG Digital Human — Phase 3 Report: Micro Motion

**Generated:** 2026-06-26  
**Scope:** Micro Motion Engine (additive, backward-compatible)  
**Basis:** Phase 1 + Phase 2 vollständig erhalten, nur erweitert

---

## Geänderte Dateien

| Datei | Art der Änderung |
|-------|-----------------|
| `assets/scripts/osg_digital_human_motion.js` | Erweitert (additiv) |
| `assets/styles/osg_digital_human_motion.css` | Erweitert (additiv) |
| `docs/OSG-DIGITAL-HUMAN-PHASE3-REPORT.md` | Neu |

**Keine Änderungen an:**
- `index.html` (Hook bereits in Phase 2 gesetzt)
- `osg_digital_human_engine.js` (Phase 1 unverändert)
- `osg_digital_human.css` (Phase 1 unverändert)
- `playPauliVoice`, `OSGLipSync`, `OSG_AUDIO_REGISTRY`, `OSG_EMPATHY_LOGIC`

---

## Phase 3 — neue Micro-Motion-Layer

### 1. Multi-Frequency Noise (ersetzt reinen Sinus)

**Vorher (Phase 2):** Atmung und Kopf-Drift per einfachem `Math.sin(t * freq)` — erkennbar periodisch.

**Phase 3:** Jede Bewegungsachse wird durch **3 überlagerte Sinus-Oszillatoren** mit inkommensurablen Frequenzen gefahren:

```
driftRx = sin(t·0.23)·0.60 + sin(t·0.47)·0.28 + sin(t·0.79)·0.12
```

Ergebnis: organische, pseudo-zufällige Bewegung — deterministisch (kein `Math.random()` pro Frame, kein Garbage).

Achsen: `headX`, `headY`, `headZ`, `bodyX`, `bodyZ`

### 2. Schultern (Shoulder Layer)

**Neu:** Eigener CSS-Akkumulator `--dh2-shoulder-rz` (deg).

- Gegenläufig zur Body-Sway-Rotation (natürliche Kompensation)
- Geschwindigkeit: 0.14 rad/s (langsamer als Sway)
- Amplitude: 0.8° (minimal)
- Addiert sich im CSS zu `head-rz + sway-z + shoulder-rz`

### 3. Gewichtsverlagerung (Weight Shift)

**Neu:** Eigener CSS-Akkumulator `--dh2-weight-x` (px).

- Alle 4–10 s willkürliche Seitenverlagerung (random target, ±1.8 px)
- Zusätzliche passive Oszillation (0.09 rad/s, 40 % der Amplitude)
- Lerp-Übergang: 1.8 × dt — sehr weich
- Addiert sich im CSS zu `sway-x + weight-x`

### 4. Zwei-Frequenz-Atmung

**Vorher:** `sin(phase) * 0.014`  
**Phase 3:** `sin(phase) * 0.012 + sin(phase * 1.87) * 0.003` — Grundfrequenz + Oberton

Erzeugt das "unebene" Atemgefühl (Einatmen ≠ Ausatmen in der Geschwindigkeit).

### 5. Performance Budget

| Mechanismus | Implementierung |
|-------------|----------------|
| Frame-Skip-Detection | `navigator.hardwareConcurrency ≤ 2 oder innerWidth ≤ 480` → `frameSkip = 2` |
| Frame-Skip-Kompensation | `effectiveDt = dt * frameSkip` — Akkumulatoren korrekt weitergeführt |
| Page Visibility Pause | `visibilitychange` → `_paused = true/false` |
| Reduced-Motion Runtime | `matchMedia("prefers-reduced-motion: reduce").matches` — kein Tick |
| CSS Mobile Override | `@media (max-width: 480px)` — sway, weight, shoulder auf 0px/0deg |

### 6. Reduced-Motion (vollständig)

**CSS:** Alle Motion-Vars werden auf Neutral-Werte zurückgesetzt (`!important`).  
**JS:** `prefersReducedMotion()` prüft MediaQuery bei jedem `update()` — Motor läuft nicht.

---

## Neue CSS Custom Properties (Phase 3)

| Property | Wertebereich | Beschreibung |
|----------|-------------|--------------|
| `--dh2-shoulder-rz` | ±0.8 deg | Schulter-Roll (additiv zu head-rz + sway-z) |
| `--dh2-weight-x` | ±1.8 px | Gewichtsverlagerung X (additiv zu sway-x) |

---

## Neue JS-Funktionen (Phase 3)

| Funktion | Beschreibung |
|----------|-------------|
| `noiseSum(bands, dt)` | Multi-Frequenz-Sinus-Summe (kein GC) |
| `detectFrameSkip()` | Erkennt Low-End-Gerät → frameSkip=2 |
| `installVisibilityPause()` | Page-Visibility-API-Pause |
| `tickShoulder(dt)` | Schulter-Layer-Update |
| `tickWeightShift(dt)` | Gewichtsverlagerungs-Update |
| `prefersReducedMotion()` | Runtime-Check prefers-reduced-motion |
| `OSG_DIGITAL_HUMAN_MOTION.setFrameSkip(n)` | Manuelles Frame-Skip-Budget |
| `OSG_DIGITAL_HUMAN_MOTION.pause()` | Manuelles Pausieren |
| `OSG_DIGITAL_HUMAN_MOTION.resume()` | Manuelles Fortsetzen |

---

## Performance-Auswirkungen

### Rechenkosten pro Frame (Phase 3 Additions)

| Layer | Ops/Frame | Art |
|-------|-----------|-----|
| noiseSum (3 × 5 Achsen) | 45 Multiplikationen + 15 sin() | deterministic |
| tickShoulder | 1 sin + lerp | minimal |
| tickWeightShift | 1 sin + lerp + timer | minimal |
| prefersReducedMotion | 1 MediaQuery-Abfrage | cheap |
| frameSkip Check | 1 Modulo | trivial |

**Gesamtkosten Phase 3:** < 0.1 ms/Frame auf modernen Geräten.

### Mobile (Thailand — mittlere Geräte)

- Frame-Skip aktiv auf ≤2 Kernen / ≤480px → Tick nur 30 fps
- CSS zeroed sway, weight, shoulder → nur Atmung + Kopf sichtbar
- Page-Visibility stoppt alles bei App-Backgrounding

---

## Verhalten je Phase (Phase 3 Ergänzungen)

| Phase | Schulter | Gewicht | Noise-Intensität |
|-------|----------|---------|-----------------|
| idle / idle_breathing | 0.8° | ±1.8 px | 1× |
| thinking | 0.68° (breathMult 0.8) | ±1.8 px | 1.7× |
| listening | 0.8° | ±1.8 px | 1× |
| speaking | 0.88° (breathMult 1.1) | ±1.8 px | 1× |
| wai | 0.64° (breathMult 0.8) | ±1.8 px | 1× |

---

## Bekannte Grenzen

1. **Schulter-Overlay ist optisch** — keine echten Schulter-Elemente im DOM; wirkt als leichter Roll-Zusatz der Münze.
2. **Noise-Frequenzen** sind fest kodiert (0.23, 0.47, 0.79 etc.). Für Phase 4 könnten diese als konfigurierbare Parameter exponiert werden.
3. **Weight-Shift sichtbar nur auf Desktop** — auf Mobile per CSS auf 0px, da bei ≤480px der Coin-Stage bereits durch Layout-Constraints positioniert wird.
4. **Sakkaden** bleiben `Math.random()`-basiert (Intervall, nicht Amplitude) — für Phase 4: deterministische Sequenzen optional.
5. **frameSkip = 2** auf Low-End → 30 fps für Motion, Lip-Sync läuft weiter auf 60 fps (eigenständig in `osgLipSyncTick`).

---

## Regressionscheck

| Funktion | Status |
|----------|--------|
| LipSync (Amplitude + Viseme) | ✔ unverändert |
| Legacy `osgApplyAvatarTransform` | ✔ unverändert |
| `is-speaking`, `is-wai`, `is-busy` CSS-Guards | ✔ Motion deaktiviert via `:not()`-Selektor |
| Phase 1 Events / API | ✔ unverändert |
| Phase 2 Motor | ✔ alle Layer erhalten, nur intern verbessert |
| `prefers-reduced-motion` CSS | ✔ neue Vars ebenfalls genullt |
| `prefers-reduced-motion` Runtime | ✔ neu in Phase 3 |
| Mobile Performance | ✔ frameSkip + CSS-Zeroing |
| Page Visibility | ✔ neu in Phase 3 |
| Cloud TTS / lokale MP3 / Web Speech | ✔ unberührt |

---

## Empfehlungen für Phase 4

1. **Noise-Parameter konfigurierbar** via `OSG_DIGITAL_HUMAN_MOTION.setNoiseAmplitude(axis, value)`.
2. **Echtzeit-Lautstärke-Feedback** auf Schulter-Amplitude (Lauter sprechen → mehr Schulter).
3. **Facial Expression Layer** (SVG-Overlay für Mund/Augenbrauen) — für echtes Lip-Sync.
4. **Gaze-Kalibrierung** via MediaPipe Face Landmarks.
5. **Breath-Sound-Sync** — `_breath.phase` an Audio-Kontext-Clock koppeln.
