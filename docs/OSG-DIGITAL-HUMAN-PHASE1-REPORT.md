# OSG Digital Human — Phase 1 Report

**Generated:** 2026-06-26  
**Scope:** Asset- und Animations-Vervollständigung (rückwärtskompatibel)

---

## Aufgabe 1 — Katalog & Matrix (Ist-Zustand vor Phase 1)

### Animationen (Video / Manifest)

| Slot | Assets | Controller |
|------|--------|------------|
| `wai_greeting` | `/assets/avatar/01-wai-greeting.*` | `OSG_PauliAvatarAnimations` |
| `speak` | `/assets/avatar/02-speak-loop.*` | Manifest only (Speak-Video deaktiviert) |
| `purchase_standard` | `03-purchase-standard.*` | `setState('purchase_standard')` |
| `purchase_premium` | `04-purchase-premium.*` | `setState('purchase_premium')` |
| `locked_carousel` | `05-locked-carousel.*` | License lock |

### Gesten (`osgAvatarGestureStart`)

| Geste | Verhalten |
|-------|-----------|
| `idle` | Atmung (scale sin) |
| `acknowledge` / `confirm` | Nicken (rotateX) |
| `help` | Z-Neigung |
| `greet` | Verbeugung |
| `wai` | `beginWai()` + CSS |

### Emotionen (`OSG_EMPATHY_LOGIC`)

| Trigger | Emotion |
|---------|---------|
| `verliebt_mode` | love |
| `housing_stress` | stress |
| `relationship_bridge` / `grief_relationship` | separation |
| `sadness_anger` | anger |

### CSS-State-Klassen `#coin-stage` (Legacy)

`is-speaking`, `is-wai`, `is-busy`, `is-gesture`, `is-anim-*`, `is-verliebt-hearts`, `is-empathy-heart`, `is-notebook-search`, `is-wink`, `is-magician-*`, `is-avatar-running`, `is-mishap-*`, Bridge: `is-speak-forward`, `is-bridge-laugh`, …

### Avatar-Controller

- `OSG_PauliAvatarAnimations` — Münz-Avatar Video/CSS
- `osgAvatarController` — Tour, Empathy, Cross-Sell, Mishap
- `avatar-3d-bridge.js` — Flutter/CSS Bridge
- `triggerAvatarAnimation` / `OSGLipSync` — Lip-Sync Engine

### Audio-Events

- `OSG_AUDIO_REGISTRY.register/stopAll`
- `playPauliVoice` → Segment → Local MP3 → Cloud TTS → Web Speech
- `playPauliAudioBuffer` + Analyser → Lip-Sync

### LipSync-Ereignisse

- `osgLipSyncBegin/Stop/Tick`, `OSGLipsyncTickAnalyser`, `OSGLipsyncBindToAudio`

### Wake / Listening (UI)

- `.pauli-voice-wake-btn.is-listening`
- `.osg-voice-confirm.is-listening`
- **Kein** `#coin-stage`-Listening vor Phase 1

### Thinking-Events

- **Nicht vorhanden** (nur Server-Prompt-Text „thinking partner“)

### Speaking-Events

- `ttsLoading`, `lipSyncActive` → `is-speaking`
- `onSpeakStart/Stop` → Speak-Ref-Count

---

## Aufgabe 2 — Vergleich Digital-Human-Engine (Lücken vor Phase 1)

| Profi-Zustand | Vor Phase 1 | Nach Phase 1 |
|---------------|-------------|--------------|
| Idle / Breathing / Blink | Teilweise (Gesture idle) | ✔ `is-dh-idle-*` |
| Listening / Focus | Nur Wake-Button CSS | ✔ `is-dh-listening*` |
| Thinking / Deep | ✗ | ✔ `is-dh-thinking*` |
| Speaking variants | `is-speaking` (Layout) | ✔ `is-dh-speaking*` |
| Emotion-driven face | Nur Empathy-Chains | ✔ `data-dh-emotion` |
| Point / Show Product | ✗ | ✔ CSS Fallback |
| Conversation lifecycle | ✗ | ✔ `conversation_finished`, `resume`, … |
| Viseme / Blendshape | Amplitude only | Unverändert (Phase 2) |
| OpenAI Speak-Video | Deaktiviert | Unverändert (Assets optional) |

---

## Aufgabe 3–9 — Neu implementiert

### Neue Module

| Datei | Rolle |
|-------|-------|
| `assets/scripts/osg_digital_human_engine.js` | State-Engine, Hooks, `OSG_DIGITAL_HUMAN`, `OSG_AVATAR` |
| `assets/styles/osg_digital_human.css` | CSS-Fallback für alle Phase-1-Zustände |

### Neue Zustände (52 Phasen)

`idle`, `idle_breathing`, `idle_blink`, `listening`, `listening_focus`, `thinking`, `thinking_deep`, `speaking`, `speaking_calm`, `speaking_professional`, `speaking_sales`, `confirm`, `celebrate`, `welcome`, `goodbye`, `point_left`, `point_right`, `show_product`, `show_voucher`, `show_hotel`, `show_insurance`, `show_booking`, `wait`, `busy`, `searching`, `loading`, `sympathy`, `serious`, `happy`, `neutral`, `curious`, `confused`, `error`, `warning`, `success`, `purchase_standard`, `purchase_premium`, `offer_premium`, `offer_standard`, `partner_recommendation`, `wai`, `greeting`, `resume`, `interrupted`, `resume_speaking`, `conversation_finished`, `conversation_restart`

### Neue CSS-Klassen

Präfix: `is-dh-{phase}` + Attribute `data-dh-phase`, `data-dh-emotion`, `data-dh-gesture`

### Neue Gesten (Engine)

`acknowledge`, `confirm`, `help`, `greet`, `wai`, `point_left`, `point_right`, `nod`, `wait`, `celebrate` + `chooseGesture(reply)` Heuristik

### Neue Emotionen (sichtbar)

`neutral`, `happy`, `sympathy`, `professional`, `serious`, `confident`, `curious`, `friendly`, `sales`, `separation`, `anger`, `love`, `stress` — via `data-dh-emotion` (Gesicht/Helligkeit/Kopfneigung/Körper)

### Hooks (additiv, keine API-Breaks)

- `OSGLipSync.begin/stop` → Speaking-Phase
- Live-Chat: `enterThinking` vor `osgPauliChatFetch`
- `listenOnce` / Voice-Command → `enterListening` / `leaveListening`
- `animate()` → `OSG_DIGITAL_HUMAN.tick()` (Blink, Mikrobewegung)
- Empathy → `detectEmotion(userText)` in `processUserText`
- `chooseGesture(reply)` vor `osgPauliLiveSpeakReply`
- `window.osgPauliChatFetch` exportiert (neu, additiv)

---

## Aufgabe 10 — Audio-Audit

**Script:** `scripts/osg-phase1-audio-audit.mjs`  
**Report:** `docs/OSG-DIGITAL-HUMAN-PHASE1-AUDIO-AUDIT.json`

| Metrik | Wert |
|--------|------|
| Manifest-Keys | 88 |
| MP3 on disk (`th/`) | 90 |
| Fehlende Dateien | **0** |
| Ungenutzte on disk | `fun_clapping`, `fun_laugh` (Bridge-SFX, nicht im Manifest) |
| Duplikat-Paare (MD5) | **86** (Template-Segment-Kopien — erwartet bei `voice-audit.json`) |
| Unreachable Keys (index.html) | 3 |

**Empfehlung:** Einzelaufnahmen pro `psych*`/`avatar*` Key produzieren; Template-Duplikate durch unique Takes ersetzen.

---

## Aufgabe 11 — ElevenLabs / Cloud-TTS

- `playPauliVoice` unterstützt weiterhin `allowCloudTts` (unverändert)
- Live-Chat übergibt jetzt `allowCloudTts: true` wenn `window.OSG_PAULI_ALLOW_CLOUD_TTS && !OSG_PAULI_DISABLE_CLOUD_TTS`
- Konfiguration dokumentiert in `osg-runtime-config.example.js`
- **Default:** Cloud aus (`OSG_PAULI_ALLOW_CLOUD_TTS` nicht gesetzt) — lokale Fallbacks unverändert

---

## Aufgabe 12 — Fehlende Assets & Motion-Capture-Empfehlungen

### Fehlende Motion-Assets (OpenAI-Video-Slots)

| Slot | Datei | Status |
|------|-------|--------|
| speak | `02-speak-loop.webm/mp4` | Manifest definiert; Runtime nutzt Standbild+Lip-Sync |
| wai | `01-wai-greeting.*` | CSS-Fallback aktiv |
| purchase_* | `03-*`, `04-*` | Video bei Checkout, CSS-Fallback |

### Empfohlene zukünftige Motion-Capture / Video-Loops

1. **Speak-Loop** — synchronisierte Mundbewegung (OpenAI-Prompt im Manifest)
2. **Thinking** — Augen zur Seite, leichte Kopfbewegung
3. **Listening** — Vorlean, aufmerksamer Blick
4. **Point Left/Right** — Hand + Kopf
5. **Show Product/Voucher** — Geste Richtung UI-Element
6. **Emotion Packs** — happy, sympathy, serious als kurze Overlay-Clips

### Fehlende Sprachaufnahmen

- Alle Manifest-Keys vorhanden (th/)
- `fun_laugh`, `fun_clapping` — Dateien da, Bridge referenziert, nicht im Manifest
- Unique Takes für 86 Duplikat-Gruppen empfohlen

---

## Rückwärtskompatibilität

- Keine bestehenden APIs entfernt oder signaturgeändert
- Legacy CSS/JS unverändert funktionsfähig
- Digital-Human-Layer ist optional (`OSG_DIGITAL_HUMAN.install()`)
- `OSG_AVATAR` als Alias für Phase-2-Orchestrierung

---

## Nächste Schritte (Phase 2)

1. Viseme-Daten an `playPauliSpeechWithLipsync` anbinden
2. OpenAI Speak-Video aktivieren wenn Assets ohne weißen Poster
3. `setPhase()` in `osgAvatarController`-Flows für Show-Product/Hotel
4. Cloud-TTS in Produktion via `osg-runtime-config.js` freischalten
