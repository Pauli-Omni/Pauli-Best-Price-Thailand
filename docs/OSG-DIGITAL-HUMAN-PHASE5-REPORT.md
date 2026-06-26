# OSG Digital Human — Phase 5 Report: Eye Contact

**Generated:** 2026-06-26  
**Scope:** Eye Contact Engine (additive, backward-compatible)  
**Basis:** Phase 1–4 vollständig erhalten, nur erweitert

---

## Neue Dateien

| Datei | Inhalt |
|-------|--------|
| `assets/scripts/osg_dh_eye_contact.js` | Gaze-State-Machine, Spring-Interpolation, Cursor-Tracking |
| `assets/styles/osg_dh_eye_contact.css` | Gaze-Overlay, State-Opacity, Reduced-Motion |
| `docs/OSG-DIGITAL-HUMAN-PHASE5-REPORT.md` | Dieser Report |

## Geänderte Dateien (additiv)

| Datei | Änderung |
|-------|---------|
| `index.html` | +1 CSS-Link, +1 Script-Tag, +5 Zeilen im `animate()`-Loop |

**Keine Änderungen an:** Phase 1–4, `playPauliVoice`, `OSGLipSync`, Audio-Registry, Empathy-Logic.

---

## Architektur

### Gaze-Layer-Stack (additiv)

```
Phase 2/3  --dh2-eye-x/y   Mikro-Drift + Sakkaden
Phase 4    --dh4-eye-x/y   Emotions-Offset
Phase 5    --dh5-eye-x/y   Gaze-State-Machine
           ─────────────────────────────────────
           CSS calc() kombiniert alle drei
```

Alle drei werden per `calc()` im `::before`-Radialgradienten summiert:

```css
calc(50% + var(--dh2-eye-x) + var(--dh4-eye-x) + var(--dh5-eye-x))
calc(35% + var(--dh2-eye-y) + var(--dh4-eye-y) + var(--dh5-eye-y))
```

### State Machine

```
idle          → camera (3–8 s hold)
                       ↓
thinking      → away_think ↔ away_recall ↔ return → camera
                (0.8–2.2 s per state)
                       ↓
listening     → user (cursor tracking) | camera (kein Cursor)
                (1.5–4.0 s per state)
                       ↓
speaking      → camera (60%) | scan_left (20%) | scan_right (15%) | away_recall (5%)
                (0.9–2.4 s per state)
```

### Spring-Interpolation

Kritisch gedämpfte Feder (kein Lerp):
- `stiffness = 28`, `damping = 8.2`
- Kein Überschwingen, aber organische Ankunft
- Kein abrupter Sprung beim Zustandswechsel

---

## Virtuelle Blick-Punkte

| Name | x (normiert) | y (normiert) | Verwendung |
|------|-------------|-------------|-----------|
| `camera` | 0.00 | 0.00 | Direkter Blickkontakt |
| `user` | 0.00 | -0.05 | Cursor-Tracking (Listening) |
| `away_think` | -0.28 | +0.22 | Links-unten (Thinking) |
| `away_recall` | 0.00 | -0.30 | Aufblicken (Erinnern) |
| `scan_left` | -0.22 | +0.05 | Links (Speaking: Referenz) |
| `scan_right` | +0.24 | +0.05 | Rechts (Speaking: Referenz) |
| `away_side` | +0.32 | +0.10 | Weiter rechts (Ablenkung) |
| `return` | 0.00 | 0.00 | Übergang zurück |

Eigene Punkte können per `addGazePoint(name, x, y)` hinzugefügt werden.

---

## Neue CSS Custom Properties

| Property | Wertebereich | Beschreibung |
|----------|-------------|--------------|
| `--dh5-eye-x` | ±4.5 px | Gaze-State X-Offset (additiv) |
| `--dh5-eye-y` | ±2.8 px | Gaze-State Y-Offset (additiv) |
| `--dh5-gaze-x` | ±0.5 | Normierter Gaze-X (für externe Nutzung) |
| `--dh5-gaze-y` | ±0.4 | Normierter Gaze-Y |

---

## Neue CSS-Klassen / Data-Attribute

| Attribut | Wert | Zweck |
|---------|------|-------|
| `data-dh5-state` | `camera`, `user`, `away_think`, … | CSS-State-Selektoren, Debugging |

---

## Neue JS-API: `window.OSG_DH_EYE_CONTACT`

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `install()` | `() → boolean` | Auto bei DOMContentLoaded |
| `tick(dt)` | `(number) → void` | Gaze-Tick (aus animate()-Loop) |
| `setPhase(phase)` | `(string) → void` | Phase-Wechsel → Zustandsübergang |
| `lookAt(state, hold)` | `(string, s?) → void` | Erzwingt Blick-Zustand für `hold` Sekunden |
| `setEnabled(bool)` | `(boolean) → void` | Engine ein/ausschalten |
| `getGazePoints()` | `() → object` | Alle definierten Blick-Punkte |
| `addGazePoint(name, x, y)` | `(str, -1..1, -1..1) → void` | Neuen Blick-Punkt hinzufügen |
| `getState()` | `() → object` | Aktueller Zustand + Gaze-Koordinaten |

---

## Blickverhalten je Phase

| Phase | Dominanter Zustand | Varianten | Hold-Zeit |
|-------|--------------------|-----------|----------|
| `idle` | camera | — | 3–8 s |
| `thinking` | away_think | away_recall, return, camera | 0.8–2.2 s |
| `thinking_deep` | away_think/recall | — | 1.2–3.0 s |
| `listening` | user (cursor) | camera (kein Cursor) | 1.5–4.0 s |
| `listening_focus` | user (cursor) | camera | 1.5–4.0 s |
| `speaking` | camera (60%) | scan_left, scan_right, away_recall | 0.9–2.4 s |
| `speaking_sales` | camera (60%) | scans | 0.6–1.8 s (lebhafter) |

---

## Regressionscheck

| Funktion | Status |
|----------|--------|
| Phase 2/3 `tickEye()` | ✔ läuft weiter unmodifiziert, schreibt `--dh2-eye-*` |
| Phase 4 Emotion eye-Kanal | ✔ schreibt `--dh4-eye-*`, addiert sich |
| Phase 5 Spring-Gaze | ✔ schreibt `--dh5-eye-*`, addiert sich |
| `::before` Glow-Overlay | ✔ Phase 5 CSS überschreibt Phase 2/3 und 4 mit vollständiger calc()-Formel |
| `is-speaking` / `is-wai` / `is-busy` Guards | ✔ nicht berührt (Eye-System schreibt Vars, keine Transforms) |
| `prefers-reduced-motion` | ✔ `--dh5-eye-*` auf 0 gesetzt |
| Mobile ≤480px | ✔ `--dh5-eye-*` auf 0 (Glow bleibt zentriert) |
| Cursor-Tracking | ✔ `passive: true` EventListener, kein Scroll-Block |
| Touch-Tracking | ✔ `touchmove` listener (Mobile) |
| `playPauliVoice` / LipSync | ✔ unberührt |

---

## Bekannte Grenzen

1. **Gaze ist Licht-Overlay** — kein echtes Auge als DOM-Element; Blickrichtung nur als Luminanzverschiebung sichtbar.
2. **Cursor-Tracking** arbeitet mit Maus/Touch — kein Face-/Eye-Tracking via Kamera (Phase 6+).
3. **Speaking-Scan-Punkte** sind fest (links/rechts); keine content-basierten Punkte (z. B. „zeige auf Produkt").
4. **Spring-Parameter** sind einheitlich — könnten pro State variieren (schneller für surprised, langsamer für sad).

---

## Empfehlungen für Phase 6

1. **SVG-Augen-Rig** — separate `<circle>` Elemente für Pupillen + Iris, steuerbar via `--dh5-gaze-x/y`.
2. **Content-basierte Scan-Punkte** — beim Erwähnen eines Produktnamens → `lookAt("scan_right")` auf den Produktbereich.
3. **MediaPipe Face Detection** — echtes Augen-Tracking des Nutzers → Avatar folgt.
4. **Blink-Synchronisation** — `away_think` → automatisch etwas häufigeres Blinzeln (Phase 3 Blink-Impulse bereits vorhanden).
5. **Gaze-History** — letzte N Blickpunkte tracken → bei Wiedereintritt in Phase immer abwechslungsreicher.
