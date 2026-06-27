#!/usr/bin/env node
/**
 * Dialogue recovery runtime verification (static).
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
const draft = read("assets/scripts/draft_ownership_logic.js");
const render = read("render.yaml");

assert(
  !main.includes("pickNextPauliSpruch(osgVcCurrentLangCode())"),
  "marketing trend spruch must not open live conversation"
);
assert(
  main.includes("osgPauliLiveDialogueOnly = true"),
  "live dialogue must skip promo modules"
);
assert(
  main.includes("dynamicSpeech") && main.includes("throw new Error(errCode)"),
  "dynamicSpeech + chat error throw required"
);
assert(
  main.includes("dynamicSpeech: true") &&
    main.includes("pack.pauliChatError"),
  "chat errors must use single error message with dynamicSpeech"
);
assert(
  !draft.includes("looksLikeDraft(reply)") ||
    !/looksLikeDraft\(reply\)[\s\S]{0,80}return true/.test(draft),
  "needsConfirmation must not auto-stage on looksLikeDraft alone"
);
assert(
  render.includes("pauli-best-price-api.onrender.com"),
  "render.yaml must allow production Render origin"
);

console.log("PASS osg-dialogue-recovery-verify.mjs");
