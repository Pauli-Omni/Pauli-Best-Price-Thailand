# OSG Dialogue Pipeline — RC-D1 / RC-D3 / RC-D4 Fix Report

**Datum:** 2026-06-27  
**Commit:** `e62bd19f61f595680f35899420cb87cc65b37976` (short: `e62bd19`)  
**Production URL:** https://pauli-best-price-api.onrender.com  
**Deployment status:** **LIVE** (verified 2026-06-27T01:02:25 GMT asset timestamps)

---

## Root Causes Fixed

| ID | Root Cause | Fix |
|----|------------|-----|
| **RC-D1** | Sticky complaint draft (`osg-draft-pending-v1`) and reclamation session flags survived new conversations, stop, Verwerfen, and unrelated topics | `osgClearComplaintConversationState()` clears draft pending, reclamation session, and overlay on all session boundaries |
| **RC-D3** | `READ_PRICE` matched time questions (`wie viel`, `how much time`, etc.) | New `TIME_QUERY` intent (allowOpenAI) checked before `READ_PRICE`; tightened price regex |
| **RC-D4** | Pure wake phrase stripped to empty string → `pauliLiveStartPrompt` or dead pipeline path | Empty wake-only input triggers greeting reply + `listenOnce()`; live start skips empty `processUserText("")` |

**Not in scope (unchanged):** RC-D2 (audio/text decoupling), RC-D5 (cloud TTS gating).

---

## Files Changed

| File | Change |
|------|--------|
| `assets/scripts/osg-index-app-main.module.js` | `osgClearComplaintConversationState`, wake greeting helpers, draft gate topic exit, live start/stop/boot hooks, `listenOnce()` when no `initialText` |
| `assets/scripts/draft_ownership_logic.js` | `clearWorkflow()` export |
| `assets/scripts/reclamation_compliance_logic.js` | `clearSession()` export |
| `assets/scripts/osg-index-app-bootstrap.js` | Draft confirm/cancel fallback uses full complaint clear |
| `assets/scripts/osg_intent_classifier.js` | `TIME_QUERY` pattern + classify branch |
| `02_Quellcode/Core_Logik/services/IntentClassifierService.js` | Server mirror of `TIME_QUERY` / `READ_PRICE` fix |
| `scripts/osg-rcd-dialogue-verify.mjs` | Static verification script |

---

## RC-D1 — Complaint State Cleanup Triggers

State is cleared via `osgClearComplaintConversationState()` on:

- **Verwerfen** (voice + overlay fallback)
- **Bestätigen** (voice handler)
- **New “Hi Pauli”** / `startPauliLiveConversation()`
- **`osgPauliLiveStop()`**
- **Non-complaint topic** while draft pending (falls through to normal routing)
- **Avatar companion boot** (session restart path)
- **Overlay buttons** when live handler unavailable

After cleanup:

- `sessionStorage osg-draft-pending-v1` removed
- `osg-reclamation-role-v1` / `osg-reclamation-support-v1` removed
- Draft overlay hidden
- `__OSG_DRAFT_CONFIRM_HANDLER__` nulled on live stop

---

## RC-D3 — Time Question Routing

These phrases now classify as `TIME_QUERY` → OpenAI (not `READ_PRICE`):

- „Wie viel Uhr ist es?“ / „Wie spät ist es?“
- „What time is it?“ / „How late is it?“
- „กี่โมงแล้ว“
- „Która godzina?“

Price queries still route to `READ_PRICE`:

- „Wie viel kostet das?“
- „How much does it cost?“
- „ราคาเท่าไหร่“

---

## RC-D4 — Wake Word Empty Handling

1. `osgPauliStripWakePhrase()` removes wake text (may yield empty string).
2. If input is a **pure wake phrase** → `osgPauliWakeGreetingReply()` + `listenOnce()` (no empty prompt into pipeline).
3. `startPauliLiveConversation()` with no `initialText` → `listenOnce()` directly (not `processUserText("")`).

---

## Verification Scenarios

| Step | Expected (post-fix) |
|------|---------------------|
| Hi Pauli | Greeting flow; listening continues |
| Wie spät ist es? | Time answer via OpenAI (`TIME_QUERY`) |
| Ich suche einen Fernseher. | Shopping conversation via `/api/pauli-chat` |
| Schreibe eine Reklamation. | Complaint draft mode |
| Verwerfen | Draft + session cleared |
| Hi Pauli (again) | Fresh conversation — no remind text |

### Automated checks (local + production markers)

```bash
node scripts/osg-rcd-dialogue-verify.mjs
# PASS

# Production fingerprint (2026-06-27):
curl -sS https://pauli-best-price-api.onrender.com/assets/scripts/osg_intent_classifier.js | rg TIME_QUERY
curl -sS https://pauli-best-price-api.onrender.com/assets/scripts/osg-index-app-main.module.js | rg osgClearComplaintConversationState
```

**Production verification result:** PASS  
- `osg_intent_classifier.js` Last-Modified: `Sat, 27 Jun 2026 01:02:25 GMT`  
- `TIME_QUERY`, `osgClearComplaintConversationState`, `osgPauliWakeGreetingReply` present in live assets  
- Deploy propagated within ~60s of push (`e120624..e62bd19`)

---

## Deployment Confirmation

| Item | Value |
|------|-------|
| Branch | `main` |
| Push | `e120624..e62bd19` → `origin/main` |
| Render origin | `x-render-origin-server: Render` |
| Live asset etag (main module) | `W/"3cd80-19f069968e8"` |
| Static verify | `scripts/osg-rcd-dialogue-verify.mjs` PASS |

---

*RC-D2 / RC-D5 remain open for a separate pass if audio selection or cloud TTS policy changes are required.*
