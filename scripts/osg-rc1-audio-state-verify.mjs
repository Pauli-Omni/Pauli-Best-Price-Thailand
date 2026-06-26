/**
 * RC-1 Speech State Machine Verification
 * Simulates osg_audio_registry + osg_tts_guard behavior without browser audio.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import vm from "vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadScript(relativePath, sandbox) {
  const code = readFileSync(join(root, relativePath), "utf8");
  vm.runInContext(code, sandbox, { filename: relativePath });
}

function createSandbox() {
  const sandbox = {
    window: {},
    global: {},
    console,
    setTimeout,
    clearTimeout,
    Date,
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runRegistryTests() {
  const s = createSandbox();
  loadScript("assets/scripts/osg_audio_registry.js", s);
  const R = s.window.OSG_AUDIO_REGISTRY;

  // Normal stopAll must not leave abort epoch active
  R.stopAll();
  R.stopAll();
  R.stopAll();
  assert(!R.isAbortEpochActive(), "RC-1: triple stopAll() must not block epoch");

  let reg = R.register("test", () => {});
  assert(reg !== null, "RC-1: register after stopAll must succeed");

  // Explicit abort path
  R.beginAbortEpoch();
  assert(R.isAbortEpochActive(), "RC-1: beginAbortEpoch sets block");
  reg = R.register("test2", () => {});
  assert(reg === null, "RC-1: register blocked during abort epoch");

  R.resetAbortEpoch();
  assert(!R.isAbortEpochActive(), "RC-1: resetAbortEpoch clears block");
  reg = R.register("test3", () => {});
  assert(reg !== null, "RC-1: register after reset succeeds");

  return true;
}

async function runGuardSimulation() {
  const s = createSandbox();
  loadScript("assets/scripts/osg_audio_registry.js", s);
  loadScript("assets/scripts/osg_tts_guard.js", s);

  const R = s.window.OSG_AUDIO_REGISTRY;
  const playLog = [];

  s.window.playPauliVoice = async function (text) {
    playLog.push(String(text));
    // Simulate playPauliVoice internal stopAllSpeech chain (3x)
    s.window.stopAllSpeech();
    s.window.stopAllSpeech();
    s.window.stopAllSpeech();
    assert(
      !R.isAbortEpochActive(),
      "RC-1: epoch must stay clear during normal play for: " + text
    );
    const entry = R.register("buffer", () => {});
    assert(entry !== null, "RC-1: register must work during play for: " + text);
    R.unregister(entry);
    await new Promise((r) => setTimeout(r, 5));
  };

  s.window.stopAllSpeech = function () {
    R.stopAll();
  };

  s.window.osgInstallPauliTtsGuard();

  // Scenario: App greeting
  await s.window.playPauliVoice("Sawadee krab");
  assert(!R.isAbortEpochActive(), "RC-1: after greeting epoch clear");

  // Scenario: Hi Pauli + follow-up questions
  await s.window.playPauliVoice("Hi Pauli");
  await s.window.playPauliVoice("What is the price?");
  await s.window.playPauliVoice("Any coupons?");
  await s.window.playPauliVoice("I want to complain about my order");

  assert(playLog.length === 5, "RC-1: all 5 speech requests executed");
  assert(!R.isAbortEpochActive(), "RC-1: final epoch clear");

  // Scenario: abort then immediate new speech (osgAvatarSpeakLine pattern)
  s.window.osgPauliTtsAbort();
  assert(R.isAbortEpochActive(), "RC-1: abort sets epoch");
  const pending = s.window.playPauliVoice("Recovery line after abort");
  await new Promise((r) => setTimeout(r, 100));
  await pending;
  assert(playLog.includes("Recovery line after abort"), "RC-1: speech after abort runs");
  assert(!R.isAbortEpochActive(), "RC-1: epoch cleared after abort recovery");

  return { playLog, epochClear: !R.isAbortEpochActive() };
}

const scenarios = [
  { id: 1, name: "App start / registry init", fn: runRegistryTests },
  { id: 2, name: "Greeting (Sawadee)", fn: () => null },
  { id: 3, name: "Hi Pauli", fn: () => null },
  { id: 4, name: "Second question", fn: () => null },
  { id: 5, name: "Third question", fn: () => null },
  { id: 6, name: "Complaint dialogue", fn: () => null },
];

async function main() {
  const results = [];

  try {
    runRegistryTests();
    results.push({ step: 1, name: "App start", pass: true, note: "Registry init + stopAll epoch OK" });
  } catch (e) {
    results.push({ step: 1, name: "App start", pass: false, note: e.message });
    console.error(e);
    process.exit(1);
  }

  try {
    const sim = await runGuardSimulation();
    const labels = [
      "Greeting",
      "Hi Pauli",
      "Second question",
      "Third question",
      "Complaint dialogue",
    ];
    labels.forEach((label, i) => {
      const text = sim.playLog[i];
      results.push({
        step: i + 2,
        name: label,
        pass: !!text,
        note: text ? `playPauliVoice executed: "${text.slice(0, 40)}"` : "missing",
      });
    });
    results.push({
      step: 7,
      name: "Abort recovery",
      pass: sim.epochClear && sim.playLog.length >= 6,
      note: sim.epochClear ? "Epoch reset after interrupt" : "Epoch stuck",
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main();
