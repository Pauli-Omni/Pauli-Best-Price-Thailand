import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "03_Datenbank_und_Preise", "data");
const SEQ_FILE = path.join(DATA_DIR, "support-ticket-seq.json");
const TICKETS_FILE = path.join(DATA_DIR, "support-tickets.jsonl");

export const OSG_SUPPORT_APP_ID = "pauli_best_price_thailand";
export const OSG_SUPPORT_APP_DISPLAY = "Pauli Best Price Thailand";
export const OSG_SUPPORT_EMAIL =
  (process.env.OSG_SUPPORT_EMAIL || "support@omnisolutionsglobal.com").trim();

const TICKET_START = Math.max(
  10001,
  Number(process.env.OSG_SUPPORT_TICKET_START || 10001) || 10001,
);

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readSeq() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(SEQ_FILE, "utf8");
    const o = JSON.parse(raw);
    const n = Number(o?.last);
    if (Number.isFinite(n) && n >= TICKET_START - 1) return Math.floor(n);
  } catch {
    /* first run */
  }
  return TICKET_START - 1;
}

function writeSeq(last) {
  ensureDataDir();
  fs.writeFileSync(SEQ_FILE, JSON.stringify({ last, updatedAt: new Date().toISOString() }), "utf8");
}

/**
 * @returns {string} Five-digit ticket number as string, e.g. "10001"
 */
export function allocateSupportTicketNumber() {
  const last = readSeq();
  const next = last + 1;
  if (next > 99999) throw new Error("support_ticket_exhausted");
  writeSeq(next);
  return String(next);
}

export function formatTicketRef(num) {
  return `PBPT-${String(num).padStart(5, "0")}`;
}

export function buildSupportMailSubject(ticketRef) {
  return `[${ticketRef}] ${OSG_SUPPORT_APP_DISPLAY}`;
}

/**
 * @param {object} row
 */
export function appendSupportTicket(row) {
  ensureDataDir();
  const line = JSON.stringify(row) + "\n";
  fs.appendFileSync(TICKETS_FILE, line, "utf8");
}

/**
 * @param {{
 *   email: string,
 *   message: string,
 *   customerId?: string,
 *   locale?: string,
 *   channel?: string,
 *   userAgent?: string,
 * }} input
 */
export function createSupportTicket(input) {
  const email = String(input.email || "").trim().slice(0, 254);
  const message = String(input.message || "").trim().slice(0, 8000);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error("invalid_email");
    err.code = "invalid_email";
    throw err;
  }
  if (message.length < 8) {
    const err = new Error("message_too_short");
    err.code = "message_too_short";
    throw err;
  }

  const ticketNum = allocateSupportTicketNumber();
  const ticketRef = formatTicketRef(ticketNum);
  const subject = buildSupportMailSubject(ticketRef);
  const stamp = new Date().toISOString();

  const row = {
    ticketRef,
    ticketNum,
    appId: OSG_SUPPORT_APP_ID,
    appDisplay: OSG_SUPPORT_APP_DISPLAY,
    email,
    message,
    customerId: String(input.customerId || "").slice(0, 120),
    locale: String(input.locale || "").slice(0, 12),
    channel: String(input.channel || "web").slice(0, 48),
    userAgent: String(input.userAgent || "").slice(0, 400),
    supportEmail: OSG_SUPPORT_EMAIL,
    subject,
    status: "open",
    createdAt: stamp,
  };

  appendSupportTicket(row);

  const bodyLines = [
    `App: ${OSG_SUPPORT_APP_DISPLAY}`,
    `App-ID: ${OSG_SUPPORT_APP_ID}`,
    `Ticket: ${ticketRef}`,
    `Customer-ID: ${row.customerId || "(none)"}`,
    `Channel: ${row.channel}`,
    `Locale: ${row.locale || "(unknown)"}`,
    "",
    "--- Your message ---",
    message,
    "",
    "--- Important ---",
    "Please do not change the email subject line when you reply.",
    "Always keep the ticket number in the subject so we can help you faster.",
  ];

  return {
    ...row,
    mailto: `mailto:${encodeURIComponent(OSG_SUPPORT_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`,
  };
}
