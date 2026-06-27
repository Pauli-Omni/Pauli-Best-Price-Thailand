# OSG RC-D1 Re-Entry — Fix Report

**Datum:** 2026-06-27  
**Fix-Commit:** `2a97d63d73d79f0b8fd880ad2f589beff82a120c` (short: `2a97d63`)  
**Production URL:** https://pauli-best-price-api.onrender.com  
**Render status:** **LIVE**

---

## Root Causes Fixed

| ID | Problem | Fix |
|----|---------|-----|
| **RC-P0-A** | `hasPending()` gate skipped when wake strip → empty `userText` | New `osgPauliHandleDraftPendingTurn()` runs whenever pending exists, including pure wake |
| **RC-P0-B** | `startPauliLiveConversation()` returned early when `osgPauliLiveActive` | Wake/coin intent resets context even if live; pure wake in live loop resets + `turns = 0` |
| **RC-P1-A** | `osgPauliLiveHistory` survived Verwerfen/Bestätigen → `looksLikeDraft` re-stage | New `osgResetComplaintLiveContext()` clears history + complaint session on confirm/reject/wake reset |
| **RC-P1-B** | `draftFlowActive` used broad `isReclamationTopic` (garantie/refund/warranty) | Pending remind path now requires `isDraftRequest()` only |

---

## Files Changed

| File | Change |
|------|--------|
| `assets/scripts/osg-index-app-main.module.js` | All four fixes |
| `assets/scripts/osg-index-app-bootstrap.js` | Overlay fallback uses `osgResetComplaintLiveContext` |
| `scripts/osg-rcd1-reentry-verify.mjs` | Static verification |

---

## Functions Modified

| Function | Change |
|----------|--------|
| `osgResetComplaintLiveContext()` | **New** — clears `osgPauliLiveHistory` + complaint session + overlay |
| `osgPauliHandleDraftPendingTurn()` | **New** — pending gate independent of `userText`; pure wake clears pending |
| `startPauliLiveConversation()` | Fresh wake/coin resets while live active; session start uses `osgResetComplaintLiveContext()` |
| `processUserText()` | Delegates pending handling; pure wake resets context + `turns = 0` |
| Bootstrap draft confirm/cancel handlers | Prefer `osgResetComplaintLiveContext()` when live handler absent |

---

## Verification Scenarios

| Step | Expected |
|------|----------|
| 1. Hi Pauli | Greeting; no pending |
| 2. Fernseher kaufen | Normal shopping (OpenAI) |
| 3. Schreibe Reklamation | Complaint draft staged |
| 4. Verwerfen | Pending cleared; history cleared |
| 5. Hi Pauli | Fresh greeting; no remind |
| 6. Wie spät ist es? | Time answer (`TIME_QUERY`) |
| 7. Fernseher kaufen | Normal shopping; **no re-stage** |

### Automated

```bash
node scripts/osg-rcd1-reentry-verify.mjs   # PASS
node scripts/osg-rcd-dialogue-verify.mjs     # PASS (RC-D3 unchanged)
```

---

## Deployment Verification

| Item | Value |
|------|-------|
| Branch | `main` |
| Commit | `2a97d63` |
| Push | `3f2f063..2a97d63` → `origin/main` |
| Production asset | `osg-index-app-main.module.js` |
| Last-Modified | `Sat, 27 Jun 2026 01:28:26 GMT` |
| ETag | `W/"3d201-19f06b13a90"` |
| Live markers | `osgResetComplaintLiveContext`, `osgPauliHandleDraftPendingTurn`, `freshConversation` — **13 hits** |
| Render origin | `x-render-origin-server: Render` |

**Production verification:** PASS (deploy propagated within first poll after push)

---

## Out of Scope (unchanged)

- RC-D2 audio/text decoupling
- RC-D5 cloud TTS gating
- `needsConfirmation()` standalone `looksLikeDraft(reply)` rule (mitigated by P1-A history clear)

---

*Fix deployed and verified LIVE.*
