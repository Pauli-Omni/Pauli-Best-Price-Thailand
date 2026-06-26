// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Digital Human — Phase 6 Gesture Intelligence
 *
 * Additive extension. Does NOT remove or rename existing APIs.
 *
 * Replaces heuristic/random gesture selection with deterministic classification:
 *   - reply intent (sales, explanation, greeting, farewell, apology, humor, …)
 *   - current emotion (from OSG_DIGITAL_HUMAN / empathy)
 *   - combinable gesture stack (primary + secondary overlays)
 *
 * Integration:
 *   - install() wraps OSG_DIGITAL_HUMAN.chooseGesture (preserves original)
 *   - primary gesture still calls osgAvatarGestureStart via setGesture()
 *   - secondary gestures via is-dh6-gesture-* CSS classes on #coin-stage
 *
 * No setInterval, no own rAF.
 */
(function (global) {
  "use strict";

  var INTENTS = [
    "neutral",
    "sales",
    "explanation",
    "greeting",
    "farewell",
    "apology",
    "humor",
    "confirmation",
    "question",
    "empathy",
    "celebration",
    "thinking",
    "warning",
    "joy",
  ];

  /** Extended gesture ids (CSS + optional bridge) */
  var GESTURE_DEFS = {
    acknowledge:  { legacy: "acknowledge", durationMs: 4200, priority: 10 },
    confirm:      { legacy: "confirm",     durationMs: 3800, priority: 20 },
    help:         { legacy: "help",        durationMs: 4500, priority: 15 },
    greet:        { legacy: "greet",       durationMs: 5200, priority: 25 },
    wai:          { legacy: "wai",         durationMs: 4800, priority: 30 },
    celebrate:    { legacy: "acknowledge", durationMs: 3600, priority: 35, css: "celebrate" },
    point_left:   { legacy: "help",        durationMs: 4000, priority: 18, css: "point-left" },
    point_right:  { legacy: "help",        durationMs: 4000, priority: 18, css: "point-right" },
    explain:      { legacy: "help",        durationMs: 5000, priority: 22, css: "explain" },
    sales_present:{ legacy: "confirm",     durationMs: 4400, priority: 28, css: "sales-present" },
    apologize:    { legacy: "acknowledge", durationMs: 4200, priority: 24, css: "apologize" },
    wave_goodbye: { legacy: "greet",       durationMs: 4600, priority: 26, css: "wave-goodbye" },
    humor_laugh:  { legacy: "acknowledge", durationMs: 3200, priority: 32, css: "humor-laugh" },
    listen_nod:   { legacy: "acknowledge", durationMs: 8000, priority: 12, css: "listen-nod" },
    empathy_soft: { legacy: "greet",       durationMs: 4800, priority: 20, css: "empathy-soft" },
  };

  /** Intent → default gesture stack (ordered: primary first) */
  var INTENT_GESTURES = {
    neutral:       ["acknowledge"],
    sales:         ["sales_present", "point_right", "confirm"],
    explanation:   ["explain", "point_left", "help"],
    greeting:      ["greet", "wai"],
    farewell:      ["wave_goodbye", "acknowledge"],
    apology:       ["apologize", "empathy_soft"],
    humor:         ["humor_laugh", "celebrate"],
    confirmation:  ["confirm", "acknowledge"],
    question:      ["help", "point_left"],
    empathy:       ["empathy_soft", "acknowledge"],
    celebration:   ["celebrate", "confirm"],
    thinking:      ["explain", "listen_nod"],
    warning:       ["point_left", "acknowledge"],
    joy:           ["celebrate", "humor_laugh", "confirm"],
  };

  /** Emotion → gesture bias (add/replace in stack) */
  var EMOTION_GESTURE_BIAS = {
    neutral:      [],
    happy:        ["celebrate"],
    sad:          ["empathy_soft"],
    anger:        ["acknowledge"],
    separation:   ["empathy_soft"],
    sympathy:     ["empathy_soft"],
    love:         ["greet"],
    stress:       ["acknowledge"],
    curious:      ["help", "point_left"],
    confident:    ["confirm", "point_right"],
    professional: ["acknowledge"],
    serious:      ["acknowledge"],
    friendly:     ["greet"],
    sales:        ["sales_present"],
    thinking:     ["explain", "listen_nod"],
    listening:    ["listen_nod"],
    surprised:    ["acknowledge"],
    happy:        ["celebrate"],
  };

  /** Intent detection patterns (multilingual tokens, classification only) */
  var INTENT_PATTERNS = [
    { intent: "greeting", re: /\b(hallo|hello|hi\b|welcome|willkommen|sawadee|สวัสดี|guten\s+tag|hey\b|good\s+morning|good\s+evening)\b/i, score: 90 },
    { intent: "farewell", re: /\b(bye|goodbye|tschüss|auf\s+wiedersehen|see\s+you|farewell|bis\s+bald|ลาก่อน|再見|pa\s+pa)\b/i, score: 88 },
    { intent: "apology", re: /\b(sorry|entschuld|apolog|verzeih|ขอโทษ|对不起|przepraszam|извини)\b/i, score: 86 },
    { intent: "humor", re: /\b(lol|haha|funny|witzig|lustig|joke|scherz|ตลก|幽默|😄|😂)\b/i, score: 84 },
    { intent: "joy", re: /\b(freude|joy|happy|glück|glad|delight|ยินดี|开心|радост)\b/i, score: 83 },
    { intent: "celebration", re: /\b(congrat|celebr|success|gewonn|freu|ยินดี|恭喜|hurra|yay)\b/i, score: 82 },
    { intent: "warning", re: /\b(warn|achtung|caution|vorsicht|danger|risk|gefahr|ระวัง|警告|осторож)\b/i, score: 81 },
    { intent: "sales", re: /\b(kauf|buy|angebot|offer|deal|rabatt|discount|promo|preis|price|best\s+price|tarif|package|paket|ส่วนลด|优惠)\b/i, score: 80 },
    { intent: "explanation", re: /\b(erkla|explain|because|weil|deshalb|how\s+it|so\s+funktioniert|guide|anleitung|step|schritt|วิธี|说明)\b/i, score: 78 },
    { intent: "thinking", re: /\b(nachdenk|think|überleg|consider|hmm|moment|let\s+me\s+see|พิจารณา|想想|дума)\b/i, score: 77 },
    { intent: "confirmation", re: /\b(ja\b|yes|ok\b|okay|bestät|confirm|agree|einverstanden|ตกลง|好的|got\s+it)\b/i, score: 76 },
    { intent: "question", re: /[?？]/, score: 70 },
    { intent: "empathy", re: /\b(versteh|understand|fühle|feel|support|da\s+für|mitgefühl|sympath|compassion|ช่วย|理解|troost)\b/i, score: 74 },
  ];

  var _stack = [];
  var _maxStack = 3;
  var _installed = false;
  var _stage = null;
  var _origChooseGesture = null;
  var _lastIntent = "neutral";
  var _timers = Object.create(null);

  function coinStage() {
    if (!_stage) _stage = global.document && global.document.getElementById("coin-stage");
    return _stage;
  }

  function dispatch(name, detail) {
    try {
      global.document.dispatchEvent(
        new CustomEvent(name, { detail: detail || {}, bubbles: true })
      );
    } catch (_) {}
  }

  function currentEmotion() {
    if (global.OSG_DIGITAL_HUMAN && global.OSG_DIGITAL_HUMAN.state) {
      return global.OSG_DIGITAL_HUMAN.state.emotion || "neutral";
    }
    if (global.OSG_DH_EMOTION_LAYER && global.OSG_DH_EMOTION_LAYER.getStack) {
      var st = global.OSG_DH_EMOTION_LAYER.getStack();
      if (st && st.length) {
        var best = st[0];
        for (var i = 1; i < st.length; i++) {
          if (st[i].weight > best.weight) best = st[i];
        }
        return best.name || "neutral";
      }
    }
    return "neutral";
  }

  function classifyIntent(text) {
    var t = String(text || "").trim();
    if (!t) return { intent: "neutral", score: 0 };
    var best = { intent: "neutral", score: 0 };
    for (var i = 0; i < INTENT_PATTERNS.length; i++) {
      var p = INTENT_PATTERNS[i];
      if (p.re.test(t) && p.score > best.score) {
        best = { intent: p.intent, score: p.score };
      }
    }
    return best;
  }

  function uniquePush(arr, id) {
    if (arr.indexOf(id) < 0) arr.push(id);
  }

  function resolveGestureStack(intent, emotion, opts) {
    opts = opts || {};
    var ids = (INTENT_GESTURES[intent] || INTENT_GESTURES.neutral).slice();
    var bias = EMOTION_GESTURE_BIAS[emotion] || [];
    for (var i = 0; i < bias.length; i++) uniquePush(ids, bias[i]);
    if (opts.forceGestures && opts.forceGestures.length) {
      ids = opts.forceGestures.slice();
    }
    return ids.slice(0, _maxStack);
  }

  function clearCssGestures(el) {
    if (!el) return;
    var rm = [];
    el.classList.forEach(function (c) {
      if (c.indexOf("is-dh6-gesture-") === 0) rm.push(c);
    });
    rm.forEach(function (c) { el.classList.remove(c); });
  }

  function clearTimer(id) {
    if (_timers[id]) {
      clearTimeout(_timers[id]);
      delete _timers[id];
    }
  }

  function removeFromStack(id) {
    for (var i = _stack.length - 1; i >= 0; i--) {
      if (_stack[i].id === id) {
        _stack.splice(i, 1);
        clearTimer(id);
        var el = coinStage();
        if (el) el.classList.remove("is-dh6-gesture-" + id.replace(/_/g, "-"));
      }
    }
  }

  function addGesture(id, opts) {
    opts = opts || {};
    var def = GESTURE_DEFS[id];
    if (!def) return false;
    removeFromStack(id);
    _stack.push({ id: id, def: def, addedAt: Date.now() });
    var el = coinStage();
    var cssKey = (def.css || id).replace(/_/g, "-");
    if (el) el.classList.add("is-dh6-gesture-" + cssKey);
    var dur = opts.durationMs != null ? opts.durationMs : def.durationMs;
    if (dur > 0 && !opts.permanent) {
      _timers[id] = global.setTimeout(function () {
        removeFromStack(id);
        refreshDom();
      }, dur);
    }
    return true;
  }

  function refreshDom() {
    var el = coinStage();
    if (!el) return;
    if (_stack.length === 0) {
      el.removeAttribute("data-dh6-intent");
      return;
    }
    el.setAttribute("data-dh6-intent", _lastIntent);
  }

  function applyStack(gestureIds, opts) {
    opts = opts || {};
    var el = coinStage();
    clearCssGestures(el);
    _stack.length = 0;
    Object.keys(_timers).forEach(clearTimer);

    if (!gestureIds.length) gestureIds = ["acknowledge"];

    var primaryId = gestureIds[0];
    var primary = GESTURE_DEFS[primaryId];

    for (var i = 0; i < gestureIds.length; i++) {
      addGesture(gestureIds[i], {
        durationMs: opts.durationMs,
        permanent: i === 0 && opts.holdPrimary,
      });
    }

    refreshDom();

    if (global.OSG_DIGITAL_HUMAN && typeof global.OSG_DIGITAL_HUMAN.setGesture === "function") {
      global.OSG_DIGITAL_HUMAN.setGesture(primary && primary.legacy ? primary.legacy : primaryId, {
        durationMs: (primary && primary.durationMs) || 4200,
      });
    }

    if (global.OSG_DIGITAL_HUMAN_MOTION && typeof global.OSG_DIGITAL_HUMAN_MOTION.setGesture === "function") {
      global.OSG_DIGITAL_HUMAN_MOTION.setGesture(motionGestureId(primaryId));
    }

    triggerBridgeForStack(gestureIds);

    if (intentToPhase(_lastIntent) && global.OSG_DIGITAL_HUMAN) {
      global.OSG_DIGITAL_HUMAN.setPhase(intentToPhase(_lastIntent), { skipLegacy: true });
    }

    dispatch("osg:digital-human:gesture-intelligence", {
      intent: _lastIntent,
      gestures: gestureIds.slice(),
      emotion: opts.emotion || currentEmotion(),
    });

    return gestureIds.slice();
  }

  var MOTION_GESTURES = {
    celebrate: 1,
    acknowledge: 1,
    confirm: 1,
    help: 1,
    greet: 1,
    point_left: 1,
    point_right: 1,
    nod: 1,
  };

  function motionGestureId(id) {
    if (MOTION_GESTURES[id]) return id;
    var def = GESTURE_DEFS[id];
    if (!def) return "acknowledge";
    if (def.css && MOTION_GESTURES[def.css.replace(/-/g, "_")]) {
      return def.css.replace(/-/g, "_");
    }
    return def.legacy || "acknowledge";
  }

  function triggerBridgeForStack(gestureIds) {
    if (typeof global.trigger3DAvatar !== "function") return;
    if (gestureIds.indexOf("humor_laugh") >= 0) {
      global.trigger3DAvatar("pauli_laugh_animation");
    } else if (gestureIds.indexOf("celebrate") >= 0) {
      global.trigger3DAvatar("pauli_applause_animation");
    } else if (gestureIds.indexOf("sales_present") >= 0) {
      global.trigger3DAvatar("pauli_lean_forward");
    }
  }

  function intentToPhase(intent) {
    if (intent === "sales") return "speaking_sales";
    if (intent === "celebration" || intent === "humor" || intent === "joy") return "celebrate";
    if (intent === "greeting") return "greeting";
    if (intent === "farewell") return "goodbye";
    if (intent === "explanation" || intent === "thinking") return "speaking_professional";
    if (intent === "apology" || intent === "empathy") return "sympathy";
    if (intent === "warning") return "warning";
    return null;
  }

  function wrapChooseGesture(origFn) {
    return function (reply, opts) {
      opts = opts || {};
      var result = classifyAndApply(reply, opts);
      if (typeof origFn === "function" && opts.useLegacy === true) {
        return origFn.call(this, reply, opts);
      }
      return result;
    };
  }

  function mirrorAvatarChooseGesture(wrappedFn) {
    if (!global.OSG_AVATAR) return;
    global.OSG_AVATAR.chooseGesture = wrappedFn;
    if (global.OSG_DIGITAL_HUMAN) {
      global.OSG_DIGITAL_HUMAN.chooseGesture = wrappedFn;
    }
  }

  function classifyAndApply(reply, opts) {
    opts = opts || {};
    var hit = classifyIntent(reply);
    _lastIntent = hit.intent;
    var emotion = opts.emotion || currentEmotion();
    var stack = resolveGestureStack(hit.intent, emotion, opts);
    return applyStack(stack, { emotion: emotion, durationMs: opts.durationMs });
  }

  function install() {
    if (_installed) return true;
    _installed = true;
    coinStage();

    if (global.OSG_DIGITAL_HUMAN && typeof global.OSG_DIGITAL_HUMAN.chooseGesture === "function") {
      _origChooseGesture = global.OSG_DIGITAL_HUMAN._origChooseGesture || global.OSG_DIGITAL_HUMAN.chooseGesture;
      var wrappedChoose = wrapChooseGesture(_origChooseGesture);
      global.OSG_DIGITAL_HUMAN._origChooseGesture = _origChooseGesture;
      mirrorAvatarChooseGesture(wrappedChoose);
    } else if (global.OSG_AVATAR && typeof global.OSG_AVATAR.chooseGesture === "function") {
      _origChooseGesture = global.OSG_AVATAR.chooseGesture;
      mirrorAvatarChooseGesture(wrapChooseGesture(_origChooseGesture));
      global.OSG_DIGITAL_HUMAN = global.OSG_DIGITAL_HUMAN || {};
      global.OSG_DIGITAL_HUMAN._origChooseGesture = _origChooseGesture;
    }

    if (global.document) {
      global.document.addEventListener("osg:digital-human:emotion", function () {
        if (_stack.length && _lastIntent !== "neutral") {
          var emotion = currentEmotion();
          var stack = resolveGestureStack(_lastIntent, emotion, {});
          applyStack(stack, { emotion: emotion, holdPrimary: true });
        }
      });
    }

    return true;
  }

  global.OSG_DH_GESTURE_INTELLIGENCE = {
    install: install,
    classifyIntent: classifyIntent,
    resolveGestureStack: resolveGestureStack,
    applyFromReply: classifyAndApply,
    addGesture: addGesture,
    removeGesture: removeFromStack,
    clearGestures: function () {
      clearCssGestures(coinStage());
      _stack.length = 0;
      Object.keys(_timers).forEach(clearTimer);
      refreshDom();
    },
    getStack: function () {
      return _stack.map(function (e) { return e.id; });
    },
    getLastIntent: function () { return _lastIntent; },
    INTENTS: INTENTS.slice(),
    GESTURES: Object.keys(GESTURE_DEFS),
  };

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", install);
    } else {
      install();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
