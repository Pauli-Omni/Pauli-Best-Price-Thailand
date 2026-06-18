/**
 * OSG Affiliate API — Scope & Pauli-Modul-Trennung (Retail vs. Finanz).
 */
import {
  OSG_AFFILIATE_ID,
  OSG_AFFILIATE_PUBLISHER,
  OSG_AFFILIATE_STATUS_ACTIVE,
  OSG_AFFILIATE_STATUS_INACTIVE,
  OSG_AFFILIATE_APPS,
  osgAffiliateApp,
  osgAffiliateAffSub,
  osgAffiliateSignHeaders,
  osgAffiliateVerifyRequestHeaders,
  osgAffiliateStatusPayload,
} from "./osg-affiliate-config-core.js";

export {
  OSG_AFFILIATE_ID,
  OSG_AFFILIATE_PUBLISHER,
  OSG_AFFILIATE_STATUS_ACTIVE,
  OSG_AFFILIATE_STATUS_INACTIVE,
  OSG_AFFILIATE_APPS,
  osgAffiliateApp,
  osgAffiliateAffSub,
  osgAffiliateSignHeaders,
  osgAffiliateVerifyRequestHeaders,
  osgAffiliateStatusPayload,
};

/** API 1085689 — nur E-Commerce / Lebensmittel / Retail */
export const OSG_AFFILIATE_API_SCOPE = "ecommerce_grocery_retail";

export const OSG_PAULI_AFFILIATE_MODULES = {
  retailApi: {
    moduleId: "retail_api",
    label: "Retail-API",
    active: true,
    affiliateId: OSG_AFFILIATE_ID,
    scope: OSG_AFFILIATE_API_SCOPE,
    channels: ["marketplace", "retail"],
  },
  financeModule: {
    moduleId: "finance_module",
    label: "Finanz-Modul",
    active: false,
    affiliateId: null,
    scope: "finance_insurance_bank_excluded",
    channels: ["bank", "insurance", "real_estate", "finance"],
  },
};

const FINANCE_PARTNER_SLUGS = new Set([
  "kasikorn",
  "roojai",
  "real_estate",
  "real_estate_th",
]);

const RETAIL_INVOLVE_PARTNER_KEYS = {
  lazada: "lazada_th",
  lazada_th: "lazada_th",
  shopee: "shopee_th",
  shopee_th: "shopee_th",
  bigc: "bigc_th",
  bigc_th: "bigc_th",
  lotus: "lotus_th",
  lotuss: "lotus_th",
  lotus_th: "lotus_th",
};

const RETAIL_TRACKING_SLUGS = new Set([
  "lazada",
  "lazada_th",
  "shopee",
  "shopee_th",
  "bigc",
  "bigc_th",
  "lotuss",
  "makro_th",
  "jd_central",
  "central_world",
  "seven_eleven_excl",
]);

export function getPauliAffiliateModuleConfig() {
  return {
    scope: OSG_AFFILIATE_API_SCOPE,
    retailApi: { ...OSG_PAULI_AFFILIATE_MODULES.retailApi },
    financeModule: { ...OSG_PAULI_AFFILIATE_MODULES.financeModule },
  };
}

export function isFinanceModulePartner(partner, channel) {
  const ch = String(channel || "").trim().toLowerCase();
  if (OSG_PAULI_AFFILIATE_MODULES.financeModule.channels.includes(ch)) {
    return true;
  }
  const slug = String(partner || "").trim().toLowerCase();
  return FINANCE_PARTNER_SLUGS.has(slug);
}

export function isRetailApiScope(partner, channel) {
  if (isFinanceModulePartner(partner, channel)) return false;
  const ch = String(channel || "").trim().toLowerCase();
  const slug = String(partner || "").trim().toLowerCase();
  if (OSG_PAULI_AFFILIATE_MODULES.retailApi.channels.includes(ch)) {
    return RETAIL_TRACKING_SLUGS.has(slug) || Boolean(resolveInvolvePartnerKey(partner, channel));
  }
  if (ch === "marketplace") {
    return Boolean(resolveInvolvePartnerKey(partner, channel));
  }
  return RETAIL_TRACKING_SLUGS.has(slug);
}

export function resolveInvolvePartnerKey(partner, channel) {
  if (isFinanceModulePartner(partner, channel)) return "";
  const slug = String(partner || "").trim().toLowerCase();
  const ch = String(channel || "").trim().toLowerCase();
  if (RETAIL_INVOLVE_PARTNER_KEYS[slug]) return RETAIL_INVOLVE_PARTNER_KEYS[slug];
  if (ch === "marketplace" && RETAIL_INVOLVE_PARTNER_KEYS[slug]) {
    return RETAIL_INVOLVE_PARTNER_KEYS[slug];
  }
  if (
    (slug === "bigc" || slug === "bigc_th") &&
    (ch === "retail" || ch === "marketplace")
  ) {
    return "bigc_th";
  }
  if (
    (slug === "lotus" || slug === "lotuss" || slug === "lotus_th") &&
    (ch === "retail" || ch === "marketplace")
  ) {
    return "lotus_th";
  }
  return "";
}

export function canUseAffiliateApi1085689(partner, channel) {
  if (!OSG_PAULI_AFFILIATE_MODULES.retailApi.active) return false;
  if (isFinanceModulePartner(partner, channel)) return false;
  return Boolean(resolveInvolvePartnerKey(partner, channel));
}

export function assertRetailApiScope(partner, channel) {
  if (isFinanceModulePartner(partner, channel)) {
    const err = new Error("finance_module_excluded");
    err.code = "finance_module_excluded";
    throw err;
  }
  const involveKey = resolveInvolvePartnerKey(partner, channel);
  if (!involveKey) {
    const err = new Error("retail_api_scope_required");
    err.code = "retail_api_scope_required";
    throw err;
  }
  return involveKey;
}
