# OSG Production QA Report

**Datum:** 2026-06-27  
**Production URL:** https://pauli-best-price-api.onrender.com  
**Alternate URL:** https://pauli-best-price-api-nzbl.onrender.com  
**Git commit (QA run):** `cbb0aac` (QA suite + dialogue recovery deployed)  
**Post-deploy re-verify:** 23/23 PASS after push to `main`  
**Status:** **PASS — production ready for users**

---

## Executive Summary

Automated production QA completed successfully. All 23 checks passed including 12 live conversation turns, 55 asset loads, TTS/STT smoke tests, and dialogue recovery markers. No marketing snippets, no `origin_not_allowed`, no „Chat gerade nicht erreichbar“ in API responses.

**Manual browser QA recommended** for microphone, lipsync, and console (not fully automatable from CI).

---

## Test Environment

| Item | Value |
|------|--------|
| Runner | `node scripts/osg-production-qa.mjs` |
| Origin | `https://pauli-best-price-api.onrender.com` |
| OpenAI | Configured on Render (`OPENAI_API_KEY` verified) |
| SMTP | Not configured (`smtp_not_configured` — email degraded) |

---

## 1. Live Website End-to-End

| Check | Result |
|-------|--------|
| `GET /` (index.html) | **200** — 269ms |
| Viewport meta (mobile-first) | **PASS** |
| Critical JS/CSS assets (55) | **0 failures** |
| `osg-runtime-config.js` | **404** (expected — same-origin `/api`, no split host) |
| Dialogue recovery markers in `main.module.js` | **PASS** (all 4 markers) |

---

## 2. Avatar Startup (static + API)

| Check | Result |
|-------|--------|
| `startup_boot_logic.js` loads | 200 |
| `pauli_avatar_animations.js` loads | 200 |
| `avatar-3d-bridge.js` loads | 200 |
| `osg_audio_registry.js` loads | 200 |
| RC-1 audio state verify (local) | **PASS** |

*Browser startup animation/mic unlock requires manual tap on coin — not automated.*

---

## 3. Live Conversation — 12 User Questions

| # | Question | Latency | Result |
|---|----------|---------|--------|
| 1 | Hallo Pauli | 273ms | Local GREETING — OK |
| 2 | Wie spät ist es? | 1506ms | OpenAI reply — no marketing |
| 3 | Wie viel Uhr ist es? | 1348ms | OpenAI reply — no marketing |
| 4 | Ich suche einen Fernseher. | 1071ms | Shopping conversation — OK |
| 5 | Günstige Gummistiefel? | 1032ms | Shopping conversation — OK |
| 6 | Kurzer Witz | 268ms | Local FUN_SMALLTALK — OK |
| 7 | Smartphone Preis | 259ms | Local READ_PRICE — OK |
| 8 | สวัสดี (Thai) | 1000ms | Thai greeting — OK |
| 9 | Reklamation Entwurf | 2808ms | Complaint draft text — OK |
| 10 | Lazada Empfehlung | 1044ms | Follow-up shopping — OK |
| 11 | Wie geht es dir? | 1007ms | Smalltalk — OK |
| 12 | What time is it? | 1201ms | English time — OK |

**Average latency:** 1068ms | **Max:** 2808ms (complaint draft)

---

## 4. Speech Synthesis & Recognition

| Endpoint | Result |
|----------|--------|
| `POST /api/tts` | **200** — 2216ms (ElevenLabs/OpenAI path alive) |
| `POST /api/stt/wake` (empty payload) | **400** — endpoint reachable, not 403/500 |

*Full STT/TTS quality requires browser mic/speaker — API layer verified.*

---

## 5. Marketing Snippets During Conversation

| Check | Result |
|-------|--------|
| `pickNextPauliSpruch` at live start | **Removed** in deployed `main.module.js` |
| `osgPauliLiveDialogueOnly` | **Present** — cross-sell/empathy skipped in live Q&A |
| Amazon Prime / Baumarkt patterns in 12 replies | **None detected** |

---

## 6. „Chat Currently Unavailable“

| Check | Result |
|-------|--------|
| `pauliChatError` / „Chat gerade nicht erreichbar“ in 12 API replies | **None** |
| HTTP 403 `origin_not_allowed` | **None** (fixed via same-host allowlist) |
| HTTP 503 `chat_unavailable` | **None** |

---

## 7. Browser Console (JavaScript Errors)

**Not automated in this pass.** Recommend manual check:

1. Open https://pauli-best-price-api.onrender.com  
2. DevTools → Console  
3. Tap coin → start live conversation  
4. Confirm no uncaught exceptions  

*All deployed assets returned HTTP 200; no syntax errors detected server-side.*

---

## 8. Backend Logs / Runtime Errors

| Source | Result |
|--------|--------|
| `/api/health` | `ok: true`, affiliate active |
| `emailSystem.level` | `critical` — `smtp_not_configured` (known infra gap) |
| Render logs | Not streamed in QA script — no 5xx on tested endpoints |

---

## 9. API Latency & Response Quality

| Metric | Value |
|--------|-------|
| Health | 808ms |
| Chat avg | 1068ms |
| Chat max | 2808ms |
| TTS | 2216ms |

**Observation (non-blocking):** Time questions receive honest „I can't show the clock“ LLM answers rather than local time — acceptable for QA pass; optional future improvement outside this freeze.

---

## 10. Production Assets

55 assets from `index.html` + critical paths — **0 failures**.

---

## 11. Mobile & Desktop Compatibility

| Check | Result |
|-------|--------|
| `width=device-width, initial-scale=1, viewport-fit=cover` | **PASS** |
| Responsive CSS (`style.css`) | Loads 200 |
| Desktop layout | Same assets — no separate breakage detected |

*Full responsive QA: manual test at ≤480px recommended per project rules.*

---

## 12. Static Verification Suite (local)

```
node scripts/osg-rc1-audio-state-verify.mjs     PASS
node scripts/osg-dialogue-recovery-verify.mjs   PASS
node scripts/osg-rcd-dialogue-verify.mjs        PASS
node scripts/osg-rcd1-reentry-verify.mjs        PASS
node scripts/osg-production-qa.mjs              PASS (23/23)
```

---

## Known Non-Blockers

| Item | Severity | Action |
|------|----------|--------|
| SMTP not configured | Medium | Set `OSG_SMTP_*` in Render Dashboard |
| `osg-runtime-config.js` 404 | Info | Expected on co-hosted Render |
| Time answers via LLM disclaimer | Low | Future enhancement |
| Browser mic/STT not automated | Info | Manual smoke test |

---

## Verdict

**Production is fully operational for dialogue, shopping, complaint flow, and TTS API.**  
No fixes required from this QA pass. Post-deploy re-verification on commit `cbb0aac` confirmed 23/23 PASS.

---

*Generated after live verification on Render production.*
