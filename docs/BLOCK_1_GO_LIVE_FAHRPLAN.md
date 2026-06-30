# Block 1 — Go-Live & Voice-Umsetzungsfahrplan

**Projekt:** Omni Solutions Global  
**Teilprojekt:** Pauli Best Price Thailand  
**Architekturbereich:** Sprachpipeline Block 1 · Veröffentlichung  
**Dokumentversion:** 1.0.0-go-live-fahrplan  
**Status:** AKTIV — Umsetzungsleitfaden (Ziel: Veröffentlichung)  
**Stand:** 2026-06-28  
**Bezug:** `03_Architektur/Pauli_Avatar_Spracharchitektur/` · `docs/PAULI_REVIVAL_ROADMAP.md` (Phase 2) · `docs/00_Omni_Solutions_Global_Projekt_Start.md`

---

## 1. Ziel und Zeithorizont

| Ziel | Termin |
|------|--------|
| **App öffentlich erreichbar** (Soft Launch) | **Morgen** |
| **Pauli spricht zuverlässig** (ElevenLabs, First-60-Seconds) | **Heute abschließen, morgen auf Prod verifizieren** |
| **Vollständiger Block-1-Architektur-Umbau** (`OSG_PAULI_SPEECH`, Timestamps, `voice:verify`) | **Nach Launch** (Woche 1 post-go-live) |

> **Realistische Einordnung:** Ein kompletter Ein-Umbau nach `02_BLOCK-1_MASTERAUFTRAG.md` (neues Modul, alle Legacy-Wrapper, Wort-Highlight, Verify-Gates) ist **nicht** in 24 Stunden neben Deploy und Betriebssicherheit sinnvoll abschließbar.  
> **Morgen online** = **Launch-MVP** (funktionierende Voice-Journey + stabiler Deploy).  
> **Block 1 FINAL im Code** = kontrollierte Phase direkt nach Veröffentlichung.

---

## 2. Launch-MVP vs. Architektur-Soll

| Bereich | Launch-MVP (morgen) | Block 1 FINAL (danach) |
|---------|---------------------|-------------------------|
| TTS-Runtime | `playPauliVoice` → `/api/tts` → ElevenLabs only | `OSG_PAULI_SPEECH.speak()` als einziger Einstieg |
| Fallbacks | Kein Browser-TTS, kein lokaler MP3-Playback für Dialog | Harte Fehlersperre + Verify-Skript |
| Begrüßung | Wai → Sawadee → Locale-Gruß → Entry-Prompt | Gleich, über Pipeline-API |
| Lip-Sync | Bestehend `playPauliAudioBuffer` + Analyser | An `speak()`-Lifecycle gekoppelt (ohne Timeout-Steuerung) |
| Untertitel | Caption-Overlay (`pauliLiveCaptionShow`) | Wort-Highlight via ElevenLabs-Timestamps |
| Server | `ELEVENLABS_VOICE_ID` Pflicht auf Render | `resolveVoiceId` ohne Name-Hint-Fallback |
| Tests | `osg-pauli-greeting-vision-verify.mjs` + manuelle Journey | `voice:verify` + BLOCK-1-LOCK im Code |

**Regel:** Launch-MVP darf **keine neuen Parallelarchitekturen** einführen — nur **stabilisieren**, was für First-60-Seconds und Live-Dialog nötig ist.

---

## 3. Zeitplan (Heute → Morgen)

### Phase A — Heute: Voice & Journey lokal härten (4–6 h)

| # | Aufgabe | Dateien / Befehle | Exit |
|---|---------|-------------------|------|
| A1 | **Ist-Stand committen** (lokaler Working Tree mit Greeting-/TTS-Fixes) | `git status`, `git diff` | Kein versteckter Delta-Stand vor Deploy |
| A2 | **ElevenLabs-Env prüfen** | `.env`, Render-Dashboard | `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` gesetzt; Voice-ID = Pauli-Klon |
| A3 | **Kein Liam-Fallback auf Prod** | `render.yaml` Zeile `ELEVENLABS_VOICE_NAME_HINT`, `server.js` `resolveVoiceId` | Prod nutzt **nur** explizite Voice-ID |
| A4 | **Greeting-Vision-Verify** | `node scripts/osg-pauli-greeting-vision-verify.mjs` | Alle static checks PASS; optional `--localhost` PASS |
| A5 | **Stimme hörbar testen** | `npm run voice:hear` · Browser: Münze tippen nach Terms | Sawadee + Gruß in Nutzersprache, Lip-Sync sichtbar |
| A6 | **Manuelle Nutzerreise (3 Sprachen)** | Browser ≤480px + Desktop | TH / EN / DE: Terms → Tap → Wai → Audio → kein Mikro-Loop |
| A7 | **Dialog-Smoke** | Chat eine kurze Frage | Antwort-Text = gehörter Inhalt (kein falscher Thai-Clip) |
| A8 | **Deploy-Check lokal** | `bash deploy-check.sh` | Kein FAIL bei Pflicht-`.env` |

**Stop-Kriterium heute Abend:** Journey A5–A7 grün auf `localhost` mit Production-`.env`-Keys (oder Staging-Keys).

---

### Phase B — Heute Abend: Release-Kandidat (2–3 h)

| # | Aufgabe | Dateien / Befehle | Exit |
|---|---------|-------------------|------|
| B1 | **Version / Snapshot** (Tresor-Regel) | `package.json`, `npm run tresor:snapshot` | Snapshot pauli nach Gründerfreigabe |
| B2 | **Render-Env verifizieren** | `npm run render:verify-env` | Alle Prod-Secrets bestätigt |
| B3 | **HTML / Avatar-Assets** | `npm run check:html`, `npm run avatar:verify` | Keine broken Assets für Wai/Speak |
| B4 | **Dokument-Metadaten** | `npm run docs:omni-projekt-start` | Start-Doc Live-Status aktuell |
| B5 | **Commit + Push** (nur mit Gründerfreigabe) | — | Branch auf Remote, Render auto-deploy triggert |

---

### Phase C — Morgen: Production Go-Live (3–5 h)

| # | Aufgabe | Dateien / Befehle | Exit |
|---|---------|-------------------|------|
| C1 | **Deploy abwarten / Warmup** | Render Dashboard, `npm run render:bootstrap` | `/api/health` 200 |
| C2 | **Go-Live-Check** | `npm run render:go-live-check` | Script PASS |
| C3 | **Prod TTS** | `curl` / `osg-production-qa.mjs` gegen Live-URL | `/api/tts` liefert Audio mit korrekter Voice-ID |
| C4 | **Prod Journey (echtes Handy TH)** | Live-URL, 4G | First-60-Seconds wie lokal |
| C5 | **Cold-Start-Hinweis** | Statisches Lade-Element in `index.html` (minimal) | Nutzer sieht „Pauli startet…“ statt leerer Seite |
| C6 | **Soft Launch freigeben** | — | Link teilbar; kein breites Marketing (siehe Soft-Launch-Doc) |
| C7 | **Post-Deploy** | `npm run docs:omni-projekt-start:deploy` | Deploy-Zeit im Start-Doc |

---

## 4. Technische Arbeitspakete (Reihenfolge)

### Paket 1 — ElevenLabs & Server (P0, heute)

**Problem:** `server.js` kann bei fehlender Voice-ID auf `ELEVENLABS_VOICE_NAME_HINT` (aktuell `Liam` in `render.yaml`) zurückfallen — widerspricht Block-1-Soll.

**Maßnahmen:**

1. Render-Dashboard: `ELEVENLABS_VOICE_ID` = Pauli-Klon-ID (Pflicht).
2. Optional für Launch: `ELEVENLABS_VOICE_NAME_HINT` leeren oder entfernen.
3. Prod-Test: TTS-Response loggt/enthält erwartete `voiceId`.

**Betroffene Dateien:**

- `02_Quellcode/Core_Logik/server.js` (`resolveVoiceId`, `POST /api/tts`)
- `render.yaml`
- `.env` / Render Secrets

---

### Paket 2 — First-60-Seconds (P0, heute)

**Soll-Erlebnis** (Roadmap Phase 2):

1. Nutzer akzeptiert Terms (+ Geste für Audio)
2. Nutzer tippt Münze / Wake
3. Wai-Animation
4. Sawadee + Begrüßung (i18n)
5. Einladung „Was möchtest du kaufen?“
6. Mikro **erst danach**, kein „Ich höre zu…“-Loop

**Betroffene Dateien:**

| Datei | Rolle |
|-------|-------|
| `assets/scripts/startup_boot_logic.js` | `runSessionGreeting`, Wai-Pausen, `playAudio:true` only on user |
| `assets/scripts/osg-index-app-main.module.js` | `osgPauliRunUserSessionGreeting`, `playPauliVoice`, Coin/Wake |
| `assets/scripts/pauli_avatar_animations.js` | `playWaiGreeting` / Video |
| `assets/scripts/pauli_audio_gate.js` | Terms + Geste |
| `assets/scripts/osg_tts_guard.js` | Queue / Guard um `playPauliVoice` |

**Verify:** `node scripts/osg-pauli-greeting-vision-verify.mjs`  
**Optional Runtime:** `node scripts/osg-pauli-greeting-vision-verify.mjs --localhost`

---

### Paket 3 — Live-Dialog Audio (P0, heute)

**Problem (Root Cause):** Dialog kann Text und Audio entkoppeln, wenn alte Segment-/Key-Logik greift.

**Launch-MVP-Ziel:** Jeder `playPauliVoice(chunk)`-Aufruf im Dialog nutzt **denselben** `text` für `/api/tts` — keine parallele MP3-Auswahl nach fuzzy `speechKey`.

**Betroffene Dateien:**

- `assets/scripts/osg-index-app-main.module.js` (Dialog-Loop ~`playPauliVoice(chunk, …)`)
- `docs/OSG-DIALOGUE-PIPELINE-ROOTCAUSE.md` (Referenz)

**Exit:** Drei manuelle Dialoge (TH/EN/DE) — gesprochener Inhalt = Caption-Text.

---

### Paket 4 — Infrastruktur & Veröffentlichung (P0, morgen)

| Check | Befehl / Ort |
|-------|----------------|
| Health | `GET /api/health` |
| CORS / Origins | `OSG_CORS_ORIGINS`, `OSG_API_ALLOWED_ORIGINS` in `render.yaml` |
| Domain | `OSG_PUBLIC_ORIGIN`, DNS → Render |
| Cold Start | Render Free Tier: Ladehinweis + Erwartung 15–90 s |
| Legal | Terms-Gate aktiv (`pauli_audio_gate.js`) |

**Skripte:** `deploy-check.sh`, `npm run render:verify-env`, `npm run render:go-live-check`

---

### Paket 5 — Block 1 FINAL (post-launch, Woche 1)

**Nicht für morgen blockieren — sequenziell danach:**

| Schritt | Inhalt | Referenz |
|---------|--------|----------|
| 5.1 | Neues Modul `assets/scripts/osg_pauli_speech_pipeline.js` | `04_Sprachpipeline.md` |
| 5.2 | `playPauliVoice` → dünner Wrapper | `02_BLOCK-1_MASTERAUFTRAG.md` §4 |
| 5.3 | `/api/tts` mit Timestamps für Wort-Highlight | `07_Untertitel_und_Dialog.md` |
| 5.4 | `scripts/osg-block1-voice-architecture-verify.mjs` + `npm run voice:verify` | `03_BLOCK-1_LOCK.md` |
| 5.5 | Integration in `deploy-check.sh` | Architektur § Verify |
| 5.6 | BLOCK-1-LOCK Code aktiv | Gründerfreigabe + Commit |

---

## 5. Test-Checkliste (vor „Live“)

### Automatisch (heute)

```bash
node scripts/osg-pauli-greeting-vision-verify.mjs
bash deploy-check.sh
npm run render:verify-env    # gegen Prod-Konfiguration
npm run check:html
npm run avatar:verify
```

### Manuell (heute + morgen auf Prod)

- [ ] Terms ohne Häkchen → kein Pauli-Audio
- [ ] Nach Terms + Tap auf Münze → Wai sichtbar
- [ ] Sawadee hörbar (Thai-Aussprache)
- [ ] Begrüßung in aktiver UI-Sprache
- [ ] Kein Endlos-Mikro-Prompt ohne Nutzerinput
- [ ] Tap während Sprechen → Audio stoppt
- [ ] Chat-Frage → Antwort hörbar = lesbarer Text
- [ ] Mobil ≤480px: Münze nicht über Headlines/Footer
- [ ] Render Cold Start: Ladezustand verständlich

---

## 6. Veröffentlichungs-Entscheidung

| Stufe | Wann | Bedeutung |
|-------|------|-----------|
| **Technisch live** | Morgen nach C1–C4 PASS | URL öffentlich, Health OK, Voice-Journey OK |
| **Soft Launch** | Nach C6 | Early Adopters / eingeladene Nutzer (kein Massen-Marketing) |
| **Breiter Launch** | Nach Block 1 FINAL + P0-Fixes aus Soft-Launch-Review | Marketing, Stores, PR |

**Bewusst zurückgestellt für morgen:**

- Avatar-Verhältnisarchitektur (Feintuning Proportionen)
- Vollständiges Wort-Highlight (Timestamps)
- Whisper/Datenschutz-Phase (Roadmap Phase 6)
- Shop-Blocks 4–5 (Nachkauf, erweiterte Verkaufssprache)

---

## 7. Risiken & Gegenmaßnahmen

| Risiko | Impact | Gegenmaßnahme |
|--------|--------|---------------|
| Render Free Cold Start | Nutzer bricht ab | Lade-Branding; Warmup vor Demo; mittelfristig Plan-Upgrade |
| Fehlende `ELEVENLABS_VOICE_ID` | Falsche Stimme / Stille | Dashboard-Check vor Push; `voice:hear` + Prod-TTS-Test |
| Uncommittete lokale Fixes | Prod ≠ lokal | Heute commit + deploy |
| Dialog-Text ≠ Audio | Vertrauensverlust | Paket 3 heute; keine neuen MP3-Fallbacks |
| Zu viel Scope (voller Block 1) | Launch verschiebt sich | Launch-MVP strikt einhalten; Block 1 FINAL Woche 1 |

---

## 8. Rollback

1. Render: vorheriges erfolgreiches Deploy re-deployen (Dashboard → Deploys).
2. DNS unverändert lassen, wenn nur App-Version rollback.
3. Kein Force-Push auf `main`.
4. Incident kurz in `docs/Omni_Solutions_Global_Projekt_Status.md` notieren.

---

## 9. Nächster Schritt (sofort)

**Heute, erste 90 Minuten:**

1. `node scripts/osg-pauli-greeting-vision-verify.mjs`
2. Lokale Journey (Terms → Münze → Sawadee → Gruß)
3. `ELEVENLABS_VOICE_ID` in `.env` und Render prüfen
4. Ergebnis dokumentieren: PASS/FAIL pro Punkt in dieser Checkliste

Bei PASS aller P0-Punkte → Phase B (Release-Kandidat) heute Abend.  
Bei FAIL → nur den blockierenden P0 fixen (kein Scope-Creep).

---

## 10. Verweise

| Dokument | Inhalt |
|----------|--------|
| `03_Architektur/Pauli_Avatar_Spracharchitektur/02_BLOCK-1_MASTERAUFTRAG.md` | Vollständiger Soll-Umbau |
| `03_Architektur/Pauli_Avatar_Spracharchitektur/04_Sprachpipeline.md` | `OSG_PAULI_SPEECH` API |
| `docs/PAULI_REVIVAL_ROADMAP.md` | Phase 2 First-60-Seconds |
| `docs/OSG-SOFT-LAUNCH-READINESS.md` | Produkt-Bewertung Soft Launch |
| `docs/OSG-DIALOGUE-PIPELINE-ROOTCAUSE.md` | Dialog-Audio-Bug |
| `docs/00_Omni_Solutions_Global_Projekt_Start.md` | Tech-Stack & Live-Status |

---

*Omni Solutions Global · Pauli Best Price Thailand · Fahrplan für Voice-Go-Live*
