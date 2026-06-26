# OSG Digital Human — Phase 4 Report: Emotion Layer

**Generated:** 2026-06-26  
**Scope:** Emotion Blend System (additive, backward-compatible)  
**Basis:** Phase 1 / 2 / 3 vollständig erhalten, nur erweitert

---

## Neue Dateien

| Datei | Inhalt |
|-------|--------|
| `assets/scripts/osg_dh_emotion_layer.js` | Blend-Stack, Crossfade, Intensität, Channel-Control |
| `assets/styles/osg_dh_emotion_layer.css` | Phase-4-Filter + Transform-Layer |
| `docs/OSG-DIGITAL-HUMAN-PHASE4-REPORT.md` | Dieser Report |

## Geänderte Dateien (additiv)

| Datei | Änderung |
|-------|---------|
| `index.html` | +1 CSS-Link, +1 Script-Tag, +5 Zeilen im `animate()`-Loop |

**Keine Änderungen an:**
- Phase 1/2/3 Engines
- `playPauliVoice`, `OSGLipSync`, `OSG_AUDIO_REGISTRY`, `OSG_EMPATHY_LOGIC`
- `osgApplyAvatarTransform`, `osgAvatarGestureTick`

---

## Architektur

### Blend-Stack

```
_stack = [
  { name: "neutral", weight: 1.0, targetWeight: 1.0, channel: "all" },
  { name: "happy",   weight: 0.7, targetWeight: 1.0, channel: "all" },
  { name: "thinking",weight: 0.3, targetWeight: 0.5, channel: "head" },
]
```

- Max 4 gleichzeitige Emotionen (konfigurierbar)
- Jede Emotion hat `weight` (aktuell) + `targetWeight` (Ziel)
- Übergang über `fadeDuration` (Standard 0.6 s), ease-in-out
- Abgeschlossene Fade-outs (weight → 0) werden aus dem Stack entfernt

### Drei getrennte Kanäle

| Kanal | CSS-Output | Beschreibung |
|-------|-----------|--------------|
| `face` | `--dh4-face-bright`, `--dh4-face-sat`, `--dh4-face-contrast` | Helligkeit, Sättigung, Kontrast via `filter` |
| `eye` | `--dh4-eye-x`, `--dh4-eye-y` | Additiver Blickrichtungs-Offset (px) |
| `head` | `--dh4-head-rx`, `--dh4-head-rz` | Additiver Kopf-Pitch/Roll-Offset (deg) |

### Additivität zu Phase 2/3

```css
/* Phase 4 head vars addiert zu Phase 2/3 head vars */
rotateX(calc(var(--dh2-head-rx) + var(--dh4-head-rx)))
rotateZ(calc(var(--dh2-head-rz) + var(--dh2-sway-z) + var(--dh2-shoulder-rz) + var(--dh4-head-rz)))

/* Phase 4 eye vars addiert zu Phase 2/3 eye vars */
calc(50% + var(--dh4-eye-x) + var(--dh2-eye-x))
```

---

## Neue CSS Custom Properties

| Property | Wertebereich | Kanal |
|----------|-------------|-------|
| `--dh4-face-bright` | 0.85–1.12 | face |
| `--dh4-face-sat` | 0.75–1.22 | face |
| `--dh4-face-contrast` | 0.92–1.09 | face |
| `--dh4-head-rx` | ±8 deg | head |
| `--dh4-head-rz` | ±4 deg | head |
| `--dh4-eye-x` | ±11 px | eye |
| `--dh4-eye-y` | ±10 px | eye |
| `--dh4-ambient` | rgba (pro Emotion) | Hintergrund-Glow |

---

## Neue CSS-Klassen

| Klasse | Trigger | Zweck |
|--------|---------|-------|
| `is-dh4-active` | Stack nicht leer | Aktiviert filter + transform + glow |
| `is-dh4-emotion-{name}` | Dominante Emotion | Ambient-Glow-Farbe |

---

## Neue JS-API: `window.OSG_DH_EMOTION_LAYER`

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `install()` | `() → boolean` | Auto bei DOMContentLoaded |
| `tick(dt)` | `(number) → void` | Blend-Tick (aus animate()-Loop) |
| `setEmotion(name, intensity, opts)` | `(str, 0–100, opts?) → void` | Crossfade zu einer Emotion; alle anderen faden aus |
| `addEmotion(name, intensity, opts)` | `(str, 0–100, opts?) → entry` | Fügt Emotion zum Stack hinzu (oder updatet) |
| `removeEmotion(name, channel, fade)` | `(str, str?, s?) → void` | Faded Emotion aus |
| `blendTwo(nameA, pctA, nameB, pctB, opts)` | `(...) → void` | Direkt zwei Emotionen mischen |
| `setChannelIntensity(ch, pct)` | `(str, 0–100) → void` | Skaliert einen Kanal global |
| `setDefaultFade(s)` | `(number) → void` | Fade-Dauer ändern |
| `setMaxStack(n)` | `(number) → void` | Max gleichzeitige Emotionen |
| `getStack()` | `() → array` | Aktueller Stack-Zustand |
| `getBlended()` | `() → object` | Aktuelle blended-Werte |
| `getEmotionDefs()` | `() → string[]` | Alle definierten Emotions-Keys |

### `opts`-Objekt

| Key | Typ | Default | Beschreibung |
|-----|-----|---------|-------------|
| `fadeDuration` | number | 0.6 | Übergangszeit in Sekunden |
| `channel` | string | `"all"` | `"all"` \| `"face"` \| `"eye"` \| `"head"` |

---

## Emotions-Definitionen (16 Emotionen)

| Emotion | Face bright | Face sat | Head rx | Head rz | Eye x | Eye y |
|---------|------------|---------|---------|---------|-------|-------|
| neutral | 1.00 | 1.00 | 0° | 0° | 0 | 0 |
| happy | 1.10 | 1.12 | -2° | +1.5° | 0 | -1.2 |
| sad | 0.90 | 0.82 | +5° | -1.5° | 0 | +1.8 |
| anger | 0.96 | 1.18 | +2° | -0.8° | 0 | +0.6 |
| separation | 0.88 | 0.78 | +6° | -2.5° | -0.8 | +2.0 |
| surprised | 1.06 | 1.10 | -4° | 0° | 0 | -2.0 |
| confident | 1.04 | 1.05 | -1° | +1° | 0 | -0.5 |
| thinking | 0.97 | 0.95 | +3° | -1.5° | -1.5 | +1.0 |
| listening | 1.02 | 1.02 | -3° | +1° | 0 | -0.8 |
| love | 1.08 | 1.20 | -2° | +2.5° | 0 | -1.5 |
| stress | 0.94 | 1.08 | +2° | -0.5° | +0.6 | +0.8 |
| curious | 1.04 | 1.06 | -2° | +3.5° | +1.0 | -0.8 |
| professional | 1.00 | 0.98 | 0° | 0° | 0 | 0 |
| serious | 0.96 | 0.92 | +1° | -0.5° | 0 | +0.5 |
| friendly | 1.07 | 1.10 | -1° | +2° | 0 | -1.0 |
| sales | 1.08 | 1.14 | -1° | +1.5° | 0 | -0.8 |

---

## Beispiel-Nutzung

```js
// Einfacher Wechsel (wie Phase 1/2/3)
OSG_DH_EMOTION_LAYER.setEmotion("happy");

// Mit Intensität und Fade
OSG_DH_EMOTION_LAYER.setEmotion("sad", 70, { fadeDuration: 1.2 });

// Zwei Emotionen gleichzeitig
OSG_DH_EMOTION_LAYER.blendTwo("confident", 80, "friendly", 60);

// Nur Kopf-Kanal mit Emotion steuern
OSG_DH_EMOTION_LAYER.addEmotion("thinking", 100, { channel: "head" });

// Augen-Intensität reduzieren (z.B. bei STT-Feedback)
OSG_DH_EMOTION_LAYER.setChannelIntensity("eye", 40);

// Stack inspizieren
console.log(OSG_DH_EMOTION_LAYER.getStack());
// → [{name:"neutral", weight:100}, {name:"happy", weight:80, channel:"all"}]
```

---

## Backward Compatibility

- `OSG_EMPATHY_LOGIC.classifyEmotion()` → `"osg:digital-human:emotion"` Event → `setEmotionBlend()` in Phase 4 ✔
- Phase 2/3 `setEmotion()` → setzt `_emotion.current` für Motion-Layer ✔ (unverändert)
- Phase 4 Tick ist additiv — beide laufen unabhängig ✔
- Legacy `is-dh2-emotion-*` und `is-dh4-emotion-*` Klassen koexistieren ✔

---

## Regressionscheck

| Funktion | Status |
|----------|--------|
| Phase 1 Engine | ✔ unverändert |
| Phase 2/3 Motion Engine | ✔ unverändert |
| LipSync (Phase 2/3) | ✔ unberührt |
| `is-speaking` / `is-wai` CSS-Guards | ✔ Phase-4-Transform nutzt denselben `:not()`-Selektor |
| `playPauliVoice` | ✔ unberührt |
| `OSG_EMPATHY_LOGIC` | ✔ nur Event-Listener, kein Eingriff |
| `prefers-reduced-motion` CSS | ✔ alle dh4-Vars genullt |
| Mobile ≤480px | ✔ head-Vars off, Ambient-Glow off |

---

## Bekannte Grenzen

1. **Kein Facial-Rig** — face-Kanal arbeitet über CSS `filter` (brightness/saturation/contrast), kein SVG-Overlay mit Mund/Augenbrauen.
2. **Eye-Overlay** ist Glow-Radient, kein echter Augapfel.
3. **Max 4 gleichzeitige Emotionen** — konfigurierbar via `setMaxStack(n)`, aber bei > 4 werden schwächste Einträge verdrängt.
4. **Ambient-Glow** nutzt `::after` auf `#coin-stage` — kann mit anderen Pseudo-Elementen kollidieren (aktuell konfliktfrei).

---

## Empfehlungen für Phase 5

1. **SVG-Facial-Layer** — Augenbrauen, Mundwinkel als separate DOM-Elemente mit Morph-Targets.
2. **Emotion-Sequencing** — zeitgesteuerte Emotion-Sequenzen (z. B. `[{name:"sad", at:0}, {name:"hopeful", at:2.5}]`).
3. **Audio-Driven Emotion** — Amplitude der Stimme → `sales`-Intensität.
4. **Emotion-History** — letzten N Emotionen tracken für Rückkehr.
5. **API-Erweiterung** — `tweenTo(name, duration)` als Promise-basierte Variante von `setEmotion`.
