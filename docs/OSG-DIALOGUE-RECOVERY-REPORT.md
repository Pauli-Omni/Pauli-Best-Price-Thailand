# OSG Dialogue Recovery — Deployment Report

**Datum:** 2026-06-27  
**Production URL:** https://pauli-best-price-api.onrender.com  
**Render service:** `pauli-best-price-api` (`srv-d8v1dqog4nts738eaprg`)  
**Alternate URL:** https://pauli-best-price-api-nzbl.onrender.com  
**Status:** **LIVE — dialogue + CORS verified**

---

## Commits Deployed

| Commit | Purpose |
|--------|---------|
| `369358c` | Dialogue recovery: chat-first, no marketing hijack, dynamic TTS for LLM replies |
| `e8edd27` | Same-host origin allowlist — fixes HTTP 403 `origin_not_allowed` on Render co-host |

---

## Root Causes Resolved

| Issue | Fix |
|-------|-----|
| Marketing snippets after wake | Removed `pickNextPauliSpruch()` from live conversation start |
| Cross-sell/empathy hijacking Q&A | `osgPauliLiveDialogueOnly = true` skips promo modules during live chat |
| Wrong audio for LLM text | `dynamicSpeech` path for chat replies (skip fuzzy MP3 match) |
| Empty chat → random fallback | Single `pauliChatError` message on `/api/pauli-chat` failure |
| HTTP 403 `origin_not_allowed` | Same-host auto-allow in `osgApiOriginAllowlist()` + Render origins in `render.yaml` |
| Complaint re-stage on shopping | `needsConfirmation()` only on explicit draft request (prior RC-D1 re-entry) |

---

## Files Changed

| File | Change |
|------|--------|
| `assets/scripts/osg-index-app-main.module.js` | Dialogue pipeline, dynamicSpeech, error handling |
| `assets/scripts/draft_ownership_logic.js` | Draft staging only on explicit request |
| `02_Quellcode/Core_Logik/server.js` | Same-host origin allowlist |
| `render.yaml` | CORS + API allowed origins (incl. Render URLs) |
| `scripts/osg-backend-production-verify.mjs` | Production verification suite |
| `scripts/osg-dialogue-recovery-verify.mjs` | Static dialogue recovery checks |

---

## Render Environment Verification

```
node scripts/render-verify-production-env.mjs
```

| Variable | Status |
|----------|--------|
| `NODE_ENV` | OK |
| `OSG_INSTALL_FP_SALT` | OK |
| `OSG_API_ALLOWED_ORIGINS` | OK (67 chars — omnisolutionsglobal.com origins) |
| `OSG_CORS_ORIGINS` | OK |
| `OPENAI_API_KEY` | OK |
| `OSG_SMTP_HOST/USER/PASS` | **Missing** — email degraded |

**Note:** `render.yaml` now lists both Render URLs; dashboard sync may lag until next Blueprint apply. Same-host allowlist in server code covers co-hosted app regardless.

---

## Production Verification (2026-06-27T12:03Z)

```bash
node scripts/osg-backend-production-verify.mjs https://pauli-best-price-api.onrender.com
node scripts/osg-dialogue-recovery-verify.mjs
node scripts/osg-rcd-dialogue-verify.mjs
node scripts/osg-rcd1-reentry-verify.mjs
```

| Check | Result |
|-------|--------|
| `/api/health` | OK |
| `/api/pauli-chat` Origin `pauli-best-price-api.onrender.com` | **200** (was 403) |
| `/api/pauli-chat` Origin `omnisolutionsglobal.com` | **200** |
| `/api/pauli-chat` Origin `pauli-best-price-api-nzbl.onrender.com` (same-host) | **200** |
| Dialogue recovery markers in `main.module.js` | OK (19 hits) |
| `origin_not_allowed` on primary URL | **RESOLVED** |

### Email endpoint

| Endpoint | Result |
|----------|--------|
| `/api/health` → `emailSystem` | Responds; level **critical** — `smtp_not_configured` |
| `/api/ops/email-probe` (no owner code) | **403 forbidden** (expected — ops-only) |

**Action required (infra, not code):** Set `OSG_SMTP_HOST`, `OSG_SMTP_USER`, `OSG_SMTP_PASS` in Render Dashboard for outbound mail.

---

## Expected User Flow (post-fix)

```
Hi Pauli → greeting (no marketing snippet)
Wie spät ist es? → OpenAI time answer via /api/pauli-chat
Fernseher kaufen → shopping conversation
Reklamation → Verwerfen → Hi Pauli → fresh dialogue
```

---

## Render Deployment Status

| Item | Value |
|------|-------|
| Branch | `main` |
| Latest commit | `e8edd27180bb4b7503acada038c7b7e57c3fd925` |
| Asset Last-Modified | `Sat, 27 Jun 2026 12:03:10 GMT` |
| Deploy | **LIVE** |

---

*Deployment verification complete.*
