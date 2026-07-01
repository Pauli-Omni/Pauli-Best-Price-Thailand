      (function () {
        var OSG_BANK_INFO_URL = "https://www.kasikornbank.com/";
        var OSG_COMPARE_ROWS = [
          {
            lazada: { thb: 89, cod: true },
            shopee: { thb: 85, cod: true },
            seven: { thb: 92 },
          },
          {
            lazada: { thb: 59, cod: false },
            shopee: { thb: 57, cod: true },
            seven: { thb: 61 },
          },
          {
            lazada: { thb: 129, cod: true },
            shopee: { thb: 119, cod: false },
            seven: { thb: 135 },
          },
        ];

        function osgEscHtml(s) {
          return String(s == null ? "" : s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;");
        }

        var OSG_APP_DISPLAY_NAME = "Pauli Best Price Thailand";
        var OSG_INFO_EMAIL = "info@omnisolutionsglobal.com";
        var OSG_SUPPORT_EMAIL = "support@omnisolutionsglobal.com";
        var OSG_AFF_TOKEN = "paoli_best_price";
        /** Kann überschrieben werden: window.__OSG_MARKETPLACE_SUB_ID__ = "deine_affiliate_sub_id"; */
        var OSG_MARKETPLACE_SUB_ID =
          typeof window.__OSG_MARKETPLACE_SUB_ID__ !== "undefined" &&
          String(window.__OSG_MARKETPLACE_SUB_ID__ || "").trim()
            ? String(window.__OSG_MARKETPLACE_SUB_ID__).trim()
            : OSG_AFF_TOKEN;
        /** Beweis-/Abrechnungs-Code Lazada‑Aktion — fest mit osg_market_sub & osg_cid gekoppelt */
        var OSG_VOUCHER_CODE_PRIMARY = "Pauli-001";
        var OSG_VOUCHER_THB_PRIMARY = 15;
        /** Anzeige Partner‑Referenz auf dem BestPrice‑Vorteilszertifikat (Pauli / Omni) */
        var OSG_PAULI_PROVIDER_REF = "PAULI-OMNI-BPR";
        /** Feste Settlement-/Lane-IDs für Partnerabrechnung (Platzhalter — produktiv mit Netzwerk abstimmen) */
        var OSG_CERT_SETTLEMENT_REF = {
          kasikorn: "BPR-SET-KBANK-CHANNEL-01",
          roojai: "BPR-SET-ROOJAI-CHANNEL-01",
          honda_mofa: "BPR-SET-HONDA-MOFA-01",
          yamaha_mofa: "BPR-SET-YAMAHA-MOFA-01",
          real_estate_th: "BPR-SET-REALTY-LANE-TH-01",
        };
        /** Gutschrift 15 THB nur bei dokumentiert mindestens so hohem WKZ beim selben‑Store‑Seven‑Checkout */
        var OSG_VOUCHER_MIN_BASKET_THB = 45;
        var OSG_LS_VOUCHER_PROOF = "osg-voucher-pauli001-proof-v1";
        /** sessionStorage: "marketplace" | "seven_pickup" — Gutschein nur bei seven_pickup */
        var OSG_SS_PICKUP_MODE = "osg-pickup-mode-v1";
        /** Live-Tracking-Opt-in (Pflicht zur Anzeige / Ausstellung von Pauli‑001) */
        var OSG_SS_LIVE_TRACK_ON = "osg-live-tracking-on-v2";
        var OSG_LS_LIVE_TRACK_EXPLAIN = "osg-live-tracking-explain-v1";
        /** Neue ID je „Tracking-Sitzung“ (bei Opt-in erzeugt, bei Opt-out verworfen). */
        var OSG_SS_TRACK_SID = "osg-track-session-id-v2";
        /** Zu welcher TRACK_SID bereits ein Ausstellungs-Event erfolgte — einmal pro Sitzung. */
        var OSG_SS_TRACK_ISSUED_SID = "osg-track-voucher-issued-for-sid-v2";
        /** Gültigkeitsdauer nach Aktivierung (ms) */
        var OSG_VOUC_VALID_MS = 120 * 60 * 1000;
        var OSG_LS_CUSTOMER = "osg-customer-id-v1";
        /** Gastprofil: zur Ansprache nur userName (Onboarding); kein customerName mehr */
        var OSG_LS_USER_PROFILE = "osg-user-profile-v1";
        /** lokales DOB yyyy-mm-dd zur TH-Jugendsperre Immo/Kfz/Finanz – nur Gerät */
        var OSG_MIN_AGE_YEARS = 15;
        var OSG_LS_AGE_GATE = "osg-age-gate-th15-v1";
        var OSG_LS_AGE_GATE_LEGACY = "osg-age-gate-th20-v1";
        var OSG_LS_JOURNAL = "osg-lead-journal-v1";
        var OSG_LS_JOURNAL_CHAIN = "osg-journal-chain-v1";
        var OSG_LS_POST_TRIAL_PAID = "osg-post-trial-paid-v1";
        var OSG_LS_COUNTS = "osg-lead-counts-v1";
        /** Erster Start: Anrede wählen — nur lokal; kein Cloud-Sync des Namens */
        var OSG_LS_PERSONAL_ONBOARD = "osg-personal-onboard-v1";
        /** Freiwillig: Standort für Google-Maps-Filialübersicht (Browser-GPS) */
        var OSG_LS_MAP_GEO_CONSENT = "osg-map-geo-consent-v1";
        /** Lokale Notizen (Gutscheine etc.) — nur auf dem Gerät */
        var OSG_LS_LOCAL_COUPON_NOTES = "osg-local-coupon-notes-v1";
        var OSG_LS_DELIVERY_TIER = "osg-delivery-tier-v1";
        var OSG_LS_MEMBERSHIP_NOTES = "osg-membership-notes-v1";
        /** API mirror queue when offline — drains on `online` */
        var OSG_LS_API_OUTBOX = "osg-api-outbox-v1";
        /** First-open + referral/trial bookkeeping (JSON) */
        var OSG_LS_ARCH_INSTALL = "osg-arch-install-meta-v1";
        var OSG_LS_REF_LIFETIME = "osg-referral-lifetime-v1";
        /** Pauli-Friends VIP — unabhängig vom Referral-Lifetime-Zähler */
        var OSG_LS_VIP_ACTIVE = "osg-vip-pauli-friends-v1";
        var OSG_LS_VIP_CODE = "osg-vip-code-v1";
        var OSG_LS_VIP_PROFILE = "osg-vip-profile-v1";
        var OSG_LS_VIP_DOWNLOAD_SENT = "osg-vip-download-sent-v1";
        /** Dedupe failed VIP deep-link attempts (same code) for 24h — reduces API noise */
        var OSG_LS_VIP_URL_FAIL = "osg-vip-url-fail-v1";
        var OSG_LS_REF_CLAIM_SENT = "osg-referral-claim-sent-v1";
        var OSG_LS_AVATAR_PENDING_PARENT = "osg-avatar-pending-parent-v1";
        var OSG_LS_AVATAR_REF_CLAIM_SENT = "osg-avatar-referral-claim-sent-v1";
        /** Weighted anon interest buckets for push copy (keywords) */
        var OSG_LS_INTEREST_WEIGHTS = "osg-interest-weights-v1";
        /** After marketplace purchase outbound — mute product-ish pushes */
        var OSG_LS_PUSH_COMMERCE_SILENCE = "osg-push-commerce-off-v1";
        /** Keywords (interest memory) muted for push tail after tracked purchase */
        var OSG_LS_PUSH_PRODUCT_MUTE = "osg-product-push-muted-v1";
        var OSG_LS_PUSH_STAGE = "osg-push-human-stage-v1";
        var OSG_TRIAL_MS = 168 * 3600000;
        var OSG_REF_UNIQUE_TARGET = 6;
        var OSG_JOURNAL_CAP = 380;
        function osgApiBase() {
          try {
            var b =
              typeof window.OSG_API_BASE === "string"
                ? window.OSG_API_BASE.trim()
                : "";
            return b.replace(/\/$/, "");
          } catch (_) {
            return "";
          }
        }
        function osgApiUrl(path) {
          path = String(path || "");
          if (!path || path.charAt(0) !== "/") path = "/" + path.replace(/^\/+/, "");
          var base = osgApiBase();
          if (!base) return path;
          try {
            if (typeof window !== "undefined" && window.location && window.location.origin) {
              var pageOrigin = String(window.location.origin || "").replace(/\/$/, "");
              var apiOrigin = String(base).replace(/\/$/, "");
              if (pageOrigin && apiOrigin === pageOrigin) return path;
            }
          } catch (_) {}
          return base + path;
        }

        /** Kanal-Label für Mehrkanal-Rollout (Web/TV-Wrapper/Capacitor). Shell setzt vor anderem JS: window.OSG_CLIENT_CHANNEL / OSG_CLIENT_BUILD */
        function osgClientChannel() {
          try {
            var c =
              typeof window.OSG_CLIENT_CHANNEL === "string"
                ? window.OSG_CLIENT_CHANNEL.trim()
                : "";
            return c ? c.slice(0, 48) : "web";
          } catch (_) {
            return "web";
          }
        }
        function osgClientBuild() {
          try {
            var b =
              typeof window.OSG_CLIENT_BUILD === "string"
                ? window.OSG_CLIENT_BUILD.trim()
                : "";
            return b.slice(0, 64);
          } catch (_) {
            return "";
          }
        }
        function osgAffiliateSignHeaders() {
          return {
            "X-OSG-Affiliate-Id": "1085689",
            "X-OSG-Affiliate-Publisher": "Omni Solutions Global",
            "X-OSG-App-Id": "pauli_best_price_thailand",
          };
        }

        function osgAffiliateCheckOnce() {
          if (window.__OSG_AFFILIATE_CHECK_DONE__) {
            return Promise.resolve(window.__OSG_AFFILIATE_API_STATUS__ || null);
          }
          window.__OSG_AFFILIATE_CHECK_DONE__ = true;
          if (!navigator.onLine) return Promise.resolve(null);
          return osgApiFetch(
            "/api/affiliate/check?appId=pauli_best_price_thailand",
            { cache: "no-store", headers: osgAffiliateSignHeaders() }
          )
            .then(function (r) {
              return r.ok ? r.json() : null;
            })
            .then(function (j) {
              window.__OSG_AFFILIATE_API_STATUS__ = j;
              if (j && j.pauliModules) {
                window.__OSG_PAULI_AFFILIATE_MODULES__ = j.pauliModules;
              }
              if (j && j.active) {
                console.log("[affiliate]", j.label, j.affiliateId);
              }
              return j;
            })
            .catch(function () {
              return null;
            });
        }

        function osgApiFetch(path, init) {
          init = init || {};
          var headers = new Headers(init.headers || undefined);
          if (!headers.has("X-OSG-Channel"))
            headers.set("X-OSG-Channel", osgClientChannel());
          var build = osgClientBuild();
          if (build && !headers.has("X-OSG-Build"))
            headers.set("X-OSG-Build", build);
          var aff = osgAffiliateSignHeaders();
          if (!headers.has("X-OSG-Affiliate-Id"))
            headers.set("X-OSG-Affiliate-Id", aff["X-OSG-Affiliate-Id"]);
          if (!headers.has("X-OSG-Affiliate-Publisher"))
            headers.set(
              "X-OSG-Affiliate-Publisher",
              aff["X-OSG-Affiliate-Publisher"]
            );
          if (!headers.has("X-OSG-App-Id"))
            headers.set("X-OSG-App-Id", aff["X-OSG-App-Id"]);
          return fetch(osgApiUrl(path), Object.assign({}, init, { headers: headers }));
        }

        window.osgApiFetch = osgApiFetch;

        function osgEchoProtocol(eventType, meta) {
          if (!eventType || !navigator.onLine) return;
          var body = {
            eventType: String(eventType),
            appId: "pauli_best_price_thailand",
            locale: typeof normalizeLang === "function" ? normalizeLang() : "de",
            customerId: typeof osgEnsureCustomerId === "function" ? osgEnsureCustomerId() : "",
            meta: meta && typeof meta === "object" ? meta : {},
          };
          osgApiFetch("/api/ops/echo-protocol", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
            .then(function (r) {
              return r.ok ? r.json() : null;
            })
            .then(function (j) {
              if (j && j.emailSystem) {
                var st = window.__OSG_VIP_LAST_STATS__ || {};
                st.emailSystem = j.emailSystem;
                window.__OSG_VIP_LAST_STATS__ = st;
                if (typeof osgVipRenderLiveWidget === "function") osgVipRenderLiveWidget();
              }
            })
            .catch(function () {});
        }

        var OSG_AFFILIATE_BASE = {
          kasikorn: OSG_BANK_INFO_URL,
          roojai: "https://www.roojai.com/",
          honda_mofa: "https://www.honda.co.th/motorcycles/",
          yamaha_mofa: "https://www.yamaha-motor.co.th/",
          kawasaki_th: "https://www.kawasaki-motors.com/",
          suzuki_th: "https://www.suzuki.co.th/",
          toyota_th: "https://www.toyota.co.th/",
          real_estate: "https://www.hipflat.co.th/listings/thailand",
          bigc: "https://www.bigc.co.th/",
          lotuss: "https://www.lotuss.com/",
          makro_th: "https://www.makro.pro/",
          jd_central: "https://www.jd.co.th/",
          apple_th: "https://www.apple.com/th/",
          homepro: "https://www.homepro.co.th/",
          boonthavorn: "https://www.boonthavorn.com/",
          boots_th: "https://www.boots.co.th/",
          watsons_th: "https://www.watsons.co.th/",
          central_world: "https://www.centralworld.co.th/",
        };

        function osgRandHex(bytes) {
          try {
            var a = new Uint8Array(bytes || 16);
            crypto.getRandomValues(a);
            var s = "";
            for (var i = 0; i < a.length; i++)
              s += a[i].toString(16).padStart(2, "0");
            return s;
          } catch (_) {
            return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
          }
        }

        function osgEnsureCustomerId() {
          try {
            var k = OSG_LS_CUSTOMER;
            var cur = localStorage.getItem(k);
            if (!cur) {
              cur = "osgc_" + osgRandHex(12);
              localStorage.setItem(k, cur);
            }
            return cur;
          } catch (_) {
            return "osgc_sess_" + osgRandHex(6);
          }
        }
        window.osgEnsureCustomerId = osgEnsureCustomerId;

        function osgLoadInstallBundle() {
          try {
            var raw = localStorage.getItem(OSG_LS_ARCH_INSTALL);
            var o = raw ? JSON.parse(raw) : null;
            return o && typeof o === "object" ? o : null;
          } catch (_) {
            return null;
          }
        }

        function osgSaveInstallBundle(o) {
          try {
            localStorage.setItem(OSG_LS_ARCH_INSTALL, JSON.stringify(o));
          } catch (_) {}
        }

        function osgEnsureArchInstall() {
          var b = osgLoadInstallBundle();
          if (!b || !b.installedAtISO) {
            b = {
              installedAtISO: new Date().toISOString(),
              installNonce: osgRandHex(8),
            };
            osgSaveInstallBundle(b);
          }
          return b;
        }

        function osgOwnReferralCode() {
          osgEnsureCustomerId();
          osgEnsureArchInstall();
          var cid = "";
          try {
            cid = String(localStorage.getItem(OSG_LS_CUSTOMER) || "");
          } catch (_) {
            cid = "";
          }
          var slug = cid.replace(/^osgc_/, "").slice(0, 24);
          if (!slug) slug = osgRandHex(10);
          return "BPR" + slug;
        }

        function osgReferralShareUrl() {
          try {
            var u = new URL(window.location.href);
            u.hash = "";
            u.searchParams.set("osg_ref", osgOwnReferralCode());
            return u.href;
          } catch (_) {
            var o = "";
            try {
              o = String(window.location.origin || "");
            } catch (_) {}
            return o + "/?osg_ref=" + encodeURIComponent(osgOwnReferralCode());
          }
        }

        function osgTrialEndsMs() {
          var b = osgEnsureArchInstall();
          return Date.parse(b.installedAtISO) + OSG_TRIAL_MS;
        }

        function osgTrialHoursRemaining() {
          return Math.max(
            0,
            Math.ceil((osgTrialEndsMs() - Date.now()) / 3600000)
          );
        }

        function osgTrialIsActiveNow() {
          return Date.now() < osgTrialEndsMs() || osgLifetimeUnlocked();
        }

        function osgVipActive() {
          try {
            return localStorage.getItem(OSG_LS_VIP_ACTIVE) === "1";
          } catch (_) {
            return false;
          }
        }

        function osgVipSet(on) {
          try {
            if (on) localStorage.setItem(OSG_LS_VIP_ACTIVE, "1");
            else localStorage.removeItem(OSG_LS_VIP_ACTIVE);
          } catch (_) {}
        }

        function osgVipGiftUnitsFromProfile(profile, giftPayload) {
          if (giftPayload && giftPayload.giftUnits != null) {
            return Math.max(0, Number(giftPayload.giftUnits) || 0);
          }
          profile = profile && typeof profile === "object" ? profile : {};
          var cascade = Number(profile.inviteCascadePerFriend || 0);
          var free = Number(profile.inviteFreeCount || 0);
          return cascade > 0 ? cascade : free;
        }

        function osgVipGiftThbFromProfile(profile, giftPayload) {
          if (giftPayload && giftPayload.giftThb != null) {
            return Math.max(0, Number(giftPayload.giftThb) || 0);
          }
          var units = osgVipGiftUnitsFromProfile(profile, null);
          return units > 0 ? units * 59 : 0;
        }

        function osgVipGiftSenderDisplay(profile, giftPayload) {
          if (giftPayload && giftPayload.giftSenderDisplay) {
            return String(giftPayload.giftSenderDisplay).trim();
          }
          var slot = Number(profile && profile.slot || 0);
          if (slot === 55) return "Wii";
          if (slot === 56) return "Pauli";
          if (slot >= 51 && slot <= 54) {
            var lbl = String((profile && profile.label) || "").trim();
            var generic = "VIP-" + String(slot).padStart(2, "0");
            if (lbl && lbl.toUpperCase() !== generic) return lbl;
          }
          return "";
        }

        /** 18 Locales — th, en, de zuerst; Overlay aus assets/locales/{lang}.json */
        function osgLocaleJsonLangs() {
          var wl = window.OSG_WORLD_LANG;
          if (wl && wl.CORE_UI_LANGS && wl.CORE_UI_LANGS.length) {
            return wl.CORE_UI_LANGS.slice();
          }
          return [
            "th", "en", "de", "pl", "ru", "zh",
            "fr", "es", "it", "pt", "nl",
            "ar", "ja", "ko", "vi", "tr", "hi", "id",
          ];
        }

        function osgShallowCloneLocalePack(src) {
          var out = {};
          if (!src) return out;
          Object.keys(src).forEach(function (k) {
            out[k] = src[k];
          });
          return out;
        }

        function osgEnsureLocalePack(lang) {
          lang = normalizeLang(lang);
          if (T[lang]) return true;
          var seed = T.th || T.en || T.de;
          if (!seed) return false;
          T[lang] = osgShallowCloneLocalePack(seed);
          return true;
        }

        function osgVipCultureGreetPack() {
          try {
            if (typeof osgVipGiftOverlayPack === "function") {
              return osgVipGiftOverlayPack();
            }
          } catch (_) {}
          try {
            var lang = osgVipGiftOverlayUiLang();
            if (typeof T !== "undefined" && T[lang]) return T[lang];
          } catch (_) {}
          return {};
        }

        function osgAvatarCompanionPack() {
          try {
            if (typeof osgVipGiftOverlayPack === "function") {
              return osgVipGiftOverlayPack();
            }
            var lang = osgVipGiftOverlayUiLang();
            if (typeof T !== "undefined" && T[lang]) return T[lang];
          } catch (_) {}
          return {};
        }

        function osgAvatarCompanionIntroLine(pack) {
          pack = pack || osgAvatarCompanionPack();
          return String(pack.avatarCompanionIntroTts || "").trim();
        }

        function osgVipCultureLineFromPack(pack) {
          pack = pack || osgAvatarCompanionPack();
          return String(
            pack.welcome_greeting ||
              pack.welcome_greeting_pl ||
              pack.vipCultureGreetTts ||
              ""
          ).trim();
        }

        function osgVipScanPendingForAvatar() {
          try {
            if (window.__OSG_VIP_CULTURE_GREET_DONE__) return false;
            var u = new URL(window.location.href);
            if ((u.searchParams.get("osg_vip") || "").trim()) return true;
            if (window.__OSG_VIP_REDEEM_PENDING__) return true;
            if (window.__OSG_VIP_GIFT_META__) return true;
            if (window.__OSG_AVATAR_VIP_GREET_PENDING__) return true;
          } catch (_) {}
          return false;
        }

        function osgScheduleAvatarCompanionBoot(delayMs) {
          if (
            typeof window.osgPauliAudioAllowed === "function" &&
            !window.osgPauliAudioAllowed()
          ) {
            return;
          }
          if (
            window.__OSG_AVATAR_COMPANION_BOOT_RUNNING__ ||
            window.__OSG_AVATAR_COMPANION_BOOT_DONE__
          ) {
            return;
          }
          var d = typeof delayMs === "number" ? delayMs : 380;
          try {
            if (window.__OSG_AVATAR_COMPANION_BOOT_TIMER__) {
              clearTimeout(window.__OSG_AVATAR_COMPANION_BOOT_TIMER__);
            }
          } catch (_) {}
          window.__OSG_AVATAR_COMPANION_BOOT_TIMER__ = setTimeout(function () {
            window.__OSG_AVATAR_COMPANION_BOOT_TIMER__ = null;
            if (typeof window.osgAvatarCompanionBoot === "function") {
              void window.osgAvatarCompanionBoot();
            }
          }, d);
        }

        window.osgAvatarCompanionPack = osgAvatarCompanionPack;
        window.osgAvatarCompanionIntroLine = osgAvatarCompanionIntroLine;
        window.osgVipCultureLineFromPack = osgVipCultureLineFromPack;
        window.osgVipScanPendingForAvatar = osgVipScanPendingForAvatar;
        window.osgScheduleAvatarCompanionBoot = osgScheduleAvatarCompanionBoot;

        function osgVipAvatarCultureGreetDeferred(pack) {
          if (window.__OSG_VIP_CULTURE_GREET_DONE__) return;
          var line = osgVipCultureLineFromPack(pack);
          if (!line) return;
          window.__OSG_AVATAR_VIP_GREET_PENDING__ = true;
          try {
            if (pack) window.__OSG_AVATAR_VIP_GREET_PACK_SNAPSHOT__ = pack;
          } catch (_) {}
          osgScheduleAvatarCompanionBoot(480);
        }

        function osgVipGiftOverlayUiLang() {
          try {
            if (window.__OSG_CURRENT_LANG__) {
              return normalizeLang(window.__OSG_CURRENT_LANG__);
            }
          } catch (_) {}
          try {
            return normalizeLang(osgResolveBootLangRaw());
          } catch (_) {}
          return "en";
        }

        function osgVipGiftOverlayHtmlLang(code) {
          var lang = normalizeLang(code);
          if (lang === "zh") return "zh-CN";
          return lang;
        }

        function osgVipGiftOverlayPack() {
          var lang = osgVipGiftOverlayUiLang();
          try {
            if (typeof T !== "undefined" && T[lang]) return T[lang];
            if (typeof T !== "undefined" && T.en) return T.en;
          } catch (_) {}
          return {};
        }

        function osgVipGiftSenderIsFemale(profile, giftPayload, sender) {
          var slot = Number(profile && profile.slot || 0);
          if (slot === 55) return true;
          if (slot === 56) return false;
          var s = String(sender || "").trim().toLowerCase();
          if (s === "wii" || s === "chatchadapha") return true;
          if (s === "pauli") return false;
          return false;
        }

        function osgVipGiftBodyTemplate(pack, profile, giftPayload, sender) {
          if (!sender) return pack.vipGiftBodyTpl || "";
          if (osgVipGiftOverlayUiLang() === "pl") {
            if (osgVipGiftSenderIsFemale(profile, giftPayload, sender)) {
              return (
                pack.vipGiftBodyFromTplFemale ||
                pack.vipGiftBodyFromTpl ||
                ""
              );
            }
            return (
              pack.vipGiftBodyFromTplMale ||
              pack.vipGiftBodyFromTpl ||
              ""
            );
          }
          return pack.vipGiftBodyFromTpl || "";
        }

        function osgVipGiftOverlayCopy(profile, giftPayload) {
          var pack = osgVipGiftOverlayPack();
          var uiLang = osgVipGiftOverlayUiLang();
          var amount = String(osgVipGiftThbFromProfile(profile, giftPayload));
          var sender = osgVipGiftSenderDisplay(profile, giftPayload);
          var bodyTpl = osgVipGiftBodyTemplate(pack, profile, giftPayload, sender);
          var body = String(bodyTpl)
            .replace(/\{SENDER\}/g, sender)
            .replace(/\{AMOUNT\}/g, amount);
          var suffix = pack.vipGiftAmountSuffix;
          if (!suffix) {
            suffix = uiLang === "th" ? "บาท" : "THB";
          }
          return {
            brand: pack.vipGiftBrandLine || "Pauli Best Price Thailand",
            heading: pack.vipGiftHeading || "",
            welcomeLead: pack.vipGiftWelcomeLead || "",
            amountLabel: pack.vipGiftAmountLabel || "",
            amountValue: amount,
            amountSuffix: suffix,
            body: body,
            btn: pack.vipGiftContinueBtn || "",
            aria: pack.vipGiftOverlayAria || "",
            btnAria: pack.vipGiftContinueBtnAria || "",
            bodyLang: osgVipGiftOverlayHtmlLang(uiLang),
            slot: profile && profile.slot != null ? Number(profile.slot) : 0,
            sender: sender,
          };
        }

        function osgVipWireGiftOverlayOnce() {
          if (window.__OSG_VIP_GIFT_WIRED__) return;
          window.__OSG_VIP_GIFT_WIRED__ = true;
          var btn = document.getElementById("osg-vip-gift-continue-btn");
          if (btn) {
            btn.addEventListener("click", function () {
              osgVipDismissGiftOverlay();
            });
          }
        }

        function osgVipShowGiftOverlay(profile, giftPayload, pack) {
          var giftThb = osgVipGiftThbFromProfile(profile, giftPayload);
          if (giftThb <= 0) return false;
          osgVipWireGiftOverlayOnce();
          var ov = document.getElementById("osg-vip-gift-overlay");
          if (!ov) return false;
          var copy = osgVipGiftOverlayCopy(profile, giftPayload);
          var brand = document.getElementById("osg-vip-gift-brand");
          var h = document.getElementById("osg-vip-gift-heading");
          var lead = document.getElementById("osg-vip-gift-welcome-lead");
          var amtLabel = document.getElementById("osg-vip-gift-amount-label");
          var amtVal = document.getElementById("osg-vip-gift-amount-value");
          var amtSuf = document.getElementById("osg-vip-gift-amount-suffix");
          var b = document.getElementById("osg-vip-gift-body");
          var btn = document.getElementById("osg-vip-gift-continue-btn");
          if (brand) {
            brand.textContent = copy.brand || "";
            brand.hidden = !copy.brand;
          }
          if (h) h.textContent = copy.heading;
          if (lead) {
            lead.textContent = copy.welcomeLead || "";
            lead.hidden = !copy.welcomeLead;
          }
          if (amtLabel) amtLabel.textContent = copy.amountLabel || "";
          if (amtVal) amtVal.textContent = copy.amountValue || "";
          if (amtSuf) {
            amtSuf.textContent = copy.amountSuffix
              ? " " + copy.amountSuffix
              : "";
          }
          var amtWrap = document.getElementById("osg-vip-gift-amount");
          var giftPanel = ov.querySelector(".osg-vip-gift-overlay__panel");
          if (amtWrap) {
            amtWrap.classList.remove("is-waw");
            void amtWrap.offsetWidth;
            amtWrap.classList.add("is-waw");
          }
          if (giftPanel) giftPanel.classList.add("is-waw-glow");
          if (b) {
            b.textContent = copy.body;
            if (copy.bodyLang) b.setAttribute("lang", copy.bodyLang);
          }
          if (btn) {
            btn.textContent = copy.btn;
            if (copy.btnAria) btn.setAttribute("aria-label", copy.btnAria);
          }
          if (copy.aria) ov.setAttribute("aria-label", copy.aria);
          try {
            window.__OSG_VIP_GIFT_META__ = {
              slot: copy.slot,
              sender: copy.sender,
              giftThb: giftThb,
            };
          } catch (_) {}
          ov.removeAttribute("hidden");
          try {
            document.body.classList.add("osg-vip-gift-open");
            document.body.style.overflow = "hidden";
          } catch (_) {}
          if (btn) {
            try {
              btn.focus();
            } catch (_) {}
          }
          osgVipAvatarCultureGreetDeferred(osgVipGiftOverlayPack());
          return true;
        }

        function osgVipHideGiftOverlay() {
          var ov = document.getElementById("osg-vip-gift-overlay");
          if (!ov) return;
          var amtWrap = document.getElementById("osg-vip-gift-amount");
          var giftPanel = ov.querySelector(".osg-vip-gift-overlay__panel");
          if (amtWrap) amtWrap.classList.remove("is-waw");
          if (giftPanel) giftPanel.classList.remove("is-waw-glow");
          ov.setAttribute("hidden", "");
          try {
            document.body.classList.remove("osg-vip-gift-open");
            document.body.style.overflow = "";
          } catch (_) {}
        }

        function osgVipActivateUnlocked(pack) {
          osgVipSet(true);
          osgRefreshArchitectSummaries();
          osgRefreshPremiumLockUi(pack);
          osgVipEnsureLiveOps();
        }

        function osgVipFinalizeRedeem(code, profile, giftPayload, pack) {
          code = String(code || "").trim().slice(0, 64);
          pack =
            pack ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          osgVipUrlClearFail();
          if (profile && typeof profile === "object") {
            window.__OSG_VIP_PROFILE_CACHE__ = profile;
            osgVipSetSession(code, profile);
          } else {
            osgVipSetSession(code, null);
          }
          if (osgVipShowGiftOverlay(profile, giftPayload, pack)) return;
          osgVipActivateUnlocked(pack);
          osgVipAvatarCultureGreetDeferred(
            typeof osgVipGiftOverlayPack === "function"
              ? osgVipGiftOverlayPack()
              : pack
          );
          try {
            alert((pack && pack.vipRedeemOkToast) || "");
          } catch (_) {}
        }

        function osgVipDismissGiftOverlay() {
          var pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          osgVipHideGiftOverlay();
          osgVipActivateUnlocked(pack);
          try {
            alert((pack && pack.vipRedeemOkToast) || "");
          } catch (_) {}
        }

        function osgVipMaybeResumeGiftOverlay(pack) {
          if (osgVipActive()) return;
          var code = osgVipCurrentCode();
          var profile =
            window.__OSG_VIP_PROFILE_CACHE__ || osgVipLoadProfileCached();
          if (!code || !profile) return;
          osgVipShowGiftOverlay(profile, null, pack);
        }

        function osgSanitizePayoutAccount(raw) {
          try {
            return String(raw || "")
              .replace(/\D/g, "")
              .slice(0, 24);
          } catch (_) {
            return "";
          }
        }

        function osgLoadPayoutAccountIntoInput(inp) {
          if (!inp) return;
          var po = osgPickProfileObject();
          inp.value = po && po.payoutAccountNumber ? String(po.payoutAccountNumber) : "";
        }

        function osgPostTrialPaid() {
          try {
            return localStorage.getItem(OSG_LS_POST_TRIAL_PAID) === "1";
          } catch (_) {
            return false;
          }
        }

        function osgSetPostTrialPaid(on) {
          try {
            if (on) localStorage.setItem(OSG_LS_POST_TRIAL_PAID, "1");
            else localStorage.removeItem(OSG_LS_POST_TRIAL_PAID);
          } catch (_) {}
        }

        /** Vollzugriff: Trial aktiv, Referral‑Lifetime, VIP oder Demo‑Override (lokal). */
        function osgPremiumAccessUnlocked() {
          return (
            osgVipActive() ||
            osgLifetimeUnlocked() ||
            osgPostTrialPaid() ||
            osgTrialIsActiveNow()
          );
        }

        function osgAvatarMonetizationApi() {
          return window.OSG_PauliAvatarMonetization || null;
        }

        function osgAvatarAccessStatus(opts) {
          var api = osgAvatarMonetizationApi();
          if (!api || typeof api.resolveAvatarAccess !== "function") {
            return { avatarActive: true, statusCode: "MODULE_MISSING" };
          }
          return api.resolveAvatarAccess(opts || {});
        }

        /** Pauli-Avatar: 90-Tage-Test, Erweiterung, Referrals oder soziale Befreiung. */
        function osgAvatarAccessUnlocked(opts) {
          return !!osgAvatarAccessStatus(opts).avatarActive;
        }

        function osgAvatarFormatPriceThb(n) {
          var v = Number(n);
          if (!Number.isFinite(v)) {
            var c =
              window.OSG_AVATAR_MONETIZATION &&
              window.OSG_AVATAR_MONETIZATION.AVATAR_EXTENSION_PRICE_THB;
            v = Number(c) || 49.9;
          }
          return v.toFixed(2);
        }

        function osgAvatarResolveMessage(pack, status) {
          pack = pack || {};
          status = status || {};
          if (status.messageKey && pack[status.messageKey]) {
            var tpl = String(pack[status.messageKey]);
            if (status.daysRemaining != null) {
              return tpl.replace(/\{DAYS\}/g, String(status.daysRemaining));
            }
            return tpl;
          }
          if (status.infoTextKey && pack[status.infoTextKey]) {
            return String(pack[status.infoTextKey]);
          }
          return "";
        }

        function osgRefreshAvatarLockUi(pack, opts) {
          opts = opts || {};
          pack =
            pack ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          var status = osgAvatarAccessStatus();
          var active = !!status.avatarActive;
          var coin = document.getElementById("coin-stage");
          var modal = document.getElementById("osg-avatar-pay-modal");
          var wake = document.getElementById("pauli-voice-wake-btn");
          if (coin) {
            coin.classList.toggle("osg-avatar-locked", !active);
            coin.setAttribute("aria-disabled", active ? "false" : "true");
          }
          if (wake) wake.hidden = !active;
          if (
            window.OSG_PauliAvatarAnimations &&
            typeof window.OSG_PauliAvatarAnimations.refreshLockState ===
              "function"
          ) {
            window.OSG_PauliAvatarAnimations.refreshLockState(!active);
          }
          if (!modal) return;
          if (active) {
            modal.setAttribute("hidden", "");
            window.__OSG_AVATAR_PAY_MODAL_OPEN__ = false;
            var api = osgAvatarMonetizationApi();
            if (api && typeof api.bindDeviceOnce === "function") {
              var dev = api.DeviceFingerprinter.getLocalDeviceId();
              if (dev) api.bindDeviceOnce(dev);
            }
            return;
          }
          var titleEl = document.getElementById("osg-avatar-pay-modal-title");
          var closeBtn = document.getElementById("osg-avatar-pay-modal-close");
          var msg = modal.querySelector(".osg-avatar-lock-banner__msg");
          var price = modal.querySelector(".osg-avatar-lock-banner__price");
          var refEl = modal.querySelector(".osg-avatar-lock-banner__referral");
          if (titleEl && pack.avatarPayModalTitle) {
            titleEl.textContent = pack.avatarPayModalTitle;
          }
          if (closeBtn && pack.avatarPayModalCloseLabel) {
            closeBtn.setAttribute("aria-label", pack.avatarPayModalCloseLabel);
          }
          if (msg) msg.textContent = osgAvatarResolveMessage(pack, status);
          if (price && pack.avatarExtensionPriceTpl) {
            price.textContent = String(pack.avatarExtensionPriceTpl).replace(
              /\{PRICE\}/g,
              osgAvatarFormatPriceThb(status.upgradeCostThb)
            );
          } else if (price) {
            price.textContent = "";
          }
          if (refEl && pack.avatarReferralProgressTpl) {
            refEl.textContent = String(pack.avatarReferralProgressTpl)
              .replace(/\{COUNT\}/g, String(status.qualifiedReferrals || 0))
              .replace(
                /\{TARGET\}/g,
                String(status.referralTarget || 3)
              );
          } else if (refEl) {
            refEl.textContent = "";
          }
          if (pack.avatarLockAriaLabel) {
            modal.setAttribute("aria-label", pack.avatarLockAriaLabel);
          }
        }

        function osgPopulateAvatarPayModal() {
          osgRefreshAvatarLockUi();
        }
        window.osgPopulateAvatarPayModal = osgPopulateAvatarPayModal;

        function osgSyncAvatarStatusFromServer() {
          var api = osgAvatarMonetizationApi();
          if (!api || !navigator.onLine) return Promise.resolve(null);
          var userRef =
            typeof osgEnsureCustomerId === "function"
              ? osgEnsureCustomerId()
              : "";
          var bundle =
            typeof osgLoadInstallBundle === "function"
              ? osgLoadInstallBundle() || {}
              : {};
          var reg = String(
            bundle.installedAtISO || bundle.firstOpenISO || ""
          ).slice(0, 10);
          var deviceId = api.DeviceFingerprinter.getLocalDeviceId();
          var extensionPaid = false;
          try {
            extensionPaid =
              localStorage.getItem("osg-avatar-extension-paid-v1") === "1";
          } catch (_) {}
          return osgApiFetch("/api/avatar/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userRef: userRef,
              registrationDate: reg,
              deviceId: deviceId,
              extensionPaid: extensionPaid,
            }),
          })
            .then(function (r) {
              return r.ok ? r.json() : null;
            })
            .then(function (j) {
              if (!j) return null;
              if (
                j.qualifiedReferrals != null &&
                typeof api.setQualifiedReferralCount === "function"
              ) {
                api.setQualifiedReferralCount(j.qualifiedReferrals);
              }
              if (
                j.statusCode === "SOCIAL_EXEMPTION_GRANTED" &&
                typeof api.setSocialExempt === "function"
              ) {
                api.setSocialExempt(true, "disability_card", "server-sync");
              }
              if (deviceId && typeof api.bindDeviceOnce === "function") {
                api.bindDeviceOnce(deviceId);
              }
              osgRefreshAvatarLockUi();
              return j;
            })
            .catch(function () {
              return null;
            });
        }

        function osgCaptureAvatarReferralParent(refCode) {
          refCode = String(refCode || "").trim().slice(0, 96);
          if (!refCode || refCode === osgOwnReferralCode()) return;
          try {
            localStorage.setItem(OSG_LS_AVATAR_PENDING_PARENT, refCode);
          } catch (_) {}
        }

        function osgAvatarClaimReferralPurchaseOnce() {
          var api = osgAvatarMonetizationApi();
          if (!api || !navigator.onLine) return;
          var parentRef = "";
          try {
            parentRef = String(
              localStorage.getItem(OSG_LS_AVATAR_PENDING_PARENT) || ""
            ).trim();
          } catch (_) {}
          if (!parentRef) {
            try {
              var u = new URL(window.location.href);
              parentRef = (u.searchParams.get("osg_ref") || "").trim();
            } catch (_) {}
          }
          if (!parentRef || parentRef === osgOwnReferralCode()) return;
          var cid =
            typeof osgEnsureCustomerId === "function"
              ? osgEnsureCustomerId()
              : "";
          var bundle =
            typeof osgLoadInstallBundle === "function"
              ? osgLoadInstallBundle() || {}
              : {};
          var childDevice = String(
            bundle.deviceHardwareId || bundle.deviceAnchorHex || ""
          ).slice(0, 96);
          var parentDevice = "";
          try {
            parentDevice = String(
              localStorage.getItem("osg-avatar-device-bound-v1") || ""
            ).slice(0, 96);
          } catch (_) {}
          var sentinel = cid + "|" + parentRef + "|purchase";
          try {
            if (localStorage.getItem(OSG_LS_AVATAR_REF_CLAIM_SENT) === sentinel)
              return;
          } catch (_) {}
          osgApiFetch("/api/avatar/referral/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parentRef: parentRef,
              childRef: cid,
              childCid: cid,
              childDeviceAnchor: childDevice,
              parentDeviceAnchor: parentDevice,
              purchaseVerified: true,
            }),
          })
            .then(function (r) {
              return r.ok ? r.json() : null;
            })
            .then(function (j) {
              if (!j || !j.referralValid) return;
              try {
                localStorage.setItem(OSG_LS_AVATAR_REF_CLAIM_SENT, sentinel);
              } catch (_) {}
              osgRefreshAvatarLockUi();
            })
            .catch(function () {});
        }

        window.osgAvatarAccessUnlocked = osgAvatarAccessUnlocked;
        window.osgAvatarAccessStatus = osgAvatarAccessStatus;
        window.osgRefreshAvatarLockUi = osgRefreshAvatarLockUi;
        window.osgSyncAvatarStatusFromServer = osgSyncAvatarStatusFromServer;
        window.osgAvatarClaimReferralPurchaseOnce = osgAvatarClaimReferralPurchaseOnce;

        function osgLifetimeUnlocked() {
          try {
            return localStorage.getItem(OSG_LS_REF_LIFETIME) === "1";
          } catch (_) {
            return false;
          }
        }

        function osgLifetimeSet(on) {
          try {
            if (on) localStorage.setItem(OSG_LS_REF_LIFETIME, "1");
            else localStorage.removeItem(OSG_LS_REF_LIFETIME);
          } catch (_) {}
        }

        function osgPurchasedSilenceActive() {
          try {
            return localStorage.getItem(OSG_LS_PUSH_COMMERCE_SILENCE) === "1";
          } catch (_) {
            return false;
          }
        }

        function osgSetPurchasedSilence() {
          try {
            localStorage.setItem(OSG_LS_PUSH_COMMERCE_SILENCE, "1");
          } catch (_) {}
        }

        /**
         * Irregular cadence: start after 24h (Tag 2), then ≤ fires over a 5-day window,
         * random 18–26h spacing (simulates human outreach).
         */
        var OSG_HUMAN_PUSH_BURST_MAX = 6;
        /** Tag-2 + 5 Tage Preis-/Push-Kampagne */
        var OSG_HUMAN_PUSH_PHASE_DAYS = 5;

        function osgHumanPushPhaseEndMs() {
          var b = osgEnsureArchInstall();
          var installMs = Date.parse(String(b.installedAtISO || ""));
          if (!isFinite(installMs)) return 0;
          return (
            installMs +
            24 * 3600000 +
            OSG_HUMAN_PUSH_PHASE_DAYS * 24 * 3600000
          );
        }

        function osgHumanPushStateRead() {
          try {
            var raw = localStorage.getItem(OSG_LS_PUSH_STAGE);
            var o = raw ? JSON.parse(raw) : null;
            if (!o || typeof o !== "object") o = {};
            return {
              n: Math.max(0, Number(o.n) || 0),
              next: Math.max(0, Number(o.next) || 0),
            };
          } catch (_) {
            return { n: 0, next: 0 };
          }
        }

        function osgHumanPushStateWrite(st) {
          try {
            localStorage.setItem(OSG_LS_PUSH_STAGE, JSON.stringify(st));
          } catch (_) {}
        }

        function osgHumanPushRandomGapMs() {
          return Math.round((18 + Math.random() * 8) * 3600000);
        }

        function osgHumanPushMayFireNow(now) {
          now = typeof now === "number" ? now : Date.now();
          if (osgPurchasedSilenceActive()) return false;
          var b = osgEnsureArchInstall();
          var installMs = Date.parse(String(b.installedAtISO || ""));
          if (!isFinite(installMs)) return false;
          if (
            now >= osgTrialEndsMs() &&
            !osgLifetimeUnlocked() &&
            !osgPostTrialPaid() &&
            !osgVipActive()
          )
            return false;
          var phaseEnd = osgHumanPushPhaseEndMs();
          if (phaseEnd && now >= phaseEnd) return false;
          var st = osgHumanPushStateRead();
          if (st.n >= OSG_HUMAN_PUSH_BURST_MAX) return false;
          var after24h = installMs + 24 * 3600000;
          if (now < after24h) return false;
          if (st.n === 0) return true;
          return now >= st.next;
        }

        function osgHumanPushRecordFired(now) {
          now = typeof now === "number" ? now : Date.now();
          var st = osgHumanPushStateRead();
          st.n = (Number(st.n) || 0) + 1;
          st.last = now;
          st.next = now + osgHumanPushRandomGapMs();
          osgHumanPushStateWrite(st);
        }

        function osgLoadInterestWeights() {
          try {
            var r = localStorage.getItem(OSG_LS_INTEREST_WEIGHTS);
            var o = r ? JSON.parse(r) : {};
            return o && typeof o === "object" ? o : {};
          } catch (_) {
            return {};
          }
        }

        function osgInterestBump(kwRaw) {
          var kw =
            kwRaw == null ? "" : String(kwRaw).replace(/\u0000/g, "").trim();
          if (!kw) return;
          kw = kw.slice(0, 80);
          try {
            var cur = osgLoadInterestWeights();
            cur[kw] = (Number(cur[kw]) || 0) + 1;
            var keys = Object.keys(cur).sort(function (a, b) {
              return (Number(cur[b]) || 0) - (Number(cur[a]) || 0);
            });
            var slim = {};
            for (var i = 0; i < keys.length && i < 32; i++) {
              slim[keys[i]] = cur[keys[i]];
            }
            localStorage.setItem(
              OSG_LS_INTEREST_WEIGHTS,
              JSON.stringify(slim)
            );
          } catch (_) {}
        }

        function osgInterestTopKeyword() {
          var o = osgLoadInterestWeights();
          var ks = Object.keys(o);
          if (!ks.length) return "";
          ks.sort(function (a, b) {
            return (Number(o[b]) || 0) - (Number(o[a]) || 0);
          });
          return ks[0] || "";
        }

        function osgProductMuteLoad() {
          try {
            var r = localStorage.getItem(OSG_LS_PUSH_PRODUCT_MUTE);
            var x = r ? JSON.parse(r) : {};
            return x && typeof x === "object" ? x : {};
          } catch (_) {
            return {};
          }
        }

        function osgProductMuteSave(obj) {
          try {
            localStorage.setItem(
              OSG_LS_PUSH_PRODUCT_MUTE,
              JSON.stringify(obj || {})
            );
          } catch (_) {}
        }

        /** Höchstes noch nicht „gekauft“-stummgeschaltetes Interesse (Push-Zusatz). */
        function osgInterestTopKeywordUnmuted() {
          var w = osgLoadInterestWeights();
          var muted = osgProductMuteLoad();
          var ks = Object.keys(w).sort(function (a, b) {
            return (Number(w[b]) || 0) - (Number(w[a]) || 0);
          });
          for (var i = 0; i < ks.length; i++) {
            if (!muted[ks[i]]) return ks[i];
          }
          return "";
        }

        /** Nach Marktplatz-Kauf: stärkstes Interessensignal stummschalten — keine weiteren Nudges dafür. */
        function osgMutePurchasedProductInterests() {
          var weights = osgLoadInterestWeights();
          var muted = osgProductMuteLoad();
          var ks = Object.keys(weights).sort(function (a, b) {
            return (Number(weights[b]) || 0) - (Number(weights[a]) || 0);
          });
          var stamp = new Date().toISOString();
          var muteKey = ks.length ? ks[0] : "";
          if (muteKey) muted[muteKey] = stamp;
          else muted.marketplace_purchase_generic = stamp;
          osgProductMuteSave(muted);
        }

        try {
          window.__osgInterestTopKeywordUnmuted = osgInterestTopKeywordUnmuted;
        } catch (_) {}

        /** Konservativ: echte revolving-Kohort nur wenige Muster — sonst Prepaid-/Debit-Warnpfad */
        function osgThinBinFingerprint(digits) {
          var bin = String(digits || "").replace(/\D/g, "");
          if (bin.length < 6) return null;
          var six = bin.slice(0, 6);
          var head = six.charAt(0);
          if (/^(479|455|438|478)/.test(six))
            return {
              tier: "non_credit",
              issuer: "Kasikornbank (KBank) und ähnliche BINs",
            };
          if (/^(540|542|547)/.test(six))
            return {
              tier: "credit",
              issuer: "Krungsri / Bank of Ayudhya",
            };
          if (/^(373|379)/.test(six))
            return { tier: "credit", issuer: "American Express" };
          if (head === "4")
            return {
              tier: "non_credit",
              issuer:
                "Visa (BIN allein oft nicht zweifelsfrei – häufig Debit/Prepaid)",
            };
          if (head === "5")
            return {
              tier: "non_credit",
              issuer:
                "Mastercard (BIN allein oft nicht zweifelsfrei – häufig Debit/Prepaid)",
            };
          if (head === "3")
            return {
              tier: "non_credit",
              issuer: "American Express/JCB‑Nähe – bitte bei der Bank nachfragen",
            };
          return { tier: "unknown", issuer: "Unbekanntes BIN‑Segment" };
        }

        function osgFetchInstallFingerprintDeferred() {
          function run() {
            try {
              if (!navigator.onLine) return;
              var bb = osgLoadInstallBundle() || osgEnsureArchInstall();
              if (
                bb &&
                bb.ipFingerprint &&
                String(bb.ipFingerprint).length >= 16
              )
                return;
            } catch (_) {}
            osgApiFetch("/api/install-fingerprint", { cache: "no-store" })
              .then(function (r) {
                return r.ok ? r.json() : null;
              })
              .then(function (data) {
                if (!data || !data.ipFingerprint) return;
                var b = osgLoadInstallBundle() || osgEnsureArchInstall();
                b.ipFingerprint = String(data.ipFingerprint).slice(0, 48);
                b.ipFingerprintSchema = String(data.schema || "").slice(0, 48);
                b.ipFingerprintAtISO = new Date().toISOString();
                osgSaveInstallBundle(b);
                try {
                  osgRefreshArchitectSummaries();
                } catch (_) {}
              })
              .catch(function () {});
          }
          try {
            setTimeout(run, 500);
          } catch (_) {
            run();
          }
          try {
            window.addEventListener("online", run, false);
          } catch (_) {}
        }

        function osgAlertRateLimitedIfSo(res, pack) {
          if (!res || res.status !== 429) return false;
          pack =
            pack ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          try {
            var msg =
              (pack && (pack.apiRateLimitedToast || pack.pauliChatError)) || "";
            if (msg) alert(msg);
          } catch (_) {}
          return true;
        }

        function osgVipUrlParamShouldSkip(code) {
          try {
            var raw = localStorage.getItem(OSG_LS_VIP_URL_FAIL);
            if (!raw) return false;
            var o = JSON.parse(raw);
            if (!o || String(o.c || "") !== String(code)) return false;
            var t = Number(o.t) || 0;
            if (Date.now() - t > 86400000) {
              localStorage.removeItem(OSG_LS_VIP_URL_FAIL);
              return false;
            }
            return !!o.fail;
          } catch (_) {
            return false;
          }
        }

        function osgVipUrlMarkFail(code) {
          try {
            localStorage.setItem(
              OSG_LS_VIP_URL_FAIL,
              JSON.stringify({
                c: String(code),
                t: Date.now(),
                fail: true,
              })
            );
          } catch (_) {}
        }

        function osgVipUrlClearFail() {
          try {
            localStorage.removeItem(OSG_LS_VIP_URL_FAIL);
          } catch (_) {}
        }

        function osgVipLoadProfileCached() {
          try {
            var raw = localStorage.getItem(OSG_LS_VIP_PROFILE);
            if (!raw) return null;
            var p = JSON.parse(raw);
            return p && typeof p === "object" ? p : null;
          } catch (_) {
            return null;
          }
        }

        function osgVipCurrentCode() {
          try {
            var c = String(localStorage.getItem(OSG_LS_VIP_CODE) || "").trim();
            return c ? c.slice(0, 64) : "";
          } catch (_) {
            return "";
          }
        }

        function osgVipSetSession(code, profile) {
          code = String(code || "").trim().slice(0, 64);
          if (!code) return;
          try {
            localStorage.setItem(OSG_LS_VIP_CODE, code);
          } catch (_) {}
          if (profile && typeof profile === "object") {
            try {
              localStorage.setItem(OSG_LS_VIP_PROFILE, JSON.stringify(profile));
            } catch (_) {}
          }
        }

        function osgVipDeviceAnchor() {
          try {
            osgEnsureArchInstall();
            osgEnsureInstallDeviceAnchor();
          } catch (_) {}
          var b = osgLoadInstallBundle() || {};
          var anchor = String(
            b.deviceHardwareId ||
              b.deviceAnchorHex ||
              b.ipFingerprint ||
              osgEnsureCustomerId() ||
              ""
          )
            .trim()
            .slice(0, 120);
          if (anchor.length >= 12) return anchor;
          return "";
        }

        function osgVipPostEvent(eventType, extra) {
          var code = osgVipCurrentCode();
          if (!code || !osgVipActive() || !navigator.onLine) return;
          extra = extra && typeof extra === "object" ? extra : {};
          try {
            osgApiFetch("/api/vip/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: code,
                eventType: String(eventType || "").trim(),
                store: String(extra.store || "app").trim().slice(0, 64),
                amountThb: Number(extra.amountThb || 0),
                channel: String(extra.channel || osgClientChannel()).trim().slice(0, 64),
              }),
              keepalive: true,
            }).catch(function () {});
          } catch (_) {}
        }

        function osgVipTrackDownloadOnce() {
          var code = osgVipCurrentCode();
          if (!code || !osgVipActive()) return;
          try {
            var raw = localStorage.getItem(OSG_LS_VIP_DOWNLOAD_SENT);
            var sent = raw ? JSON.parse(raw) : {};
            if (sent && sent[code]) return;
            if (!sent || typeof sent !== "object") sent = {};
            sent[code] = Date.now();
            localStorage.setItem(OSG_LS_VIP_DOWNLOAD_SENT, JSON.stringify(sent));
          } catch (_) {}
          osgVipPostEvent("download", { store: "app_install", channel: "app" });
        }

        var __osgVipLastServiceUseMs = 0;
        function osgVipMaybeTrackServiceUse() {
          if (!osgVipActive()) return;
          var now = Date.now();
          if (now - __osgVipLastServiceUseMs < 5 * 60 * 1000) return;
          __osgVipLastServiceUseMs = now;
          osgVipPostEvent("service_use", { store: "app_runtime", channel: "app" });
        }

        var __osgVipPingTimer = 0;
        var __osgVipStatsTimer = 0;
        var __osgVipVisibilityWired = false;

        function osgVipPingOnce() {
          var code = osgVipCurrentCode();
          var anchor = osgVipDeviceAnchor();
          if (!code || !anchor || !osgVipActive() || !navigator.onLine) return;
          try {
            osgApiFetch("/api/vip/ping", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: code,
                deviceAnchor: anchor,
              }),
              keepalive: true,
            }).catch(function () {});
          } catch (_) {}
        }

        function osgVipGroupMeta(profile, pack) {
          profile = profile && typeof profile === "object" ? profile : {};
          pack = pack || {};
          var slot = Number(profile.slot || 0);
          var role = String(profile.role || "").trim().toLowerCase();
          var key = "friends_core";
          var color = "#cd7f32";
          var label =
            pack.vipGroupFriendsCore || "Friends Core";

          if (slot >= 55 || role === "wii_owner" || role === "pauli_owner") {
            key = "owners";
            color = "#7b5cff";
            label = pack.vipGroupOwners || "Wii + Pauli";
          } else if (slot >= 51 || role === "family_special") {
            key = "family_special";
            color = "#2f9e44";
            label = pack.vipGroupFamily || "Family";
          } else if (slot >= 41 || role === "vip_influencer") {
            key = "vip_influencer";
            color = "#b8933f";
            label = pack.vipGroupVipInfluencer || "VIP Influencer";
          } else if (slot >= 31 || role === "influencer") {
            key = "influencer";
            color = "#a8adb4";
            label = pack.vipGroupInfluencer || "Influencer";
          }
          return { key: key, color: color, label: String(label || "") };
        }

        function osgVipRenderLiveWidget() {
          var wrap = document.getElementById("vip-live-wrap");
          if (!wrap) return;
          var pack = window.__OSG_CURRENT_PACK_CACHE || T.de || {};
          var code = osgVipCurrentCode();
          var profile =
            window.__OSG_VIP_PROFILE_CACHE__ || osgVipLoadProfileCached() || null;
          var stats = window.__OSG_VIP_LAST_STATS__ || null;
          if (!osgVipActive() || !code) {
            wrap.setAttribute("hidden", "");
            return;
          }
          wrap.removeAttribute("hidden");
          var h = document.getElementById("vip-live-heading");
          var role = document.getElementById("vip-live-role");
          var c1 = document.getElementById("vip-live-counters");
          var c2 = document.getElementById("vip-live-online");
          var c3 = document.getElementById("vip-live-revenue");
          var c4 = document.getElementById("vip-live-extra");
          var badgeLine = document.getElementById("vip-live-badge-line");
          var badgeEl = document.getElementById("vip-live-group-badge");
          var wiiEl = document.getElementById("vip-live-wii");
          var pauliTotalsEl = document.getElementById("vip-live-pauli-totals");
          var pauliRankingEl = document.getElementById("vip-live-pauli-ranking");
          var pauliStoresEl = document.getElementById("vip-live-pauli-stores");
          var emailStatusEl = document.getElementById("vip-live-email-status");
          if (h) h.textContent = pack.vipLiveHeading || "";
          if (wrap && pack.vipLiveWrapAria)
            wrap.setAttribute("aria-label", pack.vipLiveWrapAria);
          if (badgeLine && badgeEl) {
            var groupMeta = osgVipGroupMeta(profile, pack);
            badgeEl.className = "vip-group-badge vip-group-badge--" + groupMeta.key;
            badgeEl.style.setProperty("--vip-badge-color", groupMeta.color);
            badgeEl.textContent = String(pack.vipGroupBadgeTpl || "")
              .replace(/\{GROUP\}/g, groupMeta.label || "");
            if (pack.vipGroupBadgeAria) {
              badgeEl.setAttribute(
                "aria-label",
                String(pack.vipGroupBadgeAria).replace(
                  /\{GROUP\}/g,
                  groupMeta.label || ""
                )
              );
            }
            badgeLine.removeAttribute("hidden");
          }
          if (role) {
            role.textContent = String(pack.vipLiveRoleTpl || "")
              .replace(/\{LABEL\}/g, String((profile && profile.label) || code))
              .replace(
                /\{SLOT\}/g,
                String(profile && profile.slot != null ? profile.slot : "—")
              )
              .replace(/\{ROLE\}/g, String((profile && profile.role) || "vip"));
          }
          var st = stats && stats.stats ? stats.stats : {};
          var dl = Number(st.downloads || 0);
          var pu = Number(st.purchases || 0);
          var su = Number(st.serviceUses || 0);
          if (c1)
            c1.textContent = String(pack.vipLiveCountersTpl || "")
              .replace(/\{DOWNLOADS\}/g, String(dl))
              .replace(/\{PURCHASES\}/g, String(pu))
              .replace(/\{SERVICE\}/g, String(su));
          if (c2)
            c2.textContent = String(pack.vipLiveOnlineTpl || "")
              .replace(/\{ONLINE\}/g, String(Number(stats && stats.onlineNow) || 0))
              .replace(
                /\{WINDOWSEC\}/g,
                String(Number(stats && stats.activeWindowSec) || 0)
              );
          if (c3)
            c3.textContent = String(pack.vipLiveRevenueTpl || "")
              .replace(
                /\{REVENUE\}/g,
                String(
                  Number(
                    st && st.revenueThb != null ? Number(st.revenueThb).toFixed(2) : 0
                  )
                )
              )
              .replace(
                /\{COMMISSION\}/g,
                String(
                  Number(
                    st && st.commissionThb != null
                      ? Number(st.commissionThb).toFixed(2)
                      : 0
                  )
                )
              );
          var extraLine = "";
          if (stats && stats.scope === "all") {
            extraLine = String(pack.vipLiveGlobalTpl || "").replace(
              /\{GLOBALONLINE\}/g,
              String(Number(stats.globalOnlineNow) || 0)
            );
          }
          if (
            stats &&
            stats.pauliDashboard &&
            stats.pauliDashboard.ranking &&
            Array.isArray(stats.pauliDashboard.ranking.today) &&
            stats.pauliDashboard.ranking.today.length
          ) {
            var top = stats.pauliDashboard.ranking.today[0];
            if (top && top.code) {
              extraLine +=
                (extraLine ? " · " : "") +
                String(pack.vipLiveTopRankTpl || "")
                  .replace(/\{CODE\}/g, String(top.code))
                  .replace(/\{PURCHASES\}/g, String(Number(top.purchases) || 0))
                  .replace(
                    /\{COMMISSION\}/g,
                    String(
                      Number(
                        top.commissionThb != null
                          ? Number(top.commissionThb).toFixed(2)
                          : 0
                      )
                    )
                  );
            }
          }
          if (c4) c4.textContent = extraLine;

          if (wiiEl) {
            wiiEl.textContent = "";
            wiiEl.setAttribute("hidden", "");
          }
          if (pauliTotalsEl) {
            pauliTotalsEl.textContent = "";
            pauliTotalsEl.setAttribute("hidden", "");
          }
          if (pauliRankingEl) {
            pauliRankingEl.textContent = "";
            pauliRankingEl.setAttribute("hidden", "");
          }
          if (pauliStoresEl) {
            pauliStoresEl.textContent = "";
            pauliStoresEl.setAttribute("hidden", "");
          }

          if (stats && stats.wiiDashboard && wiiEl) {
            var wd = stats.wiiDashboard || {};
            wiiEl.textContent = String(pack.vipLiveWiiTpl || "")
              .replace(/\{ONLINE\}/g, String(Number(wd.onlineNow) || 0))
              .replace(/\{DOWNLOADS\}/g, String(Number(wd.downloads) || 0))
              .replace(/\{PURCHASES\}/g, String(Number(wd.purchases) || 0));
            wiiEl.removeAttribute("hidden");
          }

          if (stats && stats.pauliDashboard) {
            var pd = stats.pauliDashboard || {};
            var totals = pd.totals || {};
            if (pauliTotalsEl) {
              pauliTotalsEl.textContent = String(pack.vipLivePauliTotalsTpl || "")
                .replace(/\{DOWNLOADS\}/g, String(Number(totals.downloads) || 0))
                .replace(/\{PURCHASES\}/g, String(Number(totals.purchases) || 0))
                .replace(
                  /\{SERVICE\}/g,
                  String(Number(totals.serviceUses) || 0)
                )
                .replace(
                  /\{REVENUE\}/g,
                  String(
                    Number(
                      totals.revenueThb != null ? Number(totals.revenueThb).toFixed(2) : 0
                    )
                  )
                )
                .replace(
                  /\{COMMISSION\}/g,
                  String(
                    Number(
                      totals.commissionThb != null
                        ? Number(totals.commissionThb).toFixed(2)
                        : 0
                    )
                  )
                );
              pauliTotalsEl.removeAttribute("hidden");
            }

            var rk = pd.ranking || {};
            if (pauliRankingEl) {
              function topCode(periodRows) {
                if (!Array.isArray(periodRows) || !periodRows.length) return "-";
                return String(periodRows[0].code || "-");
              }
              pauliRankingEl.textContent = String(pack.vipLivePauliRankingTpl || "")
                .replace(/\{TODAY\}/g, topCode(rk.today))
                .replace(/\{WEEK\}/g, topCode(rk.week))
                .replace(/\{MONTH\}/g, topCode(rk.month))
                .replace(/\{YEAR\}/g, topCode(rk.year))
                .replace(/\{ALL\}/g, topCode(rk.all));
              pauliRankingEl.removeAttribute("hidden");
            }

            if (pauliStoresEl) {
              var byStore = pd.byStore || {};
              var topStores = Object.keys(byStore)
                .map(function (k) {
                  var row = byStore[k] || {};
                  return {
                    k: k,
                    p: Number(row.purchases) || 0,
                    d: Number(row.downloads) || 0,
                  };
                })
                .sort(function (a, b) {
                  return b.p - a.p || b.d - a.d;
                })
                .slice(0, 3)
                .map(function (x) {
                  return x.k + " (" + x.p + "/" + x.d + ")";
                });
              pauliStoresEl.textContent = String(pack.vipLivePauliStoresTpl || "").replace(
                /\{TOP\}/g,
                topStores.length ? topStores.join(", ") : "-"
              );
              pauliStoresEl.removeAttribute("hidden");
            }
          }

          if (emailStatusEl) {
            var ownerSlot =
              profile && (profile.slot === 55 || profile.slot === 56);
            var emailSys =
              (stats && stats.emailSystem) ||
              (stats &&
                stats.wiiDashboard &&
                stats.wiiDashboard.emailSystem) ||
              (stats &&
                stats.pauliDashboard &&
                stats.pauliDashboard.emailSystem) ||
              null;
            if (ownerSlot && emailSys && typeof emailSys === "object") {
              var isCritical = !!emailSys.critical || emailSys.level === "critical";
              var tpl = isCritical
                ? pack.vipLiveEmailStatusCriticalTpl
                : pack.vipLiveEmailStatusOkTpl;
              var errBit = String(emailSys.lastError || "").slice(0, 120);
              emailStatusEl.textContent = String(tpl || "")
                .replace(/\{ERROR\}/g, errBit || "—")
                .replace(/\{LABEL\}/g, String(emailSys.label || ""));
              emailStatusEl.className = isCritical
                ? "pickup-mode-hint vip-live-email-status vip-live-email-status--critical"
                : "pickup-mode-hint vip-live-email-status";
              emailStatusEl.removeAttribute("hidden");
            } else {
              emailStatusEl.textContent = "";
              emailStatusEl.setAttribute("hidden", "");
            }
          }
        }

        function osgVipFetchStatsOnce() {
          var code = osgVipCurrentCode();
          if (!code || !osgVipActive() || !navigator.onLine) return;
          var profile =
            window.__OSG_VIP_PROFILE_CACHE__ || osgVipLoadProfileCached() || {};
          var scope = profile && profile.canViewAllStats ? "all" : "self";
          osgApiFetch(
            "/api/vip/stats?code=" +
              encodeURIComponent(code) +
              "&scope=" +
              encodeURIComponent(scope),
            { cache: "no-store" }
          )
            .then(function (r) {
              return r.ok ? r.json() : null;
            })
            .then(function (j) {
              if (!j || !j.ok) return;
              window.__OSG_VIP_LAST_STATS__ = j;
              if (j.profile && typeof j.profile === "object") {
                window.__OSG_VIP_PROFILE_CACHE__ = j.profile;
                osgVipSetSession(code, j.profile);
              }
              osgVipRenderLiveWidget();
            })
            .catch(function () {});
        }

        function osgVipEnsureLiveOps() {
          osgVipTrackDownloadOnce();
          osgVipMaybeTrackServiceUse();
          osgVipPingOnce();
          osgVipFetchStatsOnce();
          if (!__osgVipPingTimer) {
            try {
              __osgVipPingTimer = setInterval(function () {
                osgVipPingOnce();
                osgVipMaybeTrackServiceUse();
              }, 65000);
            } catch (_) {}
          }
          if (!__osgVipStatsTimer) {
            try {
              __osgVipStatsTimer = setInterval(function () {
                osgVipFetchStatsOnce();
              }, 45000);
            } catch (_) {}
          }
          if (!__osgVipVisibilityWired) {
            __osgVipVisibilityWired = true;
            try {
              document.addEventListener(
                "visibilitychange",
                function () {
                  if (document.visibilityState !== "visible") return;
                  osgVipPingOnce();
                  osgVipFetchStatsOnce();
                },
                false
              );
            } catch (_) {}
          }
        }

        function osgConsumeReferralParamOnce() {
          try {
            var u = new URL(window.location.href);
            var ref = (u.searchParams.get("osg_ref") || "").trim();
            if (!ref || ref === osgOwnReferralCode()) return;
            osgCaptureAvatarReferralParent(ref);
            var cid = osgEnsureCustomerId();
            try {
              osgEnsureInstallDeviceAnchor();
            } catch (_) {}
            var bundle = osgLoadInstallBundle() || {};
            var anchorRaw =
              bundle.deviceHardwareId || bundle.deviceAnchorHex || "";
            var childDeviceAnchor = String(anchorRaw || "").slice(0, 96);
            var sentinel = cid + "|" + ref.slice(0, 96);
            if (localStorage.getItem(OSG_LS_REF_CLAIM_SENT) === sentinel)
              return;
            if (!navigator.onLine) return;
            osgApiFetch("/api/referral/claim", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                parentRef: ref.slice(0, 96),
                childCid: cid,
                childDeviceAnchor: childDeviceAnchor,
              }),
            })
              .then(function (r) {
                if (osgAlertRateLimitedIfSo(r)) {
                  return Promise.reject(new Error("rate_limited"));
                }
                return r.json();
              })
              .then(function (j) {
                if (j && j.lifetimeUnlocked) osgLifetimeSet(true);
                localStorage.setItem(OSG_LS_REF_CLAIM_SENT, sentinel);
              })
              .catch(function () {});
          } catch (_) {}
        }

        function osgRedeemVipPayload(code, pack, onDone) {
          code = String(code || "").trim().slice(0, 32);
          if (!code) return;
          pack = pack || window.__OSG_CURRENT_PACK_CACHE || T.de;
          if (!navigator.onLine) {
            try {
              alert((pack && pack.pauliChatError) || "");
            } catch (_) {}
            return;
          }
          osgApiFetch("/api/vip/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code }),
            cache: "no-store",
          })
            .then(function (r) {
              if (osgAlertRateLimitedIfSo(r, pack)) {
                if (typeof onDone === "function") onDone(false);
                return Promise.reject(new Error("rate_limited"));
              }
              return r.json();
            })
            .then(function (j) {
              if (j && j.ok) {
                osgVipFinalizeRedeem(
                  code,
                  j.profile,
                  j.gift || null,
                  pack
                );
                try {
                  var inp = document.getElementById("vip-code-input");
                  if (inp) inp.value = "";
                } catch (_) {}
              } else {
                try {
                  alert((pack && pack.vipRedeemBadToast) || "");
                } catch (_) {}
              }
              if (j && !j.ok) osgVipUrlMarkFail(code);
              if (typeof onDone === "function") onDone(!!(j && j.ok));
            })
            .catch(function (err) {
              if (err && String(err.message || "") === "rate_limited") return;
              try {
                alert((pack && pack.pauliChatError) || "");
              } catch (_) {}
              if (typeof onDone === "function") onDone(false);
            });
        }

        function osgConsumeVipParamOnce() {
          osgVipWithLocalePackReady(function (uiLang) {
          try {
            if (osgVipActive()) return;
            var u = new URL(window.location.href);
            var code = (u.searchParams.get("osg_vip") || "").trim().slice(0, 32);
            if (!code) return;
            if (osgVipUrlParamShouldSkip(code)) return;
            var pack =
              window.__OSG_CURRENT_PACK_CACHE ||
              (typeof T !== "undefined"
                ? T[uiLang] || T[normalizeLang(osgResolveBootLangRaw())] || T.de
                : {}) ||
              (typeof T !== "undefined" ? T.de : {});
            if (
              osgVipCurrentCode() === code &&
              osgVipLoadProfileCached() &&
              osgVipGiftThbFromProfile(osgVipLoadProfileCached(), null) > 0
            ) {
              u.searchParams.delete("osg_vip");
              try {
                history.replaceState({}, "", u.pathname + u.search + u.hash);
              } catch (_) {}
              osgVipMaybeResumeGiftOverlay(pack);
              return;
            }
            if (!navigator.onLine) return;
            osgApiFetch("/api/vip/redeem", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: code }),
              cache: "no-store",
            })
              .then(function (r) {
                if (osgAlertRateLimitedIfSo(r, pack)) return null;
                return r.json();
              })
              .then(function (j) {
                if (!j) return;
                if (j.ok) {
                  u.searchParams.delete("osg_vip");
                  try {
                    history.replaceState(
                      {},
                      "",
                      u.pathname + u.search + u.hash
                    );
                  } catch (_) {}
                  try {
                    window.__OSG_VIP_REDEEM_PENDING__ = {
                      code: code,
                      profile: j.profile || null,
                      gift: j.gift || null,
                      slot:
                        (j.gift && j.gift.slot != null
                          ? j.gift.slot
                          : j.profile && j.profile.slot) || 0,
                      sender:
                        (j.gift && j.gift.giftSenderDisplay) ||
                        "",
                    };
                  } catch (_) {}
                  osgVipFinalizeRedeem(code, j.profile, j.gift || null, pack);
                } else {
                  osgVipUrlMarkFail(code);
                }
              })
              .catch(function () {});
          } catch (_) {}
          });
        }

        function osgWireVipRedeemOnce() {
          if (window.__OSG_VIP_BTN_WIRED__) return;
          window.__OSG_VIP_BTN_WIRED__ = true;
          var btn = document.getElementById("vip-redeem-btn");
          if (!btn) return;
          btn.addEventListener(
            "click",
            function () {
              var inp = document.getElementById("vip-code-input");
              var raw = inp ? inp.value : "";
              var code = String(raw || "").trim();
              if (!code) {
                osgRedeemVipPayload(raw, null, null);
                return;
              }
              var useVoiceConfirm =
                window.osgA11y &&
                typeof window.osgA11y.isEnabled === "function" &&
                window.osgA11y.isEnabled() &&
                typeof window.osgVoiceConfirm === "function";
              if (useVoiceConfirm) {
                window
                  .osgVoiceConfirm("vip", { CODE: code.slice(0, 32) })
                  .then(function (ok) {
                    if (ok) osgRedeemVipPayload(raw, null, null);
                  });
              } else {
                osgRedeemVipPayload(raw, null, null);
              }
            },
            false
          );
        }

        function osgPollReferralStatusDeferred() {
          if (!navigator.onLine) return;
          var mine = osgOwnReferralCode();
          osgApiFetch(
            "/api/referral/status?ref=" +
              encodeURIComponent(mine.slice(0, 96)),
            { cache: "no-store" }
          )
            .then(function (r) {
              if (osgAlertRateLimitedIfSo(r)) {
                return Promise.reject(new Error("rate_limited"));
              }
              return r.json();
            })
            .then(function (j) {
              if (j && j.lifetimeUnlocked) osgLifetimeSet(true);
              try {
                window.__OSG_LAST_REF_STATS__ = j;
              } catch (_) {}
              osgRefreshArchitectSummaries();
            })
            .catch(function () {});
        }

        function osgPaintReferralInstallQr(url) {
          var host = document.getElementById("referral-qr-host");
          if (!host) return;
          host.innerHTML = "";
          osgEnsureQrLibrary(function () {
            try {
              /* global QRCode */
              new QRCode(host, {
                text: url,
                width: 192,
                height: 192,
                colorDark: "#d4af37",
                colorLight: "#0d0d0dff",
                correctLevel:
                  typeof QRCode !== "undefined" && QRCode.CorrectLevel
                    ? QRCode.CorrectLevel.M
                    : undefined,
              });
            } catch (_) {
              host.textContent = url;
            }
          });
        }

        function osgRefreshTrialBannerOuter(pack) {
          var ban = document.getElementById("osg-trial-urgent-banner");
          if (!ban || !pack) return;
          var hrs = osgTrialHoursRemaining();
          var lastChance =
            hrs > 0 &&
            hrs <= 24 &&
            !osgLifetimeUnlocked() &&
            !osgVipActive() &&
            osgTrialIsActiveNow();
          if (lastChance) {
            ban.removeAttribute("hidden");
            ban.innerHTML = pack.referralFinalDayBannerHtml || "";
          } else {
            ban.innerHTML = "";
            ban.setAttribute("hidden", "");
          }
        }

        function osgRefreshArchitectSummaries() {
          var pack = window.__OSG_CURRENT_PACK_CACHE || T.de;
          if (!pack) return;
          var mh = document.getElementById("referral-arch-heading");
          var ml = document.getElementById("referral-arch-lead");
          if (mh) mh.textContent = pack.referralArcTitle || "";
          if (ml) ml.innerHTML = pack.referralArcLead || "";

          var tri = document.getElementById("referral-trial-line");
          if (tri) {
            if (osgVipActive())
              tri.textContent = pack.vipBypassTrialLine || "";
            else if (osgLifetimeUnlocked())
              tri.textContent = pack.referralLifetimeLine || "";
            else {
              tri.textContent = String(pack.referralTrialHoursTpl || "").replace(
                /\{HOURS\}/g,
                String(osgTrialHoursRemaining())
              );
            }
          }
          var cnt = document.getElementById("referral-count-line");
          var jst = window.__OSG_LAST_REF_STATS__ || {};
          var n = Number(jst.uniqueCount || 0);
          if (cnt) {
            if (osgVipActive())
              cnt.textContent = pack.vipStatusLine || "";
            else
              cnt.textContent = String(pack.referralCountTpl || "")
                .replace(/\{CURRENT\}/g, String(n))
                .replace(/\{TARGET\}/g, String(OSG_REF_UNIQUE_TARGET));
          }
          var fee = document.getElementById("referral-fee-or-lifetime-line");
          if (fee) {
            if (osgLifetimeUnlocked() || osgVipActive()) fee.innerHTML = "";
            else {
              fee.textContent = String(
                pack.referralUnlockHintTpl ||
                  pack.referralFeeReminderTpl ||
                  ""
              );
            }
          }
          var vrow = document.getElementById("vip-redeem-row");
          var vstat = document.getElementById("vip-status-line");
          if (vstat) {
            if (osgVipActive()) {
              vstat.removeAttribute("hidden");
              vstat.textContent = pack.vipStatusLine || "";
              if (vrow) vrow.setAttribute("hidden", "");
              osgVipRenderLiveWidget();
            } else {
              vstat.setAttribute("hidden", "");
              vstat.textContent = "";
              if (vrow) vrow.removeAttribute("hidden");
              var vLive = document.getElementById("vip-live-wrap");
              if (vLive) vLive.setAttribute("hidden", "");
            }
          }

          var cap = document.getElementById("referral-qr-caption");
          var shareTxt = osgReferralShareUrl();
          if (cap) cap.textContent = pack.referralQrCaption || "";
          var shareEl = document.getElementById("referral-share-url-line");
          if (shareEl) {
            shareEl.textContent =
              (pack.referralShareLabel || "").trim() + " " + shareTxt;
          }
          osgPaintReferralInstallQr(shareTxt);

          var fpLn = document.getElementById("referral-fingerprint-line");
          if (fpLn) {
            var bundle = osgLoadInstallBundle();
            var fpRaw = bundle && bundle.ipFingerprint;
            var tplF = pack.referralFingerprintLineTpl || "";
            if (fpRaw && tplF) {
              fpLn.removeAttribute("hidden");
              fpLn.textContent = String(tplF)
                .replace(/\{CID\}/g, osgEnsureCustomerId())
                .replace(/\{IPF\}/g, String(fpRaw))
                .replace(/\{REF\}/g, osgOwnReferralCode());
            } else {
              fpLn.textContent = "";
              fpLn.setAttribute("hidden", "");
            }
          }

          var it = osgInterestTopKeyword();
          var w = osgLoadInterestWeights();
          var topLine = document.getElementById("referral-interest-top-line");
          if (topLine) {
            if (it && w[it]) {
              topLine.removeAttribute("hidden");
              topLine.textContent = String(pack.referralInterestLineTpl || "")
                .replace(/\{KW\}/g, it)
                .replace(/\{HITS\}/g, String(w[it]));
            } else topLine.setAttribute("hidden", "");
          }

          osgRefreshTrialBannerOuter(pack);
        }

        var __osgArchWiredOnce = false;
        function osgWireArchitectureLayerOnce() {
          if (__osgArchWiredOnce) return;
          __osgArchWiredOnce = true;
          osgEnsureArchInstall();
          osgEnsureInstallDeviceAnchor();
          osgEnsureCustomerId();
          osgFlushApiOutbox();
          osgConsumeReferralParamOnce();
          osgConsumeVipParamOnce();
          try {
            osgVipMaybeResumeGiftOverlay(
              window.__OSG_CURRENT_PACK_CACHE ||
                (typeof T !== "undefined" ? T.de : {})
            );
          } catch (_) {}
          osgVipEnsureLiveOps();
          if (typeof osgAffiliateCheckOnce === "function") osgAffiliateCheckOnce();
          osgRegisterReferralParentTrialDeferred();
          osgPollReferralStatusDeferred();
          try {
            setInterval(osgPollReferralStatusDeferred, 135000);
          } catch (_) {}
          osgFetchInstallFingerprintDeferred();
          try {
            var pg = document.querySelector(".page");
            if (pg && pg.dataset.osgSectionInterest !== "1") {
              pg.dataset.osgSectionInterest = "1";
              pg.addEventListener(
                "click",
                function (ev) {
                  var sec = ev.target.closest(".page section");
                  if (!sec || !sec.id) return;
                  var sid = sec.id;
                  try {
                    var key = "osg-sec-bump-" + sid;
                    if (sessionStorage.getItem(key) === "1") return;
                    sessionStorage.setItem(key, "1");
                  } catch (_) {}
                  osgInterestBump("section:" + sid);
                },
                true
              );
            }
          } catch (_) {}
          document.body.addEventListener(
            "click",
            function (e) {
              var a = e.target.closest(".compare-panel #compare-tbody a[href]");
              if (!a) return;
              var tr = a.closest("tr");
              var firstCell = tr ? tr.querySelector("td:first-child") : null;
              var lbl = "";
              try {
                lbl = (
                  firstCell && firstCell.textContent ? firstCell.textContent : ""
                )
                  .replace(/\s+/g, " ")
                  .trim();
              } catch (_) {
                lbl = "";
              }
              if (lbl) osgInterestBump(lbl.slice(0, 80));
              else osgInterestBump("compare_link");
            },
            false
          );
          var binIn = document.getElementById("bin-check-input");
          var binOut = document.getElementById("bin-check-result");
          var __osgBinFinanceSpeakTimer = 0;
          function osgMaybeSpeakBinCreditGuide(probe) {
            if (!probe || probe.tier !== "credit") return;
            try {
              if (sessionStorage.getItem("osg-bin-credit-guide-v1") === "1") {
                return;
              }
            } catch (_) {}
            try {
              if (__osgBinFinanceSpeakTimer) {
                clearTimeout(__osgBinFinanceSpeakTimer);
              }
            } catch (_) {}
            __osgBinFinanceSpeakTimer = setTimeout(function () {
              __osgBinFinanceSpeakTimer = 0;
              var AC = window.osgAvatarController;
              if (!AC || typeof AC.speakFinanceRecommendation !== "function") {
                return;
              }
              try {
                sessionStorage.setItem("osg-bin-credit-guide-v1", "1");
              } catch (_) {}
              var packInner =
                window.__OSG_CURRENT_PACK_CACHE ||
                (typeof T !== "undefined" ? T.de : {});
              var hint = String(packInner.binCreditTpl || "")
                .replace(/\{BIN\}/g, "")
                .replace(/\{BANK\}/g, probe.issuer || "")
                .trim();
              void AC.speakFinanceRecommendation(hint, {
                category: "credit",
                speechKey: "binCreditTpl",
                gesture: "help",
              }).catch(function () {});
            }, 900);
          }
          if (binIn && binOut) {
            function renderBinFeedback() {
              var packInner = window.__OSG_CURRENT_PACK_CACHE || T.de;
              var raw = binIn.value;
              var probe = osgThinBinFingerprint(raw);
              if (!probe) {
                binOut.textContent = packInner.binUnknownHint || "";
                return;
              }
              if (probe.tier === "credit") {
                binOut.innerHTML = "";
                binOut.textContent = String(packInner.binCreditTpl || "")
                  .replace(/\{BIN\}/g, String(raw || "").slice(0, 8))
                  .replace(/\{BANK\}/g, probe.issuer || "");
                osgMaybeSpeakBinCreditGuide(probe);
                return;
              }
              var bankName = probe.issuer || "";
              var p1 =
                String(
                  packInner.binDebitPrepaidMessageTpl ||
                    packInner.binPrepaidTpl ||
                    ""
                )
                  .replace(/\{BIN\}/g, String(raw || "").slice(0, 8))
                  .replace(/\{BANK\}/g, bankName);
              var p2 = String(packInner.binCreditUpsellTpl || "");
              if (probe.tier === "unknown") {
                binOut.innerHTML =
                  "<span>" +
                  osgEscHtml(String(packInner.binUnknownThinFileTpl || "").replace(
                    /\{BANK\}/g,
                    bankName
                  )) +
                  "</span><br/><br/><span>" +
                  osgEscHtml(p2) +
                  "</span>";
              } else {
                binOut.innerHTML =
                  "<span>" +
                  osgEscHtml(p1) +
                  "</span><br/><br/><span>" +
                  osgEscHtml(p2) +
                  "</span>";
              }
            }
            binIn.addEventListener(
              "input",
              function () {
                renderBinFeedback();
              },
              false
            );
            binIn.addEventListener("blur", renderBinFeedback, false);
          }
          try {
            osgRefreshPremiumLockUi();
          } catch (_) {}
        }

        window.OSGArchitect = {
          refresh: osgRefreshArchitectSummaries,
          bumpInterest: osgInterestBump,
          muteCommercePurchases: osgSetPurchasedSilence,
          mutePurchasedInterests: osgMutePurchasedProductInterests,
          isCommerceMuted: osgPurchasedSilenceActive,
        };

        function osgSanitizePersonalName(raw) {
          try {
            if (raw == null) return "";
            var t = String(raw).normalize("NFKC").trim();
            if (!t) return "";
            t = t.replace(/[^\p{L}\p{M}\s\-'\.]/gu, "");
            t = t.replace(/\s+/g, " ").trim();
            return t.slice(0, 48).trim();
          } catch (_) {
            return "";
          }
        }

        function osgPickProfileObject() {
          var merged = null;
          try {
            var raw = localStorage.getItem(OSG_LS_USER_PROFILE);
            var parsed = raw ? JSON.parse(raw) : null;
            merged =
              parsed && typeof parsed === "object"
                ? (function () {
                    var o = {};
                    Object.keys(parsed).forEach(function (k) {
                      o[k] = parsed[k];
                    });
                    return o;
                  })()
                : {};
          } catch (_) {
            merged = {};
          }
          try {
            var wpo =
              typeof window !== "undefined" &&
              window.__OSG_USER_PROFILE__ &&
              typeof window.__OSG_USER_PROFILE__ === "object"
                ? window.__OSG_USER_PROFILE__
                : null;
            if (!wpo) return merged || null;
            var out = merged || {};
            Object.keys(wpo).forEach(function (k) {
              out[k] = wpo[k];
            });
            return out;
          } catch (_) {
            return merged;
          }
        }

        /** Vorherige Schlüssel (givenName, customerName) → nur noch userName */
        function osgMigrateLegacyProfileAliases(o) {
          if (!o || typeof o !== "object") return o;
          var legacy = osgSanitizePersonalName(o.givenName || o.firstName || "");
          if (legacy && !osgSanitizePersonalName(o.userName || "")) {
            o.userName = legacy;
          }
          try {
            delete o.givenName;
            delete o.firstName;
          } catch (_) {}
          return o;
        }

        /** Einmalig: legacy customerName in userName übernehmen und customerName aus dem Speicher entfernen */
        function osgEnsureProfileUserNameOnlyOnce() {
          if (window.__osgUsernameOnlyHydratedOnce) return;
          var po = osgPickProfileObject();
          if (!po || typeof po !== "object") {
            window.__osgUsernameOnlyHydratedOnce = true;
            return;
          }
          osgMigrateLegacyProfileAliases(po);
          var sUser = osgSanitizePersonalName(po.userName || "");
          var sCust = osgSanitizePersonalName(po.customerName || "");
          var name = sUser || sCust;
          if (po.customerName == null && sUser) {
            window.__osgUsernameOnlyHydratedOnce = true;
            return;
          }
          var next = {};
          Object.keys(po).forEach(function (k) {
            if (k === "customerName") return;
            next[k] = po[k];
          });
          if (name) next.userName = name;
          else delete next.userName;
          window.__osgUsernameOnlyHydratedOnce = true;
          try {
            delete next.customerName;
            delete next.givenName;
            delete next.firstName;
          } catch (_) {}
          try {
            window.__OSG_USER_PROFILE__ = next;
          } catch (_) {}
          try {
            if (Object.keys(next).length)
              localStorage.setItem(OSG_LS_USER_PROFILE, JSON.stringify(next));
            else localStorage.removeItem(OSG_LS_USER_PROFILE);
          } catch (_) {}
        }

        /** Anrede-/Anzeigename ausschließlich aus userName (Onboarding) */
        function osgResolveCustomerDisplayName() {
          var po = osgPickProfileObject();
          osgMigrateLegacyProfileAliases(po);
          var cand =
            po && po.userName != null && String(po.userName).trim()
              ? String(po.userName)
              : "";
          var n = osgSanitizePersonalName(cand);
          return n ? n : "";
        }

        function osgPersistUserProfile(patch) {
          if (!patch || typeof patch !== "object") return;
          var next = osgPickProfileObject()
            ? (function () {
                var o = {};
                var b = osgPickProfileObject();
                Object.keys(b).forEach(function (k) {
                  if (k === "customerName") return;
                  o[k] = b[k];
                });
                return o;
              })()
            : {};
          osgMigrateLegacyProfileAliases(next);
          if ("userName" in patch) {
            var v =
              patch.userName == null ? "" : String(patch.userName).trim();
            var s = osgSanitizePersonalName(v);
            if (s) next.userName = s;
            else delete next.userName;
          }
          if ("payoutAccountNumber" in patch) {
            var acct = osgSanitizePayoutAccount(patch.payoutAccountNumber);
            if (acct) next.payoutAccountNumber = acct;
            else delete next.payoutAccountNumber;
          }
          if ("inclusionBuddy" in patch) {
            if (patch.inclusionBuddy) next.inclusionBuddy = true;
            else delete next.inclusionBuddy;
          }
          if ("inclusionClickAssist" in patch) {
            if (patch.inclusionClickAssist) next.inclusionClickAssist = true;
            else delete next.inclusionClickAssist;
          }
          if ("inclusionReadAloud" in patch) {
            if (patch.inclusionReadAloud) next.inclusionReadAloud = true;
            else delete next.inclusionReadAloud;
          }
          try {
            delete next.customerName;
            delete next.givenName;
            delete next.firstName;
          } catch (_) {}
          try {
            window.__OSG_USER_PROFILE__ = next;
          } catch (_) {}
          try {
            if (Object.keys(next).length)
              localStorage.setItem(OSG_LS_USER_PROFILE, JSON.stringify(next));
            else localStorage.removeItem(OSG_LS_USER_PROFILE);
          } catch (_) {}
        }

        /** @deprecated Alias — nur userName */
        function osgResolveCustomerFirstName() {
          return osgResolveCustomerDisplayName();
        }

        function osgExtractSpokenName(text) {
          var t = String(text || "").trim();
          if (!t || t.length < 2) return "";
          var m = t.match(
            /(?:ich hei(?:ß|ss)e|ich bin|nenn mich|my name is|call me|i am|ฉันชื่อ|ผมชื่อ|nazywam si[eę]|меня зовут|我叫|叫我)\s+([^\s,.!?]{2,24})/i
          );
          if (m && m[1]) return osgSanitizePersonalName(m[1]);
          if (t.length <= 24 && /^[\p{L}\p{M}'-]+$/u.test(t)) {
            return osgSanitizePersonalName(t);
          }
          return "";
        }

        window.osgExtractSpokenName = osgExtractSpokenName;
        window.osgPersistUserProfile = osgPersistUserProfile;

        function osgRestrictedSectorFromAffiliate(partner, channel, certRealm) {
          certRealm = String(certRealm || "").trim();
          channel = String(channel || "").trim();
          if (channel === "real_estate" || certRealm === "real_estate") return "immo";
          if (channel === "bank") return "finance";
          if (channel === "insurance" || certRealm === "insurance") return "insurance";
          return "";
        }

        function osgBirthIsoLoad() {
          try {
            var raw = localStorage.getItem(OSG_LS_AGE_GATE);
            if (!raw) {
              raw = localStorage.getItem(OSG_LS_AGE_GATE_LEGACY);
              if (raw) {
                try {
                  localStorage.setItem(OSG_LS_AGE_GATE, raw);
                } catch (_) {}
              }
            }
            var o = raw ? JSON.parse(raw) : null;
            if (!o || typeof o !== "object") return "";
            var b = String(o.birthISO || "").trim();
            return /^\d{4}-\d{2}-\d{2}$/.test(b) ? b : "";
          } catch (_) {
            return "";
          }
        }

        function osgBirthIsoSave(iso) {
          try {
            localStorage.setItem(
              OSG_LS_AGE_GATE,
              JSON.stringify({
                birthISO: iso,
                savedAtISO: new Date().toISOString(),
              })
            );
          } catch (_) {}
        }

        function osgYearsOldFromBirthIso(isoYmd, refDt) {
          var m = String(isoYmd || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!m) return -1;
          var y = +m[1],
            mo = +m[2],
            d = +m[3];
          var bd = new Date(Date.UTC(y, mo - 1, d));
          if (
            bd.getUTCFullYear() !== y ||
            bd.getUTCMonth() !== mo - 1 ||
            bd.getUTCDate() !== d
          )
            return -1;
          var rd = refDt instanceof Date ? refDt : new Date();
          var ry = rd.getUTCFullYear(),
            rm = rd.getUTCMonth() + 1,
            rday = rd.getUTCDate();
          var age = ry - y;
          if (rm < mo || (rm === mo && rday < d)) age--;
          return age;
        }

        function osgVerifiedTwentyPlusNow() {
          var iso = osgBirthIsoLoad();
          if (!iso) return false;
          return osgYearsOldFromBirthIso(iso, new Date()) >= OSG_MIN_AGE_YEARS;
        }

        function osgJournalAgeGateOnce(sectorShort) {
          var ts = new Date().toISOString();
          osgAppendLeadJournal(
            {
              leadId: osgNewLeadId(),
              customerId: osgEnsureCustomerId(),
              osg_partner: "age_declaration",
              osg_ch: "age_gate",
              landingHref: "internal:age_declaration",
              trackedHref: "",
              clickedAtISO: ts,
              conversionBasis: false,
              leadIntent: "th_youth_protect_15",
              ageConfirmed20: true,
              minAgeYears: OSG_MIN_AGE_YEARS,
              ageGateSector: String(sectorShort || "restricted").slice(0, 24),
            },
            { skipBump: true }
          );
        }

        var __OSG_AGE_RESUME = null;

        function osgHydrateAgeGateTexts(pack) {
          var p = pack || {};
          var h = document.getElementById("osg-age-gate-heading");
          if (h) h.textContent = p.ageGateHeading || "";
          var lead = document.getElementById("osg-age-gate-lead");
          if (lead) lead.textContent = p.ageGateLead || "";
          var bl = document.getElementById("osg-age-gate-birth-label");
          if (bl) bl.textContent = p.ageGateBirthLabel || "";
          var sub = document.getElementById("osg-age-gate-submit");
          if (sub) sub.textContent = p.ageGateSubmitBtn || "";
          var di = document.getElementById("osg-age-gate-dismiss");
          if (di) di.textContent = p.ageGateDismissBtn || "";
        }

        function osgCloseAgeGateOverlay() {
          var ov = document.getElementById("osg-age-gate-overlay");
          if (!ov) return;
          ov.setAttribute("hidden", "");
          ov.classList.remove("osg-age-gate-overlay--open");
          try {
            document.body.style.overflow = "";
          } catch (_) {}
          __OSG_AGE_RESUME = null;
        }

        function osgShowAgeGateError(msg) {
          var el = document.getElementById("osg-age-gate-error");
          if (!el) return;
          if (msg && String(msg).trim()) {
            el.textContent = String(msg).trim();
            el.removeAttribute("hidden");
          } else {
            el.textContent = "";
            el.setAttribute("hidden", "");
          }
        }

        function osgOpenAgeGateOverlay(resumePack) {
          var pack =
            resumePack ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T[normalizeLang("de")] : null);
          __OSG_AGE_RESUME = resumePack || null;
          osgHydrateAgeGateTexts(pack);
          osgShowAgeGateError("");
          var inp = document.getElementById("osg-age-gate-input");
          if (inp) {
            var today = new Date();
            var y = today.getFullYear(),
              mo = String(today.getMonth() + 1).padStart(2, "0"),
              dd = String(today.getDate()).padStart(2, "0");
            inp.max = y + "-" + mo + "-" + dd;
            inp.value = "";
          }
          var mandatory = !!(resumePack && resumePack.sector);
          var di = document.getElementById("osg-age-gate-dismiss");
          if (di) {
            if (mandatory) {
              di.setAttribute("hidden", "");
              di.setAttribute("disabled", "");
            } else {
              di.removeAttribute("hidden");
              di.removeAttribute("disabled");
            }
          }
          var ov = document.getElementById("osg-age-gate-overlay");
          if (!ov) return;
          ov.removeAttribute("hidden");
          ov.classList.add("osg-age-gate-overlay--open");
          try {
            document.body.style.overflow = "hidden";
          } catch (_) {}
          setTimeout(function () {
            try {
              document.getElementById("osg-age-gate-input").focus();
            } catch (_) {}
          }, 50);
        }

        function osgSpeakAgeBlockedLine() {
          try {
            if (
              window.PauliVoice &&
              typeof window.PauliVoice.speakAgeGateBlock === "function"
            ) {
              Promise.resolve(window.PauliVoice.speakAgeGateBlock()).catch(
                function () {}
              );
            }
          } catch (_) {}
        }

        function osgWireAgeGateOverlayOnce() {
          if (window.__OSG_AGE_GATE_WIRED__) return;
          window.__OSG_AGE_GATE_WIRED__ = true;
          var ov = document.getElementById("osg-age-gate-overlay");
          var sub = document.getElementById("osg-age-gate-submit");
          var dismiss = document.getElementById("osg-age-gate-dismiss");
          var bd = ov && ov.querySelector(".osg-age-gate-backdrop");
          function submit() {
            var pack =
              window.__OSG_CURRENT_PACK_CACHE ||
              (typeof T !== "undefined" ? T[normalizeLang("de")] : {});
            var inp = document.getElementById("osg-age-gate-input");
            var iso = inp ? String(inp.value || "").trim() : "";
            if (!iso) {
              osgShowAgeGateError(pack.ageGateErrEmpty || "");
              return;
            }
            var age = osgYearsOldFromBirthIso(iso, new Date());
            if (age < 0) {
              osgShowAgeGateError(pack.ageGateErrInvalid || "");
              return;
            }
            if (age < OSG_MIN_AGE_YEARS) {
              var tooYoungMsg =
                pack.age_restriction_error || pack.ageGateTooYoungToast || "";
              osgShowAgeGateError(tooYoungMsg);
              osgSpeakAgeBlockedLine();
              try {
                alert(tooYoungMsg);
              } catch (_) {}
              return;
            }
            osgBirthIsoSave(iso);
            var resume = __OSG_AGE_RESUME;
            var sec = resume && resume.sector ? resume.sector : "";
            osgJournalAgeGateOnce(sec);
            osgCloseAgeGateOverlay();
            if (
              resume &&
              typeof resume.afterVerified === "function"
            )
              resume.afterVerified();
          }
          if (sub) sub.addEventListener("click", submit, false);
          if (dismiss)
            dismiss.addEventListener(
              "click",
              function () {
                if (__OSG_AGE_RESUME && __OSG_AGE_RESUME.sector) return;
                osgCloseAgeGateOverlay();
              },
              false
            );
          if (bd)
            bd.addEventListener(
              "click",
              function () {
                if (__OSG_AGE_RESUME && __OSG_AGE_RESUME.sector) return;
                osgCloseAgeGateOverlay();
              },
              false
            );
          if (ov)
            ov.addEventListener(
              "keydown",
              function (ev) {
                if (
                  ((ev.key || "").toLowerCase() === "escape" ||
                    ev.key === "Esc") &&
                  ov &&
                  ov.classList.contains("osg-age-gate-overlay--open")
                ) {
                  if (__OSG_AGE_RESUME && __OSG_AGE_RESUME.sector) {
                    ev.stopPropagation();
                    return;
                  }
                  osgCloseAgeGateOverlay();
                  ev.stopPropagation();
                }
              },
              true
            );
        }

        function osgSanitizeLeadPayloadForMirror(src) {
          if (!src || typeof src !== "object") return {};
          var out = {};
          var passthrough = [
            "osg_partner",
            "osg_ch",
            "leadId",
            "customerId",
            "clickedAtISO",
            "landingHref",
            "trackedHref",
            "conversionBasis",
            "leadIntent",
            "voucherCode",
            "voucherThb",
            "qrScan",
            "voucherActivated",
            "pickupFulfillment",
            "outboundLeadRef",
            "provisionRealm",
            "marketplaceSubId",
            "voucherMinimumBasketThb",
            "deliveryPreference",
            "deliveryReason",
            "ageConfirmed20",
            "ageGateSector",
          ];
          for (var i = 0; i < passthrough.length; i++) {
            var k = passthrough[i];
            if (!(k in src)) continue;
            var v = src[k];
            if (typeof v === "string") {
              var cap =
                k === "landingHref"
                  ? 800
                  : k === "trackedHref"
                    ? 1400
                    : k === "leadIntent"
                      ? 48
                      : k === "ageGateSector"
                        ? 24
                        : 120;
              out[k] = v.slice(0, cap);
            } else out[k] = v;
          }
          return out;
        }

        function osgHydrateLegalDocShell(pack) {
          var p = pack || {};
          var h = document.getElementById("legal-docs-heading");
          if (h) h.textContent = p.legalOverlayTitle || "Legal";
          var c = document.getElementById("legal-docs-close-btn");
          if (c) {
            c.textContent = p.legalOverlayCloseBtn || "×";
            c.setAttribute("aria-label", p.legalOverlayCloseAria || "");
          }
          var imp = document.getElementById("footer-legal-imprint-btn");
          if (imp) imp.textContent = p.legalFooterImprintBtn || "";
          var te = document.getElementById("footer-legal-terms-btn");
          if (te) te.textContent = p.legalFooterTermsBtn || "";
          var aff = document.getElementById("footer-legal-affiliate-btn");
          if (aff) aff.textContent = p.legalFooterAffiliateBtn || "Affiliate";
          var dl = document.getElementById("footer-download-link");
          if (dl) {
            dl.textContent = p.footerDownloadBtn || "";
            dl.setAttribute("aria-label", p.footerDownloadAria || dl.textContent);
          }
          var nav = document.getElementById("footer-legal-doc-nav");
          if (nav && p.legalDocNavAria) nav.setAttribute("aria-label", p.legalDocNavAria);

          var tabs = document.getElementById("legal-docs-tabs");
          if (tabs) {
            tabs.innerHTML =
              '<button type="button" class="legal-docs-tab legal-docs-tab--active" data-legal-pane="imprint">' +
              osgEscHtml(p.legalTabImprint || "Imprint") +
              '</button><button type="button" class="legal-docs-tab" data-legal-pane="terms">' +
              osgEscHtml(p.legalTabTerms || "Terms") +
              '</button><button type="button" class="legal-docs-tab" data-legal-pane="affiliate">' +
              osgEscHtml(p.legalTabAffiliate || "Affiliate") +
              "</button>";
          }
        }

        function osgLegalLangBundle() {
          var raw =
            document.documentElement.getAttribute("lang") || navigator.language || "de";
          var code = normalizeLang(String(raw));
          var M = typeof window.__OSG_LEGAL_MODULES__ === "object" && window.__OSG_LEGAL_MODULES__;
          var b = M && M[code] ? M[code] : M && M.en ? M.en : {};
          return b || {};
        }

        function osgOpenLegalDocsPane(which) {
          var pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T[normalizeLang("de")] : {});
          osgHydrateLegalDocShell(pack);
          var L = osgLegalLangBundle();
          var body = document.getElementById("legal-docs-body");
          var overlay = document.getElementById("legal-docs-overlay");
          if (!body || !overlay) return;
          var pane = String(which || "imprint");
          var lead = "";
          var main = "";
          if (pane === "imprint") {
            lead = L.imprintLead || "";
            main = L.imprintHtml || "";
          } else if (pane === "terms") {
            lead = L.termsLead || "";
            main = L.termsHtml || "";
          } else {
            pane = "affiliate";
            lead = L.affiliateLead || "";
            main = L.affiliateHtml || "";
          }
          body.innerHTML = lead + main;
          var tabs = overlay.querySelectorAll(".legal-docs-tab");
          tabs.forEach(function (btn) {
            var pn = btn.getAttribute("data-legal-pane") || "";
            btn.classList.toggle("legal-docs-tab--active", pn === pane);
          });
          overlay.removeAttribute("hidden");
          overlay.classList.add("legal-docs-overlay--open");
          try {
            document.body.style.overflow = "hidden";
          } catch (_) {}
        }

        function osgCloseLegalDocsOverlay() {
          var overlay = document.getElementById("legal-docs-overlay");
          if (!overlay) return;
          overlay.setAttribute("hidden", "");
          overlay.classList.remove("legal-docs-overlay--open");
          try {
            document.body.style.overflow = "";
          } catch (_) {}
        }

        function osgHydrateSupportContactTexts(pack) {
          var P = function (k, fb) {
            return pack && pack[k] != null && String(pack[k]) !== ""
              ? pack[k]
              : fb || "";
          };
          var bat = document.getElementById("brand-app-title");
          if (bat && pack) applyBrandHeader(pack);
          var cbtn = document.getElementById("footer-support-contact-btn");
          if (cbtn) {
            cbtn.textContent = P("supportContactBtn", "Kontakt");
            cbtn.setAttribute("aria-label", P("supportContactBtnAria", cbtn.textContent));
          }
          var ids = [
            ["osg-support-modal-title", "supportModalTitle"],
            ["osg-support-modal-lead", "supportModalLead"],
            ["osg-support-label-email", "supportLabelEmail"],
            ["osg-support-label-message", "supportLabelMessage"],
            ["osg-support-voice-hint", "supportVoiceHint"],
            ["osg-support-dictate-btn", "supportDictateBtn"],
            ["osg-support-submit-btn", "supportSubmitBtn"],
            ["osg-support-close-btn", "supportCloseBtn"],
            ["osg-support-confirm-title", "supportConfirmTitle"],
            ["osg-support-confirm-warn", "supportSubjectWarn"],
            ["osg-support-mailto-btn", "supportMailtoBtn"],
          ];
          for (var i = 0; i < ids.length; i++) {
            var el = document.getElementById(ids[i][0]);
            if (el) el.textContent = P(ids[i][1], "");
          }
          var dict = document.getElementById("osg-support-dictate-btn");
          if (dict)
            dict.setAttribute("aria-label", P("supportDictateBtnAria", dict.textContent));
          var msg = document.getElementById("osg-support-message");
          if (msg)
            msg.setAttribute("aria-label", P("supportLabelMessage", ""));
        }

        function osgOpenSupportModal() {
          var modal = document.getElementById("osg-support-modal");
          var form = document.getElementById("osg-support-form");
          var conf = document.getElementById("osg-support-confirm");
          if (!modal) return;
          if (form) form.hidden = false;
          if (conf) conf.hidden = true;
          modal.removeAttribute("hidden");
          try {
            document.body.style.overflow = "hidden";
          } catch (_) {}
          var em = document.getElementById("osg-support-email");
          if (em) em.focus();
        }

        function osgCloseSupportModal() {
          var modal = document.getElementById("osg-support-modal");
          if (!modal) return;
          modal.setAttribute("hidden", "");
          try {
            document.body.style.overflow = "";
          } catch (_) {}
        }

        function osgSupportShowConfirm(ticket, pack) {
          var form = document.getElementById("osg-support-form");
          var conf = document.getElementById("osg-support-confirm");
          if (form) form.hidden = true;
          if (!conf) return;
          conf.hidden = false;
          var body = document.getElementById("osg-support-confirm-body");
          var subj = document.getElementById("osg-support-confirm-subject");
          var tplBody =
            (pack && pack.supportConfirmBody) ||
            "Thank you. Ticket {TICKET}.";
          var tplSub =
            (pack && pack.supportConfirmSubject) || "{SUBJECT}";
          if (body)
            body.textContent = tplBody.replace(/\{TICKET\}/g, ticket.ticketRef);
          if (subj)
            subj.textContent = tplSub.replace(/\{SUBJECT\}/g, ticket.subject);
          var mail = document.getElementById("osg-support-mailto-btn");
          if (mail && ticket.mailto) mail.href = ticket.mailto;
        }

        function osgSupportStartDictation() {
          var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          var ta = document.getElementById("osg-support-message");
          if (!SR || !ta) {
            try {
              alert(
                (window.__OSG_CURRENT_PACK_CACHE || {}).supportVoiceUnavailable ||
                  "Speech input is not available in this browser."
              );
            } catch (_) {}
            return;
          }
          var rec = new SR();
          rec.lang = document.documentElement.lang || "de-DE";
          rec.interimResults = false;
          rec.maxAlternatives = 1;
          rec.onresult = function (ev) {
            var t =
              ev.results && ev.results[0] && ev.results[0][0]
                ? ev.results[0][0].transcript
                : "";
            if (t) {
              var cur = ta.value.trim();
              ta.value = cur ? cur + " " + t : t;
            }
          };
          try {
            rec.start();
          } catch (_) {}
        }

        function osgWireSupportContactOnce() {
          if (window.__OSG_SUPPORT_WIRED__) return;
          window.__OSG_SUPPORT_WIRED__ = true;
          var openBtn = document.getElementById("footer-support-contact-btn");
          if (openBtn)
            openBtn.addEventListener("click", osgOpenSupportModal, false);
          var modal = document.getElementById("osg-support-modal");
          if (modal) {
            modal.addEventListener("click", function (e) {
              if (e.target && e.target.getAttribute("data-osg-support-close"))
                osgCloseSupportModal();
            });
          }
          var closeBtn = document.getElementById("osg-support-close-btn");
          if (closeBtn)
            closeBtn.addEventListener("click", osgCloseSupportModal, false);
          var dictBtn = document.getElementById("osg-support-dictate-btn");
          if (dictBtn)
            dictBtn.addEventListener("click", osgSupportStartDictation, false);
          var form = document.getElementById("osg-support-form");
          if (form) {
            form.addEventListener("submit", function (ev) {
              ev.preventDefault();
              var pack = window.__OSG_CURRENT_PACK_CACHE || {};
              var em = (
                document.getElementById("osg-support-email") || {}
              ).value || "";
              var msg = (
                document.getElementById("osg-support-message") || {}
              ).value || "";
              em = String(em).trim();
              msg = String(msg).trim();
              if (!em || em.indexOf("@") < 1) {
                alert(pack.supportErrorEmail || "Invalid email.");
                return;
              }
              if (msg.length < 8) {
                alert(pack.supportErrorMessage || "Message too short.");
                return;
              }
              var btn = document.getElementById("osg-support-submit-btn");
              if (btn) btn.disabled = true;
              osgApiFetch("/api/support/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: em,
                  message: msg,
                  customerId: osgEnsureCustomerId(),
                  locale: document.documentElement.lang || "de",
                  channel: osgClientChannel(),
                }),
              })
                .then(function (r) {
                  if (!r.ok) throw new Error("ticket_fail");
                  return r.json();
                })
                .then(function (data) {
                  osgSupportShowConfirm(data, pack);
                })
                .catch(function () {
                  alert(pack.supportErrorGeneric || "Ticket failed.");
                })
                .finally(function () {
                  if (btn) btn.disabled = false;
                });
            });
          }
          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
              var m = document.getElementById("osg-support-modal");
              if (m && !m.hasAttribute("hidden")) osgCloseSupportModal();
            }
          });
        }

        /** Exposed for voice / assistive flows: „Kontakt“, „Problem“, … */
        window.osgOpenSupportContact = osgOpenSupportModal;

        function osgWireLegalFooterOnce() {
          if (window.__OSG_LEGAL_FOOT_WIRED__) return;
          window.__OSG_LEGAL_FOOT_WIRED__ = true;
          var imp = document.getElementById("footer-legal-imprint-btn");
          if (imp)
            imp.addEventListener(
              "click",
              function () {
                osgOpenLegalDocsPane("imprint");
              },
              false
            );
          var tm = document.getElementById("footer-legal-terms-btn");
          if (tm)
            tm.addEventListener(
              "click",
              function () {
                osgOpenLegalDocsPane("terms");
              },
              false
            );
          var fab = document.getElementById("footer-legal-affiliate-btn");
          if (fab)
            fab.addEventListener(
              "click",
              function () {
                osgOpenLegalDocsPane("affiliate");
              },
              false
            );
          var cl = document.getElementById("legal-docs-close-btn");
          if (cl)
            cl.addEventListener("click", osgCloseLegalDocsOverlay, false);
          var bd =
            document.querySelector("#legal-docs-overlay .legal-docs-backdrop");
          if (bd)
            bd.addEventListener("click", osgCloseLegalDocsOverlay, false);
          var tabs = document.getElementById("legal-docs-tabs");
          if (tabs)
            tabs.addEventListener(
              "click",
              function (ev) {
                var btn = ev.target.closest(".legal-docs-tab");
                if (!btn) return;
                osgOpenLegalDocsPane(
                  btn.getAttribute("data-legal-pane") || "imprint"
                );
              },
              false
            );
          document.addEventListener(
            "keydown",
            function (ev) {
              var o = document.getElementById("legal-docs-overlay");
              if (!o || !o.classList.contains("legal-docs-overlay--open"))
                return;
              if ((ev.key || "").toLowerCase() !== "escape") return;
              osgCloseLegalDocsOverlay();
              ev.stopPropagation();
            },
            false
          );
        }

        var OSG_BEST_PRICE_RETAIL_GROUPS = [
          {
            slug: "stock",
            titleKey: "personalRetailStockTitle",
            items:
              "Makro · Big C · Lotus's · Robinson · Tops (incl. Tops Daily/Food Hall) · 7‑Eleven · Central Department Store · Gourmet Market · Villa Market · Foodland · King Power Duty Free (Auswahl nach Region)",
          },
          {
            slug: "marketplaces",
            titleKey: "personalRetailMarketplacesTitle",
            items:
              "Lazada · Shopee · JD Central · Banana IT · JIB Computer Group · Advice IT Infinite · Power Buy · OfficeMate",
          },
          {
            slug: "healthBeauty",
            titleKey: "personalRetailHealthTitle",
            items:
              "Watsons · Boots · Gourmet Market (Crossover Gesundheit) · Hersteller-/DTC‑Pins (Illustration Dreame‑Style Akkusauger‑Bundles)",
          },
          {
            slug: "diyTech",
            titleKey: "personalRetailDiyTechTitle",
            items:
              "Thai Watsadu · HomePro · Boonthavorn · Global House · DoHome · Mega Home · IKEA Thailand · Index Living Mall · SB Design Square",
          },
          {
            slug: "mobility",
            titleKey: "personalMobilityRetailersTitle",
            items:
              "Zweirad/Leasing Honda · Yamaha · Kawasaki · Suzuki · Toyota PKW/Nutz · Isuzu Nutzfahrzeuge · Finanzpakete exemplarisch Kasikorn / SCB / Bangkok Bank",
          },
        ];

        var OSG_MAP_CHAIN_QUERIES = [
          "7-Eleven",
          "Big C",
          "Lotus's",
          "Tops Market",
          "Makro",
          "Central",
          "Villa Market",
          "Robinson",
        ];

        function osgSanitizeMembershipNotes(raw) {
          if (raw == null) return "";
          var s = String(raw).replace(/\u0000/g, "");
          if (s.length > 2000) s = s.slice(0, 2000);
          return s;
        }

        function osgMembershipNotesRead() {
          try {
            return String(localStorage.getItem(OSG_LS_MEMBERSHIP_NOTES) || "");
          } catch (_) {
            return "";
          }
        }

        function osgPersistMembershipNotes(text) {
          try {
            var s = osgSanitizeMembershipNotes(text);
            if (s.trim()) localStorage.setItem(OSG_LS_MEMBERSHIP_NOTES, s);
            else localStorage.removeItem(OSG_LS_MEMBERSHIP_NOTES);
          } catch (_) {}
        }

        function osgHasMembershipProfile() {
          return !!osgMembershipNotesRead().trim();
        }

        function osgLoadMembershipIntoInput(inp) {
          if (!inp) return;
          try {
            inp.value = osgMembershipNotesRead();
          } catch (_) {
            inp.value = "";
          }
        }

        var __osgPersonalWired = false;

        function osgPersonalOnboardState() {
          try {
            return String(localStorage.getItem(OSG_LS_PERSONAL_ONBOARD) || "");
          } catch (_) {
            return "";
          }
        }

        function osgMarkPersonalOnboardDone(how) {
          try {
            var v =
              how === "saved" || how === "named"
                ? "saved"
                : how === "skipped"
                  ? "skipped"
                  : "skipped";
            localStorage.setItem(OSG_LS_PERSONAL_ONBOARD, v);
          } catch (_) {}
        }

        function osgMapConsentRead() {
          try {
            return String(localStorage.getItem(OSG_LS_MAP_GEO_CONSENT) || "");
          } catch (_) {
            return "";
          }
        }

        function osgMapConsentWrite(v) {
          try {
            localStorage.setItem(OSG_LS_MAP_GEO_CONSENT, v);
          } catch (_) {}
        }

        function osgGeoLangParam() {
          var l = (document.documentElement.lang || "de").toLowerCase();
          if (l.indexOf("zh") === 0) return "zh-CN";
          if (l === "th") return "th";
          if (l === "pl") return "pl";
          if (l === "ru") return "ru";
          if (l === "en") return "en";
          return "de";
        }

        function osgPickGreetingPhase() {
          var h = new Date().getHours();
          if (h >= 5 && h < 12) return "Morning";
          if (h >= 12 && h < 17) return "Midday";
          if (h >= 17 && h < 22) return "Evening";
          return "Night";
        }

        function osgTplGreetingPersonalized(pack, phase, hasMembership) {
          var nm = osgResolveCustomerFirstName();
          var withNameK = "personalGreet" + phase + "WithName";
          var memK = "personalGreet" + phase + "WithMembership";
          var noK = "personalGreet" + phase + "NoName";
          var tpl = "";
          if (hasMembership && pack[memK]) tpl = pack[memK];
          else if (nm && pack[withNameK]) tpl = pack[withNameK];
          else tpl = pack[noK];
          tpl = tpl ? String(tpl) : "";
          if (!tpl) return "";
          return tpl.replace(/\{NAME\}/g, nm || "");
        }

        function osgRefreshPersonalGreeting(pack) {
          var line = document.getElementById("personal-greeting-line");
          var tx = document.getElementById("personal-greeting-text");
          var ed = document.getElementById("personal-greeting-edit-discount");
          if (!line || !tx || !pack) return;
          var hasM = osgHasMembershipProfile();
          var phase = osgPickGreetingPhase();
          var msg = osgTplGreetingPersonalized(pack, phase, hasM);
          if (!msg) {
            line.setAttribute("hidden", "");
            line.classList.remove("is-visible");
            return;
          }
          tx.textContent = msg;
          line.removeAttribute("hidden");
          line.classList.add("is-visible");
          if (ed) {
            ed.textContent = pack.personalDiscountProfileBtn || "";
            ed.removeAttribute("hidden");
          }
        }

        function osgRenderRetailerGroups(pack) {
          var host = document.getElementById("personal-retailer-groups");
          if (!host || !pack) return;
          var html = "";
          for (var i = 0; i < OSG_BEST_PRICE_RETAIL_GROUPS.length; i++) {
            var g = OSG_BEST_PRICE_RETAIL_GROUPS[i];
            var title = pack[g.titleKey] || g.slug;
            html +=
              '<section class="personal-retailer-group" aria-labelledby="osg-rg-' +
              g.slug +
              '"><h3 id="osg-rg-' +
              g.slug +
              '" class="personal-retailer-group-title">' +
              osgEscHtml(title) +
              "</h3><p class=\"personal-retailer-group-body\">" +
              osgEscHtml(g.items) +
              "</p></section>";
          }
          host.innerHTML = html;
        }

        function osgMapsEmbedUrl(lat, lng) {
          var latN = Number(lat);
          var lngN = Number(lng);
          if (!isFinite(latN) || !isFinite(lngN)) return "";
          return (
            "https://maps.google.com/maps?q=" +
            encodeURIComponent(latN + "," + lngN) +
            "&hl=" +
            encodeURIComponent(osgGeoLangParam()) +
            "&z=15&output=embed"
          );
        }

        function osgRenderMapChainLinks(lat, lng, pack) {
          var host = document.getElementById("personal-map-chain-host");
          if (!host || !pack) return;
          var latN = Number(lat);
          var lngN = Number(lng);
          if (!isFinite(latN) || !isFinite(lngN)) {
            host.innerHTML = "";
            return;
          }
          var base = pack.personalMapsNearSearchLabel || "Nearby";
          host.setAttribute("aria-label", base);
          var bits = [];
          for (var i = 0; i < OSG_MAP_CHAIN_QUERIES.length; i++) {
            var q = OSG_MAP_CHAIN_QUERIES[i];
            var href =
              "https://www.google.com/maps/search/" +
              encodeURIComponent(q) +
              "/@" +
              latN +
              "," +
              lngN +
              ",14z";
            bits.push(
              '<a class="personal-map-chain-link" href="' +
                osgEscHtml(href) +
                '" target="_blank" rel="noopener noreferrer">' +
                osgEscHtml(q) +
                "</a>"
            );
          }
          host.innerHTML = bits.join("");
        }

        function osgShowGeoMap(lat, lng, pack) {
          var stage = document.getElementById("personal-map-stage");
          var iframe = document.getElementById("personal-map-iframe");
          if (!stage || !iframe || !pack) return;
          var src = osgMapsEmbedUrl(lat, lng);
          if (!src) return;
          iframe.setAttribute("title", pack.personalMapsIframeTitle || "Map");
          iframe.src = src;
          stage.removeAttribute("hidden");
          osgRenderMapChainLinks(lat, lng, pack);
        }

        function osgRefreshMapPanel(pack) {
          var st = document.getElementById("personal-map-status");
          var stage = document.getElementById("personal-map-stage");
          var iframe = document.getElementById("personal-map-iframe");
          var ext = document.getElementById("personal-map-external-note");
          if (!pack) return;
          var c = osgMapConsentRead();
          if (ext) ext.textContent = pack.personalMapsExternalNote || "";
          if (c === "declined") {
            if (st) st.textContent = pack.personalMapsDeclinedStatus || "";
            if (stage) stage.setAttribute("hidden", "");
            if (iframe) iframe.src = "about:blank";
          } else if (c === "granted") {
            if (st) st.textContent = pack.personalMapsGrantedHint || "";
          } else if (st) st.textContent = "";
        }

        function osgTryActivateGeolocation(pack) {
          if (!pack) return;
          var st = document.getElementById("personal-map-status");
          if (!navigator.geolocation) {
            if (st) st.textContent = pack.personalMapsNoApi || "";
            return;
          }
          if (st) st.textContent = pack.personalMapsLocating || "";
          navigator.geolocation.getCurrentPosition(
            function (pos) {
              osgMapConsentWrite("granted");
              var la = pos.coords.latitude;
              var lo = pos.coords.longitude;
              osgShowGeoMap(la, lo, pack);
              osgRefreshMapPanel(pack);
              if (st) st.textContent = pack.personalMapsOkStatus || "";
            },
            function () {
              if (st) st.textContent = pack.personalMapsGeoDenied || "";
            },
            { enableHighAccuracy: true, maximumAge: 60000, timeout: 20000 }
          );
        }

        function osgLoadSavingsForm() {
          var ta = document.getElementById("personal-saving-coupon-notes");
          var sel = document.getElementById("personal-saving-ship-tier");
          try {
            if (ta) {
              var n = localStorage.getItem(OSG_LS_LOCAL_COUPON_NOTES);
              ta.value = n != null ? String(n) : "";
            }
            if (sel) {
              var t = localStorage.getItem(OSG_LS_DELIVERY_TIER);
              if (t && /^(39|59|99)$/.test(t)) sel.value = t;
            }
          } catch (_) {}
        }

        function osgPersistSavingsForm() {
          var ta = document.getElementById("personal-saving-coupon-notes");
          var sel = document.getElementById("personal-saving-ship-tier");
          try {
            if (ta) localStorage.setItem(OSG_LS_LOCAL_COUPON_NOTES, ta.value);
            if (sel) localStorage.setItem(OSG_LS_DELIVERY_TIER, sel.value);
          } catch (_) {}
        }

        function osgHydratePersonalPanels(pack) {
          if (!pack) return;
          var el;
          el = document.getElementById("personal-privacy-heading");
          if (el) el.textContent = pack.personalPrivacyTitle || "";
          el = document.getElementById("personal-privacy-body");
          if (el) el.innerHTML = pack.personalPrivacyBodyHtml || "";
          el = document.getElementById("personal-privacy-arch");
          if (el) el.innerHTML = pack.personalPrivacyArchitectHtml || "";
          el = document.getElementById("personal-privacy-tracking-note");
          if (el) el.textContent = pack.personalPrivacyTrackingNote || "";

          el = document.getElementById("personal-membership-heading");
          if (el) el.textContent = pack.personalMembershipHeading || "";
          el = document.getElementById("personal-membership-lead");
          if (el) el.textContent = pack.personalMembershipLead || "";

          el = document.getElementById("personal-payout-heading");
          if (el) el.textContent = pack.personalPayoutHeading || "";
          el = document.getElementById("personal-payout-lead");
          if (el) el.textContent = pack.personalPayoutLead || "";
          el = document.getElementById("personal-payout-account-label");
          if (el) el.textContent = pack.personalPayoutAccountLabel || "";
          el = document.getElementById("personal-payout-hint");
          if (el) el.textContent = pack.personalPayoutHint || "";
          var payoutInp = document.getElementById("personal-payout-account-input");
          if (payoutInp) {
            if (pack.personalPayoutAccountInputAria) {
              payoutInp.setAttribute("aria-label", pack.personalPayoutAccountInputAria);
            }
            osgLoadPayoutAccountIntoInput(payoutInp);
          }

          el = document.getElementById("personal-map-heading");
          if (el) el.textContent = pack.personalMapsTitle || "";
          el = document.getElementById("personal-map-lead");
          if (el) el.textContent = pack.personalMapsLead || "";
          el = document.getElementById("personal-map-allow-btn");
          if (el) el.textContent = pack.personalMapsAllowBtn || "";
          el = document.getElementById("personal-map-decline-btn");
          if (el) el.textContent = pack.personalMapsDeclineBtn || "";

          el = document.getElementById("personal-retailer-heading");
          if (el) el.textContent = pack.personalRetailerHeading || "";
          el = document.getElementById("personal-retailer-lead");
          if (el) el.textContent = pack.personalRetailerLead || "";
          osgRenderRetailerGroups(pack);

          el = document.getElementById("personal-saving-heading");
          if (el) el.textContent = pack.personalSavingHeading || "";
          var steps = document.getElementById("personal-saving-steps");
          if (steps) {
            var rawItems = [
              pack.personalSavingStep1,
              pack.personalSavingStep2,
              pack.personalSavingStep3,
              pack.personalSavingStep4,
              pack.personalSavingStep5,
              pack.personalSavingStep6,
              pack.personalSavingStep7,
            ];
            var filtered = rawItems.filter(Boolean);
            var capNum = Number(pack.personalSavingListMax);
            var cap =
              isFinite(capNum) && capNum >= 1 && capNum <= 12
                ? capNum
                : filtered.length;
            steps.innerHTML = filtered
              .slice(0, cap)
              .map(function (s) {
                return "<li>" + osgEscHtml(s) + "</li>";
              })
              .join("");
          }
          el = document.getElementById("personal-saving-coupon-label");
          if (el) el.textContent = pack.personalSavingCouponLabel || "";
          el = document.getElementById("personal-saving-ship-label");
          if (el) el.textContent = pack.personalSavingShipLabel || "";
          el = document.getElementById("personal-saving-ship-hint");
          if (el) el.textContent = pack.personalSavingShipHint || "";
          el = document.getElementById("personal-saving-footer");
          if (el) el.textContent = pack.personalSavingFooter || "";

          el = document.getElementById("bin-check-label-span");
          if (el) el.textContent = pack.binCheckLabel || "";

          el = document.getElementById("personal-onboarding-heading");
          if (el) el.textContent = pack.personalOnboardingTitle || "";
          el = document.getElementById("personal-onboarding-lead");
          if (el) el.textContent = pack.personalOnboardingLead || "";
          el = document.getElementById("personal-onboarding-question");
          if (el) el.textContent = pack.personalOnboardingQuestion || "";
          el = document.getElementById("personal-onboarding-name-label");
          if (el)
            el.textContent =
              pack.personalOnboardingPreferredNameLabel ||
              pack.personalOnboardingMembershipLabel ||
              "";
          el = document.getElementById("personal-onboarding-membership-label");
          if (el)
            el.textContent =
              pack.personalOnboardingMembershipLabel ||
              pack.personalOnboardingNameLabel ||
              "";
          el = document.getElementById("personal-onboarding-privacy-mini");
          if (el) el.textContent = pack.personalOnboardingPrivacyMini || "";
          el = document.getElementById("personal-onboarding-save");
          if (el) el.textContent = pack.personalOnboardingSave || "";
          el = document.getElementById("personal-onboarding-skip");
          if (el) el.textContent = pack.personalOnboardingSkip || "";
          el = document.getElementById("personal-onboarding-cancel");
          if (el) el.textContent = pack.personalOnboardingLater || "";

          osgLoadSavingsForm();
          osgRefreshMapPanel(pack);
          osgRefreshPersonalGreeting(pack);

          var consent = osgMapConsentRead();
          if (consent === "granted") {
            osgTryActivateGeolocation(pack);
          }
        }

        function osgHidePersonalOnboarding() {
          var ov = document.getElementById("personal-onboarding-overlay");
          var inp = document.getElementById(
            "personal-onboarding-membership-input"
          );
          if (ov) {
            ov.setAttribute("hidden", "");
            ov.setAttribute("aria-hidden", "true");
          }
          if (inp) osgLoadMembershipIntoInput(inp);
          try {
            document.body.style.overflow = "";
          } catch (_) {}
        }

        function osgShowPersonalOnboarding() {
          var ov = document.getElementById("personal-onboarding-overlay");
          var inp = document.getElementById(
            "personal-onboarding-membership-input"
          );
          var nin = document.getElementById("personal-onboarding-name-input");
          var pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (function () {
              try {
                return T[normalizeLang(localStorage.getItem("osg-lang"))];
              } catch (_) {}
              return T.de;
            })();
          if (!ov || !inp || !pack) return;
          osgHydratePersonalPanels(pack);
          osgLoadMembershipIntoInput(inp);
          if (nin) {
            nin.value = osgResolveCustomerFirstName();
            nin.setAttribute(
              "placeholder",
              pack.personalOnboardingNamePlaceholder || ""
            );
          }
          ov.removeAttribute("hidden");
          ov.setAttribute("aria-hidden", "false");
          try {
            document.body.style.overflow = "hidden";
          } catch (_) {}
          setTimeout(function () {
            try {
              if (nin && !String(nin.value || "").trim()) nin.focus();
              else inp.focus();
            } catch (_) {}
          }, 120);
        }

        function osgMaybeShowPersonalOnboarding() {
          if (osgPersonalOnboardState()) return;
          osgShowPersonalOnboarding();
        }

        function osgWirePersonalExperienceOnce() {
          if (__osgPersonalWired) return;
          __osgPersonalWired = true;
          var save = document.getElementById("personal-onboarding-save");
          var skip = document.getElementById("personal-onboarding-skip");
          var cancel = document.getElementById("personal-onboarding-cancel");
          var inp = document.getElementById(
            "personal-onboarding-membership-input"
          );
          if (save)
            save.addEventListener("click", function () {
              var nin = document.getElementById("personal-onboarding-name-input");
              osgPersistUserProfile({
                userName: nin ? nin.value : "",
              });
              var raw = inp ? inp.value : "";
              osgPersistMembershipNotes(raw);
              osgMarkPersonalOnboardDone(
                osgMembershipNotesRead().trim() ||
                osgResolveCustomerDisplayName()
                  ? "saved"
                  : "skipped"
              );
              window.__OSG_AVATAR_PENDING_NAME_ASK__ = false;
              osgHidePersonalOnboarding();
              var pack = window.__OSG_CURRENT_PACK_CACHE;
              if (pack) {
                osgRefreshPersonalGreeting(pack);
              }
            });
          if (skip)
            skip.addEventListener("click", function () {
              osgMarkPersonalOnboardDone("skipped");
              window.__OSG_AVATAR_PENDING_NAME_ASK__ = false;
              osgHidePersonalOnboarding();
              var pack = window.__OSG_CURRENT_PACK_CACHE;
              if (pack) osgRefreshPersonalGreeting(pack);
            });
          if (cancel)
            cancel.addEventListener("click", function () {
              osgHidePersonalOnboarding();
            });
          var draftConfirm = document.getElementById("osg-draft-confirm-btn");
          var draftCancel = document.getElementById("osg-draft-confirm-cancel");
          if (draftConfirm) {
            draftConfirm.addEventListener("click", function () {
              if (typeof window.__OSG_DRAFT_CONFIRM_HANDLER__ === "function") {
                window.__OSG_DRAFT_CONFIRM_HANDLER__("confirm");
                return;
              }
              if (typeof window.osgResetComplaintLiveContext === "function") {
                window.osgResetComplaintLiveContext();
                return;
              }
              if (typeof window.osgClearComplaintConversationState === "function") {
                window.osgClearComplaintConversationState();
                return;
              }
              if (
                window.OSG_DRAFT_OWNERSHIP &&
                typeof window.OSG_DRAFT_OWNERSHIP.clearWorkflow === "function"
              ) {
                window.OSG_DRAFT_OWNERSHIP.clearWorkflow();
              } else if (
                window.OSG_DRAFT_OWNERSHIP &&
                typeof window.OSG_DRAFT_OWNERSHIP.clearPending === "function"
              ) {
                window.OSG_DRAFT_OWNERSHIP.clearPending();
              }
              if (
                window.OSG_RECLAMATION_COMPLIANCE &&
                typeof window.OSG_RECLAMATION_COMPLIANCE.clearSession === "function"
              ) {
                window.OSG_RECLAMATION_COMPLIANCE.clearSession();
              }
              osgHideDraftConfirmOverlay();
            });
          }
          if (draftCancel) {
            draftCancel.addEventListener("click", function () {
              if (typeof window.__OSG_DRAFT_CONFIRM_HANDLER__ === "function") {
                window.__OSG_DRAFT_CONFIRM_HANDLER__("reject");
                return;
              }
              if (typeof window.osgResetComplaintLiveContext === "function") {
                window.osgResetComplaintLiveContext();
                return;
              }
              if (typeof window.osgClearComplaintConversationState === "function") {
                window.osgClearComplaintConversationState();
                return;
              }
              if (
                window.OSG_DRAFT_OWNERSHIP &&
                typeof window.OSG_DRAFT_OWNERSHIP.clearWorkflow === "function"
              ) {
                window.OSG_DRAFT_OWNERSHIP.clearWorkflow();
              } else if (
                window.OSG_DRAFT_OWNERSHIP &&
                typeof window.OSG_DRAFT_OWNERSHIP.clearPending === "function"
              ) {
                window.OSG_DRAFT_OWNERSHIP.clearPending();
              }
              if (
                window.OSG_RECLAMATION_COMPLIANCE &&
                typeof window.OSG_RECLAMATION_COMPLIANCE.clearSession === "function"
              ) {
                window.OSG_RECLAMATION_COMPLIANCE.clearSession();
              }
              osgHideDraftConfirmOverlay();
            });
          }
          var ch = document.getElementById("personal-greeting-edit-discount");
          if (ch)
            ch.addEventListener("click", function () {
              osgShowPersonalOnboarding();
            });
          var allow = document.getElementById("personal-map-allow-btn");
          var decline = document.getElementById("personal-map-decline-btn");
          if (allow)
            allow.addEventListener("click", function () {
              var pack = window.__OSG_CURRENT_PACK_CACHE || T[normalizeLang("de")];
              osgTryActivateGeolocation(pack);
            });
          if (decline)
            decline.addEventListener("click", function () {
              osgMapConsentWrite("declined");
              var pack = window.__OSG_CURRENT_PACK_CACHE;
              osgRefreshMapPanel(pack || T.de);
              var iframe = document.getElementById("personal-map-iframe");
              var stage = document.getElementById("personal-map-stage");
              if (iframe) iframe.src = "about:blank";
              if (stage) stage.setAttribute("hidden", "");
            });
          var ta = document.getElementById("personal-saving-coupon-notes");
          var sel = document.getElementById("personal-saving-ship-tier");
          if (ta)
            ta.addEventListener("input", function () {
              osgPersistSavingsForm();
            });
          if (sel)
            sel.addEventListener("change", function () {
              osgPersistSavingsForm();
            });
          var payoutInp = document.getElementById("personal-payout-account-input");
          if (payoutInp) {
            payoutInp.addEventListener("change", function () {
              osgPersistUserProfile({
                payoutAccountNumber: payoutInp.value,
              });
            });
            payoutInp.addEventListener("blur", function () {
              osgPersistUserProfile({
                payoutAccountNumber: payoutInp.value,
              });
            });
          }
          var overlayRoot = document.getElementById("personal-onboarding-overlay");
          if (overlayRoot) {
            overlayRoot.addEventListener("click", function (ev) {
              if (ev.target === overlayRoot) osgHidePersonalOnboarding();
            });
          }
          document.addEventListener("keydown", function (ev) {
            if ((ev.key || "").toLowerCase() !== "escape") return;
            var ov = document.getElementById("personal-onboarding-overlay");
            if (ov && !ov.hasAttribute("hidden")) osgHidePersonalOnboarding();
          });
        }

        function osgVoidSevenVoucherBecauseTrackingStopped() {
          var v = osgLoadVoucherProof();
          if (!v) return false;
          var freshUntil =
            typeof v.validUntilISO === "string" &&
            Date.now() < Date.parse(v.validUntilISO);
          try {
            localStorage.removeItem(OSG_LS_VOUCHER_PROOF);
          } catch (_) {}
          osgHideVoucherQrShell();
          if (!freshUntil) return true;
          var ts = new Date().toISOString();
          osgAppendLeadJournal({
            leadId: osgNewLeadId(),
            customerId: osgEnsureCustomerId(),
            osg_partner: "seven_eleven_excl",
            osg_ch: "seven_voucher_voided_tracking_disabled",
            landingHref: "internal:seven_pickup_voucher_void_tracking_off",
            trackedHref: "",
            clickedAtISO: ts,
            conversionBasis: false,
            leadIntent: "seven_voucher_invalidated_tracking_off",
            voucherCode: v.voucherCode || OSG_VOUCHER_CODE_PRIMARY,
            voucherThb: Number(v.voucherThb) || OSG_VOUCHER_THB_PRIMARY,
            pickupFulfillment: "seven_eleven",
          });
          return true;
        }

        function osgNewLeadId() {
          return "osgl_" + Date.now() + "_" + osgRandHex(4);
        }

        function osgStripOsgParamsSearch(u) {
          var keys = [];
          u.searchParams.forEach(function (_v, k) {
            if (/^osg_/i.test(k)) keys.push(k);
          });
          keys.forEach(function (k) {
            u.searchParams.delete(k);
          });
        }

        function osgAffiliateTrackedUrl(
          rawHref,
          partnerSlug,
          channel,
          leadIntent,
          trackExtras
        ) {
          var cid = osgEnsureCustomerId();
          var lid = osgNewLeadId();
          var lint =
            typeof leadIntent === "string" && leadIntent.trim()
              ? leadIntent.trim()
              : "";
          var u;
          try {
            u = new URL(rawHref, window.location.href);
          } catch (_) {
            return { href: rawHref, leadId: lid, customerId: cid };
          }
          osgStripOsgParamsSearch(u);
          u.searchParams.set("osg_src", OSG_AFF_TOKEN);
          u.searchParams.set("osg_cid", cid);
          u.searchParams.set("osg_lid", lid);
          u.searchParams.set("osg_partner", partnerSlug);
          u.searchParams.set("osg_ch", channel);
          u.searchParams.set("osg_ts", String(Date.now()));
          if (lint) u.searchParams.set("osg_intent", lint);
          var pch = String(partnerSlug || "");
          var och = String(channel || "");
          var isMarket =
            och === "marketplace" ||
            /lazada|shopee/i.test(pch + och);
          if (isMarket) {
            u.searchParams.set("osg_market_sub", OSG_MARKETPLACE_SUB_ID);
          }
          return { href: u.href, leadId: lid, customerId: cid };
        }

        function osgPauliAffiliateModules() {
          return {
            retailApi: {
              moduleId: "retail_api",
              label: "Retail-API",
              active: true,
              affiliateId: "1085689",
              scope: "ecommerce_grocery_retail",
            },
            financeModule: {
              moduleId: "finance_module",
              label: "Finanz-Modul",
              active: false,
              affiliateId: null,
              scope: "finance_insurance_bank_excluded",
            },
          };
        }

        function osgIsFinanceModulePartner(partner, channel) {
          var ch = String(channel || "").toLowerCase();
          if (
            ch === "bank" ||
            ch === "insurance" ||
            ch === "real_estate" ||
            ch === "finance"
          ) {
            return true;
          }
          var p = String(partner || "").toLowerCase();
          return (
            p === "kasikorn" ||
            p === "roojai" ||
            p === "real_estate" ||
            p === "real_estate_th"
          );
        }

        function osgResolveInvolvePartnerKey(partner, channel) {
          if (osgIsFinanceModulePartner(partner, channel)) return "";
          var p = String(partner || "").toLowerCase();
          var ch = String(channel || "").toLowerCase();
          if (p === "lazada" || p === "lazada_th") return "lazada_th";
          if (p === "shopee" || p === "shopee_th") return "shopee_th";
          if (
            (p === "bigc" || p === "bigc_th") &&
            (ch === "retail" || ch === "marketplace")
          ) {
            return "bigc_th";
          }
          if (
            (p === "lotus" || p === "lotuss" || p === "lotus_th") &&
            (ch === "retail" || ch === "marketplace")
          ) {
            return "lotus_th";
          }
          return "";
        }

        /** Retail-API 1085689 — nur E-Commerce/Lebensmittel (Involve-Deeplink) */
        function osgIsInvolveMarketplacePartner(partner, channel) {
          if (osgIsFinanceModulePartner(partner, channel)) return false;
          if (!osgPauliAffiliateModules().retailApi.active) return false;
          return !!osgResolveInvolvePartnerKey(partner, channel);
        }

        function osgFetchInvolveDeeplink(partner, landingUrl, cid, lid, channel) {
          var involveKey = osgResolveInvolvePartnerKey(partner, channel);
          return osgApiFetch("/api/affiliate/deeplink", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partner: involveKey || String(partner || ""),
              url: String(landingUrl || ""),
              osgCid: String(cid || ""),
              osgLid: String(lid || ""),
              channel: String(channel || "marketplace"),
            }),
          }).then(function (r) {
            if (!r.ok) {
              var err = new Error("deeplink_http_" + r.status);
              err.status = r.status;
              throw err;
            }
            return r.json();
          });
        }

        function osgLoadJournal() {
          try {
            var raw = localStorage.getItem(OSG_LS_JOURNAL);
            var j = raw ? JSON.parse(raw) : [];
            return Array.isArray(j) ? j : [];
          } catch (_) {
            return [];
          }
        }

        function osgSaveJournal(rows) {
          try {
            localStorage.setItem(OSG_LS_JOURNAL, JSON.stringify(rows));
          } catch (_) {}
        }

        function osgFnv1a32(str) {
          var h = 2166136261 >>> 0;
          var s = String(str || "");
          for (var i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
          }
          return h >>> 0;
        }

        function osgJournalMixHash(prev, payload) {
          var a = osgFnv1a32(String(prev || "") + "|" + String(payload || ""));
          var b = osgFnv1a32(String(payload || "") + "|" + String(prev || ""));
          return (
            ("00000000" + a.toString(16)).slice(-8) +
            ("00000000" + b.toString(16)).slice(-8)
          );
        }

        function osgJournalCanonicalPayload(row) {
          var keys = [
            "leadId",
            "customerId",
            "clickedAtISO",
            "osg_partner",
            "osg_ch",
            "landingHref",
            "trackedHref",
            "leadIntent",
          ];
          var parts = [];
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            parts.push(k + "=" + (row[k] != null ? String(row[k]) : ""));
          }
          return parts.join("&");
        }

        function osgJournalChainRead() {
          try {
            var raw = localStorage.getItem(OSG_LS_JOURNAL_CHAIN);
            var o = raw ? JSON.parse(raw) : null;
            if (!o || typeof o !== "object") return { seq: 0, lastHash: "genesis" };
            return {
              seq: Math.max(0, Number(o.seq) || 0),
              lastHash: String(o.lastHash || "genesis").slice(0, 96),
            };
          } catch (_) {
            return { seq: 0, lastHash: "genesis" };
          }
        }

        function osgJournalChainWrite(meta) {
          try {
            localStorage.setItem(OSG_LS_JOURNAL_CHAIN, JSON.stringify(meta));
          } catch (_) {}
        }

        function osgEnsureInstallDeviceAnchor() {
          var b = osgLoadInstallBundle() || osgEnsureArchInstall();
          if (b.deviceAnchorHex && String(b.deviceAnchorHex).length >= 16) {
            if (!b.deviceHardwareId) {
              b.deviceHardwareId = String(b.deviceAnchorHex || "").slice(0, 128);
              osgSaveInstallBundle(b);
            }
            return;
          }
          /** Web/PWA ohne IMEI: Anker aus Install-Nonce + Oberflächenmerkmalen (nur dieses Gerät). */
          var nb = String(b.installNonce || "");
          var surf =
            typeof navigator !== "undefined"
              ? [
                  navigator.userAgent || "",
                  navigator.language || "",
                  typeof screen !== "undefined"
                    ? String(screen.width) + "x" + String(screen.height)
                    : "",
                  String(navigator.hardwareConcurrency || ""),
                  String(navigator.maxTouchPoints || ""),
                  String(navigator.deviceMemory || ""),
                ].join("\u001e")
              : "";
          b.deviceAnchorHex =
            osgJournalMixHash(nb, surf) + osgJournalMixHash(surf + nb, "osd");
          b.deviceHardwareId = String(b.deviceAnchorHex || "").slice(0, 128);
          b.deviceAnchoredAtISO = new Date().toISOString();
          osgSaveInstallBundle(b);
        }

        function osgRegisterReferralParentTrialDeferred() {
          function send() {
            try {
              if (!navigator.onLine) return;
              var ref = osgOwnReferralCode();
              var b = osgEnsureArchInstall();
              var iso = String(b.installedAtISO || "").trim();
              if (!iso || !/^\d{4}-\d{2}-\d{2}T/.test(iso)) return;
              osgApiFetch("/api/referral/register-meta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  parentRef: ref.slice(0, 96),
                  trialStartISO: iso.slice(0, 40),
                }),
                cache: "no-store",
              }).catch(function () {});
            } catch (_) {}
          }
          try {
            setTimeout(send, 600);
          } catch (_) {
            send();
          }
        }

        function osgPremiumLockUiHydrateAndWireOnce() {
          if (window.__OSG_PREMIUM_WALL_WIRED__) return;
          window.__OSG_PREMIUM_WALL_WIRED__ = true;
          var btn = document.getElementById("osg-demo-unlock-premium-btn");
          if (btn)
            btn.addEventListener(
              "click",
              function () {
                osgSetPostTrialPaid(true);
                osgRefreshPremiumLockUi();
              },
              false
            );
        }

        function osgRefreshPremiumLockUi(pack) {
          var ov = document.getElementById("osg-premium-lock-overlay");
          var pan = document.getElementById("partner-affiliate-panel");
          pack =
            pack ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          var ok = osgPremiumAccessUnlocked();
          osgPremiumLockUiHydrateAndWireOnce();
          if (pan) pan.classList.toggle("osg-premium-locked-shell", !ok);
          if (ov) {
            if (ok) ov.setAttribute("hidden", "");
            else {
              ov.removeAttribute("hidden");
              var h = ov.querySelector(".osg-premium-lock-overlay__heading");
              var pEl = ov.querySelector(".osg-premium-lock-overlay__lead");
              var qr = ov.querySelector(".osg-premium-lock-overlay__qr-note");
              var db = document.getElementById("osg-demo-unlock-premium-btn");
              if (h) h.textContent = pack.premiumWallHeading || "";
              if (pEl) pEl.textContent = pack.premiumWallLead || "";
              if (qr)
                qr.textContent = pack.premiumWallPromptpayNote || "";
              if (db && pack.premiumWallDemoUnlockBtn)
                db.textContent = pack.premiumWallDemoUnlockBtn;
            }
          }
        }

        function osgLoadCounts() {
          try {
            var raw = localStorage.getItem(OSG_LS_COUNTS);
            var o = raw ? JSON.parse(raw) : {};
            return o && typeof o === "object" ? o : {};
          } catch (_) {
            return {};
          }
        }

        function osgSaveCounts(o) {
          try {
            localStorage.setItem(OSG_LS_COUNTS, JSON.stringify(o));
          } catch (_) {}
        }

        function osgBumpLeadCount(partnerSlug) {
          var c = osgLoadCounts();
          var k = String(partnerSlug || "unknown");
          c[k] = (Number(c[k]) || 0) + 1;
          osgSaveCounts(c);
          return c;
        }

        function osgRefreshLeadSummaryPre() {
          var el = document.getElementById("osg-lead-summary-pre");
          if (!el) return;
          var c = osgLoadCounts();
          var lines = [];
          var sum = 0;
          Object.keys(c)
            .sort()
            .forEach(function (k) {
              var n = Number(c[k]) || 0;
              sum += n;
              lines.push(k + ": " + n);
            });
          el.textContent =
            "Leads gesamt " +
            sum +
            (lines.length ? "\n" + lines.join("\n") : "") +
            "\ncid:" +
            osgEnsureCustomerId();
        }

        function osgMirrorLeadToServer(row) {
          var mirrorRow = osgSanitizeLeadPayloadForMirror(row);

          function enqueue() {
            try {
              var q = osgOutboxLoad();
              q.push({
                row: mirrorRow,
                enqueuedAt: new Date().toISOString(),
              });
              osgOutboxSave(q);
            } catch (_) {}
          }
          function fallbackPost() {
            if (!navigator.onLine) {
              enqueue();
              return;
            }
            try {
              osgApiFetch("/api/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mirrorRow),
                keepalive: true,
              })
                .then(function (r) {
                  if (!r.ok) enqueue();
                })
                .catch(function () {
                  enqueue();
                });
            } catch (_) {
              enqueue();
            }
          }
          try {
            var body = JSON.stringify(mirrorRow);
            if (navigator.onLine && navigator.sendBeacon) {
              var ok = navigator.sendBeacon(
                osgApiUrl("/api/lead"),
                new Blob([body], { type: "application/json" })
              );
              if (ok) return;
            }
            fallbackPost();
          } catch (_) {
            fallbackPost();
          }
        }

        function osgOutboxLoad() {
          try {
            var raw = localStorage.getItem(OSG_LS_API_OUTBOX);
            var a = raw ? JSON.parse(raw) : [];
            return Array.isArray(a) ? a : [];
          } catch (_) {
            return [];
          }
        }

        function osgOutboxSave(a) {
          try {
            localStorage.setItem(
              OSG_LS_API_OUTBOX,
              JSON.stringify(a.slice(-120))
            );
          } catch (_) {}
        }

        function osgFlushApiOutbox() {
          if (!navigator.onLine) return;
          var q = osgOutboxLoad();
          if (!q.length) return;
          var job = q[0];
          if (!job || !job.row) {
            q.shift();
            osgOutboxSave(q);
            osgFlushApiOutbox();
            return;
          }
          try {
            osgApiFetch("/api/lead", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(osgSanitizeLeadPayloadForMirror(job.row)),
              keepalive: false,
            })
              .then(function (r) {
                if (!r.ok) return;
                q.shift();
                osgOutboxSave(q);
                osgFlushApiOutbox();
              })
              .catch(function () {});
          } catch (_) {}
        }

        window.addEventListener("online", osgFlushApiOutbox, false);

        function osgAppendLeadJournal(row, opts) {
          var o = opts && typeof opts === "object" ? opts : {};
          var j = osgLoadJournal();
          try {
            var ch = osgJournalChainRead();
            var canon = osgJournalCanonicalPayload(row);
            var selfHash = osgJournalMixHash(ch.lastHash || "genesis", canon);
            row.journalSeq = (Number(ch.seq) || 0) + 1;
            row.journalPrevAnchor = String(ch.lastHash || "genesis").slice(0, 96);
            row.journalRowAnchor = String(selfHash).slice(0, 96);
            osgJournalChainWrite({
              seq: row.journalSeq,
              lastHash: row.journalRowAnchor,
            });
          } catch (_) {}
          j.push(row);
          if (j.length > OSG_JOURNAL_CAP) j.splice(0, j.length - OSG_JOURNAL_CAP);
          osgSaveJournal(j);
          if (!o.skipBump) osgBumpLeadCount(row.osg_partner);
          osgMirrorLeadToServer(row);
          osgRefreshLeadSummaryPre();
        }

        function osgMergeJournalExtras(row, extra) {
          if (!extra || typeof extra !== "object") return;
          if ("voucherCode" in extra && extra.voucherCode != null)
            row.voucherCode = String(extra.voucherCode);
          if ("voucherThb" in extra && extra.voucherThb != null)
            row.voucherThb = Number(extra.voucherThb);
          if ("qrScan" in extra) row.qrScan = !!extra.qrScan;
          if ("voucherActivated" in extra)
            row.voucherActivated = !!extra.voucherActivated;
          if ("marketplaceSubId" in extra && extra.marketplaceSubId != null)
            row.marketplaceSubId = String(extra.marketplaceSubId);
          if ("pickupFulfillment" in extra && extra.pickupFulfillment != null)
            row.pickupFulfillment = String(extra.pickupFulfillment);
          if ("voucherMinimumBasketThb" in extra && extra.voucherMinimumBasketThb != null)
            row.voucherMinimumBasketThb = Number(extra.voucherMinimumBasketThb);
          if ("deliveryPreference" in extra && extra.deliveryPreference != null)
            row.deliveryPreference = String(extra.deliveryPreference).slice(0, 40);
          if ("deliveryReason" in extra && extra.deliveryReason != null)
            row.deliveryReason = String(extra.deliveryReason).slice(0, 96);
        }

        function osgDeliveryPackLine(pack, key) {
          return String(
            (pack && pack[key]) ||
              (T.en && T.en[key]) ||
              (T.de && T.de[key]) ||
              ""
          ).trim();
        }

        function osgDeliveryInjectCommerceTpl(text) {
          var s = String(text || "");
          var C = window.OSG_COMMERCE;
          if (!C) return s;
          return s
            .replace(/\{SHIP_S\}/g, String(C.SHIP_THB_TIER_S || 39))
            .replace(/\{SHIP_M\}/g, String(C.SHIP_THB_TIER_M || 59))
            .replace(/\{SHIP_L\}/g, String(C.SHIP_THB_TIER_L || 99))
            .replace(
              /\{PLATFORM_FEE\}/g,
              String(C.PICKUP_SERVICE_MARGIN_THB || 59)
            );
        }

        function osgRecordDeliveryPreferenceJournal(mode, reason) {
          var pref =
            mode === "seven_pickup" ? "seven_pickup" : "marketplace";
          var ts = new Date().toISOString();
          osgAppendLeadJournal({
            leadId: osgNewLeadId(),
            customerId: osgEnsureCustomerId(),
            osg_partner: "delivery_preference",
            osg_ch: "fulfillment_choice",
            landingHref: "internal:delivery_preference_" + pref,
            trackedHref: "",
            clickedAtISO: ts,
            conversionBasis: false,
            leadIntent: "delivery_preference",
            pickupFulfillment:
              pref === "seven_pickup" ? "seven_eleven" : "marketplace",
            deliveryPreference: pref,
            deliveryReason: String(reason || "").slice(0, 96),
          });
        }

        function osgHydrateDeliveryChoiceUi(pack) {
          var heading = document.getElementById("delivery-choice-heading");
          if (heading)
            heading.textContent = osgDeliveryPackLine(
              pack,
              "delivery.panelHeading"
            );
          var prompt = document.getElementById("delivery-choice-prompt");
          if (prompt)
            prompt.textContent = osgDeliveryPackLine(
              pack,
              "delivery.choicePrompt"
            );
          var ht = document.getElementById("delivery-home-title");
          if (ht)
            ht.textContent = osgDeliveryPackLine(pack, "delivery.home.title");
          var hs = document.getElementById("delivery-home-short");
          if (hs)
            hs.textContent = osgDeliveryPackLine(pack, "delivery.home.short");
          var st = document.getElementById("delivery-seven-title");
          if (st)
            st.textContent = osgDeliveryPackLine(pack, "delivery.seven.title");
          var ss = document.getElementById("delivery-seven-short");
          if (ss)
            ss.textContent = osgDeliveryPackLine(pack, "delivery.seven.short");
          var bl = document.getElementById("delivery-seven-benefits-list");
          if (bl) {
            bl.setAttribute(
              "aria-label",
              osgDeliveryPackLine(pack, "delivery.benefitsListAria")
            );
            var benefitKeys = [
              "delivery.seven.safeStorage",
              "delivery.seven.noPhoneStress",
              "delivery.seven.nightPickup",
              "delivery.seven.bundle",
            ];
            var html = "";
            for (var bi = 0; bi < benefitKeys.length; bi++) {
              var bt = osgDeliveryPackLine(pack, benefitKeys[bi]);
              if (bt) html += "<li>" + osgEscHtml(bt) + "</li>";
            }
            bl.innerHTML = html;
          }
          var bn = document.getElementById("delivery-bundle-note");
          if (bn) {
            var bundleLine = osgDeliveryPackLine(pack, "delivery.seven.bundle");
            bn.textContent = bundleLine;
            if (!bundleLine) bn.setAttribute("hidden", "");
            else bn.removeAttribute("hidden");
          }
          var cp = document.getElementById("delivery-compare-price-note");
          if (cp) {
            cp.textContent = osgDeliveryInjectCommerceTpl(
              osgDeliveryPackLine(pack, "delivery.comparePriceNoteTpl")
            );
          }
          var ps = document.getElementById("delivery-prepared-status");
          if (ps)
            ps.textContent = osgDeliveryPackLine(
              pack,
              "delivery.preparedStatusNote"
            );
          var btn = document.getElementById("delivery-explain-voice-btn");
          if (btn) {
            btn.textContent = osgDeliveryPackLine(
              pack,
              "delivery.explainVoiceBtn"
            );
            btn.setAttribute(
              "aria-label",
              osgDeliveryPackLine(pack, "delivery.explainVoiceBtnAria")
            );
          }
          var fs = document.getElementById("pickup-mode-fieldset");
          if (fs) {
            fs.setAttribute(
              "aria-label",
              osgDeliveryPackLine(pack, "delivery.pickupFieldsetAria")
            );
          }
          var mr = document.getElementById("pickup-mode-marketplace");
          var sv = document.getElementById("pickup-mode-seven");
          var homeAria =
            osgDeliveryPackLine(pack, "delivery.home.title") +
            ". " +
            osgDeliveryPackLine(pack, "delivery.home.short");
          var sevenAria =
            osgDeliveryPackLine(pack, "delivery.seven.title") +
            ". " +
            osgDeliveryPackLine(pack, "delivery.seven.short");
          if (mr) mr.setAttribute("aria-label", homeAria);
          if (sv) sv.setAttribute("aria-label", sevenAria);
          osgRefreshDeliveryChoiceConfirm(pack);
        }

        function osgRefreshDeliveryChoiceConfirm(pack) {
          var el = document.getElementById("delivery-choice-confirm");
          if (!el) return;
          var mode = osgGetPickupMode();
          var key =
            mode === "seven_pickup"
              ? "delivery.choiceConfirmSeven"
              : "delivery.choiceConfirmHome";
          var line = osgDeliveryPackLine(pack, key);
          el.textContent = line;
          if (!line) el.setAttribute("hidden", "");
          else el.removeAttribute("hidden");
        }

        function osgWireDeliveryChoiceOnce() {
          var btn = document.getElementById("delivery-explain-voice-btn");
          if (!btn || btn.dataset.osgDeliveryWired === "1") return;
          btn.dataset.osgDeliveryWired = "1";
          btn.addEventListener(
            "click",
            function () {
              if (
                window.PauliVoice &&
                typeof window.PauliVoice.speakDeliveryChoicePrompt ===
                  "function"
              ) {
                void window.PauliVoice.speakDeliveryChoicePrompt().catch(
                  function () {}
                );
              }
            },
            false
          );
        }

        function osgSetDeliveryPreference(mode, reason) {
          var normalized =
            mode === "seven_pickup" ? "seven_pickup" : "marketplace";
          osgSetPickupMode(normalized);
          var mr = document.getElementById("pickup-mode-marketplace");
          var sv = document.getElementById("pickup-mode-seven");
          if (mr) mr.checked = normalized !== "seven_pickup";
          if (sv) sv.checked = normalized === "seven_pickup";
          var pack = window.__OSG_CURRENT_PACK_CACHE || null;
          osgHydratePickupModeTexts(pack);
          osgRecordDeliveryPreferenceJournal(
            normalized,
            reason ||
              (normalized === "seven_pickup"
                ? "convenience;bundle;safe_pickup"
                : "home_delivery")
          );
          osgRefreshDeliveryChoiceConfirm(pack);
          osgSyncSevenVoucherExclusivePanel();
        }

        async function osgSpeakDeliveryModeVoice(mode) {
          var normalized =
            mode === "seven_pickup" ? "seven_pickup" : "marketplace";
          if (normalized === "seven_pickup") {
            if (
              window.PauliVoice &&
              typeof window.PauliVoice.speakDeliveryConfirmSeven === "function"
            ) {
              await window.PauliVoice.speakDeliveryConfirmSeven();
            }
            if (
              !osgGetLiveTrackingOn() &&
              window.PauliVoice &&
              typeof window.PauliVoice.speakSevenVoucherTrackingWarn ===
                "function"
            ) {
              await window.PauliVoice.speakSevenVoucherTrackingWarn();
            } else if (
              osgGetLiveTrackingOn() &&
              window.PauliVoice &&
              typeof window.PauliVoice.speakSevenPickupReward === "function"
            ) {
              await window.PauliVoice.speakSevenPickupReward();
            }
            return;
          }
          if (
            window.PauliVoice &&
            typeof window.PauliVoice.speakDeliveryConfirmHome === "function"
          ) {
            await window.PauliVoice.speakDeliveryConfirmHome();
          }
        }

        async function osgApplyDeliveryVoiceChoice(mode) {
          var normalized =
            mode === "seven_pickup" ? "seven_pickup" : "marketplace";
          var reason =
            normalized === "seven_pickup"
              ? "voice_choice_seven"
              : "voice_choice_home";
          osgSetDeliveryPreference(normalized, reason);
          await osgSpeakDeliveryModeVoice(normalized);
        }

        function osgOnPickupModeChanged(mode) {
          var normalized =
            mode === "seven_pickup" ? "seven_pickup" : "marketplace";
          var reason =
            normalized === "seven_pickup"
              ? "convenience;bundle;safe_pickup"
              : "home_delivery";
          osgSetDeliveryPreference(normalized, reason);
          void osgSpeakDeliveryModeVoice(normalized).catch(function () {});
        }

        window.osgSetDeliveryPreference = osgSetDeliveryPreference;
        window.osgApplyDeliveryVoiceChoice = osgApplyDeliveryVoiceChoice;

        function osgRecordPartnerOutbound(
          partnerSlug,
          channel,
          rawHref,
          leadIntent,
          journalExtra,
          trackedHrefOverride,
          knownCustomerId,
          knownLeadId
        ) {
          var lint = "";
          if (typeof leadIntent === "string" && leadIntent.trim())
            lint = leadIntent.trim();
          var urlExtra =
            journalExtra && typeof journalExtra === "object" ? journalExtra : null;
          var tr;
          if (trackedHrefOverride) {
            tr = {
              href: String(trackedHrefOverride),
              leadId: knownLeadId || osgNewLeadId(),
              customerId: knownCustomerId || osgEnsureCustomerId(),
            };
          } else {
            tr = osgAffiliateTrackedUrl(
              rawHref,
              partnerSlug,
              channel,
              lint,
              urlExtra
            );
          }
          var ts = new Date().toISOString();
          var row = {
            leadId: tr.leadId,
            customerId: tr.customerId,
            osg_partner: partnerSlug,
            osg_ch: channel,
            landingHref: rawHref,
            trackedHref: tr.href,
            clickedAtISO: ts,
            conversionBasis: true,
            leadIntent: lint,
          };
          osgMergeJournalExtras(row, journalExtra);
          if (
            osgIsInvolveMarketplacePartner(partnerSlug, channel) &&
            !row.marketplaceSubId
          ) {
            row.marketplaceSubId = OSG_MARKETPLACE_SUB_ID;
          }
          osgAppendLeadJournal(row);
          if (lint === "purchase") {
            osgVipPostEvent("purchase", {
              store: String(partnerSlug || "partner").slice(0, 64),
              channel: String(channel || osgClientChannel()).slice(0, 64),
            });
          }
          return tr;
        }

        function osgRecordBookingHandshake() {
          var cid = osgEnsureCustomerId();
          var lid = osgNewLeadId();
          var ts = new Date().toISOString();
          osgAppendLeadJournal({
            leadId: lid,
            customerId: cid,
            osg_partner: "booking_registered",
            osg_ch: "dealer_notice",
            landingHref: "internal:booking",
            trackedHref: "",
            clickedAtISO: ts,
            conversionBasis: true,
            leadIntent: "booking_notice",
          });
          return { leadId: lid, customerId: cid };
        }

        function osgLoadVoucherProof() {
          try {
            var raw = localStorage.getItem(OSG_LS_VOUCHER_PROOF);
            if (!raw) return null;
            var o = JSON.parse(raw);
            return o && typeof o === "object" ? o : null;
          } catch (_) {
            return null;
          }
        }

        function osgPersistVoucherProof(o) {
          try {
            localStorage.setItem(OSG_LS_VOUCHER_PROOF, JSON.stringify(o));
          } catch (_) {}
        }

        function osgVoucherQrWrapIsShown() {
          var qw = document.getElementById("voucher-qr-wrap");
          if (!qw) return false;
          if (qw.hasAttribute("hidden")) return false;
          if (qw.style.display === "none") return false;
          return true;
        }

        function osgHideVoucherQrShell() {
          var qw = document.getElementById("voucher-qr-wrap");
          var qh = document.getElementById("voucher-qr-host");
          var bc = document.getElementById("voucher-qr-big-countdown");
          if (qw) {
            qw.setAttribute("hidden", "");
            qw.style.display = "none";
            qw.classList.remove("voucher-qr-wrap--expired");
          }
          if (qh) qh.innerHTML = "";
          if (bc) {
            bc.textContent = "00:00:00";
            bc.classList.remove("is-expired");
            bc.setAttribute("hidden", "");
          }
        }

        function osgPickPfOrDeEn(key, pf) {
          return (
            (pf && pf[key]) ||
            (typeof T !== "undefined" &&
              ((T.en && T.en[key]) || (T.de && T.de[key]))) ||
            ""
          );
        }

        function osgPaintQrExpiredPlaceholder() {
          var host = document.getElementById("voucher-qr-host");
          var wrap = document.getElementById("voucher-qr-wrap");
          var bc = document.getElementById("voucher-qr-big-countdown");
          var pf = window.__OSG_CURRENT_PACK_CACHE || {};
          var lbl = osgPickPfOrDeEn("voucherQrExpiredBadgeLabel", pf);
          if (bc) {
            bc.textContent = "00:00:00";
            bc.classList.add("is-expired");
            bc.removeAttribute("hidden");
          }
          if (host) {
            host.innerHTML =
              '<div class="voucher-qr-expired-symbol" role="img" aria-label="' +
              osgEscHtml(lbl) +
              '"><span class="voucher-qr-expired-icon" aria-hidden="true">✕</span><span class="voucher-qr-expired-text">' +
              osgEscHtml(lbl) +
              "</span></div>";
          }
          if (wrap) {
            wrap.classList.add("voucher-qr-wrap--expired");
            wrap.removeAttribute("hidden");
            wrap.style.display = "";
          }
          var leg = document.getElementById("voucher-qr-legal-line");
          if (leg) leg.textContent = osgPickPfOrDeEn("voucherTwoHourTrackingLegalNotice", pf);
        }

        function osgEnsureExpiredQrDisplayed() {
          var qh = document.getElementById("voucher-qr-host");
          var hasExpired =
            qh && qh.querySelector && qh.querySelector(".voucher-qr-expired-symbol");
          if (!hasExpired) osgPaintQrExpiredPlaceholder();
          else {
            var wrap = document.getElementById("voucher-qr-wrap");
            if (wrap) {
              wrap.classList.add("voucher-qr-wrap--expired");
              wrap.removeAttribute("hidden");
              wrap.style.display = "";
            }
            var bc = document.getElementById("voucher-qr-big-countdown");
            if (bc) {
              bc.textContent = "00:00:00";
              bc.classList.add("is-expired");
              bc.removeAttribute("hidden");
            }
          }
        }

        function osgHydrateQrLegalMicroLine(pack) {
          var leg = document.getElementById("voucher-qr-legal-line");
          if (!leg) return;
          var pf = pack || window.__OSG_CURRENT_PACK_CACHE || {};
          leg.textContent = osgPickPfOrDeEn("voucherTwoHourTrackingLegalNotice", pf);
        }

        /** Erstes sichtbares Öffnen des QR = fester Zeitstempel im Proof (audit / Countdown-Anker). */
        function osgPersistFirstVoucherQrOpenStampIfNeeded() {
          var v = osgLoadVoucherProof();
          if (!v || v.displayStartISO) return;
          v.displayStartISO = new Date().toISOString();
          osgPersistVoucherProof(v);
        }

        function osgMaybeSpeakSevenVoucherQrTimerBriefOnce() {
          var v = osgLoadVoucherProof();
          if (!v || v.qrTimerBriefSpoken) return;
          v.qrTimerBriefSpoken = true;
          osgPersistVoucherProof(v);
          try {
            if (
              window.PauliVoice &&
              typeof window.PauliVoice.speakSevenVoucherQrOpenBrief ===
                "function"
            )
              void window.PauliVoice.speakSevenVoucherQrOpenBrief().catch(
                function () {}
              );
          } catch (_) {}
        }

        function osgFormatCountdownHms(remainMs) {
          var r = Math.max(0, Number(remainMs) || 0);
          var h = Math.floor(r / 3600000);
          var m = Math.floor((r % 3600000) / 60000);
          var s = Math.floor((r % 60000) / 1000);
          return (
            String(h).padStart(2, "0") +
            ":" +
            String(m).padStart(2, "0") +
            ":" +
            String(s).padStart(2, "0")
          );
        }

        function osgGetPickupMode() {
          try {
            var v = sessionStorage.getItem(OSG_SS_PICKUP_MODE);
            return v === "seven_pickup" ? "seven_pickup" : "marketplace";
          } catch (_) {
            return "marketplace";
          }
        }

        function osgSetPickupMode(mode) {
          try {
            sessionStorage.setItem(
              OSG_SS_PICKUP_MODE,
              mode === "seven_pickup" ? "seven_pickup" : "marketplace"
            );
          } catch (_) {}
        }

        function osgGetLiveTrackingOn() {
          try {
            return sessionStorage.getItem(OSG_SS_LIVE_TRACK_ON) === "1";
          } catch (_) {
            return false;
          }
        }

        function osgBumpTrackingSessionId() {
          var id = null;
          try {
            id = "osgt_" + osgRandHex(10);
            sessionStorage.setItem(OSG_SS_TRACK_SID, id);
          } catch (_) {
            id = "osgt_" + String(Date.now());
          }
          return id;
        }

        /** Aktuelle TRACK_SID oder null wenn kein Live-Tracking. */
        function osgCurrentTrackingSid() {
          try {
            if (!osgGetLiveTrackingOn()) return null;
            var s = sessionStorage.getItem(OSG_SS_TRACK_SID);
            if (!s) return osgBumpTrackingSessionId();
            return s;
          } catch (_) {
            return null;
          }
        }

        function osgLiveTrackingExplainSeen() {
          try {
            return localStorage.getItem(OSG_LS_LIVE_TRACK_EXPLAIN) === "1";
          } catch (_) {
            return false;
          }
        }

        function osgMarkLiveTrackingExplainSeen() {
          try {
            localStorage.setItem(OSG_LS_LIVE_TRACK_EXPLAIN, "1");
          } catch (_) {}
        }

        function osgSetLiveTrackingFromUi(on, fromUserUi) {
          var want = !!on;
          try {
            if (want) {
              sessionStorage.setItem(OSG_SS_LIVE_TRACK_ON, "1");
              if (!sessionStorage.getItem(OSG_SS_TRACK_SID)) osgBumpTrackingSessionId();
            } else {
              osgVoidSevenVoucherBecauseTrackingStopped();
              sessionStorage.removeItem(OSG_SS_LIVE_TRACK_ON);
              sessionStorage.removeItem(OSG_SS_TRACK_SID);
              sessionStorage.removeItem(OSG_SS_TRACK_ISSUED_SID);
            }
          } catch (_) {}
          var cb = document.getElementById("live-tracking-checkbox");
          if (cb) cb.checked = want;
          if (window.__OSG_CURRENT_PACK_CACHE) {
            osgHydrateLiveTrackingTexts(window.__OSG_CURRENT_PACK_CACHE);
          }
          osgSyncSevenVoucherExclusivePanel();
          return want;
        }

        function osgVoucherActivationLockedCurrentSid() {
          try {
            var sid = sessionStorage.getItem(OSG_SS_TRACK_SID);
            if (!sid || !sid.trim()) return false;
            return sessionStorage.getItem(OSG_SS_TRACK_ISSUED_SID) === sid;
          } catch (_) {
            return false;
          }
        }

        function osgMarkVoucherActivatedForSid() {
          try {
            var sid = osgCurrentTrackingSid();
            if (!sid) return;
            sessionStorage.setItem(OSG_SS_TRACK_ISSUED_SID, sid);
          } catch (_) {}
        }

        /** Entfernt abgelaufene Proofs aus localStorage → einmaliges Journal-Ereignis. */
        function osgExpireVoucherIfNeeded() {
          var v = osgLoadVoucherProof();
          if (!v || typeof v.validUntilISO !== "string") return false;
          var exp = Date.parse(v.validUntilISO);
          if (!isFinite(exp) || Date.now() <= exp) return false;
          var ts = new Date().toISOString();
          var cid = osgEnsureCustomerId();
          osgAppendLeadJournal({
            leadId: osgNewLeadId(),
            customerId: cid,
            osg_partner: "seven_eleven_excl",
            osg_ch: "seven_voucher_expired",
            landingHref:
              "internal:seven_pickup_expired_" +
              encodeURIComponent(OSG_VOUCHER_CODE_PRIMARY),
            trackedHref: "",
            clickedAtISO: ts,
            conversionBasis: true,
            leadIntent: "seven_voucher_ttl_expiry",
            voucherCode: OSG_VOUCHER_CODE_PRIMARY,
            voucherThb: OSG_VOUCHER_THB_PRIMARY,
            pickupFulfillment: "seven_eleven",
          });
          try {
            localStorage.removeItem(OSG_LS_VOUCHER_PROOF);
          } catch (_) {}
          osgPaintQrExpiredPlaceholder();
          return true;
        }

        /** Countdown-Anzeige; bleibende ms ≤0 → expiry mit rotem Abgelaufen-Stamp. */
        function osgUpdateVoucherCountdownUi() {
          var el = document.getElementById("voucher-countdown-line");
          var big = document.getElementById("voucher-qr-big-countdown");
          function pickPf(key, pf) {
            return (
              (pf && pf[key]) ||
              (T.en && T.en[key]) ||
              (T.de && T.de[key]) ||
              ""
            );
          }
          function syncBigClock(remainMs, showTicker) {
            if (!big) return;
            if (!showTicker) {
              big.setAttribute("hidden", "");
              big.classList.remove("is-expired");
              return;
            }
            big.classList.toggle("is-expired", remainMs <= 0);
            big.textContent = osgFormatCountdownHms(remainMs);
            big.removeAttribute("hidden");
          }
          var pf = window.__OSG_CURRENT_PACK_CACHE || T.de;
          var proof = osgLoadVoucherProof();
          var qrWrapVisible = osgVoucherQrWrapIsShown();
          if (
            osgGetPickupMode() !== "seven_pickup" ||
            !osgGetLiveTrackingOn()
          ) {
            if (el) {
              el.textContent = "";
              el.setAttribute("hidden", "");
            }
            syncBigClock(0, false);
            return;
          }
          osgExpireVoucherIfNeeded();
          proof = osgLoadVoucherProof();
          if (
            proof &&
            proof.activatedAtISO &&
            proof.validUntilISO
          ) {
            var deadline = Date.parse(proof.validUntilISO);
            if (!isFinite(deadline)) {
              if (el) {
                el.textContent = "";
                el.setAttribute("hidden", "");
              }
              syncBigClock(0, false);
              return;
            }
            var remain = deadline - Date.now();
            var hms = osgFormatCountdownHms(Math.max(0, remain));
            if (remain <= 0) {
              osgExpireVoucherIfNeeded();
              if (el) {
                el.textContent = pickPf("voucherExpiredCountdownDone", pf);
                el.removeAttribute("hidden");
              }
              syncBigClock(0, osgVoucherQrWrapIsShown());
              osgSyncSevenVoucherExclusivePanel();
              return;
            }
            if (el) {
              el.textContent =
                pickPf("voucherCountdownLineTpl", pf) ||
                "Restzeit {HMS}";
              el.textContent = String(el.textContent)
                .replace(/\{MM\}/g, String(Math.floor(remain / 60000)).padStart(2, "0"))
                .replace(/\{SS\}/g, String(Math.floor((remain % 60000) / 1000)).padStart(2, "0"))
                .replace(/\{MINS\}/g, String(Math.max(Math.floor(remain / 60000), 0)))
                .replace(/\{HMS\}/g, hms);
              el.removeAttribute("hidden");
            }
            syncBigClock(remain, qrWrapVisible && remain > 0);
            return;
          }
          var wrapExpiredLooks =
            document.getElementById("voucher-qr-wrap") &&
            document.getElementById("voucher-qr-wrap").classList.contains("voucher-qr-wrap--expired");
          if (
            osgVoucherActivationLockedCurrentSid() &&
            !proof &&
            (wrapExpiredLooks || osgVoucherQrWrapIsShown())
          ) {
            syncBigClock(0, osgVoucherQrWrapIsShown());
          } else {
            syncBigClock(0, false);
          }
          if (el) {
            el.textContent = "";
            el.setAttribute("hidden", "");
          }
        }

        function osgStartVoucherExpiryTickerOnce() {
          if (window.__osgVcTick) return;
          window.__osgVcTick = setInterval(function () {
            osgExpireVoucherIfNeeded();
            osgUpdateVoucherCountdownUi();
          }, 1000);
        }

        function osgHydrateLiveTrackingTexts(pack) {
          function P(key) {
            return (
              (pack && pack[key]) ||
              (T.en && T.en[key]) ||
              (T.de && T.de[key]) ||
              ""
            );
          }
          var leg = document.getElementById("live-tracking-legend");
          if (leg) leg.textContent = P("liveTrackingLegend");
          var lbl = document.getElementById("live-tracking-label-span");
          if (lbl) lbl.textContent = P("liveTrackingEnableLabel");
          var hi = document.getElementById("live-tracking-hint");
          if (hi)
            hi.textContent = osgGetLiveTrackingOn()
              ? P("liveTrackingHintOn")
              : P("liveTrackingHintOff");
          var cb = document.getElementById("live-tracking-checkbox");
          if (cb) cb.checked = !!osgGetLiveTrackingOn();
        }

        function osgWireLiveTrackingOnce() {
          var cb = document.getElementById("live-tracking-checkbox");
          if (!cb || cb.dataset.osgLtWired === "1") return;
          cb.dataset.osgLtWired = "1";
          cb.addEventListener(
            "change",
            function () {
              var on = !!cb.checked;
              var wasLive = osgGetLiveTrackingOn();
              osgSetLiveTrackingFromUi(on, true);
              osgStartVoucherExpiryTickerOnce();
              if (on && !wasLive) {
                if (!osgLiveTrackingExplainSeen()) {
                  osgMarkLiveTrackingExplainSeen();
                  if (
                    window.PauliVoice &&
                    typeof window.PauliVoice.speakLiveTrackingFirstExplain ===
                      "function"
                  ) {
                    void window.PauliVoice.speakLiveTrackingFirstExplain().catch(
                      function () {}
                    );
                  }
                } else if (
                  osgGetPickupMode() === "seven_pickup" &&
                  window.PauliVoice &&
                  typeof window.PauliVoice.speakSevenPickupReward === "function"
                ) {
                  void window.PauliVoice.speakSevenPickupReward().catch(
                    function () {}
                  );
                }
              }
              if (
                osgGetPickupMode() === "seven_pickup"
              )
                osgUpdateVoucherActivateButtonDisabled();
            },
            false
          );
        }

        function osgGateLinePack(key) {
          var pf = window.__OSG_CURRENT_PACK_CACHE || T.de || T.en || {};
          return (
            pf[key] ||
            (T.en && T.en[key]) ||
            (T.de && T.de[key]) ||
            ""
          );
        }

        function osgUpdateVoucherActivateButtonDisabled() {
          var btn = document.getElementById("voucher-show-qr-btn");
          if (!btn) return;
          osgExpireVoucherIfNeeded();
          function pick(key) {
            var pack = window.__OSG_CURRENT_PACK_CACHE || {};
            return (
              pack[key] ||
              (T.en && T.en[key]) ||
              (T.de && T.de[key]) ||
              ""
            );
          }
          btn.disabled = false;
          btn.removeAttribute("title");
          if (
            osgGetPickupMode() !== "seven_pickup" ||
            !osgGetLiveTrackingOn()
          )
            return;
          var proof = osgLoadVoucherProof();
          var locked = osgVoucherActivationLockedCurrentSid();
          var ttlOk =
            proof &&
            proof.validUntilISO &&
            Date.now() < Date.parse(proof.validUntilISO);
          if (locked && ttlOk) {
            btn.disabled = true;
            btn.setAttribute(
              "title",
              pick("voucherActivateButtonDisabledIssuedHelp")
            );
            return;
          }
          if (locked && (!proof || !ttlOk)) {
            btn.disabled = true;
            btn.setAttribute(
              "title",
              pick("voucherActivateButtonDisabledSessionUsedHelp")
            );
          }
        }

        function osgSyncSevenVoucherExclusivePanel() {
          osgExpireVoucherIfNeeded();
          osgStartVoucherExpiryTickerOnce();
          var hub = document.getElementById("seven-voucher-hub");
          var gate = document.getElementById("voucher-seven-gate-pane");
          var xp = document.getElementById("voucher-seven-expired-pane");
          var wrap = document.getElementById("voucher-seven-exclusive-wrap");
          if (!hub) return;

          function hideQr() {
            osgHideVoucherQrShell();
          }

          if (osgGetPickupMode() !== "seven_pickup") {
            hub.setAttribute("hidden", "");
            if (gate) gate.setAttribute("hidden", "");
            if (xp) xp.setAttribute("hidden", "");
            if (wrap) wrap.setAttribute("hidden", "");
            hideQr();
            osgUpdateVoucherCountdownUi();
            osgRefreshVoucherProofLine(window.__OSG_CURRENT_PACK_CACHE || T.de);
            osgUpdateVoucherActivateButtonDisabled();
            return;
          }

          hub.removeAttribute("hidden");
          var live = osgGetLiveTrackingOn();
          var locked = osgVoucherActivationLockedCurrentSid();
          var proofAfter = osgLoadVoucherProof();
          var expiredReuse =
            live &&
            locked &&
            (!proofAfter ||
              !proofAfter.validUntilISO ||
              Date.now() >= Date.parse(proofAfter.validUntilISO));

          if (!live) {
            if (gate) {
              gate.removeAttribute("hidden");
              var gl = document.getElementById("voucher-seven-gate-line");
              if (gl)
                gl.textContent = osgGateLinePack("voucherNeedLiveTrackingExplain");
            }
            if (xp) xp.setAttribute("hidden", "");
            if (wrap) wrap.setAttribute("hidden", "");
            hideQr();
            osgUpdateVoucherCountdownUi();
            osgRefreshVoucherProofLine(window.__OSG_CURRENT_PACK_CACHE || T.de);
            osgUpdateVoucherActivateButtonDisabled();
            return;
          }

          if (gate) gate.setAttribute("hidden", "");

          if (expiredReuse) {
            if (gate) gate.setAttribute("hidden", "");
            if (wrap) wrap.removeAttribute("hidden");
            if (xp) {
              xp.removeAttribute("hidden");
              var xl = document.getElementById("voucher-seven-expired-line");
              if (xl)
                xl.textContent = osgGateLinePack("voucherSessionExpiredReuseHint");
            }
            osgHydrateQrLegalMicroLine(window.__OSG_CURRENT_PACK_CACHE || T.de);
            osgEnsureExpiredQrDisplayed();
            osgUpdateVoucherCountdownUi();
            osgRefreshVoucherProofLine(window.__OSG_CURRENT_PACK_CACHE || T.de);
            osgUpdateVoucherActivateButtonDisabled();
            return;
          }

          if (xp) xp.setAttribute("hidden", "");
          if (wrap) wrap.removeAttribute("hidden");
          osgUpdateVoucherCountdownUi();
          osgRefreshVoucherProofLine(window.__OSG_CURRENT_PACK_CACHE || T.de);
          osgUpdateVoucherActivateButtonDisabled();
        }

        function osgHydratePickupModeTexts(pack) {
          function P(key) {
            return (
              (pack && pack[key]) ||
              (T.en && T.en[key]) ||
              (T.de && T.de[key]) ||
              ""
            );
          }
          var leg = document.getElementById("pickup-mode-legend");
          if (leg) leg.textContent = P("pickupModeLegend");
          var ms = document.getElementById("pickup-mode-market-span");
          if (ms) ms.textContent = P("pickupModeMarketplaceLabel");
          var ss = document.getElementById("pickup-mode-seven-span");
          if (ss) ss.textContent = P("pickupModeSevenLabel");
          var hi = document.getElementById("pickup-mode-hint");
          if (hi)
            hi.textContent =
              osgGetPickupMode() === "seven_pickup"
                ? P("pickupHintSevenChosen")
                : P("pickupHintMarketChosen");
          var mr = document.getElementById("pickup-mode-marketplace");
          var sv = document.getElementById("pickup-mode-seven");
          var mode = osgGetPickupMode();
          if (mr) mr.checked = mode !== "seven_pickup";
          if (sv) sv.checked = mode === "seven_pickup";
          osgHydrateLiveTrackingTexts(pack);
          osgStartVoucherExpiryTickerOnce();
          osgSyncSevenVoucherExclusivePanel();
        }

        function osgWirePickupModeOnce() {
          var fs = document.getElementById("pickup-mode-fieldset");
          if (!fs || fs.dataset.osgPickupWired === "1") return;
          fs.dataset.osgPickupWired = "1";
          fs.addEventListener(
            "change",
            function (ev) {
              var tg = ev.target;
              if (!tg || tg.name !== "osg-pickup-mode") return;
              osgSetPickupMode(String(tg.value));
              osgHydratePickupModeTexts(
                window.__OSG_CURRENT_PACK_CACHE || null
              );
              osgOnPickupModeChanged(String(tg.value));
            },
            false
          );
        }

        function osgBuildSevenPickupVoucherQrUrl(voucherCode, validUntilISO, minBasketThb) {
          var base =
            typeof window.location !== "undefined"
              ? String(window.location.href).split(/[#]/)[0]
              : "";
          var u =
            base +
            "#osg-7evo?" +
            "pickup=seven_pickup&voucher=" +
            encodeURIComponent(
              voucherCode || OSG_VOUCHER_CODE_PRIMARY
            );
          if (
            typeof validUntilISO === "string" &&
            validUntilISO.trim().length >= 16
          ) {
            u += "&exp=" + encodeURIComponent(validUntilISO.trim());
          }
          var mn =
            typeof minBasketThb === "number"
              ? minBasketThb
              : Number(minBasketThb);
          if (isFinite(mn) && mn > 0)
            u += "&minbasket=" + encodeURIComponent(String(mn));
          return u;
        }

        function osgConsumeSevenVoucherQrOnce() {
          try {
            var hx = window.location.hash || "";
            var mx = /^#osg-7evo\?(.*)$/i.exec(hx);
            if (!mx) return;
            var clean = window.location.href.split(/[#]/)[0];
            history.replaceState(null, "", clean);
            var sp = new URLSearchParams(mx[1]);
            if ((sp.get("pickup") || "") !== "seven_pickup") return;
            var voucher = sp.get("voucher") || OSG_VOUCHER_CODE_PRIMARY;
            var expRaw = sp.get("exp") || "";
            if (
              osgGetPickupMode() !== "seven_pickup" ||
              !osgGetLiveTrackingOn()
            ) {
              var tsL = new Date().toISOString();
              osgAppendLeadJournal({
                leadId: osgNewLeadId(),
                customerId: osgEnsureCustomerId(),
                osg_partner: "seven_eleven_excl",
                osg_ch: "seven_voucher_qr_scan_rejected",
                landingHref:
                  "internal:seven_exclusive_qr_no_live_tracking:" +
                  encodeURIComponent(voucher),
                trackedHref: "",
                clickedAtISO: tsL,
                conversionBasis: false,
                leadIntent: "seven_exclusive_qr_tracking_inactive",
                voucherCode: voucher,
                voucherThb: OSG_VOUCHER_THB_PRIMARY,
                qrScan: false,
                pickupFulfillment: "seven_eleven",
              });
              var IT = typeof T !== "undefined" ? T : {};
              var rl =
                document.documentElement.getAttribute("lang") || "de";
              var pr =
                IT[normalizeLang(rl)] || IT.de || IT.en || {};
              var tn =
                pr.voucherQrScanRejectedTrackingInactive ||
                (IT.de && IT.de.voucherQrScanRejectedTrackingInactive) ||
                "";
              if (tn) osgShowSevenVoucherToast(String(tn));
              return;
            }
            if (expRaw) {
              var expMs = Date.parse(expRaw);
              if (!isFinite(expMs) || Date.now() > expMs) {
                var tsR = new Date().toISOString();
                osgAppendLeadJournal({
                  leadId: osgNewLeadId(),
                  customerId: osgEnsureCustomerId(),
                  osg_partner: "seven_eleven_excl",
                  osg_ch: "seven_voucher_qr_scan_rejected",
                  landingHref:
                    "internal:seven_exclusive_qr_expired:" +
                    encodeURIComponent(voucher),
                  trackedHref: "",
                  clickedAtISO: tsR,
                  conversionBasis: false,
                  leadIntent: "seven_exclusive_qr_qr_ttl_expired",
                  voucherCode: voucher,
                  voucherThb: OSG_VOUCHER_THB_PRIMARY,
                  qrScan: false,
                  pickupFulfillment: "seven_eleven",
                });
                var Ik = typeof T !== "undefined" ? T : {};
                var rawL =
                  document.documentElement.getAttribute("lang") || "de";
                var pj =
                  Ik[normalizeLang(rawL)] || Ik.de || Ik.en || {};
                var rej =
                  pj.voucherQrScanRejectedExpired ||
                  (Ik.de && Ik.de.voucherQrScanRejectedExpired);
                if (rej) osgShowSevenVoucherToast(String(rej));
                return;
              }
            }
            var ts = new Date().toISOString();
            osgAppendLeadJournal({
              leadId: osgNewLeadId(),
              customerId: osgEnsureCustomerId(),
              osg_partner: "seven_eleven_excl",
              osg_ch: "seven_voucher_qr_scan",
              landingHref:
                "internal:seven_exclusive_qr:" +
                encodeURIComponent(voucher),
              trackedHref: "",
              clickedAtISO: ts,
              conversionBasis: true,
              leadIntent: "seven_exclusive_qr_open",
              voucherCode: voucher,
              voucherThb: OSG_VOUCHER_THB_PRIMARY,
              voucherMinimumBasketThb:
                Number(sp.get("minbasket")) || OSG_VOUCHER_MIN_BASKET_THB,
              qrScan: true,
              pickupFulfillment: "seven_eleven",
            });
            var I = typeof T !== "undefined" ? T : {};
            var rawLang =
              document.documentElement.getAttribute("lang") || "de";
            var pk =
              I[normalizeLang(rawLang)] ||
              I.de ||
              I.en ||
              {};
            var fb = pk.sevenQrScanToast || (I.de && I.de.sevenQrScanToast) || "";
            if (fb)
              osgShowSevenVoucherToast(
                fb.replace(/\{CODE\}/g, String(voucher))
              );
          } catch (_) {}
        }

        function osgShowSevenVoucherToast(msg) {
          var el = document.getElementById("seven-voucher-global-feedback");
          if (!el || !msg) return;
          el.removeAttribute("hidden");
          el.textContent = msg;
          el.classList.add("is-visible");
          try {
            clearTimeout(window.__osgSevenToastT);
          } catch (_) {}
          window.__osgSevenToastT = setTimeout(function () {
            el.setAttribute("hidden", "");
            el.textContent = "";
            el.classList.remove("is-visible");
          }, 9500);
        }

        /** Früheres #osg-qr (Marktplatz-Gutscheine) wird nicht mehr genutzt. */
        function osgStripObsoleteMarketQrHashOnce() {
          try {
            if (!/^#osg-qr/i.test(window.location.hash || "")) return;
            history.replaceState(
              null,
              "",
              window.location.href.split(/[#]/)[0]
            );
          } catch (_) {}
        }

        function osgEnsureQrLibrary(done) {
          if (typeof window.QRCode === "function") {
            done();
            return;
          }
          var s = document.createElement("script");
          s.async = true;
          s.crossOrigin = "anonymous";
          s.src =
            "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
          s.onload = function () {
            done();
          };
          s.onerror = function () {
            done();
          };
          document.head.appendChild(s);
        }

        function osgPaintVoucherQr(url) {
          var host = document.getElementById("voucher-qr-host");
          var wrap = document.getElementById("voucher-qr-wrap");
          var big = document.getElementById("voucher-qr-big-countdown");
          if (!host || !wrap) return;
          if (big) big.classList.remove("is-expired");
          wrap.classList.remove("voucher-qr-wrap--expired");
          host.innerHTML = "";
          wrap.removeAttribute("hidden");
          wrap.style.display = "";
          try {
            new QRCode(host, {
              text: url,
              width: 208,
              height: 208,
              colorDark: "#d4af37",
              colorLight: "#0d0d0dff",
              correctLevel:
                typeof QRCode !== "undefined" && QRCode.CorrectLevel
                  ? QRCode.CorrectLevel.M
                  : undefined,
            });
          } catch (_) {
            host.textContent = url;
          }
          osgPersistFirstVoucherQrOpenStampIfNeeded();
          osgHydrateQrLegalMicroLine(window.__OSG_CURRENT_PACK_CACHE || T.de);
          osgMaybeSpeakSevenVoucherQrTimerBriefOnce();
          osgUpdateVoucherCountdownUi();
        }

        function osgHydrateCommissionRefHost(pack) {
          var host = document.getElementById("commission-ref-host");
          if (!host) return;
          var fb =
            pack.commissionRefHtml ||
            (T.en && T.en.commissionRefHtml) ||
            "";
          host.innerHTML = fb;
          host.setAttribute(
            "aria-label",
            pack.commissionRefAria || (T.en && T.en.commissionRefAria) || ""
          );
        }

        function osgRefreshVoucherProofLine(packFallback) {
          var el = document.getElementById("voucher-proof-line");
          if (!el) return;
          function pick(key) {
            var pf = packFallback || {};
            return (
              pf[key] ||
              (T.en && T.en[key]) ||
              (T.de && T.de[key]) ||
              ""
            );
          }
          if (osgGetPickupMode() !== "seven_pickup") {
            el.textContent = pick("voucherHiddenUntilSeven");
            return;
          }
          if (!osgGetLiveTrackingOn()) {
            el.textContent = pick("voucherProofNeedsLiveTracking");
            return;
          }
          osgExpireVoucherIfNeeded();
          var v = osgLoadVoucherProof();
          if (!v || !v.activatedAtISO) {
            el.textContent = pick("voucherProofUnset");
            return;
          }
          var untilMs = Date.parse(v.validUntilISO || "");
          if (
            typeof v.validUntilISO === "string" &&
            isFinite(untilMs) &&
            Date.now() >= untilMs
          ) {
            el.textContent = pick("voucherProofLineExpired");
            return;
          }
          var tpl = pick("voucherProofTpl");
          var minB =
            v.minimumBasketThb != null && isFinite(Number(v.minimumBasketThb))
              ? Number(v.minimumBasketThb)
              : OSG_VOUCHER_MIN_BASKET_THB;
          el.textContent = tpl
            .replace(/\{CODE\}/g, String(v.voucherCode || ""))
            .replace(/\{THB\}/g, String(v.voucherThb != null ? v.voucherThb : ""))
            .replace(/\{MINBASKET\}/g, String(minB))
            .replace(/\{SUB\}/g, String(v.marketSubId || OSG_MARKETPLACE_SUB_ID))
            .replace(/\{CID\}/g, String(v.customerId || ""))
            .replace(/\{WHEN\}/g, String(v.activatedAtISO || ""))
            .replace(/\{UNTIL\}/g, String(v.validUntilISO || ""));
        }

        function osgHydrateVoucherUiTexts(pack) {
          function pick(key) {
            return (
              (pack && pack[key]) ||
              (T.en && T.en[key]) ||
              (T.de && T.de[key]) ||
              ""
            );
          }
          var h = document.getElementById("voucher-seven-heading");
          if (h) h.textContent = pick("voucherSevenHeading");
          var ex = document.getElementById("voucher-seven-expl");
          if (ex) ex.innerHTML = pick("voucherSevenExpl");
          var codeEl = document.getElementById("voucher-code-plain");
          if (codeEl) codeEl.textContent = pick("voucherCodePlainLine");
          var bindTpl = pick("voucherAffBindLineTpl");
          var b = document.getElementById("voucher-aff-bind-line");
          if (b)
            b.textContent = bindTpl
              .replace(/\{SUB\}/g, OSG_MARKETPLACE_SUB_ID)
              .replace(/\{CODE\}/g, OSG_VOUCHER_CODE_PRIMARY);
          var btn = document.getElementById("voucher-show-qr-btn");
          if (btn) btn.textContent = pick("voucherShowQrBtn");
          var cap = document.getElementById("voucher-qr-caption");
          if (cap) cap.textContent = pick("voucherQrCaption");
          var mi = document.getElementById("voucher-micro-legal");
          if (mi) mi.textContent = pick("voucherMicroLegal");
          osgHydrateQrLegalMicroLine(pack);
          osgRefreshVoucherProofLine(pack);
          osgSyncSevenVoucherExclusivePanel();
        }

        function osgWireShopVoucherPanelOnce() {
          var btn = document.getElementById("voucher-show-qr-btn");
          if (!btn || btn.dataset.osgVoucherWired === "1") return;
          btn.dataset.osgVoucherWired = "1";
          btn.addEventListener(
            "click",
            function () {
              osgRunVoucherActivateAndQr();
            },
            false
          );
        }

        function osgRunVoucherActivateAndQr() {
          var Ig = typeof T !== "undefined" ? T : {};
          var rw =
            document.documentElement.getAttribute("lang") || "de";
          var pkt =
            Ig[normalizeLang(rw)] || Ig.de || Ig.en || {};
          function pkAlert(key) {
            var msg = pkt[key] || (Ig.de && Ig.de[key]);
            if (msg) alert(msg);
          }

          if (osgGetPickupMode() !== "seven_pickup") {
            pkAlert("voucherRequiresSevenPickup");
            return;
          }
          osgExpireVoucherIfNeeded();

          if (!osgGetLiveTrackingOn()) {
            pkAlert("voucherNeedsLiveTrackingAlert");
            return;
          }
          if (osgVoucherActivationLockedCurrentSid()) {
            pkAlert("voucherAlreadyIssuedSessionAlert");
            return;
          }
          if (!osgCurrentTrackingSid()) {
            osgBumpTrackingSessionId();
          }
          var cid = osgEnsureCustomerId();
          var whenIso = new Date().toISOString();
          var wMs = Date.parse(whenIso);
          var vuIso = new Date(
            (isFinite(wMs) ? wMs : Date.now()) + OSG_VOUC_VALID_MS
          ).toISOString();
          osgPersistVoucherProof({
            voucherCode: OSG_VOUCHER_CODE_PRIMARY,
            voucherThb: OSG_VOUCHER_THB_PRIMARY,
            minimumBasketThb: OSG_VOUCHER_MIN_BASKET_THB,
            marketSubId: OSG_MARKETPLACE_SUB_ID,
            customerId: cid,
            activatedAtISO: whenIso,
            validUntilISO: vuIso,
            trackingSessionId: osgCurrentTrackingSid(),
            exclusiveSevenPickup: true,
          });
          osgMarkVoucherActivatedForSid();

          osgAppendLeadJournal({
            leadId: osgNewLeadId(),
            customerId: cid,
            osg_partner: "seven_eleven_excl",
            osg_ch: "seven_voucher_activate",
            landingHref:
              "internal:seven_pickup_voucher_" +
              OSG_VOUCHER_CODE_PRIMARY +
              "_until_" +
              encodeURIComponent(vuIso),
            trackedHref: "",
            clickedAtISO: whenIso,
            conversionBasis: true,
            leadIntent: "seven_voucher_activation",
            voucherCode: OSG_VOUCHER_CODE_PRIMARY,
            voucherThb: OSG_VOUCHER_THB_PRIMARY,
            voucherActivated: true,
            marketplaceSubId: OSG_MARKETPLACE_SUB_ID,
            voucherMinimumBasketThb: OSG_VOUCHER_MIN_BASKET_THB,
            pickupFulfillment: "seven_eleven",
          });
          osgHydrateVoucherUiTexts(pkt);
          var url = osgBuildSevenPickupVoucherQrUrl(
            OSG_VOUCHER_CODE_PRIMARY,
            vuIso,
            OSG_VOUCHER_MIN_BASKET_THB
          );
          function revealQr() {
            osgPaintVoucherQr(url);
            osgSyncSevenVoucherExclusivePanel();
          }
          osgEnsureQrLibrary(revealQr);
        }

        function osgAffiliateDuoAnchors(
          slug,
          hrefBase,
          pairLabel,
          channel,
          pack,
          certRealm
        ) {
          var eh = osgEscHtml(hrefBase);
          var ep = osgEscHtml(slug);
          var ech = osgEscHtml(channel);
          var elab = osgEscHtml(pairLabel);
          var eb = osgEscHtml(pack.affiliateBuyTracking);
          var ec = osgEscHtml(pack.affiliateConsultTracking);
          var aBuy = osgEscHtml(pack.affiliateAriaBuy);
          var aCon = osgEscHtml(pack.affiliateAriaConsult);
          var cr =
            certRealm && String(certRealm).trim()
              ? osgEscHtml(String(certRealm).trim())
              : "";
          var dr = cr ? ' data-osg-cert-realm="' + cr + '"' : "";
          var liClass =
            String(slug || "") === "roojai"
              ? "affiliate-deck-item affiliate-deck-item--roojai-highlight"
              : "affiliate-deck-item";
          return (
            '<li class="' +
            liClass +
            '">' +
            '<span class="affiliate-pair-head">' +
            elab +
            '</span>' +
            '<span class="affiliate-pill-row">' +
            '<a class="partner-link-pill partner-link-pill--buy osg-affiliate-link"' +
            ' href="' +
            eh +
            '"' +
            ' data-osg-partner="' +
            ep +
            '"' +
            ' data-osg-channel="' +
            ech +
            '"' +
            ' data-osg-intent="purchase"' +
            dr +
            ' target="_blank" rel="noopener noreferrer"' +
            ' aria-label="' +
            aBuy +
            '">' +
            eb +
            "</a>" +
            '<a class="partner-link-pill partner-link-pill--consult osg-affiliate-link"' +
            ' href="' +
            eh +
            '"' +
            ' data-osg-partner="' +
            ep +
            '"' +
            ' data-osg-channel="' +
            ech +
            '"' +
            ' data-osg-intent="consult"' +
            dr +
            ' target="_blank" rel="noopener noreferrer"' +
            ' aria-label="' +
            aCon +
            '">' +
            ec +
            "</a>" +
            "</span></li>"
          );
        }

        function osgRenderAffiliateDeck(pack) {
          var deck = document.getElementById("affiliate-partner-deck");
          if (!deck) return;

          function L(key, fb) {
            var v =
              pack && pack[key] != null && String(pack[key]).trim();
            return v ? String(pack[key]).trim() : fb;
          }

          function section(title, lisInner) {
            if (!lisInner || !lisInner.trim()) return "";
            return (
              '<h3 class="affiliate-subhead">' +
              osgEscHtml(title || "") +
              '</h3><ul class="affiliate-link-list">' +
              lisInner +
              "</ul>"
            );
          }

          function accumulate(rows) {
            var acc = "";
            for (var i = 0; i < rows.length; i++) {
              var slug = rows[i][0];
              var href = rows[i][1];
              var label = rows[i][2];
              var channel = rows[i][3];
              var cert =
                rows[i].length > 4 ? rows[i][4] || "" : "";
              acc += osgAffiliateDuoAnchors(
                slug,
                href,
                label,
                channel,
                pack,
                cert
              );
            }
            return acc;
          }

          var lisBank = accumulate([
            [
              "kasikorn",
              OSG_AFFILIATE_BASE.kasikorn,
              L("affiliateLinkKasikorn"),
              "bank",
              "",
            ],
            [
              "roojai",
              OSG_AFFILIATE_BASE.roojai,
              L("affiliateLinkRoojai"),
              "insurance",
              "insurance",
            ],
          ]);

          var lisRetail = accumulate([
            [
              "bigc",
              OSG_AFFILIATE_BASE.bigc,
              L("affiliateRetailBigC"),
              "retail",
            ],
            [
              "lotuss",
              OSG_AFFILIATE_BASE.lotuss,
              L("affiliateRetailLotuss"),
              "retail",
            ],
            [
              "makro_th",
              OSG_AFFILIATE_BASE.makro_th,
              L("affiliateRetailMakro"),
              "retail",
            ],
            [
              "central_world",
              OSG_AFFILIATE_BASE.central_world,
              L("affiliateRetailCentral"),
              "retail",
            ],
          ]);

          var lisTech = accumulate([
            [
              "jd_central",
              OSG_AFFILIATE_BASE.jd_central,
              L("affiliateRetailJDCentral"),
              "retail",
            ],
            [
              "apple_th",
              OSG_AFFILIATE_BASE.apple_th,
              L("affiliateRetailApple"),
              "retail",
            ],
          ]);

          var lisHomeBuild = accumulate([
            [
              "homepro",
              OSG_AFFILIATE_BASE.homepro,
              L("affiliateHomeHomePro"),
              "home_build",
            ],
            [
              "boonthavorn",
              OSG_AFFILIATE_BASE.boonthavorn,
              L("affiliateHomeBoonthavorn"),
              "home_build",
            ],
          ]);

          var lisBeauty = accumulate([
            [
              "boots_th",
              OSG_AFFILIATE_BASE.boots_th,
              L("affiliateBeautyBoots"),
              "beauty",
            ],
            [
              "watsons_th",
              OSG_AFFILIATE_BASE.watsons_th,
              L("affiliateBeautyWatsons"),
              "beauty",
            ],
          ]);

          var lisMofa = accumulate([
            [
              "honda_mofa",
              OSG_AFFILIATE_BASE.honda_mofa,
              L("affiliateLinkHonda"),
              "dealer",
              "automotive",
            ],
            [
              "yamaha_mofa",
              OSG_AFFILIATE_BASE.yamaha_mofa,
              L("affiliateLinkYamaha"),
              "dealer",
              "automotive",
            ],
            [
              "kawasaki_th",
              OSG_AFFILIATE_BASE.kawasaki_th,
              L("affiliateMobilityKawasaki"),
              "dealer",
              "automotive",
            ],
            [
              "suzuki_th",
              OSG_AFFILIATE_BASE.suzuki_th,
              L("affiliateMobilitySuzuki"),
              "dealer",
              "automotive",
            ],
            [
              "toyota_th",
              OSG_AFFILIATE_BASE.toyota_th,
              L("affiliateMobilityToyota"),
              "dealer",
              "automotive",
            ],
          ]);

          var realEstateLi = osgAffiliateDuoAnchors(
            "real_estate_th",
            OSG_AFFILIATE_BASE.real_estate,
            L("affiliateLinkRealty"),
            "real_estate",
            pack,
            "real_estate"
          );

          deck.innerHTML =
            section(L("affiliateSectionBanks", "Banks"), lisBank) +
            section(L("affiliateSectionRetail", "Retail"), lisRetail) +
            section(L("affiliateSectionTech", "Technology"), lisTech) +
            section(L("affiliateSectionHomeBuild", "Home & DIY"), lisHomeBuild) +
            section(L("affiliateSectionBeauty", "Beauty & health"), lisBeauty) +
            section(L("affiliateSectionRealEstate", "Real estate"), realEstateLi) +
            section(L("affiliateSectionMofa", "Mobility"), lisMofa);
          try {
            if (typeof window.osgPsychologyObserveFinanceViews === "function") {
              window.osgPsychologyObserveFinanceViews();
            }
            if (typeof osgCrossSellBindAffiliateLinks === "function") {
              osgCrossSellBindAffiliateLinks();
            }
            if (typeof osgPauliBindPurchaseHesitateLinks === "function") {
              osgPauliBindPurchaseHesitateLinks();
            }
          } catch (_) {}
        }

        function osgLangToBcp47() {
          var l = (
            document.documentElement.getAttribute("lang") || "de"
          ).toLowerCase();
          if (l.indexOf("zh") === 0) return "zh-CN";
          return l.split("-")[0] === "zh" ? "zh-CN" : l.split("-")[0];
        }

        function osgHydrateBenefitCertShell(pack) {
          if (!pack) return;
          var h = document.getElementById("benefit-cert-main-heading");
          if (h && pack.certModalHeading)
            h.textContent = pack.certModalHeading || "";
          var clo = document.getElementById("partner-benefit-cert-close-btn");
          if (clo) {
            if (pack.certModalCloseLabel)
              clo.textContent = pack.certModalCloseLabel;
            clo.setAttribute("aria-label", pack.certModalCloseLabel || "");
          }
          var pb = document.getElementById("benefit-cert-print-btn");
          if (pb) {
            if (pack.certPrintSaveBtn) pb.textContent = pack.certPrintSaveBtn;
            pb.setAttribute("aria-label", pack.certPrintSaveBtn || "");
          }
          var ob = document.getElementById("benefit-cert-open-partner-btn");
          if (ob) {
            if (pack.certContinuePartnerBtn)
              ob.textContent = pack.certContinuePartnerBtn;
            ob.setAttribute("aria-label", pack.certContinuePartnerBtn || "");
          }
          var lblP = document.getElementById("benefit-cert-partner-ref-label");
          if (lblP && pack.certPartnerIdLabel)
            lblP.textContent = pack.certPartnerIdLabel;
          var lblC = document.getElementById("benefit-cert-customer-ref-label");
          if (lblC && pack.certCustomerIdLabel)
            lblC.textContent = pack.certCustomerIdLabel;
          var lblL = document.getElementById("benefit-cert-outbound-ref-label");
          if (lblL && pack.certLeadRefLabel)
            lblL.textContent = pack.certLeadRefLabel;
        }

        function osgHydrateFooterAgbBpr(pack) {
          var el = document.getElementById("i18n-footer-agb-bpr");
          if (!el || !pack) return;
          el.innerHTML = pack.certTermsFooterHtml || "";
        }

        function osgOpenBenefitCertModal(realm, tr, slug, lint, anchorTarget) {
          var ov = document.getElementById("partner-benefit-cert-overlay");
          if (!ov || !tr || !realm) return;
          var pack = window.__OSG_CURRENT_PACK_CACHE;
          osgHydrateBenefitCertShell(pack);
          ov.dataset.pendingHref = tr.href;
          ov.dataset.pendingTarget = anchorTarget ? String(anchorTarget) : "_blank";
          ov.dataset.lastRealm = String(realm);

          document.getElementById("benefit-cert-partner-ref-num").textContent =
            (OSG_CERT_SETTLEMENT_REF &&
              OSG_CERT_SETTLEMENT_REF[String(slug || "").trim()]) ||
            OSG_PAULI_PROVIDER_REF;
          var cidEl = document.getElementById("benefit-cert-customer-ref-num");
          if (cidEl) cidEl.textContent = String(tr.customerId || "").toUpperCase();
          var lidEl = document.getElementById("benefit-cert-outbound-ref-num");
          if (lidEl) lidEl.textContent = String(tr.leadId || "").toUpperCase();

          var badge = document.getElementById("benefit-cert-exclusive-badge");
          var head = document.getElementById("benefit-cert-headline");
          if (pack) {
            var heroCombined =
              pack.certHeroCombined && String(pack.certHeroCombined).trim();
            if (heroCombined && badge && head) {
              badge.textContent = heroCombined;
              head.textContent =
                pack.certRibbonLine ||
                pack.certMediatorLine ||
                OSG_APP_DISPLAY_NAME;
            } else {
              if (badge)
                badge.textContent = pack.certExclusiveBadgeLine || "";
              if (head) head.textContent = pack.certMediatorLine || "";
            }
          }

          var hook = document.getElementById("benefit-cert-hook");
          if (hook && pack) {
            hook.textContent =
              realm === "real_estate"
                ? pack.certHookRealty || ""
                : pack.certHookAutomotive || "";
          }
          var leg = document.getElementById("benefit-cert-legal-block");
          if (leg && pack) leg.textContent = pack.certDisclaimerUnderCard || "";

          var lc = osgLangToBcp47();
          try {
            var loc =
              lc === "de"
                ? "de-DE"
                : lc === "th"
                  ? "th-TH"
                  : lc === "pl"
                    ? "pl-PL"
                    : lc === "ru"
                      ? "ru-RU"
                      : lc === "zh-CN"
                        ? "zh-CN"
                        : "en-GB";
            var tf = pack && pack.certIssuedPrefix ? pack.certIssuedPrefix + ": " : "";
            document.getElementById("benefit-cert-issued").textContent =
              tf +
              new Date().toLocaleString(loc, {
                dateStyle: "medium",
                timeStyle: "short",
              });
          } catch (_) {
            document.getElementById("benefit-cert-issued").textContent =
              new Date().toISOString();
          }

          ov.removeAttribute("hidden");
          ov.classList.add("partner-benefit-cert-overlay--open");
          ov.setAttribute("aria-hidden", "false");
          try {
            document.body.style.overflow = "hidden";
          } catch (_) {}
          setTimeout(function () {
            try {
              document.getElementById("partner-benefit-cert-close-btn").focus();
            } catch (_) {}
          }, 80);
        }

        function osgCloseBenefitCertModal() {
          var ov = document.getElementById("partner-benefit-cert-overlay");
          if (!ov) return;
          ov.setAttribute("hidden", "");
          ov.classList.remove("partner-benefit-cert-overlay--open");
          ov.setAttribute("aria-hidden", "true");
          ov.dataset.pendingHref = "";
          ov.dataset.pendingTarget = "_blank";
          try {
            document.body.style.overflow = "";
          } catch (_) {}
        }

        function osgWireBenefitCertModalOnce() {
          if (window.__OSG_BEN_CERT_WIRED__) return;
          window.__OSG_BEN_CERT_WIRED__ = true;
          var ov = document.getElementById("partner-benefit-cert-overlay");
          if (!ov) return;
          function openPending() {
            var href =
              ov.dataset.pendingHref ||
              ov.getAttribute("data-pending-href") ||
              "";
            var t =
              ov.dataset.pendingTarget &&
              ov.dataset.pendingTarget.trim()
                ? ov.dataset.pendingTarget.trim()
                : "_blank";
            if (!href) return;
            osgCloseBenefitCertModal();
            try {
              if (t === "_blank") {
                var w = window.open(href, "_blank", "noopener,noreferrer");
                if (!w) window.location.href = href;
              } else window.location.href = href;
            } catch (_) {
              window.location.href = href;
            }
          }

          var cbtn = document.getElementById("partner-benefit-cert-close-btn");
          if (cbtn)
            cbtn.addEventListener(
              "click",
              function () {
                osgCloseBenefitCertModal();
              },
              false
            );
          var bd = ov.querySelector(".partner-benefit-cert-backdrop");
          if (bd)
            bd.addEventListener(
              "click",
              function () {
                osgCloseBenefitCertModal();
              },
              false
            );
          var pbtn = document.getElementById("benefit-cert-print-btn");
          if (pbtn)
            pbtn.addEventListener(
              "click",
              function () {
                window.print();
              },
              false
            );
          var obtn = document.getElementById("benefit-cert-open-partner-btn");
          if (obtn) obtn.addEventListener("click", openPending, false);
          document.addEventListener(
            "keydown",
            function (ev) {
              if ((ev.key || "").toLowerCase() !== "escape") return;
              if (
                ov.hasAttribute("hidden") ||
                !ov.classList.contains("partner-benefit-cert-overlay--open")
              )
                return;
              osgCloseBenefitCertModal();
              ev.stopPropagation();
            },
            false
          );
        }

        function osgAttachAffiliateLinkCaptureOnce() {
          if (window.__OSG_AFF_CAPTURE__) return;
          window.__OSG_AFF_CAPTURE__ = true;
          document.body.addEventListener(
            "click",
            function (e) {
              if (e.button !== 0) return;
              var a = e.target.closest("a.osg-affiliate-link");
              if (!a || !document.body.contains(a)) return;
              e.preventDefault();
              var raw =
                (a.getAttribute("href") || "").trim();
              var partner =
                (a.getAttribute("data-osg-partner") || "partner").trim();
              var channel =
                (a.getAttribute("data-osg-channel") || "partner").trim();
              if (!raw || raw === "#") return;
              var pkWall =
                window.__OSG_CURRENT_PACK_CACHE ||
                (typeof T !== "undefined" ? T.de : {});
              if (
                typeof osgPremiumAccessUnlocked === "function" &&
                !osgPremiumAccessUnlocked()
              ) {
                try {
                  alert(pkWall.premiumLockedAlert || "");
                } catch (_) {}
                return;
              }
              var lint =
                (a.getAttribute("data-osg-intent") || "").trim();
              if (!lint) {
                if (channel === "marketplace") lint = "purchase";
                else if (channel === "bank") lint = "consult";
                else if (channel === "dealer") lint = "purchase";
                else if (channel === "real_estate") lint = "consult";
              }
              var certRealm =
                (a.getAttribute("data-osg-cert-realm") || "").trim();

              var sector = osgRestrictedSectorFromAffiliate(
                partner,
                channel,
                certRealm
              );

              function runAffiliateOutboundFlow() {
                var cid = osgEnsureCustomerId();
                var lid = osgNewLeadId();

                function proceedWithTracked(tr) {
                  if (channel === "marketplace" && lint === "purchase") {
                    osgMutePurchasedProductInterests();
                    osgSetPurchasedSilence();
                    if (typeof osgAvatarClaimReferralPurchaseOnce === "function") {
                      osgAvatarClaimReferralPurchaseOnce();
                    }
                    if (typeof osgAvatarCelebratePurchase === "function") {
                      osgAvatarCelebratePurchase(
                        typeof window.osgEstimateAffiliatePurchaseThb === "function"
                          ? window.osgEstimateAffiliatePurchaseThb(a)
                          : 0
                      );
                    }
                  }

                  function openTrackedFromAnchor() {
                    try {
                      var t = ((a.target || "").trim()) || "_self";
                      if (t === "_blank") {
                        var w = window.open(tr.href, "_blank", "noopener,noreferrer");
                        if (!w) window.location.href = tr.href;
                      } else {
                        window.location.href = tr.href;
                      }
                    } catch (_) {
                      window.location.href = tr.href;
                    }
                  }

                  if (
                    certRealm === "real_estate" ||
                    certRealm === "automotive"
                  ) {
                    var tsCert = new Date().toISOString();
                    osgAppendLeadJournal(
                      {
                        leadId: osgNewLeadId(),
                        customerId: tr.customerId,
                        osg_partner: partner,
                        osg_ch: "partner_benefit_certificate",
                        landingHref:
                          "internal:bpr_benefit_cert:" +
                          certRealm +
                          ":" +
                          encodeURIComponent(String(lint).slice(0, 120)),
                        trackedHref: String(tr.href).slice(0, 900),
                        clickedAtISO: tsCert,
                        conversionBasis: true,
                        leadIntent: "provision_protect",
                        outboundLeadRef: tr.leadId,
                        provisionRealm: certRealm,
                      },
                      { skipBump: true }
                    );
                    var at =
                      ((a.target || "").trim() && (a.target || "").trim()) ||
                      "_blank";
                    osgOpenBenefitCertModal(
                      certRealm,
                      tr,
                      partner,
                      lint,
                      at
                    );
                    Promise.resolve()
                      .then(function () {
                        if (
                          window.PauliVoice &&
                          typeof window.PauliVoice
                            .speakPartnerBenefitCertificate === "function"
                        ) {
                          return window.PauliVoice.speakPartnerBenefitCertificate(
                            certRealm
                          );
                        }
                      })
                      .catch(function () {});
                    return;
                  }

                  function openTracked() {
                    var AC = window.osgAvatarController;
                    var persona = window.OSG_PAULI_PERSONA;
                    var isRetail =
                      persona &&
                      typeof persona.isRetailPurchaseIntent === "function" &&
                      persona.isRetailPurchaseIntent(channel, lint, certRealm);
                    if (
                      isRetail &&
                      AC &&
                      typeof AC.speakCheckoutPurchaseChain === "function"
                    ) {
                      Promise.resolve(
                        AC.speakCheckoutPurchaseChain({
                          partner: partner,
                          channel: channel,
                          certRealm: certRealm,
                          pack: window.__OSG_CURRENT_PACK_CACHE,
                        })
                      )
                        .catch(function () {})
                        .finally(openTrackedFromAnchor);
                      return;
                    }
                    openTrackedFromAnchor();
                  }
                  var persona = window.OSG_PAULI_PERSONA;
                  var AC = window.osgAvatarController;
                  var isCompliance =
                    persona &&
                    typeof persona.isComplianceChannel === "function" &&
                    persona.isComplianceChannel(channel, certRealm);
                  if (
                    isCompliance &&
                    AC &&
                    typeof AC.enterWegweiserMode === "function"
                  ) {
                    Promise.resolve(
                      AC.enterWegweiserMode({
                        channel: channel,
                        certRealm: certRealm,
                        pack: window.__OSG_CURRENT_PACK_CACHE,
                        element: a,
                      })
                    )
                      .catch(function () {})
                      .finally(function () {
                        openTracked();
                      });
                  } else {
                    openTracked();
                  }
                }

                if (osgIsInvolveMarketplacePartner(partner, channel)) {
                  osgFetchInvolveDeeplink(partner, raw, cid, lid, channel)
                    .then(function (data) {
                      var link =
                        data && typeof data.trackingLink === "string"
                          ? data.trackingLink.trim()
                          : "";
                      if (!link) throw new Error("no_tracking_link");
                      var tr = osgRecordPartnerOutbound(
                        partner,
                        channel,
                        raw,
                        lint,
                        { marketplaceSubId: OSG_MARKETPLACE_SUB_ID },
                        link,
                        cid,
                        lid
                      );
                      proceedWithTracked(tr);
                    })
                    .catch(function () {
                      var magicHref =
                        typeof window.osgInvolveMagicFallbackHref === "function"
                          ? window.osgInvolveMagicFallbackHref(a)
                          : "";
                      if (!magicHref) {
                        var hNow = (a.getAttribute("href") || "").trim();
                        if (/invl\.co|involve\.asia/i.test(hNow)) {
                          magicHref = hNow;
                        }
                      }
                      if (magicHref) {
                        var trMagic = osgRecordPartnerOutbound(
                          partner,
                          channel,
                          raw,
                          lint,
                          { marketplaceSubId: OSG_MARKETPLACE_SUB_ID },
                          magicHref,
                          cid,
                          lid
                        );
                        proceedWithTracked(trMagic);
                        return;
                      }
                      try {
                        alert(
                          pkWall.affiliateDeeplinkFail ||
                            "Tracking link unavailable."
                        );
                      } catch (_) {}
                    });
                  return;
                }

                var tr = osgRecordPartnerOutbound(
                  partner,
                  channel,
                  raw,
                  lint
                );
                proceedWithTracked(tr);
              }

              if (sector && !osgVerifiedTwentyPlusNow()) {
                osgOpenAgeGateOverlay({
                  sector: sector,
                  afterVerified: runAffiliateOutboundFlow,
                });
                return;
              }
              runAffiliateOutboundFlow();
            },
            true
          );
        }

        function osgBuildHvSnippet(pack, lid, vehicle, note) {
          var cid = osgEnsureCustomerId();
          var vTrim = String(vehicle || "").trim();
          var nTrim = String(note || "").trim();
          var vPref = pack.hvVehicleLinePrefix || "Vehicle: ";
          var nPref = pack.hvNoteLinePrefix || "Note: ";
          var vLine = vTrim ? vPref + vTrim + "\n" : "";
          var nLine = nTrim ? nPref + nTrim + "\n" : "";
          var tpl =
            pack.hvSnippetTemplate ||
            "PAULI BEST PRICE THAILAND\n{CID}\n{LID}\n";
          return tpl
            .replace(/\{CID\}/g, cid)
            .replace(/\{LID\}/g, lid)
            .replace(/\{VEHICLE\}/g, vLine)
            .replace(/\{NOTE\}/g, nLine);
        }

        function osgHydrateHighValueCopyUi(pack) {
          if (!pack) return;
          var sumEl = document.getElementById("hv-lead-summary-anchor");
          if (sumEl && pack.hvLeadSummary)
            sumEl.textContent = pack.hvLeadSummary;
          var expl = document.getElementById("hv-lead-expl");
          if (expl) expl.textContent = pack.hvLeadExplain || "";
          var lv = document.getElementById("hv-label-vehicle");
          if (lv) lv.textContent = pack.hvLabelVehicle || "";
          var ln = document.getElementById("hv-label-note");
          if (ln) ln.textContent = pack.hvLabelNote || "";
          var lsn = document.getElementById("hv-snippet-label");
          if (lsn) lsn.textContent = pack.hvSnippetFieldLabel || "";
          var sb = document.getElementById("hv-submit-btn");
          if (sb && pack.hvSubmitBtn) sb.textContent = pack.hvSubmitBtn;
          var cb = document.getElementById("hv-copy-btn");
          if (cb && pack.hvCopyBtn) cb.textContent = pack.hvCopyBtn;
        }

        function osgLogLeadClick(opts) {
          if (!opts || typeof opts !== "object") return null;
          var partner =
            String(opts.partnerId || opts.osg_partner || "").trim();
          if (!partner) return null;
          var intent =
            String(opts.intent || opts.leadIntent || "click").trim();
          var ch = String(opts.channel || "intent_log").trim() || "intent_log";
          var lid = osgNewLeadId();
          var ts = new Date().toISOString();
          var href = opts.href != null ? String(opts.href) : "";
          osgAppendLeadJournal({
            leadId: lid,
            customerId: osgEnsureCustomerId(),
            osg_partner: partner,
            osg_ch: ch,
            landingHref: href.slice(0, 650),
            trackedHref: "",
            clickedAtISO: ts,
            conversionBasis: !!opts.conversionBasis,
            leadIntent: intent,
          });
          return lid;
        }

        function osgWireHighValueLeadFormOnce() {
          if (window.__OSG_HV_FORM_WIRED__) return;
          window.__OSG_HV_FORM_WIRED__ = true;
          var form = document.getElementById("hv-lead-form");
          var copyBtn = document.getElementById("hv-copy-btn");
          function currentPack() {
            var I = window.__OSG_I18N;
            if (!I || !I.T) return null;
            var raw =
              document.documentElement.getAttribute("lang") || "de";
            return I.T[I.normalizeLang(raw)] || null;
          }
          if (form) {
            form.addEventListener(
              "submit",
              function (ev) {
                ev.preventDefault();
                var pack = currentPack();
                if (!pack) return;
                if (
                  typeof osgPremiumAccessUnlocked === "function" &&
                  !osgPremiumAccessUnlocked()
                ) {
                  try {
                    alert(pack.premiumLockedAlert || "");
                  } catch (_) {}
                  return;
                }
                function commitHvLead() {
                  var vIn = document.getElementById("hv-input-vehicle");
                  var nIn = document.getElementById("hv-input-note");
                  var v = vIn ? vIn.value : "";
                  var n = nIn ? nIn.value : "";
                  var lid = osgNewLeadId();
                  var ts = new Date().toISOString();
                  osgAppendLeadJournal({
                    leadId: lid,
                    customerId: osgEnsureCustomerId(),
                    osg_partner: "high_value_dealer_signal",
                    osg_ch: "form_trigger",
                    landingHref: "internal:hv_form",
                    trackedHref: "",
                    clickedAtISO: ts,
                    conversionBasis: true,
                    leadIntent: "provision_protect",
                    vehicleHint: String(v).trim().slice(0, 200),
                    dealerNote: String(n).trim().slice(0, 500),
                  });
                  var ta = document.getElementById("hv-snippet-ro");
                  if (ta)
                    ta.value = osgBuildHvSnippet(pack, lid, v, n);
                  var fb = document.getElementById("hv-form-feedback");
                  if (fb) fb.textContent = pack.hvFormSavedLine || "";
                }
                commitHvLead();
              },
              false
            );
          }
          if (copyBtn) {
            copyBtn.addEventListener("click", function () {
              var pack = currentPack();
              var ta = document.getElementById("hv-snippet-ro");
              var fb = document.getElementById("hv-form-feedback");
              if (!ta || !ta.value.trim()) {
                if (fb && pack) fb.textContent = pack.hvCopyEmptyHint || "";
                return;
              }
              function okLine() {
                if (fb && pack) fb.textContent = pack.hvCopyOkLine || "";
              }
              function badLine() {
                if (fb && pack)
                  fb.textContent = pack.hvCopyFailLine || "";
              }
              if (
                navigator.clipboard &&
                typeof navigator.clipboard.writeText === "function"
              ) {
                navigator.clipboard.writeText(ta.value).then(okLine).catch(
                  function () {
                    try {
                      ta.focus();
                      ta.select();
                      if (document.execCommand("copy")) okLine();
                      else badLine();
                    } catch (_) {
                      badLine();
                    }
                  }
                );
              } else {
                try {
                  ta.focus();
                  ta.select();
                  if (document.execCommand("copy")) okLine();
                  else badLine();
                } catch (_) {
                  badLine();
                }
              }
            });
          }
        }

        window.__OSG_AFFILIATE = {
          recordBookingHandshake: osgRecordBookingHandshake,
          loadCounts: osgLoadCounts,
          loadJournal: osgLoadJournal,
          logLeadClick: osgLogLeadClick,
        };

        osgAttachAffiliateLinkCaptureOnce();
        osgWireBenefitCertModalOnce();
        osgWireHighValueLeadFormOnce();
        osgRefreshLeadSummaryPre();

        /* ──────────────────────────────────────────────────────────────
           NEW DEAL SECTIONS: smartphones, internet, tariffs
           Data is in the i18n T object (osgDealsData). Rendered on lang switch.
           ────────────────────────────────────────────────────────────── */
        var OSG_DEALS_DATA = {
          smartphones: [
            {
              nameKey: "dealPhone1Name",
              priceThb: 6990,
              unit: "THB",
              detailKey: "dealPhone1Detail",
              badge: "HOT",
              href: "https://www.lazada.co.th/catalog/?q=smartphone+android+budget",
              partner: "lazada_th",
            },
            {
              nameKey: "dealPhone2Name",
              priceThb: 11990,
              unit: "THB",
              detailKey: "dealPhone2Detail",
              badge: "DEAL",
              href: "https://shopee.co.th/search?keyword=smartphone+5g+thailand",
              partner: "shopee_th",
            },
            {
              nameKey: "dealPhone3Name",
              priceThb: 3490,
              unit: "THB",
              detailKey: "dealPhone3Detail",
              badge: null,
              href: "https://www.lazada.co.th/catalog/?q=ais+smartphone+contract",
              partner: "lazada_th",
            },
          ],
          internet: [
            {
              nameKey: "dealNet1Name",
              priceThb: 399,
              unit: "THB/เดือน",
              detailKey: "dealNet1Detail",
              badge: "POPULAR",
              href: "https://www.ais.th/fibre/",
              partner: "ais_th",
            },
            {
              nameKey: "dealNet2Name",
              priceThb: 349,
              unit: "THB/เดือน",
              detailKey: "dealNet2Detail",
              badge: null,
              href: "https://www.true.th/service/trueonline/",
              partner: "true_th",
            },
            {
              nameKey: "dealNet3Name",
              priceThb: 299,
              unit: "THB/เดือน",
              detailKey: "dealNet3Detail",
              badge: "SAVE",
              href: "https://www.ntplc.co.th/",
              partner: "nt_th",
            },
          ],
          tariffs: [
            {
              nameKey: "dealTariff1Name",
              priceThb: 199,
              unit: "THB/เดือน",
              detailKey: "dealTariff1Detail",
              badge: "BEST",
              href: "https://www.dtac.co.th/packages/",
              partner: "dtac_th",
            },
            {
              nameKey: "dealTariff2Name",
              priceThb: 249,
              unit: "THB/เดือน",
              detailKey: "dealTariff2Detail",
              badge: null,
              href: "https://www.ais.th/prepaid/th/",
              partner: "ais_th",
            },
            {
              nameKey: "dealTariff3Name",
              priceThb: 169,
              unit: "THB/เดือน",
              detailKey: "dealTariff3Detail",
              badge: "DATA",
              href: "https://www.true.th/service/truemove-h/",
              partner: "true_th",
            },
          ],
        };

        function osgBuildDealCard(item, pack) {
          var name = (pack && pack[item.nameKey]) || item.nameKey;
          var detail = (pack && pack[item.detailKey]) || "";
          var ctaLabel = (pack && pack.dealCtaLabel) || "ดูข้อเสนอ";
          var badgeHtml = item.badge
            ? '<span class="osg-urgency-badge osg-deal-card__badge">' +
              osgEscHtml(item.badge) +
              "</span>"
            : "";
          return (
            '<div class="osg-deal-card">' +
            badgeHtml +
            '<div class="osg-deal-card__name">' +
            osgEscHtml(name) +
            "</div>" +
            '<div class="osg-deal-card__price">' +
            osgEscHtml(String(item.priceThb)) +
            ' <small>' +
            osgEscHtml(item.unit) +
            "</small></div>" +
            '<div class="osg-deal-card__detail">' +
            osgEscHtml(detail) +
            "</div>" +
            '<a class="osg-deal-card__cta osg-affiliate-link"' +
            ' href="' + osgEscHtml(item.href) + '"' +
            ' data-osg-partner="' + osgEscHtml(item.partner) + '"' +
            ' data-osg-channel="marketplace"' +
            ' data-osg-intent="purchase"' +
            ' target="_blank" rel="noopener noreferrer">' +
            osgEscHtml(ctaLabel) +
            "</a>" +
            "</div>"
          );
        }

        function osgRenderDealSection(gridId, items, pack) {
          var grid = document.getElementById(gridId);
          if (!grid) return;
          grid.innerHTML = items.map(function (item) {
            return osgBuildDealCard(item, pack);
          }).join("");
        }

        function osgHydrateDealsAll(pack) {
          var sp = document.getElementById("osg-smartphones-heading");
          var si = document.getElementById("osg-internet-heading");
          var st = document.getElementById("osg-tariff-heading");
          var ss = document.getElementById("osg-smartphones-sub");
          var si2 = document.getElementById("osg-internet-sub");
          var st2 = document.getElementById("osg-tariff-sub");
          if (sp) sp.textContent = (pack && pack.dealsSmartphonesHeading) || "";
          if (si) si.textContent = (pack && pack.dealsInternetHeading) || "";
          if (st) st.textContent = (pack && pack.dealsTariffHeading) || "";
          if (ss) ss.textContent = (pack && pack.dealsSmartphonesSub) || "";
          if (si2) si2.textContent = (pack && pack.dealsInternetSub) || "";
          if (st2) st2.textContent = (pack && pack.dealsTariffSub) || "";
          osgRenderDealSection("osg-smartphones-grid", OSG_DEALS_DATA.smartphones, pack);
          osgRenderDealSection("osg-internet-grid", OSG_DEALS_DATA.internet, pack);
          osgRenderDealSection("osg-tariff-grid", OSG_DEALS_DATA.tariffs, pack);
          var sp2 = document.getElementById("osg-social-proof-bar");
          if (sp2) sp2.textContent = (pack && pack.socialProofBar) || "";
        }

        /* ──────────────────────────────────────────────────────────────
           AVATAR GESTURE / GUIDE SYSTEM
           Call osgAvatarPoint(selectorOrEl, text, durationMs) from anywhere.
           ────────────────────────────────────────────────────────────── */
        var __osgAvatarGuideTimer = 0;
        var __osgAvatarGuideResizeBound = false;

        function osgAvatarPlaceBubbleUnderCoin(bubble, el) {
          if (!bubble || !el) return;
          var rect = el.getBoundingClientRect();
          var bubbleW = Math.min(300, Math.max(200, window.innerWidth * 0.88));
          var bubX = Math.max(
            8,
            Math.min(
              rect.left + rect.width / 2 - bubbleW / 2,
              window.innerWidth - bubbleW - 8
            )
          );
          var bubY = Math.round(rect.bottom + 10);
          bubble.style.left = bubX + "px";
          bubble.style.top = bubY + "px";
          bubble.style.maxWidth = bubbleW + "px";
          bubble.style.transform = "";
        }

        function osgAvatarPoint(targetSelectorOrEl, text, durationMs) {
          durationMs = durationMs || 4000;
          var bubble = document.getElementById("osg-avatar-bubble");
          var arrow = document.getElementById("osg-avatar-arrow");
          if (!bubble || !arrow) return;
          try {
            clearTimeout(__osgAvatarGuideTimer);
          } catch (_) {}

          var el =
            typeof targetSelectorOrEl === "string"
              ? document.querySelector(targetSelectorOrEl)
              : targetSelectorOrEl;

          bubble.textContent = String(text || "");
          bubble.classList.add("is-visible");

          if (el) {
            var isCoin =
              el.id === "coin-stage" ||
              (el.classList && el.classList.contains("coin-stage"));
            if (isCoin) {
              osgAvatarPlaceBubbleUnderCoin(bubble, el);
              bubble.classList.add("osg-avatar-guide-bubble--under-coin");
              arrow.classList.remove("is-visible");
              if (!__osgAvatarGuideResizeBound) {
                __osgAvatarGuideResizeBound = true;
                window.addEventListener("resize", function () {
                  if (!bubble.classList.contains("is-visible")) return;
                  var coin = document.getElementById("coin-stage");
                  if (coin) osgAvatarPlaceBubbleUnderCoin(bubble, coin);
                });
                window.addEventListener(
                  "scroll",
                  function () {
                    if (!bubble.classList.contains("is-visible")) return;
                    var coin = document.getElementById("coin-stage");
                    if (coin) osgAvatarPlaceBubbleUnderCoin(bubble, coin);
                  },
                  true
                );
              }
            } else {
              bubble.classList.remove("osg-avatar-guide-bubble--under-coin");
              var rect = el.getBoundingClientRect();
              var arrowX = Math.round(rect.left + rect.width / 2 - 16);
              var arrowY = Math.round(rect.top - 38);
              var bubX2 = Math.max(8, Math.min(arrowX - 80, window.innerWidth - 260));
              var bubY2 = Math.max(8, arrowY - 56);
              arrow.style.left = arrowX + "px";
              arrow.style.top = arrowY + "px";
              bubble.style.left = bubX2 + "px";
              bubble.style.top = bubY2 + "px";
              bubble.style.transform = "";
              arrow.classList.add("is-visible");
            }
          } else {
            arrow.classList.remove("is-visible");
            bubble.style.left = "50%";
            bubble.style.top = "60px";
            bubble.style.transform = "translateX(-50%)";
          }

          __osgAvatarGuideTimer = setTimeout(function () {
            bubble.classList.remove("is-visible");
            arrow.classList.remove("is-visible");
          }, durationMs);
        }

        window.osgAvatarPoint = osgAvatarPoint;

        function osgAvatarStartTour(pack) {
          if (typeof window.osgAvatarTour === "function") {
            void window.osgAvatarTour(pack);
            return;
          }
          if (!pack) return;
          var steps = [
            [".compare-panel", pack.avatarTourStep1 || ""],
            ["#osg-smartphones-section", pack.avatarTourStep2 || ""],
            ["#osg-internet-section", pack.avatarTourStep5 || ""],
            ["#osg-tariff-section", pack.avatarTourStep3 || ""],
            ["#osg-autoservice-section", pack.avatarTourStep6 || ""],
            [".osg-vip-block", pack.avatarTourStep4 || ""],
          ];
          var i = 0;
          function next() {
            if (i >= steps.length) return;
            var step = steps[i++];
            if (!step[1]) { next(); return; }
            osgAvatarPoint(step[0], step[1], 3800);
            setTimeout(next, 4200);
          }
          setTimeout(next, 1200);
        }

        window.osgAvatarStartTour = osgAvatarStartTour;

        /* ══════════════════════════════════════════════════════════════
           AUTOSERVICE — Werkstatt-Pool, GPS-Suche, Buchung
           Fallback-Standort in i18n T.autoserviceFallbackAddress;
           lat/lng im Daten-Objekt OSG_AUTOSERVICE_FALLBACK_LOCATION.
           ══════════════════════════════════════════════════════════════ */

        /** Fallback-Koordinaten: Zentrum Bangkok — Siam Paragon (Pathum Wan).
            Bei fehlendem / abgelehntem GPS: Suche & Sortierung der Ketten B-Quik,
            FIT Auto, Cockpit von diesem Punkt aus. */
        var OSG_AUTOSERVICE_FALLBACK_LOCATION = {
          lat: 13.7464,
          lng: 100.5349,
          addressKey: "autoserviceFallbackAddress",
        };

        var OSG_AUTOSERVICE_CAR_BRANDS = [
          "Toyota","Honda","Ford","Mitsubishi","Isuzu","Mazda",
          "Nissan","Suzuki","Mercedes","BMW","Audi","Hyundai",
          "Kia","Chevrolet","Lexus","Volkswagen","Volvo","MG","BYD",
        ];

        var OSG_AUTOSERVICE_SHOPS = [
          {
            id: "bquik",
            nameKey: "autoShopBquikName",
            descKey: "autoShopBquikDesc",
            href: "https://www.b-quik.com/branch/",
            partner: "bquik_th",
            badge: "POPULAR",
            /* representative branches (lat/lng) — sorted nearest to user */
            branches: [
              { lat: 13.7563, lng: 100.5018, cityKey: "autoShopCityBangkok" },
              { lat: 14.9928, lng: 102.1019, cityKey: "autoShopCityKhonKaen" },
              { lat: 18.7883, lng: 98.9853, cityKey: "autoShopCityChiangMai" },
              { lat: 7.8804, lng: 98.3923, cityKey: "autoShopCityPhuket" },
              { lat: 13.7455, lng: 100.5285, cityKey: "autoShopCityBangkok" },
            ],
          },
          {
            id: "fitauto",
            nameKey: "autoShopFitAutoName",
            descKey: "autoShopFitAutoDesc",
            href: "https://www.fitauto.co.th/service-center",
            partner: "fitauto_th",
            badge: "DEAL",
            branches: [
              { lat: 13.7298, lng: 100.5203, cityKey: "autoShopCityBangkok" },
              { lat: 13.7482, lng: 100.5415, cityKey: "autoShopCityBangkok" },
              { lat: 18.7883, lng: 98.9853, cityKey: "autoShopCityChiangMai" },
              { lat: 13.7441, lng: 100.5268, cityKey: "autoShopCityBangkok" },
            ],
          },
          {
            id: "cockpit",
            nameKey: "autoShopCockpitName",
            descKey: "autoShopCockpitDesc",
            href: "https://www.cockpitthailand.com/branchlocator",
            partner: "cockpit_th",
            badge: null,
            branches: [
              { lat: 13.7399, lng: 100.5601, cityKey: "autoShopCityBangkok" },
              { lat: 7.0066, lng: 100.4730, cityKey: "autoShopCityHatYai" },
              { lat: 13.7471, lng: 100.5326, cityKey: "autoShopCityBangkok" },
            ],
          },
        ];

        var osgAutoserviceUserLat = null;
        var osgAutoserviceUserLng = null;
        var osgAutoserviceActiveBrand = null;
        var osgAutoserviceActiveShopId = null;

        function osgHaversineKm(lat1, lng1, lat2, lng2) {
          var R = 6371;
          var dLat = (lat2 - lat1) * Math.PI / 180;
          var dLng = (lng2 - lng1) * Math.PI / 180;
          var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        function osgNearestBranch(shop, lat, lng) {
          var best = null;
          var bestKm = Infinity;
          shop.branches.forEach(function (b) {
            var km = osgHaversineKm(lat, lng, b.lat, b.lng);
            if (km < bestKm) { bestKm = km; best = b; }
          });
          return { branch: best, km: bestKm };
        }

        function osgBuildAutoserviceCard(shop, lat, lng, pack) {
          var name = (pack && pack[shop.nameKey]) || shop.id;
          var desc = (pack && pack[shop.descKey]) || "";
          var ctaLabel = (pack && pack.autoserviceCtaLabel) || "จองเลย";
          var badgeHtml = shop.badge
            ? '<span class="osg-urgency-badge osg-deal-card__badge">' +
              osgEscHtml(shop.badge) + "</span>"
            : "";
          var distHtml = "";
          if (lat !== null && lng !== null) {
            var nr = osgNearestBranch(shop, lat, lng);
            if (nr.branch) {
              var city = (pack && pack[nr.branch.cityKey]) || "";
              distHtml = '<div class="osg-distance-badge">📍 ' +
                osgEscHtml(city ? city + " · " : "") +
                nr.km.toFixed(1) + " km</div>";
            }
          }
          var mapsUrl = "https://www.google.com/maps/search/" +
            encodeURIComponent((pack && pack[shop.nameKey]) || shop.id) +
            "/@" + (lat || OSG_AUTOSERVICE_FALLBACK_LOCATION.lat) +
            "," + (lng || OSG_AUTOSERVICE_FALLBACK_LOCATION.lng) + ",12z";
          return (
            '<div class="osg-deal-card" data-shop-id="' + osgEscHtml(shop.id) + '">' +
            badgeHtml +
            '<div class="osg-deal-card__name">' + osgEscHtml(name) + "</div>" +
            '<div class="osg-deal-card__detail">' + osgEscHtml(desc) + "</div>" +
            distHtml +
            '<div style="display:flex;gap:0.4rem;margin-top:0.45rem;flex-wrap:wrap;">' +
            '<a class="osg-deal-card__cta osg-affiliate-link"' +
            ' href="' + osgEscHtml(shop.href) + '"' +
            ' data-osg-partner="' + osgEscHtml(shop.partner) + '"' +
            ' data-osg-channel="dealer" data-osg-intent="purchase"' +
            ' target="_blank" rel="noopener noreferrer">' +
            osgEscHtml(ctaLabel) + "</a>" +
            '<a class="osg-deal-card__cta" style="background:rgba(50,180,100,0.25);color:#5de698;"' +
            ' href="' + osgEscHtml(mapsUrl) + '"' +
            ' target="_blank" rel="noopener noreferrer">' +
            "🗺️ Maps</a>" +
            '<button type="button" class="osg-deal-card__cta"' +
            ' style="background:rgba(212,175,55,0.18);color:var(--primary-gold);"' +
            ' data-action="book" data-shop-id="' + osgEscHtml(shop.id) + '">' +
            osgEscHtml((pack && pack.autoserviceBookBtn) || "📅") +
            "</button>" +
            "</div></div>"
          );
        }

        function osgRenderAutoserviceGrid(pack) {
          var grid = document.getElementById("osg-autoservice-grid");
          if (!grid) return;
          var lat = osgAutoserviceUserLat;
          var lng = osgAutoserviceUserLng;
          var fb = OSG_AUTOSERVICE_FALLBACK_LOCATION;
          var effLat = lat !== null && lng !== null ? lat : fb.lat;
          var effLng = lat !== null && lng !== null ? lng : fb.lng;
          var shops = OSG_AUTOSERVICE_SHOPS.slice();
          shops.sort(function (a, b) {
            return osgNearestBranch(a, effLat, effLng).km -
                   osgNearestBranch(b, effLat, effLng).km;
          });
          grid.innerHTML = shops.map(function (s) {
            return osgBuildAutoserviceCard(s, effLat, effLng, pack);
          }).join("");
          grid.querySelectorAll("[data-action='book']").forEach(function (btn) {
            btn.addEventListener("click", function () {
              var id = btn.getAttribute("data-shop-id");
              osgOpenAutoserviceBooking(id, pack);
            }, false);
          });
        }

        function osgHydrateAutoservice(pack) {
          var h = document.getElementById("osg-autoservice-heading");
          var sub = document.getElementById("osg-autoservice-sub");
          var geoLbl = document.getElementById("osg-autoservice-geo-label");
          var brandLbl = document.getElementById("osg-brand-filter-label");
          var h3 = document.getElementById("osg-booking-h3");
          var submit = document.getElementById("osg-booking-submit");
          if (h) h.textContent = (pack && pack.autoserviceHeading) || "";
          if (sub) sub.textContent = (pack && pack.autoserviceSub) || "";
          if (geoLbl) geoLbl.textContent = (pack && pack.autoserviceGeoBtn) || "";
          if (brandLbl) brandLbl.textContent = (pack && pack.autoserviceBrandLabel) || "";
          if (h3) h3.textContent = (pack && pack.autoserviceBookingHeading) || "";
          if (submit) submit.textContent = (pack && pack.autoserviceBookingSubmit) || "";
          // option labels
          [
            ["osg-booking-lbl-garage", "autoserviceBookGarage"],
            ["osg-booking-lbl-brand", "autoserviceBookBrand"],
            ["osg-booking-lbl-model", "autoserviceBookModel"],
            ["osg-booking-lbl-service", "autoserviceBookService"],
            ["osg-booking-lbl-date", "autoserviceBookDate"],
            ["osg-booking-lbl-note", "autoserviceBookNote"],
          ].forEach(function (pair) {
            var el = document.getElementById(pair[0]);
            if (el) el.textContent = (pack && pack[pair[1]]) || "";
          });
          [
            ["osg-booking-svc-general","autoserviceSvcGeneral"],
            ["osg-booking-svc-oil","autoserviceSvcOil"],
            ["osg-booking-svc-tyre","autoserviceSvcTyre"],
            ["osg-booking-svc-brake","autoserviceSvcBrake"],
            ["osg-booking-svc-ac","autoserviceSvcAc"],
            ["osg-booking-svc-other","autoserviceSvcOther"],
          ].forEach(function (pair) {
            var el = document.getElementById(pair[0]);
            if (el) el.textContent = (pack && pack[pair[1]]) || pair[0].split("-").pop();
          });
          // brand chips
          var chips = document.getElementById("osg-brand-chips");
          if (chips) {
            chips.innerHTML = OSG_AUTOSERVICE_CAR_BRANDS.map(function (b) {
              return '<button type="button" class="osg-brand-chip' +
                (osgAutoserviceActiveBrand === b ? " is-active" : "") +
                '" data-brand="' + osgEscHtml(b) + '">' +
                osgEscHtml(b) + "</button>";
            }).join("");
            chips.querySelectorAll(".osg-brand-chip").forEach(function (btn) {
              btn.addEventListener("click", function () {
                var brand = btn.getAttribute("data-brand");
                osgAutoserviceActiveBrand = (osgAutoserviceActiveBrand === brand) ? null : brand;
                var bIn = document.getElementById("osg-booking-brand");
                if (bIn && osgAutoserviceActiveBrand) bIn.value = osgAutoserviceActiveBrand;
                osgHydrateAutoservice(pack);
                osgRenderAutoserviceGrid(pack);
              }, false);
            });
          }
          osgRenderAutoserviceGrid(pack);
          osgWireAutoserviceGeoOnce(pack);
          osgWireAutoserviceFormOnce(pack);
        }

        function osgWireAutoserviceGeoOnce(pack) {
          var btn = document.getElementById("osg-autoservice-geo-btn");
          if (!btn || btn.dataset.osgGeoWired === "1") return;
          btn.dataset.osgGeoWired = "1";
          btn.addEventListener("click", function () {
            var status = document.getElementById("osg-autoservice-geo-status");
            if (!navigator.geolocation) {
              if (status) status.textContent = (pack && pack.autoserviceGeoUnsupported) || "";
              return;
            }
            if (status) status.textContent = (pack && pack.autoserviceGeoLoading) || "…";
            navigator.geolocation.getCurrentPosition(
              function (pos) {
                osgAutoserviceUserLat = pos.coords.latitude;
                osgAutoserviceUserLng = pos.coords.longitude;
                if (status) status.textContent = (pack && pack.autoserviceGeoOk) || "";
                osgRenderAutoserviceGrid(pack);
              },
              function () {
                osgAutoserviceUserLat = OSG_AUTOSERVICE_FALLBACK_LOCATION.lat;
                osgAutoserviceUserLng = OSG_AUTOSERVICE_FALLBACK_LOCATION.lng;
                var fbAddr = (pack && pack.autoserviceFallbackAddress) ||
                  "Bangkok · Siam Paragon (fallback)";
                if (status) status.textContent =
                  ((pack && pack.autoserviceGeoFallback) || "") + " " + fbAddr;
                osgRenderAutoserviceGrid(pack);
              },
              { timeout: 8000, maximumAge: 60000 }
            );
          }, false);
        }

        function osgOpenAutoserviceBooking(shopId, pack) {
          var wrap = document.getElementById("osg-autoservice-booking");
          if (!wrap) return;
          osgAutoserviceActiveShopId = shopId;
          var shop = OSG_AUTOSERVICE_SHOPS.find(function (s) { return s.id === shopId; });
          var gIn = document.getElementById("osg-booking-garage");
          if (gIn && shop) gIn.value = (pack && pack[shop.nameKey]) || shopId;
          var latIn = document.getElementById("osg-booking-lat");
          var lngIn = document.getElementById("osg-booking-lng");
          if (latIn) latIn.value = osgAutoserviceUserLat || OSG_AUTOSERVICE_FALLBACK_LOCATION.lat;
          if (lngIn) lngIn.value = osgAutoserviceUserLng || OSG_AUTOSERVICE_FALLBACK_LOCATION.lng;
          var affIn = document.getElementById("osg-booking-affiliate");
          if (affIn && shop) affIn.value = shop.partner;
          if (osgAutoserviceActiveBrand) {
            var bIn = document.getElementById("osg-booking-brand");
            if (bIn) bIn.value = osgAutoserviceActiveBrand;
          }
          wrap.removeAttribute("hidden");
          try { wrap.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (_) {}
        }

        function osgWireAutoserviceFormOnce(pack) {
          var form = document.getElementById("osg-autoservice-form");
          if (!form || form.dataset.osgFormWired === "1") return;
          form.dataset.osgFormWired = "1";
          form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            var fb = document.getElementById("osg-booking-feedback");
            var data = {
              garage: (document.getElementById("osg-booking-garage") || {}).value || "",
              brand: (document.getElementById("osg-booking-brand") || {}).value || "",
              model: (document.getElementById("osg-booking-model") || {}).value || "",
              service: (document.getElementById("osg-booking-service") || {}).value || "",
              date: (document.getElementById("osg-booking-date") || {}).value || "",
              note: (document.getElementById("osg-booking-note") || {}).value || "",
              lat: (document.getElementById("osg-booking-lat") || {}).value || "",
              lng: (document.getElementById("osg-booking-lng") || {}).value || "",
              affiliate: (document.getElementById("osg-booking-affiliate") || {}).value || "",
              customerId: osgEnsureCustomerId(),
              leadId: osgNewLeadId(),
              osg_ch: "autoservice_booking",
              osg_partner: (document.getElementById("osg-booking-affiliate") || {}).value || "autoservice",
              landingHref: "internal:autoservice_booking",
              trackedHref: "",
              clickedAtISO: new Date().toISOString(),
              conversionBasis: true,
              leadIntent: "autoservice_booking",
            };
            if (!data.brand || !data.date) {
              if (fb) fb.textContent = (pack && pack.autoserviceBookValidation) || "";
              return;
            }

            function osgAutoserviceSubmit() {
              osgAppendLeadJournal(data);
              if (navigator.onLine) {
                osgApiFetch("/api/autoservice/book", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                }).then(function (r) {
                  if (r.ok) {
                    if (fb) fb.textContent = (pack && pack.autoserviceBookOk) || "✔";
                  } else {
                    if (fb) fb.textContent = (pack && pack.autoserviceBookError) || "✖";
                  }
                }).catch(function () {
                  if (fb) fb.textContent = (pack && pack.autoserviceBookOffline) || "";
                });
              } else {
                if (fb) fb.textContent = (pack && pack.autoserviceBookOffline) || "";
              }
            }

            /* A11y voice-confirm gate: only active for users who opted into
               accessibility mode. Regular users keep the fast path. */
            var useVoiceConfirm =
              window.osgA11y &&
              typeof window.osgA11y.isEnabled === "function" &&
              window.osgA11y.isEnabled() &&
              typeof window.osgVoiceConfirm === "function";
            if (useVoiceConfirm) {
              window
                .osgVoiceConfirm("autoservice", {
                  GARAGE: data.garage || "",
                  DATE: data.date || "",
                })
                .then(function (ok) {
                  if (ok) osgAutoserviceSubmit();
                });
            } else {
              osgAutoserviceSubmit();
            }
          }, false);
        }

        function osgLazadaThDeepUrl(query) {
          return (
            "https://www.lazada.co.th/catalog/?q=" +
            encodeURIComponent(String(query || "Thailand marketplace"))
          );
        }

        function osgShopeeThDeepUrl(query) {
          return (
            "https://shopee.co.th/search?keyword=" +
            encodeURIComponent(String(query || "Thailand"))
          );
        }

        function osgBigcThDeepUrl(query) {
          return (
            "https://www.bigc.co.th/search?q=" +
            encodeURIComponent(String(query || "Thailand"))
          );
        }

        var __osgClipScanWired = false;
        var __osgClipScanStream = null;
        var __osgClipScanLoopId = 0;

        function osgClipScanPack() {
          return (
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.en || T.de || {} : {})
          );
        }

        function osgClipScanSetStatus(msg) {
          var el = document.getElementById("osg-clip-scan-status");
          if (el) el.textContent = String(msg || "");
        }

        function osgClipScanStopCamera() {
          cancelAnimationFrame(__osgClipScanLoopId);
          __osgClipScanLoopId = 0;
          if (__osgClipScanStream) {
            try {
              __osgClipScanStream.getTracks().forEach(function (t) {
                t.stop();
              });
            } catch (_) {}
            __osgClipScanStream = null;
          }
          var modal = document.getElementById("osg-clip-scan-modal");
          var video = document.getElementById("osg-clip-scan-video");
          if (video) video.srcObject = null;
          if (modal) modal.hidden = true;
          document.body.classList.remove("osg-clip-scan-open");
        }

        function osgClipScanFormatThb(value) {
          var n = Number(value);
          if (!Number.isFinite(n) || n <= 0) return "";
          return (
            n.toLocaleString(undefined, {
              maximumFractionDigits: n < 100 ? 2 : 0,
            }) + " THB"
          );
        }

        function osgClipScanOfferHtml(offer, pack) {
          var title = osgEscHtml(offer.title || offer.retailerName || "");
          var price = osgClipScanFormatThb(offer.priceThb);
          var partnerId =
            {
              lazada: "lazada_th",
              shopee: "shopee_th",
              bigc: "bigc_th",
              lotus: "lotus_th",
            }[offer.retailer] ||
            offer.retailer ||
            "marketplace";
          var source = offer.live
            ? pack.clipScanPriceLive || "Live price"
            : pack.clipScanPriceSearch || "Search link";
          return (
            '<a class="checkout-app-link osg-affiliate-link osg-clip-scan__offer" href="' +
            osgEscHtml(offer.url || "#") +
            '" data-osg-partner="' +
            osgEscHtml(partnerId) +
            '" data-osg-channel="marketplace" data-osg-intent="clip_scan" target="_blank" rel="noopener noreferrer">' +
            '<span class="osg-clip-scan__offer-title">' +
            title +
            "</span>" +
            (price
              ? '<span class="osg-clip-scan__offer-price">' +
                osgEscHtml(price) +
                "</span>"
              : "") +
            '<span class="osg-clip-scan__offer-source">' +
            osgEscHtml(source) +
            "</span>" +
            "</a>"
          );
        }

        function osgClipScanRenderResults(query, pack, offers) {
          var host = document.getElementById("osg-clip-scan-results");
          if (!host) return;
          var q = String(query || "").trim();
          if (!q) {
            host.hidden = true;
            host.innerHTML = "";
            return;
          }
          host.hidden = false;
          var offerList = Array.isArray(offers) ? offers.filter(Boolean) : [];
          if (offerList.length) {
            host.innerHTML =
              '<p class="osg-clip-scan__query"><strong>' +
              osgEscHtml(q) +
              "</strong></p>" +
              '<div class="osg-clip-scan__offers">' +
              offerList
                .map(function (offer) {
                  return osgClipScanOfferHtml(offer, pack);
                })
                .join("") +
              "</div>";
            return;
          }
          var lz = osgLazadaThDeepUrl(q);
          var sh = osgShopeeThDeepUrl(q);
          var bc = osgBigcThDeepUrl(q);
          host.innerHTML =
            '<p class="osg-clip-scan__query"><strong>' +
            osgEscHtml(q) +
            "</strong></p>" +
            '<div class="osg-clip-scan__links">' +
            '<a class="checkout-app-link osg-affiliate-link" href="' +
            osgEscHtml(lz) +
            '" data-osg-partner="lazada_th" data-osg-channel="marketplace" data-osg-intent="clip_scan" target="_blank" rel="noopener noreferrer">' +
            osgEscHtml(pack.clipScanOpenLazada || "Lazada") +
            "</a>" +
            '<a class="checkout-app-link osg-affiliate-link" href="' +
            osgEscHtml(sh) +
            '" data-osg-partner="shopee_th" data-osg-channel="marketplace" data-osg-intent="clip_scan" target="_blank" rel="noopener noreferrer">' +
            osgEscHtml(pack.clipScanOpenShopee || "Shopee") +
            "</a>" +
            '<a class="checkout-app-link osg-affiliate-link" href="' +
            osgEscHtml(bc) +
            '" data-osg-partner="bigc_th" data-osg-channel="marketplace" data-osg-intent="clip_scan" target="_blank" rel="noopener noreferrer">' +
            osgEscHtml(pack.clipScanOpenBigC || "Big C") +
            "</a>" +
            "</div>";
        }

        async function osgClipScanFetchPrices(query, pack) {
          osgClipScanSetStatus(
            (pack.clipScanStatusSearching || "Searching prices for {QUERY} …")
              .replace(/\{QUERY\}/g, query)
          );
          try {
            var res = await osgApiFetch(
              "/api/prices/search?q=" + encodeURIComponent(query),
              { method: "GET" }
            );
            if (!res.ok) return null;
            var data = await res.json();
            return Array.isArray(data.offers) ? data.offers : null;
          } catch (_) {
            return null;
          }
        }

        async function osgClipScanRunQuery(query, source) {
          var pack = osgClipScanPack();
          var q = String(query || "").trim();
          if (!q) return;
          osgClipScanStopCamera();
          var found = (pack.clipScanStatusFound || "Found: {QUERY}").replace(
            /\{QUERY\}/g,
            q
          );
          osgClipScanSetStatus(found);
          osgClipScanRenderResults(q, pack);
          try {
            var cid = osgEnsureCustomerId();
            var lid = osgNewLeadId();
            osgAppendLeadJournal({
              leadId: lid,
              customerId: cid,
              osg_partner: "clip_scan",
              osg_ch: "clip_scan_" + (source || "barcode"),
              clickedAtISO: new Date().toISOString(),
              leadIntent: "clip_scan_" + (source || "barcode"),
              searchQuery: q.slice(0, 180),
              conversionBasis: false,
            });
          } catch (_) {}
          try {
            var panel = document.querySelector(".compare-panel");
            if (panel)
              panel.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (_) {}
          var offers = await osgClipScanFetchPrices(q, pack);
          if (offers && offers.length) {
            osgClipScanSetStatus(found);
            osgClipScanRenderResults(q, pack, offers);
          } else {
            osgClipScanSetStatus(
              pack.clipScanNoLivePrices ||
                "No live offers received — search links are ready."
            );
          }
        }

        async function osgClipScanLoadZxingReader() {
          if (window.__osgZxingReader) return window.__osgZxingReader;
          if (window.__osgZxingReaderFailed) return null;
          try {
            var mod = await import("https://esm.sh/zxing-wasm@2.2.1/reader");
            window.__osgZxingReader = mod;
            return mod;
          } catch (_) {
            window.__osgZxingReaderFailed = true;
            return null;
          }
        }

        async function osgClipScanDetectWithZxing(video) {
          var mod = await osgClipScanLoadZxingReader();
          if (!mod || typeof mod.readBarcodesFromImageData !== "function") {
            return "";
          }
          var canvas = document.createElement("canvas");
          var w = video.videoWidth || 640;
          var h = video.videoHeight || 480;
          var max = 960;
          var scale = Math.min(1, max / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          var ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return "";
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var out = await mod.readBarcodesFromImageData(img, {
            formats: [
              "EAN-13",
              "EAN-8",
              "UPC-A",
              "UPC-E",
              "Code128",
              "QRCode",
            ],
          });
          var first = out && out[0];
          return String((first && (first.text || first.rawValue)) || "").trim();
        }

        async function osgClipScanStartCamera() {
          var pack = osgClipScanPack();
          if (
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== "function"
          ) {
            osgClipScanSetStatus(
              pack.clipScanStatusUnsupported ||
                "Barcode scanner not supported in this browser."
            );
            return;
          }
          var modal = document.getElementById("osg-clip-scan-modal");
          var video = document.getElementById("osg-clip-scan-video");
          if (!modal || !video) return;
          osgClipScanSetStatus(
            pack.clipScanStatusScanning || "Scanning — hold barcode in frame …"
          );
          modal.hidden = false;
          document.body.classList.add("osg-clip-scan-open");
          try {
            __osgClipScanStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
            video.srcObject = __osgClipScanStream;
            await video.play();
          } catch (_) {
            osgClipScanStopCamera();
            osgClipScanSetStatus(
              pack.clipScanStatusError || "Camera access denied."
            );
            return;
          }
          var detector = null;
          if (typeof BarcodeDetector !== "undefined") {
            var formats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"];
            try {
              if (typeof BarcodeDetector.getSupportedFormats === "function") {
                var supported = await BarcodeDetector.getSupportedFormats();
                if (supported && supported.length) formats = supported;
              }
            } catch (_) {}
            try {
              detector = new BarcodeDetector({ formats: formats });
            } catch (_) {
              detector = null;
            }
          }
          var busyDetect = false;
          async function tick() {
            if (!__osgClipScanStream || modal.hidden) return;
            if (!busyDetect && video.readyState >= 2) {
              busyDetect = true;
              try {
                var raw = "";
                if (detector) {
                  var codes = await detector.detect(video);
                  if (codes && codes.length) {
                    raw = String(codes[0].rawValue || "").trim();
                  }
                } else {
                  raw = await osgClipScanDetectWithZxing(video);
                }
                if (raw) {
                  void osgClipScanRunQuery(raw, detector ? "barcode" : "zxing");
                  return;
                }
              } catch (_) {}
              busyDetect = false;
            }
            __osgClipScanLoopId = requestAnimationFrame(tick);
          }
          __osgClipScanLoopId = requestAnimationFrame(tick);
        }

        function osgClipScanFileToData(file) {
          return new Promise(function (resolve, reject) {
            var img = new Image();
            var url = URL.createObjectURL(file);
            img.onload = function () {
              try {
                var max = 1024;
                var scale = Math.min(1, max / Math.max(img.width, img.height));
                var canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                var ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("canvas");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                var dataUrl = canvas.toDataURL("image/jpeg", 0.78);
                var idx = dataUrl.indexOf(",");
                URL.revokeObjectURL(url);
                resolve({
                  b64: idx >= 0 ? dataUrl.slice(idx + 1) : "",
                  mime: "image/jpeg",
                });
              } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
              }
            };
            img.onerror = function () {
              URL.revokeObjectURL(url);
              reject(new Error("image_load"));
            };
            img.src = url;
          });
        }

        async function osgClipScanAnalyzePhoto(file) {
          var pack = osgClipScanPack();
          if (!file) return;
          osgClipScanSetStatus(
            pack.clipScanStatusAnalyzing || "Analyzing photo …"
          );
          try {
            var imgData = await osgClipScanFileToData(file);
            if (!imgData.b64) throw new Error("empty");
            var I = window.__OSG_I18N;
            var lang = I ? I.systemLangCode() : "en";
            var res = await osgApiFetch("/api/clip/identify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageBase64: imgData.b64,
                mime: imgData.mime || "image/jpeg",
                lang: lang,
              }),
            });
            if (res.status === 503) {
              osgClipScanSetStatus(
                pack.clipScanStatusUnavailable ||
                  "Photo recognition unavailable (server config)."
              );
              return;
            }
            if (!res.ok) throw new Error("identify_failed");
            var data = await res.json();
            var q = String(data.barcode || data.query || "").trim();
            if (!q) throw new Error("no_query");
            void osgClipScanRunQuery(q, "photo");
          } catch (_) {
            osgClipScanSetStatus(
              pack.clipScanStatusError || "Could not recognize product."
            );
          }
        }

        function osgClipScanHydrateLabels(pack) {
          if (!pack) return;
          var map = [
            ["osg-clip-scan-heading", pack.clipScanHeading],
            ["osg-clip-scan-lead", pack.clipScanLead],
            ["osg-clip-scan-barcode-btn", pack.clipScanBarcodeBtn],
            ["osg-clip-scan-photo-btn", pack.clipScanPhotoBtn],
            ["osg-clip-scan-modal-title", pack.clipScanModalTitle],
            ["osg-clip-scan-close-btn", pack.clipScanCloseBtn],
          ];
          for (var i = 0; i < map.length; i += 1) {
            var node = document.getElementById(map[i][0]);
            if (node && map[i][1]) node.textContent = map[i][1];
          }
          var sec = document.getElementById("osg-clip-scan");
          var modal = document.getElementById("osg-clip-scan-modal");
          if (modal && pack.clipScanModalAria)
            modal.setAttribute("aria-label", pack.clipScanModalAria);
          var bcBtn = document.getElementById("osg-clip-scan-barcode-btn");
          if (bcBtn && pack.clipScanBarcodeBtnAria)
            bcBtn.setAttribute("aria-label", pack.clipScanBarcodeBtnAria);
          var phBtn = document.getElementById("osg-clip-scan-photo-btn");
          if (phBtn && pack.clipScanPhotoBtnAria)
            phBtn.setAttribute("aria-label", pack.clipScanPhotoBtnAria);
          var closeBtn = document.getElementById("osg-clip-scan-close-btn");
          if (closeBtn && pack.clipScanCloseBtnAria)
            closeBtn.setAttribute("aria-label", pack.clipScanCloseBtnAria);
        }

        function osgClipScanInstallOnce() {
          if (__osgClipScanWired) return;
          __osgClipScanWired = true;
          var bcBtn = document.getElementById("osg-clip-scan-barcode-btn");
          var closeBtn = document.getElementById("osg-clip-scan-close-btn");
          var photoInput = document.getElementById("osg-clip-scan-photo-input");
          var photoBtn = document.getElementById("osg-clip-scan-photo-btn");
          if (bcBtn) {
            bcBtn.addEventListener("click", function () {
              void osgClipScanStartCamera();
            });
          }
          if (closeBtn) {
            closeBtn.addEventListener("click", function () {
              osgClipScanStopCamera();
              osgClipScanSetStatus("");
            });
          }
          if (photoBtn && photoInput) {
            photoBtn.addEventListener("click", function () {
              photoInput.click();
            });
            photoBtn.addEventListener("keydown", function (ev) {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                photoInput.click();
              }
            });
            photoInput.addEventListener("change", function () {
              var f = photoInput.files && photoInput.files[0];
              photoInput.value = "";
              if (f) void osgClipScanAnalyzePhoto(f);
            });
          }
          document.addEventListener("keydown", function (ev) {
            if (ev.key === "Escape") osgClipScanStopCamera();
          });
        }

        window.osgClipScanRunQuery = osgClipScanRunQuery;

        function osgCheckoutAvatarHintFlags(rows) {
          var anyCodLazSh = false;
          var prepaidCheapExists = false;
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (r.lazada.cod || r.shopee.cod) anyCodLazSh = true;
            var bestCod =
              r.lazada.thb <= r.shopee.thb ? r.lazada.cod : r.shopee.cod;
            if (!bestCod) prepaidCheapExists = true;
          }
          return { anyCodLazSh: anyCodLazSh, prepaidCheapExists: prepaidCheapExists };
        }

        function osgCellThb(amount) {
          return (
            amount +
            '&nbsp;<abbr title="Thai Baht">' +
            "THB" +
            "</abbr>"
          );
        }

        function osgFormatCheckoutPriceCell(baseThb) {
          var persona = window.OSG_PAULI_PERSONA;
          if (!persona || typeof persona.checkoutDisplayThb !== "function") {
            return osgCellThb(baseThb);
          }
          var d = persona.checkoutDisplayThb(baseThb);
          if (!d.inflated) {
            if (d.coupon > 0) {
              return (
                '<span class="osg-hero-revealed-wrap">' +
                osgCellThb(d.base) +
                ' <span class="osg-hero-coupon-badge">−' +
                d.coupon +
                "&nbsp;THB</span></span>"
              );
            }
            return osgCellThb(baseThb);
          }
          return (
            '<span class="osg-hero-buffer-wrap">' +
            osgCellThb(d.show) +
            "</span>"
          );
        }

        window.osgRefreshCheckoutHeroPrices = function () {
          var pack = window.__OSG_CURRENT_PACK_CACHE;
          if (pack) renderCompareCheckoutTable(pack);
        };

        function renderCompareCheckoutTable(pack) {
          var tb = document.getElementById("compare-tbody");
          if (!tb) return;
          if (
            window.OSG_PAULI_PERSONA &&
            typeof window.OSG_PAULI_PERSONA.primeHeroCheckoutBuffer ===
              "function"
          ) {
            window.OSG_PAULI_PERSONA.primeHeroCheckoutBuffer();
          }
          var labels = [pack.row0, pack.row1, pack.row2];
          var kws = pack.compareKw || [];
          var html = "";
          for (var i = 0; i < OSG_COMPARE_ROWS.length; i++) {
            var row = OSG_COMPARE_ROWS[i];
            var kw = kws[i] || kws[0] || "Thailand Lazada";
            var lzU = osgLazadaThDeepUrl(kw);
            var shU = osgShopeeThDeepUrl(kw);
            html +=
              "<tr>" +
              '<td id="row-p' +
              i +
              '">' +
              labels[i] +
              "</td>" +
              '<td class="money checkout-lazada">' +
              '<a class="checkout-app-link osg-affiliate-link"' +
              ' href="' +
              lzU +
              '" data-osg-partner="lazada_th" data-osg-channel="marketplace"' +
              ' data-osg-intent="purchase"' +
              ' target="_blank" rel="noopener noreferrer"' +
              ' aria-label="' +
              osgEscHtml(pack.linkAriaLazada) +
              '">' +
              osgFormatCheckoutPriceCell(row.lazada.thb) +
              (row.lazada.cod
                ? ' <span class="badge-cod" title="' +
                  osgEscHtml(pack.badgeCodTitle) +
                  '">' +
                  osgEscHtml(pack.badgeCodShort) +
                  "</span>"
                : "") +
              "</a>" +
              "</td>" +
              '<td class="money checkout-shopee">' +
              '<a class="checkout-app-link osg-affiliate-link"' +
              ' href="' +
              shU +
              '" data-osg-partner="shopee_th" data-osg-channel="marketplace"' +
              ' data-osg-intent="purchase"' +
              ' target="_blank" rel="noopener noreferrer"' +
              ' aria-label="' +
              osgEscHtml(pack.linkAriaShopee) +
              '">' +
              osgFormatCheckoutPriceCell(row.shopee.thb) +
              (row.shopee.cod
                ? ' <span class="badge-cod" title="' +
                  osgEscHtml(pack.badgeCodTitle) +
                  '">' +
                  osgEscHtml(pack.badgeCodShort) +
                  "</span>"
                : "") +
              "</a>" +
              "</td>" +
              '<td class="money checkout-seven">' +
              osgFormatCheckoutPriceCell(row.seven.thb) +
              "</td>" +
              "</tr>";
          }
          tb.innerHTML = html;
        }

        function refreshCheckoutAvatarHints(pack) {
          var el = document.getElementById("checkout-avatar-hint");
          if (!el) return;
          var f = osgCheckoutAvatarHintFlags(OSG_COMPARE_ROWS);
          var chunks = [];
          if (f.anyCodLazSh) {
            chunks.push(
              '<span class="hint-block hint-cod"><strong>' +
                osgEscHtml(pack.checkoutCodLabel) +
                "</strong><br />" +
                osgEscHtml(pack.avatarHintCodBody) +
                "</span>"
            );
          }
          if (f.prepaidCheapExists) {
            var body = pack.avatarHintBankBody || "";
            var segs = body.split("{BANKLINK}");
            var bankA =
              '<a href="' +
              OSG_BANK_INFO_URL +
              '" class="checkout-bank-link osg-affiliate-link"' +
              ' data-osg-partner="kasikorn" data-osg-channel="bank"' +
              ' data-osg-intent="consult"' +
              ' target="_blank" rel="noopener noreferrer">' +
              osgEscHtml(pack.bankPartnerName) +
              "</a>";
            chunks.push(
              '<span class="hint-block hint-bank">' +
                osgEscHtml(segs[0] || "") +
                bankA +
                osgEscHtml(segs[1] || "") +
                "</span>"
            );
          }
          chunks.push(
            '<span class="hint-disclaimer">' +
              osgEscHtml(pack.checkoutBankDisclaimer) +
              "</span>"
          );
          if (pack.checkoutPromptpayHint) {
            chunks.push(
              '<span class="hint-block hint-promptpay">' +
                osgEscHtml(pack.checkoutPromptpayHint) +
                "</span>"
            );
          }
          el.innerHTML = chunks.join("");
        }

        var T = window.OSG_LOCALES || {};
        var osgLocaleOverlayCache = {};

        function osgDeepMergeLocale(target, source) {
          if (!source || typeof source !== "object") return target;
          target = target || {};
          Object.keys(source).forEach(function (key) {
            var sv = source[key];
            var tv = target[key];
            if (
              sv &&
              typeof sv === "object" &&
              !Array.isArray(sv) &&
              tv &&
              typeof tv === "object" &&
              !Array.isArray(tv)
            ) {
              osgDeepMergeLocale(tv, sv);
            } else {
              target[key] = sv;
            }
          });
          return target;
        }

        function osgResolveBootLangRaw() {
          try {
            var stored = localStorage.getItem("osg-lang");
            if (stored) return stored;
          } catch (_) {}
          return (
            (navigator.languages && navigator.languages[0]) ||
            navigator.language ||
            "en"
          );
        }

        function osgLocaleHasJsonOverlay(lang) {
          return osgLocaleJsonLangs().indexOf(normalizeLang(lang)) >= 0;
        }

        function osgLoadLocaleOverlay(lang) {
          lang = normalizeLang(lang);
          if (!osgLocaleHasJsonOverlay(lang)) return Promise.resolve(false);
          if (osgLocaleOverlayCache[lang]) return Promise.resolve(true);
          osgEnsureLocalePack(lang);
          return fetch("assets/locales/" + lang + ".json", { cache: "no-store" })
            .then(function (r) {
              if (!r.ok) throw new Error("locale_overlay_missing");
              return r.json();
            })
            .then(function (json) {
              osgDeepMergeLocale(T[lang], json);
              osgLocaleOverlayCache[lang] = true;
              return true;
            })
            .catch(function () {
              return false;
            });
        }

        /** Stellt sicher, dass assets/locales/{lang}.json geladen ist (z. B. pl vor VIP-Scan). */
        function osgVipWithLocalePackReady(fn) {
          var lang = "en";
          try {
            if (window.__OSG_CURRENT_LANG__) {
              lang = normalizeLang(window.__OSG_CURRENT_LANG__);
            } else {
              lang = normalizeLang(osgResolveBootLangRaw());
            }
          } catch (_) {}
          var run = function () {
            if (typeof fn === "function") fn(lang);
          };
          if (osgLocaleHasJsonOverlay(lang)) {
            return osgLoadLocaleOverlay(lang).then(run);
          }
          run();
          return Promise.resolve();
        }

        function normalizeLang(code) {
          var wl = window.OSG_WORLD_LANG;
          if (wl && typeof wl.normalizeUiLang === "function") {
            return wl.normalizeUiLang(code);
          }
          var c = (code || "en").toLowerCase().split("-")[0];
          if (T[c]) return c;
          return "en";
        }

        function osgResolveSpeechTag(code) {
          var GUARD = window.OSG_I18N_LANG_GUARD;
          if (GUARD && typeof GUARD.resolveSpeechTag === "function") {
            return GUARD.resolveSpeechTag(code);
          }
          var wl = window.OSG_WORLD_LANG;
          if (wl && typeof wl.resolveSpeechTag === "function") {
            return wl.resolveSpeechTag(code);
          }
          return "en-US";
        }
        window.osgResolveSpeechTag = osgResolveSpeechTag;

        function osgAssignCoinImageSrc(img, primary, fallback) {
          if (!img) return;
          var triedFallback = false;
          img.onerror = function () {
            if (triedFallback || !fallback) return;
            triedFallback = true;
            img.onerror = null;
            img.setAttribute("src", fallback);
            if (typeof window.osgProcessCoinImage === "function") {
              window.osgProcessCoinImage(img);
            }
          };
          img.setAttribute("src", primary);
        }
        window.osgAssignCoinImageSrc = osgAssignCoinImageSrc;

        function osgKnockoutCoinPixels(img, mode) {
          if (!img || !img.naturalWidth) return false;
          try {
            var originalSrc = img.currentSrc || img.getAttribute("src") || "";
            var w = img.naturalWidth;
            var h = img.naturalHeight;
            var canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return false;
            ctx.drawImage(img, 0, 0, w, h);
            var data = ctx.getImageData(0, 0, w, h);
            var d = data.data;
            var cx = w * 0.5;
            var cy = h * 0.5;
            var radius = Math.min(w, h) * 0.5;
            var y;
            var x;
            for (y = 0; y < h; y++) {
              for (x = 0; x < w; x++) {
                var i = (y * w + x) * 4;
                var r = d[i];
                var g = d[i + 1];
                var b = d[i + 2];
                var dist = Math.hypot(x - cx, y - cy);
                if (dist > radius * 0.985) {
                  d[i + 3] = 0;
                  continue;
                }
                var sum = r + g + b;
                if (mode === "dark") {
                  if (r < 42 && g < 42 && b < 42) d[i + 3] = 0;
                  else if (sum < 96) d[i + 3] = Math.min(d[i + 3], Math.max(0, (sum - 70) * 4));
                } else if (mode === "light") {
                  if (r > 210 && g > 210 && b > 210) d[i + 3] = 0;
                  else if (r > 190 && g > 180 && b > 200 && r - g < 32)
                    d[i + 3] = 0;
                  else if (sum > 620)
                    d[i + 3] = Math.min(
                      d[i + 3],
                      Math.max(0, (740 - sum) * 5)
                    );
                }
              }
            }
            ctx.putImageData(data, 0, 0);
            img.src = canvas.toDataURL("image/png");
            img.setAttribute("data-knockout-applied", mode);
            img.setAttribute("data-knockout-src", originalSrc);
            if (typeof window.osgEnforceCoinShellTransparent === "function") {
              window.osgEnforceCoinShellTransparent();
            }
            return true;
          } catch (_) {
            return false;
          }
        }

        function osgProcessCoinImage(img, force) {
          if (!img) return;
          var src = img.getAttribute("src") || "";
          var stamped = img.getAttribute("data-knockout-src") || "";
          if (
            !force &&
            img.getAttribute("data-knockout-applied") &&
            (!src || src === stamped || src.indexOf("data:image") === 0)
          ) {
            return;
          }
          if (force || (stamped && src !== stamped && src.indexOf("data:image") !== 0)) {
            img.removeAttribute("data-knockout-applied");
            img.removeAttribute("data-knockout-src");
          }
          var mode = img.classList.contains("coin-visual-img--dark") ? "dark" : "light";
          var run = function () {
            osgKnockoutCoinPixels(img, mode);
          };
          if (img.complete && img.naturalWidth) run();
          else img.addEventListener("load", run, { once: true });
        }
        window.osgProcessCoinImage = osgProcessCoinImage;

        function osgEnforceCoinShellTransparent() {
          var coin = document.getElementById("coin-stage");
          if (coin) {
            coin.style.background = "transparent";
            coin.style.backgroundColor = "transparent";
            coin.style.backgroundImage = "none";
          }
          document.querySelectorAll(".coin-visual-shadow-host").forEach(function (host) {
            host.style.background = "transparent";
            host.style.backgroundColor = "transparent";
            host.style.backgroundImage = "none";
          });
          var mainImg = document.getElementById("pauli-main-avatar-img");
          if (mainImg) {
            mainImg.style.background = "transparent";
            mainImg.style.backgroundColor = "transparent";
            mainImg.style.backgroundImage = "none";
          }
        }
        window.osgEnforceCoinShellTransparent = osgEnforceCoinShellTransparent;
        osgEnforceCoinShellTransparent();
        osgProcessCoinImage(document.getElementById("pauli-main-avatar-img"));
        osgProcessCoinImage(document.getElementById("brand-avatar"));

        function applyBrandHeader(pack) {
          pack = pack || {};
          var l1 = document.getElementById("brand-app-title-line1");
          var l2 = document.getElementById("brand-app-title-line2");
          var chrome = document.getElementById("brand-company-chrome");
          var caption = document.getElementById("pauli-live-caption");
          if (l1) l1.textContent = pack.brandAppTitleLine1 || "Pauli Best Price";
          if (l2) l2.textContent = pack.brandAppTitleLine2 || "Thailand";
          if (chrome) {
            chrome.textContent =
              pack.brandCompanyChromeFullLine ||
              "produkt by   OMNI SOLUTIONS GLOBAL®  Co. Ltd.";
            chrome.hidden = false;
          }
          if (caption && pack.liveCaptionAria) {
            caption.setAttribute("aria-label", pack.liveCaptionAria);
          }
        }

        function pauliLiveCaptionShow(text) {
          var el = document.getElementById("pauli-live-caption");
          if (!el) return;
          var line = String(text || "").trim();
          if (!line) return;
          el.textContent = line;
          el.hidden = false;
          el.setAttribute("aria-hidden", "true");
          el.classList.add("is-visible");
        }

        function pauliLiveCaptionClear() {
          var el = document.getElementById("pauli-live-caption");
          if (!el) return;
          el.textContent = "";
          el.hidden = true;
          el.classList.remove("is-visible");
        }

        window.pauliLiveCaptionShow = pauliLiveCaptionShow;
        window.pauliLiveCaptionClear = pauliLiveCaptionClear;

        function applyLang(code) {
          var lang = normalizeLang(code);
          var pack = T[lang];
          window.__OSG_CURRENT_LANG__ = lang;
          osgEnsureProfileUserNameOnlyOnce();
          document.documentElement.lang =
            lang === "th"
              ? "th"
              : lang === "ru"
                ? "ru"
                : lang === "pl"
                  ? "pl"
                  : lang === "en"
                    ? "en"
                    : lang === "zh"
                      ? "zh-CN"
                      : "de";
          document.getElementById("i18n-lead").innerHTML = pack.lead;
          var trustH = document.getElementById("osg-trust-pledge-heading");
          if (trustH) trustH.textContent = pack.trustPledgeHeading || "";
          var trustA = document.getElementById("osg-trust-pledge-anonym");
          if (trustA) trustA.innerHTML = pack.trustPledgeAnonymHtml || "";
          var trustI = document.getElementById("osg-trust-pledge-independence");
          if (trustI) trustI.innerHTML = pack.trustPledgeIndependenceHtml || "";
          var trustAd = document.getElementById("osg-trust-pledge-ads");
          if (trustAd) trustAd.innerHTML = pack.trustPledgeAdsHtml || "";
          try {
            if (window.OSG_STARTUP_BOOT) {
              window.OSG_STARTUP_BOOT.recordTrustPledgeLaunchOncePerSession();
              window.OSG_STARTUP_BOOT.syncTrustPledgePanelVisibility();
            }
          } catch (_) {}
          applyBrandHeader(pack);
          document.getElementById("intro-heading").textContent = pack.introTitle;
          document.getElementById("i18n-intro").innerHTML = pack.intro;
          var b2bS = document.getElementById("osg-b2b-section");
          var b2bh = document.getElementById("b2b-heading");
          if (b2bh) b2bh.textContent = pack.b2bSectionHeading || "";
          var b2bl = document.getElementById("b2b-lead");
          if (b2bl) b2bl.textContent = pack.b2bSectionLead || "";
          var b2bb = document.getElementById("b2b-body");
          if (b2bb) b2bb.innerHTML = pack.b2bSectionHtml || "";
          document.getElementById("compare-heading").textContent = pack.compareTitle;
          document.getElementById("i18n-compare-sub").innerHTML =
            '<span class="checkout-deeplink-note">' +
            osgEscHtml(pack.checkoutDeepLinkExplain) +
            "</span> " +
            pack.compareSub;
          document.getElementById("th-product").textContent = pack.colProduct;
          document.getElementById("th-lazada").textContent = pack.colLazada;
          document.getElementById("th-shopee").textContent = pack.colShopee;
          document.getElementById("th-seven").textContent = pack.colSeven;
          renderCompareCheckoutTable(pack);
          refreshCheckoutAvatarHints(pack);
          document.getElementById("compare-caption").innerHTML = pack.tableCaption;
          document.getElementById("i18n-footer-legal").innerHTML = pack.footerLegal;
          var fBrand = document.getElementById("footer-brand-line");
          if (fBrand)
            fBrand.textContent =
              pack.footerBrandLine || "Omni Solutions Global® Co. Ltd.";
          var fCopy = document.getElementById("footer-copyright-line");
          if (fCopy)
            fCopy.textContent =
              pack.footerCopyrightLine ||
              "© 2026 Omni Solutions Global® Co. Ltd. Alle Rechte vorbehalten.";
          var fAi = document.getElementById("footer-ai-disclaimer-line");
          if (fAi) fAi.textContent = pack.footerAiDisclaimer || "";
          var lg = document.getElementById("legal-guidance-banner");
          if (lg) {
            lg.hidden = true;
            lg.setAttribute("aria-hidden", "true");
          }
          var lgs = document.getElementById("legal-guidance-line-strong");
          if (lgs) lgs.textContent = "";
          var lgd = document.getElementById("legal-guidance-line-disclaimer");
          if (lgd) lgd.innerHTML = "";
          var ah = document.getElementById("affiliate-heading");
          if (ah) ah.textContent = pack.affiliateHeading;
          var ai = document.getElementById("affiliate-intro");
          if (ai) ai.textContent = pack.affiliateIntro;
          var at = document.getElementById("affiliate-transparency");
          if (at)
            at.innerHTML =
              '<p class="affiliate-funding-note">' +
              osgEscHtml(pack.affiliateFundingDisclosure || "") +
              "</p><p>" +
              osgEscHtml(pack.affiliateTransparency || "") +
              "</p>";
          var pb = document.getElementById("partner-booking-btn");
          if (pb) {
            pb.textContent = pack.bookingBtnLabel;
            pb.setAttribute("aria-label", pack.bookingAriaLabel);
          }
          var pbf = document.getElementById("partner-booking-feedback");
          if (pbf) pbf.textContent = "";
          osgRenderAffiliateDeck(pack);
          osgHydrateCommissionRefHost(pack);
          window.__OSG_CURRENT_PACK_CACHE = pack;
          osgHydratePickupModeTexts(pack);
          osgHydrateDeliveryChoiceUi(pack);
          osgHydrateVoucherUiTexts(pack);
          osgWirePickupModeOnce();
          osgWireDeliveryChoiceOnce();
          osgWireLiveTrackingOnce();
          osgStartVoucherExpiryTickerOnce();
          osgWireShopVoucherPanelOnce();
          osgHydrateHighValueCopyUi(pack);
          osgRefreshLeadSummaryPre();
          osgHydratePersonalPanels(pack);
          osgHydrateFooterAgbBpr(pack);
          osgHydrateBenefitCertShell(pack);
          osgWirePersonalExperienceOnce();
          osgWireAgeGateOverlayOnce();
          osgWireLegalFooterOnce();
          osgHydrateSupportContactTexts(pack);
          osgWireSupportContactOnce();
          osgHydrateLegalDocShell(pack);
          osgHydrateAgeGateTexts(pack);
          osgWireArchitectureLayerOnce();
          osgRefreshArchitectSummaries();
          osgRefreshPremiumLockUi(pack);
          osgRefreshAvatarLockUi(pack);
          try {
            void osgSyncAvatarStatusFromServer();
          } catch (_) {}
          try {
            osgVipMaybeResumeGiftOverlay(pack);
          } catch (_) {}
          try {
            if (window.OSG_STARTUP_BOOT) {
              window.OSG_STARTUP_BOOT.hydrateTermsGate(pack);
              window.OSG_STARTUP_BOOT.hydrateLocationGate(pack);
              void window.OSG_STARTUP_BOOT.runFirstLaunchGates(pack, {
                onRequestGeo: function (p) {
                  osgTryActivateGeolocation(p || pack);
                },
              }).then(function () {
                if (window.OSG_STARTUP_BOOT) {
                  window.OSG_STARTUP_BOOT.recordTrustPledgeLaunchOncePerSession();
                  window.OSG_STARTUP_BOOT.syncTrustPledgePanelVisibility();
                }
                if (typeof osgScheduleAvatarCompanionBoot === "function") {
                  osgScheduleAvatarCompanionBoot(
                    window.OSG_STARTUP_BOOT.sessionGreetDone() ? 120 : 520
                  );
                }
              });
            } else if (typeof osgScheduleAvatarCompanionBoot === "function") {
              osgScheduleAvatarCompanionBoot(1100);
            }
          } catch (_) {}
          try {
            localStorage.setItem("osg-lang", lang);
          } catch (e) {}

          var viph = document.getElementById("vip-redeem-heading");
          if (viph) viph.textContent = pack.vipRedeemHeading || "";
          var vipl = document.getElementById("vip-redeem-lead");
          if (vipl) vipl.textContent = pack.vipRedeemLead || "";
          var vipt = document.getElementById("vip-code-label-text");
          if (vipt) vipt.textContent = pack.vipCodeLabel || "";
          var vipb = document.getElementById("vip-redeem-btn");
          if (vipb) {
            vipb.textContent = pack.vipRedeemBtn || "";
            if (pack.vipRedeemBtnAria)
              vipb.setAttribute("aria-label", pack.vipRedeemBtnAria);
          }
          var vipi = document.getElementById("vip-code-input");
          if (vipi) {
            if (pack.vipCodeInputAria)
              vipi.setAttribute("aria-label", pack.vipCodeInputAria);
            if (pack.vipRedeemSectionAria)
              vipi.setAttribute(
                "aria-describedby",
                "vip-redeem-lead"
              );
          }
          var vipw = document.getElementById("vip-redeem-wrap");
          osgWireVipRedeemOnce();
          osgClipScanHydrateLabels(pack);
          osgClipScanInstallOnce();
          osgRefreshArchitectSummaries();
          if (typeof osgHydrateDealsAll === "function") osgHydrateDealsAll(pack);
          if (typeof osgHydrateAutoservice === "function") osgHydrateAutoservice(pack);
          if (typeof osgA11yHydrateLabels === "function") osgA11yHydrateLabels(pack);

          var brandImg = document.getElementById("brand-avatar");
          if (brandImg) {
            brandImg.setAttribute("alt", pack.brandStandAvatarAlt || pack.brandAvatarAlt);
            if (typeof osgAssignCoinImageSrc === "function") {
              osgAssignCoinImageSrc(brandImg, "/hinterseite.png");
            } else {
              brandImg.setAttribute("src", "/hinterseite.png");
            }
          }
          var thaiLabel = document.getElementById("pauli-avatar-thai-label");
          if (thaiLabel) {
            thaiLabel.textContent = pack.avatarThaiReliefLabel || "";
            thaiLabel.hidden = !pack.avatarThaiReliefLabel;
          }
          var mainAvatarImg = document.getElementById("pauli-main-avatar-img");
          if (mainAvatarImg) {
            mainAvatarImg.setAttribute("alt", pack.brandAvatarAlt);
            var coinSrc = mainAvatarImg.getAttribute("src") || "";
            var knocked = mainAvatarImg.getAttribute("data-knockout-applied");
            if (!(knocked && coinSrc.indexOf("data:image") === 0)) {
              mainAvatarImg.removeAttribute("data-knockout-applied");
              mainAvatarImg.removeAttribute("data-knockout-src");
              if (coinSrc.indexOf("data:image") !== 0) {
                mainAvatarImg.setAttribute("src", "/Frontseite02.png");
              }
              if (typeof window.osgProcessCoinImage === "function") {
                window.osgProcessCoinImage(mainAvatarImg, true);
              }
            }
          }
          if (typeof window.osgEnforceCoinShellTransparent === "function") {
            window.osgEnforceCoinShellTransparent();
          }
          var coinEl = document.getElementById("coin-stage");
          if (coinEl) coinEl.setAttribute("aria-label", pack.coinAriaLabel);
          var a11yHint = document.getElementById("pauli-a11y-access-hint");
          if (a11yHint && pack.pauliA11yAccessHint) {
            a11yHint.textContent = pack.pauliA11yAccessHint;
          }
          var wakeBtn = document.getElementById("pauli-voice-wake-btn");
          if (wakeBtn) {
            wakeBtn.textContent = pack.pauliWakeMicBtn || "Hallo / Hey Pauli";
            wakeBtn.setAttribute(
              "aria-label",
              pack.pauliWakeMicAria ||
                "Tap to talk without speaking, or say Hello Pauli"
            );
          }
        }

        function osgBootAppLang() {
          var bootLang = normalizeLang(osgResolveBootLangRaw());
          osgStripObsoleteMarketQrHashOnce();
          var overlayPromise = osgLocaleHasJsonOverlay(bootLang)
            ? osgLoadLocaleOverlay(bootLang)
            : Promise.resolve(false);
          overlayPromise.then(function () {
            applyLang(bootLang);
            osgConsumeSevenVoucherQrOnce();
            try {
              void osgSyncAvatarStatusFromServer();
            } catch (_) {}
            if (!window.OSG_STARTUP_BOOT) {
              osgScheduleAvatarCompanionBoot(1100);
            }
          });
        }
        osgBootAppLang();
        /* Avatar Tour: Boot erfolgt nach Avatar-Init via osgAvatarTourBoot() */

        /** ADMIN-Dashboard: Dreifach-Tipp auf „Omni Solutions Global®“ öffnen.
            Produktion: window.__OSG_ADMIN_SECRET__ per osg-admin-secret.prod.js setzen
            (siehe deploy-omni-solutions/osg-admin-secret.example.js, nie committen).
            Demo-Passwort nur auf localhost — nie auf Live-Domain. */
        function osgAdminResolveSecret() {
          if (
            typeof window.__OSG_ADMIN_SECRET__ !== "undefined" &&
            String(window.__OSG_ADMIN_SECRET__ || "").trim()
          ) {
            return String(window.__OSG_ADMIN_SECRET__).trim();
          }
          try {
            var host = String(location.hostname || "").toLowerCase();
            if (
              host === "localhost" ||
              host === "127.0.0.1" ||
              host.endsWith(".local")
            ) {
              return "OPERATOR_bestprice_demo_2026";
            }
          } catch (_) {}
          return "";
        }

        function osgAdminIsEnabled() {
          return !!osgAdminResolveSecret();
        }
        var OSG_ADMIN_LS_COMMISSION = "osg-admin-commission-v1";
        var OSG_ADMIN_SESSION_UNTIL = "osg-admin-until";

        function osgAdminCommissionDefaults() {
          return {
            mofaPct: 4,
            mofaAvgOrderThb: 62500,
            creditFixThb: 1000,
            insuranceFixThb: 400,
            shopFixThb: 50,
          };
        }

        function osgAdminLoadCommissionCfg() {
          var d = osgAdminCommissionDefaults();
          try {
            var raw = localStorage.getItem(OSG_ADMIN_LS_COMMISSION);
            if (!raw) return d;
            var o = JSON.parse(raw);
            if (!o || typeof o !== "object") return d;
            if (typeof o.mofaPct === "number") d.mofaPct = o.mofaPct;
            if (typeof o.mofaAvgOrderThb === "number")
              d.mofaAvgOrderThb = o.mofaAvgOrderThb;
            if (typeof o.creditFixThb === "number")
              d.creditFixThb = o.creditFixThb;
            if (typeof o.insuranceFixThb === "number")
              d.insuranceFixThb = o.insuranceFixThb;
            if (typeof o.shopFixThb === "number") d.shopFixThb = o.shopFixThb;
          } catch (_) {}
          return d;
        }

        function osgAdminSaveCommissionCfg(cfg) {
          try {
            localStorage.setItem(OSG_ADMIN_LS_COMMISSION, JSON.stringify(cfg));
          } catch (_) {}
        }

        function osgAdminBizCategory(row) {
          var p = String(row.osg_partner || "").toLowerCase();
          var ch = String(row.osg_ch || "").toLowerCase();
          if (ch === "marketplace") return "shop";
          if (p.indexOf("lazada") >= 0 || p.indexOf("shopee") >= 0)
            return "shop";
          if (
            ch === "bank" ||
            p.indexOf("kasikorn") >= 0 ||
            p.indexOf("kbank") >= 0 ||
            p === "kasikorn"
          )
            return "credit";
          if (p.indexOf("roojai") >= 0) return "insurance";
          if (
            ch === "dealer" ||
            ch === "dealer_notice" ||
            ch === "form_trigger" ||
            p.indexOf("honda") >= 0 ||
            p.indexOf("yamaha") >= 0 ||
            p.indexOf("mofa") >= 0 ||
            p.indexOf("booking") >= 0 ||
            p.indexOf("high_value") >= 0
          )
            return "mofa";
          return "other";
        }

        function osgAdminCategoryLabel(cat) {
          if (cat === "mofa") return "Mofas / Händler / Buchungen";
          if (cat === "credit") return "Kreditkarten / Bank";
          if (cat === "insurance") return "Versicherungen";
          if (cat === "shop") return "Shop-Weiterleitungen";
          return "Sonstiges";
        }

        function osgAdminExpectedThbForCategory(cat, clicks, cfg) {
          if (!clicks || clicks < 0) return 0;
          if (cat === "mofa") {
            var avg = Number(cfg.mofaAvgOrderThb) || 0;
            var pct = Number(cfg.mofaPct) || 0;
            return clicks * avg * (pct / 100);
          }
          if (cat === "credit")
            return clicks * (Number(cfg.creditFixThb) || 0);
          if (cat === "insurance")
            return clicks * (Number(cfg.insuranceFixThb) || 0);
          if (cat === "shop")
            return clicks * (Number(cfg.shopFixThb) || 0);
          return 0;
        }

        function osgAdminFormatMoneyThb(v) {
          var n = Math.round(Number(v) * 100) / 100;
          return (
            String(n.toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            " THB"
          );
        }

        function osgAdminIsSessionUnlocked() {
          try {
            var u = Number(sessionStorage.getItem(OSG_ADMIN_SESSION_UNTIL));
            return !!(u && u > Date.now());
          } catch (_) {
            return false;
          }
        }

        function osgAdminUnlockSession() {
          var expected = osgAdminResolveSecret();
          if (!expected) {
            alert(
              "Betreiber-Zugang ist in Produktion gesperrt. Lege osg-admin-secret.prod.js mit window.__OSG_ADMIN_SECRET__ an (siehe GO-LIVE-CHECKLIST.md)."
            );
            return false;
          }
          var sec = prompt(
            "Betreiber-Passwort (lokale Verwaltungsansicht auf diesem Gerät):"
          );
          if (sec == null) return false;
          if (String(sec).trim() !== expected) {
            alert("Zugriff verweigert.");
            return false;
          }
          try {
            sessionStorage.setItem(
              OSG_ADMIN_SESSION_UNTIL,
              String(Date.now() + 480 * 60 * 1000)
            );
          } catch (_) {}
          return true;
        }

        function osgAdminLockSession() {
          try {
            sessionStorage.removeItem(OSG_ADMIN_SESSION_UNTIL);
          } catch (_) {}
        }

        /** @type {Element|null} */
        var osgAdminReturnFocusEl = null;

        function osgAdminCollectFocusables(container) {
          if (!container || !container.querySelectorAll) return [];
          var sel =
            'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"])';
          var nodes = container.querySelectorAll(sel);
          var out = [];
          for (var i = 0; i < nodes.length; i++) out.push(nodes[i]);
          return out;
        }

        function osgAdminOverlayKeyboardNav(ev) {
          var ov = document.getElementById("admin-dash-overlay");
          if (!ov || ov.classList.contains("is-hidden")) return;
          if (ev.key === "Escape") {
            ev.preventDefault();
            osgAdminSetOverlay(false);
            return;
          }
          if (ev.key !== "Tab") return;

          var list = osgAdminCollectFocusables(ov);
          if (!list.length) return;

          var active = document.activeElement;

          function focusFirst() {
            ev.preventDefault();
            list[0].focus({ preventScroll: true });
          }
          function focusLast() {
            ev.preventDefault();
            list[list.length - 1].focus({ preventScroll: true });
          }

          if (list.length === 1) {
            ev.preventDefault();
            try {
              list[0].focus({ preventScroll: true });
            } catch (_) {
              list[0].focus();
            }
            return;
          }

          if (!ov.contains(active)) {
            focusFirst();
            return;
          }

          var first = list[0];
          var last = list[list.length - 1];

          if (ev.shiftKey) {
            if (active === first) focusLast();
          } else {
            if (active === last) focusFirst();
          }
        }

        function osgAdminSetOverlay(open) {
          var ov = document.getElementById("admin-dash-overlay");
          if (!ov) return;
          if (open) {
            osgAdminReturnFocusEl = document.activeElement;
            ov.classList.remove("is-hidden");
            osgAdminRenderDashboard();
            var fb = document.getElementById("admin-dash-close");
            if (fb)
              try {
                fb.focus({ preventScroll: true });
              } catch (_) {
                fb.focus();
              }
          } else {
            ov.classList.add("is-hidden");
            var back = osgAdminReturnFocusEl;
            osgAdminReturnFocusEl = null;
            if (back && typeof back.focus === "function") {
              try {
                back.focus({ preventScroll: true });
              } catch (_) {
                try {
                  back.focus();
                } catch (_) {}
              }
            }
          }
        }

        function osgAdminTryOpenDashboard() {
          if (!osgAdminIsEnabled()) return;
          if (!osgAdminIsSessionUnlocked()) {
            if (!osgAdminUnlockSession()) return;
          }
          osgAdminSetOverlay(true);
        }

        function osgAdminReadInputsToCfg() {
          var cfg = osgAdminLoadCommissionCfg();
          var mp = document.getElementById("admin-cfg-mofa-pct");
          var ma = document.getElementById("admin-cfg-mofa-avg");
          var cr = document.getElementById("admin-cfg-credit-thb");
          var ins = document.getElementById("admin-cfg-ins-thb");
          var sh = document.getElementById("admin-cfg-shop-thb");
          if (mp && mp.value !== "") cfg.mofaPct = Number(mp.value);
          if (ma && ma.value !== "") cfg.mofaAvgOrderThb = Number(ma.value);
          if (cr && cr.value !== "") cfg.creditFixThb = Number(cr.value);
          if (ins && ins.value !== "") cfg.insuranceFixThb = Number(ins.value);
          if (sh && sh.value !== "") cfg.shopFixThb = Number(sh.value);
          return cfg;
        }

        function osgAdminPushInputsFromCfg(cfg) {
          var mp = document.getElementById("admin-cfg-mofa-pct");
          var ma = document.getElementById("admin-cfg-mofa-avg");
          var cr = document.getElementById("admin-cfg-credit-thb");
          var ins = document.getElementById("admin-cfg-ins-thb");
          var sh = document.getElementById("admin-cfg-shop-thb");
          if (mp) mp.value = String(cfg.mofaPct);
          if (ma) ma.value = String(cfg.mofaAvgOrderThb);
          if (cr) cr.value = String(cfg.creditFixThb);
          if (ins) ins.value = String(cfg.insuranceFixThb);
          if (sh) sh.value = String(cfg.shopFixThb);
        }

        /**
         * @param {{mode:string,fromStr:string,toStr:string}} choice
         * @param {{err?:string}} applied
         * @param {number} shownCount
         * @param {number} storedCount
         */
        function osgAdminBuildRangeCaption(choice, applied, shownCount, storedCount) {
          if (applied && applied.err) {
            return (
              "Zeitraum unvollständig oder ungültig — angezeigt werden alle gespeicherten Leads (" +
              storedCount +
              "), bis Datum „Von“ und „Bis“ gesetzt sind."
            );
          }
          var m = choice && choice.mode ? choice.mode : "all";
          if (m === "all") {
            return (
              "Aktuelle Auswahl: alle gespeicherten Leads (" +
              shownCount +
              " Zeilen)."
            );
          }
          if (m === "custom") {
            return (
              "Aktuelle Auswahl: zwischen " +
              (choice.fromStr || "—") +
              " und " +
              (choice.toStr || "—") +
              " (inklusive) — " +
              shownCount +
              " von insgesamt " +
              storedCount +
              " gespeicherten Zeilen mit gültiger Zeit."
            );
          }
          var preset =
            m === "today"
              ? "heute (lokal ab Mitternacht)"
              : m === "7d"
                ? "letzte 7 Tage"
                : m === "30d"
                  ? "letzte 30 Tage"
                  : "gewählter Zeitraum";
          return (
            "Aktuelle Auswahl: " +
            preset +
            " — " +
            shownCount +
            " von " +
            storedCount +
            " gespeicherten Zeilen mit gültiger Zeit."
          );
        }

        function osgAdminMaybeRefreshDashboardOnRangeChange() {
          osgAdminSyncExportCustomVisibility();
          var ov = document.getElementById("admin-dash-overlay");
          if (!ov || ov.classList.contains("is-hidden")) return;
          osgAdminRenderDashboard();
        }

        function osgAdminRenderDashboard() {
          var cfg = osgAdminLoadCommissionCfg();
          osgAdminPushInputsFromCfg(cfg);
          var allStored = osgLoadJournal();
          var choice = osgAdminGetExportRangeChoice();
          var applied = osgAdminApplyExportFilter(
            allStored,
            choice.mode,
            choice.fromStr,
            choice.toStr
          );
          var viewRows = applied.err
            ? allStored.slice()
            : applied.rows.slice();
          var rangeEl = document.getElementById("admin-dash-range-note");
          if (rangeEl)
            rangeEl.textContent = osgAdminBuildRangeCaption(
              choice,
              applied,
              viewRows.length,
              allStored.length
            );
          var counts = {
            mofa: 0,
            credit: 0,
            insurance: 0,
            shop: 0,
            other: 0,
          };
          for (var i = 0; i < viewRows.length; i++) {
            var cKey = osgAdminBizCategory(viewRows[i]);
            if (typeof counts[cKey] === "number") counts[cKey]++;
            else counts.other++;
          }
          var tbody = document.getElementById("admin-dash-stats-body");
          var total = 0;
          var order = ["mofa", "credit", "insurance", "shop", "other"];
          if (tbody) {
            tbody.innerHTML = "";
            var rowsHtml = "";
            for (var j = 0; j < order.length; j++) {
              var k = order[j];
              var clicks = counts[k];
              var ex = osgAdminExpectedThbForCategory(k, clicks, cfg);
              total += ex;
              rowsHtml +=
                "<tr><td>" +
                osgEscHtml(osgAdminCategoryLabel(k)) +
                "</td><td>" +
                clicks +
                "</td><td>" +
                osgEscHtml(osgAdminFormatMoneyThb(ex)) +
                "</td></tr>";
            }
            tbody.innerHTML = rowsHtml;
          }
          var totEl = document.getElementById("admin-dash-total-thb");
          if (totEl)
            totEl.innerHTML =
              "<strong>" +
              osgEscHtml(osgAdminFormatMoneyThb(total)) +
              "</strong>";
          var sevenAct = 0;
          var sevenScan = 0;
          for (var sx = 0; sx < viewRows.length; sx++) {
            var chv = String(
              viewRows[sx].osg_ch != null ? viewRows[sx].osg_ch : ""
            );
            if (chv === "seven_voucher_activate") sevenAct++;
            if (chv === "seven_voucher_qr_scan") sevenScan++;
          }
          var sm = document.getElementById("admin-seven-metrics");
          if (sm) {
            sm.textContent =
              "7‑Eleven Pauli‑001 (Zeitfilter gleich wie oben): " +
              sevenAct +
              " Voucher-/Aktivierungs-Ereignisse (seven_voucher_activate), " +
              sevenScan +
              " QR-/Handshake-Scans (seven_voucher_qr_scan).";
          }
          var ht = document.getElementById("admin-dash-history-body");
          if (ht) {
            ht.innerHTML = "";
            var max = 150;
            var start = Math.max(0, viewRows.length - max);
            var hRows = "";
            for (var hi = viewRows.length - 1; hi >= start; hi--) {
              var r = viewRows[hi];
              var cat = osgAdminBizCategory(r);
              hRows +=
                "<tr>" +
                "<td>" +
                osgEscHtml(String(r.clickedAtISO || "")) +
                "</td>" +
                "<td>" +
                osgEscHtml(osgAdminCategoryLabel(cat)) +
                "</td>" +
                "<td>" +
                osgEscHtml(String(r.osg_partner || "")) +
                "</td>" +
                "<td>" +
                osgEscHtml(String(r.osg_ch || "")) +
                "</td>" +
                "<td>" +
                osgEscHtml(String(r.leadIntent || "")) +
                "</td>" +
                "<td>" +
                osgEscHtml(String(r.voucherCode || "")) +
                "</td>" +
                "<td>" +
                osgEscHtml(
                  r.qrScan
                    ? "QR‑Scan"
                    : r.voucherActivated
                      ? "Aktiv"
                      : ""
                ) +
                "</td>" +
                "<td>" +
                osgEscHtml(String(r.leadId || "")) +
                "</td>" +
                "</tr>";
            }
            ht.innerHTML = hRows;
          }
          osgAdminSyncExportCustomVisibility();
        }

        function osgAdminLocalMidnight(ms) {
          var d = new Date(ms);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }

        function osgAdminParseDateInputBoundary(ymd, endOfDay) {
          if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(String(ymd))) return NaN;
          var p = String(ymd).split("-").map(Number);
          var y = p[0];
          var mo = p[1];
          var day = p[2];
          if (endOfDay)
            return new Date(y, mo - 1, day, 23, 59, 59, 999).getTime();
          return new Date(y, mo - 1, day, 0, 0, 0, 0).getTime();
        }

        function osgAdminLeadTs(r) {
          var x = Date.parse(String(r && r.clickedAtISO ? r.clickedAtISO : ""));
          return isNaN(x) ? NaN : x;
        }

        function osgAdminApplyExportFilter(allRows, mode, fromStr, toStr) {
          var meta = {
            rows: [],
            slug: String(mode || "all"),
            err: "",
          };
          var src = Array.isArray(allRows) ? allRows : [];

          if (mode === "all") {
            meta.rows = src.slice();
            meta.slug = "all";
            return meta;
          }

          var nowMs = Date.now();
          var startMs;
          var endMs = nowMs;

          switch (mode) {
            case "today":
              startMs = osgAdminLocalMidnight(nowMs);
              break;
            case "7d":
              startMs = nowMs - 7 * 86400000;
              break;
            case "30d":
              startMs = nowMs - 30 * 86400000;
              break;
            case "custom":
              fromStr = String(fromStr || "");
              toStr = String(toStr || "");
              if (!fromStr.trim() || !toStr.trim()) {
                meta.err =
                  "Bitte „Von“ und „Bis“ setzen oder einen anderen Zeitraum wählen.";
                meta.slug = "custom";
                return meta;
              }
              var lo = osgAdminParseDateInputBoundary(fromStr, false);
              var hi = osgAdminParseDateInputBoundary(toStr, true);
              if (isNaN(lo) || isNaN(hi)) {
                meta.err = "Ungültige Datumsangabe.";
                meta.slug = "custom";
                return meta;
              }
              if (lo > hi) {
                var swap = lo;
                lo = hi;
                hi = swap;
              }
              startMs = lo;
              endMs = hi;
              break;
            default:
              meta.rows = src.slice();
              meta.slug = "all";
              return meta;
          }

          var out = [];
          for (var j = 0; j < src.length; j++) {
            var row = src[j];
            var ts = osgAdminLeadTs(row);
            if (isNaN(ts)) continue;
            if (ts >= startMs && ts <= endMs) out.push(row);
          }
          meta.rows = out;
          return meta;
        }

        function osgAdminGetExportRangeChoice() {
          var r = document.querySelector(
            'input[name="admin-export-range"]:checked'
          );
          var mode = r && r.value ? r.value : "all";
          var fromEl = document.getElementById("admin-export-from");
          var toEl = document.getElementById("admin-export-to");
          return {
            mode: mode,
            fromStr: fromEl && fromEl.value ? fromEl.value : "",
            toStr: toEl && toEl.value ? toEl.value : "",
          };
        }

        function osgAdminSyncExportCustomVisibility() {
          var wrap = document.getElementById("admin-export-custom-wrap");
          if (!wrap) return;
          var r = document.querySelector(
            'input[name="admin-export-range"]:checked'
          );
          var showCustom = !!(r && r.value === "custom");
          if (showCustom) wrap.removeAttribute("hidden");
          else wrap.setAttribute("hidden", "");
        }

        function osgAdminEscapeCsv(cell) {
          var s = String(cell == null ? "" : cell);
          if (/[",\r\n]/.test(s))
            return '"' + s.replace(/"/g, '""') + '"';
          return s;
        }

        function osgAdminExportCsv() {
          var choice = osgAdminGetExportRangeChoice();
          var allRows = osgLoadJournal();
          var applied = osgAdminApplyExportFilter(
            allRows,
            choice.mode,
            choice.fromStr,
            choice.toStr
          );
          if (applied.err) {
            alert(applied.err);
            return;
          }
          var rows = applied.rows;
          if (!rows.length) {
            if (
              !confirm(
                "Im gewählten Zeitraum sind keine Lead-Zeilen. Trotzdem eine leere CSV (nur Kopfzeile) laden?"
              )
            )
              return;
          }
          var headers = [
            "clickedAtISO",
            "leadId",
            "customerId",
            "bizCategory",
            "osg_partner",
            "osg_ch",
            "leadIntent",
            "pickupFulfillment",
            "voucherCode",
            "voucherThb",
            "qrScan",
            "voucherActivated",
            "marketplaceSubId",
            "landingHref",
            "trackedHref",
            "conversionBasis",
            "vehicleHint",
            "dealerNote",
          ];
          var lines = [headers.join(",")];
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var cat = osgAdminBizCategory(r);
            lines.push(
              [
                osgAdminEscapeCsv(r.clickedAtISO),
                osgAdminEscapeCsv(r.leadId),
                osgAdminEscapeCsv(r.customerId),
                osgAdminEscapeCsv(cat),
                osgAdminEscapeCsv(r.osg_partner),
                osgAdminEscapeCsv(r.osg_ch),
                osgAdminEscapeCsv(r.leadIntent),
                osgAdminEscapeCsv(r.pickupFulfillment),
                osgAdminEscapeCsv(r.voucherCode),
                osgAdminEscapeCsv(r.voucherThb),
                osgAdminEscapeCsv(r.qrScan),
                osgAdminEscapeCsv(r.voucherActivated),
                osgAdminEscapeCsv(r.marketplaceSubId),
                osgAdminEscapeCsv(r.landingHref),
                osgAdminEscapeCsv(r.trackedHref),
                osgAdminEscapeCsv(r.conversionBasis),
                osgAdminEscapeCsv(r.vehicleHint),
                osgAdminEscapeCsv(r.dealerNote),
              ].join(",")
            );
          }
          var blob = new Blob(["\uFEFF" + lines.join("\n")], {
            type: "text/csv;charset=utf-8",
          });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          var stamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:T]/g, "-");
          var slugSafe = /^[a-z0-9-]+$/i.test(applied.slug)
            ? applied.slug
            : "range";
          a.download =
            "pauli-bestprice-leads-" +
            stamp +
            "-" +
            slugSafe +
            "-" +
            rows.length +
            "rows.csv";
          a.click();
          URL.revokeObjectURL(a.href);
        }

        function osgWireAdminActivator() {
          var el = document.getElementById("brand-company-chrome");
          if (!el || el.dataset.osgAdminTap) return;
          el.dataset.osgAdminTap = "1";
          var count = 0;
          var t = null;
          el.addEventListener(
            "click",
            function () {
              count++;
              clearTimeout(t);
              t = setTimeout(function () {
                count = 0;
              }, 1000);
              if (count >= 3) {
                count = 0;
                osgAdminTryOpenDashboard();
              }
            },
            false
          );
        }

        function osgAdminDashboardWireOnce() {
          if (window.__OSG_ADMIN_DASH_WIRED__) return;
          window.__OSG_ADMIN_DASH_WIRED__ = true;
          var c = document.getElementById("admin-dash-close");
          if (c)
            c.addEventListener("click", function () {
              osgAdminSetOverlay(false);
            });
          var lo = document.getElementById("admin-dash-logout");
          if (lo)
            lo.addEventListener("click", function () {
              osgAdminLockSession();
              osgAdminSetOverlay(false);
              alert(
                "Sitzung beendet. Bitte erneut dreimal auf die Firmenzeile „Omni Solutions Global®“ tippen und Passwort eingeben."
              );
            });
          var re = document.getElementById("admin-dash-refresh");
          if (re)
            re.addEventListener("click", function () {
              osgAdminRenderDashboard();
            });
          var sv = document.getElementById("admin-cfg-save");
          if (sv)
            sv.addEventListener("click", function () {
              var cfg = osgAdminReadInputsToCfg();
              osgAdminSaveCommissionCfg(cfg);
              osgAdminRenderDashboard();
            });
          var ex = document.getElementById("admin-dash-export");
          if (ex)
            ex.addEventListener("click", function () {
              if (!osgAdminIsSessionUnlocked()) {
                if (!osgAdminUnlockSession()) return;
              }
              osgAdminExportCsv();
            });
          document.addEventListener("keydown", osgAdminOverlayKeyboardNav, true);

          // ── Pauli-ID Ranking Load Button ───────────────────────────────
          var rankLoadBtn = document.getElementById("admin-pauli-id-rank-load");
          if (rankLoadBtn) {
            rankLoadBtn.addEventListener("click", async function () {
              var vipCode = "";
              try { vipCode = localStorage.getItem("osg-vip-code-v1") || ""; } catch (_) {}
              if (!vipCode) {
                vipCode = prompt("VIP-Code für Ranking-Zugriff:") || "";
              }
              if (!vipCode) return;
              rankLoadBtn.disabled = true;
              rankLoadBtn.textContent = "Lade…";
              try {
                var res = await osgApiFetch("/api/pauli-id/ranking?code=" + encodeURIComponent(vipCode));
                if (!res.ok) {
                  rankLoadBtn.textContent = "Fehler – Code prüfen";
                  rankLoadBtn.disabled = false;
                  return;
                }
                var data = await res.json();
                rankLoadBtn.textContent = "Aktualisieren";
                rankLoadBtn.disabled = false;
                // Totals
                var totalEl = document.getElementById("admin-pauli-id-total-installs");
                var counterEl = document.getElementById("admin-pauli-id-counter");
                if (totalEl) totalEl.textContent = String(data.totalInstalls || 0);
                if (counterEl) counterEl.textContent = String(data.currentCounter || 0);
                // Referrer ranking (A)
                var refBody = document.getElementById("admin-pauli-id-rank-referrers");
                if (refBody) {
                  refBody.innerHTML = "";
                  (data.topReferrers || []).forEach(function (row, i) {
                    var tr = document.createElement("tr");
                    tr.innerHTML = "<td>" + (i + 1) + "</td><td><strong>" + row.pauliId + "</strong></td><td>" + row.referredCount + "</td>";
                    refBody.appendChild(tr);
                  });
                  if (!(data.topReferrers || []).length) {
                    refBody.innerHTML = "<tr><td colspan='3'>Noch keine Daten</td></tr>";
                  }
                }
                // Revenue ranking (B)
                var revBody = document.getElementById("admin-pauli-id-rank-revenue");
                if (revBody) {
                  revBody.innerHTML = "";
                  (data.topRevenue || []).forEach(function (row, i) {
                    var tr = document.createElement("tr");
                    tr.innerHTML = "<td>" + (i + 1) + "</td><td><strong>" + row.pauliId + "</strong></td><td>" + row.totalThb.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " THB</td>";
                    revBody.appendChild(tr);
                  });
                  if (!(data.topRevenue || []).length) {
                    revBody.innerHTML = "<tr><td colspan='3'>Noch keine Daten</td></tr>";
                  }
                }
                var tables = document.getElementById("admin-pauli-id-rank-tables");
                if (tables) tables.hidden = false;
              } catch (err) {
                rankLoadBtn.textContent = "Netzwerkfehler";
                rankLoadBtn.disabled = false;
              }
            });
          }
          // ─────────────────────────────────────────────────────────────────

          var expRadios = document.querySelectorAll(
            'input[name="admin-export-range"]'
          );
          for (var er = 0; er < expRadios.length; er++)
            expRadios[er].addEventListener(
              "change",
              osgAdminMaybeRefreshDashboardOnRangeChange
            );
          var dFrom = document.getElementById("admin-export-from");
          var dTo = document.getElementById("admin-export-to");
          if (dFrom)
            dFrom.addEventListener(
              "change",
              osgAdminMaybeRefreshDashboardOnRangeChange
            );
          if (dTo)
            dTo.addEventListener(
              "change",
              osgAdminMaybeRefreshDashboardOnRangeChange
            );
          osgAdminMaybeRefreshDashboardOnRangeChange();
        }

        osgWireAdminActivator();
        osgAdminDashboardWireOnce();

        window.__OSG_ADMIN = {
          open: osgAdminTryOpenDashboard,
          refresh: osgAdminRenderDashboard,
        };

        window.osgLoadLocaleOverlay = osgLoadLocaleOverlay;
        window.osgLocaleHasJsonOverlay = osgLocaleHasJsonOverlay;

        window.__OSG_I18N = {
          T: T,
          normalizeLang: normalizeLang,
          resolveCustomerGivenName: osgResolveCustomerDisplayName,
          resolveCustomerMembershipActive: osgHasMembershipProfile,
          persistUserProfileSnippet: osgPersistUserProfile,
          systemLangCode: function () {
            try {
              if (window.__OSG_CURRENT_LANG__) {
                return normalizeLang(window.__OSG_CURRENT_LANG__);
              }
              var stored = localStorage.getItem("osg-lang");
              if (stored) return normalizeLang(stored);
            } catch (_) {}
            var raw =
              (navigator.languages && navigator.languages[0]) ||
              navigator.language ||
              "th";
            return normalizeLang(String(raw).split("-")[0]);
          },
        };

      })();
