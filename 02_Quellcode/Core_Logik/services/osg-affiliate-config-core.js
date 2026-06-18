/**
 * OSG Affiliate API — Kern (Publisher-ID, Apps, Signatur).
 */

export const OSG_AFFILIATE_ID = String(
  process.env.INVOLVE_ASIA_AFFILIATE_ID || "1085689"
).trim();

export const OSG_AFFILIATE_PUBLISHER = String(
  process.env.OSG_AFFILIATE_PUBLISHER || "Omni Solutions Global"
).trim();

export const OSG_AFFILIATE_STATUS_ACTIVE = "Affiliate-API: ACTIVE";
export const OSG_AFFILIATE_STATUS_INACTIVE = "Affiliate-API: INACTIVE";

export const OSG_AFFILIATE_APPS = [
  {
    appId: "pauli_best_price_thailand",
    display: "Pauli Best Price Thailand",
    affSubKey: "paoli_best_price",
  },
  {
    appId: "omniqr_ai_thailand",
    display: "OmniQR-AI for Tourist of Thailand",
    affSubKey: "omniqr_ai_thailand",
  },
  {
    appId: "omnisolutionsglobal_web",
    display: "Omni Solutions Global Website",
    affSubKey: "osg_web",
  },
];

export function osgAffiliateApp(appId) {
  const id = String(appId || "").trim();
  return (
    OSG_AFFILIATE_APPS.find((r) => r.appId === id) ||
    OSG_AFFILIATE_APPS[0]
  );
}

export function osgAffiliateAffSub(appId) {
  const override = String(process.env.INVOLVE_ASIA_AFF_SUB1 || "").trim();
  if (override) return override.slice(0, 96);
  const row = osgAffiliateApp(appId);
  return `osg_${row.affSubKey}_${OSG_AFFILIATE_ID}`.slice(0, 96);
}

export function osgAffiliateSignHeaders(appId) {
  const row = osgAffiliateApp(appId);
  return {
    "X-OSG-Affiliate-Id": OSG_AFFILIATE_ID,
    "X-OSG-Affiliate-Publisher": OSG_AFFILIATE_PUBLISHER,
    "X-OSG-App-Id": row.appId,
  };
}

export function osgAffiliateVerifyRequestHeaders(headers) {
  const h = headers || {};
  const get = (k) =>
    String(h[k] || h[k.toLowerCase()] || "").trim();
  const id = get("X-OSG-Affiliate-Id");
  const publisher = get("X-OSG-Affiliate-Publisher");
  const appId = get("X-OSG-App-Id");
  if (id !== OSG_AFFILIATE_ID) {
    return { ok: false, reason: "affiliate_id_mismatch", appId };
  }
  if (publisher !== OSG_AFFILIATE_PUBLISHER) {
    return { ok: false, reason: "publisher_mismatch", appId };
  }
  if (!OSG_AFFILIATE_APPS.some((r) => r.appId === appId)) {
    return { ok: false, reason: "unknown_app_id", appId };
  }
  return { ok: true, appId, affiliateId: id, publisher };
}

export function osgAffiliateStatusPayload(active, extra) {
  return {
    affiliateId: OSG_AFFILIATE_ID,
    publisher: OSG_AFFILIATE_PUBLISHER,
    label: active ? OSG_AFFILIATE_STATUS_ACTIVE : OSG_AFFILIATE_STATUS_INACTIVE,
    active: !!active,
    apps: OSG_AFFILIATE_APPS.map((r) => ({
      appId: r.appId,
      display: r.display,
      affiliateId: OSG_AFFILIATE_ID,
    })),
    ...(extra && typeof extra === "object" ? extra : {}),
  };
}
