#!/usr/bin/env node
/**
 * RC-D1 re-entry fix verification (static).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const main = read("assets/scripts/osg-index-app-main.module.js");

assert(
  main.includes("function osgResetComplaintLiveContext"),
  "osgResetComplaintLiveContext missing"
);
assert(
  main.includes("function osgPauliHandleDraftPendingTurn"),
  "osgPauliHandleDraftPendingTurn missing"
);
assert(
  main.includes("osgPauliIsPureWakePhrase(rawText)") &&
    main.includes("osgResetComplaintLiveContext();") &&
    main.includes("function osgPauliHandleDraftPendingTurn"),
  "RC-P0-A: pure wake must reset inside pending handler"
);
assert(
  /if \(osgPauliLiveActive\) \{[\s\S]*freshConversation[\s\S]*osgResetComplaintLiveContext/.test(
    main
  ),
  "RC-P0-B: live-active wake/coin must reset complaint context"
);
assert(
  main.includes("osgResetComplaintLiveContext();") &&
    main.includes("confirmedHandoffReply") &&
    main.includes("rejectedReply"),
  "RC-P1-A: confirm/reject must reset live context"
);
assert(
  !/draftFlowActive[\s\S]{0,220}isReclamationTopic/.test(main),
  "RC-P1-B: draftFlowActive must not use isReclamationTopic"
);
assert(
  main.includes("rcFlow.isDraftRequest(gateText)"),
  "RC-P1-B: draftFlowActive must use isDraftRequest only"
);
assert(
  main.includes("function osgPauliHandleDraftPendingTurn"),
  "RC-D1 re-entry pending handler missing"
);

console.log("PASS osg-rcd1-reentry-verify.mjs");
