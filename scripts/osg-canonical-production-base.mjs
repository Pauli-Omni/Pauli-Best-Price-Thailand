/**
 * Kanonische Pauli-Produktions-URL (Render Service: pauli-best-price-api).
 * NICHT verwechseln mit Legacy-Service omni-solutions-global (pauli-best-price-api.onrender.com).
 *
 * Override: OSG_PRODUCTION_BASE in .env
 */
export const OSG_CANONICAL_PRODUCTION_BASE = String(
  process.env.OSG_PRODUCTION_BASE ||
    "https://pauli-best-price-api-nzbl.onrender.com",
).replace(/\/$/, "");

export const OSG_LEGACY_RENDER_HOST = "pauli-best-price-api.onrender.com";

export const OSG_CANONICAL_RENDER_SERVICE = "pauli-best-price-api";

export const OSG_LEGACY_RENDER_SERVICE = "omni-solutions-global";
