import "dotenv/config";
import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateInvolveDeeplink,
  involveAsiaStatus,
} from "./services/involve-asia.js";
import {
  createSupportTicket,
  OSG_SUPPORT_APP_DISPLAY,
  OSG_SUPPORT_EMAIL,
} from "./services/support-tickets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;

const LEADS_FILE = path.join(__dirname, "data", "leads.jsonl");

/** Strip unknown keys and omit free-text hints from server-side lead files (privacy). */
function appendLeadLine(obj) {
  const stamp = new Date().toISOString();
  const row = {
    osg_partner:
      typeof obj.osg_partner === "string"
        ? obj.osg_partner.slice(0, 120)
        : "",
    osg_ch:
      typeof obj.osg_ch === "string" ? obj.osg_ch.slice(0, 80) : "",
    leadId: typeof obj.leadId === "string" ? obj.leadId.slice(0, 120) : "",
    customerId:
      typeof obj.customerId === "string"
        ? obj.customerId.slice(0, 120)
        : "",
    clickedAtISO:
      typeof obj.clickedAtISO === "string"
        ? obj.clickedAtISO.slice(0, 40)
        : undefined,
    landingHref:
      typeof obj.landingHref === "string"
        ? obj.landingHref.slice(0, 800)
        : "",
    trackedHref:
      typeof obj.trackedHref === "string"
        ? obj.trackedHref.slice(0, 1400)
        : "",
    conversionBasis: !!obj.conversionBasis,
    leadIntent:
      typeof obj.leadIntent === "string"
        ? obj.leadIntent.slice(0, 48)
        : "",
    outboundLeadRef:
      typeof obj.outboundLeadRef === "string"
        ? obj.outboundLeadRef.slice(0, 120)
        : "",
    provisionRealm:
      typeof obj.provisionRealm === "string"
        ? obj.provisionRealm.slice(0, 48)
        : "",
    voucherCode:
      typeof obj.voucherCode === "string"
        ? obj.voucherCode.slice(0, 40)
        : "",
    voucherThb:
      typeof obj.voucherThb === "number" && Number.isFinite(obj.voucherThb)
        ? obj.voucherThb
        : undefined,
    qrScan: !!obj.qrScan,
    voucherActivated: !!obj.voucherActivated,
    pickupFulfillment:
      typeof obj.pickupFulfillment === "string"
        ? obj.pickupFulfillment.slice(0, 40)
        : "",
    marketplaceSubId:
      typeof obj.marketplaceSubId === "string"
        ? obj.marketplaceSubId.slice(0, 96)
        : "",
    voucherMinimumBasketThb:
      typeof obj.voucherMinimumBasketThb === "number" &&
      Number.isFinite(obj.voucherMinimumBasketThb)
        ? obj.voucherMinimumBasketThb
        : undefined,
    ageConfirmed20: !!obj.ageConfirmed20,
    ageGateSector:
      typeof obj.ageGateSector === "string"
        ? obj.ageGateSector.slice(0, 24)
        : "",
    receivedAt: stamp,
  };
  const line = JSON.stringify(row) + "\n";
  fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
  fs.appendFileSync(LEADS_FILE, line, "utf8");
}

app.disable("x-powered-by");

function osgSecurityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(self), camera=(self), microphone=(self), payment=()",
  );
  /** HSTS belongs on the terminating TLS proxy (nginx); enable only when terminating HTTPS here */
  if (process.env.OSG_ENABLE_HSTS === "1") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains",
    );
  }
  next();
}

app.use(osgSecurityHeaders);

/** Per-route limits (trust proxy + IP). Tune via OSG_RL_* env vars; use Redis store if you scale horizontally. */
function osgRateLimit(opts) {
  const { windowMs, max, envMax } = opts;
  let cap = max;
  if (envMax) {
    const raw = process.env[envMax];
    if (raw != null && String(raw).trim() !== "") {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 1) cap = Math.min(1000000, Math.floor(n));
    }
  }
  return rateLimit({
    windowMs,
    max: cap,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).type("json").json({ error: "rate_limited" });
    },
  });
}

const rlLead = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  envMax: "OSG_RL_LEAD_MAX",
});
const rlRefReg = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  envMax: "OSG_RL_REF_REGISTER_MAX",
});
const rlRefClaim = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  envMax: "OSG_RL_REF_CLAIM_MAX",
});
const rlRefStatus = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 240,
  envMax: "OSG_RL_REF_STATUS_MAX",
});
const rlInstallFp = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 90,
  envMax: "OSG_RL_INSTALL_FP_MAX",
});
const rlVipRedeem = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 24,
  envMax: "OSG_RL_VIP_REDEEM_MAX",
});
const rlVipEvent = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 180,
  envMax: "OSG_RL_VIP_EVENT_MAX",
});
const rlVipPing = osgRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  envMax: "OSG_RL_VIP_PING_MAX",
});
const rlVipStats = osgRateLimit({
  windowMs: 60 * 1000,
  max: 240,
  envMax: "OSG_RL_VIP_STATS_MAX",
});
const rlChat = osgRateLimit({
  windowMs: Number(process.env.OSG_RL_CHAT_WINDOW_MS || 3600000),
  max: 40,
  envMax: "OSG_RL_CHAT_MAX",
});
const rlClip = osgRateLimit({
  windowMs: Number(process.env.OSG_RL_CLIP_WINDOW_MS || 3600000),
  max: 30,
  envMax: "OSG_RL_CLIP_MAX",
});
const rlTts = osgRateLimit({
  windowMs: Number(process.env.OSG_RL_TTS_WINDOW_MS || 3600000),
  max: 50,
  envMax: "OSG_RL_TTS_MAX",
});
const rlStt = osgRateLimit({
  windowMs: Number(process.env.OSG_RL_STT_WINDOW_MS || 3600000),
  max: 60,
  envMax: "OSG_RL_STT_MAX",
});
const rlPrices = osgRateLimit({
  windowMs: Number(process.env.OSG_RL_PRICES_WINDOW_MS || 15 * 60 * 1000),
  max: 180,
  envMax: "OSG_RL_PRICES_MAX",
});
const rlAffiliateDeeplink = osgRateLimit({
  windowMs: 60 * 1000,
  max: 18,
  envMax: "OSG_RL_AFF_DEEPLINK_MAX",
});
const rlSupportTicket = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 24,
  envMax: "OSG_RL_SUPPORT_TICKET_MAX",
});

/** Involve Asia account limit: 20 deeplink calls/min — shared global guard */
const osgInvolveDeeplinkBudget = { windowStart: 0, count: 0 };

function osgConsumeInvolveDeeplinkBudget(res) {
  const cap = Math.max(
    1,
    Math.min(
      20,
      Number(process.env.OSG_RL_AFF_DEEPLINK_MAX || 18) || 18,
    ),
  );
  const now = Date.now();
  if (now - osgInvolveDeeplinkBudget.windowStart > 60_000) {
    osgInvolveDeeplinkBudget.windowStart = now;
    osgInvolveDeeplinkBudget.count = 0;
  }
  if (osgInvolveDeeplinkBudget.count >= cap) {
    res.status(429).type("json").json({ error: "involve_rate_limited" });
    return false;
  }
  osgInvolveDeeplinkBudget.count += 1;
  return true;
}

/** Safety net across all JSON/API traffic (per IP). Excludes unscoped routes registered above this stack. */
const rlApiGlobal = osgRateLimit({
  windowMs: Number(process.env.OSG_RL_GLOBAL_WINDOW_MS || 900000),
  max: 800,
  envMax: "OSG_RL_GLOBAL_MAX",
});

/**
 * Optional: comma-separated origins allowed to call this API from a browser on another host.
 * Sets CORS and relaxes Cross-Origin-Resource-Policy for /api responses. Do not use "*" in production.
 * Same-origin hosting: leave unset.
 */
function osgCorsAllowedOrigins() {
  const raw = (process.env.OSG_CORS_ORIGINS || "").trim();
  if (!raw) return null;
  const parts = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (!parts.length) return null;
  return new Set(parts);
}

function osgApiCors(req, res, next) {
  const allowed = osgCorsAllowedOrigins();
  if (!allowed) return next();

  const allowStar = allowed.has("*");
  const reqOrigin = typeof req.get("Origin") === "string" ? req.get("Origin").trim() : "";
  let acao = "";
  if (allowStar) acao = reqOrigin || "*";
  else if (reqOrigin && allowed.has(reqOrigin)) acao = reqOrigin;

  if (req.method === "OPTIONS") {
    if (!acao && reqOrigin) {
      return res.status(403).type("text/plain").send("CORS origin not allowed");
    }
    if (acao) {
      res.setHeader("Access-Control-Allow-Origin", acao);
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, X-OSG-Channel, X-OSG-Build",
      );
      res.setHeader("Access-Control-Max-Age", "7200");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      if (!allowStar) res.append("Vary", "Origin");
    }
    return res.status(204).end();
  }

  if (acao) {
    res.setHeader("Access-Control-Allow-Origin", acao);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (!allowStar) res.append("Vary", "Origin");
  }
  return next();
}

/**
 * Optional hardening: comma-separated exact origins (e.g. https://app.example.com).
 * When set, POST/PUT/PATCH/DELETE under /api must carry Origin or Referer matching the list.
 * Leave unset for same-origin-only tooling and local dev without extra headers.
 */
function osgApiOriginAllowlist(req, res, next) {
  const raw = (process.env.OSG_API_ALLOWED_ORIGINS || "").trim();
  if (!raw) return next();
  const m = req.method;
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return next();
  const allowed = new Set(
    raw
      .split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean),
  );
  if (!allowed.size) return next();
  const origin = req.get("Origin");
  let cand = typeof origin === "string" ? origin.trim() : "";
  if (!cand) {
    const referer = req.get("Referer");
    if (typeof referer === "string" && referer.trim()) {
      try {
        cand = new URL(referer).origin;
      } catch {
        cand = "";
      }
    }
  }
  if (!cand || !allowed.has(cand)) {
    return res.status(403).type("json").json({ error: "origin_not_allowed" });
  }
  return next();
}

app.use("/api", osgApiCors);

app.get("/api/health", (_req, res) => {
  res.type("json").json({
    ok: true,
    app: OSG_SUPPORT_APP_DISPLAY,
    involveAsia: involveAsiaStatus(),
  });
});

app.use("/api", osgApiOriginAllowlist);

function osgApiJsonParser(req, res, next) {
  const limit = req.path === "/clip/identify" ? "8mb" : "100kb";
  return express.json({ limit })(req, res, next);
}

const OSG_AI_DAILY_MAX = Math.max(
  1,
  Number(process.env.OSG_AI_DAILY_MAX || 220),
);
const osgAiBudget = { day: "", count: 0 };

function osgTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function osgConsumeAiBudget(res, units = 1) {
  const today = osgTodayKey();
  if (osgAiBudget.day !== today) {
    osgAiBudget.day = today;
    osgAiBudget.count = 0;
  }
  if (osgAiBudget.count + units > OSG_AI_DAILY_MAX) {
    res.status(429).type("json").json({ error: "ai_daily_limit" });
    return false;
  }
  osgAiBudget.count += units;
  return true;
}

function osgSafeUpstreamError(res, status = 502) {
  return res.status(status).type("json").json({ error: "upstream" });
}

/** STT braucht größeres JSON-Limit (Base64-Audio ~2,5 MB). */
app.post(
  "/api/stt/wake",
  rlStt,
  express.json({ limit: "3mb" }),
  async (req, res) => {
    try {
      const apiKey =
        process.env.OPENAI_API_KEY || process.env.PAULI_OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "stt_unavailable" });
      }
      if (!osgConsumeAiBudget(res, 1)) return;
      const b64 =
        typeof req.body?.audioBase64 === "string"
          ? req.body.audioBase64.trim()
          : "";
      if (!b64) {
        return res.status(400).json({ error: "audioBase64 required" });
      }
      const buf = Buffer.from(b64, "base64");
      if (!buf.length || buf.length > 2_500_000) {
        return res.status(400).json({ error: "audio_invalid" });
      }
      const mime =
        typeof req.body?.mime === "string"
          ? req.body.mime.slice(0, 80)
          : "audio/webm";
      const langRaw =
        typeof req.body?.lang === "string"
          ? req.body.lang.split("-")[0].toLowerCase()
          : "en";
      const whisperLang = {
        de: "de",
        en: "en",
        th: "th",
        pl: "pl",
        ru: "ru",
        zh: "zh",
      }[langRaw];

      const form = new FormData();
      form.append(
        "file",
        new Blob([buf], { type: mime }),
        mime.includes("mp4") ? "wake.m4a" : "wake.webm",
      );
      form.append("model", "whisper-1");
      if (whisperLang) form.append("language", whisperLang);

      const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!r.ok) {
        await r.text().catch(() => "");
        return osgSafeUpstreamError(res, 502);
      }
      const data = await r.json();
      res.json({
        text: typeof data.text === "string" ? data.text : "",
      });
    } catch (e) {
      console.error("[stt/wake]", e);
      if (!res.headersSent) res.status(500).json({ error: "stt_failed" });
    }
  },
);

app.use("/api", osgApiJsonParser);
app.use("/api", rlApiGlobal);

app.post("/api/lead", rlLead, (req, res) => {
  const b = req.body;
  if (!b || typeof b !== "object" || typeof b.osg_partner !== "string") {
    return res.status(400).type("json").json({ error: "invalid_body" });
  }
  try {
    appendLeadLine(b);
    return res.status(204).end();
  } catch (e) {
    console.error("[lead-ingest]", e);
    return res.status(500).type("json").json({ error: "lead_append_failed" });
  }
});

app.post("/api/support/ticket", rlSupportTicket, (req, res) => {
  const b = req.body;
  if (!b || typeof b !== "object") {
    return res.status(400).type("json").json({ error: "invalid_body" });
  }
  try {
    const ticket = createSupportTicket({
      email: b.email,
      message: b.message,
      customerId: b.customerId || b.osg_cid,
      locale: b.locale || b.lang,
      channel: b.channel,
      userAgent: req.get("User-Agent"),
    });
    return res.type("json").json({
      ok: true,
      ticketRef: ticket.ticketRef,
      ticketNum: ticket.ticketNum,
      subject: ticket.subject,
      supportEmail: OSG_SUPPORT_EMAIL,
      appId: ticket.appId,
      appDisplay: ticket.appDisplay,
      mailto: ticket.mailto,
      createdAt: ticket.createdAt,
    });
  } catch (e) {
    const code = e && e.code;
    if (code === "invalid_email") {
      return res.status(400).type("json").json({ error: "invalid_email" });
    }
    if (code === "message_too_short") {
      return res.status(400).type("json").json({ error: "message_too_short" });
    }
    console.error("[support/ticket]", e);
    return res.status(500).type("json").json({ error: "ticket_failed" });
  }
});

app.post("/api/affiliate/deeplink", rlAffiliateDeeplink, async (req, res) => {
  if (!osgConsumeInvolveDeeplinkBudget(res)) return;

  const b = req.body;
  if (!b || typeof b !== "object") {
    return res.status(400).type("json").json({ error: "invalid_body" });
  }

  const partner = String(b.partner || "").trim().slice(0, 48);
  const url = String(b.url || "").trim().slice(0, 2000);
  const affSub2 = String(b.osgCid || b.osg_cid || "").trim().slice(0, 96);
  const affSub3 = String(b.osgLid || b.osg_lid || "").trim().slice(0, 96);

  if (!partner || !url) {
    return res.status(400).type("json").json({ error: "invalid_request" });
  }

  try {
    const result = await generateInvolveDeeplink({
      partner,
      url,
      affSub2,
      affSub3,
    });
    return res.type("json").json({
      ok: true,
      trackingLink: result.trackingLink,
      offerId: result.offerId,
      offerName: result.offerName || null,
      landingHref: url,
    });
  } catch (e) {
    const code = e && e.code;
    if (code === "not_configured") {
      return res.status(503).type("json").json({ error: "involve_not_configured" });
    }
    if (code === "invalid_partner" || code === "invalid_url") {
      return res.status(400).type("json").json({ error: code });
    }
    console.error("[affiliate/deeplink]", e);
    return osgSafeUpstreamError(res);
  }
});

/** Referrer edges: `{ parentRef, childCid, claimedAt }` append-only audit file. */
const REFERRAL_FILE = path.join(__dirname, "data", "referral_edges.jsonl");
const REFERRAL_PARENT_META = path.join(__dirname, "data", "referral_parent_meta.json");

function referralReadEdges() {
  try {
    if (!fs.existsSync(REFERRAL_FILE)) return [];
    const out = [];
    for (const l of fs
      .readFileSync(REFERRAL_FILE, "utf8")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)) {
      try {
        out.push(JSON.parse(l));
      } catch (err) {
        console.error("[referral-read-line]", err.message);
      }
    }
    return out;
  } catch (e) {
    console.error("[referral-read]", e.message);
    return [];
  }
}

function referralAppendEdge(row) {
  fs.mkdirSync(path.dirname(REFERRAL_FILE), { recursive: true });
  fs.appendFileSync(REFERRAL_FILE, JSON.stringify(row) + "\n", "utf8");
}

function referralLoadParentMeta() {
  try {
    if (!fs.existsSync(REFERRAL_PARENT_META)) return {};
    return JSON.parse(fs.readFileSync(REFERRAL_PARENT_META, "utf8"));
  } catch (e) {
    console.error("[referral-meta-read]", e.message);
    return {};
  }
}

function referralSaveParentMeta(obj) {
  fs.mkdirSync(path.dirname(REFERRAL_PARENT_META), { recursive: true });
  fs.writeFileSync(
    REFERRAL_PARENT_META,
    JSON.stringify(obj, null, 2),
    "utf8",
  );
}

/** Referrals count only towards Lifetime if claimed within parent's 168h trial window (once meta registered). */
function referralTrialWindowEndMs(ref) {
  const all = referralLoadParentMeta();
  const row = all[String(ref)];
  if (!row || !row.trialStartISO) return null;
  const t = Date.parse(String(row.trialStartISO));
  if (!Number.isFinite(t)) return null;
  return t + 168 * 3600000;
}

function referralEligibleEdgesForRef(ref) {
  const edges = referralReadEdges().filter(
    (e) => e && String(e.parentRef) === ref,
  );
  const endMs = referralTrialWindowEndMs(ref);
  if (endMs == null) return edges;
  return edges.filter((e) => Date.parse(String(e.claimedAt || "")) <= endMs);
}

/** Dedup key: stable handset anchor when present (mitigates reinstall / new osg_cid), else childCid. */
function referralChildDedupKey(parentRef, childCid, childDeviceAnchor) {
  const p = String(parentRef || "");
  const a = String(childDeviceAnchor || "").trim();
  if (a.length >= 16) return `a:${p}:${a.slice(0, 96)}`;
  return `c:${p}:${String(childCid || "").trim().slice(0, 120)}`;
}

function referralEdgeDedupKey(e) {
  if (!e) return "";
  return referralChildDedupKey(
    e.parentRef,
    e.childCid,
    e.childDeviceAnchor,
  );
}

function referralUniqueDedupKeys(ref) {
  return new Set(
    referralEligibleEdgesForRef(ref).map((e) => referralEdgeDedupKey(e)),
  );
}

function referralUniqueCount(ref) {
  const keys = referralUniqueDedupKeys(ref);
  keys.delete("");
  return keys.size;
}

app.post("/api/referral/register-meta", rlRefReg, (req, res) => {
  try {
    const parentRef = String(req.body?.parentRef || "").trim().slice(0, 96);
    const trialStartISO = String(req.body?.trialStartISO || "")
      .trim()
      .slice(0, 42);
    if (!parentRef || !trialStartISO) {
      return res.status(400).type("json").json({ error: "missing_fields" });
    }
    if (!Number.isFinite(Date.parse(trialStartISO))) {
      return res.status(400).type("json").json({ error: "invalid_iso" });
    }
    const all = referralLoadParentMeta();
    if (!all[parentRef]) {
      all[parentRef] = {
        trialStartISO,
        registeredAtISO: new Date().toISOString(),
      };
      referralSaveParentMeta(all);
    }
    return res.status(200).type("json").json({ ok: true });
  } catch (e) {
    console.error("[referral-register-meta]", e);
    res.status(500).type("json").json({ error: "register_meta_failed" });
  }
});

app.post("/api/referral/claim", rlRefClaim, (req, res) => {
  try {
    const parentRef = String(req.body?.parentRef || "").trim().slice(0, 96);
    const childCid = String(req.body?.childCid || "").trim().slice(0, 120);
    const childDeviceAnchor = String(req.body?.childDeviceAnchor ?? "")
      .trim()
      .slice(0, 96);
    if (!parentRef || !childCid) {
      return res.status(400).type("json").json({ error: "missing_parent_or_child" });
    }
    const dedupKey = referralChildDedupKey(
      parentRef,
      childCid,
      childDeviceAnchor,
    );
    const existingKeys = referralUniqueDedupKeys(parentRef);
    if (!existingKeys.has(dedupKey)) {
      const row = {
        parentRef,
        childCid,
        claimedAt: new Date().toISOString(),
        ip: typeof req.ip === "string" ? req.ip.slice(0, 64) : "",
      };
      if (childDeviceAnchor.length >= 16) row.childDeviceAnchor = childDeviceAnchor;
      referralAppendEdge(row);
    }
    const n = referralUniqueCount(parentRef);
    return res.status(200).type("json").json({
      uniqueCount: n,
      lifetimeUnlocked: n >= 6,
      threshold: 6,
      referralWindowEndsAtISO: (() => {
        const ms = referralTrialWindowEndMs(parentRef);
        return ms != null && Number.isFinite(ms)
          ? new Date(ms).toISOString()
          : null;
      })(),
    });
  } catch (e) {
    console.error("[referral-claim]", e);
    res.status(500).type("json").json({ error: "referral_claim_failed" });
  }
});

app.get("/api/referral/status", rlRefStatus, (req, res) => {
  try {
    const ref = String(req.query.ref || "").trim().slice(0, 96);
    if (!ref) return res.status(400).json({ error: "missing_ref" });
    const n = referralUniqueCount(ref);
    const windowEndISO = (() => {
      const ms = referralTrialWindowEndMs(ref);
      return ms != null && Number.isFinite(ms)
        ? new Date(ms).toISOString()
        : null;
    })();
    res.type("json").json({
      uniqueCount: n,
      lifetimeUnlocked: n >= 6,
      threshold: 6,
      referralWindowEndsAtISO: windowEndISO,
    });
  } catch (e) {
    console.error("[referral-status]", e);
    res.status(500).json({ error: "referral_status_failed" });
  }
});

const OSG_INSTALL_FP_RAW = (process.env.OSG_INSTALL_FP_SALT || "").trim();
const OSG_INSTALL_FP_SALT =
  OSG_INSTALL_FP_RAW || "osg-dev-install-fp-salt-change-me";

function osgClientIpForFingerprint(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0].trim().slice(0, 128);
  }
  const raw =
    (typeof req.ip === "string" && req.ip.trim() && req.ip) ||
    req.socket?.remoteAddress ||
    "0";
  return String(raw).slice(0, 128);
}

/** Opaque per-IP anchor for install/referral bookkeeping (not a raw IP echo). */
app.get("/api/install-fingerprint", rlInstallFp, (req, res) => {
  try {
    const ip = osgClientIpForFingerprint(req);
    const hex = crypto
      .createHash("sha256")
      .update(`${OSG_INSTALL_FP_SALT}|${ip}`, "utf8")
      .digest("hex")
      .slice(0, 48);
    res.type("json").json({ schema: "ip-sha256-v1", ipFingerprint: hex });
  } catch (e) {
    console.error("[install-fingerprint]", e);
    res.status(500).json({ error: "install_fingerprint_failed" });
  }
});

const VIP_CODES_PATH = path.join(__dirname, "data", "vip_codes.json");
const VIP_EVENTS_FILE = path.join(__dirname, "data", "vip_events.jsonl");
const VIP_ONLINE_FILE = path.join(__dirname, "data", "vip_online.json");
let vipCodesCache = null;
let vipProfilesCache = null;

function loadVipCodes() {
  if (vipCodesCache) return vipCodesCache;
  try {
    if (!fs.existsSync(VIP_CODES_PATH)) {
      vipCodesCache = [];
      return vipCodesCache;
    }
    const raw = JSON.parse(fs.readFileSync(VIP_CODES_PATH, "utf8"));
    vipCodesCache = (Array.isArray(raw) ? raw : [])
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  } catch (e) {
    console.error("[vip-codes]", e.message);
    vipCodesCache = [];
  }
  return vipCodesCache;
}

function vipBuildProfiles(codes) {
  const out = {};
  const named = {
    51: "Mama",
    52: "Schwester",
    53: "Bruder",
    54: "FREUND-in",
    55: "Wii",
    56: "PAULI",
  };
  for (let i = 0; i < codes.length; i++) {
    const code = String(codes[i] || "").trim();
    if (!code) continue;
    const slot = i + 1;
    const base = {
      code,
      slot,
      label: named[slot] || `VIP-${String(slot).padStart(2, "0")}`,
      inviteFreeCount: 0,
      inviteUnlimited: false,
      inviteCascadePerFriend: 0,
      fee59Waived: true,
      needsSixInvitesForUnlimited: false,
      commissionPerPurchaseThb: 0,
      role: "vip",
      canViewAllStats: false,
      canViewOwnLiveStats: true,
    };
    if (slot >= 1 && slot <= 30) {
      base.role = "vip_core";
      base.inviteFreeCount = 1;
    } else if (slot >= 31 && slot <= 40) {
      base.role = "influencer";
      base.commissionPerPurchaseThb = 0.5;
    } else if (slot >= 41 && slot <= 50) {
      base.role = "vip_influencer";
      base.commissionPerPurchaseThb = 1;
    } else if (slot >= 51 && slot <= 54) {
      base.role = "family_special";
      base.inviteFreeCount = 3;
    } else if (slot === 55) {
      base.role = "wii_owner";
      base.inviteUnlimited = true;
      base.inviteCascadePerFriend = 2;
    } else if (slot === 56) {
      base.role = "pauli_owner";
      base.inviteUnlimited = true;
      base.inviteCascadePerFriend = 2;
      base.canViewAllStats = true;
    }
    out[code] = base;
  }
  return out;
}

function loadVipProfiles() {
  if (vipProfilesCache) return vipProfilesCache;
  vipProfilesCache = vipBuildProfiles(loadVipCodes());
  return vipProfilesCache;
}

function vipProfileForCode(code) {
  const c = String(code || "").trim();
  if (!c) return null;
  return loadVipProfiles()[c] || null;
}

function vipReadEvents() {
  try {
    if (!fs.existsSync(VIP_EVENTS_FILE)) return [];
    const out = [];
    const lines = fs.readFileSync(VIP_EVENTS_FILE, "utf8").split("\n");
    for (const l of lines) {
      const line = String(l || "").trim();
      if (!line) continue;
      try {
        out.push(JSON.parse(line));
      } catch (e) {
        console.error("[vip-events-read-line]", e.message);
      }
    }
    return out;
  } catch (e) {
    console.error("[vip-events-read]", e.message);
    return [];
  }
}

function vipAppendEvent(row) {
  fs.mkdirSync(path.dirname(VIP_EVENTS_FILE), { recursive: true });
  fs.appendFileSync(VIP_EVENTS_FILE, JSON.stringify(row) + "\n", "utf8");
}

function vipLoadOnline() {
  try {
    if (!fs.existsSync(VIP_ONLINE_FILE)) return {};
    const raw = JSON.parse(fs.readFileSync(VIP_ONLINE_FILE, "utf8"));
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    console.error("[vip-online-read]", e.message);
    return {};
  }
}

function vipSaveOnline(obj) {
  fs.mkdirSync(path.dirname(VIP_ONLINE_FILE), { recursive: true });
  fs.writeFileSync(VIP_ONLINE_FILE, JSON.stringify(obj, null, 2), "utf8");
}

function vipNowMs() {
  return Date.now();
}

function vipPeriodStartMs(ms, period) {
  const d = new Date(ms);
  if (period === "today") {
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === "week") {
    const day = d.getDay();
    const mondayOffset = (day + 6) % 7;
    d.setDate(d.getDate() - mondayOffset);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === "year") {
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  return 0;
}

function vipComputeStats(options = {}) {
  const scopeCode = options.scopeCode ? String(options.scopeCode) : "";
  const includeAll = !!options.includeAll;
  const events = vipReadEvents();
  const stats = {
    downloads: 0,
    purchases: 0,
    serviceUses: 0,
    revenueThb: 0,
    commissionThb: 0,
    byStore: {},
    byCode: {},
  };
  for (const e of events) {
    if (!e || typeof e !== "object") continue;
    const code = String(e.code || "");
    if (!code) continue;
    if (!includeAll && scopeCode && code !== scopeCode) continue;
    const type = String(e.eventType || "");
    const store = String(e.store || "unknown").slice(0, 64) || "unknown";
    const amountThb = Number(e.amountThb || 0);
    const commissionThb = Number(e.commissionThb || 0);
    if (!stats.byStore[store]) {
      stats.byStore[store] = {
        downloads: 0,
        purchases: 0,
        revenueThb: 0,
        commissionThb: 0,
      };
    }
    if (!stats.byCode[code]) {
      stats.byCode[code] = {
        downloads: 0,
        purchases: 0,
        revenueThb: 0,
        commissionThb: 0,
      };
    }
    if (type === "download") {
      stats.downloads += 1;
      stats.byStore[store].downloads += 1;
      stats.byCode[code].downloads += 1;
    } else if (type === "purchase") {
      stats.purchases += 1;
      stats.revenueThb += amountThb;
      stats.commissionThb += commissionThb;
      stats.byStore[store].purchases += 1;
      stats.byStore[store].revenueThb += amountThb;
      stats.byStore[store].commissionThb += commissionThb;
      stats.byCode[code].purchases += 1;
      stats.byCode[code].revenueThb += amountThb;
      stats.byCode[code].commissionThb += commissionThb;
    } else if (type === "service_use") {
      stats.serviceUses += 1;
    }
  }
  return stats;
}

function vipBuildRanking(period) {
  const startMs = vipPeriodStartMs(vipNowMs(), period);
  const byCode = {};
  for (const e of vipReadEvents()) {
    if (!e || String(e.eventType || "") !== "purchase") continue;
    const t = Date.parse(String(e.ts || ""));
    if (!Number.isFinite(t) || t < startMs) continue;
    const code = String(e.code || "");
    if (!code) continue;
    if (!byCode[code]) byCode[code] = { purchases: 0, commissionThb: 0 };
    byCode[code].purchases += 1;
    byCode[code].commissionThb += Number(e.commissionThb || 0);
  }
  const rows = Object.entries(byCode).map(([code, r]) => ({
    code,
    purchases: r.purchases,
    commissionThb: Number(r.commissionThb.toFixed(2)),
  }));
  rows.sort((a, b) => b.purchases - a.purchases || b.commissionThb - a.commissionThb);
  return rows;
}

function vipOnlineSummary(scopeCode, includeAll) {
  const data = vipLoadOnline();
  const now = vipNowMs();
  const activeWindowMs = 5 * 60 * 1000;
  const purgeWindowMs = 24 * 60 * 60 * 1000;
  let changed = false;
  let onlineNow = 0;
  let globalOnlineNow = 0;
  const byCode = {};
  for (const [code, anchors] of Object.entries(data)) {
    if (!anchors || typeof anchors !== "object") continue;
    for (const [anchor, ts] of Object.entries(anchors)) {
      const t = Number(ts);
      if (!Number.isFinite(t)) {
        delete anchors[anchor];
        changed = true;
        continue;
      }
      if (now - t > purgeWindowMs) {
        delete anchors[anchor];
        changed = true;
        continue;
      }
      const isActive = now - t <= activeWindowMs;
      if (isActive) {
        globalOnlineNow += 1;
        byCode[code] = (byCode[code] || 0) + 1;
        if (includeAll || code === scopeCode) onlineNow += 1;
      }
    }
    if (!Object.keys(anchors).length) {
      delete data[code];
      changed = true;
    }
  }
  if (changed) vipSaveOnline(data);
  return {
    onlineNow,
    globalOnlineNow,
    byCode,
    activeWindowSec: Math.floor(activeWindowMs / 1000),
  };
}

/** Validates Pauli-Friends VIP codes (matches data/vip_codes.json). */
app.post("/api/vip/redeem", rlVipRedeem, (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().slice(0, 64);
    if (!code) {
      return res.status(400).type("json").json({ ok: false, error: "missing_code" });
    }
    const profile = vipProfileForCode(code);
    if (profile) {
      return res.status(200).type("json").json({ ok: true, profile });
    }
    return res.status(403).type("json").json({ ok: false, error: "invalid_code" });
  } catch (e) {
    console.error("[vip-redeem]", e);
    res.status(500).type("json").json({ ok: false, error: "vip_redeem_failed" });
  }
});

app.get("/api/vip/profile", rlVipStats, (req, res) => {
  try {
    const code = String(req.query.code || "").trim().slice(0, 64);
    const profile = vipProfileForCode(code);
    if (!profile) return res.status(404).json({ ok: false, error: "unknown_code" });
    res.type("json").json({ ok: true, profile });
  } catch (e) {
    console.error("[vip-profile]", e);
    res.status(500).type("json").json({ ok: false, error: "vip_profile_failed" });
  }
});

app.post("/api/vip/ping", rlVipPing, (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().slice(0, 64);
    const profile = vipProfileForCode(code);
    if (!profile) return res.status(403).json({ ok: false, error: "invalid_code" });
    const anchor = String(req.body?.deviceAnchor || req.body?.installFingerprint || "")
      .trim()
      .slice(0, 120);
    if (anchor.length < 12) {
      return res.status(400).json({ ok: false, error: "device_anchor_required" });
    }
    const online = vipLoadOnline();
    if (!online[code] || typeof online[code] !== "object") online[code] = {};
    online[code][anchor] = vipNowMs();
    vipSaveOnline(online);
    const summary = vipOnlineSummary(code, false);
    res.type("json").json({
      ok: true,
      code,
      onlineNow: summary.onlineNow,
      activeWindowSec: summary.activeWindowSec,
    });
  } catch (e) {
    console.error("[vip-ping]", e);
    res.status(500).type("json").json({ ok: false, error: "vip_ping_failed" });
  }
});

app.post("/api/vip/event", rlVipEvent, (req, res) => {
  try {
    const code = String(req.body?.code || "").trim().slice(0, 64);
    const profile = vipProfileForCode(code);
    if (!profile) return res.status(403).json({ ok: false, error: "invalid_code" });
    const eventType = String(req.body?.eventType || "").trim();
    if (!["download", "purchase", "service_use"].includes(eventType)) {
      return res.status(400).json({ ok: false, error: "invalid_event_type" });
    }
    const store = String(req.body?.store || "unknown").trim().slice(0, 64) || "unknown";
    const amountThb = Number(req.body?.amountThb || 0);
    const ts = new Date().toISOString();
    const commissionThb =
      eventType === "purchase"
        ? Number((profile.commissionPerPurchaseThb || 0).toFixed(2))
        : 0;
    vipAppendEvent({
      ts,
      code,
      slot: profile.slot,
      role: profile.role,
      eventType,
      store,
      amountThb: Number.isFinite(amountThb) && amountThb > 0 ? amountThb : 0,
      commissionThb,
      channel: String(req.body?.channel || "").trim().slice(0, 64),
    });
    const own = vipComputeStats({ scopeCode: code, includeAll: false });
    res.type("json").json({
      ok: true,
      code,
      eventType,
      profile,
      stats: own,
    });
  } catch (e) {
    console.error("[vip-event]", e);
    res.status(500).type("json").json({ ok: false, error: "vip_event_failed" });
  }
});

app.get("/api/vip/stats", rlVipStats, (req, res) => {
  try {
    const code = String(req.query.code || "").trim().slice(0, 64);
    const profile = vipProfileForCode(code);
    if (!profile) return res.status(403).json({ ok: false, error: "invalid_code" });
    const scope = String(req.query.scope || "self").trim();
    const includeAll = scope === "all";
    if (includeAll && !profile.canViewAllStats) {
      return res.status(403).json({ ok: false, error: "forbidden_scope" });
    }
    const stats = vipComputeStats({
      scopeCode: includeAll ? "" : code,
      includeAll,
    });
    const online = vipOnlineSummary(code, includeAll);
    const payload = {
      ok: true,
      scope: includeAll ? "all" : "self",
      code,
      profile,
      stats,
      onlineNow: online.onlineNow,
      activeWindowSec: online.activeWindowSec,
    };
    if (includeAll) {
      payload.globalOnlineNow = online.globalOnlineNow;
      payload.onlineByCode = online.byCode;
    }
    if (profile.slot === 55) {
      payload.wiiDashboard = {
        onlineNow: online.onlineNow,
        downloads: stats.downloads,
        purchases: stats.purchases,
      };
    }
    if (profile.slot === 56) {
      payload.pauliDashboard = {
        ranking: {
          today: vipBuildRanking("today").slice(0, 200),
          week: vipBuildRanking("week").slice(0, 200),
          month: vipBuildRanking("month").slice(0, 200),
          year: vipBuildRanking("year").slice(0, 200),
          all: vipBuildRanking("all").slice(0, 200),
        },
        byStore: stats.byStore,
        totals: {
          downloads: stats.downloads,
          purchases: stats.purchases,
          commissionThb: Number(stats.commissionThb.toFixed(2)),
          revenueThb: Number(stats.revenueThb.toFixed(2)),
          serviceUses: stats.serviceUses,
        },
      };
    }
    res.type("json").json(payload);
  } catch (e) {
    console.error("[vip-stats]", e);
    res.status(500).type("json").json({ ok: false, error: "vip_stats_failed" });
  }
});

/** Rate limit for autoservice bookings */
const rlAutoservice = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  envMax: "OSG_RL_AUTOSERVICE_MAX",
});

const AUTOSERVICE_FILE = path.join(__dirname, "data", "autoservice_bookings.jsonl");

app.post("/api/autoservice/book", rlAutoservice, (req, res) => {
  try {
    const b = req.body;
    if (!b || typeof b !== "object") {
      return res.status(400).type("json").json({ ok: false, error: "invalid_body" });
    }
    const allowed = ["garage","brand","model","service","date","note",
                     "lat","lng","affiliate","customerId","leadId",
                     "osg_ch","osg_partner","leadIntent","clickedAtISO"];
    const row = { receivedAt: new Date().toISOString() };
    allowed.forEach((k) => {
      if (b[k] != null) row[k] = String(b[k]).slice(0, 500);
    });
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    row.lat = Number.isFinite(lat) ? lat : null;
    row.lng = Number.isFinite(lng) ? lng : null;
    fs.mkdirSync(path.dirname(AUTOSERVICE_FILE), { recursive: true });
    fs.appendFileSync(AUTOSERVICE_FILE, JSON.stringify(row) + "\n", "utf8");
    const mailto = (process.env.OSG_AUTOSERVICE_MAILTO || "").trim();
    if (mailto) {
      console.info("[autoservice] booking to forward →", mailto,
        "| garage:", row.garage, "| date:", row.date);
    }
    return res.status(204).end();
  } catch (e) {
    console.error("[autoservice-book]", e);
    return res.status(500).type("json").json({ ok: false, error: "autoservice_failed" });
  }
});

function osgNormalizeRetailPrice(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n >= 100000 ? n / 100000 : n;
}

function osgMarketplaceSearchUrl(retailer, query) {
  const q = encodeURIComponent(String(query || "Thailand").slice(0, 160));
  if (retailer === "lazada") return `https://www.lazada.co.th/catalog/?q=${q}`;
  if (retailer === "shopee") return `https://shopee.co.th/search?keyword=${q}`;
  if (retailer === "bigc") return `https://www.bigc.co.th/search?q=${q}`;
  if (retailer === "lotus") return `https://www.lotuss.com/th/search/${q}`;
  return `https://www.google.com/search?q=${q}`;
}

function osgPriceSearchFallback(retailer, query) {
  const labels = {
    lazada: "Lazada",
    shopee: "Shopee",
    bigc: "Big C",
    lotus: "Lotus's",
  };
  return {
    retailer,
    retailerName: labels[retailer] || retailer,
    title: `${labels[retailer] || retailer} search`,
    priceThb: null,
    currency: "THB",
    url: osgMarketplaceSearchUrl(retailer, query),
    live: false,
    source: "search_link",
  };
}

async function osgFetchShopeePrices(query) {
  const url =
    "https://shopee.co.th/api/v4/search/search_items?keyword=" +
    encodeURIComponent(String(query || "").slice(0, 160)) +
    "&limit=8";
  const r = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
      Referer: "https://shopee.co.th/",
    },
    signal: AbortSignal.timeout(6500),
  });
  if (!r.ok) return [];
  const data = await r.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .map((item) => item?.item_basic || item)
    .filter(Boolean)
    .slice(0, 8)
    .map((item) => {
      const shopId = item.shopid || item.shop_id || "";
      const itemId = item.itemid || item.item_id || "";
      const image = String(item.image || "");
      const imageUrl = image
        ? image.startsWith("http")
          ? image
          : `https://cf.shopee.co.th/file/${image}`
        : "";
      return {
        retailer: "shopee",
        retailerName: "Shopee",
        title: String(item.name || "Shopee product").slice(0, 180),
        priceThb: osgNormalizeRetailPrice(item.price_min || item.price || 0),
        currency: "THB",
        url:
          shopId && itemId
            ? `https://shopee.co.th/product/${shopId}/${itemId}`
            : osgMarketplaceSearchUrl("shopee", query),
        imageUrl,
        live: true,
        source: "shopee_api",
      };
    })
    .filter((offer) => offer.title && offer.url);
}

app.get("/api/prices/search", rlPrices, async (req, res) => {
  try {
    const query = String(req.query?.q || req.query?.query || "").trim();
    if (!query || query.length < 2) {
      return res.status(400).type("json").json({ error: "query_required" });
    }
    const safeQuery = query.slice(0, 160);
    let offers = [];
    try {
      offers = await osgFetchShopeePrices(safeQuery);
    } catch (e) {
      console.warn("[prices/search] shopee unavailable", e && e.message);
    }
    const fallbacks = ["lazada", "bigc", "lotus"]
      .map((retailer) => osgPriceSearchFallback(retailer, safeQuery));
    if (!offers.length) {
      offers.push(osgPriceSearchFallback("shopee", safeQuery));
    }
    res.type("json").json({
      query: safeQuery,
      currency: "THB",
      offers: [...offers, ...fallbacks].slice(0, 12),
    });
  } catch (e) {
    console.error("[prices/search]", e);
    res.status(500).type("json").json({ error: "prices_failed" });
  }
});

/** Photo clip-scan: vision model extracts a marketplace search query (+ optional EAN). */
app.post("/api/clip/identify", rlClip, async (req, res) => {
  try {
    const key = process.env.OPENAI_API_KEY || process.env.PAULI_OPENAI_API_KEY;
    if (!key) {
      return res.status(503).type("json").json({ error: "clip_unavailable" });
    }
    if (!osgConsumeAiBudget(res, 2)) return;
    const lang = String(req.body?.lang || "en").slice(0, 12);
    const mime = String(req.body?.mime || "image/jpeg").slice(0, 64);
    const b64 = String(req.body?.imageBase64 || "").replace(/\s/g, "");
    if (!b64 || b64.length < 32 || b64.length > 6_000_000) {
      return res.status(400).type("json").json({ error: "image_required" });
    }
    const decodedBytes = Math.floor((b64.length * 3) / 4);
    if (decodedBytes > 4_800_000) {
      return res.status(413).type("json").json({ error: "image_too_large" });
    }
    const dataUrl = `data:${mime};base64,${b64}`;
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "You help with in-store price comparison in Thailand (Lazada, Shopee, Big C). " +
                  "Look at the product photo. Reply with JSON only, no markdown: " +
                  '{"query":"short marketplace search phrase (English or Thai)","barcode":"EAN/GTIN digits if clearly visible else empty string"}. ' +
                  `UI language hint: ${lang}.`,
              },
              { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
            ],
          },
        ],
        max_tokens: 140,
        temperature: 0.2,
      }),
    });
    if (!r.ok) {
      await r.text().catch(() => "");
      return osgSafeUpstreamError(res, 502);
    }
    const data = await r.json();
    const raw = String(data?.choices?.[0]?.message?.content || "").trim();
    let query = "";
    let barcode = "";
    try {
      const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
      query = String(parsed.query || "").trim();
      barcode = String(parsed.barcode || "").replace(/\D/g, "");
    } catch (_) {
      query = raw.slice(0, 120);
    }
    if (barcode.length >= 8 && !query) query = barcode;
    if (!query) {
      return res.status(422).type("json").json({ error: "no_product_detected" });
    }
    res.type("json").json({ query, barcode: barcode || null, source: "photo" });
  } catch (e) {
    console.error("[clip/identify]", e);
    res.status(500).type("json").json({ error: "clip_failed" });
  }
});

/** Optional LLM “brain” for Avatar Pauli — set OPENAI_API_KEY in .env. */
app.post("/api/pauli-chat", rlChat, async (req, res) => {
  try {
    const key = process.env.OPENAI_API_KEY || process.env.PAULI_OPENAI_API_KEY;
    if (!key) {
      return res.status(503).type("json").json({ error: "chat_unavailable" });
    }
    if (!osgConsumeAiBudget(res, 1)) return;
    const lang = String(req.body?.lang || "de").slice(0, 12);
    const rawMsgs = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const sanitized = rawMsgs
      .slice(-14)
      .map((m) => ({
        role: m && m.role === "assistant" ? "assistant" : "user",
        content: String(m && m.content != null ? m.content : "").slice(0, 2400),
      }))
      .filter((m) => m.content.trim());

    const system = [
      "You are Pauli, the friendly male navigator avatar for a Thailand-focused shopping and partner-link app (PAULI BEST PRICE / Omni Solutions Global).",
      "You give short, practical, conversational replies — not legal, tax, investment, insurance, or real-estate advice.",
      "You may explain routes, savings ideas, and where to tap next in the app. Never invent prices or binding partner terms.",
      `Reply primarily in the user's UI language (BCP-like code: ${lang}).`,
    ].join(" ");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: system }, ...sanitized],
        max_tokens: 550,
        temperature: 0.65,
      }),
    });
    if (!r.ok) {
      await r.text().catch(() => "");
      return osgSafeUpstreamError(res, 502);
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "";
    res.type("json").json({ reply: String(text || "").trim() });
  } catch (e) {
    console.error("[pauli-chat]", e);
    res.status(500).type("json").json({ error: "chat_failed" });
  }
});

/** Default: ElevenLabs male-narrator preset used for Pauli TTS in shipping config. */
let resolvedVoiceId =
  (process.env.ELEVENLABS_VOICE_ID || "").trim() || "R6OIrb7V5SxlTzLEZVo";

async function resolveVoiceId(apiKey) {
  if (resolvedVoiceId) return resolvedVoiceId;
  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  const voices = data.voices || [];
  const hint = String(process.env.ELEVENLABS_VOICE_NAME_HINT || "").trim();
  const named = hint
    ? voices.find((v) => {
        try {
          return new RegExp(
            hint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i",
          ).test(String(v.name || ""));
        } catch {
          return false;
        }
      })
    : null;
  resolvedVoiceId = named?.voice_id || voices[0]?.voice_id || null;
  return resolvedVoiceId;
}

app.post("/api/tts", rlTts, async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ELEVENLABS_API_KEY missing in .env" });
    }
    if (!osgConsumeAiBudget(res, 1)) return;
    const text =
      typeof req.body?.text === "string" ? req.body.text.slice(0, 2500) : "";
    const whisper = req.body?.whisper === true;
    if (!text.trim()) {
      return res.status(400).json({ error: "text required" });
    }
    const voiceId = await resolveVoiceId(apiKey);
    if (!voiceId) {
      return res
        .status(500)
        .json({ error: "No voice: set ELEVENLABS_VOICE_ID in .env or add a voice in ElevenLabs" });
    }

    /* Streaming-Endpoint: ElevenLabs liefert Audio-Chunks sofort aus,
       kein serverseitiges Puffern der ganzen MP3 — niedrigste Latenz. */
    const ttsUrl =
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream` +
      `?optimize_streaming_latency=3&output_format=mp3_44100_128`;
    /* Voice-Settings: nachts (whisper) sanftere, hauchige Stimme;
       tagsüber klar und kräftig. */
    const voiceSettings = whisper
      ? { stability: 0.72, similarity_boost: 0.75, style: 0.15, use_speaker_boost: false }
      : { stability: 0.48, similarity_boost: 0.82, style: 0.00, use_speaker_boost: true };
    const r = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: voiceSettings,
      }),
    });
    if (!r.ok) {
      await r.text().catch(() => "");
      return osgSafeUpstreamError(res, 502);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    /* WHATWG ReadableStream → Node Readable → direkt an Client pipen.
       Der Client empfängt die MP3-Bytes sobald ElevenLabs sie produziert. */
    const { Readable } = await import("stream");
    const nodeStream = Readable.fromWeb(r.body);
    nodeStream.pipe(res);
    nodeStream.on("error", (err) => {
      console.error("[tts-stream]", err);
      if (!res.headersSent) res.status(500).json({ error: "stream_error" });
    });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: "tts_failed" });
  }
});

/** Block list: verhindert öffentlichen Zugriff auf Secrets, Datendateien,
    interne Skripte und Server-Code, auch wenn `express.static(__dirname)`
    den Projekt-Root statisch ausliefert. */
const OSG_STATIC_DENY = [
  /^\/?\.env(\..*)?$/i,
  /^\/?\.git(\/|$)/i,
  /^\/?\.gitignore$/i,
  /^\/?\.htmlvalidate/i,
  /^\/?node_modules(\/|$)/i,
  /^\/?data(\/|$)/i,
  /^\/?scripts(\/|$)/i,
  /^\/?certs(\/|$)/i,
  /^\/?deploy-omni-solutions(\/|$)/i,
  /^\/?VIP[ %20]+Zugang(\/|$)/i,
  /^\/?server\.js$/i,
  /^\/?render\.yaml$/i,
  /^\/?package(-lock)?\.json$/i,
  /^\/?osg-runtime-config\.js$/i,
  /^\/?osg-runtime-config\.example\.js$/i,
  /^\/?osg-admin-secret\.prod\.js$/i,
  /^\/?\.env\.example$/i,
  /^\/?README\.md$/i,
];

function osgStaticGuard(req, res, next) {
  const url = decodeURIComponent(req.path || "");
  for (const re of OSG_STATIC_DENY) {
    if (re.test(url)) return res.status(404).type("text/plain").send("Not found");
  }
  next();
}

app.use(osgStaticGuard);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname, { dotfiles: "deny", index: ["index.html"] }));

const CERT_KEY_PATH = path.join(__dirname, "certs", "localhost-key.pem");
const CERT_PATH = path.join(__dirname, "certs", "localhost.pem");

if (
  !OSG_INSTALL_FP_RAW ||
  OSG_INSTALL_FP_SALT === "osg-dev-install-fp-salt-change-me"
) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[security] Refusing production start with default OSG_INSTALL_FP_SALT.",
    );
    process.exit(1);
  }
  console.warn(
    "[security] Set OSG_INSTALL_FP_SALT to a long random secret in production (not the dev default).",
  );
}
if (
  process.env.NODE_ENV === "production" &&
  !(process.env.OSG_API_ALLOWED_ORIGINS || "").trim()
) {
  console.error(
    "[security] Refusing production start without OSG_API_ALLOWED_ORIGINS.",
  );
  process.exit(1);
}
if (
  process.env.NODE_ENV === "production" &&
  (process.env.OSG_CORS_ORIGINS || "").split(",").map((s) => s.trim()).includes("*")
) {
  console.error("[security] Refusing production start with wildcard CORS.");
  process.exit(1);
}
if ((process.env.OSG_API_ALLOWED_ORIGINS || "").trim()) {
  console.log(
    "[security] OSG_API_ALLOWED_ORIGINS is set — cross-origin API writes are restricted to that list.",
  );
}
if ((process.env.OSG_CORS_ORIGINS || "").trim()) {
  console.log(
    "[security] OSG_CORS_ORIGINS is set — /api allows browser cross-origin fetches from those origins.",
  );
}

if (
  process.env.DISABLE_HTTPS !== "1" &&
  fs.existsSync(CERT_KEY_PATH) &&
  fs.existsSync(CERT_PATH)
) {
  try {
    const opts = {
      key: fs.readFileSync(CERT_KEY_PATH),
      cert: fs.readFileSync(CERT_PATH),
    };
    https.createServer(opts, app).listen(HTTPS_PORT, () => {
      console.log(
        `PAULI BEST PRICE — HTTPS https://localhost:${HTTPS_PORT}/index.html`,
      );
    });
  } catch (e) {
    console.error("[https] konnte nicht starten:", e.message);
  }
} else if (process.env.DISABLE_HTTPS !== "1") {
  console.log(
    "[https] keine Zertifikate in certs/ — einmal `npm run gencerts`, dann neu starten.",
  );
}

app.listen(PORT, () => {
  console.log(`PAULI BEST PRICE — http://localhost:${PORT}`);
});
