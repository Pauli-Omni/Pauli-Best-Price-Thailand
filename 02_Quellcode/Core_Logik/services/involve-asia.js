/**
 * Involve Asia Publisher API — token cache + deeplink generation.
 * @see https://api.involve.asia/
 */
import {
  OSG_AFFILIATE_ID,
  OSG_AFFILIATE_PUBLISHER,
  assertRetailApiScope,
  canUseAffiliateApi1085689,
  getPauliAffiliateModuleConfig,
  osgAffiliateAffSub,
  osgAffiliateSignHeaders,
  osgAffiliateStatusPayload,
  osgAffiliateVerifyRequestHeaders,
} from "./osg-affiliate-config.js";

const INVOLVE_API_BASE =
  (process.env.INVOLVE_ASIA_API_BASE || "https://api.involve.asia/api").replace(
    /\/$/,
    "",
  );

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** @type {{ token: string|null, expiresAt: number, validatedAt: string }} */
const tokenCache = { token: null, expiresAt: 0, validatedAt: "" };

/** @type {{ active: boolean, label: string, checkedAt: string, reason: string }} */
let affiliateRuntimeStatus = {
  active: false,
  label: "Affiliate-API: INACTIVE",
  checkedAt: "",
  reason: "not_checked",
};

const PARTNER_HOSTS = {
  lazada_th: /(^|\.)lazada\.co\.th$/i,
  shopee_th: /(^|\.)shopee\.co\.th$/i,
  bigc_th: /(^|\.)bigc\.co\.th$/i,
  lotus_th: /(^|\.)lotuss\.com$/i,
};

function involveConfigured() {
  return Boolean(
    process.env.INVOLVE_ASIA_API_KEY && process.env.INVOLVE_ASIA_API_SECRET,
  );
}

function offerIdForPartner(partner) {
  const map = {
    lazada_th: process.env.INVOLVE_ASIA_OFFER_LAZADA_TH,
    shopee_th: process.env.INVOLVE_ASIA_OFFER_SHOPEE_TH,
    bigc_th: process.env.INVOLVE_ASIA_OFFER_BIGC_TH,
    lotus_th: process.env.INVOLVE_ASIA_OFFER_LOTUS_TH,
  };
  const id = map[String(partner || "").trim()];
  return id && String(id).trim() ? String(id).trim() : "";
}

function makeErr(code, message) {
  const err = new Error(message || code);
  err.code = code;
  return err;
}

function sliceSub(value, max = 96) {
  const s = String(value || "").trim();
  return s ? s.slice(0, max) : "";
}

function validateLandingUrl(partner, rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || "").trim());
  } catch {
    throw makeErr("invalid_url", "Landing URL is not valid");
  }
  if (parsed.protocol !== "https:") {
    throw makeErr("invalid_url", "Landing URL must use HTTPS");
  }
  const hostRe = PARTNER_HOSTS[partner];
  if (!hostRe) throw makeErr("invalid_partner", "Unknown marketplace partner");
  if (!hostRe.test(parsed.hostname)) {
    throw makeErr("invalid_url", "Landing URL host does not match partner");
  }
  return parsed.href;
}

function involveSignHeaders(appId) {
  return {
    ...osgAffiliateSignHeaders(appId),
    "X-OSG-Affiliate-Channel": "involve_asia",
  };
}

async function involveApiPost(path, { token, form, appId } = {}) {
  const headers = {
    Accept: "application/json",
    ...involveSignHeaders(appId || "pauli_best_price_thailand"),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const body =
    form instanceof URLSearchParams ? form.toString() : undefined;
  if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";

  const resp = await fetch(`${INVOLVE_API_BASE}${path}`, {
    method: "POST",
    headers,
    body,
  });

  let json;
  try {
    json = await resp.json();
  } catch {
    throw makeErr("upstream", "Involve Asia returned non-JSON");
  }

  if (!resp.ok || json?.status !== "success") {
    const msg = json?.message || `HTTP ${resp.status}`;
    throw makeErr("upstream", msg);
  }
  return json;
}

async function getInvolveToken(forceRefresh = false) {
  if (!involveConfigured()) {
    throw makeErr("not_configured", "Involve Asia API credentials missing");
  }

  const now = Date.now();
  if (
    !forceRefresh &&
    tokenCache.token &&
    now < tokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS
  ) {
    return tokenCache.token;
  }

  const form = new URLSearchParams();
  form.set("key", String(process.env.INVOLVE_ASIA_API_KEY).trim());
  form.set("secret", String(process.env.INVOLVE_ASIA_API_SECRET).trim());

  const json = await involveApiPost("/authenticate", { form });
  const token = json?.data?.token;
  if (!token) throw makeErr("upstream", "No token in authenticate response");

  tokenCache.token = token;
  tokenCache.expiresAt = now + TOKEN_TTL_MS;
  tokenCache.validatedAt = new Date().toISOString();
  return token;
}

export function verifyAffiliateRequestHeaders(headers) {
  return osgAffiliateVerifyRequestHeaders(headers);
}

export async function validateAffiliateApi(appId) {
  const checkedAt = new Date().toISOString();
  const pauliModules =
    String(appId || "").trim() === "pauli_best_price_thailand" ||
    !appId
      ? getPauliAffiliateModuleConfig()
      : undefined;
  if (!involveConfigured()) {
    affiliateRuntimeStatus = {
      active: false,
      label: "Affiliate-API: INACTIVE",
      checkedAt,
      reason: "credentials_missing",
    };
    return osgAffiliateStatusPayload(false, {
      ok: false,
      checkedAt,
      reason: "credentials_missing",
      appId: appId || null,
      scope: "ecommerce_grocery_retail",
      pauliModules,
    });
  }

  try {
    await getInvolveToken();
    const idOk = String(OSG_AFFILIATE_ID) === "1085689";
    const active = idOk;
    affiliateRuntimeStatus = {
      active,
      label: active ? "Affiliate-API: ACTIVE" : "Affiliate-API: INACTIVE",
      checkedAt,
      reason: active ? "involve_authenticate_ok" : "affiliate_id_mismatch",
    };
    return osgAffiliateStatusPayload(active, {
      ok: active,
      checkedAt,
      reason: affiliateRuntimeStatus.reason,
      handshake: "involve_authenticate_ok",
      publisher: OSG_AFFILIATE_PUBLISHER,
      tokenValidatedAt: tokenCache.validatedAt,
      appId: appId || null,
      scope: "ecommerce_grocery_retail",
      pauliModules,
    });
  } catch (err) {
    affiliateRuntimeStatus = {
      active: false,
      label: "Affiliate-API: INACTIVE",
      checkedAt,
      reason: String(err?.code || "auth_failed"),
    };
    return osgAffiliateStatusPayload(false, {
      ok: false,
      checkedAt,
      reason: String(err?.code || "auth_failed"),
      message: String(err?.message || "").slice(0, 240),
      appId: appId || null,
      scope: "ecommerce_grocery_retail",
      pauliModules,
    });
  }
}

export function getAffiliateRuntimeStatus() {
  return { ...affiliateRuntimeStatus, affiliateId: OSG_AFFILIATE_ID };
}

/**
 * @param {{ partner: string, url: string, affSub2?: string, affSub3?: string, appId?: string }} opts
 */
export async function generateInvolveDeeplink(opts) {
  const partner = String(opts?.partner || "").trim();
  const channel = String(opts?.channel || "marketplace").trim();
  const appId = String(opts?.appId || "pauli_best_price_thailand").trim();
  const involveKey = assertRetailApiScope(partner, channel);
  const offerId = offerIdForPartner(involveKey);
  if (!offerId) {
    throw makeErr(
      "not_configured",
      `Offer ID not configured for partner ${partner}`,
    );
  }

  const landingUrl = validateLandingUrl(involveKey, opts?.url);

  const form = new URLSearchParams();
  form.set("offer_id", offerId);
  form.set("url", landingUrl);
  form.set("aff_sub", osgAffiliateAffSub(appId));
  const sub2 = sliceSub(opts?.affSub2);
  const sub3 = sliceSub(opts?.affSub3);
  if (sub2) form.set("aff_sub2", sub2);
  if (sub3) form.set("aff_sub3", sub3);

  let token = await getInvolveToken();
  let json;
  try {
    json = await involveApiPost("/deeplink/generate", { token, form, appId });
  } catch (err) {
    if (err.code === "upstream" && /token|auth|credential/i.test(String(err.message))) {
      token = await getInvolveToken(true);
      json = await involveApiPost("/deeplink/generate", { token, form, appId });
    } else {
      throw err;
    }
  }

  const trackingLink = json?.data?.tracking_link;
  if (!trackingLink || typeof trackingLink !== "string") {
    throw makeErr("upstream", "No tracking_link in deeplink response");
  }

  return {
    trackingLink,
    offerId,
    offerName:
      typeof json?.data?.offer_name === "string"
        ? json.data.offer_name
        : undefined,
    affiliateId: OSG_AFFILIATE_ID,
    publisher: OSG_AFFILIATE_PUBLISHER,
    affSub: osgAffiliateAffSub(appId),
  };
}

export function involveAsiaStatus() {
  const partners = Object.keys(PARTNER_HOSTS);
  const configuredPartners = partners.filter((p) => Boolean(offerIdForPartner(p)));
  const runtime = getAffiliateRuntimeStatus();
  return {
    credentials: involveConfigured(),
    partners: configuredPartners,
    ready: involveConfigured() && configuredPartners.length > 0,
    affiliateId: OSG_AFFILIATE_ID,
    publisher: OSG_AFFILIATE_PUBLISHER,
    label: runtime.label,
    active: runtime.active,
    lastCheckedAt: runtime.checkedAt,
    lastReason: runtime.reason,
    scope: "ecommerce_grocery_retail",
    pauliModules: getPauliAffiliateModuleConfig(),
    retailApiOnly: true,
  };
}

export {
  assertRetailApiScope,
  canUseAffiliateApi1085689,
  getPauliAffiliateModuleConfig,
};
