import "dotenv/config";
import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import https from "https";
import path from "path";
import {
  generateInvolveDeeplink,
  getAffiliateRuntimeStatus,
  involveAsiaStatus,
  validateAffiliateApi,
  verifyAffiliateRequestHeaders,
} from "./services/involve-asia.js";
import { OSG_AFFILIATE_ID } from "./services/osg-affiliate-config.js";
import {
  createSupportTicket,
  OSG_SUPPORT_APP_DISPLAY,
  OSG_SUPPORT_EMAIL,
} from "./services/support-tickets.js";
import {
  getEmailSystemStatus,
  isOwnerOpsSlot,
  OSG_APP_EMAIL_REGISTRY,
  runEmailConnectivityProbe,
  sendEchoProtocol,
  setEmailCritical,
  verifyAppEmailRegistry,
} from "./services/osg-email-connectivity.js";
import intentClassifier from "./services/IntentClassifierService.js";
import { buildReportOnlyPolicy, buildEnforcementPolicy } from "./osg-csp-policy.mjs";
import {
  avatarStatusPayload,
  registerSocialExempt,
  validateReferralClaim,
} from "./avatar-monetization-server.js";

/** Projekt-Root (npm start / Render starten aus Repo-Root). */
const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(process.cwd(), "03_Datenbank_und_Preise", "data");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const CERTS_DIR = path.join(PROJECT_ROOT, "certs");

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;

const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");

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
    deliveryPreference:
      typeof obj.deliveryPreference === "string"
        ? obj.deliveryPreference.slice(0, 40)
        : "",
    deliveryReason:
      typeof obj.deliveryReason === "string"
        ? obj.deliveryReason.slice(0, 96)
        : "",
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
  if (process.env.OSG_CSP_REPORT_ONLY === "1") {
    res.setHeader(
      "Content-Security-Policy-Report-Only",
      buildReportOnlyPolicy({
        apiOrigin: process.env.OSG_CSP_CONNECT_ORIGIN || "'self'",
        reportUri: process.env.OSG_CSP_REPORT_URI || "",
      }),
    );
  }
  if (process.env.OSG_CSP_ENFORCE === "1") {
    res.setHeader(
      "Content-Security-Policy",
      buildEnforcementPolicy({
        apiOrigin: process.env.OSG_CSP_CONNECT_ORIGIN || "'self'",
        nonce: "",
      }),
    );
  }
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
const rlEchoProtocol = osgRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  envMax: "OSG_RL_ECHO_PROTOCOL_MAX",
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
  const host = String(req.get("host") || req.get("Host") || "").trim();
  const proto = String(
    req.get("x-forwarded-proto") ||
      (typeof req.protocol === "string" ? req.protocol : "") ||
      (process.env.NODE_ENV === "production" ? "https" : "http"),
  ).trim();
  if (host) {
    const base = `${proto}://${host}`.replace(/\/$/, "");
    allowed.add(base);
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
      allowed.add(`http://${host}`.replace(/\/$/, ""));
      allowed.add(`https://${host}`.replace(/\/$/, ""));
    }
  }
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
    // Co-hosted PWA: same Render host without Origin/Referer (privacy / same-origin fetch).
    if (host) {
      const selfOrigin = `${proto}://${host}`.replace(/\/$/, "");
      if (allowed.has(selfOrigin)) {
        return next();
      }
    }
    if (host && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
      return next();
    }
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
    affiliateId: OSG_AFFILIATE_ID,
    affiliate: getAffiliateRuntimeStatus(),
    supportEmail: OSG_SUPPORT_EMAIL,
    emailSystem: getEmailSystemStatus(),
    appEmailRegistry: verifyAppEmailRegistry(),
  });
});

function osgAffiliateSignatureGate(req, res, next) {
  const sig = verifyAffiliateRequestHeaders(req.headers);
  if (!sig.ok) {
    return res.status(403).type("json").json({
      error: "affiliate_signature_invalid",
      reason: sig.reason,
    });
  }
  req.osgAffiliateAppId = sig.appId;
  return next();
}

app.get("/api/affiliate/check", async (req, res) => {
  const appId = String(
    req.query.appId || req.get("X-OSG-App-Id") || "pauli_best_price_thailand"
  )
    .trim()
    .slice(0, 96);
  try {
    const payload = await validateAffiliateApi(appId);
    return res.type("json").json({ ok: true, ...payload });
  } catch (e) {
    console.error("[affiliate/check]", e);
    return res.status(500).type("json").json({
      ok: false,
      label: "Affiliate-API: INACTIVE",
      active: false,
      error: "affiliate_check_failed",
    });
  }
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

app.post("/api/ops/echo-protocol", rlEchoProtocol, async (req, res) => {
  const b = req.body;
  if (!b || typeof b !== "object") {
    return res.status(400).type("json").json({ error: "invalid_body" });
  }
  try {
    const result = await sendEchoProtocol({
      eventType: b.eventType,
      appId: b.appId,
      locale: b.locale || b.lang,
      customerId: b.customerId || b.osg_cid,
      meta: b.meta && typeof b.meta === "object" ? b.meta : {},
    });
    return res.type("json").json({
      ok: true,
      ...result,
      emailSystem: getEmailSystemStatus(),
    });
  } catch (e) {
    const code = e && e.code;
    if (code === "invalid_echo_event") {
      return res.status(400).type("json").json({ error: "invalid_echo_event" });
    }
    console.error("[ops/echo-protocol]", e);
    return res.status(500).type("json").json({ error: "echo_protocol_failed" });
  }
});

app.get("/api/ops/email-probe", rlVipStats, async (req, res) => {
  try {
    const code = String(req.query.code || "").trim().slice(0, 64);
    const profile = vipProfileForCode(code);
    if (!profile || !isOwnerOpsSlot(profile.slot)) {
      return res.status(403).type("json").json({ ok: false, error: "forbidden" });
    }
    const probe = await runEmailConnectivityProbe();
    return res.type("json").json({
      ok: true,
      code,
      profile: { slot: profile.slot, role: profile.role },
      probe,
      emailSystem: getEmailSystemStatus(),
      appEmailRegistry: OSG_APP_EMAIL_REGISTRY,
    });
  } catch (e) {
    console.error("[ops/email-probe]", e);
    return res.status(500).type("json").json({ ok: false, error: "email_probe_failed" });
  }
});

app.post("/api/affiliate/deeplink", rlAffiliateDeeplink, osgAffiliateSignatureGate, async (req, res) => {
  if (!osgConsumeInvolveDeeplinkBudget(res)) return;

  const b = req.body;
  if (!b || typeof b !== "object") {
    return res.status(400).type("json").json({ error: "invalid_body" });
  }

  const partner = String(b.partner || "").trim().slice(0, 48);
  const url = String(b.url || "").trim().slice(0, 2000);
  const affSub2 = String(b.osgCid || b.osg_cid || "").trim().slice(0, 96);
  const affSub3 = String(b.osgLid || b.osg_lid || "").trim().slice(0, 96);
  const appId = String(
    b.appId || req.osgAffiliateAppId || "pauli_best_price_thailand"
  )
    .trim()
    .slice(0, 96);

  if (!partner || !url) {
    return res.status(400).type("json").json({ error: "invalid_request" });
  }

  try {
    const result = await generateInvolveDeeplink({
      partner,
      url,
      affSub2,
      affSub3,
      appId,
      channel: String(b.channel || b.osg_ch || "marketplace").trim().slice(0, 48),
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
    if (code === "finance_module_excluded" || code === "retail_api_scope_required") {
      return res.status(403).type("json").json({ error: code });
    }
    console.error("[affiliate/deeplink]", e);
    return osgSafeUpstreamError(res);
  }
});

/** Referrer edges: `{ parentRef, childCid, claimedAt }` append-only audit file. */
const REFERRAL_FILE = path.join(DATA_DIR, "referral_edges.jsonl");
const REFERRAL_PARENT_META = path.join(DATA_DIR, "referral_parent_meta.json");

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

// ─────────────────────────────────────────────────────────────────────────────
// Pauli-ID System: sequential human-readable installation IDs
// ─────────────────────────────────────────────────────────────────────────────
const PAULI_ID_COUNTER_FILE = path.join(DATA_DIR, "pauli_id_counter.json");
const PAULI_ID_REGISTRY_FILE = path.join(DATA_DIR, "pauli_id_registry.jsonl");

function pauliIdReadCounter() {
  try {
    if (!fs.existsSync(PAULI_ID_COUNTER_FILE)) return 1_000_000;
    return JSON.parse(fs.readFileSync(PAULI_ID_COUNTER_FILE, "utf8")).counter || 1_000_000;
  } catch (_) { return 1_000_000; }
}

function pauliIdWriteCounter(n) {
  fs.mkdirSync(path.dirname(PAULI_ID_COUNTER_FILE), { recursive: true });
  fs.writeFileSync(PAULI_ID_COUNTER_FILE, JSON.stringify({ counter: n }));
}

/** Format a counter integer as "1 M 000 001" or "1 T 000 000" */
function pauliIdFormat(n) {
  const pad3 = (x) => String(Math.max(0, Math.floor(x))).padStart(3, "0");
  if (n <= 1_999_999) {
    const offset = n - 1_000_000;
    return `1 M ${pad3(Math.floor(offset / 1000))} ${pad3(offset % 1000)}`;
  }
  const offset = n - 2_000_000;
  return `1 T ${pad3(Math.floor(offset / 1000))} ${pad3(offset % 1000)}`;
}

/** Parse a display ID back to the raw integer (for validation). */
function pauliIdParse(display) {
  const s = String(display || "").replace(/\s+/g, " ").trim().toUpperCase();
  const m = s.match(/^(\d)\s*([MT])\s*(\d{3})\s*(\d{3})$/);
  if (!m) return null;
  const [, prefix, letter, thousands, units] = m;
  const offset = parseInt(thousands, 10) * 1000 + parseInt(units, 10);
  const base = letter === "M" ? 1_000_000 : 2_000_000;
  return base + offset + (parseInt(prefix, 10) - 1) * 1_000_000;
}

function pauliIdLookupByCid(cid) {
  try {
    if (!fs.existsSync(PAULI_ID_REGISTRY_FILE)) return null;
    const lines = fs.readFileSync(PAULI_ID_REGISTRY_FILE, "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line);
        if (rec.cid === cid) return rec;
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

function pauliIdLookupByDisplayId(displayId) {
  try {
    if (!fs.existsSync(PAULI_ID_REGISTRY_FILE)) return null;
    const norm = String(displayId || "").replace(/\s+/g, " ").trim().toUpperCase();
    const lines = fs.readFileSync(PAULI_ID_REGISTRY_FILE, "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line);
        if (rec.pauliId === norm) return rec;
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

const rlPauliId = osgRateLimit({ windowMs: 60_000, max: 8, envMax: "OSG_RL_PAULI_ID_MAX" });

/** Assign a new sequential Pauli-ID to a client device (idempotent). */
app.post("/api/pauli-id/register", rlPauliId, (req, res) => {
  try {
    const cid = String((req.body || {}).cid || "").trim().slice(0, 80);
    if (!cid) return res.status(400).json({ ok: false, error: "missing_cid" });
    // Idempotent: if already registered, return existing ID
    const existing = pauliIdLookupByCid(cid);
    if (existing) return res.json({ ok: true, pauliId: existing.pauliId, new: false });
    // Assign next counter
    const counter = pauliIdReadCounter() + 1;
    pauliIdWriteCounter(counter);
    const pauliId = pauliIdFormat(counter);
    const record = { cid, pauliId, counter, installedAt: new Date().toISOString(), referredBy: null };
    fs.mkdirSync(path.dirname(PAULI_ID_REGISTRY_FILE), { recursive: true });
    fs.appendFileSync(PAULI_ID_REGISTRY_FILE, JSON.stringify(record) + "\n");
    return res.json({ ok: true, pauliId, new: true });
  } catch (e) {
    console.error("[pauli-id/register]", e);
    res.status(500).json({ ok: false, error: "register_failed" });
  }
});

/** Link a new install to a referrer (one-time, first-write-wins). */
app.post("/api/pauli-id/set-referrer", rlPauliId, (req, res) => {
  try {
    const cid = String((req.body || {}).cid || "").trim().slice(0, 80);
    const referrerRaw = String((req.body || {}).referrerPauliId || "").trim().slice(0, 20);
    if (!cid || !referrerRaw) return res.status(400).json({ ok: false, error: "missing_fields" });
    // Validate referrer format
    if (!pauliIdParse(referrerRaw)) return res.status(400).json({ ok: false, error: "invalid_referrer_id" });
    const referrerNorm = referrerRaw.replace(/\s+/g, " ").trim().toUpperCase();
    // Check referrer exists
    const referrerRec = pauliIdLookupByDisplayId(referrerNorm);
    if (!referrerRec) return res.status(404).json({ ok: false, error: "referrer_not_found" });
    // Find own record and update only if not yet linked
    if (!fs.existsSync(PAULI_ID_REGISTRY_FILE)) return res.status(404).json({ ok: false, error: "not_registered" });
    const lines = fs.readFileSync(PAULI_ID_REGISTRY_FILE, "utf8").split("\n");
    let found = false;
    const updated = lines.map((line) => {
      if (!line.trim()) return line;
      try {
        const rec = JSON.parse(line);
        if (rec.cid === cid) {
          found = true;
          if (rec.referredBy) return line; // already set
          return JSON.stringify({ ...rec, referredBy: referrerNorm });
        }
      } catch (_) {}
      return line;
    });
    if (!found) return res.status(404).json({ ok: false, error: "not_registered" });
    fs.writeFileSync(PAULI_ID_REGISTRY_FILE, updated.join("\n"));
    return res.json({ ok: true });
  } catch (e) {
    console.error("[pauli-id/set-referrer]", e);
    res.status(500).json({ ok: false, error: "set_referrer_failed" });
  }
});

/** Record a revenue event for Umsatz-Bonus calculation. */
const PAULI_ID_REVENUE_FILE = path.join(DATA_DIR, "pauli_id_revenue.jsonl");
const rlPauliIdRevenue = osgRateLimit({ windowMs: 60_000, max: 30, envMax: "OSG_RL_PAULI_ID_REV_MAX" });

app.post("/api/pauli-id/revenue-event", rlPauliIdRevenue, (req, res) => {
  try {
    const b = req.body || {};
    const pauliId = String(b.pauliId || "").trim().slice(0, 20);
    const amountThb = Number(b.amountThb) || 0;
    const type = String(b.type || "purchase").slice(0, 32);
    if (!pauliId || !pauliIdParse(pauliId)) return res.status(400).json({ ok: false, error: "invalid_pauli_id" });
    if (amountThb <= 0) return res.status(400).json({ ok: false, error: "invalid_amount" });
    fs.mkdirSync(path.dirname(PAULI_ID_REVENUE_FILE), { recursive: true });
    fs.appendFileSync(PAULI_ID_REVENUE_FILE, JSON.stringify({ pauliId: pauliId.toUpperCase(), amountThb, type, ts: Date.now() }) + "\n");
    res.json({ ok: true });
  } catch (e) {
    console.error("[pauli-id/revenue-event]", e);
    res.status(500).json({ ok: false, error: "revenue_event_failed" });
  }
});

/** Admin ranking: top referrers (Werber-Bonus) + top revenue (Umsatz-Bonus). */
app.get("/api/pauli-id/ranking", rlVipStats, (req, res) => {
  try {
    // Require valid VIP code with canViewAllStats or slot 55/56
    const code = String(req.query.code || "").trim().slice(0, 64);
    const profile = vipProfileForCode(code);
    if (!profile) return res.status(403).json({ ok: false, error: "invalid_code" });
    if (!profile.canViewAllStats && profile.slot !== 55 && profile.slot !== 56) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    // Build referral map: referrerPauliId → count
    const referralCounts = {};
    if (fs.existsSync(PAULI_ID_REGISTRY_FILE)) {
      const lines = fs.readFileSync(PAULI_ID_REGISTRY_FILE, "utf8").split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const rec = JSON.parse(line);
          if (rec.referredBy) {
            referralCounts[rec.referredBy] = (referralCounts[rec.referredBy] || 0) + 1;
          }
        } catch (_) {}
      }
    }

    // Build revenue map: pauliId → total THB
    const revenueTotals = {};
    if (fs.existsSync(PAULI_ID_REVENUE_FILE)) {
      const lines = fs.readFileSync(PAULI_ID_REVENUE_FILE, "utf8").split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const rec = JSON.parse(line);
          if (rec.pauliId && rec.amountThb > 0) {
            revenueTotals[rec.pauliId] = (revenueTotals[rec.pauliId] || 0) + rec.amountThb;
          }
        } catch (_) {}
      }
    }

    // Sort and top-N
    const topReferrers = Object.entries(referralCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([pauliId, count]) => ({ pauliId, referredCount: count }));

    const topRevenue = Object.entries(revenueTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([pauliId, totalThb]) => ({ pauliId, totalThb: Number(totalThb.toFixed(2)) }));

    // Total installs
    let totalInstalls = 0;
    let currentCounter = pauliIdReadCounter();
    if (currentCounter > 1_000_000) totalInstalls = currentCounter - 1_000_000;

    res.json({
      ok: true,
      totalInstalls,
      currentCounter,
      topReferrers,
      topRevenue,
    });
  } catch (e) {
    console.error("[pauli-id/ranking]", e);
    res.status(500).json({ ok: false, error: "ranking_failed" });
  }
});

app.post("/api/avatar/status", rlRefStatus, (req, res) => {
  try {
    const payload = avatarStatusPayload(DATA_DIR, req.body || {});
    res.type("json").json(payload);
  } catch (e) {
    console.error("[avatar-status]", e);
    res.status(500).json({ error: "avatar_status_failed" });
  }
});

app.post("/api/avatar/referral/claim", rlRefClaim, (req, res) => {
  try {
    const out = validateReferralClaim(DATA_DIR, req.body || {});
    res.type("json").json(out);
  } catch (e) {
    console.error("[avatar-referral-claim]", e);
    res.status(500).json({ error: "avatar_referral_claim_failed" });
  }
});

app.post("/api/avatar/social-verify", rlRefReg, (req, res) => {
  try {
    const out = registerSocialExempt(DATA_DIR, req.body || {});
    if (!out.ok) return res.status(400).json(out);
    res.type("json").json(out);
  } catch (e) {
    console.error("[avatar-social-verify]", e);
    res.status(500).json({ error: "avatar_social_verify_failed" });
  }
});

const VIP_CODES_PATH = path.join(DATA_DIR, "vip_codes.json");
const VIP_EVENTS_FILE = path.join(DATA_DIR, "vip_events.jsonl");
const VIP_ONLINE_FILE = path.join(DATA_DIR, "vip_online.json");
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
      base.commissionPerPurchaseThb = 1;
    } else if (slot >= 41 && slot <= 50) {
      base.role = "vip_influencer";
      base.commissionPerPurchaseThb = 5;
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

/** Geschenk-THB beim VIP-Scan: 59 THB je Einladungs-/Zugangseinheit (Slots 1–30, Familie, Wii/Pauli). */
function vipGiftFromProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  const cascade = Number(profile.inviteCascadePerFriend || 0);
  const free = Number(profile.inviteFreeCount || 0);
  const units = cascade > 0 ? cascade : free;
  if (units <= 0) return null;
  const giftThb = units * 59;
  const slot = Number(profile.slot || 0);
  const out = {
    giftThb,
    giftUnits: units,
    slot,
    role: String(profile.role || "").trim(),
    giftSenderLabel: String(profile.label || "").trim(),
  };
  if (slot === 55) {
    out.giftSenderDisplay = "Wii";
    out.giftSenderAlt = "Chatchadapha";
  } else if (slot === 56) {
    out.giftSenderDisplay = "Pauli";
  } else if (slot >= 51 && slot <= 54) {
    const lbl = out.giftSenderLabel;
    const generic = `VIP-${String(slot).padStart(2, "0")}`;
    if (lbl && lbl.toUpperCase() !== generic) {
      out.giftSenderDisplay = lbl;
    }
  }
  return out;
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
      const gift = vipGiftFromProfile(profile);
      return res.status(200).type("json").json({
        ok: true,
        profile,
        gift: gift || null,
      });
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
        emailSystem: getEmailSystemStatus(),
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
        emailSystem: getEmailSystemStatus(),
      };
    }
    if (isOwnerOpsSlot(profile.slot)) {
      payload.emailSystem = getEmailSystemStatus();
      payload.appEmailRegistry = verifyAppEmailRegistry();
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

const AUTOSERVICE_FILE = path.join(DATA_DIR, "autoservice_bookings.jsonl");

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
    const lang = String(req.body?.lang || "de").slice(0, 12);
    const isNight = req.body?.isNight === true;
    const rawMsgs = Array.isArray(req.body?.messages) ? req.body.messages : [];

    // Allow 'system' role for interrupt-context hints injected by the client (max 2).
    let _sysMsgCount = 0;
    const sanitized = rawMsgs
      .slice(-14)
      .map((m) => {
        let role = "user";
        if (m && m.role === "assistant") role = "assistant";
        else if (m && m.role === "system" && _sysMsgCount < 2) { role = "system"; _sysMsgCount++; }
        return { role, content: String(m && m.content != null ? m.content : "").slice(0, 2400) };
      })
      .filter((m) => m.content.trim());

    const lastUser = [...sanitized].reverse().find((m) => m.role === "user");
    if (lastUser) {
      const intentHit = intentClassifier.classify(lastUser.content, lang);
      if (intentHit && !intentHit.allowOpenAI) {
        return res.type("json").json({
          reply: "",
          intent: intentHit.intent,
          allowOpenAI: false,
          speechKey: intentHit.speechKey,
          packKey: intentHit.packKey,
          segmentKey: intentHit.segmentKey,
          local: true,
        });
      }
    }

    if (!osgConsumeAiBudget(res, 1)) return;

    const nightHint = isNight
      ? "NIGHT MODE: Respond in a softer, quieter, more intimate register — shorter sentences, warmer hush-level tone, as if sitting beside the user in a quiet room. Keep sharp insight but with hushed intensity. Avoid loud exclamations."
      : "DAYTIME MODE: Normal, engaged conversational energy.";

    const system = [
      // Identity
      "You are Pauli, a warm, sharp male companion avatar for PAULI BEST PRICE Thailand (Omni Solutions Global® Co. Ltd.).",
      "Personality: honest, emotionally measured — mirror of Dr. Paul-J. Rockus. Not a yes-man: you may disagree respectfully when the user is rude or clearly wrong. Stay professional, never cruel.",
      // Time
      nightHint,
      // Socratic / Inception method
      "CORE SELLING METHOD — Socratic Inception: Never push a product. Guide the user with questions until THEY voice the conclusion themselves. They must feel they discovered the solution — not that they were sold to. Ask at least ONE reflective question before any product mention.",
      // Customer profiling
      "CUSTOMER PROFILING — detect knowledge level from first 2 exchanges and adapt: EXPERT signals (technical terms like LTV, Effektivzins, Garantiezeit, policy number, OCPB, cashback cap): briefly validate expertise, then ask ONE nuanced follow-up they haven't considered yet. Be their thinking partner, not their teacher. INEXPERIENCED signals (vague terms like 'das Versicherungsding', 'irgendwas mit Kredit'): lead with a vivid everyday METAPHOR before any product detail (e.g. 'Stell dir vor, deine Versicherung ist ein Schirm — halbaufgespannt wirst du trotzdem nass'). Make them feel clever AFTER your explanation. Never condescend.",
      // 5-Industry Socratic scripts
      "IMMOBILIEN / REAL ESTATE — Socratic path: (1) Ask location priority ('Was ist dir wichtiger — kurzer Arbeitsweg oder guenstigerer Quadratmeterpreis?'). (2) Ask budget comfort zone. (3) Frame rent-vs-buy as a values question ('Bedeutet Sicherheit fuer dich — Eigentum oder flexible Mobilitaet?'). Never recommend a specific property; help them articulate must-haves first.",
      "AUTO / AUTOMOTIVE — Socratic path: (1) Ask usage ('Faehrst du Stadtverkehr oder Autobahn?'). (2) Frame new-vs-used as a tradeoff question ('Lieber wissen was drin steckt — oder mit Budget mehr Ausstattung?'). (3) Financing vs. cash: ask what monthly comfort feels like. Never recommend a brand — let them name their shortlist.",
      "VERSICHERUNGEN / INSURANCE — Socratic path: (1) Ask what feels most unprotected right now. (2) Surface coverage gaps with consequence framing: 'Wenn X passiert und du keine Y-Absicherung hast — was waere das Schlimmste?' Let them FEEL the risk. (3) Only then mention options in the app. Never pitch first.",
      "BANKEN / BANKING — Socratic path: (1) Find the pain point (bad rate? wrong account? low savings return?). (2) Ask them to state their current rate/fee — make them say the number. (3) Respond: 'Und weisst du, was der Marktdurchschnitt gerade bietet?' — pause. This triggers self-comparison. Never push a specific bank.",
      "KREDITKARTEN / CREDIT CARDS — Socratic path: (1) Ask spending habit ('Zahlst du monatlich vollstaendig ab oder Teilzahlung?'). (2a) If revolving: surface cost gently ('Bei 20% p.a. kosten 1.000 Baht Restschuld monatlich ~17 Baht extra — weisst du das?'). (2b) If full monthly: pivot to cashback/miles value. (3) Ask top spend category to match the best card. They choose; you inform.",
      // Active listening
      "Active listening: open with brief natural acknowledgments (Mhm, Ah okay) when the user shares something personal; vary wording each turn.",
      // Detective mode
      "DETECTIVE MODE (strict): NEVER say you are sorry, cannot help, or do not understand. BANNED phrases: 'Tut mir leid', 'Entschuldigung', 'Ich kann nicht', 'Verstehe ich nicht', 'I don't understand', 'Sorry', 'I can't'.",
      "If unclear: ask a sharp hypothesis question ('Meinst du X oder Y?') — never shrug.",
      "If ~80% sure what they need: propose action with safety check ('Ich lege das mal so an, okay?') — wait for confirmation.",
      "If wrong: admit openly WITHOUT apology ('Da bin ich falsch abgebogen, lass uns das korrigieren.') — never 'sorry'.",
      // Compliance
      "RECLAMATION COMPLIANCE (strict): You are NEVER a lawyer or legal representative. You are ONLY a communication assistant (Wegweiser) — never legal advice.",
      "Complaint drafts: firm, factual, polite — no insults, no threats; state facts and statutory deadlines only.",
      "DRAFT OWNERSHIP (strict): Pauli NEVER sends messages to merchants. Generate drafts only; user must explicitly confirm before pasting in Lazada/Shopee in-app chat.",
      "AI TRANSPARENCY: You are an AI and may err. For legal/finance/reclamation topics, remind users to verify drafts against proof of purchase.",
      // Background analysis
      "Small talk: home, work, stress, dreams, purchases — listen first; one gentle follow-up when helpful.",
      "Background need analysis: infer future plans (moving, car, phone, insurance, credit, renovation) from conversation. When a need emerges, guide unobtrusively to app areas — never pushy, never invent prices or binding terms.",
      // Format
      "Spoken style: 2-5 short sentences. No legal, tax, investment, insurance, or real-estate advice.",
      // Politics & Religion
      "STRICT BLOCK — politics & religion: Never discuss or take sides. If raised: warmly deflect — pivot to life's positives and ask what is next on their wish list.",
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

/** Pauli-Stimme: ausschließlich ELEVENLABS_VOICE_ID — kein Name-Hint, kein Katalog-Fallback. */
let resolvedVoiceId = (process.env.ELEVENLABS_VOICE_ID || "").trim() || null;

async function resolveVoiceId(_apiKey) {
  const id = (process.env.ELEVENLABS_VOICE_ID || "").trim();
  if (!id) {
    resolvedVoiceId = null;
    console.warn(
      "[tts] ELEVENLABS_VOICE_ID fehlt — Cloud-TTS deaktiviert bis Dashboard gesetzt.",
    );
    return null;
  }
  resolvedVoiceId = id;
  return resolvedVoiceId;
}

async function osgOpenAiTtsMp3(text, whisper) {
  const key = process.env.OPENAI_API_KEY || process.env.PAULI_OPENAI_API_KEY;
  if (!key) throw new Error("openai_tts_unavailable");
  const voice = String(process.env.OPENAI_TTS_VOICE || "onyx").slice(0, 32);
  const model = String(process.env.OPENAI_TTS_MODEL || "tts-1").slice(0, 32);
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: "mp3",
      speed: whisper ? 0.92 : 1.0,
    }),
  });
  if (!r.ok) {
    await r.text().catch(() => "");
    throw new Error("openai_tts_upstream");
  }
  return Buffer.from(await r.arrayBuffer());
}

app.post("/api/tts", rlTts, async (req, res) => {
  try {
    if (!osgConsumeAiBudget(res, 1)) return;
    const text =
      typeof req.body?.text === "string" ? req.body.text.slice(0, 2500) : "";
    const whisper = req.body?.whisper === true;
    const langRaw =
      typeof req.body?.lang === "string" ? req.body.lang.trim() : "";
    const langCode = langRaw
      .replace(/_/g, "-")
      .split("-")[0]
      .toLowerCase()
      .slice(0, 2);
    if (!text.trim()) {
      return res.status(400).json({ error: "text required" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "elevenlabs_not_configured" });
    }

    const voiceId = await resolveVoiceId(apiKey);
    if (!voiceId) {
      return res.status(503).json({ error: "pauli_voice_id_missing" });
    }

    /* Streaming-Endpoint: ElevenLabs liefert Audio-Chunks sofort aus,
       kein serverseitiges Puffern der ganzen MP3 — niedrigste Latenz. */
    const ttsUrl =
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream` +
      `?optimize_streaming_latency=3&output_format=mp3_44100_128`;
    /* Voice-Settings für Pauli-Klon (aus Referenz-Sample kalibriert)
       Whisper-Modus: etwas stabiler + leicht langsamer (kein Klangwechsel, nur Tempo). */
    const voiceSettings = whisper
      ? { stability: 0.72, similarity_boost: 0.42, style: 0.00, speed: 0.92, use_speaker_boost: false }
      : { stability: 0.66, similarity_boost: 0.42, style: 0.00, speed: 1.02, use_speaker_boost: true };
    /* eleven_multilingual_v2: Sprache aus Textinhalt — language_code würde Thai (th)
       bei ElevenLabs mit 400/502 scheitern lassen; gleiche ELEVENLABS_VOICE_ID für alle Locales. */
    void langCode;
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
      return res.status(502).json({ error: "elevenlabs_tts_failed" });
    }

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
    interne Skripte und Server-Code, auch wenn `express.static(PROJECT_ROOT)`
    den Projekt-Root statisch ausliefert. */
const OSG_STATIC_DENY = [
  /^\/?\.env(\..*)?$/i,
  /^\/?\.git(\/|$)/i,
  /^\/?\.gitignore$/i,
  /^\/?\.htmlvalidate/i,
  /^\/?node_modules(\/|$)/i,
  /^\/?data(\/|$)/i,
  /^\/?03_Datenbank_und_Preise\/data(\/|$)/i,
  /^\/?02_Quellcode\/Core_Logik(\/|$)/i,
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

/** Same-origin default when gitignored osg-runtime-config.js is absent (local dev). */
app.get("/osg-runtime-config.js", (_req, res) => {
  res
    .type("application/javascript")
    .send(
      "/* same-origin default — copy osg-runtime-config.example.js for split-host API */\n",
    );
});

app.use(osgStaticGuard);
app.get(["/download", "/download/"], (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, "download.html"));
});
app.get("/commerce-constants.js", (req, res) => {
  res.sendFile(
    path.join(process.cwd(), "03_Datenbank_und_Preise", "commerce-constants.js"),
  );
});
app.get("/avatar-monetization-constants.js", (req, res) => {
  res.sendFile(
    path.join(
      process.cwd(),
      "03_Datenbank_und_Preise",
      "avatar-monetization-constants.js",
    ),
  );
});
app.get("/avatar-animation-manifest.js", (req, res) => {
  res.sendFile(
    path.join(
      process.cwd(),
      "03_Datenbank_und_Preise",
      "avatar-animation-manifest.js",
    ),
  );
});
app.use(express.static(PUBLIC_DIR));
app.use(express.static(PROJECT_ROOT, { dotfiles: "deny", index: ["index.html"] }));

const CERT_KEY_PATH = path.join(CERTS_DIR, "localhost-key.pem");
const CERT_PATH = path.join(CERTS_DIR, "localhost.pem");

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
  validateAffiliateApi("pauli_best_price_thailand")
    .then((aff) => {
      console.log("[affiliate-check]", aff.label, {
        affiliateId: aff.affiliateId,
        reason: aff.reason,
      });
    })
    .catch((e) => {
      console.error("[affiliate-check] startup failed:", e && e.message);
    });
  runEmailConnectivityProbe()
    .then((probe) => {
      const st = probe.status || getEmailSystemStatus();
      console.log("[email-probe]", st.label || st.level, {
        smtpHost: probe.smtp && probe.smtp.host,
        smtp: probe.smtp && probe.smtp.tcp,
        imap: probe.imap && probe.imap.tcp,
        auth: probe.smtp && probe.smtp.auth,
        echoTest: probe.echoTest,
      });
    })
    .catch((e) => {
      console.error("[email-probe] startup failed:", e && e.message);
      setEmailCritical("startup_probe_failed", { message: String(e && e.message) });
    });
});
