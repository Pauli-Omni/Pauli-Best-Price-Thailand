# OSG Production Polish — Final Integration Pass Report

**Datum:** 2026-06-26  
**Scope:** Integrations-Audit — keine neuen Features, kein Redesign, keine API-Änderungen  
**Methode:** Statische Code-Analyse aller DH-/Audio-/Startup-Pfade; Laufzeit-Smoke nicht auf physischen Geräten (Android/iPhone) durchgeführt

---

## Executive Summary

Die Digital-Human-Integration ist **funktional kohärent** und nach P1 **produktionsnah**. Es wurden **keine Architektur-Regressionen** gefunden. Drei konkrete Integrationslücken können zu sichtbarem State-Drift oder verpasstem Boot führen — eine davon wurde als echter Bug behoben (`leaveThinking` in `finally`).

| Metrik | Wert |
|--------|------|
| **Produktionsreife (gesamt)** | **89 %** |
| Post-P1 Baseline | 88 % |
| Issues gefunden | 8 |
| Davon behoben (dieser Pass) | 1 |
| P0 / Release-Blocker | 0 |

---

## 1. Visual State Transitions

### Architektur (5 Präfix-Familien auf `#coin-stage`)

| Layer | Präfix / Marker | Cleanup-Mechanismus |
|-------|-----------------|---------------------|
| Phase 1 Engine | `is-dh-*`, `data-dh-phase` | `clearDhPhaseClasses()` bei jedem `setPhase()` |
| Phase 2 Motion | `is-dh2-*` | Prefix-Scan bei `setPhase`/`setEmotion`/`setGesture` |
| Phase 4 Emotion | `is-dh4-active`, `is-dh4-emotion-*` | Emotion-Klasse ersetzt; Crossfade über Blend-Stack |
| Phase 6 Gesture | `is-dh6-gesture-*` | `clearCssGestures()` + Timer-`removeFromStack()` |
| Phase 7 Polish | `is-dh7-active`, `data-dh7-phase` | Persistent (additive Micro-Motion) |
| Legacy LipSync | `is-speaking` | `animate()`-Loop: `ttsLoading \|\| lipSyncActive` |
| Legacy Avatar | `is-wai`, `is-busy`, `is-anim-*` | Teilweise manuell in `main.module.js` / `pauli_avatar_animations.js` |

### Transition-Matrix

| Übergang | Mechanismus | Smooth? | Risiko |
|----------|-------------|---------|--------|
| idle ↔ idle_breathing | Engine `setPhase` + Motion-Sync | ✔ Spring/Crossfade P7 | Niedrig |
| idle → thinking | `enterThinking()` + P7 `think`-Impuls | ✔ | Niedrig |
| thinking → idle | `leaveThinking()` | ✔ | **Behoben:** `finally`-Guard (s. Issue F-01) |
| idle → listening | `enterListening()` + Eye `user` state | ✔ Pointer-Bus P1 | Niedrig |
| listening → speaking | `enterSpeaking()` via LipSync-Begin | ✔ P0-Sync | Niedrig |
| speaking → idle | `leaveSpeaking()` + `osgLipSyncStop` | ✔ | Niedrig |
| Emotion overlay | Phase-4-Blend 0.6 s Crossfade | ✔ | Niedrig |
| Gesture stack | CSS-Klassen + `osgAvatarGestureTick` | ✔ während Speaking | Mittel bei Interrupt (F-03) |

### Flicker-Risiken

1. **Transform-Kaskade:** P2/P4/P7 schreiben auf `.coin-visual-shadow-host--main`; `style.css` setzt `transform: none !important` auf `#coin-stage.is-speaking` — beabsichtigt, aber bei schnellen Phase-Wechseln kurz sichtbare Filter-/Transform-Sprünge möglich.
2. **DH6-Gesten während Speaking:** Gesture-CSS ist explizit `:not(.is-speaking)` — Overlays verschwinden während TTS (kein Flicker, aber Gesten unsichtbar während Sprechen).
3. **Emotion-Reapply bei Gesture-Intelligence:** Listener auf `osg:digital-human:emotion` kann Stack neu anwenden → kurzer CSS-Klassen-Flash (selten).

**Fazit:** Übergänge sind überwiegend smooth; verbleibende Artefakte sind kosmetisch (P2).

---

## 2. Duplicated / Conflicting CSS Classes

### Korrekt bereinigt

- `is-dh-*` — vollständiger Prefix-Remove vor neuem Phase-Set
- `is-dh2-emotion-*`, `is-dh2-gesture-*`, `is-dh2-phase-*` (+ Spezialklassen) — Prefix-Remove
- `is-dh4-emotion-*` — einzelne dominante Klasse
- `is-dh6-gesture-*` — `clearCssGestures()` vor `applyStack()`

### Bewusst parallel (kein Bug, aber Komplexität)

| Klassenpaar | Grund |
|-------------|-------|
| `is-dh2-phase-thinking` + `is-dh2-thinking` | Motion setzt beides für CSS-Selektoren |
| `is-speaking` + `is-dh-speaking` / `data-dh-phase="speaking*"` | Legacy LipSync + DH Phase (P0 synchronisiert) |
| `is-anim-wai` + `is-wai` | Wai-Animation (main.module + avatar_animations) |

### Nicht bereinigt (Issue F-02)

**`PHASE_LEGACY`-Klassen** (`is-anim-speak`, `is-anim-wai`, `is-busy`) werden in `setPhase()` **additiv** gesetzt, aber beim Phasenwechsel **nicht entfernt** (Kommentar: „never removed by legacy code"). In der Praxis oft durch `OSG_PauliAvatarAnimations.clearStateClasses()` kompensiert — bei reinem Engine-Pfad ohne LipSync können Klassen haften bleiben.

**Schwere:** Mittel | **Empfehlung:** Legacy-Klassen in `setPhase()` beim Verlassen der jeweiligen Phase entfernen (Whitelist-Map).

---

## 3. State-Class Cleanup beim Verlassen

| State | Cleanup | Vollständig? |
|-------|---------|--------------|
| Speaking | `leaveSpeaking()` → `setGesture(null)`; `osgLipSyncStop`; `is-speaking` remove | ✔ |
| Thinking | `leaveThinking()` → `idle_breathing` wenn Depth=0 | ✔ (nach F-01-Fix) |
| Listening | `leaveListening()` | ✔ |
| DH6 Gestures | Timer + `removeFromStack()` | ⚠ nicht bei Audio-Interrupt (F-03) |
| Wai | `stopWaiGreeting()` / `is-wai` remove | ✔ |
| Busy | `finally` in Companion-Boot | ✔ |
| Emotion blend | `removeEmotion()` / Crossfade | ✔ |

---

## 4. Startup Flow

```
App Load (index.html ~63 KB)
  → Sync: runtime-config, DH scripts (engine→motion→emotion→eye→gesture→polish)
  → DOMContentLoaded: DH install() × 5 → osg:digital-human:ready
  → Sync: osg-index-app-bootstrap.js → applyLang() → osgBootAppLang()
  → Deferred: osg-index-app-main.module.js → main()
      → Font preload
      → LipSync / playPauliVoice / stopAllSpeech wiring
      → animate() rAF loop
      → installPauliVoiceWake() + installPauliVoice()
```

### Ready-Signale

| Subsystem | Ready-Zeitpunkt | Signal |
|-----------|-----------------|--------|
| Avatar DOM | `main()` nach `#pauli-main-avatar-img` | implizit |
| DH Engine | `DOMContentLoaded` | `osg:digital-human:ready` |
| Emotion Layer | `DOMContentLoaded` | `install()` + neutral seed |
| Voice / TTS | `main()` nach `playPauliVoice` | `osgInstallPauliTtsGuard()` |
| Audio Registry | Script-Load `osg_audio_registry.js` | `OSG_AUDIO_REGISTRY` |
| Companion Boot | Timer / First-Gesture | `osgAvatarCompanionBoot()` |

### Race Conditions

| ID | Beschreibung | Schwere | Mitigation vorhanden? |
|----|--------------|---------|------------------------|
| F-04 | `osgScheduleAvatarCompanionBoot(1100)` kann feuern bevor `main()` `osgAvatarCompanionBoot` definiert | Niedrig | First-Gesture reschedule (160 ms); `BOOT_DONE`-Guard |
| F-05 | ES-Module `main()` deferred — Bootstrap-IIFE läuft zuerst | Erwartet | Companion-Boot wartet auf Funktion |
| — | TTS-Guard initial ohne `playPauliVoice` | Erwartet | Re-Install in `main()` Zeile 4131 |

**Fazit:** Keine kritische Race; langsames Font-Loading kann Companion-Boot um ≤1 s verzögern (First-Tap fängt ab).

---

## 5. Console Warnings & Errors

| Quelle | Typ | Wann | Schwere |
|--------|-----|------|---------|
| `[Pauli] Haupt-Avatar-Bild fehlt` | `console.warn` | `#pauli-main-avatar-img` absent | Info (Dev) |
| `[TTS Guard] playPauliVoice nicht registriert` | `console.warn` | Guard vor `main()` | Harmlos (transient) |
| `[TTS Guard] Fehler beim Abspielen` | `console.error` | TTS-Reject | Erwartet bei Fehler |
| `[TTS Guard] Queue voll` | `console.log` | Queue > 3 | Info |
| `console.error(e)` | main.module ~304 | Avatar-Init-Fehler | Dev |

**Kein globaler `unhandledrejection`-Handler** — siehe Abschnitt 6.

---

## 6. Uncaught Promise Rejections

### Abgesichert

- `osg_tts_guard.js`: `catch` + `reject` an Caller
- `speakPauliLine`, `osgAvatarSpeakLine`: try/catch
- `void fn().catch(() => {})` bei Notification/AudioContext resume
- `video.play().catch(...)` in `pauli_avatar_animations.js`

### Restrisiko

| Pfad | Risiko |
|------|--------|
| `void window.osgAvatarCompanionBoot()` | Boot-internes `catch (_) {}` — silent |
| Externe `await osgPauliLiveSpeakReply` ohne try | Mittel — meist in async Kontext mit äußerem catch |
| `guardedPlayPauliVoice` Reject | Caller muss `.catch` — Live-Pfade tun das größtenteils |

**Empfehlung (P2):** Globaler `unhandledrejection`-Logger für Produktion (Sentry o.ä.).

---

## 7. Audio Interruption — Clean State

### Interrupt-Kette (`osgPauliInterrupt` → `osgPauliTtsAbort` → `stopAllSpeech`)

| Subsystem | Bereinigt? |
|-----------|------------|
| TTS Queue | ✔ `osgPauliTtsClearQueue` |
| Web Speech | ✔ `speechSynthesis.cancel` |
| HTML Audio / Buffer | ✔ Registry + Legacy |
| LipSync | ✔ `osgLipSyncStop` → `osgDhLeaveSpeaking` |
| Avatar Anim Speak | ✔ `onSpeakStop` |
| Legacy Gesture (`osgAvatarGestureStop`) | ✔ |
| DH6 CSS Gesture Stack | ✗ (F-03) |
| `is-speaking` | ✔ via LipSync-Stop |
| Abort Epoch | ✔ 80 ms Freigabe-Timer |

**Fazit:** Audio-Pfad ist sauber; DH6-Overlay-Timer können nach Interrupt kurz weiterlaufen.

---

## 8. Animation Interruption → Idle

| Pfad | Idle-Rückkehr |
|------|---------------|
| `stopAllSpeech()` | ✔ `osgAvatarGestureStop` + `osgLipSyncStop` + `leaveSpeaking` |
| `osgAvatarGestureTick` timeout | ✔ `osgAvatarGestureStop()` bei `t >= 1` |
| `onSpeakStop` | ✔ `setState("idle")` wenn speakRefCount=0 |
| `leaveSpeaking` | ✔ `setPhase("idle_breathing")` + `setGesture(null)` |
| Wai interrupt | ✔ `onWaiStop` → idle wenn kein speak |
| DH6 CSS gestures | ⚠ Timer-basiert, nicht an Audio gekoppelt |

---

## 9. Mobile Behaviour (Code-Review)

| Aspekt | Android Chrome | iPhone Safari | Status |
|--------|----------------|---------------|--------|
| Audio unlock | `unlockAudioSystemFromCoinGesture` + silent buffer | ✔ gleicher Pfad | ✔ |
| `playsinline` Video | ✔ gesetzt | ✔ erforderlich für iOS | ✔ |
| Touch / Pointer | `OSG_DH_POINTER_BUS` touchmove passive | ✔ | ✔ |
| `prefers-reduced-motion` | Motion/Polish skip | ✔ | ✔ |
| Frame skip ≤480px | `_frameSkip >= 2` | ✔ | ✔ |
| Safe-Area / Layout | `style.css` + mobile-first rules | Nicht live verifiziert | Code ✔ |
| WebSpeech Fallback | `playPauliWebSpeechFallback` + DH sync | Safari-limitiert | Bekannt |

**Hinweis:** Kein Zugriff auf reale Android/iPhone-Geräte in diesem Pass — Empfehlung: Smoke auf iPhone Safari 17+ und Pixel Chrome vor Marketing-Launch.

---

## 10. Issues — Vollständige Liste

| ID | Schwere | Bereich | Befund | Status | Empfohlener Fix |
|----|---------|---------|--------|--------|-----------------|
| **F-01** | **Hoch** | DH / Live | `leaveThinking()` fehlte bei `osgPauliChatFetch`-Fehler → Phase blieb `thinking` | **✔ Behoben** | `finally { leaveThinking() }` in `osg-index-app-main.module.js` |
| **F-02** | Mittel | CSS / Engine | `PHASE_LEGACY`-Klassen (`is-anim-speak` etc.) werden nie entfernt | Offen | Legacy-Remove-Map in `setPhase()` |
| **F-03** | Mittel | Gesture | `stopAllSpeech` ruft nicht `OSG_DH_GESTURE_INTELLIGENCE.clearGestures()` auf | Offen | In `stopAllSpeech` oder Interrupt-Hook aufrufen |
| **F-04** | Niedrig | Startup | Companion-Boot-Timer kann vor `main()` feuern (no-op) | Akzeptiert | Optional: `osg:digital-human:ready` als Boot-Trigger |
| **F-05** | Niedrig | CSS | 5 Transform/Filter-Layer (P2/P4/P7) — subtile Sprünge | Offen (P2) | Compound-Selector |
| **F-06** | Niedrig | A11y | `#coin-stage` ohne `aria-label` bis `applyLang()` | Akzeptiert (P1) | Frühe aria-Hydration |
| **F-07** | Niedrig | Ops | Kein `unhandledrejection`-Monitoring | Offen | Globaler Handler + Reporting |
| **F-08** | Info | Console | Transient `[TTS Guard] playPauliVoice nicht registriert` beim ersten Load | Harmlos | Guard-Reihenfolge dokumentiert |

---

## 11. Angewandter Fix (einziger Code-Change)

**F-01:** `leaveThinking()` in `finally`-Block nach LLM-Fetch — garantiert Idle-Rückkehr bei Netzwerkfehler, Rate-Limit und Interrupt während Fetch.

```javascript
} finally {
  if (window.OSG_DIGITAL_HUMAN?.leaveThinking) {
    window.OSG_DIGITAL_HUMAN.leaveThinking();
  }
}
```

Keine API-Änderung. Kein Verhalten bei erfolgreichem Pfad geändert.

---

## 12. Produktionsreife

| Dimension | % | Δ vs. P1 |
|-----------|---|----------|
| Funktionale Vollständigkeit | 90 | +1 |
| Korrektheit / State-Kohärenz | 90 | +2 |
| Performance | 86 | = |
| Wartbarkeit | 78 | = |
| Security | 84 | = |
| Accessibility | 78 | = |
| Mobile (Code-Basis) | 80 | +2 |
| Integration / Polish | 85 | neu |
| **Gewichtet gesamt** | **89 %** | **+1** |

### Release-Empfehlung

| Stufe | Empfehlung |
|-------|------------|
| Internal / QA | ✔ Freigeben |
| Soft Launch (TH) | ✔ Freigeben (mit Mobile-Smoke) |
| Marketing Launch | ✔ Freigeben nach F-02/F-03 Optional-Fix oder bewusster Accept |

---

## 13. Empfohlene nächste Schritte (P2, keine Features)

1. **F-03:** `clearGestures()` in `stopAllSpeech()` — 1 Zeile, kein API-Break
2. **F-02:** Legacy-Klassen-Cleanup in `setPhase()`
3. Mobile Smoke-Matrix (iPhone Safari + Android Chrome): Coin-Tap → Greeting → Interrupt → Idle
4. CSP Report-Only in Staging auswerten (P1)

---

*Final Integration Pass — Feature Freeze eingehalten. Ein echter Bug (F-01) behoben; alle übrigen Findings dokumentiert.*
