/**
 * Involve Asia Publisher API — token cache + deeplink generation.
 * @see https://api.involve.asia/
 */

const INVOLVE_API_BASE =
  (process.env.INVOLVE_ASIA_API_BASE || "https://api.involve.asia/api").replace(
    /\/$/,
    "",
  );

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** @type {{ token: string|null, expiresAt: number }} */
const tokenCache = { token: null, expiresAt: 0 };

const PARTNER_HOSTS = {
  lazada_th: /(^|\.)lazada\.co\.th$/i,
  shopee_th: /(^|\.)shopee\.co\.th$/i,
  bigc_th: /(^|\.)bigc\.co\.th$/i,
};

function involveConfigured() {
  return Boolean(
    process.env.INVOLVE_ASIA_API_KEY &&
      process.env.INVOLVE_ASIA_API_SECRET,
  );
}

function offerIdForPartner(partner) {
  const map = {
    lazada_th: process.env.INVOLVE_ASIA_OFFER_LAZADA_TH,
    shopee_th: process.env.INVOLVE_ASIA_OFFER_SHOPEE_TH,
    bigc_th: process.env.INVOLVE_ASIA_OFFER_BIGC_TH,
  };
  const id = map[String(partner || "").trim()];
  return id && String(id).trim() ? String(id).trim() : "";
}

function defaultAffSub1() {
  const fromEnv = String(process.env.INVOLVE_ASIA_AFF_SUB1 || "").trim();
  return fromEnv || "paoli_best_price";
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

async function involveApiPost(path, { token, form } = {}) {
  const headers = { Accept: "application/json" };
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
  return token;
}

/**
 * @param {{ partner: string, url: string, affSub2?: string, affSub3?: string }} opts
 * @returns {Promise<{ trackingLink: string, offerId: string, offerName?: string }>}
 */
export async function generateInvolveDeeplink(opts) {
  const partner = String(opts?.partner || "").trim();
  const offerId = offerIdForPartner(partner);
  if (!offerId) {
    throw makeErr(
      "not_configured",
      `Offer ID not configured for partner ${partner}`,
    );
  }

  const landingUrl = validateLandingUrl(partner, opts?.url);

  const form = new URLSearchParams();
  form.set("offer_id", offerId);
  form.set("url", landingUrl);
  form.set("aff_sub", defaultAffSub1());
  const sub2 = sliceSub(opts?.affSub2);
  const sub3 = sliceSub(opts?.affSub3);
  if (sub2) form.set("aff_sub2", sub2);
  if (sub3) form.set("aff_sub3", sub3);

  let token = await getInvolveToken();
  let json;
  try {
    json = await involveApiPost("/deeplink/generate", { token, form });
  } catch (err) {
    if (err.code === "upstream" && /token|auth|credential/i.test(String(err.message))) {
      token = await getInvolveToken(true);
      json = await involveApiPost("/deeplink/generate", { token, form });
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
  };
}

export function involveAsiaStatus() {
  const partners = Object.keys(PARTNER_HOSTS);
  const configuredPartners = partners.filter((p) => Boolean(offerIdForPartner(p)));
  return {
    credentials: involveConfigured(),
    partners: configuredPartners,
    ready: involveConfigured() && configuredPartners.length > 0,
  };
}
