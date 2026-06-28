/**
 * Pauli Avatar — Premium & Freischalt-Logik (Zero-Cloud Edge, lokal + API-Spiegel).
 */
(function (global) {
  "use strict";

  var LS_EXTENSION = "osg-avatar-extension-paid-v1";
  var LS_SOCIAL = "osg-avatar-social-exempt-v1";
  var LS_DEVICE_BOUND = "osg-avatar-device-bound-v1";
  var LS_REF_COUNT = "osg-avatar-ref-qualified-v1";

  function constants() {
    return global.OSG_AVATAR_MONETIZATION || {
      AVATAR_TRIAL_DAYS: 30,
      AVATAR_EXTENSION_PRICE_THB: 49.9,
      AVATAR_REFERRAL_TARGET: 3,
      AVATAR_REFERRAL_WINDOW_DAYS: 30,
      AVATAR_MERCHANT_NETWORK_SIZE: 40,
      SOCIAL_TYPES: ["disability_card", "welfare_card", "red_cross_id"],
    };
  }

  function readLs(key) {
    try {
      return String(global.localStorage.getItem(key) || "");
    } catch (_) {
      return "";
    }
  }

  function writeLs(key, val) {
    try {
      global.localStorage.setItem(key, val);
    } catch (_) {}
  }

  function installBundle() {
    if (typeof global.osgLoadInstallBundle === "function") {
      return global.osgLoadInstallBundle() || {};
    }
    try {
      var raw = readLs("osg-arch-install-meta-v1");
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function registrationIso() {
    var b = installBundle();
    return String(b.installedAtISO || b.firstOpenISO || "").trim();
  }

  function DeviceFingerprinter() {}

  DeviceFingerprinter.getLocalDeviceId = function getLocalDeviceId() {
    if (typeof global.osgVipDeviceAnchor === "function") {
      var anchor = String(global.osgVipDeviceAnchor() || "").trim();
      if (anchor.length >= 12) return anchor;
    }
    var b = installBundle();
    return String(
      b.deviceHardwareId || b.deviceAnchorHex || b.ipFingerprint || ""
    )
      .trim()
      .slice(0, 120);
  };

  function SocialVerificationEngine() {}

  SocialVerificationEngine.isSociallyExempt = function isSociallyExempt(
    verificationType,
    documentHash
  ) {
    var c = constants();
    var types = c.SOCIAL_TYPES || [];
    var hash = String(documentHash || "").trim();
    return types.indexOf(String(verificationType || "")) >= 0 && hash.length > 10;
  };

  function PauliAvatarMonetization(userId, registrationDateStr) {
    this.userId = String(userId || "").trim();
    this.registrationDateStr = String(registrationDateStr || "").trim();
    var c = constants();
    this.testPhaseDays = c.AVATAR_TRIAL_DAYS;
    this.avatarPriceThb = c.AVATAR_EXTENSION_PRICE_THB;
  }

  PauliAvatarMonetization.prototype._daysElapsed = function _daysElapsed() {
    if (!this.registrationDateStr) return 0;
    var start = Date.parse(this.registrationDateStr.slice(0, 10) + "T00:00:00.000Z");
    if (!Number.isFinite(start)) start = Date.parse(this.registrationDateStr);
    if (!Number.isFinite(start)) return 0;
    return Math.floor((Date.now() - start) / 86400000);
  };

  PauliAvatarMonetization.prototype.checkAvatarStatus = function checkAvatarStatus(
    deviceId,
    qualifiedReferrals,
    opts
  ) {
    opts = opts || {};
    var c = constants();
    var target = c.AVATAR_REFERRAL_TARGET;
    qualifiedReferrals =
      typeof qualifiedReferrals === "number"
        ? qualifiedReferrals
        : Number(readLs(LS_REF_COUNT)) || 0;

    if (opts.socialExempt || readLs(LS_SOCIAL) === "1") {
      return {
        avatarActive: true,
        statusCode: "SOCIAL_EXEMPTION_GRANTED",
        messageKey: "avatarSocialExemptMessage",
      };
    }

    if (opts.extensionPaid || readLs(LS_EXTENSION) === "1") {
      return {
        avatarActive: true,
        statusCode: "EXTENSION_PAID",
        upgradeCostThb: this.avatarPriceThb,
      };
    }

    if (typeof global.osgVipActive === "function" && global.osgVipActive()) {
      return { avatarActive: true, statusCode: "VIP_BYPASS" };
    }

    if (
      typeof global.osgLifetimeUnlocked === "function" &&
      global.osgLifetimeUnlocked()
    ) {
      return { avatarActive: true, statusCode: "LIFETIME_BYPASS" };
    }

    var days = this._daysElapsed();
    var referralWindowDays =
      c.AVATAR_REFERRAL_WINDOW_DAYS != null
        ? Number(c.AVATAR_REFERRAL_WINDOW_DAYS)
        : this.testPhaseDays;
    if (!Number.isFinite(referralWindowDays) || referralWindowDays < 0) {
      referralWindowDays = this.testPhaseDays;
    }
    var inReferralWindow = days <= referralWindowDays;

    if (inReferralWindow && qualifiedReferrals >= target) {
      return {
        avatarActive: true,
        statusCode: "REFERRAL_UNLOCK",
        qualifiedReferrals: qualifiedReferrals,
        referralTarget: target,
      };
    }

    if (days <= this.testPhaseDays) {
      return {
        avatarActive: true,
        statusCode: "TRIAL_PHASE",
        daysRemaining: Math.max(0, this.testPhaseDays - days),
        messageKey: "avatarTrialDaysRemainingTpl",
        qualifiedReferrals: qualifiedReferrals,
        referralTarget: target,
        referralWindowOpen: inReferralWindow,
      };
    }

    return {
      avatarActive: false,
      statusCode: "TRIAL_EXPIRED",
      infoTextKey: "avatarTrialExpiredMessage",
      upgradeCostThb: this.avatarPriceThb,
      qualifiedReferrals: qualifiedReferrals,
      referralTarget: target,
      referralWindowOpen: false,
      deviceId: String(deviceId || "").slice(0, 48),
    };
  };

  function ReferralEngine() {}

  ReferralEngine.validateReferral = function validateReferral(
    referrerId,
    newUserId,
    purchaseVerified,
    deviceIdReferrer,
    deviceIdNew,
    opts
  ) {
    opts = opts || {};
    referrerId = String(referrerId || "").trim();
    newUserId = String(newUserId || "").trim();
    deviceIdReferrer = String(deviceIdReferrer || "").trim();
    deviceIdNew = String(deviceIdNew || "").trim();

    if (!referrerId || !newUserId) {
      return { referralValid: false, reasonKey: "avatarReferralMissingIds" };
    }

    if (referrerId === newUserId) {
      return {
        referralValid: false,
        reasonKey: "avatarReferralSelfBlocked",
      };
    }

    if (opts.mutualBlocked) {
      return {
        referralValid: false,
        reasonKey: "avatarReferralCircularBlocked",
      };
    }

    if (
      deviceIdReferrer &&
      deviceIdNew &&
      deviceIdReferrer === deviceIdNew &&
      !purchaseVerified
    ) {
      return {
        referralValid: false,
        reasonKey: "avatarReferralSameDeviceBlocked",
      };
    }

    if (!purchaseVerified) {
      return {
        referralValid: false,
        reasonKey: "avatarReferralNoPurchase",
      };
    }

    return {
      referralValid: true,
      incrementQuota: 1,
      messageKey: "avatarReferralSuccess",
    };
  };

  function bindDeviceOnce(deviceId) {
    deviceId = String(deviceId || "").trim();
    if (!deviceId) return false;
    var prev = readLs(LS_DEVICE_BOUND);
    if (prev && prev !== deviceId) return false;
    writeLs(LS_DEVICE_BOUND, deviceId);
    return true;
  }

  function setExtensionPaid(on) {
    if (on) writeLs(LS_EXTENSION, "1");
    else try {
      global.localStorage.removeItem(LS_EXTENSION);
    } catch (_) {}
  }

  function setSocialExempt(on, verificationType, documentHash) {
    if (
      on &&
      SocialVerificationEngine.isSociallyExempt(verificationType, documentHash)
    ) {
      writeLs(LS_SOCIAL, "1");
      return true;
    }
    if (!on) {
      try {
        global.localStorage.removeItem(LS_SOCIAL);
      } catch (_) {}
    }
    return false;
  }

  function setQualifiedReferralCount(n) {
    writeLs(LS_REF_COUNT, String(Math.max(0, Number(n) || 0)));
  }

  function getQualifiedReferralCount() {
    return Number(readLs(LS_REF_COUNT)) || 0;
  }

  function resolveAvatarAccess(opts) {
    opts = opts || {};
    var userId =
      (typeof global.osgEnsureCustomerId === "function" &&
        global.osgEnsureCustomerId()) ||
      "";
    var reg = registrationIso() || new Date().toISOString().slice(0, 10);
    var deviceId = DeviceFingerprinter.getLocalDeviceId();
    var mon = new PauliAvatarMonetization(userId, reg.slice(0, 10));
    return mon.checkAvatarStatus(
      deviceId,
      opts.qualifiedReferrals,
      opts
    );
  }

  function isAvatarActive(opts) {
    return !!resolveAvatarAccess(opts).avatarActive;
  }

  global.OSG_PauliAvatarMonetization = {
    constants: constants,
    DeviceFingerprinter: DeviceFingerprinter,
    SocialVerificationEngine: SocialVerificationEngine,
    PauliAvatarMonetization: PauliAvatarMonetization,
    ReferralEngine: ReferralEngine,
    bindDeviceOnce: bindDeviceOnce,
    setExtensionPaid: setExtensionPaid,
    setSocialExempt: setSocialExempt,
    setQualifiedReferralCount: setQualifiedReferralCount,
    getQualifiedReferralCount: getQualifiedReferralCount,
    resolveAvatarAccess: resolveAvatarAccess,
    isAvatarActive: isAvatarActive,
  };
})(typeof window !== "undefined" ? window : globalThis);
