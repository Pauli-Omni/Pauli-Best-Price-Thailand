#!/usr/bin/env node
/**
 * RC-D1 / RC-D3 / RC-D4 dialogue pipeline verification (static).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadClientClassifier() {
  const src = read("assets/scripts/osg_intent_classifier.js");
  const sandbox = { window: {} };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(src, sandbox, { filename: "osg_intent_classifier.js" });
  return sandbox.OSG_INTENT_CLASSIFIER.classify;
}

function loadServerClassifier() {
  const modPath = join(
    root,
    "02_Quellcode/Core_Logik/services/IntentClassifierService.js"
  );
  const svc = require(modPath).default;
  return svc.classify.bind(svc);
}

const TIME_PHRASES = [
  "Wie viel Uhr ist es?",
  "Wie spät ist es?",
  "What time is it?",
  "How late is it?",
  "กี่โมงแล้ว",
  "Która godzina?",
];

const PRICE_PHRASES = [
  "Wie viel kostet das?",
  "How much does it cost?",
  "ราคาเท่าไหร่",
];

const main = read("assets/scripts/osg-index-app-main.module.js");

assert(
  main.includes("function osgClearComplaintConversationState"),
  "RC-D1: osgClearComplaintConversationState missing"
);
assert(
  main.includes("window.osgClearComplaintConversationState = osgClearComplaintConversationState"),
  "RC-D1: clear helper not exported"
);
assert(
  main.includes("osgClearComplaintConversationState();") &&
    main.includes("async function startPauliLiveConversation"),
  "RC-D1: clear not wired to live conversation start"
);
assert(
  main.includes("function osgPauliIsPureWakePhrase") &&
    main.includes("function osgPauliWakeGreetingReply"),
  "RC-D4: wake greeting helpers missing"
);
assert(
  main.includes("if (opts.initialText)") && main.includes("await listenOnce();"),
  "RC-D4: empty initialText must listenOnce, not processUserText('')"
);
assert(
  !main.includes("dynamicSpeech:"),
  "RC-D2 guard: dynamicSpeech must not be in this fix commit"
);

const clientClassify = loadClientClassifier();
const serverClassify = loadServerClassifier();

for (const phrase of TIME_PHRASES) {
  const c = clientClassify(phrase);
  const s = serverClassify(phrase);
  assert(c.intent === "TIME_QUERY" && c.allowOpenAI === true, `RC-D3 client: ${phrase} -> ${c.intent}`);
  assert(s.intent === "TIME_QUERY" && s.allowOpenAI === true, `RC-D3 server: ${phrase} -> ${s.intent}`);
}

for (const phrase of PRICE_PHRASES) {
  const c = clientClassify(phrase);
  const s = serverClassify(phrase);
  assert(c.intent === "READ_PRICE", `RC-D3 client price: ${phrase} -> ${c.intent}`);
  assert(s.intent === "READ_PRICE", `RC-D3 server price: ${phrase} -> ${s.intent}`);
}

console.log("PASS osg-rcd-dialogue-verify.mjs");
