import dns from "dns/promises";
import fs from "fs";
import net from "net";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "03_Datenbank_und_Preise", "data");
const STATUS_FILE = path.join(DATA_DIR, "email-system-status.json");
const ECHO_LOG_FILE = path.join(DATA_DIR, "email-echo-protocol.jsonl");
const OUTBOX_DIR = path.join(DATA_DIR, "email-outbox");

export const OSG_INFO_EMAIL = String(
  process.env.OSG_INFO_EMAIL || "info@omnisolutionsglobal.com"
).trim();
export const OSG_SUPPORT_EMAIL = String(
  process.env.OSG_SUPPORT_EMAIL || "support@omnisolutionsglobal.com"
).trim();

export const OSG_APP_EMAIL_REGISTRY = [
  {
    appId: "pauli_best_price_thailand",
    display: "Pauli Best Price Thailand",
    supportEmail: OSG_SUPPORT_EMAIL,
    infoEmail: OSG_INFO_EMAIL,
  },
  {
    appId: "omniqr_ai_thailand",
    display: "OmniQR-AI for Tourist of Thailand",
    supportEmail: String(
      process.env.OMNI_SUPPORT_EMAIL || "support@omnisolutionsglobal.com"
    ).trim(),
    infoEmail: OSG_INFO_EMAIL,
  },
  {
    appId: "omnisolutionsglobal_web",
    display: "Omni Solutions Global Website",
    supportEmail: OSG_SUPPORT_EMAIL,
    infoEmail: OSG_INFO_EMAIL,
  },
];

const ECHO_EVENTS = new Set([
  "skill_learn_success",
  "respect_escalation",
  "connectivity_probe",
  "connectivity_probe_ok",
]);

export const PRIVATEEMAIL_MAIL_HOST = "mail.privateemail.com";
const OSG_MAIL_DOMAIN = "omnisolutionsglobal.com";

function isPrivateEmailHost(host) {
  return String(host || "")
    .toLowerCase()
    .includes("privateemail.com");
}

function isPrivateEmailMx(mxHosts) {
  return Array.isArray(mxHosts) && mxHosts.some((h) => isPrivateEmailHost(h));
}

/** Submission/IMAP host — never use MX records for privateemail.com. */
export function resolveMailHost({ explicitHost, mxHosts }) {
  const explicit = String(explicitHost || "").trim();
  if (explicit) {
    if (isPrivateEmailHost(explicit) && explicit.toLowerCase() !== PRIVATEEMAIL_MAIL_HOST) {
      return { host: PRIVATEEMAIL_MAIL_HOST, source: "privateemail_normalized" };
    }
    return { host: explicit, source: "env" };
  }
  if (isPrivateEmailMx(mxHosts)) {
    return { host: PRIVATEEMAIL_MAIL_HOST, source: "privateemail_mx_fallback" };
  }
  const mx = Array.isArray(mxHosts) ? String(mxHosts[0] || "").trim() : "";
  return { host: mx, source: mx ? "mx_fallback" : "none" };
}

export function isSmtpConfigured() {
  const cfg = smtpEnv();
  return !!(cfg.host && cfg.user && cfg.pass);
}

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(OUTBOX_DIR, { recursive: true });
}

function readStatus() {
  ensureDirs();
  try {
    const raw = fs.readFileSync(STATUS_FILE, "utf8");
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : defaultStatus();
  } catch (_) {
    return defaultStatus();
  }
}

function defaultStatus() {
  return {
    label: "E-Mail-Status: OK",
    level: "ok",
    critical: false,
    lastError: "",
    lastErrorAt: "",
    lastSuccessAt: "",
    lastProbeAt: "",
    updatedAt: new Date().toISOString(),
  };
}

function writeStatus(patch) {
  ensureDirs();
  const next = { ...readStatus(), ...patch, updatedAt: new Date().toISOString() };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function getEmailSystemStatus() {
  return readStatus();
}

export function setEmailCritical(error, detail) {
  const msg = String(error || "send_failed").slice(0, 400);
  return writeStatus({
    label: "E-Mail-Status: KRITISCH",
    level: "critical",
    critical: true,
    lastError: msg,
    lastErrorAt: new Date().toISOString(),
    lastDetail: detail && typeof detail === "object" ? detail : {},
  });
}

export function setEmailHealthy(detail) {
  return writeStatus({
    label: "E-Mail-Status: OK",
    level: "ok",
    critical: false,
    lastError: "",
    lastSuccessAt: new Date().toISOString(),
    lastDetail: detail && typeof detail === "object" ? detail : {},
  });
}

function tcpReachable(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const hostName = String(host || "").trim();
    if (!hostName) {
      resolve({ ok: false, error: "missing_host" });
      return;
    }
    const socket = net.connect({ host: hostName, port, timeout: timeoutMs });
    const done = (result) => {
      try {
        socket.destroy();
      } catch (_) {}
      resolve(result);
    };
    socket.once("connect", () => done({ ok: true, host: hostName, port }));
    socket.once("error", (err) =>
      done({ ok: false, host: hostName, port, error: String(err && err.message) })
    );
    socket.once("timeout", () =>
      done({ ok: false, host: hostName, port, error: "timeout" })
    );
  });
}

async function resolveMxHosts(domain) {
  try {
    const mx = await dns.resolveMx(domain);
    return (mx || [])
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .map((r) => r.exchange)
      .filter(Boolean);
  } catch (e) {
    return { error: String(e && e.message) };
  }
}

function smtpEnv() {
  return {
    host: String(process.env.OSG_SMTP_HOST || process.env.OMNI_SMTP_HOST || "").trim(),
    port: Number(process.env.OSG_SMTP_PORT || process.env.OMNI_SMTP_PORT || 587),
    user: String(process.env.OSG_SMTP_USER || process.env.OMNI_SMTP_USER || "").trim(),
    pass: String(process.env.OSG_SMTP_PASS || process.env.OMNI_SMTP_PASS || "").trim(),
    from: String(
      process.env.OSG_SMTP_FROM ||
        process.env.OMNI_SMTP_FROM ||
        process.env.OSG_SMTP_USER ||
        "noreply@omnisolutionsglobal.com"
    ).trim(),
  };
}

function imapEnv() {
  return {
    host: String(process.env.OSG_IMAP_HOST || process.env.OMNI_IMAP_HOST || "").trim(),
    port: Number(process.env.OSG_IMAP_PORT || process.env.OMNI_IMAP_PORT || 993),
  };
}

function buildSmtpConfig(mxHosts) {
  const env = smtpEnv();
  const resolved = resolveMailHost({ explicitHost: env.host, mxHosts });
  return {
    ...env,
    host: resolved.host,
    hostSource: resolved.source,
  };
}

function buildImapConfig(mxHosts, smtpHost) {
  const env = imapEnv();
  const explicit = env.host || smtpHost || "";
  const resolved = resolveMailHost({
    explicitHost: explicit,
    mxHosts,
  });
  const source =
    env.host
      ? resolved.source
      : smtpHost
        ? "smtp_host_inherited"
        : resolved.source;
  return {
    ...env,
    host: resolved.host,
    hostSource: source,
  };
}

async function resolveMxHostList() {
  const mx = await resolveMxHosts(OSG_MAIL_DOMAIN);
  return Array.isArray(mx) ? mx : [];
}

async function verifySmtpAuth(cfg) {
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return {
      configured: false,
      ok: false,
      reason: "smtp_not_configured",
      host: cfg.host || "",
      port: cfg.port || 587,
      hostSource: cfg.hostSource || "",
    };
  }
  let nodemailer;
  try {
    nodemailer = (await import("nodemailer")).default;
  } catch (_) {
    return { configured: true, ok: false, reason: "nodemailer_missing" };
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
  });
  try {
    await transporter.verify();
    return {
      configured: true,
      ok: true,
      host: cfg.host,
      port: cfg.port,
      hostSource: cfg.hostSource || "env",
      handshake: "verify_ok",
    };
  } catch (err) {
    const code = String(err && err.code) || "auth_or_timeout";
    return {
      configured: true,
      ok: false,
      reason: code,
      message: String(err && err.message).slice(0, 240),
      host: cfg.host,
      port: cfg.port,
      hostSource: cfg.hostSource || "env",
      handshake: "verify_failed",
    };
  }
}

function logConnectivityProbe(payload, status) {
  const row = {
    eventType: "connectivity_probe",
    stamp: payload.checkedAt || new Date().toISOString(),
    statusLabel: status.label || "",
    statusLevel: status.level || "",
    critical: !!status.critical,
    to: OSG_SUPPORT_EMAIL,
    smtp: {
      host: payload.smtp?.host,
      hostSource: payload.smtp?.hostSource,
      port: payload.smtp?.port,
      tcp: payload.smtp?.tcp,
      auth: payload.smtp?.auth,
    },
    imap: {
      host: payload.imap?.host,
      hostSource: payload.imap?.hostSource,
      port: payload.imap?.port,
      tcp: payload.imap?.tcp,
    },
    meta: {
      mx: payload.mx,
      mailboxes: payload.mailboxes,
      smtpConfigured: isSmtpConfigured(),
    },
  };
  appendEchoLog(row);
  return row;
}

async function sendConnectivityOkTestMail(payload) {
  const cfg = buildSmtpConfig(
    Array.isArray(payload.mx) ? payload.mx : await resolveMxHostList()
  );
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const stamp = new Date().toISOString();
  const subject = "[OSG-ECHO] connectivity_probe_ok — E-Mail-Status OK";
  const body = [
    "OSG E-Mail Connectivity — Echo-Test",
    "===================================",
    "",
    `Status: ${payload.status?.label || "E-Mail-Status: OK"}`,
    `SMTP-Host: ${cfg.host} (${cfg.hostSource || "env"})`,
    `Auth-Handshake: ${payload.smtp?.auth?.handshake || "verify_ok"}`,
    `Time: ${stamp}`,
    "",
    "Kurztest nach erfolgreicher Probe (npm run email:probe / Server-Start).",
  ].join("\n");

  appendEchoLog({
    eventType: "connectivity_probe_ok",
    stamp,
    to: OSG_INFO_EMAIL,
    subject,
    meta: {
      smtpHost: cfg.host,
      probeAt: payload.checkedAt,
    },
  });

  let nodemailer;
  try {
    nodemailer = (await import("nodemailer")).default;
  } catch (_) {
    return { sent: false, reason: "nodemailer_missing" };
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
  });

  try {
    await transporter.sendMail({
      from: cfg.from,
      to: OSG_INFO_EMAIL,
      replyTo: OSG_SUPPORT_EMAIL,
      subject,
      text: body,
    });
    return { sent: true, to: OSG_INFO_EMAIL, subject };
  } catch (err) {
    return {
      sent: false,
      reason: String(err && err.code) || "send_failed",
      message: String(err && err.message).slice(0, 240),
    };
  }
}

export async function runEmailConnectivityProbe() {
  const mxHosts = await resolveMxHostList();
  const smtpCfg = buildSmtpConfig(mxHosts);
  const imapCfg = buildImapConfig(mxHosts, smtpCfg.host);
  const smtpHost = smtpCfg.host;
  const imapHost = imapCfg.host;

  const smtpAuth = await verifySmtpAuth(smtpCfg);
  const [smtpTcp, imapTcp] = await Promise.all([
    smtpHost
      ? tcpReachable(smtpHost, smtpCfg.port || 587)
      : Promise.resolve({ ok: false, error: "no_smtp_host" }),
    imapHost
      ? tcpReachable(imapHost, imapCfg.port || 993)
      : Promise.resolve({ ok: false, error: "no_imap_host" }),
  ]);

  const apps = verifyAppEmailRegistry();
  const payload = {
    checkedAt: new Date().toISOString(),
    mailboxes: {
      info: OSG_INFO_EMAIL,
      support: OSG_SUPPORT_EMAIL,
    },
    mx: mxHosts,
    smtp: {
      host: smtpHost,
      hostSource: smtpCfg.hostSource,
      port: smtpCfg.port || 587,
      tcp: smtpTcp,
      auth: smtpAuth,
    },
    imap: {
      host: imapHost,
      hostSource: imapCfg.hostSource,
      port: imapCfg.port || 993,
      tcp: imapTcp,
    },
    apps,
    status: readStatus(),
  };

  const healthy = smtpAuth.ok && smtpTcp.ok && imapTcp.ok;
  const critical = !healthy;

  if (healthy) {
    setEmailHealthy(payload);
  } else {
    setEmailCritical(
      smtpAuth.message ||
        smtpAuth.reason ||
        smtpTcp.error ||
        imapTcp.error ||
        "probe_failed",
      payload
    );
  }

  payload.status = readStatus();
  writeStatus({ lastProbeAt: payload.checkedAt });

  const echoRow = logConnectivityProbe(payload, payload.status);
  payload.echoLog = { file: ECHO_LOG_FILE, row: echoRow };

  if (healthy) {
    payload.echoTest = await sendConnectivityOkTestMail(payload);
  } else {
    payload.echoTest = { sent: false, reason: "probe_not_ok" };
  }

  return payload;
}

export function verifyAppEmailRegistry() {
  const expected = "support@omnisolutionsglobal.com";
  return OSG_APP_EMAIL_REGISTRY.map((row) => ({
    appId: row.appId,
    display: row.display,
    supportEmail: row.supportEmail,
    infoEmail: row.infoEmail,
    supportOk: String(row.supportEmail || "").toLowerCase() === expected,
  }));
}

function appendEchoLog(row) {
  ensureDirs();
  fs.appendFileSync(ECHO_LOG_FILE, JSON.stringify(row) + "\n", "utf8");
}

function writeOutboxEcho(stamp, subject, body) {
  ensureDirs();
  const safe = stamp.replace(/[^0-9TZ-]/g, "");
  const file = path.join(OUTBOX_DIR, `echo-${safe}.txt`);
  fs.writeFileSync(
    file,
    `To: ${OSG_SUPPORT_EMAIL}\nSubject: ${subject}\n\n${body}`,
    "utf8"
  );
  return file;
}

function buildEchoBody(eventType, input) {
  const lines = [
    "OSG Echo-Protokoll",
    "==================",
    "",
    `Event: ${eventType}`,
    `App: ${input.appDisplay || input.appId || "unknown"}`,
    `App-ID: ${input.appId || ""}`,
    `Locale: ${input.locale || ""}`,
    `Customer-ID: ${input.customerId || ""}`,
    `Time: ${new Date().toISOString()}`,
    "",
    "--- Meta ---",
    JSON.stringify(input.meta || {}, null, 2),
  ];
  return lines.join("\n");
}

export async function sendEchoProtocol(input) {
  const eventType = String(input?.eventType || "").trim();
  if (!ECHO_EVENTS.has(eventType)) {
    const err = new Error("invalid_echo_event");
    err.code = "invalid_echo_event";
    throw err;
  }
  const appId = String(input?.appId || "pauli_best_price_thailand").slice(0, 96);
  const appRow =
    OSG_APP_EMAIL_REGISTRY.find((r) => r.appId === appId) ||
    OSG_APP_EMAIL_REGISTRY[0];
  const stamp = new Date().toISOString();
  const subject = `[OSG-ECHO] ${eventType} — ${appRow.display}`;
  const body = buildEchoBody(eventType, {
    ...input,
    appId: appRow.appId,
    appDisplay: appRow.display,
  });
  const row = {
    eventType,
    appId: appRow.appId,
    to: OSG_SUPPORT_EMAIL,
    subject,
    stamp,
    meta: input?.meta || {},
  };
  appendEchoLog(row);
  const outboxPath = writeOutboxEcho(stamp, subject, body);

  const mxHosts = await resolveMxHostList();
  const cfg = buildSmtpConfig(mxHosts);
  if (!cfg.host || !cfg.user || !cfg.pass) {
    setEmailCritical("smtp_not_configured", { eventType, outboxPath });
    return {
      queued: true,
      sent: false,
      reason: "smtp_not_configured",
      outboxPath,
      to: OSG_SUPPORT_EMAIL,
    };
  }

  let nodemailer;
  try {
    nodemailer = (await import("nodemailer")).default;
  } catch (_) {
    setEmailCritical("nodemailer_missing", { eventType, outboxPath });
    return {
      queued: true,
      sent: false,
      reason: "nodemailer_missing",
      outboxPath,
      to: OSG_SUPPORT_EMAIL,
    };
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
  });

  try {
    await transporter.sendMail({
      from: cfg.from,
      to: OSG_SUPPORT_EMAIL,
      replyTo: OSG_INFO_EMAIL,
      subject,
      text: body,
    });
    setEmailHealthy({ lastEcho: eventType, outboxPath });
    return { queued: false, sent: true, reason: "smtp", outboxPath, to: OSG_SUPPORT_EMAIL };
  } catch (err) {
    const reason = String(err && err.code) || "send_failed";
    const message = String(err && err.message).slice(0, 400);
    setEmailCritical(message || reason, { eventType, outboxPath, reason });
    return {
      queued: true,
      sent: false,
      reason,
      message,
      outboxPath,
      to: OSG_SUPPORT_EMAIL,
    };
  }
}

export function isOwnerOpsSlot(slot) {
  return slot === 55 || slot === 56;
}
