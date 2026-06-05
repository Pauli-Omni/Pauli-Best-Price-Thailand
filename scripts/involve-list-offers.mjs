#!/usr/bin/env node
/**
 * List Involve Asia offers (e.g. Lazada / Shopee Thailand) after .env is configured.
 * Usage: node scripts/involve-list-offers.mjs [search-term]
 */
import "dotenv/config";

const API_BASE = (process.env.INVOLVE_ASIA_API_BASE || "https://api.involve.asia/api").replace(
  /\/$/,
  "",
);

async function authenticate() {
  const key = String(process.env.INVOLVE_ASIA_API_KEY || "").trim();
  const secret = String(process.env.INVOLVE_ASIA_API_SECRET || "").trim();
  if (!key || !secret) {
    console.error("Missing INVOLVE_ASIA_API_KEY or INVOLVE_ASIA_API_SECRET in .env");
    process.exit(1);
  }
  const body = new URLSearchParams({ key, secret });
  const r = await fetch(`${API_BASE}/authenticate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const json = await r.json();
  if (json?.status !== "success" || !json?.data?.token) {
    console.error("Authenticate failed:", json?.message || r.status);
    process.exit(1);
  }
  return json.data.token;
}

async function searchOffers(token, nameFilter) {
  const form = new URLSearchParams();
  form.set("page", "1");
  form.set("limit", "50");
  form.set("sort_by", "relevance");
  if (nameFilter) form.set("filters[offer_name]", nameFilter);
  form.set("filters[application_status]", "Approved");
  form.set("filters[offer_status]", "Active");

  const r = await fetch(`${API_BASE}/offers/all`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const json = await r.json();
  if (json?.status !== "success") {
    console.error("offers/all failed:", json?.message || r.status);
    process.exit(1);
  }
  return json?.data?.data || [];
}

const search = process.argv[2] || "lazada";
const token = await authenticate();
const offers = await searchOffers(token, search);

const affId = process.env.INVOLVE_ASIA_AFFILIATE_ID || "1085689";
console.log(`Partner (affiliate) ID reference: ${affId}`);
console.log(`Offers matching "${search}" (Approved + Active):\n`);

if (!offers.length) {
  console.log("  (none — try another search term, e.g. shopee)");
  process.exit(0);
}

for (const o of offers) {
  const id = o.offer_id ?? o.offerId;
  const name = o.offer_name ?? o.offerName ?? "?";
  const countries = o.countries ?? o.offer_country ?? "";
  const link = o.tracking_link ?? "";
  console.log(`  offer_id=${id}  ${name}  [${countries}]`);
  if (link) console.log(`    tracking: ${String(link).slice(0, 120)}…`);
}

console.log(
  "\nCopy the Thailand offer_id values into .env as INVOLVE_ASIA_OFFER_LAZADA_TH / INVOLVE_ASIA_OFFER_SHOPEE_TH.",
);
