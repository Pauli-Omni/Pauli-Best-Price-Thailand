# OSG Digital Human — Phase 6 Report: Gesture Intelligence

**Generated:** 2026-06-26  
**Scope:** Deterministic, combinable gesture selection (additive, backward-compatible)  
**Basis:** Phase 1–5 vollständig erhalten, nur erweitert

---

## Neue Dateien

| Datei | Inhalt |
|-------|--------|
| `assets/scripts/osg_dh_gesture_intelligence.js` | Intent-Klassifikation, Emotions-Bias, Gesten-Stack, `chooseGesture`-Wrap |
| `assets/styles/osg_dh_gesture_intelligence.css` | Kombinierbare `is-dh6-gesture-*` Overlays |
| `docs/OSG-DIGITAL-HUMAN-PHASE6-REPORT.md` | Dieser Report |

## Geänderte Dateien (additiv)

| Datei | Änderung |
|-------|---------|
| `index.html` | +1 CSS-Link, +1 Script-Tag (nach Phase 5, vor Bridge) |

**Keine Änderungen an:** Phase 1–5 Kern-APIs, `playPauliVoice`, `OSGLipSync`, Audio-Registry, Empathy-Logic (nur gelesen).

---

## Problem (vor Phase 6)

`OSG_DIGITAL_HUMAN.chooseGesture()` in Phase 1 nutzte einfache Regex-Heuristiken:

- Eine einzelne Geste pro Antwort
- Keine Emotions-Kopplung
- Keine Intent-Typen (Verkauf, Erklärung, Verabschiedung, Entschuldigung, Humor)
- Keine kombinierbaren Overlays

---

## Architektur Phase 6

### Gesten-Stack (kombinierbar, max. 3)

```
Antwort-Text
     ↓
classifyIntent()  →  sales | explanation | greeting | farewell | apology | humor | …
     +
currentEmotion()  →  happy | sad | sympathy | curious | sales | …
     ↓
resolveGestureStack()  →  [primary, secondary, tertiary]
     ↓
┌─────────────────────────────────────────────────────────────┐
│ Primary  → osgAvatarGestureStart (Legacy, Phase 1)          │
│          → OSG_DIGITAL_HUMAN.setGesture()                   │
│          → OSG_DIGITAL_HUMAN_MOTION.setGesture()            │
│ Secondary/Tertiary → is-dh6-gesture-* CSS auf #coin-stage   │
│ Bridge (optional)  → trigger3DAvatar (Laugh, Applause, Lean)│
└─────────────────────────────────────────────────────────────┘
```

### Intent-Typen

| Intent | Beispiel-Trigger (Klassifikation) | Standard-Gesten-Stack |
|--------|-----------------------------------|------------------------|
| `greeting` | hello, welcome, sawadee, … | greet + wai |
| `farewell` | bye, goodbye, auf wiedersehen, … | wave_goodbye + acknowledge |
| `apology` | sorry, entschuldigung, … | apologize + empathy_soft |
| `humor` | lol, funny, joke, … | humor_laugh + celebrate |
| `sales` | buy, offer, discount, price, … | sales_present + point_right + confirm |
| `explanation` | explain, because, step, guide, … | explain + point_left + help |
| `confirmation` | yes, ok, confirm, … | confirm + acknowledge |
| `question` | `?` / `？` | help + point_left |
| `empathy` | understand, support, … | empathy_soft + acknowledge |
| `celebration` | congrat, success, … | celebrate + confirm |
| `neutral` | (Fallback) | acknowledge |

### Emotions-Bias (additiv zum Stack)

| Emotion | Zusätzliche Gesten-Tendenz |
|---------|---------------------------|
| `happy` | celebrate |
| `sad`, `sympathy`, `separation` | empathy_soft |
| `curious` | help, point_left |
| `confident`, `sales` | confirm, point_right / sales_present |
| `friendly`, `love` | greet |
| `listening` | listen_nod |
| `thinking` | explain |

Emotion wird aus `OSG_DIGITAL_HUMAN.state.emotion` oder dem Top-Eintrag von `OSG_DH_EMOTION_LAYER.getStack()` gelesen.

---

## API

```js
window.OSG_DH_GESTURE_INTELLIGENCE = {
  install(),                    // wrappt chooseGesture (automatisch bei Load)
  classifyIntent(text),         // { intent, score }
  resolveGestureStack(intent, emotion, opts),
  applyFromReply(reply, opts),  // klassifizieren + anwenden
  addGesture(id, opts),
  removeGesture(id),
  clearGestures(),
  getStack(),                   // aktive Gesture-IDs
  getLastIntent(),
  INTENTS, GESTURES
};
```

### chooseGesture-Wrap (kein API-Break)

Beim Load ersetzt Phase 6 `OSG_DIGITAL_HUMAN.chooseGesture` durch eine intelligente Variante. Das Original liegt unter `OSG_DIGITAL_HUMAN._origChooseGesture`.

```js
// Legacy erzwingen (nur für Tests):
OSG_DIGITAL_HUMAN.chooseGesture(reply, { useLegacy: true });
```

Der bestehende Aufruf in `index.html` (vor `osgPauliLiveSpeakReply`) bleibt unverändert — profitiert automatisch von Phase 6.

### Event

```js
document.addEventListener('osg:digital-human:gesture-intelligence', (e) => {
  // e.detail: { intent, gestures[], emotion }
});
```

Bei Emotionswechsel (`osg:digital-human:emotion`) wird der Stack bei aktivem Intent neu aufgelöst.

---

## Gesten-Definitionen

| ID | Legacy (osgAvatarGestureStart) | CSS-Overlay | Bridge |
|----|-------------------------------|-------------|--------|
| acknowledge | acknowledge | — | — |
| confirm | confirm | — | — |
| help | help | — | — |
| greet | greet | — | — |
| wai | wai | — | — |
| celebrate | acknowledge | is-dh6-gesture-celebrate | applause |
| point_left | help | is-dh6-gesture-point-left | — |
| point_right | help | is-dh6-gesture-point-right | — |
| explain | help | is-dh6-gesture-explain | — |
| sales_present | confirm | is-dh6-gesture-sales-present | lean_forward |
| apologize | acknowledge | is-dh6-gesture-apologize | — |
| wave_goodbye | greet | is-dh6-gesture-wave-goodbye | — |
| humor_laugh | acknowledge | is-dh6-gesture-humor-laugh | laugh_animation |
| listen_nod | acknowledge | is-dh6-gesture-listen-nod | — |
| empathy_soft | greet | is-dh6-gesture-empathy-soft (filter) | — |

---

## Performance & Barrierefreiheit

- **Kein zusätzlicher rAF-Loop** — Gesten laufen über `setTimeout` + CSS
- **`prefers-reduced-motion`:** alle `is-dh6-gesture-*` Animationen deaktiviert
- **Mobile ≤480px:** dh6-Animationen aus (nur Legacy-Geste + Phase bleibt aktiv)
- **Kein Random** — deterministische Regex-Scores + feste Intent→Gesten-Maps

---

## Abhängigkeiten (Lade-Reihenfolge)

```
osg_digital_human_engine.js      ← chooseGesture (wird gewrappt)
osg_digital_human_motion.js
osg_dh_emotion_layer.js
osg_dh_eye_contact.js
osg_dh_gesture_intelligence.js ← install() wrappt chooseGesture
avatar-3d-bridge.js              ← optional für Laugh/Applause/Lean
```

---

## Manuelle Tests

1. **Begrüßung:** „Hello, welcome!“ → Intent `greeting`, Gesten `greet` + `wai`
2. **Verkauf:** „Best price offer discount“ → Intent `sales`, `sales_present` + `point_right` + `confirm`, Phase `speaking_sales`
3. **Erklärung:** „Let me explain how it works step by step“ → `explain` + `point_left` + `help`
4. **Verabschiedung:** „Goodbye, see you“ → `wave_goodbye` + `acknowledge`
5. **Entschuldigung:** „Sorry for the delay“ → `apologize` + `empathy_soft`
6. **Humor:** „That is funny haha“ → `humor_laugh` + `celebrate`, Bridge-Laugh
7. **Emotion:** Nach Empathy-Trigger `sympathy` → zusätzlich `empathy_soft` im Stack
8. **Reduced motion:** OS-Einstellung aktiv → keine dh6-Keyframes

---

## Bekannte Grenzen

- Klassifikation ist regex-basiert (kein LLM) — Intent aus Antwort-Text, nicht aus internem Intent-Key
- Max. 3 gleichzeitige Gesten; CSS-Animation auf `.coin-visual-shadow-host--main` kann nur eine Keyframe-Animation tragen — Filter-Gesten (`empathy_soft`) kombinieren sich besser als mehrere Keyframes
- `speechKey` / `segmentKey` aus Live-Chat werden noch nicht direkt für Gesten genutzt (Erweiterung Phase 7 möglich)
- Bridge-Sounds (Laugh/Clap) nur wenn Locale-MP3 vorhanden

---

## Phase 6 — Abgeschlossen

Gesten sind **nicht mehr zufällig**, sondern abhängig von **Emotion**, **Antworttyp** (Verkauf, Erklärung, Begrüßung, Verabschiedung, Entschuldigung, Humor) und **kombinierbar** über den Gesten-Stack.
