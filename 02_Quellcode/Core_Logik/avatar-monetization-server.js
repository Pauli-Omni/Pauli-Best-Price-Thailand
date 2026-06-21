import crypto from "crypto";
import fs from "fs";
import path from "path";

export const AVATAR_TRIAL_DAYS = 90;
export const AVATAR_EXTENSION_PRICE_THB = 99.9;
export const AVATAR_REFERRAL_TARGET = 3;

function avatarReferralFile(dataDir) {
  return path.join(dataDir, "avatar_referral_edges.jsonl");
}

function avatarSocialFile(dataDir) {
  return path.join(dataDir, "avatar_social_exempt.json");
}

function readJsonl(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function appendJsonl(filePath, row) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(row) + "\n", "utf8");
}

function loadSocialExempt(dataDir) {
  try {
    const p = avatarSocialFile(dataDir);
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_) {
    return {};
  }
}

function saveSocialExempt(dataDir, obj) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(avatarSocialFile(dataDir), JSON.stringify(obj, null, 2), "utf8");
}

function hashDocument(raw) {
  return crypto.createHash("sha256").update(String(raw || ""), "utf8").digest("hex");
}

function isSocialType(type) {
  return ["disability_card", "welfare_card", "red_cross_id"].indexOf(String(type || "")) >= 0;
}

function referralDedupKey(parentRef, childRef, childDeviceAnchor) {
  const a = String(childDeviceAnchor || "").trim();
  if (a.length >= 16) return `a:${parentRef}:${a.slice(0, 96)}`;
  return `c:${parentRef}:${String(childRef || "").trim().slice(0, 120)}`;
}

export function qualifiedReferralCount(dataDir, parentRef) {
  const edges = readJsonl(avatarReferralFile(dataDir)).filter(
    (e) => e && String(e.parentRef) === String(parentRef) && e.purchaseVerified === true,
  );
  const keys = new Set(
    edges.map((e) => referralDedupKey(e.parentRef, e.childRef, e.childDeviceAnchor)),
  );
  keys.delete("");
  return keys.size;
}

function hasMutualReferral(dataDir, parentRef, childRef) {
  const edges = readJsonl(avatarReferralFile(dataDir));
  return edges.some(
    (e) =>
      e &&
      String(e.parentRef) === String(childRef) &&
      String(e.childRef) === String(parentRef) &&
      e.purchaseVerified === true,
  );
}

export function validateReferralClaim(dataDir, body) {
  const parentRef = String(body.parentRef || "").trim().slice(0, 96);
  const childRef = String(body.childRef || body.childCid || "").trim().slice(0, 120);
  const parentDevice = String(body.parentDeviceAnchor || "").trim().slice(0, 96);
  const childDevice = String(body.childDeviceAnchor || "").trim().slice(0, 96);
  const purchaseVerified = body.purchaseVerified === true || body.purchaseVerified === "1";

  if (!parentRef || !childRef) {
    return { referralValid: false, reason: "missing_ids" };
  }
  if (parentRef === childRef) {
    return { referralValid: false, reason: "self_referral" };
  }
  if (hasMutualReferral(dataDir, parentRef, childRef)) {
    return { referralValid: false, reason: "circular_referral" };
  }
  if (parentDevice && childDevice && parentDevice === childDevice && !purchaseVerified) {
    return { referralValid: false, reason: "same_device_no_purchase" };
  }
  if (!purchaseVerified) {
    return { referralValid: false, reason: "purchase_not_verified" };
  }

  const file = avatarReferralFile(dataDir);
  const keys = new Set(
    readJsonl(file)
      .filter((e) => e && String(e.parentRef) === parentRef && e.purchaseVerified === true)
      .map((e) => referralDedupKey(e.parentRef, e.childRef, e.childDeviceAnchor)),
  );
  const dedup = referralDedupKey(parentRef, childRef, childDevice);
  if (!keys.has(dedup)) {
    appendJsonl(file, {
      parentRef,
      childRef,
      childDeviceAnchor: childDevice || undefined,
      parentDeviceAnchor: parentDevice || undefined,
      purchaseVerified: true,
      claimedAt: new Date().toISOString(),
    });
  }

  const count = qualifiedReferralCount(dataDir, parentRef);
  return {
    referralValid: true,
    qualifiedCount: count,
    avatarUnlocked: count >= AVATAR_REFERRAL_TARGET,
    threshold: AVATAR_REFERRAL_TARGET,
  };
}

export function avatarStatusPayload(dataDir, body) {
  const userRef = String(body.userRef || body.ref || "").trim().slice(0, 96);
  const registrationDate = String(body.registrationDate || body.registrationDateStr || "").slice(
    0,
    10,
  );
  const deviceId = String(body.deviceId || body.deviceAnchor || "").trim().slice(0, 120);
  const extensionPaid = body.extensionPaid === true || body.extensionPaid === "1";
  const social = loadSocialExempt(dataDir);
  const socialRow = social[userRef] || social[deviceId.slice(0, 48)];

  if (socialRow && socialRow.exempt === true) {
    return {
      avatarActive: true,
      statusCode: "SOCIAL_EXEMPTION_GRANTED",
      upgradeCostThb: AVATAR_EXTENSION_PRICE_THB,
    };
  }

  if (extensionPaid) {
    return {
      avatarActive: true,
      statusCode: "EXTENSION_PAID",
      upgradeCostThb: AVATAR_EXTENSION_PRICE_THB,
    };
  }

  const qualified = userRef ? qualifiedReferralCount(dataDir, userRef) : 0;
  if (qualified >= AVATAR_REFERRAL_TARGET) {
    return {
      avatarActive: true,
      statusCode: "REFERRAL_UNLOCK",
      qualifiedReferrals: qualified,
      referralTarget: AVATAR_REFERRAL_TARGET,
      upgradeCostThb: AVATAR_EXTENSION_PRICE_THB,
    };
  }

  let daysElapsed = 0;
  if (registrationDate) {
    const start = Date.parse(registrationDate + "T00:00:00.000Z");
    if (Number.isFinite(start)) {
      daysElapsed = Math.floor((Date.now() - start) / 86400000);
    }
  }

  if (daysElapsed <= AVATAR_TRIAL_DAYS) {
    return {
      avatarActive: true,
      statusCode: "TRIAL_PHASE",
      daysRemaining: Math.max(0, AVATAR_TRIAL_DAYS - daysElapsed),
      qualifiedReferrals: qualified,
      referralTarget: AVATAR_REFERRAL_TARGET,
      upgradeCostThb: AVATAR_EXTENSION_PRICE_THB,
    };
  }

  return {
    avatarActive: false,
    statusCode: "TRIAL_EXPIRED",
    infoTextKey: "avatarTrialExpiredMessage",
    qualifiedReferrals: qualified,
    referralTarget: AVATAR_REFERRAL_TARGET,
    upgradeCostThb: AVATAR_EXTENSION_PRICE_THB,
    deviceId: deviceId.slice(0, 48),
  };
}

export function registerSocialExempt(dataDir, body) {
  const userRef = String(body.userRef || body.ref || "").trim().slice(0, 96);
  const deviceId = String(body.deviceId || "").trim().slice(0, 120);
  const verificationType = String(body.verificationType || "").trim();
  const documentHash = hashDocument(body.documentHash || body.documentPayload || "");

  if (!isSocialType(verificationType) || documentHash.length <= 10) {
    return { ok: false, error: "invalid_social_proof" };
  }

  const all = loadSocialExempt(dataDir);
  const row = {
    exempt: true,
    verificationType,
    documentHash: documentHash.slice(0, 64),
    registeredAtISO: new Date().toISOString(),
  };
  if (userRef) all[userRef] = row;
  if (deviceId) all[deviceId.slice(0, 48)] = row;
  saveSocialExempt(dataDir, all);
  return { ok: true, exempt: true, statusCode: "SOCIAL_EXEMPTION_GRANTED" };
}
