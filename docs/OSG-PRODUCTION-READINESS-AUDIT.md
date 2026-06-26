# OSG Production Readiness — Final Engineering Audit

**Datum:** 2026-06-26  
**Scope:** Gesamtprojekt Pauli Best Price inkl. Digital Human (Phase 1–7), Audio/TTS, API, SPA  
**Methode:** Statische Code-Analyse — **keine Dateien geändert**  
**Feature Freeze:** aktiv — nur Bewertung und Dokumentation

---

## Executive Summary

| Metrik | Bewertung |
|--------|-----------|
| **Produktionsreife gesamt** | **79 %** |
| Digital Human (nach P0) | 82 % |
| Code-Qualität / Wartbarkeit | 58 % |
| Memory / Ressourcen | 74 % |
| Mobile Performance | 76 % |
| Accessibility | 71 % |
| Security (Client + API) | 77 % |
| UX (Erstbenutzer) | 73 % |

**Release-Empfehlung:** **Soft Launch / Staged Production** mit Monitoring (FPS, TTS-Fehler, API-429, Crash-Reports). Full-Scale-Production nach Abarbeitung der **P1-Liste** (2–4 Wochen Engineering-Fokus). **P0 R-01 (Speaking-Sync) ist behoben** — kein offener Release-Blocker aus dem DH-Audit.

---

## 1. Code Quality Audit

### 1.1 Architektur-Überblick

| Bereich | Struktur | Bewertung |
|---------|----------|-----------|
| Digital Human | 7 additive Module + CSS-Schichten | Gut isoliert |
| Haupt-App | Monolith `index.html` (~17.135 Zeilen, ~652 KB) | Wartungsrisiko hoch |
| API | `02_Quellcode/Core_Logik/server.js` | Modular, Rate-Limits |
| i18n | `i18n-locales.js` + API `/api/i18n/` | Dynamisch |

### 1.2 Toter Code / Legacy

| ID | Priorität | Befund |
|----|-----------|--------|
| CQ-01 | P2 | **5× `.bak-phase4`-Dateien** im Repo (`index.html.bak-phase4`, `tts-lipsync-bridge.js.bak-phase4`, …) — keine Runtime-Wirkung, Repo-Rauschen |
| CQ-02 | P2 | **`phase4_write_test.txt`**, **`claude_test.py`** — Test-Artefakte |
| CQ-03 | P2 | **`osg_digital_human.css`** — ~50 Phase-1-`@keyframes` größtenteils von Phase 2/4/7-Motion übersteuert (`animation: none` auf Host) |
| CQ-04 | P3 | **`coinDbg.rimSegments` / WebGL-Debug-Felder** — 3D-Münze entfernt, Debug-Struct noch mit Rim/Depth-Feldern (immer 0) |
| CQ-05 | P3 | **`OSG_AVATAR`-Alias** dupliziert `OSG_DIGITAL_HUMAN`-API ohne Gesture-Wrap |
| CQ-06 | P3 | **`chooseGesture`-Original** in Engine + Wrap in Phase 6 — beabsichtigt, aber zwei Klassifikatoren |

### 1.3 Doppelte Funktionen

| Duplikat | Module | Priorität |
|----------|--------|-----------|
| `lerp` / `clamp` / `coinStage` / `setCssVar` | 6× DH-JS-Dateien | P3 |
| Cursor-Tracking `mousemove` | `osg_digital_human_motion.js` + `osg_dh_eye_contact.js` | P1 |
| `visibilitychange`-Pause | Motion + Final Polish | P3 |
| Phase-Sync (State lesen + Events) | Motion, Eye, Polish, Gesture | P2 |
| Emotion: Phase-1-`setEmotion` + Phase-4-Blend | By design, aber konzeptuell doppelt | P2 |
| `is-speaking` (LipSync-Flag) vs. `data-dh-phase` | Nach P0-Fix synchronisiert, zwei Signale bleiben | P2 |

### 1.4 Doppelte Zustände

| Zustand A | Zustand B | Risiko |
|-----------|-----------|--------|
| `#coin-stage.is-speaking` | `OSG_DIGITAL_HUMAN.state.phase` | Nach P0: konsistent bei TTS |
| `lipSyncActive` (closure) | `speakDepth` (Engine) | Gering — verschiedene Zwecke |
| `is-dh-*` (Phase 1) | `is-dh2-*` / `is-dh4-*` / `is-dh6-*` / `is-dh7-*` | CSS-Komplexität P2 |
| `ttsLoading` | `OSG_AUDIO_REGISTRY._active` | Parallel, Registry autoritativ bei Stop |

### 1.5 Ungenutzte / redundante CSS

| Befund | Priorität |
|--------|-----------|
| Phase-1-Keyframes bei aktivem `[data-dh-phase]` oft inaktiv | P2 |
| `is-dh2-phase-*` spiegelt `data-dh-phase` ohne eigenes Styling | P3 |
| `is-dh4-emotion-*` Ambient-Glows teils ohne sichtbaren Consumer | P3 |
| Gesten-`is-dh6-*` auf Mobile per Media Query deaktiviert | P2 (bewusst) |

### 1.6 DOM-Abfragen & Reflow/Repaint

| Befund | Priorität | Details |
|--------|-----------|---------|
| **~20 CSS-Custom-Property-Writes/Frame** auf `#coin-stage` (DH) | P2 | Motion, Emotion, Eye, Polish |
| **`will-change: transform`** dauerhaft auf Avatar-Host | P2 | GPU-Layer-Promotion |
| **`filter`-Animationen** (Emotion + LipSync + Polish) | P2 | Teurer als transform-only |
| **`getElementById` ohne Cache** in `index.html` (hunderte Aufrufe) | P2 | Boot/UI-Events, nicht pro Frame |
| **Inline `transform` (LipSync)** überschreibt CSS-Transform beim Sprechen | P1 | By design, aber Repaint-Hotspot |
| Phase 7 `_lastWritten`-Cache | ✔ | Reduziert unnötige `setProperty` |

### 1.7 Timer & Animation Loops

| Mechanismus | Anzahl | Cleanup | Priorität |
|-------------|--------|---------|-----------|
| **Haupt-rAF** `animate()` | 1 permanent | Läuft App-Lifetime | P2 — erwartet |
| **tts-lipsync-bridge rAF** | 0–1 während Speech | `cancelAnimationFrame` bei End | P2 |
| **Clip-Scan rAF** (`__osgClipScanLoopId`) | 0–1 bei Kamera | sollte bei Stop cleared werden | P2 |
| **VIP Ping/Stats `setInterval`** | 2 (65s / 45s) | Kein `clearInterval` | P3 — Absicht |
| **Referral Poll `setInterval`** | 1 (135s) | Kein Guard gegen Doppel-Install | P2 |
| **Voucher Ticker `setInterval`** | 1 (1s) | `osgStartVoucherExpiryTickerOnce` Guard | ✔ |
| **Gesture Intelligence `setTimeout`** | pro Geste | Clear bei Remove | P2 |
| **DH-Module `setInterval`** | 0 | — | ✔ |

### 1.8 EventListener-Duplikate (DH)

| Event | Listener | Priorität |
|-------|----------|-----------|
| `document.mousemove` | Motion + Eye Contact | **P1** |
| `document.visibilitychange` | Motion + Polish + VIP + Audio | P3 |
| `osg:digital-human:phase` | Motion, Eye, Polish | P2 |
| `osg:digital-human:emotion` | Emotion, Gesture, Polish | P2 |

**Code-Qualität gesamt: 58 %** (DH-Module gut, Monolith drückt Score)

---

## 2. Memory Leak Audit

### 2.1 EventListener

| Quelle | `removeEventListener`? | Leak-Risiko |
|--------|------------------------|-------------|
| DH-Module (permanent) | Nein | **Niedrig** (SPA-Lifetime) |
| `index.html` Modals/Draft | Ja (bei Close) | ✔ |
| Psychologie `IntersectionObserver` | `disconnect()` vor Re-Install | ✔ |
| `pagehide` → `osgCloseAudioContext` | — | ✔ |
| VIP/Referral Intervalle | Nie entfernt | **Mittel** bei langen Sessions |
| Copy-Protection `contextmenu/copy` | Permanent | Niedrig |

### 2.2 Observer

| Typ | Vorkommen | Cleanup |
|-----|-----------|---------|
| `IntersectionObserver` | Psychologie-Finance-Links (`__osgPsychIo`) | `disconnect()` bei Re-Wire |
| `ResizeObserver` | **Keine** | — |
| `MutationObserver` | **Keine** | — |

### 2.3 Audio / Video

| Ressource | Verhalten | Leak-Risiko |
|-----------|-----------|-------------|
| `AudioContext` (index.html) | `pagehide` + `visibility hidden` → `close()` | ✔ |
| `AudioContext` (tts-bridge) | `close()` bei Speech-Ende | ✔ |
| `AudioContext` (Segment-Service `_segCtx`) | **Bleibt offen** zwischen Segmenten | **P2** — beabsichtigt, aber Speicher |
| `HTMLAudioElement` | Registry + `unregister`, URL.revokeObjectURL | ✔ |
| `createMediaElementSource` | Pro Playback neu; disconnect bei Buffer-Ende | ✔ |
| WebSpeech | `speechSynthesis.cancel()` in Registry | ✔ |
| Avatar-Video (`pauli_avatar_animations.js`) | CSS/Video-Element, dispose bei State-Wechsel | P2 prüfen bei langem Tour |

### 2.4 Canvas / WebGL

| Befund |
|--------|
| **Kein aktives Three.js/WebGL** im Produktionspfad (2D-Avatar `Frontseite02.png`) |
| CSS-Selektoren referenzieren `#coin-stage canvas` — legacy/defensiv |
| `coinDbg` 3D-Felder obsolet |

### 2.5 Promises & Timer

| Befund | Risiko |
|--------|--------|
| Generation-Guards in Audio-Callbacks | ✔ Stale-Promise-Schutz |
| `playPauliAudioBuffer` Promise bei Abort | ✔ `isStale`-Checks |
| Gesture `_timers` Object | Clear bei `removeGesture` — ✔ |
| Referral `setInterval` ohne Page-Teardown | P2 |

### 2.6 Pointer Events

| Befund |
|--------|
| `pointerdown` für Wake-Arming — einmalig, `removeEventListener` vorhanden |
| Coin-Stage `keydown` Enter/Space — permanent |

**Memory-Audit gesamt: 74 %** — keine kritischen Leaks; Segment-AudioContext und permanente Intervalle sind die Hauptpunkte.

---

## 3. Mobile Performance Audit

### 3.1 Zielgeräte-Matrix

| Kontext | Bewertung | Details |
|---------|-----------|---------|
| **Android Mid-Range** | Gut | Frame-Skip=2 (DH), Reduced CSS auf ≤480px |
| **iPhone** | Gut | Safe-Areas in `style.css`, Touch-Handler |
| **Tablet** | Gut | Breakpoints vorhanden |
| **Landscape** | Mittel | Coin-Stage `fixed`/`vh` — manuell testen |
| **≤480px** | Gut | DH-Transform aus (P7), Gesten-Keyframes aus |
| **High-DPI** | Mittel | Avatar 298×298 PNG (~284 KB) — unter 1024px-Regel ✔ |
| **60 Hz** | Gut | ~7 Ticks/Frame im Haupt-rAF |
| **120 Hz** | Mittel | Kein `delta`-basiertes Frame-Skip für ProMotion — läuft häufiger |

### 3.2 CPU

| Lastquelle | Mobile-Impact |
|------------|---------------|
| Permanenter `animate()`-Loop | Mittel — immer aktiv |
| DH Motion + Polish (Frame-Skip 2) | Niedrig-Mittel |
| Doppeltes `mousemove` | Niedrig (nur bei Interaktion) |
| LipSync inline style 60fps | Mittel während Speech |
| `index.html` Parse (652 KB) | **Hoch beim Cold Start** — P1 |

### 3.3 GPU

| Faktor | Impact |
|--------|--------|
| `will-change: transform` auf Host | Layer-Promotion — Speicher |
| `filter` + `drop-shadow` (LipSync) | GPU-Last beim Sprechen |
| Kein WebGL | ✔ GPU entlastet |

### 3.4 Speicher

| Faktor | Impact |
|--------|--------|
| Monolith-JS inline in HTML | Parse + Heap |
| i18n-locales.js (groß) | Einmalig |
| AudioContext persistent (Segment) | ~wenige MB |
| PWA Service Worker Cache | Shell only |

**Mobile Performance: 76 %** — Thailand-Ziel (≤2s interaktiv) erreichbar nach erstem Paint, **Cold-Start durch HTML-Größe** ist der Engpass.

---

## 4. Accessibility Audit

### 4.1 Tastatur

| Element | Status |
|---------|--------|
| `#coin-stage` | `tabindex="0"`, Enter/Space aktiviert Avatar | ✔ |
| Modals (Terms, VIP, Draft) | Escape-Handler an mehreren Stellen | ✔ |
| Clip-Scan Photo-Button | `role="button"` + Enter/Space | ✔ |
| Skip-Link | **Nicht gefunden** | **P2** |
| Fokus-Trap in allen Modals | Teilweise (`focus()` auf Close) | P2 |

### 4.2 Screenreader / ARIA

| Element | Status |
|---------|--------|
| Coin-Stage | Initial `aria-label="Pauli — tap to speak"` **hardcoded EN** → später `pack.coinAriaLabel` (i18n) | **P1** bis Locale geladen |
| Landmarks | `aria-labelledby` auf Sections | ✔ |
| Avatar-Dekoration | `aria-hidden="true"` auf Hands/Hearts | ✔ |
| `data-i18n-aria` / `startup_boot_logic.js` | Teilweise dynamisch | ✔ |
| Live-Chat Captions | `pauliLiveCaptionShow` — SR-Sichtbarkeit prüfen | P2 |

### 4.3 VoiceOver / TalkBack

| Aspekt | Bewertung |
|--------|-----------|
| Coin als `role="button"` | Sinnvoll für Tap-to-Speak |
| Dekorative Animationen | `aria-hidden` auf Kindern — gut |
| Speaking ohne ARIA-Live-Region | **P2** — Captions evtl. nicht als `aria-live` |

### 4.4 Reduced Motion

| Modul | Guard |
|-------|-------|
| DH Motion JS | ✔ |
| DH Polish JS | ✔ |
| DH CSS (alle Phasen) | ✔ `!important`-Resets |
| Legacy Avatar CSS | Teilweise |
| `avatar_mishap_logic.js` | ✔ prüft `prefers-reduced-motion` |

**Accessibility: 71 %**

---

## 5. Security Audit

### 5.1 XSS

| Vektor | Risiko | Details |
|--------|--------|---------|
| `innerHTML` mit i18n-`pack.*` | **Mittel** | Vertrauen in Locale-Quelle/API; kein User-HTML |
| `innerHTML` mit API-Responses (Referral, Admin) | Mittel | Escaping in Admin-CSV (`osgAdminEscapeCsv`) |
| `eval()` | **Nicht gefunden** | ✔ |
| `document.write` | **Nicht gefunden** | ✔ |

### 5.2 CSP

| Befund | Priorität |
|--------|-----------|
| **Keine Content-Security-Policy** im HTML oder Server-Header für statische SPA | **P1** |
| Server setzt `Referrer-Policy`, `Permissions-Policy`, `CORP` | ✔ |

### 5.3 API Keys & Secrets

| Befund | Status |
|--------|--------|
| `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` | Nur Server-Env (`render.yaml` sync: false) | ✔ |
| `osg-runtime-config.js` | Nur `OSG_API_BASE` — kein Key | ✔ |
| `__OSG_ADMIN_SECRET__` | Client-seitig für Operator-Dashboard | **P1** — nur mit starkem Secret + Prod-Datei |
| `OSG_STATIC_DENY` blockiert `.env`, `osg-admin-secret.prod.js` Pfad | ✔ (404) — Datei darf nicht öffentlich sein |
| Wildcard CORS in Production | Server verweigert Start mit `*` | ✔ |

### 5.4 Storage

| Nutzung | Inhalt | Risiko |
|---------|--------|--------|
| `localStorage` | Terms, Tour, Coin-Debug, Monetization | Niedrig — keine Tokens |
| `sessionStorage` | Lang-Pending, Psychologie-Flags | Niedrig |
| Keine Auth-Tokens im Client | ✔ | |

### 5.5 CORS & Rate Limiting

| Endpoint-Schutz | Status |
|-----------------|--------|
| `express-rate-limit` pro Route (TTS, STT, Lead, VIP, …) | ✔ |
| `OSG_RL_*` env-tunable | ✔ |
| CORS Origin-Whitelist | ✔ |
| TTS `rate_limited` Error an Client | ✔ |

**Security: 77 %** — Server solide; **CSP fehlt**, Admin-Secret-Pattern erfordert disziplinierte Deployment-Praxis.

---

## 6. UX Audit (Erstbenutzer)

### 6.1 Onboarding-Flow

```
Terms Gate → Optional Location → Personal Onboarding → Haupt-UI → Coin (Pauli)
```

| Schritt | Bewertung |
|---------|-----------|
| Terms Gate | Klar, blockierend | ✔ |
| Viele Panels/Sections auf einer Seite | **Überladen** — P2 |
| Coin als Einstieg Sprache | Intuitiv nach Terms | ✔ |
| Erklärung „Tap to speak“ | Abhängig von Locale/i18n | Mittel |

### 6.2 Navigation & Klicks

| Befund | Priorität |
|--------|-----------|
| Lange Scroll-Seite mit vielen Affiliate-Bereichen | P2 — kognitive Last |
| VIP/Referral-Mechaniken parallel | P2 — Verwirrung möglich |
| Tap-to-Stop-Audio (global) | Gut für Kontrolle | ✔ |
| Live-Chat ohne sichtbaren „Stop“-Button | P2 — Nutzer müssen Tap kennen |

### 6.3 Wartezeiten

| Phase | Erwartung |
|-------|-----------|
| Cold Start (652 KB HTML + Scripts) | **2–4s** auf TH-Mobile — P1 |
| TTS lokale MP3 | Schnell |
| Cloud TTS | Netzwerk-abhängig |
| KI-Antwort (Chat) | API-Latenz |

### 6.4 Visuelle Klarheit

| Aspekt | Bewertung |
|--------|-----------|
| Coin-Stage Position Mobile | Regeln in `style.css` / Mobile-First | ✔ |
| DH-Bewegung subtil | Gut nach Polish | ✔ |
| Viele gleichzeitige Animationen bei Empathy/Tour | P2 — kann ablenken |

**UX: 73 %**

---

## 7. Priorisierte Findings

### P0 — Kritisch (Release-Blocker)

| ID | Status | Befund |
|----|--------|--------|
| **R-01** | **✔ Behoben** | Speaking-Phase-Sync via `osgDhEnterSpeaking`/`osgDhLeaveSpeaking` (siehe `OSG-DIGITAL-HUMAN-P0-REPORT.md`) |

**Kein weiterer P0 offen** aus diesem Audit.

---

### P1 — Hohe Priorität

| ID | Bereich | Befund | Empfehlung |
|----|---------|--------|------------|
| P1-01 | Performance | `index.html` 652 KB / 17k Zeilen — Cold-Start | Code-Splitting / deferred Modules (post-freeze) |
| P1-02 | Code | Doppeltes `mousemove` (Motion + Eye) | Ein Cursor-Bus |
| P1-03 | Emotion | `sympathy` fehlt in Phase-4-`EMOTION_DEFS` | Def ergänzen |
| P1-04 | A11y | Hardcoded `aria-label` auf `#coin-stage` bis i18n | Initial leer oder `data-i18n-aria` |
| P1-05 | Security | Keine CSP | `Content-Security-Policy` Header |
| P1-06 | CSS | Dreifache `transform`-Kaskade P2/P4/P7 | Ein Compound-Selector |
| P1-07 | DH | `OSG_AVATAR.chooseGesture` ohne Intelligence-Wrap | Alias angleichen |

---

### P2 — Mittlere Priorität

| ID | Bereich | Befund |
|----|---------|--------|
| P2-01 | Memory | Segment-Service `_segCtx` bleibt offen |
| P2-02 | Timer | Referral `setInterval(135s)` ohne Einmal-Guard |
| P2-03 | CSS | Phase-1-Keyframes obsolet (~340 Zeilen) |
| P2-04 | UX | Kein Skip-Link; ARIA-Live für Captions fehlt |
| P2-05 | Mobile | 120 Hz — kein adaptives Frame-Budget |
| P2-06 | DH | Gesten-CSS vs. Transform-Stack nicht kombinierbar |
| P2-07 | Repo | `.bak-phase4`-Dateien entfernen |
| P2-08 | UX | Informationsdichte Erstseite |

---

### P3 — Niedrige Priorität

| ID | Bereich | Befund |
|----|---------|--------|
| P3-01 | Code | Duplizierte Helfer in DH-Modulen |
| P3-02 | Code | `OSG_AVATAR` vs `OSG_DIGITAL_HUMAN` Duplikat |
| P3-03 | CSS | `is-dh2-phase-*` redundant |
| P3-04 | Legacy | `coinDbg` 3D-Felder |
| P3-05 | Timer | VIP-Intervalle ohne Teardown |
| P3-06 | Gesten | `celebrate` ohne Legacy-Tick-Animation |

---

## 8. Bewertungsmatrix

| Dimension | % | Kurzbegründung |
|-----------|---|----------------|
| **Funktionale Vollständigkeit** | 88 | Feature-complete DH + TTS + Chat |
| **Korrektheit** | 80 | P0 gefixt; sympathy-Lücke |
| **Performance** | 74 | DH optimiert; Monolith HTML |
| **Wartbarkeit** | 58 | 17k-Zeilen-index.html |
| **Skalierbarkeit** | 72 | API rate-limited; Client monolithisch |
| **Security** | 77 | Server gut; CSP fehlt |
| **Accessibility** | 71 | Grundlagen da; Lücken bei Live/SR |
| **Mobile** | 76 | Bewusste DH-Drosselung |
| **Dokumentation** | 90 | Phase 1–7 + P0 + Audits |
| **Gewichtet gesamt** | **79 %** | |

---

## 9. Release-Empfehlung

### Freigabe-Matrix

| Stufe | Empfehlung | Bedingung |
|-------|------------|-----------|
| **Internal / QA** | ✔ **Freigeben** | Jetzt |
| **Soft Launch (TH)** | ✔ **Freigeben** | Monitoring: TTS-Fehler, 429, LCP |
| **Marketing Launch** | ⚠ **Nach P1** | Mind. P1-01, P1-04, P1-05 |
| **Enterprise / Compliance** | ⚠ **Nach P1+P2** | CSP, ARIA-Live, Audit-Trail |

### Monitoring-Checkliste (Pre-Launch)

- [ ] `state.phase === speaking*` während TTS (P0-Verifikation)
- [ ] `prefers-reduced-motion` auf iOS/Android
- [ ] Coin-Stage ≤480px — keine Überdeckung von Content
- [ ] `stopAllSpeech` + Interrupt unter Last
- [ ] API Rate-Limit-Verhalten bei TTS-Spam
- [ ] Cold-Start LCP auf 4G (Thailand)

### Nächste Schritte (post-freeze, keine Features)

1. P1-01: HTML/JS-Splitting-Plan (nur Refactor)
2. P1-02 + P1-03 + P1-06: DH-Wartungs-Sprint
3. P1-05: CSP mit nonce/hash für inline Scripts planen
4. Re-Audit nach P1 → Ziel **≥85 %**

---

## 10. Anhang — Geprüfte Artefakte

### Digital Human
`osg_digital_human_engine.js`, `osg_digital_human_motion.js`, `osg_dh_emotion_layer.js`, `osg_dh_eye_contact.js`, `osg_dh_gesture_intelligence.js`, `osg_dh_final_polish.js` + zugehörige CSS

### Audio / TTS
`index.html` (playPauliVoice-Pipeline), `osg_audio_registry.js`, `osg_audio_segment_service.js`, `osg_tts_guard.js`, `osg_tts_interrupt.js`, `tts-lipsync-bridge.js`

### Infrastruktur
`02_Quellcode/Core_Logik/server.js`, `render.yaml`, `osg-runtime-config.example.js`, `public/sw.js`

### Vorherige Audits (Referenz)
- `docs/OSG-DIGITAL-HUMAN-FINAL-AUDIT.md`
- `docs/OSG-DIGITAL-HUMAN-P0-REPORT.md`
- `docs/OSG-DIGITAL-HUMAN-COMPLETION-REPORT.md`

---

## Audit-Abschluss

**Keine Code-Änderungen durchgeführt.**  
**Produktionsreife: 79 %** — System ist **release-fähig für kontrollierten Soft Launch**; **P0 ist geschlossen**. Für breiten Marketing-Release werden **P1-Punkte** empfohlen, insbesondere Cold-Start-Performance, CSP und Accessibility-Härtung.

*Ende des Audits — keine weiteren Aktionen.*
