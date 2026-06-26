/**
 * OSG Content-Security-Policy — shared builder (Node / Report-Only P1)
 * Browser mirror: assets/scripts/osg_csp_config.js
 */

export function buildReportOnlyPolicy(opts = {}) {
  const apiOrigin = String(opts.apiOrigin || "'self'").trim();
  const reportUri = opts.reportUri ? ` report-uri ${opts.reportUri}` : "";
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

export function buildEnforcementPolicy(opts = {}) {
  const nonce = opts.nonce ? ` 'nonce-${opts.nonce}'` : "";
  const apiOrigin = String(opts.apiOrigin || "'self'").trim();
  return [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "script-src 'self'" + nonce + " https://xhr.invl.co https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' " + apiOrigin + " https: wss:",
    "worker-src 'self'",
    "manifest-src 'self'",
  ].join("; ");
}
