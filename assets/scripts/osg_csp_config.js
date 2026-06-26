// CRITICAL: DO NOT HARDCODE LANGUAGES. ALWAYS USE GLOBAL I18N SYSTEM. PARSE ABBREVIATIONS VIA PAULI-METHOD ONLY.
/**
 * OSG Content-Security-Policy — Report-Only builder (P1 Security)
 *
 * Enforcement is intentionally deferred until inline scripts are nonce-tagged.
 * Enable via OSG_CSP_REPORT_ONLY=1 on the Node server.
 */
(function (global) {
  "use strict";

  function buildReportOnlyPolicy(opts) {
    opts = opts || {};
    var apiOrigin = String(opts.apiOrigin || "'self'").trim();
    var reportUri = opts.reportUri ? " report-uri " + opts.reportUri : "";
    return [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://xhr.invl.co https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' " + apiOrigin + " https: wss:",
      "worker-src 'self'",
      "manifest-src 'self'",
    ].join("; ") + reportUri;
  }

  function buildEnforcementPolicy(opts) {
    opts = opts || {};
    var nonce = opts.nonce ? " 'nonce-" + opts.nonce + "'" : "";
    var apiOrigin = String(opts.apiOrigin || "'self'").trim();
    return [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self'" + nonce,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' " + apiOrigin + " https: wss:",
      "worker-src 'self'",
      "manifest-src 'self'",
    ].join("; ");
  }

  global.OSG_CSP_CONFIG = {
    buildReportOnlyPolicy: buildReportOnlyPolicy,
    buildEnforcementPolicy: buildEnforcementPolicy,
  };
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
