      import { Tween, Easing, update as osgTweenUpdate } from "@tweenjs/tween.js";

      /**
       * Zeit-Wächter: Tag 07:00:00–21:00:59, Nacht ab 21:01:00 bis 06:59:59
       * (lokale Gerätezeit des Handys).
       */
      function isPauliDayPhase() {
        const d = new Date();
        const sec = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        const dayStart = 7 * 3600;
        const nightStart = 21 * 3600 + 60;
        return sec >= dayStart && sec < nightStart;
      }

      const COIN_DROP_MP3_URLS = [
        "/coin-drop.mp3",
        "/sounds/coin-drop.mp3",
        "./coin-drop.mp3",
        "./public/coin-drop.mp3",
      ];

      /** Tags: coin-drop.mp3 (leichtes File), sonst Synth-Fallback. Nacht: wird nicht aufgerufen. */
      function playCoinDropAudio() {
        if (
          typeof osgPauliAudioAllowed === "function" &&
          !osgPauliAudioAllowed()
        ) {
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          let idx = 0;
          function fallbackSynth() {
            playCoinDropSynth().then(resolve);
          }
          function attempt() {
            if (idx >= COIN_DROP_MP3_URLS.length) return void fallbackSynth();
            const url = COIN_DROP_MP3_URLS[idx++];
            const a = new Audio();
            a.preload = "auto";
            a.volume = 0.94;
            const cleanup = () => {
              a.removeEventListener("ended", onEnd);
              a.removeEventListener("error", onErr);
            };
            const onEnd = () => {
              cleanup();
              resolve();
            };
            const onErr = () => {
              cleanup();
              attempt();
            };
            a.addEventListener("ended", onEnd);
            a.addEventListener("error", onErr, { once: true });
            a.src = url;
            a.play().catch(onErr);
          }
          attempt();
        });
      }

      /** Kurzer synthetischer Münzklang — Fallback ohne coin-drop.mp3. */
      function playCoinDropSynth() {
        return new Promise((resolve) => {
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return void resolve();
            const ctx = new AC();
            const done = () => {
              ctx.close().catch(() => {});
              resolve();
            };
            ctx
              .resume()
              .then(() => {
                const osc = ctx.createOscillator();
                const gn = ctx.createGain();
                const t0 = ctx.currentTime;
                osc.type = "sine";
                osc.frequency.setValueAtTime(2400, t0);
                osc.frequency.exponentialRampToValueAtTime(320, t0 + 0.15);
                gn.gain.setValueAtTime(0.0001, t0);
                gn.gain.exponentialRampToValueAtTime(0.38, t0 + 0.018);
                gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
                osc.connect(gn);
                gn.connect(ctx.destination);
                osc.start(t0);
                osc.stop(t0 + 0.45);
                setTimeout(done, 480);
              })
              .catch(done);
          } catch (_) {
            resolve();
          }
        });
      }

      /** Magier-Sprachwechsel: kurzer Glitzer-Sound beim Abracadabra-Moment. */
      function playMagicianSparkleSynth() {
        return new Promise(function (resolve) {
          try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return void resolve();
            var ctx = window.__OSG_audioCtxUnlock;
            if (!ctx) {
              resolve();
              return;
            }
            var run = function () {
              var t0 = ctx.currentTime;
              var freqs = [660, 990, 1320];
              var i;
              for (i = 0; i < freqs.length; i += 1) {
                (function (f, delay) {
                  var osc = ctx.createOscillator();
                  var gn = ctx.createGain();
                  osc.type = "triangle";
                  osc.frequency.setValueAtTime(f, t0 + delay);
                  gn.gain.setValueAtTime(0.0001, t0 + delay);
                  gn.gain.exponentialRampToValueAtTime(0.07, t0 + delay + 0.02);
                  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.22);
                  osc.connect(gn);
                  gn.connect(ctx.destination);
                  osc.start(t0 + delay);
                  osc.stop(t0 + delay + 0.24);
                })(freqs[i], i * 0.05);
              }
              setTimeout(resolve, 280);
            };
            if (ctx.state === "running") {
              run();
            } else {
              ctx.resume().then(run).catch(resolve);
            }
          } catch (_) {
            resolve();
          }
        });
      }

      /** Pauli-Stimme: lokale MP3 zuerst — kein Web-Speech-Systemfallback. */
      async function speakPauliUtterance(text, whisper, langCode, extraOpts) {
        if (
          typeof osgPauliAudioAllowed === "function" &&
          !osgPauliAudioAllowed()
        ) {
          return;
        }
        const spoken = String(text || "").trim();
        if (!spoken) return;
        const code =
          langCode ||
          (typeof packLangFromDocument === "function"
            ? packLangFromDocument()
            : "en");
        const extra = extraOpts || {};
        let speechKey = String(extra.speechKey || "").trim();
        if (
          !speechKey &&
          typeof osgPauliResolveSpeechKeyFromText === "function"
        ) {
          speechKey = osgPauliResolveSpeechKeyFromText(spoken, code);
        }
        try {
          if (typeof window.playPauliVoice === "function") {
            await window.playPauliVoice(spoken, {
              whisper: !!whisper,
              langCode: code,
              skipCaptionClear: true,
              speechKey: speechKey,
              allowCloudTts: !!extra.allowCloudTts,
            });
            return;
          }
        } catch (_) {}
      }

      /** Bei jeder Benachrichtigung: Zeit prüfen → Tag vs. Nacht → Sound + Voice-Profil. */
      async function playPauliNotificationVoice() {
        if (
          typeof osgPauliAudioAllowed === "function" &&
          !osgPauliAudioAllowed()
        ) {
          return;
        }
        const I = window.__OSG_I18N;
        if (!I) return;
        const code = I.systemLangCode();
        const pack = I.T[code];
        if (!pack) return;
        const day = isPauliDayPhase();
        if (day) await playCoinDropAudio();
        await new Promise((r) => setTimeout(r, day ? 140 : 0));
        const mk =
          typeof I.resolveCustomerMembershipActive === "function" &&
          I.resolveCustomerMembershipActive();
        const nm =
          typeof I.resolveCustomerGivenName === "function"
            ? String(I.resolveCustomerGivenName() || "").trim()
            : "";
        const lineTpl = mk
          ? day
            ? pack.notifyVoiceDayWithProfile ||
              pack.notifyVoiceDayNoName ||
              pack.notifyVoiceDay
            : pack.notifyVoiceNightWithProfile ||
              pack.notifyVoiceNightNoName ||
              pack.notifyVoiceNight
          : nm
            ? day
              ? pack.notifyVoiceDayWithName || pack.notifyVoiceDay
              : pack.notifyVoiceNightWithName || pack.notifyVoiceNight
            : day
              ? pack.notifyVoiceDayNoName || pack.notifyVoiceDay
              : pack.notifyVoiceNightNoName || pack.notifyVoiceNight;
        let lineStr = String(lineTpl || "").replace(/\{NAME\}/g, nm);
        const kw =
          typeof window.__osgInterestTopKeywordUnmuted === "function"
            ? String(window.__osgInterestTopKeywordUnmuted() || "").trim()
            : "";
        if (kw) {
          const interestTpl = pack.notifyPushInterestSentenceTpl || "";
          if (interestTpl) {
            lineStr +=
              " " + String(interestTpl).replace(/\{KW\}/g, kw);
          }
        }
        await speakPauliUtterance(lineStr, !day, code);
      }

      function showPauliOsGNotification() {
        const I = window.__OSG_I18N;
        if (
          typeof Notification === "undefined" ||
          Notification.permission !== "granted" ||
          !I
        )
          return;
        const pack = I.T[I.systemLangCode()];
        try {
          const mk =
            typeof I.resolveCustomerMembershipActive === "function" &&
            I.resolveCustomerMembershipActive();
          const nm =
            typeof I.resolveCustomerGivenName === "function"
              ? String(I.resolveCustomerGivenName() || "").trim()
              : "";
          const bodyTpl = mk
            ? pack.notifyBodyWithProfile || pack.notifyBodyNoName || pack.notifyBody
            : nm
              ? pack.notifyBodyWithName || pack.notifyBody
              : pack.notifyBodyNoName || pack.notifyBody;
          let body = String(bodyTpl || "").replace(/\{NAME\}/g, nm);
          const kw =
            typeof window.__osgInterestTopKeywordUnmuted === "function"
              ? String(window.__osgInterestTopKeywordUnmuted() || "").trim()
              : "";
          if (kw) {
            const interestTpl = pack.notifyPushInterestSentenceTpl || "";
            if (interestTpl) {
              body +=
                " " + String(interestTpl).replace(/\{KW\}/g, kw);
            }
          }
          new Notification(pack.notifyTitle, {
            body,
            silent: true,
            tag: "pauli-best-price-voice",
          });
        } catch (_) {}
      }

      async function runPauliNotifyCycle(opts) {
        opts = opts || {};
        var bypassSchedule =
          !!(opts && (opts.force || opts.bypassHumanSchedule));
        var fired = false;
        try {
          if (
            typeof osgAvatarAccessUnlocked === "function" &&
            !osgAvatarAccessUnlocked()
          )
            return;
          if (
            typeof osgPurchasedSilenceActive === "function" &&
            osgPurchasedSilenceActive()
          )
            return;
          if (
            typeof osgHumanPushMayFireNow === "function" &&
            !bypassSchedule &&
            !osgHumanPushMayFireNow(Date.now())
          )
            return;
          await playPauliNotificationVoice();
          showPauliOsGNotification();
          fired = true;
          if (
            !bypassSchedule &&
            typeof osgHumanPushRecordFired === "function"
          )
            osgHumanPushRecordFired(Date.now());
        } catch (e) {
          console.error(e);
        } finally {
          if (fired) {
            try {
              sessionStorage.setItem(
                "osg-human-push-ts",
                String(Date.now())
              );
              sessionStorage.setItem("osg-pv-ts", String(Date.now()));
            } catch (_) {}
          }
        }
      }

      async function runPauliVoiceTestDay() {
        const I = window.__OSG_I18N;
        if (!I) return;
        const code = I.systemLangCode();
        const pack = I.T[code];
        if (!pack) return;
        await playCoinDropAudio();
        await new Promise((r) => setTimeout(r, 140));
        const mk =
          typeof I.resolveCustomerMembershipActive === "function" &&
          I.resolveCustomerMembershipActive();
        const nm =
          typeof I.resolveCustomerGivenName === "function"
            ? String(I.resolveCustomerGivenName() || "").trim()
            : "";
        const tpl = mk
          ? pack.notifyVoiceDayWithProfile || pack.notifyVoiceDayNoName
          : nm
            ? pack.notifyVoiceDayWithName
            : pack.notifyVoiceDayNoName;
        const lineStr = String(tpl || pack.notifyVoiceDay || "").replace(
          /\{NAME\}/g,
          nm
        );
        await speakPauliUtterance(lineStr, false, code);
      }

      async function runPauliVoiceTestNight() {
        const I = window.__OSG_I18N;
        if (!I) return;
        const code = I.systemLangCode();
        const pack = I.T[code];
        if (!pack) return;
        const mk =
          typeof I.resolveCustomerMembershipActive === "function" &&
          I.resolveCustomerMembershipActive();
        const nm =
          typeof I.resolveCustomerGivenName === "function"
            ? String(I.resolveCustomerGivenName() || "").trim()
            : "";
        const tpl = mk
          ? pack.notifyVoiceNightWithProfile || pack.notifyVoiceNightNoName
          : nm
            ? pack.notifyVoiceNightWithName
            : pack.notifyVoiceNightNoName;
        const lineStr = String(tpl || pack.notifyVoiceNight || "").replace(
          /\{NAME\}/g,
          nm
        );
        await speakPauliUtterance(lineStr, true, code);
      }

      function installPauliVoice() {
        const I = window.__OSG_I18N;
        if (!I) return;

        document.addEventListener(
          "pointerdown",
          () => {
            try {
              sessionStorage.setItem("osg-ua", "1");
            } catch (_) {}
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "default"
            )
              void Notification.requestPermission().catch(() => {});
            try {
              if (!sessionStorage.getItem("osg-pv-intro")) {
                sessionStorage.setItem("osg-pv-intro", "1");
              }
            } catch (_) {}
          },
          { passive: true, capture: true, once: true }
        );

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState !== "visible") return;
          try {
            if (sessionStorage.getItem("osg-ua") !== "1") return;
            void runPauliNotifyCycle();
          } catch (_) {
            return;
          }
        });

        function packLangFromDocument() {
          const raw =
            document.documentElement.getAttribute("lang") ||
            navigator.language ||
            "de";
          const I = window.__OSG_I18N;
          if (!I) return "de";
          return I.normalizeLang(String(raw));
        }

        async function speakPauliLine(text, code, opts) {
          opts = opts || {};
          const line = String(text || "").trim();
          if (!line) return;
          const whisper = !!opts.whisper;
          try {
            await window.playPauliVoice(line, {
              whisper,
              langCode: code,
              speechKey: opts.speechKey || "",
            });
          } catch (_) {}
        }

        async function speakPauliPlain(text, whisper) {
          const I = window.__OSG_I18N;
          if (!I || typeof text !== "string" || !text.trim()) return;
          await speakPauliLine(text, packLangFromDocument(), { whisper: !!whisper });
        }

        async function speakPauliPartnerHandoff(financeCategory) {
          const AC = window.osgAvatarController;
          if (AC && typeof AC.enterWegweiserMode === "function") {
            const ch =
              String(financeCategory || "").toLowerCase() === "insurance"
                ? "insurance"
                : "bank";
            await AC.enterWegweiserMode({ channel: ch });
            return;
          }
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const pack = (I.T && I.T[code]) || {};
          const line = pack?.partnerHandoffSpeakTts;
          if (!line) return;
          if (AC && typeof AC.speakFinanceRecommendation === "function") {
            await AC.speakFinanceRecommendation(line, {
              category: financeCategory || "finance",
              speechKey: "partnerHandoffSpeakTts",
              langCode: code,
              gesture: "confirm",
            });
            return;
          }
          await speakPauliLine(line, code, { speechKey: "partnerHandoffSpeakTts" });
        }

        async function speakPauliPartnerBenefitCertificate(certRealm) {
          const AC = window.osgAvatarController;
          const realm = String(certRealm || "").toLowerCase();
          if (AC && typeof AC.enterWegweiserMode === "function") {
            await AC.enterWegweiserMode({ certRealm: realm });
            return;
          }
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const nm = osgVoiceResolveGuestGivenName();
          const line = osgVoicePickNamedOrNeutralLine(
            code,
            "certificateAvatarTtsWithName",
            "certificateAvatarTtsNoName"
          );
          if (!line.trim()) return;
          const finCat =
            realm === "insurance"
              ? "insurance"
              : realm === "bank" || realm === "finance"
                ? "finance"
                : null;
          if (finCat && AC && typeof AC.speakFinanceRecommendation === "function") {
            await AC.speakFinanceRecommendation(line, {
              category: finCat,
              speechKey: nm
                ? "certificateAvatarTtsWithName"
                : "certificateAvatarTtsNoName",
              langCode: code,
              gesture: "confirm",
            });
            return;
          }
          await speakPauliLine(line, code, {
            speechKey: nm
              ? "certificateAvatarTtsWithName"
              : "certificateAvatarTtsNoName",
          });
        }

        async function speakPauliBookingConfirm() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const pack = I.T && I.T[code];
          const line = pack && pack.bookingSpeakTts;
          if (!line) return;
          await speakPauliLine(line, code, { speechKey: "bookingSpeakTts" });
        }

        function osgVoiceResolveGuestGivenName() {
          const I = window.__OSG_I18N;
          if (!I || typeof I.resolveCustomerGivenName !== "function")
            return "";
          try {
            return String(I.resolveCustomerGivenName() || "").trim();
          } catch (_) {
            return "";
          }
        }

        function osgVoicePickNamedOrNeutralLine(code, namedKey, neutralKey) {
          const I = window.__OSG_I18N;
          if (!I || !I.T) return "";
          const pack = I.T[code];
          const de = I.T.de;
          const nm = osgVoiceResolveGuestGivenName();
          var line = "";
          if (nm) {
            line =
              (pack && pack[namedKey]) ||
              (de && de[namedKey]) ||
              "";
            line = line ? String(line).replace(/\{NAME\}/g, nm) : "";
          }
          if (!line)
            line =
              (pack && pack[neutralKey]) ||
              (de && de[neutralKey]) ||
              (I.T.en && I.T.en[neutralKey]) ||
              "";
          return line ? String(line) : "";
        }

        async function speakPauliSevenPickupReward() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const line = osgVoicePickNamedOrNeutralLine(
            code,
            "sevenVoucherPickupRewardTtsWithName",
            "sevenVoucherPickupRewardTtsNoName"
          );
          if (!line.trim()) return;
          await speakPauliLine(line, code, {
            speechKey: osgVoiceResolveGuestGivenName()
              ? "sevenVoucherPickupRewardTtsWithName"
              : "sevenVoucherPickupRewardTtsNoName",
          });
        }

        async function speakPauliSevenVoucherActivated() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const line = osgVoicePickNamedOrNeutralLine(
            code,
            "sevenVoucherActivatedTtsWithName",
            "sevenVoucherActivatedTtsNoName"
          );
          if (!line.trim()) return;
          await speakPauliLine(line, code, {
            speechKey: osgVoiceResolveGuestGivenName()
              ? "sevenVoucherActivatedTtsWithName"
              : "sevenVoucherActivatedTtsNoName",
          });
        }

        async function speakPauliSevenVoucherQrOpenBrief() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const line = osgVoicePickNamedOrNeutralLine(
            code,
            "sevenVoucherQrOpenBriefingWithName",
            "sevenVoucherQrOpenBriefingNoName"
          );
          if (!line.trim()) return;
          await speakPauliLine(line, code, {
            speechKey: osgVoiceResolveGuestGivenName()
              ? "sevenVoucherQrOpenBriefingWithName"
              : "sevenVoucherQrOpenBriefingNoName",
          });
        }

        async function speakPauliLiveTrackingFirstExplain() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (I.T && (I.T[code] || I.T.de)) ||
            {};
          const line = String(pack.liveTrackingFirstExplainTts || "").trim();
          const bubble = String(
            pack.liveTrackingFirstExplainBubble || line
          ).trim();
          if (!line) return;
          try {
            if (typeof window.pauliLiveCaptionShow === "function" && bubble) {
              window.pauliLiveCaptionShow(bubble);
            }
          } catch (_) {}
          if (typeof window.osgAvatarSpeakLine === "function") {
            await window.osgAvatarSpeakLine(line, {
              gesture: "help",
              speechKey: "liveTrackingFirstExplainTts",
              pointDuration: Math.min(16000, Math.max(7200, line.length * 68)),
            });
            return;
          }
          await speakPauliLine(line, code, {
            speechKey: "liveTrackingFirstExplainTts",
          });
        }

        function osgDeliveryVoicePackLine(pack, key) {
          const I = window.__OSG_I18N;
          const code = packLangFromDocument();
          const p =
            pack ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (I && I.T && (I.T[code] || I.T.en || I.T.de)) ||
            {};
          let line = String(
            p[key] || (I?.T?.en && I.T.en[key]) || (I?.T?.de && I.T.de[key]) || ""
          ).trim();
          const C = window.OSG_COMMERCE;
          if (C && line) {
            line = line
              .replace(/\{SHIP_S\}/g, String(C.SHIP_THB_TIER_S || 39))
              .replace(/\{SHIP_M\}/g, String(C.SHIP_THB_TIER_M || 59))
              .replace(/\{SHIP_L\}/g, String(C.SHIP_THB_TIER_L || 99))
              .replace(
                /\{PLATFORM_FEE\}/g,
                String(C.PICKUP_SERVICE_MARGIN_THB || 59)
              );
          }
          return line;
        }

        async function speakPauliDeliveryChoicePrompt() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (I.T && (I.T[code] || I.T.en || I.T.de)) ||
            {};
          const panel = document.getElementById("delivery-choice-panel");
          const sevenEl = document.getElementById("pickup-mode-seven");
          const promptUi = osgDeliveryVoicePackLine(pack, "delivery.choicePrompt");
          const line1 = osgDeliveryVoicePackLine(pack, "delivery.choicePromptTts");
          const line2 = osgDeliveryVoicePackLine(pack, "delivery.seven.recommendTts");
          const spoken1 = line1 || promptUi;
          if (!spoken1 && !line2) return;
          try {
            if (typeof window.pauliLiveCaptionShow === "function" && promptUi) {
              window.pauliLiveCaptionShow(promptUi);
            }
          } catch (_) {}
          if (typeof window.osgAvatarSpeakLine === "function") {
            if (spoken1) {
              await window.osgAvatarSpeakLine(spoken1, {
                gesture: "help",
                speechKey: "delivery.choicePromptTts",
                pointTarget: panel || false,
                pointDuration: Math.min(
                  18000,
                  Math.max(8000, spoken1.length * 68)
                ),
              });
            }
            if (line2) {
              await window.osgAvatarSpeakLine(line2, {
                gesture: "confirm",
                speechKey: "delivery.seven.recommendTts",
                pointTarget: sevenEl || panel || false,
                pointDuration: Math.min(
                  14000,
                  Math.max(6000, line2.length * 68)
                ),
              });
            }
            return;
          }
          if (spoken1) {
            await speakPauliLine(spoken1, code, {
              speechKey: "delivery.choicePromptTts",
            });
          }
          if (line2) {
            await speakPauliLine(line2, code, {
              speechKey: "delivery.seven.recommendTts",
            });
          }
        }

        async function speakPauliDeliveryConfirmSeven() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (I.T && (I.T[code] || I.T.en || I.T.de)) ||
            {};
          const sevenEl = document.getElementById("pickup-mode-seven");
          const line =
            osgDeliveryVoicePackLine(pack, "delivery.choiceConfirmSevenTts") ||
            osgDeliveryVoicePackLine(pack, "delivery.choiceConfirmSeven");
          if (!line) return;
          try {
            if (typeof window.pauliLiveCaptionShow === "function") {
              window.pauliLiveCaptionShow(line);
            }
          } catch (_) {}
          if (typeof window.osgAvatarSpeakLine === "function") {
            await window.osgAvatarSpeakLine(line, {
              gesture: "confirm",
              speechKey: "delivery.choiceConfirmSevenTts",
              pointTarget: sevenEl || false,
              pointDuration: Math.min(12000, Math.max(5000, line.length * 68)),
            });
            return;
          }
          await speakPauliLine(line, code, {
            speechKey: "delivery.choiceConfirmSevenTts",
          });
        }

        async function speakPauliDeliveryConfirmHome() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (I.T && (I.T[code] || I.T.en || I.T.de)) ||
            {};
          const homeEl = document.getElementById("pickup-mode-marketplace");
          const line =
            osgDeliveryVoicePackLine(pack, "delivery.choiceConfirmHomeTts") ||
            osgDeliveryVoicePackLine(pack, "delivery.choiceConfirmHome");
          if (!line) return;
          try {
            if (typeof window.pauliLiveCaptionShow === "function") {
              window.pauliLiveCaptionShow(line);
            }
          } catch (_) {}
          if (typeof window.osgAvatarSpeakLine === "function") {
            await window.osgAvatarSpeakLine(line, {
              gesture: "acknowledge",
              speechKey: "delivery.choiceConfirmHomeTts",
              pointTarget: homeEl || false,
              pointDuration: Math.min(10000, Math.max(4200, line.length * 68)),
            });
            return;
          }
          await speakPauliLine(line, code, {
            speechKey: "delivery.choiceConfirmHomeTts",
          });
        }

        async function osgPauliSpeakDeliveryVoiceLine(pack, key, opts) {
          opts = opts || {};
          const line = osgDeliveryVoicePackLine(pack, key);
          if (!line) return false;
          try {
            if (typeof window.pauliLiveCaptionShow === "function") {
              window.pauliLiveCaptionShow(line);
            }
          } catch (_) {}
          const code = packLangFromDocument();
          const maxDur = opts.maxDuration || 22000;
          const minDur = opts.minDuration || 5000;
          if (typeof window.osgAvatarSpeakLine === "function") {
            await window.osgAvatarSpeakLine(line, {
              gesture: opts.gesture || "help",
              emotion: opts.emotion,
              speechKey: key,
              pointTarget: opts.pointTarget || false,
              pointDuration: Math.min(
                maxDur,
                Math.max(minDur, line.length * 68)
              ),
            });
            return true;
          }
          await speakPauliLine(line, code, { speechKey: key });
          return true;
        }

        async function speakPauliDeliveryCompareShort() {
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (window.__OSG_I18N?.T?.[packLangFromDocument()] || {});
          const panel = document.getElementById("delivery-choice-panel");
          return osgPauliSpeakDeliveryVoiceLine(
            pack,
            "delivery.voice.compareShortTts",
            {
              gesture: "help",
              pointTarget: panel || false,
              maxDuration: 20000,
            }
          );
        }

        async function speakPauliDeliveryRecommend() {
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (window.__OSG_I18N?.T?.[packLangFromDocument()] || {});
          const sevenEl = document.getElementById("pickup-mode-seven");
          const panel = document.getElementById("delivery-choice-panel");
          const line = osgDeliveryVoicePackLine(
            pack,
            "delivery.voice.recommendFullTts"
          );
          if (!line) return false;
          try {
            if (typeof window.pauliLiveCaptionShow === "function") {
              window.pauliLiveCaptionShow(line);
            }
          } catch (_) {}
          const code = packLangFromDocument();
          if (typeof window.osgAvatarSpeakLine === "function") {
            await window.osgAvatarSpeakLine(line, {
              gesture: "help",
              emotion: "happy",
              speechKey: "delivery.voice.recommendFullTts",
              pointTarget: sevenEl || panel || false,
              pointDuration: Math.min(22000, Math.max(7000, line.length * 68)),
            });
            if (typeof window.osgAvatarGestureStart === "function") {
              window.osgAvatarGestureStart("confirm", 2600);
            }
            return true;
          }
          await speakPauliLine(line, code, {
            speechKey: "delivery.voice.recommendFullTts",
          });
          return true;
        }

        async function speakPauliDeliveryInfo(packKey, opts) {
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (window.__OSG_I18N?.T?.[packLangFromDocument()] || {});
          return osgPauliSpeakDeliveryVoiceLine(pack, packKey, opts || {});
        }

        async function speakPauliSevenVoucherTrackingWarn() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const line = osgVoicePickNamedOrNeutralLine(
            code,
            "sevenVoucherRequireTrackingTtsWithName",
            "sevenVoucherRequireTrackingTtsNoName"
          );
          if (!line.trim()) return;
          await speakPauliLine(line, code, {
            speechKey: osgVoiceResolveGuestGivenName()
              ? "sevenVoucherRequireTrackingTtsWithName"
              : "sevenVoucherRequireTrackingTtsNoName",
          });
        }

        function wirePartnerBookingVoiceOnce() {
          const btn = document.getElementById("partner-booking-btn");
          if (!btn || btn.dataset.osgVoiceWired === "1") return;
          btn.dataset.osgVoiceWired = "1";
          btn.addEventListener(
            "click",
            async () => {
              const I0 = window.__OSG_I18N;
              const code0 = packLangFromDocument();
              const pk0 = I0?.T?.[code0] || {};
              if (
                typeof osgPremiumAccessUnlocked === "function" &&
                !osgPremiumAccessUnlocked()
              ) {
                try {
                  alert(pk0.premiumLockedAlert || "");
                } catch (_) {}
                return;
              }
              async function proceedBookingFlow() {
                try {
                  window.__OSG_AFFILIATE?.recordBookingHandshake?.();
                } catch (_) {}
                const I = window.__OSG_I18N;
                const code = packLangFromDocument();
                const pack = I?.T?.[code];
                const fb = document.getElementById("partner-booking-feedback");
                if (fb && pack) fb.textContent = pack.bookingFeedbackLine || "";
                try {
                  await speakPauliBookingConfirm();
                } catch (_) {}
              }
              await proceedBookingFlow();
            },
            false
          );
        }

        async function speakPauliAgeGateBlock() {
          const I = window.__OSG_I18N;
          if (!I) return;
          const code = packLangFromDocument();
          const pack = I.T && I.T[code];
          if (!pack) return;
          const line = String(pack.ageGateAvatarSpeakLine || "").trim();
          if (!line) return;
          await speakPauliLine(line, code, { speechKey: "ageGateAvatarSpeakLine" });
        }

        window.PauliVoice = {
          playNotification: function () {
            return runPauliNotifyCycle({ bypassHumanSchedule: true });
          },
          isDayPhase: isPauliDayPhase,
          isPauliDayPhase,
          testDay: runPauliVoiceTestDay,
          testNight: runPauliVoiceTestNight,
          speakText: speakPauliPlain,
          speakAgeGateBlock: speakPauliAgeGateBlock,
          speakBookingConfirm: speakPauliBookingConfirm,
          speakPartnerHandoff: speakPauliPartnerHandoff,
          speakSevenPickupReward: speakPauliSevenPickupReward,
          speakLiveTrackingFirstExplain: speakPauliLiveTrackingFirstExplain,
          speakDeliveryChoicePrompt: speakPauliDeliveryChoicePrompt,
          speakDeliveryConfirmSeven: speakPauliDeliveryConfirmSeven,
          speakDeliveryConfirmHome: speakPauliDeliveryConfirmHome,
          speakDeliveryCompareShort: speakPauliDeliveryCompareShort,
          speakDeliveryRecommend: speakPauliDeliveryRecommend,
          speakDeliveryInfo: speakPauliDeliveryInfo,
          speakSevenVoucherTrackingWarn: speakPauliSevenVoucherTrackingWarn,
          speakSevenVoucherActivated: speakPauliSevenVoucherActivated,
          speakSevenVoucherQrOpenBrief: speakPauliSevenVoucherQrOpenBrief,
          speakVoucherQr: speakPauliSevenVoucherQrOpenBrief,
          speakPartnerBenefitCertificate: speakPauliPartnerBenefitCertificate,
        };

        wirePartnerBookingVoiceOnce();

        const devWrap = document.getElementById("pauli-dev-voice-wrap");
        const hit = document.getElementById("pauli-dev-voice-hit");
        hit?.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          devWrap?.classList.toggle("is-open");
        });
        document.getElementById("pauli-test-day")?.addEventListener("click", () => {
          void runPauliVoiceTestDay();
        });
        document.getElementById("pauli-test-night")?.addEventListener("click", () => {
          void runPauliVoiceTestNight();
        });
      }

      async function main() {
        if (document.fonts) {
          try {
            await document.fonts.load('600 52px "Noto Sans Thai"');
            await document.fonts.load('700 64px "Noto Sans Thai"');
          } catch (_) {}
        }

        const container = document.getElementById("coin-stage");
        const coinDbgWrap = document.getElementById("coin-debug-wrap");
        const coinDbgToggle = document.getElementById("coin-debug-toggle");
        const coinDbgPanel = document.getElementById("coin-debug-panel");
        const OSG_LS_COIN_DEBUG = "osg-coin-debug-v1";
        const coinDbg = {
          frontLoaded: false,
          backLoaded: false,
          frontUrl: "",
          backUrl: "",
          frontFallback: false,
          backFallback: false,
          rimSegments: 128,
          rimBump: true,
          rimGeom: true,
          depth: 0,
          faceMap: false,
          backMap: false,
          avatarMap: false,
        };
        let coinDebugOn = false;
        try {
          const qp = new URLSearchParams(window.location.search || "");
          coinDebugOn =
            qp.get("osg_coin_dbg") === "1" ||
            localStorage.getItem(OSG_LS_COIN_DEBUG) === "1";
        } catch (_) {}
        function coinDbgRender() {
          if (!coinDbgWrap || !coinDbgPanel) return;
          if (!coinDebugOn) {
            coinDbgPanel.setAttribute("hidden", "");
            return;
          }
          coinDbgPanel.removeAttribute("hidden");
          coinDbgPanel.textContent = [
            "coin-debug",
            "front: " +
              (coinDbg.frontLoaded ? "ok" : "fail") +
              " | fallback=" +
              (coinDbg.frontFallback ? "1" : "0") +
              " | url=" +
              (coinDbg.frontUrl || "-"),
            "back : " +
              (coinDbg.backLoaded ? "ok" : "fail") +
              " | fallback=" +
              (coinDbg.backFallback ? "1" : "0") +
              " | url=" +
              (coinDbg.backUrl || "-"),
            "maps : face=" +
              (coinDbg.faceMap ? "1" : "0") +
              " back=" +
              (coinDbg.backMap ? "1" : "0"),
            "rim  : seg=" +
              coinDbg.rimSegments +
              " bump=" +
              (coinDbg.rimBump ? "on" : "off") +
              " geom=" +
              (coinDbg.rimGeom ? "on" : "off") +
              " depth=" +
              coinDbg.depth.toFixed(3),
            "time : " + new Date().toLocaleTimeString(),
          ].join("\n");
        }
        if (coinDbgToggle) {
          coinDbgToggle.addEventListener(
            "click",
            () => {
              coinDebugOn = !coinDebugOn;
              try {
                if (coinDebugOn) localStorage.setItem(OSG_LS_COIN_DEBUG, "1");
                else localStorage.removeItem(OSG_LS_COIN_DEBUG);
              } catch (_) {}
              coinDbgRender();
            },
            false
          );
        }
        if (!coinDebugOn && coinDbgPanel) coinDbgPanel.setAttribute("hidden", "");
        if (!container) return;

        const avatarImg = document.getElementById("pauli-main-avatar-img");
        if (!avatarImg) {
          console.warn("[Pauli] Haupt-Avatar-Bild fehlt (#pauli-main-avatar-img).");
          return;
        }

        coinDbg.frontUrl = avatarImg.getAttribute("src") || "/Frontseite02.png";
        coinDbg.frontLoaded = true;
        coinDbg.frontFallback = false;
        coinDbg.backUrl = "/hinterseite.png";
        coinDbg.backLoaded = true;
        coinDbg.backFallback = false;
        coinDbg.depth = 0;
        coinDbg.rimSegments = 0;
        coinDbg.rimBump = false;
        coinDbg.rimGeom = false;
        coinDbg.faceMap = true;
        coinDbg.backMap = true;
        coinDbgRender();

        let avatarDrag = null;
        let osgCoinDragSuppressClickUntil = 0;
        const DRAG_CLICK_PX = 10;

        function osgEventTargetsStaticStand(ev) {
          const t = ev && ev.target;
          if (!t || typeof t.closest !== "function") return false;
          return !!t.closest(
            "#brand-avatar, .pauli-static-stand, #pauli-avatar-thai-label, .page-header-avatar-wrap img"
          );
        }

        function osgSyncNavHeightForCoin() {
          document.documentElement.style.setProperty("--nav-height", "0px");
        }

        function osgEventTargetsCoinStage(ev) {
          const t = ev && ev.target;
          if (!t || typeof t.closest !== "function") return false;
          return !!t.closest("#coin-stage");
        }

        function osgBlockStaticStandEvents(root) {
          if (!root) return;
          const stop = function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          };
          [
            "click",
            "pointerdown",
            "pointerup",
            "touchstart",
            "touchend",
            "dblclick",
            "keydown",
          ].forEach(function (name) {
            root.addEventListener(name, stop, { capture: true, passive: false });
          });
        }

        function applyStrictCoinLogic() {
          osgSyncNavHeightForCoin();

          const staticStand =
            document.getElementById("pauli-static-stand") ||
            document.getElementById("brand-avatar");
          if (staticStand && staticStand.parentNode) {
            const originalId = staticStand.id;
            const clonedStand = staticStand.cloneNode(true);
            clonedStand.id = originalId;
            clonedStand.setAttribute("tabindex", "-1");
            clonedStand.setAttribute("aria-hidden", "true");
            clonedStand.removeAttribute("role");
            clonedStand.style.pointerEvents = "none";
            clonedStand.style.background = "transparent";
            clonedStand.style.backgroundImage = "none";
            clonedStand.style.border = "none";
            clonedStand.style.boxShadow = "none";
            staticStand.parentNode.replaceChild(clonedStand, staticStand);
            osgBlockStaticStandEvents(clonedStand);
          }

          const avatarWrap = document.querySelector(".page-header-avatar-wrap");
          if (avatarWrap) {
            avatarWrap.style.background = "transparent";
            avatarWrap.style.backgroundColor = "transparent";
            avatarWrap.style.backgroundImage = "none";
            avatarWrap.style.border = "none";
            avatarWrap.style.boxShadow = "none";
          }

          document.querySelectorAll(".coin-visual-shadow-host").forEach(function (host) {
            host.style.background = "transparent";
            host.style.backgroundColor = "transparent";
            host.style.backgroundImage = "none";
            host.style.border = "none";
            host.style.boxShadow = "none";
          });

          const standHost = document.querySelector(".coin-visual-shadow-host--stand");
          if (standHost) {
            standHost.style.pointerEvents = "none";
            osgBlockStaticStandEvents(standHost);
          }

          const thaiLabel = document.getElementById("pauli-avatar-thai-label");
          if (thaiLabel) {
            thaiLabel.style.pointerEvents = "none";
            thaiLabel.setAttribute("aria-hidden", "true");
            osgBlockStaticStandEvents(thaiLabel);
          }

          const mainAvatar = document.getElementById("coin-stage");
          if (mainAvatar) {
            mainAvatar.style.animation = "none";
            mainAvatar.style.transform = "none";
            mainAvatar.style.transition = "none";
            mainAvatar.style.background = "transparent";
            mainAvatar.style.backgroundImage = "none";
            mainAvatar.style.border = "none";
            mainAvatar.style.boxShadow = "none";
            mainAvatar.style.pointerEvents = "auto";
          }
          if (avatarImg) {
            avatarImg.style.transform = "none";
            avatarImg.style.animation = "none";
            avatarImg.style.transition = "none";
            avatarImg.style.background = "transparent";
            avatarImg.style.backgroundColor = "transparent";
            avatarImg.style.backgroundImage = "none";
            avatarImg.style.border = "none";
            avatarImg.style.boxShadow = "none";
            avatarImg.style.pointerEvents = "none";
            avatarImg.style.filter = "none";
          }
        }

        applyStrictCoinLogic();
        if (typeof window.osgEnforceCoinShellTransparent === "function") {
          window.osgEnforceCoinShellTransparent();
        }
        osgProcessCoinImage(document.getElementById("brand-avatar"));
        osgProcessCoinImage(avatarImg);

        if (
          window.OSG_PauliAvatarAnimations &&
          typeof window.OSG_PauliAvatarAnimations.init === "function"
        ) {
          window.OSG_PauliAvatarAnimations.init({
            stage: container,
            img: avatarImg,
            populatePayModal: osgPopulateAvatarPayModal,
          });
          if (
            typeof osgAvatarAccessUnlocked === "function" &&
            !osgAvatarAccessUnlocked()
          ) {
            window.OSG_PauliAvatarAnimations.setState("idle");
          }
          if (
            typeof window.OSG_PauliAvatarAnimations.onAppMount === "function"
          ) {
            window.OSG_PauliAvatarAnimations.onAppMount();
          }
        }

        function osgAvatarCelebratePurchase(amountThb) {
          if (
            typeof osgAvatarAccessUnlocked === "function" &&
            !osgAvatarAccessUnlocked()
          ) {
            return;
          }
          var pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          var n = Number(amountThb);
          var min =
            (window.OSG_AVATAR_ANIMATION_MANIFEST &&
              window.OSG_AVATAR_ANIMATION_MANIFEST.PREMIUM_PURCHASE_MIN_THB) ||
            500;
          var quoteKey =
            Number.isFinite(n) && n >= min
              ? "avatarPurchasePremiumTts"
              : "avatarPurchaseStandardTts";
          var quote = pack[quoteKey] || "";
          if (
            window.OSG_PauliAvatarAnimations &&
            typeof window.OSG_PauliAvatarAnimations.onCheckoutSuccess ===
              "function"
          ) {
            window.OSG_PauliAvatarAnimations.onCheckoutSuccess(
              amountThb,
              async function () {
                if (quote && typeof window.playPauliVoice === "function") {
                  await window.playPauliVoice(quote, { skipBridge: true });
                }
              }
            );
          } else if (
            window.OSG_PauliAvatarAnimations &&
            typeof window.OSG_PauliAvatarAnimations.onPurchase === "function"
          ) {
            window.OSG_PauliAvatarAnimations.onPurchase(amountThb);
          }
        }
        window.osgAvatarCelebratePurchase = osgAvatarCelebratePurchase;
        window.osgAvatarOnCheckoutSuccess = osgAvatarCelebratePurchase;

        function osgEstimateAffiliatePurchaseThb(anchor) {
          var row = anchor && anchor.closest ? anchor.closest("tr") : null;
          if (!row) return 0;
          var cells = row.querySelectorAll("td");
          for (var ci = 1; ci < cells.length; ci += 1) {
            var txt = String(cells[ci].textContent || "").replace(/[^\d.]/g, "");
            var n = Number(txt);
            if (Number.isFinite(n) && n > 0) return n;
          }
          return 0;
        }
        window.osgEstimateAffiliatePurchaseThb = osgEstimateAffiliatePurchaseThb;

        function osgApplyAvatarTransform(extra) {
          const host = osgAvatarVisualHost();
          if (!host) return;
          const val = extra ? String(extra) : "";
          host.style.transform = val;
          if (!val) host.style.willChange = "";
        }

        const OSG_COIN_STAGE_POS_KEY = "osg-coin-stage-pos-v1";

        function osgCoinStageViewportPad() {
          const root = getComputedStyle(document.documentElement);
          const read = function (name) {
            const v = parseFloat(root.getPropertyValue(name));
            return Number.isFinite(v) ? v : 0;
          };
          return {
            top: Math.max(6, read("--safe-top") + 6),
            right: Math.max(6, read("--safe-right") + 6),
            bottom: Math.max(6, read("--safe-bottom") + 6),
            left: Math.max(6, read("--safe-left") + 6),
          };
        }

        function osgClampCoinStageCoords(left, top, el) {
          const pad = osgCoinStageViewportPad();
          const w =
            el.offsetWidth || parseFloat(getComputedStyle(el).width) || 132;
          const h = el.offsetHeight || w;
          return {
            left: Math.max(
              pad.left,
              Math.min(left, window.innerWidth - w - pad.right)
            ),
            top: Math.max(
              pad.top,
              Math.min(top, window.innerHeight - h - pad.bottom)
            ),
          };
        }

        function osgSetCoinStagePosition(el, left, top, opts) {
          opts = opts || {};
          const clamped = osgClampCoinStageCoords(left, top, el);
          el.classList.add("is-user-positioned");
          el.style.setProperty(
            "left",
            Math.round(clamped.left) + "px",
            "important"
          );
          el.style.setProperty(
            "top",
            Math.round(clamped.top) + "px",
            "important"
          );
          el.style.setProperty("right", "auto", "important");
          el.style.setProperty("bottom", "auto", "important");
          if (opts.persist) osgSaveCoinStagePosition(el);
        }

        function osgRestoreCoinStagePosition(el) {
          if (!el) return;
          try {
            const raw = localStorage.getItem(OSG_COIN_STAGE_POS_KEY);
            if (!raw) return;
            const pos = JSON.parse(raw);
            if (
              !pos ||
              typeof pos.left !== "number" ||
              typeof pos.top !== "number"
            ) {
              return;
            }
            osgSetCoinStagePosition(el, pos.left, pos.top);
          } catch (_) {}
        }

        function osgSaveCoinStagePosition(el) {
          if (!el) return;
          try {
            const rect = el.getBoundingClientRect();
            localStorage.setItem(
              OSG_COIN_STAGE_POS_KEY,
              JSON.stringify({ left: rect.left, top: rect.top })
            );
          } catch (_) {}
        }

        function installPauliMainAvatarDrag(el) {
          osgRestoreCoinStagePosition(el);
          el.addEventListener("pointerdown", function (e) {
            if (e.button !== 0) return;
            const rect = el.getBoundingClientRect();
            osgSetCoinStagePosition(el, rect.left, rect.top);
            avatarDrag = {
              id: e.pointerId,
              sx: e.clientX,
              sy: e.clientY,
              ox: rect.left,
              oy: rect.top,
              moved: false,
            };
            el.classList.add("is-dragging-session");
            try {
              el.setPointerCapture(e.pointerId);
            } catch (_) {}
          });
          el.addEventListener("pointermove", function (e) {
            if (!avatarDrag || avatarDrag.id !== e.pointerId) return;
            const dx = e.clientX - avatarDrag.sx;
            const dy = e.clientY - avatarDrag.sy;
            if (Math.hypot(dx, dy) > DRAG_CLICK_PX) avatarDrag.moved = true;
            const next = osgClampCoinStageCoords(
              avatarDrag.ox + dx,
              avatarDrag.oy + dy,
              el
            );
            osgSetCoinStagePosition(el, next.left, next.top);
          });
          function endDrag(e) {
            if (!avatarDrag || avatarDrag.id !== e.pointerId) return;
            el.classList.remove("is-dragging-session");
            if (avatarDrag.moved) {
              osgSaveCoinStagePosition(el);
              osgCoinDragSuppressClickUntil = Date.now() + 450;
            }
            osgAvatarStopTravelTween();
            avatarTraveledAway = false;
            avatarHomePos = null;
            avatarDrag = null;
            try {
              el.releasePointerCapture(e.pointerId);
            } catch (_) {}
          }
          el.addEventListener("pointerup", endDrag);
          el.addEventListener("pointercancel", endDrag);
          window.addEventListener("resize", function () {
            if (!el.classList.contains("is-user-positioned")) return;
            const rect = el.getBoundingClientRect();
            osgSetCoinStagePosition(el, rect.left, rect.top);
          });
        }

        installPauliMainAvatarDrag(container);

        async function osgPauliRunUserSessionGreeting(opts) {
          opts = opts || {};
          const SB = window.OSG_STARTUP_BOOT;
          if (!SB || typeof SB.runSessionGreeting !== "function") return false;
          if (SB.sessionGreetDone()) {
            return false;
          }
          if (
            typeof osgPauliAudioAllowed === "function" &&
            !osgPauliAudioAllowed()
          ) {
            return false;
          }
          if (
            typeof osgAvatarAccessUnlocked === "function" &&
            !osgAvatarAccessUnlocked()
          ) {
            return false;
          }
          if (window.__OSG_SESSION_GREET_RUNNING__) return false;
          window.__OSG_SESSION_GREET_RUNNING__ = true;
          busy = true;
          container.classList.add("is-busy");
          osgPauliLiveStopWake();
          try {
            if (window.OSG_AVATAR_LOCALE) {
              await window.OSG_AVATAR_LOCALE.loadAvatarPacks({});
            }
            const pack =
              (typeof osgAvatarCompanionPack === "function"
                ? osgAvatarCompanionPack()
                : null) ||
              window.__OSG_CURRENT_PACK_CACHE ||
              (typeof T !== "undefined" ? T.de : {});
            await SB.runSessionGreeting(
              pack,
              {
                gesture: function (type) {
                  if (typeof osgAvatarGestureStart === "function") {
                    osgAvatarGestureStart(type || "greet", 2400);
                  }
                },
                speakLine: function (line, speakOpts) {
                  return osgAvatarSpeakLine(
                    line,
                    Object.assign({}, speakOpts || {}, {
                      allowCloudTts: true,
                      clonedVoiceFirst: !!(
                        speakOpts && speakOpts.clonedVoiceFirst
                      ),
                      dynamicSpeech: !!(speakOpts && speakOpts.dynamicSpeech),
                      pointTarget: container,
                      pointDuration: Math.min(
                        14000,
                        Math.max(4800, String(line || "").length * 72)
                      ),
                    })
                  );
                },
                onNameAsk: function () {
                  setTimeout(function () {
                    try {
                      osgShowPersonalOnboarding();
                    } catch (_) {}
                  }, 420);
                },
              },
              { playAudio: true }
            );
            if (typeof startPauliLiveConversation === "function") {
              try {
                await startPauliLiveConversation({ fromGreeting: true });
              } catch (handoffErr) {
                console.warn("[Pauli] greeting→live handoff failed", handoffErr);
              }
            }
            window.__OSG_GREETING_DONE_PENDING_MIC__ = false;
            window.__OSG_SESSION_GREET_COMPLETE__ = true;
            try {
              const _wb = document.getElementById("pauli-voice-wake-btn");
              if (_wb) {
                _wb.removeAttribute("hidden");
                _wb.classList.add("osg-pulse-ready");
              }
            } catch (_) {}
            return true;
          } catch (_) {
            return false;
          } finally {
            window.__OSG_SESSION_GREET_RUNNING__ = false;
            busy = false;
            container.classList.remove("is-busy");
          }
        }

        window.osgPauliRunUserSessionGreeting = osgPauliRunUserSessionGreeting;

        function osgCoinActivateFromGesture() {
          if (Date.now() < osgCoinDragSuppressClickUntil) return;
          if (avatarDrag && avatarDrag.moved) return;
          if (
            window.OSG_PauliAvatarAnimations &&
            typeof window.OSG_PauliAvatarAnimations.handleCoinClick ===
              "function" &&
            window.OSG_PauliAvatarAnimations.handleCoinClick()
          ) {
            return;
          }
          unlockAudioSystemFromCoinGesture();
          autoWaiDone = true;
          void osgPauliRunUserSessionGreeting({ fromCoin: true });
        }

        let busy = false;
        let waiActive = false;
        let waiStart = 0;
        let ttsLoading = false;
        let avatarReturnTween = null;
        const avatarBow = { rx: 0, rz: 0, scale: 1 };
        const WAI_MS = 2200;
        let coinDbgTickAt = 0;
        coinDbgRender();

        function osgCloseAudioContext() {
          const ctx = window.__OSG_audioCtxUnlock;
          if (!ctx) return;
          try {
            if (ctx.state !== "closed") void ctx.close();
          } catch (_) {}
          window.__OSG_audioCtxUnlock = null;
          osgAudioGestureUnlocked = false;
        }

        window.addEventListener("pagehide", osgCloseAudioContext);
        document.addEventListener("visibilitychange", function () {
          if (document.visibilityState === "hidden") osgCloseAudioContext();
        });

        function beginWai() {
          if (avatarReturnTween) {
            avatarReturnTween.stop();
            avatarReturnTween = null;
          }
          waiActive = true;
          waiStart = performance.now();
          container.classList.add("is-wai", "is-anim-wai");
        }

        function endWai() {
          waiActive = false;
          container.classList.remove("is-wai", "is-anim-wai");
          osgTweenAvatarReturn();
        }

        window.osgAvatarBeginWai = beginWai;
        window.osgAvatarEndWai = endWai;

        function osgTweenAvatarReturn() {
          if (avatarReturnTween) avatarReturnTween.stop();
          avatarReturnTween = null;
          avatarBow.rx = 0;
          avatarBow.rz = 0;
          avatarBow.scale = 1;
          waiActive = false;
          osgApplyAvatarTransform("");
          if (
            window.OSG_PauliAvatarAnimations &&
            typeof window.OSG_PauliAvatarAnimations.onWaiStop === "function"
          ) {
            window.OSG_PauliAvatarAnimations.onWaiStop();
          }
        }

        /* ── LIP-SYNC + GESTURE ENGINE (Etappe 3) ───────────────────────
           Audio-driven mouth via AnalyserNode when ElevenLabs plays;
           procedural fallback for Web Speech API. Gestures run on
           avatarGreeting (nod, lean, idle breathe). */
        let lipSyncActive = false;
        let lipSyncStart = 0;
        let lipSyncDuration = 0;
        let lipSyncMeshes = [];
        let lipSyncAnalyser = null;
        let lipSyncMouthLevel = 0;

        let avatarGestureType = "idle";
        let avatarGestureStart = 0;
        let avatarGestureDuration = 0;
        let avatarIdlePhase = 0;
        let avatarTourRunning = false;
        let avatarTravelTween = null;
        let avatarTraveledAway = false;
        let avatarHomePos = null;

        function osgAvatarVisualHost() {
          return container.querySelector(".coin-visual-shadow-host--main");
        }

        function osgAvatarStopTravelTween() {
          if (avatarTravelTween) {
            try {
              avatarTravelTween.stop();
            } catch (_) {}
            avatarTravelTween = null;
          }
        }

        function osgAvatarResolvePointEl(pointTarget) {
          if (!pointTarget || pointTarget === false) return null;
          if (typeof pointTarget === "string") {
            return document.querySelector(pointTarget);
          }
          return pointTarget && pointTarget.nodeType === 1 ? pointTarget : null;
        }

        function osgAvatarIsCoinEl(el) {
          if (!el) return false;
          return (
            el.id === "coin-stage" ||
            (el.classList && el.classList.contains("coin-stage"))
          );
        }

        function osgAvatarCaptureHomePosition() {
          if (avatarHomePos) return avatarHomePos;
          const rect = container.getBoundingClientRect();
          avatarHomePos = { left: rect.left, top: rect.top };
          return avatarHomePos;
        }

        function osgAvatarComputeTravelDest(targetRect, coinSize) {
          const pad = 10;
          const isNarrow = window.innerWidth <= 480;
          let destLeft;
          let destTop;
          if (isNarrow) {
            destLeft = targetRect.left + targetRect.width / 2 - coinSize / 2;
            destTop = targetRect.top - coinSize - pad;
          } else {
            destLeft = targetRect.left - coinSize - 14;
            destTop =
              targetRect.top + targetRect.height / 2 - coinSize / 2;
          }
          destLeft = Math.max(
            pad,
            Math.min(destLeft, window.innerWidth - coinSize - pad)
          );
          destTop = Math.max(
            pad,
            Math.min(destTop, window.innerHeight - coinSize - pad)
          );
          return { left: destLeft, top: destTop };
        }

        function osgAvatarTweenStageTo(destLeft, destTop, durationMs) {
          osgAvatarStopTravelTween();
          const stageRect = container.getBoundingClientRect();
          const pos = { left: stageRect.left, top: stageRect.top };
          osgSetCoinStagePosition(container, pos.left, pos.top);
          return new Promise((resolve) => {
            avatarTravelTween = new Tween(pos)
              .to({ left: destLeft, top: destTop }, durationMs)
              .easing(Easing.Quadratic.Out)
              .onUpdate(() => {
                osgSetCoinStagePosition(container, pos.left, pos.top);
              })
              .onComplete(() => {
                avatarTravelTween = null;
                resolve();
              })
              .start();
          });
        }

        async function osgAvatarTravelToPoint(pointEl, opts) {
          opts = opts || {};
          const M = window.OSG_AVATAR_MISHAP_LOGIC;
          if (!pointEl || osgAvatarIsCoinEl(pointEl)) return false;
          if (M && M.prefersReducedMotion && M.prefersReducedMotion()) {
            return false;
          }

          osgAvatarCaptureHomePosition();
          const targetRect = pointEl.getBoundingClientRect();
          const coinSize = container.getBoundingClientRect().width;
          const dest = osgAvatarComputeTravelDest(targetRect, coinSize);
          const totalMs = M ? M.travelDurationMs(window.innerWidth) : 700;

          let mishapType = null;
          const AC = window.osgAvatarController;
          if (
            M &&
            M.shouldTrigger({
              allowMishap: opts.allowMishap !== false,
              tourMode: !!avatarTourRunning,
            })
          ) {
            mishapType = M.pickType();
          }

          container.classList.add("is-avatar-running");
          avatarTraveledAway = true;

          if (
            mishapType &&
            AC &&
            typeof AC.playMishapSequence === "function"
          ) {
            const progress = M.mishapAtProgress(mishapType) || 0.5;
            const split = Math.round(totalMs * progress);
            const startRect = container.getBoundingClientRect();
            await osgAvatarTweenStageTo(
              startRect.left + (dest.left - startRect.left) * progress,
              startRect.top + (dest.top - startRect.top) * progress,
              split
            );
            await AC.playMishapSequence(mishapType, {
              langCode: opts.langCode,
              pack: opts.pack,
            });
            await osgAvatarTweenStageTo(
              dest.left,
              dest.top,
              Math.max(180, totalMs - split)
            );
          } else {
            await osgAvatarTweenStageTo(dest.left, dest.top, totalMs);
          }

          container.classList.remove("is-avatar-running");
          return true;
        }

        async function osgAvatarReturnHomeIfMoved(opts) {
          opts = opts || {};
          if (!avatarTraveledAway) return;
          const home = avatarHomePos || osgAvatarCaptureHomePosition();
          const M = window.OSG_AVATAR_MISHAP_LOGIC;
          if (M && M.prefersReducedMotion && M.prefersReducedMotion()) {
            osgSetCoinStagePosition(container, home.left, home.top);
            container.classList.remove("is-avatar-running");
            avatarTraveledAway = false;
            avatarHomePos = null;
            return;
          }
          container.classList.add("is-avatar-running");
          await osgAvatarTweenStageTo(
            home.left,
            home.top,
            opts.durationMs || 520
          );
          container.classList.remove("is-avatar-running");
          osgSetCoinStagePosition(container, home.left, home.top);
          avatarTraveledAway = false;
          avatarHomePos = null;
        }

        window.osgAvatarTravelToPoint = osgAvatarTravelToPoint;
        window.osgAvatarReturnHomeIfMoved = osgAvatarReturnHomeIfMoved;

        async function osgAvatarSpeakLocalized(packKey, opts) {
          opts = opts || {};
          const LOCALE = window.OSG_AVATAR_LOCALE;
          const GUARD = window.OSG_I18N_LANG_GUARD;
          if (!packKey || !LOCALE) return false;
          await LOCALE.loadAvatarPacks(opts);
          const uiLang = LOCALE.resolveLang(opts);
          if (GUARD && GUARD.needsThaiFirstBridge(uiLang, opts)) {
            const thLine = GUARD.stripThaiLatinMix(
              LOCALE.packLine("th", packKey),
              "th"
            );
            if (thLine) {
              await osgAvatarSpeakLine(thLine, {
                ...opts,
                langCode: "th",
                skipBridge: true,
                returnHome: false,
              });
              await new Promise((r) => setTimeout(r, 380));
            }
          }
          let line = LOCALE.localizedLine(packKey, opts);
          if (!line) return false;
          if (GUARD) {
            line = GUARD.stripThaiLatinMix(line, uiLang);
          }
          const bubbleKey = String(packKey).replace(/Tts$/, "Bubble");
          const bubble = LOCALE.localizedLine(bubbleKey, opts);
          if (bubble) {
            try {
              if (typeof window.pauliLiveCaptionShow === "function") {
                window.pauliLiveCaptionShow(bubble);
              }
            } catch (_) {}
          }
          await osgAvatarSpeakLine(line, {
            ...opts,
            langCode: uiLang,
            skipBridge: true,
          });
          return true;
        }

        window.osgAvatarSpeakLocalized = osgAvatarSpeakLocalized;

        function osgDhEnterSpeaking() {
          if (
            !window.OSG_DIGITAL_HUMAN ||
            typeof window.OSG_DIGITAL_HUMAN.enterSpeaking !== "function"
          ) {
            return;
          }
          var variant =
            window.__OSG_DH_SPEAKING_VARIANT__ || "speaking";
          window.OSG_DIGITAL_HUMAN.enterSpeaking(variant);
        }

        function osgDhLeaveSpeaking() {
          if (
            !window.OSG_DIGITAL_HUMAN ||
            typeof window.OSG_DIGITAL_HUMAN.leaveSpeaking !== "function"
          ) {
            return;
          }
          window.OSG_DIGITAL_HUMAN.leaveSpeaking();
        }

        function osgLipSyncBegin(opts) {
          opts = opts || {};
          osgDhEnterSpeaking();
          lipSyncActive = true;
          lipSyncStart = performance.now();
          lipSyncDuration = opts.durationMs || 2500;
          lipSyncAnalyser = opts.analyser || null;
          lipSyncMouthLevel = 0;
          lipSyncMeshes = [avatarImg];
          if (
            window.OSG_PauliAvatarAnimations &&
            typeof window.OSG_PauliAvatarAnimations.onSpeakStart === "function"
          ) {
            window.OSG_PauliAvatarAnimations.onSpeakStart();
          }
        }

        function osgLipSyncStop() {
          lipSyncActive = false;
          lipSyncAnalyser = null;
          lipSyncMouthLevel = 0;
          if (typeof window.OSGLipsyncClearVisuals === "function") {
            window.OSGLipsyncClearVisuals();
          }
          if (
            window.OSG_PauliAvatarAnimations &&
            typeof window.OSG_PauliAvatarAnimations.onSpeakStop === "function"
          ) {
            window.OSG_PauliAvatarAnimations.onSpeakStop();
          }
          osgDhLeaveSpeaking();
        }

        function osgLipSyncStart(durationMs) {
          osgLipSyncBegin({ durationMs: durationMs || 2000 });
        }

        function osgLipSyncTick(now) {
          if (!lipSyncActive) return;
          if (waiActive) return;
          if (lipSyncAnalyser && typeof window.OSGLipsyncTickAnalyser === "function") {
            lipSyncMouthLevel = window.OSGLipsyncTickAnalyser(lipSyncAnalyser);
            return;
          }
          const elapsed = now - lipSyncStart;
          if (lipSyncDuration > 0 && elapsed > lipSyncDuration) {
            osgLipSyncStop();
            return;
          }
          const phase = (elapsed / 160) % 1;
          lipSyncMouthLevel = 0.32 + Math.sin(phase * Math.PI * 2) * 0.28;
          if (typeof window.OSGLipsyncApplyLevel === "function") {
            window.OSGLipsyncApplyLevel(lipSyncMouthLevel);
          }
        }

        window.triggerAvatarAnimation = function (analyser) {
          osgLipSyncBegin({
            analyser: analyser || null,
            durationMs: 60000,
          });
          osgAvatarGestureStart("acknowledge", 60000);
        };

        window.stopAvatarAnimation = function () {
          osgLipSyncStop();
          osgAvatarGestureStop();
        };

        window.stopAllSpeech = function () {
          // Phase 4: Zentraler Stop über Registry (stoppt alle registrierten Quellen + Legacy-Globals)
          if (window.OSG_AUDIO_REGISTRY && typeof window.OSG_AUDIO_REGISTRY.stopAll === "function") {
            window.OSG_AUDIO_REGISTRY.stopAll();
          } else {
            // Fallback wenn Registry noch nicht geladen
            try {
              if (typeof speechSynthesis !== "undefined") {
                speechSynthesis.cancel();
              }
            } catch (_) {}
            const src = window.__OSG_activePauliBufferSource;
            if (src) {
              try { src.stop(); } catch (_) {}
              window.__OSG_activePauliBufferSource = null;
            }
            window.currentAudioSource = null;
            const htmlAud = window.__OSG_activePauliHtmlAudio;
            if (htmlAud) {
              try { htmlAud.pause(); htmlAud.currentTime = 0; } catch (_) {}
              window.__OSG_activePauliHtmlAudio = null;
            }
            try {
              if (
                typeof window.OSG_AUDIO_SEGMENT !== "undefined" &&
                window.OSG_AUDIO_SEGMENT &&
                typeof window.OSG_AUDIO_SEGMENT.stop === "function"
              ) {
                window.OSG_AUDIO_SEGMENT.stop();
              }
            } catch (_) {}
            try {
              if (typeof window.stopPauliSpeech === "function") {
                window.stopPauliSpeech();
              }
            } catch (_) {}
          }
          osgLipSyncStop();
          osgAvatarGestureStop();
        };

        window.OSGLipSync = {
          start: osgLipSyncStart,
          stop: osgLipSyncStop,
          begin: osgLipSyncBegin,
        };

        function osgAvatarGestureStart(type, durationMs) {
          avatarGestureType = type || "acknowledge";
          avatarGestureStart = performance.now();
          avatarGestureDuration = durationMs || 2200;
        }

        function osgAvatarGestureStop() {
          avatarGestureType = "idle";
        }

        function osgAvatarGestureTick(_now, delta) {
          if (waiActive && busy) return;
          const elapsed = _now - avatarGestureStart;
          const t =
            avatarGestureDuration > 0
              ? Math.min(1, elapsed / avatarGestureDuration)
              : 1;

          if (lipSyncActive && !waiActive) {
            avatarIdlePhase += delta * 2.1;
            if (
              t >= 1 &&
              avatarGestureType !== "idle" &&
              avatarGestureType !== "greet"
            ) {
              osgAvatarGestureStop();
            }
            return;
          } else if (avatarGestureType === "idle" && !busy && !avatarTourRunning) {
            avatarIdlePhase += delta * 1.15;
            const breathe = Math.sin(avatarIdlePhase) * 0.012;
            osgApplyAvatarTransform("scale(" + (1 + breathe).toFixed(4) + ")");
          } else if (
            avatarGestureType === "confirm" ||
            avatarGestureType === "acknowledge"
          ) {
            const nod = Math.sin(t * Math.PI * 2.2) * 8 * (1 - t * 0.25);
            osgApplyAvatarTransform("rotateX(" + nod.toFixed(2) + "deg)");
          } else if (avatarGestureType === "help") {
            const tilt = Math.sin(t * Math.PI) * 6;
            osgApplyAvatarTransform("rotateZ(" + tilt.toFixed(2) + "deg)");
          } else if (avatarGestureType === "greet" && !waiActive) {
            const bow = Math.sin(t * Math.PI) * -10;
            osgApplyAvatarTransform("rotateX(" + bow.toFixed(2) + "deg)");
          }

          if (t >= 1 && avatarGestureType !== "idle" && avatarGestureType !== "greet") {
            osgAvatarGestureStop();
          }
        }

        window.osgAvatarGestureStart = osgAvatarGestureStart;
        window.osgAvatarGestureStop = osgAvatarGestureStop;

        const OSG_TOUR_SEEN_KEY = "osg.tour.seen";

        async function osgAvatarSpeakLine(text, opts) {
          opts = opts || {};
          if (
            typeof osgPauliAudioAllowed === "function" &&
            !osgPauliAudioAllowed()
          ) {
            return;
          }
          if (typeof window.osgPauliTtsAbort === "function") {
            window.osgPauliTtsAbort();
          } else if (typeof window.stopAllSpeech === "function") {
            window.stopAllSpeech();
          }
          const LS = window.OSG_LANG_SWITCH_LOGIC;
          const parts =
            LS && typeof LS.splitSequentialBlocks === "function"
              ? LS.splitSequentialBlocks(text)
              : [String(text || "").trim()].filter(Boolean);
          if (parts.length > 1) {
            for (let pi = 0; pi < parts.length; pi += 1) {
              await osgAvatarSpeakLine(parts[pi], {
                ...opts,
                skipBridge: pi > 0 ? true : opts.skipBridge,
              });
            }
            return;
          }
          const gesture = opts.gesture || "acknowledge";
          const pointDuration = opts.pointDuration || 4500;
          const whisper = !!opts.whisper;
          const I = window.__OSG_I18N;
          const langCode =
            opts.langCode || (I ? I.systemLangCode() : "en");
          const GUARD = window.OSG_I18N_LANG_GUARD;
          let line = String(text || "").trim();
          if (!line) return;
          if (GUARD && typeof GUARD.stripThaiLatinMix === "function") {
            line = GUARD.stripThaiLatinMix(line, langCode);
          }
          const pointTarget =
            opts.pointTarget === false ? null : opts.pointTarget || container;
          const pointEl = osgAvatarResolvePointEl(pointTarget);
          const isExternalPoint =
            pointEl &&
            !osgAvatarIsCoinEl(pointEl) &&
            pointEl !== container;
          let traveled = false;

          if (
            isExternalPoint &&
            opts.skipTravel !== true &&
            typeof osgAvatarTravelToPoint === "function"
          ) {
            try {
              traveled = await osgAvatarTravelToPoint(pointEl, {
                langCode: langCode,
                pack: opts.pack,
                allowMishap: opts.allowMishap,
              });
            } catch (_) {}
          }

          if (typeof osgAvatarPoint === "function" && pointTarget) {
            osgAvatarPoint(pointTarget, line, pointDuration);
          }
          osgAvatarGestureStart(gesture, Math.max(2200, pointDuration - 500));
          if (gesture === "wai" && typeof beginWai === "function" && !waiActive && !opts.skipWaiGesture) {
            beginWai();
          }
          ttsLoading = true;
          try {
            await window.playPauliVoice(line, {
              whisper,
              langCode,
              speechKey: opts.speechKey || "",
              allowCloudTts: !!opts.allowCloudTts,
              clonedVoiceFirst: !!opts.clonedVoiceFirst,
              dynamicSpeech: !!opts.dynamicSpeech,
              skipCaptionClear: !!opts.skipCaptionClear,
            });
          } catch (e) {
            osgLipSyncStop();
          } finally {
            ttsLoading = false;
            if (gesture === "wai" && typeof endWai === "function") {
              endWai();
            }
            if (avatarGestureType === gesture) osgAvatarGestureStop();
            if (
              traveled &&
              opts.returnHome !== false &&
              typeof osgAvatarReturnHomeIfMoved === "function"
            ) {
              try {
                await osgAvatarReturnHomeIfMoved({ durationMs: 520 });
              } catch (_) {}
            }
          }
        }

        async function osgAvatarTour(pack) {
          if (avatarTourRunning) return;
          pack =
            pack ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.th || T.de || {} : {});
          avatarTourRunning = true;
          busy = true;
          container.classList.add("is-busy");

          const steps = [
            {
              sel: ".compare-panel",
              text: pack.avatarTourStep1,
              speechKey: "avatarTourStep1",
              gesture: "help",
            },
            {
              sel: "#osg-smartphones-section",
              text: pack.avatarTourStep2,
              speechKey: "avatarTourStep2",
              gesture: "help",
            },
            {
              sel: "#osg-internet-section",
              text: pack.avatarTourStep5,
              speechKey: "avatarTourStep5",
              gesture: "help",
            },
            {
              sel: "#osg-tariff-section",
              text: pack.avatarTourStep3,
              speechKey: "avatarTourStep3",
              gesture: "help",
            },
            {
              sel: "#osg-autoservice-section",
              text: pack.avatarTourStep6,
              speechKey: "avatarTourStep6",
              gesture: "help",
            },
            {
              sel: ".osg-vip-block",
              text: pack.avatarTourStep4,
              speechKey: "avatarTourStep4",
              gesture: "confirm",
            },
          ];

          try {
            await osgAvatarSpeakLine(pack.avatarTourIntro || "", {
              gesture: "greet",
              pointTarget: container,
              pointDuration: 7200,
              speechKey: "avatarTourIntro",
            });

            for (let i = 0; i < steps.length; i += 1) {
              const step = steps[i];
              if (!step.text) continue;
              const el = document.querySelector(step.sel);
              if (el) {
                try {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                } catch (_) {}
                await new Promise(function (r) {
                  setTimeout(r, 700);
                });
              }
              await osgAvatarSpeakLine(step.text, {
                gesture: step.gesture || "help",
                pointTarget: step.sel,
                pointDuration: 4200,
                speechKey: step.speechKey || "",
              });
              await new Promise(function (r) {
                setTimeout(r, 320);
              });
            }

            await osgAvatarSpeakLine(pack.avatarTourDone || "", {
              gesture: "acknowledge",
              pointTarget: container,
              pointDuration: 6800,
              speechKey: "avatarTourDone",
            });

            try {
              localStorage.setItem(OSG_TOUR_SEEN_KEY, "1");
            } catch (_) {}
          } finally {
            avatarTourRunning = false;
            busy = false;
            waiActive = false;
            container.classList.remove("is-busy");
            osgAvatarGestureStop();
            osgTweenAvatarReturn();
          }
        }

        window.osgAvatarTour = osgAvatarTour;
        window.osgAvatarSpeakLine = osgAvatarSpeakLine;

        function osgAvatarFinancePack() {
          try {
            if (typeof osgAvatarCompanionPack === "function") {
              return osgAvatarCompanionPack();
            }
          } catch (_) {}
          return (
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {}) ||
            {}
          );
        }

        function osgAvatarFinanceCategoryKey(category) {
          var c = String(category || "finance").toLowerCase();
          if (c === "credit") return "avatarFinanceGuideCreditTts";
          if (c === "insurance") return "avatarFinanceGuideInsuranceTts";
          return "avatarFinanceGuideFinanceTts";
        }

        function osgAvatarFinanceChannelCategory(channel) {
          var ch = String(channel || "").toLowerCase();
          if (ch === "bank") return "finance";
          if (ch === "insurance") return "insurance";
          return null;
        }

        function osgAvatarFinanceTopicDetect(text) {
          var t = String(text || "").toLowerCase();
          if (!t.trim()) return false;
          return /(?:kredit|credit|zins|loan|versicher|insur|finance|finanz|bank|hypothek|mortgage|roojai|kasikorn|card|immobil|real[\s-]?estate|wohnung|haus|miete|auto[\s-]?kauf|fahrzeug|dealer|บัตร|ประกัน|ดอกเบี้ย|อสังห|รถยนต์|贷款|保险|利息|房产|汽车|кредит|страхов|недвижим|авто|ubezpieczen|kredyt|odsetk|nieruchom)/i.test(
            t
          );
        }

        var osgAvatarWinkTimer = 0;
        var osgAvatarLangSwitchAckTimer = 0;
        var osgAvatarMagicianTimers = [];
        var osgAvatarEmpathyTimer = 0;
        var osgAvatarHeartsTimer = 0;
        var osgAvatarNotebookTimer = 0;
        const osgAvatarController = {
          financeCategories: ["credit", "insurance", "finance"],

          pack: osgAvatarFinancePack,

          requiresComplianceDisclaimer: function (opts) {
            opts = opts || {};
            if (opts.compliance === true || opts.complianceDisclaimer === true)
              return true;
            var cat = String(
              opts.category || opts.channel || opts.sector || ""
            ).toLowerCase();
            if (cat === "bank") cat = "finance";
            if (
              cat === "real_estate" ||
              cat === "immo" ||
              cat === "insurance" ||
              cat === "finance" ||
              cat === "credit" ||
              cat === "dealer" ||
              cat === "automotive"
            ) {
              return true;
            }
            if (opts.certRealm) {
              var cert = String(opts.certRealm).toLowerCase();
              if (
                cert === "automotive" ||
                cert === "real_estate" ||
                cert === "insurance"
              ) {
                return true;
              }
            }
            if (
              window.OSG_PAULI_PERSONA &&
              typeof window.OSG_PAULI_PERSONA.isComplianceChannel ===
                "function" &&
              window.OSG_PAULI_PERSONA.isComplianceChannel(
                opts.channel,
                opts.certRealm
              )
            ) {
              return true;
            }
            if (opts.moduleId && window.OSG_PSYCHOLOGY_PROMPTS) {
              var psych = window.OSG_PSYCHOLOGY_PROMPTS;
              if (typeof psych.moduleRequiresCompliance === "function") {
                return psych.moduleRequiresCompliance(opts.moduleId);
              }
            }
            return false;
          },

          speakPsychModule: async function (moduleId, opts) {
            opts = opts || {};
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!psych || typeof psych.getModule !== "function") return false;
            moduleId = String(moduleId || "").trim();
            if (!moduleId) return false;
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            if (typeof psych.resolvePsychModuleId === "function") {
              moduleId = psych.resolvePsychModuleId(moduleId, langCode);
            }
            var mod = psych.getModule(langCode, moduleId);
            if (!mod || !mod.tts) return false;
            if (/^gift_bundle/.test(moduleId)) {
              var CT = window.OSG_CULTURAL_TRENDS;
              if (CT && typeof CT.enrichGiftModule === "function") {
                mod = CT.enrichGiftModule(moduleId, mod, langCode);
              }
            }
            var name =
              typeof osgResolveCustomerDisplayName === "function"
                ? osgResolveCustomerDisplayName()
                : "";
            var line =
              typeof psych.formatModuleLine === "function"
                ? psych.formatModuleLine(mod, name, opts.extras)
                : mod.tts;
            if (
              this.requiresComplianceDisclaimer({
                moduleId: moduleId,
                complianceDisclaimer: mod.complianceDisclaimer,
              })
            ) {
              await this.speakDisclaimer({
                pack: opts.pack,
                langCode: langCode,
                category: opts.category,
              });
            }
            var bubble = String(
              (typeof psych.formatModuleBubble === "function"
                ? psych.formatModuleBubble(mod, name, opts.extras)
                : mod.bubble || line) || line
            ).trim();
            try {
              if (
                typeof window.pauliLiveCaptionShow === "function" &&
                bubble
              ) {
                window.pauliLiveCaptionShow(bubble);
              }
            } catch (_) {}
            await osgAvatarSpeakLine(line, {
              gesture: opts.gesture || "help",
              speechKey: mod.speechKey || "psychCrossToolsTts",
              pointDuration: this.estimateSpeechMs(line),
              pointTarget: container,
              langCode: langCode,
              skipTravel: opts.skipTravel,
              returnHome: opts.returnHome,
              allowMishap: opts.allowMishap,
              pack: opts.pack,
            });
            if (moduleId === "cross_authenticity") {
              this.triggerWink(this.estimateSpeechMs(line));
            }
            return true;
          },

          speakCrossSellModule: async function (moduleId, opts) {
            opts = opts || {};
            if (avatarTourRunning) return false;
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!psych || !psych.mayFire) return false;
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            if (typeof psych.resolvePsychModuleId === "function") {
              moduleId = psych.resolvePsychModuleId(moduleId, langCode);
            }
            moduleId = String(moduleId || "").trim();
            if (!moduleId) return false;
            if (!psych.mayFire("cross_" + moduleId)) return false;
            psych.markFired("cross_" + moduleId);
            if (/^gift_bundle/.test(moduleId)) {
              var CT = window.OSG_CULTURAL_TRENDS;
              if (CT && typeof CT.pickSocialCoach === "function") {
                var coach = CT.pickSocialCoach(langCode);
                if (coach && coach.tts) {
                  try {
                    if (
                      typeof window.pauliLiveCaptionShow === "function" &&
                      coach.bubble
                    ) {
                      window.pauliLiveCaptionShow(coach.bubble);
                    }
                  } catch (_) {}
                  await osgAvatarSpeakLine(coach.tts, {
                    gesture: "help",
                    speechKey: coach.speechKey || "culturalSocialCoachTts",
                    pointDuration: this.estimateSpeechMs(coach.tts),
                    pointTarget: container,
                    langCode: langCode,
                    skipTravel: true,
                    returnHome: false,
                  });
                }
              }
              if (moduleId === "gift_bundle_th") {
                try {
                  if (typeof beginWai === "function") beginWai();
                } catch (_) {}
                if (typeof osgEchoProtocol === "function") {
                  osgEchoProtocol("respect_escalation", {
                    moduleId: moduleId,
                    gesture: "wai",
                  });
                }
              }
            }
            var ok = await this.speakPsychModule(moduleId, opts);
            if (ok && window.OSG_CROSS_SELL_LOGIC) {
              try {
                window.OSG_CROSS_SELL_LOGIC.focusHint(moduleId);
              } catch (_) {}
            }
            return ok;
          },

          speakInclusionBuddy: async function (moduleId, opts) {
            opts = opts || {};
            if (avatarTourRunning) return false;
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            var inc = window.OSG_INCLUSION_LOGIC;
            if (!psych || !inc) return false;
            moduleId = String(moduleId || "inclusion_click").trim();
            var fireKey = "inclusion_" + moduleId;
            if (!psych.mayFire(fireKey)) return false;
            psych.markFired(fireKey);
            if (typeof inc.persistPrefs === "function") {
              inc.persistPrefs(
                moduleId === "inclusion_read" ? "read_aloud" : "click_assist"
              );
            }
            return this.speakPsychModule(moduleId, {
              langCode: opts.langCode,
              pack: opts.pack,
              gesture: "greet",
            });
          },

          speakLangSwitchProactive: async function (opts) {
            opts = opts || {};
            if (avatarTourRunning) return false;
            var LS = window.OSG_LANG_SWITCH_LOGIC;
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!LS || !psych) return false;
            var uiLang =
              opts.langCode ||
              (LS.resolveUiLang ? LS.resolveUiLang() : "en");
            if (!LS.mayProactiveOffer(uiLang)) return false;
            if (!psych.mayFire("lang_switch_proactive")) return false;
            psych.markFired("lang_switch_proactive");
            LS.markProactiveOffered();
            var alt = LS.proactiveAltLang(uiLang);
            if (!alt) return false;
            return this.speakPsychModule("lang_switch_proactive", {
              langCode: uiLang,
              pack: opts.pack,
              extras: { altLang: LS.langDisplayName(alt, uiLang) },
              skipTravel: true,
              skipBridge: true,
              bridge: false,
            });
          },

          speakHeroCouponMoment: async function (opts) {
            opts = opts || {};
            if (avatarTourRunning) return false;
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            var persona = window.OSG_PAULI_PERSONA;
            if (!psych || !persona) return false;
            var amount =
              typeof opts.couponAmount === "number" && opts.couponAmount > 0
                ? opts.couponAmount
                : typeof persona.pickHeroCouponThb === "function"
                  ? persona.pickHeroCouponThb()
                  : 35;
            if (opts.skipCooldown !== true) {
              if (!psych.mayFire("hero_coupon")) return false;
              psych.markFired("hero_coupon");
            }
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            var scan = psych.getModule(langCode, "hero_savings_scan");
            if (scan && scan.tts) {
              await this.speakPsychModule("hero_savings_scan", {
                langCode: langCode,
                pack: opts.pack,
                gesture: "help",
              });
              await new Promise(function (r) {
                setTimeout(r, 320);
              });
            }
            this.triggerWink(
              this.estimateSpeechMs(
                (psych.getModule(langCode, "hero_coupon") || {}).tts || ""
              )
            );
            return this.speakPsychModule("hero_coupon", {
              langCode: langCode,
              pack: opts.pack,
              gesture: "confirm",
              extras: { amount: amount },
            });
          },

          speakCheckoutPurchaseChain: async function (opts) {
            opts = opts || {};
            if (avatarTourRunning) return false;
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            var persona = window.OSG_PAULI_PERSONA;
            var CS = window.OSG_CROSS_SELL_LOGIC;
            if (!psych || !persona) return false;
            var amount =
              typeof persona.pickHeroCouponThb === "function"
                ? persona.pickHeroCouponThb()
                : 35;
            if (typeof persona.primeHeroCheckoutBuffer === "function") {
              persona.primeHeroCheckoutBuffer();
            }
            var spokeHero = await this.speakHeroCouponMoment({
              langCode: opts.langCode,
              pack: opts.pack,
              couponAmount: amount,
              skipCooldown: opts.skipCooldown,
              skipTravel: true,
              returnHome: false,
            });
            if (persona.revealHeroCheckoutBuffer) {
              persona.revealHeroCheckoutBuffer(amount);
            }
            try {
              if (typeof window.osgRefreshCheckoutHeroPrices === "function") {
                window.osgRefreshCheckoutHeroPrices();
              }
            } catch (_) {}
            if (!spokeHero || !CS || typeof CS.moduleAfterPurchase !== "function") {
              return spokeHero;
            }
            var mod = CS.moduleAfterPurchase(
              opts.partner,
              opts.channel,
              opts.certRealm
            );
            if (!mod) return spokeHero;
            var fireKey = "post_purchase_" + mod;
            if (!psych.mayFire(fireKey)) return spokeHero;
            psych.markFired(fireKey);
            await this.speakPsychModule(mod, {
              langCode: opts.langCode,
              pack: opts.pack,
              gesture: "help",
              skipTravel: true,
              returnHome: false,
            });
            try {
              CS.focusHint(mod);
            } catch (_) {}
            return true;
          },

          speakPurchaseUrgency: async function (opts) {
            opts = opts || {};
            if (avatarTourRunning || busy || osgPauliLiveActive) return false;
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!psych) return false;
            if (!psych.mayFire("purchase_urgency")) return false;
            psych.markFired("purchase_urgency");
            return this.speakPsychModule("purchase_urgency", {
              langCode: opts.langCode,
              pack: opts.pack,
              gesture: "help",
            });
          },

          disclaimerLine: function (pack) {
            pack = pack || osgAvatarFinancePack();
            return String(pack.avatarFinanceDisclaimerTts || "").trim();
          },

          guideLine: function (pack, category) {
            pack = pack || osgAvatarFinancePack();
            var key = osgAvatarFinanceCategoryKey(category);
            return String((pack && pack[key]) || "").trim();
          },

          estimateSpeechMs: function (line) {
            var s = String(line || "");
            return Math.min(12000, Math.max(2200, s.length * 72));
          },

          triggerWink: function (durationMs) {
            var stage = document.getElementById("coin-stage");
            if (!stage) return;
            var ms =
              typeof durationMs === "number"
                ? Math.max(400, durationMs)
                : 2600;
            try {
              if (osgAvatarWinkTimer) clearTimeout(osgAvatarWinkTimer);
            } catch (_) {}
            stage.classList.remove("is-wink");
            void stage.offsetWidth;
            stage.classList.add("is-wink");
            osgAvatarWinkTimer = setTimeout(function () {
              stage.classList.remove("is-wink");
              osgAvatarWinkTimer = 0;
            }, ms);
          },

          triggerLangSwitchAck: function () {
            return this.triggerMagicianLangSwitch();
          },

          _clearMagicianSwitchClasses: function (stage) {
            if (!stage) return;
            stage.classList.remove(
              "is-magician-switch",
              "is-magician-tap",
              "is-magician-sparkle",
              "is-magician-snap",
              "is-magician-out"
            );
          },

          _clearMagicianTimers: function () {
            var i;
            for (i = 0; i < osgAvatarMagicianTimers.length; i += 1) {
              try {
                clearTimeout(osgAvatarMagicianTimers[i]);
              } catch (_) {}
            }
            osgAvatarMagicianTimers = [];
            try {
              if (osgAvatarLangSwitchAckTimer) {
                clearTimeout(osgAvatarLangSwitchAckTimer);
              }
            } catch (_) {}
            osgAvatarLangSwitchAckTimer = 0;
          },

          triggerMagicianLangSwitch: function (onSnap) {
            var stage = document.getElementById("coin-stage");
            var self = this;
            if (!stage) return Promise.resolve();
            this._clearMagicianTimers();
            try {
              if (typeof window.pauliLiveCaptionClear === "function") {
                window.pauliLiveCaptionClear();
              }
            } catch (_) {}
            self._clearMagicianSwitchClasses(stage);
            void stage.offsetWidth;
            stage.classList.add("is-magician-switch");

            var SNAP_MS = 1280;
            var END_MS = 2200;

            function arm(ms, fn) {
              var id = setTimeout(fn, ms);
              osgAvatarMagicianTimers.push(id);
            }

            return new Promise(function (resolve) {
              arm(360, function () {
                stage.classList.add("is-magician-tap");
              });
              arm(680, function () {
                stage.classList.add("is-magician-sparkle");
                if (typeof playMagicianSparkleSynth === "function") {
                  playMagicianSparkleSynth();
                }
              });
              arm(1080, function () {
                stage.classList.add("is-magician-snap");
              });
              arm(SNAP_MS, function () {
                try {
                  if (typeof onSnap === "function") {
                    Promise.resolve(onSnap()).catch(function () {});
                  }
                } catch (_) {}
                stage.classList.add("is-magician-out");
              });
              osgAvatarLangSwitchAckTimer = setTimeout(function () {
                self._clearMagicianSwitchClasses(stage);
                self._clearMagicianTimers();
                resolve();
              }, END_MS);
              osgAvatarMagicianTimers.push(osgAvatarLangSwitchAckTimer);
            });
          },

          clearVerliebtAnimations: function () {
            var stage = document.getElementById("coin-stage");
            if (!stage) return;
            try {
              if (osgAvatarEmpathyTimer) clearTimeout(osgAvatarEmpathyTimer);
              if (osgAvatarHeartsTimer) clearTimeout(osgAvatarHeartsTimer);
              if (osgAvatarNotebookTimer) clearTimeout(osgAvatarNotebookTimer);
            } catch (_) {}
            osgAvatarEmpathyTimer = 0;
            osgAvatarHeartsTimer = 0;
            osgAvatarNotebookTimer = 0;
            stage.classList.remove(
              "is-empathy-heart",
              "is-verliebt-hearts",
              "is-notebook-search"
            );
            stage.style.removeProperty("--pauli-heart-dur");
            stage.style.removeProperty("--pauli-empathy-dur");
            stage.style.removeProperty("--pauli-notebook-dur");
          },

          triggerNotebookSearch: function (durationMs) {
            var stage = document.getElementById("coin-stage");
            if (!stage) return;
            var ms =
              typeof durationMs === "number"
                ? Math.max(900, Math.min(3200, durationMs))
                : 1400;
            try {
              if (osgAvatarNotebookTimer) clearTimeout(osgAvatarNotebookTimer);
            } catch (_) {}
            stage.style.setProperty("--pauli-notebook-dur", ms + "ms");
            stage.classList.remove("is-notebook-search");
            void stage.offsetWidth;
            stage.classList.add("is-notebook-search");
            osgAvatarNotebookTimer = setTimeout(function () {
              stage.classList.remove("is-notebook-search");
              osgAvatarNotebookTimer = 0;
            }, ms + 60);
          },

          triggerEmpathyHeart: function (durationMs) {
            var stage = document.getElementById("coin-stage");
            if (!stage) return;
            var ms =
              typeof durationMs === "number"
                ? Math.max(800, Math.min(2400, durationMs))
                : 1200;
            try {
              if (osgAvatarEmpathyTimer) clearTimeout(osgAvatarEmpathyTimer);
            } catch (_) {}
            stage.style.setProperty("--pauli-empathy-dur", ms + "ms");
            stage.classList.remove("is-empathy-heart");
            void stage.offsetWidth;
            stage.classList.add("is-empathy-heart");
            osgAvatarEmpathyTimer = setTimeout(
              function () {
                stage.classList.remove("is-empathy-heart");
                osgAvatarEmpathyTimer = 0;
              },
              ms + 40
            );
          },

          triggerVerliebtHearts: function (durationMs, delayMs) {
            var stage = document.getElementById("coin-stage");
            if (!stage) return;
            var ms =
              typeof durationMs === "number"
                ? Math.max(850, Math.min(2600, durationMs))
                : 1150;
            var delay = typeof delayMs === "number" ? Math.max(0, delayMs) : 0;
            try {
              if (osgAvatarHeartsTimer) clearTimeout(osgAvatarHeartsTimer);
            } catch (_) {}
            var run = function () {
              stage.style.setProperty("--pauli-heart-dur", ms + "ms");
              stage.classList.remove("is-verliebt-hearts");
              void stage.offsetWidth;
              stage.classList.add("is-verliebt-hearts");
              osgAvatarHeartsTimer = setTimeout(function () {
                stage.classList.remove("is-verliebt-hearts");
                osgAvatarHeartsTimer = 0;
              }, ms + 160);
            };
            if (delay > 0) {
              osgAvatarHeartsTimer = setTimeout(run, delay);
            } else {
              run();
            }
          },

          playMishapSequence: async function (type, opts) {
            opts = opts || {};
            if (window.innerWidth <= 768) return false;
            var stage = document.getElementById("coin-stage");
            var host =
              typeof osgAvatarVisualHost === "function"
                ? osgAvatarVisualHost()
                : stage &&
                  stage.querySelector(".coin-visual-shadow-host--main");
            var M = window.OSG_AVATAR_MISHAP_LOGIC;
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!host || !M) return false;

            type = type || M.pickType();
            var modId = M.moduleIdForType(type);
            if (psych && !psych.mayFire(modId)) return false;
            if (psych) psych.markFired(modId);

            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            var line =
              psych && typeof psych.getMishapLine === "function"
                ? psych.getMishapLine(langCode, type)
                : "";
            var mod =
              psych && typeof psych.getModule === "function"
                ? psych.getModule(langCode, modId)
                : null;
            var bubble = mod && mod.bubble ? String(mod.bubble).trim() : "";

            osgAvatarStopTravelTween();
            container.classList.remove("is-avatar-running");
            host.classList.add("is-mishap-active", "is-mishap-" + type);

            if (bubble) {
              try {
                if (typeof window.pauliLiveCaptionShow === "function") {
                  window.pauliLiveCaptionShow(bubble);
                }
              } catch (_) {}
            }

            var duration = M.durationFor(type);
            var mishapSpeechKey =
              mod && mod.speechKey ? String(mod.speechKey).trim() : "";
            if (line) {
              await window.playPauliVoice(line, {
                whisper: true,
                langCode: langCode,
                speechKey: mishapSpeechKey,
              }).catch(function () {
                return speakPauliUtterance(line, true, langCode, {
                  speechKey: mishapSpeechKey,
                });
              });
            }

            await new Promise(function (r) {
              setTimeout(r, Math.round(duration * 0.74));
            });

            host.classList.remove("is-mishap-" + type);
            host.classList.add("is-mishap-recover");
            await new Promise(function (r) {
              setTimeout(r, 460);
            });
            host.classList.remove("is-mishap-active", "is-mishap-recover");
            return true;
          },

          speakVerliebtLine: async function (step, opts) {
            opts = opts || {};
            if (!step || !step.tts) return;
            var bubble = String(step.bubble || step.tts).trim();
            try {
              if (
                typeof window.pauliLiveCaptionShow === "function" &&
                bubble
              ) {
                window.pauliLiveCaptionShow(bubble);
              }
            } catch (_) {}
            await osgAvatarSpeakLine(step.tts, {
              gesture: opts.gesture || "greet",
              speechKey: step.speechKey || "psychVerliebt1Tts",
              pointDuration: this.estimateSpeechMs(step.tts),
              pointTarget: container,
              langCode: opts.langCode,
              skipTravel: opts.skipTravel,
              returnHome: opts.returnHome,
              allowMishap: false,
            });
          },

          speakVerliebtChain: async function (opts) {
            opts = opts || {};
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            var EL = window.OSG_EMPATHY_LOGIC;
            if (!psych || typeof psych.getVerliebtSteps !== "function")
              return false;
            if (avatarTourRunning) return false;
            if (
              EL &&
              typeof EL.isEmpathyRetreatActive === "function" &&
              EL.isEmpathyRetreatActive()
            ) {
              return false;
            }
            var fireKey = "verliebt_mode";
            if (!psych.mayFire(fireKey)) return false;
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            var chain = psych.getVerliebtSteps(langCode);
            if (!chain || !chain.opener) return false;
            psych.markFired(fireKey);

            var openerMs = this.estimateSpeechMs(chain.opener.tts);
            var empathyMs = Math.round(openerMs * 0.58);
            var heartsMs = Math.round(openerMs * 0.95);
            this.clearVerliebtAnimations();
            this.triggerEmpathyHeart(empathyMs);
            this.triggerVerliebtHearts(heartsMs, 140);
            var speakPromise = this.speakVerliebtLine(chain.opener, {
              langCode: langCode,
              gesture: "greet",
              skipTravel: true,
              returnHome: false,
            });
            await speakPromise;

            var nbMs = this.estimateSpeechMs(chain.notebookA.tts);
            var nbMsB = this.estimateSpeechMs(chain.notebookB.tts);
            var pauseMs = Math.max(480, Math.min(720, Math.round(nbMs * 0.35)));
            this.triggerNotebookSearch(nbMs + pauseMs + nbMsB + 280);
            await this.speakVerliebtLine(chain.notebookA, {
              langCode: langCode,
              gesture: "help",
            });
            await new Promise(function (r) {
              setTimeout(r, pauseMs);
            });
            this.triggerWink(620);
            await new Promise(function (r) {
              setTimeout(r, 280);
            });
            await this.speakVerliebtLine(chain.notebookB, {
              langCode: langCode,
              gesture: "acknowledge",
            });

            await new Promise(function (r) {
              setTimeout(r, 220);
            });
            await this.speakVerliebtLine(chain.bridge, {
              langCode: langCode,
              gesture: "help",
            });

            var discMs = this.estimateSpeechMs(chain.disclaimer.tts);
            await this.speakVerliebtLine(chain.disclaimer, {
              langCode: langCode,
              gesture: "acknowledge",
            });

            try {
              if (EL && typeof EL.focusPartnerHint === "function") {
                EL.focusPartnerHint("verliebt_mode");
              }
            } catch (_) {}
            var giftMod =
              typeof psych.resolvePsychModuleId === "function"
                ? psych.resolvePsychModuleId("gift_bundle", langCode)
                : "gift_bundle";
            if (typeof this.speakCrossSellModule === "function") {
              await this.speakCrossSellModule(giftMod, {
                langCode: langCode,
                pack: opts.pack,
                skipTravel: true,
                returnHome: false,
              });
            }
            return true;
          },

          speakDisclaimer: async function (opts) {
            opts = opts || {};
            if (!this.requiresComplianceDisclaimer(opts)) return;
            var pack = opts.pack || osgAvatarFinancePack();
            var line = this.disclaimerLine(pack);
            if (!line) return;
            var bubble = String(
              pack.avatarFinanceDisclaimerBubble || line
            ).trim();
            var duration = this.estimateSpeechMs(line);
            try {
              if (typeof window.pauliLiveCaptionShow === "function" && bubble) {
                window.pauliLiveCaptionShow(bubble);
              }
            } catch (_) {}
            this.triggerWink(duration);
            await osgAvatarSpeakLine(line, {
              gesture: "acknowledge",
              speechKey: "avatarFinanceDisclaimerTts",
              pointDuration: duration,
              pointTarget: opts.pointTarget === false ? false : container,
              langCode: opts.langCode,
            });
          },

          speakFinanceRecommendation: async function (mainLine, opts) {
            opts = opts || {};
            var pack = opts.pack || osgAvatarFinancePack();
            var category = opts.category || "finance";
            var guide = this.guideLine(pack, category);
            var main = String(mainLine || "").trim();
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");

            if (guide && opts.guideFirst !== false) {
              await osgAvatarSpeakLine(guide, {
                gesture: "help",
                speechKey: osgAvatarFinanceCategoryKey(category),
                pointDuration: this.estimateSpeechMs(guide),
                pointTarget: container,
                langCode: langCode,
              });
            }
            if (main) {
              await osgAvatarSpeakLine(main, {
                gesture: opts.gesture || "confirm",
                speechKey: opts.speechKey || "partnerHandoffSpeakTts",
                pointDuration: this.estimateSpeechMs(main),
                pointTarget: container,
                langCode: langCode,
              });
            }
            if (!opts.skipDisclaimer) {
              await this.speakDisclaimer({
                pack: pack,
                langCode: langCode,
                pointTarget: container,
                category: category,
              });
            }
          },

          noPressureCheck: function (text, langCode) {
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!psych || typeof psych.isDecline !== "function") return false;
            return psych.isDecline(text);
          },

          speakNoPressureRelease: async function (opts) {
            opts = opts || {};
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!psych) return;
            var EL = window.OSG_EMPATHY_LOGIC;
            if (EL && typeof EL.markEmpathyRetreat === "function") {
              EL.markEmpathyRetreat();
            }
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            var np = psych.getNoPressure(langCode);
            if (!np || !np.tts) return;
            try {
              if (
                typeof window.pauliLiveCaptionShow === "function" &&
                np.bubble
              ) {
                window.pauliLiveCaptionShow(np.bubble);
              }
            } catch (_) {}
            await osgAvatarSpeakLine(np.tts, {
              gesture: "acknowledge",
              speechKey: np.speechKey || "psychNoPressureTts",
              pointDuration: this.estimateSpeechMs(np.tts),
              pointTarget: container,
              langCode: langCode,
            });
          },

          speakPsychologyTrigger: async function (moduleId, opts) {
            opts = opts || {};
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!psych || typeof psych.getModule !== "function") return false;
            if (avatarTourRunning || busy || osgPauliLiveActive) return false;
            moduleId = String(moduleId || "").trim();
            if (!moduleId) return false;
            if (!psych.mayFire(moduleId)) return false;
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            var mod = psych.getModule(langCode, moduleId);
            if (!mod || !mod.tts) return false;
            psych.markFired(moduleId);
            if (
              this.requiresComplianceDisclaimer({ moduleId: moduleId })
            ) {
              await this.speakDisclaimer({
                pack: opts.pack,
                langCode: langCode,
                pointTarget: opts.pointTarget,
                moduleId: moduleId,
              });
            }
            var bubble = String(mod.bubble || mod.tts).trim();
            try {
              if (
                typeof window.pauliLiveCaptionShow === "function" &&
                bubble
              ) {
                window.pauliLiveCaptionShow(bubble);
              }
            } catch (_) {}
            await osgAvatarSpeakLine(mod.tts, {
              gesture: "help",
              speechKey: mod.speechKey || "psychCreditViewTts",
              pointDuration: this.estimateSpeechMs(mod.tts),
              pointTarget: container,
              langCode: langCode,
            });
            return true;
          },

          isWegweiserMode: function () {
            try {
              return sessionStorage.getItem("osg-wegweiser-mode-v1") === "1";
            } catch (_) {
              return false;
            }
          },

          enterWegweiserMode: async function (opts) {
            opts = opts || {};
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            if (!psych) return false;
            if (avatarTourRunning || busy || osgPauliLiveActive) return false;
            var moduleId = String(opts.moduleId || "").trim();
            if (
              !moduleId &&
              typeof psych.clickModuleIdForCompliance === "function"
            ) {
              moduleId = psych.clickModuleIdForCompliance(
                opts.channel,
                opts.certRealm
              );
            }
            if (
              !moduleId &&
              opts.element &&
              typeof psych.moduleIdForLink === "function"
            ) {
              var cat = psych.moduleIdForLink(opts.element);
              if (cat) moduleId = cat + "_click";
            }
            if (!moduleId) return false;
            try {
              sessionStorage.setItem("osg-wegweiser-mode-v1", "1");
            } catch (_) {}
            return this.speakPsychologyTrigger(moduleId, {
              pack: opts.pack,
              langCode: opts.langCode,
              pointTarget: opts.pointTarget,
            });
          },

          speakEmpathyChain: async function (triggerId, opts) {
            opts = opts || {};
            var psych = window.OSG_PSYCHOLOGY_PROMPTS;
            var EL = window.OSG_EMPATHY_LOGIC;
            if (!psych || !EL || typeof psych.getEmpathySteps !== "function")
              return false;
            if (
              typeof EL.isEmpathyRetreatActive === "function" &&
              EL.isEmpathyRetreatActive()
            ) {
              return false;
            }
            triggerId = String(triggerId || "").trim();
            if (!triggerId) return false;
            if (avatarTourRunning) return false;
            var resolvedId = triggerId;
            if (typeof psych.resolveEmpathyTriggerId === "function") {
              resolvedId = psych.resolveEmpathyTriggerId(triggerId);
            } else if (window.OSG_EMPATHY_LOGIC && typeof window.OSG_EMPATHY_LOGIC.resolveTriggerId === "function") {
              resolvedId = window.OSG_EMPATHY_LOGIC.resolveTriggerId(triggerId);
            }
            var fireKey = "empathy_" + resolvedId;
            if (!psych.mayFire(fireKey)) return false;
            var I = window.__OSG_I18N;
            var langCode =
              opts.langCode || (I ? I.systemLangCode() : "en");
            var steps = psych.getEmpathySteps(langCode, triggerId, opts.userText);
            if (!steps || !steps.length) return false;
            psych.markFired(fireKey);
            var skipIntroDisclaimer = resolvedId === "relationship_bridge";
            if (!skipIntroDisclaimer) {
              await this.speakDisclaimer({
                pack: opts.pack,
                langCode: langCode,
                pointTarget: opts.pointTarget,
              });
            }
            var i;
            for (i = 0; i < steps.length; i++) {
              var step = steps[i];
              if (!step || !step.tts) continue;
              if (resolvedId === "relationship_bridge" && i === 0) {
                this.triggerEmpathyHeart(this.estimateSpeechMs(step.tts));
              }
              if (step.warmthGuarantee) {
                this.triggerWink(this.estimateSpeechMs(step.tts));
              }
              if (step.financeDisclaimer) {
                await this.speakDisclaimer({
                  pack: opts.pack,
                  langCode: langCode,
                  pointTarget: opts.pointTarget,
                  category: "real_estate",
                  compliance: true,
                });
              }
              var bubble = String(step.bubble || step.tts).trim();
              try {
                if (
                  typeof window.pauliLiveCaptionShow === "function" &&
                  bubble
                ) {
                  window.pauliLiveCaptionShow(bubble);
                }
              } catch (_) {}
              await osgAvatarSpeakLine(step.tts, {
                gesture:
                  step.warmthGuarantee
                    ? "acknowledge"
                    : i === 0
                      ? "greet"
                      : "help",
                speechKey: step.speechKey || "psychEmpathyGrief1Tts",
                pointDuration: this.estimateSpeechMs(step.tts),
                pointTarget: container,
                langCode: langCode,
              });
              if (i < steps.length - 1) {
                await new Promise(function (r) {
                  setTimeout(r, 380);
                });
              }
            }
            try {
              EL.focusPartnerHint(resolvedId);
            } catch (_) {}
            return true;
          },
        };

        window.osgAvatarController = osgAvatarController;
        window.osgAvatarFinanceTopicDetect = osgAvatarFinanceTopicDetect;
        window.osgAvatarFinanceChannelCategory = osgAvatarFinanceChannelCategory;

        function osgPsychologyClearHesitate(el) {
          if (!el) return;
          var t = el.__osgPsychHesTimer;
          if (t) {
            try {
              clearTimeout(t);
            } catch (_) {}
          }
          el.__osgPsychHesTimer = 0;
        }

        function osgPsychologyBindFinanceLink(el) {
          var psych = window.OSG_PSYCHOLOGY_PROMPTS;
          var AC = window.osgAvatarController;
          if (!psych || !AC || !el || el.dataset.osgPsychBound === "1") return;
          var cat = psych.moduleIdForLink(el);
          if (!cat) return;
          el.dataset.osgPsychBound = "1";
          var moduleId = cat + "_hesitate";
          el.addEventListener(
            "mouseenter",
            function () {
              osgPsychologyClearHesitate(el);
              el.__osgPsychHesTimer = setTimeout(function () {
                el.__osgPsychHesTimer = 0;
                void AC.speakPsychologyTrigger(moduleId, {});
              }, psych.HESITATE_MS || 2800);
            },
            { passive: true }
          );
          el.addEventListener(
            "mouseleave",
            function () {
              osgPsychologyClearHesitate(el);
            },
            { passive: true }
          );
          el.addEventListener(
            "click",
            function () {
              osgPsychologyClearHesitate(el);
            },
            { capture: true, passive: true }
          );
          el.addEventListener(
            "focus",
            function () {
              osgPsychologyClearHesitate(el);
              el.__osgPsychHesTimer = setTimeout(function () {
                el.__osgPsychHesTimer = 0;
                void AC.speakPsychologyTrigger(moduleId, {});
              }, (psych.HESITATE_MS || 2800) + 400);
            },
            { passive: true }
          );
          el.addEventListener(
            "blur",
            function () {
              osgPsychologyClearHesitate(el);
            },
            { passive: true }
          );
        }

        function osgPsychologyObserveFinanceViews() {
          var psych = window.OSG_PSYCHOLOGY_PROMPTS;
          var AC = window.osgAvatarController;
          if (!psych || !AC) return;
          if (window.__osgPsychIo) {
            try {
              window.__osgPsychIo.disconnect();
            } catch (_) {}
          }
          if (!window.__osgPsychViewSeen) window.__osgPsychViewSeen = {};
          var dwell = psych.VIEW_DWELL_MS || 1500;
          var pending = window.__osgPsychViewPending || {};
          window.__osgPsychIo = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (ent) {
                var a = ent.target;
                var cat = psych.moduleIdForLink(a);
                if (!cat) return;
                var moduleId = cat + "_view";
                if (!ent.isIntersecting || ent.intersectionRatio < 0.38) {
                  if (pending[moduleId]) {
                    clearTimeout(pending[moduleId]);
                    delete pending[moduleId];
                  }
                  return;
                }
                if (pending[moduleId]) return;
                pending[moduleId] = setTimeout(function () {
                  delete pending[moduleId];
                  void AC.speakPsychologyTrigger(moduleId, {});
                }, dwell);
              });
            },
            { threshold: [0.38, 0.55] }
          );
          document
            .querySelectorAll(
              'a.osg-affiliate-link[data-osg-channel="bank"],' +
                'a.osg-affiliate-link[data-osg-channel="insurance"],' +
                'a.osg-affiliate-link[data-osg-channel="real_estate"],' +
                'a.osg-affiliate-link[data-osg-channel="dealer"],' +
                'a.osg-affiliate-link[data-osg-partner="kasikorn"],' +
                'a.osg-affiliate-link[data-osg-partner="roojai"],' +
                'a.osg-affiliate-link[data-osg-cert-realm="real_estate"],' +
                'a.osg-affiliate-link[data-osg-cert-realm="automotive"]'
            )
            .forEach(function (el) {
              osgPsychologyBindFinanceLink(el);
              try {
                window.__osgPsychIo.observe(el);
              } catch (_) {}
            });
        }

        function osgPsychologyWireBinHesitateOnce() {
          if (window.__OSG_PSYCH_BIN_WIRED__) return;
          window.__OSG_PSYCH_BIN_WIRED__ = true;
          var binIn = document.getElementById("bin-check-input");
          if (!binIn) return;
          var psych = window.OSG_PSYCHOLOGY_PROMPTS;
          var AC = window.osgAvatarController;
          if (!psych || !AC) return;
          binIn.addEventListener(
            "focus",
            function () {
              osgPsychologyClearHesitate(binIn);
              binIn.__osgPsychHesTimer = setTimeout(function () {
                binIn.__osgPsychHesTimer = 0;
                var raw = String(binIn.value || "").replace(/\D/g, "");
                if (raw.length < 6) return;
                void AC.speakPsychologyTrigger("credit_hesitate", {});
              }, 4200);
            },
            { passive: true }
          );
          binIn.addEventListener(
            "blur",
            function () {
              osgPsychologyClearHesitate(binIn);
            },
            { passive: true }
          );
        }

        function osgPauliBindPurchaseHesitateLinks() {
          var psych = window.OSG_PSYCHOLOGY_PROMPTS;
          var AC = window.osgAvatarController;
          if (!psych || !AC) return;
          document
            .querySelectorAll(
              'a.osg-affiliate-link[data-osg-intent="purchase"],' +
                'a.osg-affiliate-link[data-osg-channel="marketplace"],' +
                'a.osg-affiliate-link[data-osg-channel="dealer"],' +
                'a.osg-affiliate-link[data-osg-channel="retail"],' +
                'a.osg-affiliate-link[data-osg-channel="beauty"]'
            )
            .forEach(function (el) {
              if (el.dataset.osgPurchaseHesBound === "1") return;
              var ch = String(
                el.getAttribute("data-osg-channel") || ""
              ).toLowerCase();
              if (
                window.OSG_PAULI_PERSONA &&
                window.OSG_PAULI_PERSONA.isComplianceChannel(ch)
              ) {
                return;
              }
              el.dataset.osgPurchaseHesBound = "1";
              el.addEventListener(
                "mouseenter",
                function () {
                  osgPsychologyClearHesitate(el);
                  el.__osgPsychHesTimer = setTimeout(function () {
                    el.__osgPsychHesTimer = 0;
                    void AC.speakPurchaseUrgency({});
                  }, (psych.HESITATE_MS || 2800) + 600);
                },
                { passive: true }
              );
              el.addEventListener(
                "mouseleave",
                function () {
                  osgPsychologyClearHesitate(el);
                },
                { passive: true }
              );
            });
        }

        function osgCrossSellBindAffiliateLinks() {
          /* Cross-Sell läuft nach Kauf via speakCheckoutPurchaseChain — kein Pre-Click. */
        }

        function osgWirePsychologyTriggersOnce() {
          if (window.__OSG_PSYCH_TRIGGERS_WIRED__) return;
          window.__OSG_PSYCH_TRIGGERS_WIRED__ = true;
          osgPsychologyObserveFinanceViews();
          osgPsychologyWireBinHesitateOnce();
          osgCrossSellBindAffiliateLinks();
          osgPauliBindPurchaseHesitateLinks();
        }

        window.osgPsychologyObserveFinanceViews = osgPsychologyObserveFinanceViews;
        window.osgWirePsychologyTriggersOnce = osgWirePsychologyTriggersOnce;

        async function osgAvatarCompanionBootVipSegment(pack) {
          if (window.__OSG_VIP_CULTURE_GREET_DONE__) return;
          pack =
            pack ||
            window.__OSG_AVATAR_VIP_GREET_PACK_SNAPSHOT__ ||
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          const lineFn = window.osgVipCultureLineFromPack;
          const line = lineFn ? lineFn(pack) : "";
          if (!line) return;
          const pendingFn = window.osgVipScanPendingForAvatar;
          if (
            !(pendingFn && pendingFn()) &&
            !window.__OSG_AVATAR_VIP_GREET_PENDING__
          ) {
            return;
          }
          window.__OSG_VIP_CULTURE_GREET_DONE__ = true;
          window.__OSG_AVATAR_VIP_GREET_PENDING__ = false;
          const bubble = String(pack.vipCultureGreetBubble || line).trim();
          try {
            if (typeof window.pauliLiveCaptionShow === "function" && bubble) {
              window.pauliLiveCaptionShow(bubble);
            }
          } catch (_) {}
          await osgAvatarSpeakLine(line, {
            gesture: "greet",
            speechKey: pack.welcome_greeting
              ? "welcome_greeting"
              : pack.welcome_greeting_pl
                ? "welcome_greeting_pl"
                : "vipCultureGreetTts",
            pointDuration: Math.min(14000, Math.max(6200, line.length * 75)),
            pointTarget: container,
          });
        }

        async function osgAvatarCompanionBoot() {
          if (window.__OSG_AVATAR_COMPANION_BOOT_RUNNING__) {
            window.__OSG_AVATAR_COMPANION_BOOT_RETRY__ = true;
            return;
          }
          if (window.__OSG_AVATAR_COMPANION_BOOT_DONE__) return;
          if (osgPauliLiveActive) return;
          window.__OSG_AVATAR_COMPANION_BOOT_RUNNING__ = true;
          try {
            if (typeof window.osgClearComplaintConversationState === "function") {
              window.osgClearComplaintConversationState();
            }
          } catch (_) {}
          busy = true;
          container.classList.add("is-busy");
          try {
            osgRefreshAvatarLockUi();
            if (
              typeof osgAvatarAccessUnlocked === "function" &&
              !osgAvatarAccessUnlocked()
            ) {
              if (
                window.OSG_PauliAvatarAnimations &&
                typeof window.OSG_PauliAvatarAnimations.setState === "function"
              ) {
                window.OSG_PauliAvatarAnimations.setState("idle");
              }
              return;
            }
            if (window.OSG_AVATAR_LOCALE) {
              await window.OSG_AVATAR_LOCALE.loadAvatarPacks({});
            }
            const pack =
              (typeof osgAvatarCompanionPack === "function"
                ? osgAvatarCompanionPack()
                : null) ||
              window.__OSG_CURRENT_PACK_CACHE ||
              (typeof T !== "undefined" ? T.de : {});

            const SB = window.OSG_STARTUP_BOOT;

            if (SB && typeof SB.runTrustPledgePresentation === "function") {
              await SB.runTrustPledgePresentation(pack, {
                gesture: function (type) {
                  if (typeof osgAvatarGestureStart === "function") {
                    osgAvatarGestureStart(type || "help", 2200);
                  }
                },
                speakLine: function (line, opts) {
                  return osgAvatarSpeakLine(line, Object.assign({}, opts || {}, {
                    pointTarget: container,
                    pointDuration: Math.min(
                      16000,
                      Math.max(5200, String(line || "").length * 78)
                    ),
                  }));
                },
              });
            }

            if (
              window.osgAvatarController &&
              typeof window.osgAvatarController.speakLangSwitchProactive ===
                "function"
            ) {
              await window.osgAvatarController.speakLangSwitchProactive({
                pack: pack,
              });
            }
            if (
              window.__OSG_AVATAR_VIP_GREET_PENDING__ ||
              (window.osgVipScanPendingForAvatar &&
                window.osgVipScanPendingForAvatar())
            ) {
              const vipPack =
                window.__OSG_AVATAR_VIP_GREET_PACK_SNAPSHOT__ || pack;
              await osgAvatarCompanionBootVipSegment(vipPack);
            }
          } catch (_) {
          } finally {
            window.__OSG_AVATAR_COMPANION_BOOT_RUNNING__ = false;
            busy = false;
            container.classList.remove("is-busy");
            window.__OSG_AVATAR_COMPANION_BOOT_DONE__ = true;
            if (window.__OSG_AVATAR_COMPANION_BOOT_RETRY__) {
              window.__OSG_AVATAR_COMPANION_BOOT_RETRY__ = false;
              // Cap retries to prevent repeated playback loops
              var _retryCount = (window.__OSG_AVATAR_COMPANION_BOOT_RETRY_COUNT__ || 0) + 1;
              window.__OSG_AVATAR_COMPANION_BOOT_RETRY_COUNT__ = _retryCount;
              if (_retryCount <= 1 && typeof window.osgScheduleAvatarCompanionBoot === "function") {
                window.osgScheduleAvatarCompanionBoot(220);
              }
            } else {
              window.__OSG_AVATAR_COMPANION_BOOT_RETRY_COUNT__ = 0;
            }
          }
        }

        window.osgAvatarCompanionBoot = osgAvatarCompanionBoot;

        function osgAvatarTourBoot() {
          // Auto-tour disabled: reading all page sections on load blocks the live mic
          // and causes overlapping TTS. Tour can be triggered via voice command only.
          try { localStorage.setItem(OSG_TOUR_SEEN_KEY, "1"); } catch (_) {}
        }

        window.osgAvatarTourBoot = osgAvatarTourBoot;

        let autoWaiDone = false;
        let introRetryOnGesture = false;
        let osgAudioUnlockGestureDone = false;
        let osgCoinIntroGestureDone = false;

        function osgResolvePauliPackLine(code, key) {
          const I = window.__OSG_I18N;
          const c = I ? I.normalizeLang(String(code || "en")) : "en";
          const pack = I && I.T && I.T[c];
          const de = I && I.T && I.T.de;
          const en = I && I.T && I.T.en;
          return (
            (pack && pack[key]) ||
            (de && de[key]) ||
            (en && en[key]) ||
            ""
          );
        }

        function osgResolveIntroLine(code) {
          return osgResolvePauliPackLine(code, "pauliIntroTts");
        }

        function osgResolveSawadeeCaption(code) {
          return (
            osgResolvePauliPackLine(code, "pauliSawadeeTts") || "สวัสดีครับ"
          );
        }

        function getSpruecheForLang(code) {
          const I = window.__OSG_I18N;
          const c = I ? I.normalizeLang(String(code || "en")) : "en";
          const pack = (I && I.T && I.T[c]) || (I && I.T && I.T.de) || {};
          return ["pauliSpruch0", "pauliSpruch1", "pauliSpruch2"]
            .map(function (k) {
              return pack[k] ? String(pack[k]) : "";
            })
            .filter(Boolean);
        }

        function installOsgGlobalFirstGestureUnlock() {
          async function onFirstUserGesture(ev) {
            if (osgEventTargetsStaticStand(ev)) return;

            if (!osgAudioUnlockGestureDone) {
              osgAudioUnlockGestureDone = true;
              unlockAudioSystemFromCoinGesture();
              try {
                const ctx = window.__OSG_audioCtxUnlock;
                if (ctx && ctx.state === "suspended") await ctx.resume();
              } catch (_) {}
              if (typeof osgWakeMaybeStart === "function") {
                setTimeout(osgWakeMaybeStart, 280);
              }
            }

            // After session greeting: mic only via explicit wake-button tap (no auto document listener).

            // Session greeting audio only on explicit coin / wake start — not on first page gesture.

            if (!osgEventTargetsCoinStage(ev)) return;
            if (osgCoinIntroGestureDone) return;
            osgCoinIntroGestureDone = true;
            autoWaiDone = true;
          }
          document.body.addEventListener("touchstart", onFirstUserGesture, {
            capture: true,
            passive: true,
          });
          document.body.addEventListener("click", onFirstUserGesture, {
            capture: true,
          });
          document.body.addEventListener("keydown", onFirstUserGesture, {
            capture: true,
          });
        }

        async function tryAutoplayIntroOnLoad() {
          /* Autostart-Vorlagen (pauliIntro / Sawadee-MP3) deaktiviert — nur Live-Gespräch. */
        }

        async function osgPlayIntroOnLoad() {
          /* Kein automatisches Abspielen alter Vorlagen-Aufnahmen mehr. */
        }

        /** Lokale Pauli-Stimme (Aufnahme deines Bekannten) — kein ElevenLabs nötig. */
        const OSG_PAULI_LOCAL_VOICE_ROOTS = [
          "/sounds/pauli/",
          "./sounds/pauli/",
          "/public/sounds/pauli/",
          "./public/sounds/pauli/",
        ];
        const OSG_PAULI_LOCAL_VOICE_EXTS = [".m4a", ".mp3", ".wav"];
        /** i18n speechKey → Dateiname in public/sounds/pauli/th/ (voice-script-de.json) */
        const OSG_PAULI_SPEECH_KEY_ALIASES = {
          pauliSawadeeTts: "pauliSawadee",
          avatarStartupSawadeeTts: "pauliSawadee",
          pauliIntroTts: "pauliIntro",
          avatarStartupGreetLine: "pauliIntro",
          avatarCompanionIntroLine: "pauliIntro",
          accessibility_activated: "accessibility_activated",
          search_processing: "search_processing",
          fun_crab_instinct: "fun_crab_instinct",
          intentAccessibilityTts: "accessibility_activated",
          intentReadPriceTts: "search_processing",
          intentFunCrabTts: "fun_crab_instinct",
        };

        function osgPauliResolveSpeechFileKeys(speechKey) {
          const key = String(speechKey || "").trim();
          if (!key) return [];
          const out = [key];
          const alias = OSG_PAULI_SPEECH_KEY_ALIASES[key];
          if (alias && out.indexOf(alias) < 0) out.push(alias);
          if (/Tts$/i.test(key)) {
            const base = key.replace(/Tts$/i, "");
            if (base && out.indexOf(base) < 0) out.push(base);
          }
          return out;
        }

        function osgPauliNormVoiceLine(s) {
          return String(s || "")
            .replace(/\{NAME\}/gi, "")
            .replace(/\{KW\}/gi, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
        }

        function osgPauliResolveSpeechKeyFromText(text, langCode) {
          const spokenNorm = osgPauliNormVoiceLine(text);
          if (!spokenNorm || spokenNorm.length < 6) return "";
          const langs = [];
          const pushLang = function (lc) {
            const code =
              window.__OSG_I18N && window.__OSG_I18N.normalizeLang
                ? window.__OSG_I18N.normalizeLang(lc)
                : String(lc || "").toLowerCase();
            if (code && langs.indexOf(code) < 0) langs.push(code);
          };
          pushLang(langCode);
          pushLang("th");
          pushLang("en");
          pushLang("de");
          let bestKey = "";
          let bestLen = 0;
          for (let li = 0; li < langs.length; li += 1) {
            const lc = langs[li];
            const pack =
              (typeof T !== "undefined" && T[lc]) ||
              (window.__OSG_I18N &&
                window.__OSG_I18N.T &&
                window.__OSG_I18N.T[lc]);
            if (!pack) continue;
            const keys = Object.keys(pack);
            for (let ki = 0; ki < keys.length; ki += 1) {
              const i18nKey = keys[ki];
              if (
                i18nKey === "intro" ||
                i18nKey === "introTitle" ||
                /IntroTitle$/i.test(i18nKey)
              ) {
                continue;
              }
              if (
                !/(Tts|Speak|Greet|Sawadee|Spruch|Line|Voice|Briefing)$/i.test(
                  i18nKey
                )
              ) {
                continue;
              }
              const lineNorm = osgPauliNormVoiceLine(pack[i18nKey]);
              if (!lineNorm || lineNorm.length < 6) continue;
              const head = Math.min(48, spokenNorm.length, lineNorm.length);
              const spokenHead = spokenNorm.slice(0, head);
              const lineHead = lineNorm.slice(0, head);
              if (
                spokenNorm.indexOf(lineHead) >= 0 ||
                lineNorm.indexOf(spokenHead) >= 0
              ) {
                if (lineNorm.length > bestLen) {
                  bestLen = lineNorm.length;
                  bestKey = i18nKey;
                }
              }
            }
          }
          return bestKey;
        }

        const osgPauliBundledVoiceCache = { buffers: null };

        async function osgPauliPreloadBundledVoice() {
          if (osgPauliBundledVoiceCache.buffers) return;
          const bufs = [];
          for (let i = 0; i < OSG_PAULI_BUNDLED_VOICE_URLS.length; i += 1) {
            const url = OSG_PAULI_BUNDLED_VOICE_URLS[i];
            try {
              const res = await fetch(url, { credentials: "same-origin" });
              if (!res.ok) continue;
              const arrayBuf = await res.arrayBuffer();
              if (!arrayBuf || arrayBuf.byteLength < 128) continue;
              const ext = url.slice(url.lastIndexOf(".")).toLowerCase();
              const mimeType =
                ext === ".m4a"
                  ? "audio/mp4"
                  : ext === ".wav"
                  ? "audio/wav"
                  : "audio/mpeg";
              bufs.push({ url: url, buf: arrayBuf, mimeType: mimeType });
              if (bufs.length >= 2) break;
            } catch (_) {}
          }
          if (bufs.length) osgPauliBundledVoiceCache.buffers = bufs;
        }
        const OSG_PAULI_BUNDLED_VOICE_URLS = [
          "/sounds/pauli/Einzige_Stimme_Paulis-Avatar.mp3",
        ];

        function osgPauliLocalVoiceUrlCandidates(speechKey, langCode, whisper) {
          const fileKeys = osgPauliResolveSpeechFileKeys(speechKey);
          if (!fileKeys.length) return [];
          const lang = String(langCode || "th").toLowerCase();
          const langs = lang === "th" ? ["th"] : [lang, "th"];
          const urls = [];
          fileKeys.forEach(function (key) {
            const keyNames = whisper ? [key + "-whisper", key] : [key];
            langs.forEach(function (lc) {
              keyNames.forEach(function (kn) {
                OSG_PAULI_LOCAL_VOICE_EXTS.forEach(function (ext) {
                  OSG_PAULI_LOCAL_VOICE_ROOTS.forEach(function (root) {
                    urls.push(root + lc + "/" + kn + ext);
                  });
                });
              });
            });
          });
          return urls;
        }

        async function playPauliLocalVoiceFile(opts) {
          opts = opts || {};
          const urls = osgPauliLocalVoiceUrlCandidates(
            opts.speechKey,
            opts.langCode,
            opts.whisper
          );
          let lastErr = null;
          for (let i = 0; i < urls.length; i += 1) {
            const url = urls[i];
            try {
              const res = await fetch(url, { credentials: "same-origin" });
              if (!res.ok) continue;
              const arrayBuf = await res.arrayBuffer();
              if (!arrayBuf || arrayBuf.byteLength < 128) continue;
              const ext = url.slice(url.lastIndexOf(".")).toLowerCase();
              const mimeType =
                ext === ".m4a"
                  ? "audio/mp4"
                  : ext === ".wav"
                  ? "audio/wav"
                  : "audio/mpeg";
              await playPauliAudioBuffer(arrayBuf, {
                whisper: !!opts.whisper,
                mimeType,
                fullVolume: true,
              });
              return true;
            } catch (e) {
              lastErr = e;
            }
          }
          if (lastErr) throw lastErr;
          return false;
        }

        window.__OSG_activePauliBufferSource = null;
        window.__OSG_activePauliHtmlAudio = null;
        window.currentAudioSource = null;

        window.osgPauliStopActivePlayback = function () {
          if (typeof window.stopAllSpeech === "function") {
            window.stopAllSpeech();
          }
        };

        async function playPauliAudioBuffer(arrayBuf, opts) {
          if (
            typeof osgPauliAudioAllowed === "function" &&
            !osgPauliAudioAllowed()
          ) {
            return;
          }
          if (typeof window.stopAllSpeech === "function") {
            window.stopAllSpeech();
          }
          const whisper = !!(opts && opts.whisper);
          const mimeType =
            (opts && opts.mimeType) || "audio/mpeg";
          const Ctx = window.AudioContext || window.webkitAudioContext;
          const gainVal =
            opts && opts.fullVolume ? 1.0 : whisper ? 0.28 : 1.0;

          function playWithAnalyser(ctx, audioBuffer, extraNode) {
            return new Promise((resolve) => {
              if (typeof window.stopAllSpeech === "function") {
                window.stopAllSpeech();
              }
              const src = ctx.createBufferSource();
              src.buffer = audioBuffer;
              window.__OSG_activePauliBufferSource = src;
              window.currentAudioSource = src;
              // Generation-Snapshot für onended-Guard
              const _bufStartGen =
                window.OSG_AUDIO_REGISTRY &&
                typeof window.OSG_AUDIO_REGISTRY.getGeneration === "function"
                  ? window.OSG_AUDIO_REGISTRY.getGeneration()
                  : -1;
              // Registrierung in zentraler AudioRegistry
              var _regEntry = null;
              if (window.OSG_AUDIO_REGISTRY) {
                _regEntry = window.OSG_AUDIO_REGISTRY.register("buffer", function () {
                  try { src.stop(); } catch (_) {}
                  window.__OSG_activePauliBufferSource = null;
                  window.currentAudioSource = null;
                });
              }
              const gain = ctx.createGain();
              gain.gain.value = gainVal;
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 512;
              analyser.smoothingTimeConstant = 0.42;
              src.connect(gain);
              gain.connect(analyser);
              if (extraNode) {
                analyser.connect(extraNode);
              } else {
                analyser.connect(ctx.destination);
              }
              if (typeof window.triggerAvatarAnimation === "function") {
                window.triggerAvatarAnimation(analyser);
              } else {
                osgLipSyncBegin({
                  durationMs: Math.ceil(audioBuffer.duration * 1000) + 120,
                  analyser,
                });
              }
              src.onended = () => {
                if (window.__OSG_activePauliBufferSource === src) {
                  window.__OSG_activePauliBufferSource = null;
                }
                if (window.currentAudioSource === src) {
                  window.currentAudioSource = null;
                }
                if (_regEntry && window.OSG_AUDIO_REGISTRY) {
                  window.OSG_AUDIO_REGISTRY.unregister(_regEntry);
                }
                try {
                  gain.disconnect();
                  analyser.disconnect();
                  src.disconnect();
                } catch (_) {}
                // onended-Guard: Generation geprüft — nach Abort keine LipSync-Stop-Kette
                const isStaleBuffer =
                  _bufStartGen >= 0 &&
                  window.OSG_AUDIO_REGISTRY &&
                  typeof window.OSG_AUDIO_REGISTRY.getGeneration === "function" &&
                  window.OSG_AUDIO_REGISTRY.getGeneration() !== _bufStartGen;
                if (!isStaleBuffer) {
                  if (typeof window.stopAvatarAnimation === "function") {
                    window.stopAvatarAnimation();
                  } else {
                    osgLipSyncStop();
                  }
                }
                resolve();
              };
              src.start(0);
            });
          }

          if (!Ctx) {
            const blob = new Blob([arrayBuf], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = gainVal;
            window.__OSG_activePauliHtmlAudio = audio;
            // Registrierung (html-audio, kein AudioContext)
            var _regEntryHtml1 = null;
            if (window.OSG_AUDIO_REGISTRY) {
              _regEntryHtml1 = window.OSG_AUDIO_REGISTRY.register("html-audio", function () {
                try { audio.pause(); audio.currentTime = 0; } catch (_) {}
                window.__OSG_activePauliHtmlAudio = null;
                try { URL.revokeObjectURL(url); } catch (_) {}
              });
            }
            // Generation-Snapshot für onended-Guard
            const _html1StartGen =
              window.OSG_AUDIO_REGISTRY &&
              typeof window.OSG_AUDIO_REGISTRY.getGeneration === "function"
                ? window.OSG_AUDIO_REGISTRY.getGeneration()
                : -1;
            audio.onloadedmetadata = function () {
              if (typeof window.triggerAvatarAnimation === "function") {
                window.triggerAvatarAnimation(null);
              } else {
                osgLipSyncStart(Math.ceil((audio.duration || 3) * 1000));
              }
            };
            try {
              await audio.play();
            } catch (e) {
              window.__OSG_activePauliHtmlAudio = null;
              if (_regEntryHtml1 && window.OSG_AUDIO_REGISTRY) window.OSG_AUDIO_REGISTRY.unregister(_regEntryHtml1);
              URL.revokeObjectURL(url);
              throw e;
            }
            await new Promise((resolve) => {
              function _html1Done(fromEnd) {
                window.__OSG_activePauliHtmlAudio = null;
                if (_regEntryHtml1 && window.OSG_AUDIO_REGISTRY) window.OSG_AUDIO_REGISTRY.unregister(_regEntryHtml1);
                URL.revokeObjectURL(url);
                const isStaleH1 =
                  fromEnd && _html1StartGen >= 0 &&
                  window.OSG_AUDIO_REGISTRY &&
                  typeof window.OSG_AUDIO_REGISTRY.getGeneration === "function" &&
                  window.OSG_AUDIO_REGISTRY.getGeneration() !== _html1StartGen;
                if (!isStaleH1) {
                  if (typeof window.stopAvatarAnimation === "function") {
                    window.stopAvatarAnimation();
                  } else {
                    osgLipSyncStop();
                  }
                }
                resolve();
              }
              audio.onended = () => _html1Done(true);
              audio.onerror = () => _html1Done(false);
            });
            return;
          }

          const ctx = window.__OSG_audioCtxUnlock || new Ctx();
          window.__OSG_audioCtxUnlock = ctx;
          try {
            await ctx.resume();
          } catch (_) {}

          if (ctx.state === "suspended") {
            const blob = new Blob([arrayBuf], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.setAttribute("playsinline", "");
            audio.volume = gainVal;
            window.__OSG_activePauliHtmlAudio = audio;
            // Registrierung (html-audio, suspended ctx)
            var _regEntryHtml2 = null;
            if (window.OSG_AUDIO_REGISTRY) {
              _regEntryHtml2 = window.OSG_AUDIO_REGISTRY.register("html-audio-suspended", function () {
                try { audio.pause(); audio.currentTime = 0; } catch (_) {}
                window.__OSG_activePauliHtmlAudio = null;
                try { URL.revokeObjectURL(url); } catch (_) {}
              });
            }
            // Generation-Snapshot für onended-Guard
            const _html2StartGen =
              window.OSG_AUDIO_REGISTRY &&
              typeof window.OSG_AUDIO_REGISTRY.getGeneration === "function"
                ? window.OSG_AUDIO_REGISTRY.getGeneration()
                : -1;
            audio.onloadedmetadata = function () {
              if (typeof window.triggerAvatarAnimation === "function") {
                window.triggerAvatarAnimation(null);
              } else {
                osgLipSyncStart(Math.ceil((audio.duration || 3) * 1000));
              }
            };
            try {
              await audio.play();
            } catch (e) {
              window.__OSG_activePauliHtmlAudio = null;
              if (_regEntryHtml2 && window.OSG_AUDIO_REGISTRY) window.OSG_AUDIO_REGISTRY.unregister(_regEntryHtml2);
              URL.revokeObjectURL(url);
              throw e;
            }
            await new Promise((resolve) => {
              function _html2Done(fromEnd) {
                window.__OSG_activePauliHtmlAudio = null;
                if (_regEntryHtml2 && window.OSG_AUDIO_REGISTRY) window.OSG_AUDIO_REGISTRY.unregister(_regEntryHtml2);
                URL.revokeObjectURL(url);
                const isStaleH2 =
                  fromEnd && _html2StartGen >= 0 &&
                  window.OSG_AUDIO_REGISTRY &&
                  typeof window.OSG_AUDIO_REGISTRY.getGeneration === "function" &&
                  window.OSG_AUDIO_REGISTRY.getGeneration() !== _html2StartGen;
                if (!isStaleH2) {
                  if (typeof window.stopAvatarAnimation === "function") {
                    window.stopAvatarAnimation();
                  } else {
                    osgLipSyncStop();
                  }
                }
                resolve();
              }
              audio.onended = () => _html2Done(true);
              audio.onerror = () => _html2Done(false);
            });
            return;
          }

          const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
          await playWithAnalyser(ctx, audioBuffer, null);
        }

        async function playPauliBundledFallbackVoice(opts) {
          const whisper = !!(opts && opts.whisper);
          const fullVolume = !!(opts && opts.fullVolume);
          const cached = osgPauliBundledVoiceCache.buffers;
          if (cached && cached.length) {
            let lastErr = null;
            for (let ci = 0; ci < cached.length; ci += 1) {
              try {
                await playPauliAudioBuffer(cached[ci].buf.slice(0), {
                  whisper: whisper,
                  mimeType: cached[ci].mimeType || "audio/mpeg",
                  fullVolume: fullVolume,
                });
                return;
              } catch (e) {
                lastErr = e;
              }
            }
            if (lastErr) throw lastErr;
          }
          let lastErr = null;
          for (let i = 0; i < OSG_PAULI_BUNDLED_VOICE_URLS.length; i += 1) {
            const url = OSG_PAULI_BUNDLED_VOICE_URLS[i];
            try {
              const res = await fetch(url, { credentials: "same-origin" });
              if (!res.ok) continue;
              const arrayBuf = await res.arrayBuffer();
              if (!arrayBuf || arrayBuf.byteLength < 128) continue;
              const ext = url.slice(url.lastIndexOf(".")).toLowerCase();
              const mimeType =
                ext === ".m4a"
                  ? "audio/mp4"
                  : ext === ".wav"
                  ? "audio/wav"
                  : "audio/mpeg";
              await playPauliAudioBuffer(arrayBuf, {
                whisper: whisper,
                mimeType: mimeType,
                fullVolume: fullVolume,
              });
              return;
            } catch (e) {
              lastErr = e;
            }
          }
          throw lastErr || new Error("bundled_voice_missing");
        }

        async function osgPauliTtsApiFetch(path, init) {
          path = String(path || "");
          if (!path || path.charAt(0) !== "/") {
            path = "/" + path.replace(/^\/+/, "");
          }
          let url = path;
          try {
            const base = String(window.OSG_API_BASE || "").replace(/\/$/, "");
            if (base) {
              const pageOrigin = String(window.location.origin || "").replace(
                /\/$/,
                ""
              );
              if (!pageOrigin || pageOrigin !== base) {
                url = base + path;
              }
            }
          } catch (_) {}
          return fetch(url, init || {});
        }

        async function playElevenLabs(text, opts) {
          const whisper = !!(opts && opts.whisper);
          const langCode =
            (opts && opts.langCode) ||
            (typeof packLangFromDocument === "function"
              ? packLangFromDocument()
              : "en");
          const speechTag =
            typeof osgResolveSpeechTag === "function"
              ? osgResolveSpeechTag(langCode)
              : "en-US";
          const res = await osgPauliTtsApiFetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: typeof text === "string" ? text : "",
              whisper,
              lang: speechTag,
            }),
          });
          if (res.status === 429) {
            const pack =
              window.__OSG_CURRENT_PACK_CACHE ||
              (typeof T !== "undefined" ? T.de : {});
            osgAlertRateLimitedIfSo(res, pack);
            throw new Error("rate_limited");
          }
          if (!res.ok) {
            const err = await res.text();
            throw new Error(err || res.statusText);
          }
          const arrayBuf = await res.arrayBuffer();
          await playPauliAudioBuffer(arrayBuf, {
            whisper,
            mimeType: "audio/mpeg",
          });
        }

        function osgPauliBundledVoiceAllowed(speechKey) {
          const k = String(speechKey || "").toLowerCase();
          return (
            k === "pauliintro" ||
            k === "paulisawadee" ||
            k.indexOf("welcome_greeting") >= 0
          );
        }

        async function playPauliWebSpeechFallback(text, langCode) {
          /* Browser speechSynthesis disabled for Pauli — ElevenLabs only. */
          void text;
          void langCode;
          return false;
        }

        /** Avatar spricht nur über ElevenLabs (/api/tts). Master-MP3 = Referenz, keine Schnipsel-Wiedergabe. */
        async function playPauliVoice(text, opts) {
          opts = opts || {};
          if (typeof window.stopAllSpeech === "function") {
            window.stopAllSpeech();
          }
          if (
            typeof osgPauliAudioAllowed === "function" &&
            !osgPauliAudioAllowed()
          ) {
            return;
          }
          if (!opts.ignoreGesture && !window.__OSG_AUDIO_GESTURE_UNLOCKED__) {
            return;
          }
          const spoken = String(text || "").trim();
          if (!spoken) return;
          if (typeof window.pauliLiveCaptionShow === "function") {
            window.pauliLiveCaptionShow(spoken);
          }
          const I = window.__OSG_I18N;
          const langCode =
            opts.langCode || (I ? I.systemLangCode() : "de");

          try {
            if (window.OSG_PAULI_DISABLE_CLOUD_TTS) return;
            await playElevenLabs(spoken, {
              whisper: !!opts.whisper,
              langCode: langCode,
            });
          } catch (e) {
            if (String(e && e.message) === "rate_limited") throw e;
          } finally {
            if (
              !opts.skipCaptionClear &&
              typeof window.pauliLiveCaptionClear === "function"
            ) {
              window.pauliLiveCaptionClear();
            }
          }
        }

        window.playPauliVoice = playPauliVoice;
        if (typeof window.osgInstallPauliTtsGuard === "function") {
          window.osgInstallPauliTtsGuard();
        }
        window.osgPauliResolveSpeechKeyFromText = osgPauliResolveSpeechKeyFromText;
        window.osgPauliPreloadBundledVoice = osgPauliPreloadBundledVoice;

        // Phase 4: Tap → sofort Stop
        // Beliebiger Tap/Klick auf die App stoppt aktives Audio sofort und leert die Queue.
        // Ausnahmen: interaktive Elemente die selbst Audio starten (Münze, Buttons) —
        // dort wird stopAllSpeech() direkt in playPauliVoice() aufgerufen.
        (function osgInstallTapStopAudio() {
          var _tapStopInstalled = false;
          function osgUserTapStopAudio(e) {
            // Nur aktives Audio unterbrechen — keinen neuen Start blockieren
            if (!window.OSG_AUDIO_REGISTRY || !window.OSG_AUDIO_REGISTRY.isActive()) return;
            // Klicks auf interaktive Elemente (button, a, input, coin-stage) ignorieren
            var t = e.target;
            if (t) {
              var tag = (t.tagName || "").toUpperCase();
              if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT") return;
              if (t.closest && (t.closest("#coin-stage") || t.closest("[data-osg-audio-trigger]"))) return;
            }
            if (typeof window.osgPauliTtsAbort === "function") {
              window.osgPauliTtsAbort();
            } else if (typeof window.stopAllSpeech === "function") {
              window.stopAllSpeech();
            }
          }
          function tryInstall() {
            if (_tapStopInstalled) return;
            if (!document.body) return;
            document.addEventListener("pointerdown", osgUserTapStopAudio, { passive: true, capture: false });
            _tapStopInstalled = true;
          }
          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", tryInstall, { once: true });
          } else {
            tryInstall();
          }
        })();

        let osgAudioGestureUnlocked = false;

        /**
         * Aufruf nur aus einem direkten Klick-/Tastenkontext der Münze (User-Geste).
         * Aktiviert Web Audio & HTMLAudio / Speech einmal gegen Mobil‑Autoplay-Sperren.
         */
        function unlockAudioSystemFromCoinGesture() {
          if (typeof window.osgPauliMarkUserGestureForAudio === "function") {
            window.osgPauliMarkUserGestureForAudio();
          } else {
            window.__OSG_AUDIO_GESTURE_UNLOCKED__ = true;
          }
          if (osgAudioGestureUnlocked) return;
          osgAudioGestureUnlocked = true;

          if (
            window.OSG_SPEECH_VOICES &&
            typeof window.OSG_SPEECH_VOICES.refresh === "function"
          ) {
            try {
              window.OSG_SPEECH_VOICES.refresh();
            } catch (_) {}
          }

          try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) {
              if (!window.__OSG_audioCtxUnlock) {
                window.__OSG_audioCtxUnlock = new Ctx();
              }
              const ctx = window.__OSG_audioCtxUnlock;
              void ctx.resume().catch(() => {});
              try {
                const buf = ctx.createBuffer(1, 2, ctx.sampleRate);
                const src = ctx.createBufferSource();
                src.buffer = buf;
                const g = ctx.createGain();
                g.gain.value = 0;
                src.connect(g);
                g.connect(ctx.destination);
                const t0 = ctx.currentTime;
                src.start(t0);
                src.stop(t0 + 0.015);
              } catch (_) {}
            }
          } catch (_) {}

          try {
            const el = document.createElement("audio");
            el.volume = 0.02;
            el.setAttribute("playsinline", "");
            el.setAttribute(
              "src",
              "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAABAAgAZGF0YQAAAAA="
            );
            const pr = el.play();
            if (pr && typeof pr.catch === "function")
              void pr
                .then(() => el.pause())
                .catch(() => {});
          } catch (_) {}

        }

        /* ── PAULI SPRÜCHE-POOL — 30 Trend-Phrasen/Region, 30-Tage-Rotation ── */
        function pickNextPauliSpruch(langCode) {
          const CT = window.OSG_CULTURAL_TRENDS;
          if (CT && typeof CT.pickTrendPhrase === "function") {
            const hit = CT.pickTrendPhrase(langCode);
            if (hit && hit.text) {
              return { text: hit.text, speechKey: hit.speechKey || "culturalTrendPhrase" };
            }
          }
          const pool = getSpruecheForLang(langCode);
          if (!pool.length) return { text: "", speechKey: "pauliSpruch0" };
          const idx = Math.floor(Math.random() * pool.length);
          return { text: pool[idx], speechKey: "pauliSpruch" + idx };
        }

        async function handleCoinActivate() {
          await osgPauliRunUserSessionGreeting({ fromCoin: true });
        }

        const PAULI_WAKE_GREETINGS =
          "hallo|hi|hey|hello|hej|halo|cześć|czesc|witaj|привет|privet|алло|allo|эй|ey|здравствуй|салют|salut|สวัสดี|你好|您好";
        const PAULI_WAKE_NAMES = "pauli|paulie|paulies|paulí|พอลลี่|保利";
        const PAULI_WAKE_RE = new RegExp(
          "\\b(" +
            PAULI_WAKE_GREETINGS +
            ")\\s*[,!?.\\-–—]*\\s*(" +
            PAULI_WAKE_NAMES +
            ")\\b|" +
            "\\b(" +
            PAULI_WAKE_NAMES +
            ")\\s*[,!?.\\-–—]*\\s*(" +
            PAULI_WAKE_GREETINGS +
            ")\\b",
          "i"
        );

        /* ══════════════════════════════════════════════════════════════
           A11y NAMESPACE + VOICE-CONFIRM HELPER
           - osgA11y.isEnabled()  → localStorage flag (Etappe 4 will add UI)
           - osgVoiceConfirm(intent, payload?) → Promise<boolean>
             Resolves true (confirm) or false (cancel). When A11y is on,
             also listens for Yes/No phrases via hybrid STT
             (Web Speech API → MediaRecorder + /api/stt/wake fallback).
           ══════════════════════════════════════════════════════════════ */

        const OSG_A11Y_LS_KEY = "osg.a11y.enabled";
        const OSG_A11Y_CONTRAST_LS_KEY = "osg.a11y.contrast";
        const OSG_VC_LISTEN_MS = 6000;
        const OSG_VC_HARD_TIMEOUT_MS = 14000;

        function osgA11ySafeSpeak(line) {
          if (!line) return;
          try {
            if (
              window.PauliVoice &&
              typeof window.PauliVoice.speakText === "function"
            ) {
              Promise.resolve(window.PauliVoice.speakText(line, false)).catch(
                function () {}
              );
            }
          } catch (_) {}
        }

        function osgA11yReadPack() {
          return (
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.th || T.de || {} : {})
          );
        }

        function osgA11yApplyContrast(value) {
          const root = document.documentElement;
          if (value === "high") {
            root.setAttribute("data-contrast", "high");
          } else if (value === "normal") {
            root.setAttribute("data-contrast", "normal");
          } else {
            root.removeAttribute("data-contrast");
          }
          const cb = document.getElementById("osg-a11y-contrast-input");
          if (cb) cb.checked = value === "high";
        }

        function osgA11yApplyVoice(enabled) {
          const cb = document.getElementById("osg-a11y-voice-input");
          if (cb) cb.checked = !!enabled;
        }

        window.osgA11y = window.osgA11y || {
          isEnabled() {
            try {
              const v = localStorage.getItem(OSG_A11Y_LS_KEY);
              if (v === "0") return false;
              return true;
            } catch (_) {
              return true;
            }
          },
          setEnabled(v) {
            try {
              localStorage.setItem(OSG_A11Y_LS_KEY, v ? "1" : "0");
            } catch (_) {}
            try { osgA11yApplyVoice(!!v); } catch (_) {}
          },
          toggle() {
            const next = !window.osgA11y.isEnabled();
            window.osgA11y.setEnabled(next);
            return next;
          },
          getContrast() {
            try { return localStorage.getItem(OSG_A11Y_CONTRAST_LS_KEY) || ""; }
            catch (_) { return ""; }
          },
          setContrast(value) {
            const v = value === "high" || value === "normal" ? value : "";
            try {
              if (v) localStorage.setItem(OSG_A11Y_CONTRAST_LS_KEY, v);
              else localStorage.removeItem(OSG_A11Y_CONTRAST_LS_KEY);
            } catch (_) {}
            osgA11yApplyContrast(v);
          },
          toggleContrast() {
            const cur = window.osgA11y.getContrast() === "high";
            window.osgA11y.setContrast(cur ? "normal" : "high");
            return !cur;
          },
        };

        function osgA11yBootAuto() {
          try {
            if (!window.osgA11y.isEnabled()) window.osgA11y.setEnabled(true);
          } catch (_) {}
          const persistedContrast = window.osgA11y.getContrast();
          if (persistedContrast === "high" || persistedContrast === "normal") {
            osgA11yApplyContrast(persistedContrast);
          } else {
            try {
              const mq = window.matchMedia("(prefers-contrast: more)");
              if (mq && mq.matches) osgA11yApplyContrast("high");
              if (mq && typeof mq.addEventListener === "function") {
                mq.addEventListener("change", function (ev) {
                  const stored = window.osgA11y.getContrast();
                  if (!stored) osgA11yApplyContrast(ev.matches ? "high" : "");
                });
              }
            } catch (_) {}
          }
        }

        function osgA11yInstallPanel() {
          osgA11yBootAuto();
        }

        function osgA11yHydrateLabels(_pack) {
          /* A11y-Panel entfernt — Sprachsteuerung läuft automatisch. */
        }
        window.osgA11yHydrateLabels = osgA11yHydrateLabels;
        window.osgA11yInstallPanel = osgA11yInstallPanel;

        function osgVcInterpolate(tmpl, vars) {
          let s = String(tmpl || "");
          if (vars && typeof vars === "object") {
            Object.keys(vars).forEach((k) => {
              s = s.split("{" + k + "}").join(String(vars[k] == null ? "" : vars[k]));
            });
          }
          return s;
        }

        function osgVcCurrentPack() {
          return (
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? (T.th || T.de || {}) : {})
          );
        }

        function osgVcCurrentLangCode() {
          const I = window.__OSG_I18N;
          if (I && typeof I.systemLangCode === "function") return I.systemLangCode();
          const html = document.documentElement.getAttribute("lang") || "en";
          return String(html).split("-")[0].toLowerCase();
        }

        function osgVcNormalize(text) {
          return String(text || "")
            .toLowerCase()
            .replace(/[.,!?;:'"„""()\[\]{}]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }

        function osgVcPhraseMatch(text, phrasesPipe) {
          const norm = osgVcNormalize(text);
          if (!norm) return false;
          const list = String(phrasesPipe || "")
            .split("|")
            .map((p) => p.trim().toLowerCase())
            .filter(Boolean);
          for (let i = 0; i < list.length; i += 1) {
            const p = list[i];
            if (!p) continue;
            if (norm === p) return true;
            if (norm.indexOf(p) === 0 && (norm[p.length] === " " || norm[p.length] === undefined)) return true;
            if (norm.indexOf(" " + p) !== -1) return true;
            if (norm.indexOf(p + " ") !== -1) return true;
            if (norm.indexOf(p) !== -1 && p.length >= 2 && /[ก-๙一-龥]/.test(p)) return true;
          }
          return false;
        }

        /* Transcribe a recorded Blob via the shared Whisper endpoint (/api/stt/wake). */
        async function osgVcSttTranscribe(blob, mime) {
          try {
            const b64 = await new Promise(function (resolve, reject) {
              const fr = new FileReader();
              fr.onload = function () {
                const s = String(fr.result || "");
                const idx = s.indexOf(",");
                resolve(idx >= 0 ? s.slice(idx + 1) : "");
              };
              fr.onerror = reject;
              fr.readAsDataURL(blob);
            });
            if (!b64) return "";
            const lang = osgVcCurrentLangCode();
            const res = await osgApiFetch("/api/stt/wake", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audioBase64: b64,
                mime: mime || blob.type || "audio/webm",
                lang,
              }),
            });
            if (!res.ok) return "";
            const data = await res.json();
            return typeof data.text === "string" ? data.text : "";
          } catch (_) {
            return "";
          }
        }

        function osgPauliTtsIsActive() {
          if (ttsLoading) return true;
          try {
            if (
              window.OSG_AUDIO_REGISTRY &&
              typeof window.OSG_AUDIO_REGISTRY.isActive === "function" &&
              window.OSG_AUDIO_REGISTRY.isActive()
            ) {
              return true;
            }
          } catch (_) {}
          return false;
        }

        function osgPauliWaitTtsIdle(maxMs) {
          const cap = Math.max(1200, Number(maxMs) || 30000);
          const t0 = Date.now();
          return new Promise(function (resolve) {
            (function tick() {
              if (!osgPauliTtsIsActive() || Date.now() - t0 >= cap) {
                resolve();
                return;
              }
              setTimeout(tick, 80);
            })();
          });
        }

        /* ── Hybrid STT for confirmation: Web Speech API first, fallback to MediaRecorder + /api/stt/wake ── */
        function osgVcStartListening(langCode, onText, onError, listenMs) {
          if (osgPauliTtsIsActive()) {
            if (onError) onError();
            return function () {};
          }
          const listenDur = Math.max(3500, Number(listenMs) || OSG_VC_LISTEN_MS);
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          const bcp = osgSpeechLangForUi(langCode);
          let stopped = false;
          let stopper = function () {};

          if (SR) {
            try {
              const rec = new SR();
              rec.lang = bcp;
              rec.interimResults = false;
              rec.maxAlternatives = 3;
              rec.continuous = false;

              // Whisper-RMS: kein zweites getUserMedia parallel zu SpeechRecognition
              // (Chrome/macOS blockiert sonst oft STT — nur Mikro-Anzeige, kein Text).
              window.osgUserInputIsWhisper = false;

              let gotResult = false;
              rec.onresult = function (ev) {
                if (stopped) return;
                let best = "";
                for (let i = 0; i < ev.results.length; i += 1) {
                  for (let j = 0; j < ev.results[i].length; j += 1) {
                    const t = String(ev.results[i][j].transcript || "");
                    if (t.length > best.length) best = t;
                  }
                }
                if (!best.trim()) return;
                gotResult = true;
                stopped = true;
                try {
                  rec.stop();
                } catch (_) {}
                onText && onText(best);
              };
              rec.onerror = function () {
                if (!stopped) {
                  stopped = true;
                  onError && onError();
                }
              };
              rec.onend = function () {
                if (!stopped && !gotResult) onError && onError();
              };
              rec.start();
              stopper = function () {
                stopped = true;
                try { rec.stop(); } catch (_) {}
              };
              return stopper;
            } catch (_) {}
          }

          /* Fallback: MediaRecorder → /api/stt/wake */
          let stream = null;
          let recorder = null;
          let chunks = [];
          let killTimer = 0;
          (async function () {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });

              // ── Acoustic whisper detection via AnalyserNode RMS ───────────────
              // Measures average input amplitude during recording.
              // If user is whispering (RMS < threshold), sets window.osgUserInputIsWhisper.
              window.osgUserInputIsWhisper = false;
              let _rmsSum = 0, _rmsSamples = 0;
              try {
                const _Ctx = window.AudioContext || window.webkitAudioContext;
                if (_Ctx) {
                  const _actx = new _Ctx();
                  const _src = _actx.createMediaStreamSource(stream);
                  const _analyser = _actx.createAnalyser();
                  _analyser.fftSize = 256;
                  _src.connect(_analyser);
                  const _buf = new Float32Array(_analyser.fftSize);
                  const _tick = setInterval(function () {
                    _analyser.getFloatTimeDomainData(_buf);
                    let rms = 0;
                    for (let i = 0; i < _buf.length; i++) rms += _buf[i] * _buf[i];
                    rms = Math.sqrt(rms / _buf.length);
                    _rmsSum += rms; _rmsSamples++;
                  }, 80);
                  // Cleanup on stream end
                  stream.getTracks()[0].addEventListener("ended", function () {
                    clearInterval(_tick);
                    try { _actx.close(); } catch (_) {}
                    if (_rmsSamples > 0) {
                      const avgRms = _rmsSum / _rmsSamples;
                      window.osgUserInputIsWhisper = avgRms < 0.07;
                    }
                  });
                }
              } catch (_) { /* whisper detection optional — never block recording */ }
              // ─────────────────────────────────────────────────────────────────

              const mime = MediaRecorder.isTypeSupported("audio/webm")
                ? "audio/webm"
                : MediaRecorder.isTypeSupported("audio/mp4")
                ? "audio/mp4"
                : "";
              try {
                recorder = mime
                  ? new MediaRecorder(stream, { mimeType: mime })
                  : new MediaRecorder(stream);
              } catch (_) {
                recorder = new MediaRecorder(stream);
              }
              recorder.ondataavailable = function (e) {
                if (e.data && e.data.size) chunks.push(e.data);
              };
              recorder.onstop = async function () {
                try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
                if (stopped) return;
                if (!chunks.length) { onError && onError(); return; }
                const blob = new Blob(chunks, { type: chunks[0].type || mime || "audio/webm" });
                try {
                  const text = await osgVcSttTranscribe(blob, blob.type);
                  if (stopped) return;
                  if (text) onText && onText(text);
                  else onError && onError();
                } catch (_) { onError && onError(); }
              };
              recorder.start();
              killTimer = setTimeout(function () {
                try { recorder.state !== "inactive" && recorder.stop(); } catch (_) {}
              }, listenDur);
              stopper = function () {
                stopped = true;
                clearTimeout(killTimer);
                try { recorder.state !== "inactive" && recorder.stop(); } catch (_) {}
                try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
              };
            } catch (_) {
              onError && onError();
            }
          })();
          return function () { stopper(); };
        }

        /* ══════════════════════════════════════════════════════════════
           VOICE-NAVIGATION (Etappe 2)
           - osgVoiceCommandRegistry: pairs phrase-i18n-keys with actions.
           - osgStartVoiceCommandWindow: opens a 6 s hybrid-STT window
             after wake-word, dispatches the matched action, speaks
             a short ack. No A11y gate — wake is opt-in already.
           ══════════════════════════════════════════════════════════════ */

        function osgVcScrollToId(id) {
          const el = document.getElementById(id);
          if (!el) return false;
          try {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (_) {
            el.scrollIntoView();
          }
          try { el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); } catch (_) {}
          return true;
        }

        function osgVcScrollTop() {
          try { window.scrollTo({ top: 0, behavior: "smooth" }); }
          catch (_) { window.scrollTo(0, 0); }
          return true;
        }

        function osgVcSwitchLang(target) {
          try {
            if (typeof applyLang === "function") {
              var lang = normalizeLang(target);
              var run = function () {
                applyLang(lang);
                try {
                  localStorage.setItem("osg-lang", lang);
                } catch (_) {}
                window.__OSG_CURRENT_LANG__ = lang;
              };
              if (
                typeof osgLoadLocaleOverlay === "function" &&
                osgLocaleHasJsonOverlay(lang)
              ) {
                return osgLoadLocaleOverlay(lang).then(run);
              }
              run();
              return Promise.resolve(true);
            }
          } catch (_) {}
          return Promise.resolve(false);
        }

        async function osgAvatarExecuteLangSwitch(targetLang, opts) {
          opts = opts || {};
          var LS = window.OSG_LANG_SWITCH_LOGIC;
          var AC = window.osgAvatarController;
          if (!LS || !AC) return false;
          var code = LS.normalizeLang(targetLang);
          LS.clearPending();
          if (
            typeof osgLoadLocaleOverlay === "function" &&
            typeof osgLocaleHasJsonOverlay === "function" &&
            osgLocaleHasJsonOverlay(code)
          ) {
            osgLoadLocaleOverlay(code);
          }
          if (typeof AC.triggerMagicianLangSwitch === "function") {
            await AC.triggerMagicianLangSwitch(function () {
              return osgVcSwitchLang(code);
            });
          } else {
            await osgVcSwitchLang(code);
          }
          LS.markProactiveOffered();
          return true;
        }

        window.osgAvatarExecuteLangSwitch = osgAvatarExecuteLangSwitch;

        function osgPauliWakeMatches(text) {
          const t = String(text || "").trim();
          if (!t) return false;
          if (PAULI_WAKE_RE.test(t)) return true;
          if (/^\s*(pauli|paulie|paulies|พอลลี่|保利)\s*[!.?]*\s*$/i.test(t)) {
            return true;
          }
          if (
            /(你好|您好)\s*(pauli|paulie|保利)/i.test(t) ||
            /(สวัสดี)\s*(pauli|paulie|พอลลี่)/i.test(t) ||
            /(привет|privet|эй|ey)\s*(pauli|paulie|пauli)/i.test(t) ||
            /(cześć|czesc|hej|halo|witaj)\s*(pauli|paulie)/i.test(t)
          ) {
            return true;
          }
          const pack = osgVcCurrentPack();
          if (pack && pack.pauliWakePhrases) {
            return osgVcPhraseMatch(t, pack.pauliWakePhrases);
          }
          return false;
        }

        const OSG_VOICE_COMMAND_REGISTRY = [
          { id: "goAutoservice", phraseKey: "voiceCmdGoAutoservice",
            run: () => osgVcScrollToId("osg-autoservice-section") },
          { id: "goSmartphones", phraseKey: "voiceCmdGoSmartphones",
            run: () => osgVcScrollToId("osg-smartphones-section") },
          { id: "goInternet", phraseKey: "voiceCmdGoInternet",
            run: () => osgVcScrollToId("osg-internet-section") },
          { id: "goTariff", phraseKey: "voiceCmdGoTariff",
            run: () => osgVcScrollToId("osg-tariff-section") },
          { id: "goVip", phraseKey: "voiceCmdGoVip",
            run: () => osgVcScrollToId("vip-redeem-wrap") },
          { id: "goTop", phraseKey: "voiceCmdGoTop",
            run: () => osgVcScrollTop() },
          { id: "openSupport", phraseKey: "voiceCmdOpenSupport",
            run: () => {
              if (typeof window.osgOpenSupportContact === "function") {
                window.osgOpenSupportContact();
                return true;
              }
              return false;
            } },
          { id: "startTour", phraseKey: "voiceCmdStartTour",
            run: () => {
              const pack = osgVcCurrentPack();
              if (typeof window.osgAvatarTour === "function") {
                void window.osgAvatarTour(pack);
              } else if (typeof window.osgAvatarStartTour === "function") {
                window.osgAvatarStartTour(pack);
              }
              return true;
            } },
          { id: "switchLangDe", phraseKey: "voiceCmdSwitchLangDe",
            run: () => osgVcSwitchLang("de") },
          { id: "switchLangEn", phraseKey: "voiceCmdSwitchLangEn",
            run: () => osgVcSwitchLang("en") },
          { id: "switchLangTh", phraseKey: "voiceCmdSwitchLangTh",
            run: () => osgVcSwitchLang("th") },
          { id: "switchLangPl", phraseKey: "voiceCmdSwitchLangPl",
            run: () => osgVcSwitchLang("pl") },
          { id: "switchLangRu", phraseKey: "voiceCmdSwitchLangRu",
            run: () => osgVcSwitchLang("ru") },
          { id: "switchLangZh", phraseKey: "voiceCmdSwitchLangZh",
            run: () => osgVcSwitchLang("zh") },
          { id: "cancel", phraseKey: "voiceCmdCancel",
            run: () => true },
        ];

        function osgVoiceMatchCommand(text, pack) {
          if (!text || !pack) return null;
          for (let i = 0; i < OSG_VOICE_COMMAND_REGISTRY.length; i += 1) {
            const cmd = OSG_VOICE_COMMAND_REGISTRY[i];
            if (osgVcPhraseMatch(text, pack[cmd.phraseKey])) return cmd;
          }
          return null;
        }

        /* ── Live-Gespräch: STT → /api/pauli-chat → Live-TTS (keine Vorlagen-MP3s) ── */
        const OSG_PAULI_LIVE_LISTEN_MS = 14000;
        const OSG_PAULI_LIVE_MAX_TURNS = 12;
        let osgPauliLiveActive = false;
        let osgPauliLiveHistory = [];
        let osgPauliLiveStopper = null;

        function osgPauliLiveStopWake() {
          try {
            if (typeof window.osgWakeStopAll === "function") window.osgWakeStopAll();
          } catch (_) {}
        }

        function osgPauliStripWakePhrase(text) {
          let t = String(text || "").trim();
          if (!t) return "";
          if (typeof osgPauliWakeMatches === "function" && osgPauliWakeMatches(t)) {
            return t.replace(PAULI_WAKE_RE, "").trim();
          }
          return t;
        }

        function osgPauliIsPureWakePhrase(text) {
          const t = String(text || "").trim();
          if (!t) return false;
          return (
            typeof osgPauliWakeMatches === "function" && osgPauliWakeMatches(t)
          );
        }

        function osgPauliWakeGreetingReply(pack) {
          const IC = window.OSG_INTENT_CLASSIFIER;
          if (IC && typeof IC.classify === "function") {
            const hit = IC.classify("hello");
            if (hit && hit.packKey && pack && pack[hit.packKey]) {
              return {
                text: String(pack[hit.packKey] || "").trim(),
                speechKey: hit.speechKey || "pauliSawadee",
                segmentKey: hit.segmentKey || "welcome_short",
              };
            }
          }
          return {
            text: "",
            speechKey: "pauliSawadee",
            segmentKey: "welcome_short",
          };
        }

        /** Pauli-Weisheit: Politik & Religion — keine Debatte, charmante Ablenkung. */
        function osgPauliDetectPoliticsReligionTopic(text) {
          const t = String(text || "").toLowerCase();
          if (!t.trim()) return false;
          const politics =
            /(?:\bpolitik\b|\bpolitical\b|\bpolitics\b|\bpolitician\b|\bpolitiker\b|\belection\b|\bwahl\b|\bregierung\b|\bgovernment\b|\bparlament\b|\bparliament\b|\bdemokrat|\brepublikan|\bdictator\b|\bdiktator\b|\bpartei\b|\btrump\b|\bbiden\b|\bputin\b|\bnato\b|\bukraine\b|\bการเมือง\b|\bรัฐบาล\b|\bเลือกตั้ง\b|\bполитик|\bполитика\b|\bвыбор|\bправительств|\b选举\b|\b政府\b|\b政治\b|\b政党\b)/i;
          const religion =
            /(?:\breligion\b|\breligi|\bglaube\b|\bgott\b|\bgod\b|\ballah\b|\bbuddha\b|\bkirche\b|\bchurch\b|\bmoschee\b|\bmosque\b|\bislam\b|\bchrist|\bchristian\b|\bbuddh|\bhindu|\bjewish\b|\bjüdisch\b|\batheist\b|\bgebet\b|\bprayer\b|\bbibel\b|\bbible\b|\bkoran\b|\bquran\b|\bimam\b|\bpriester\b|\bpastor\b|\bศาสนา\b|\bพระ\b|\bมุสลิม\b|\bрелиг|\bбог\b|\bцерков|\bислам\b|\b宗教\b|\b上帝\b|\b佛祖\b|\b伊斯兰\b)/i;
          return politics.test(t) || religion.test(t);
        }

        function osgPauliWisdomDeflectReply(pack) {
          return String(
            (pack && pack.pauliWisdomPoliticsReligionDeflect) || ""
          ).trim();
        }

        function osgDetectiveLiveTurn(userText, lang) {
          var DL = window.OSG_DETECTIVE_LOGIC;
          if (!DL || typeof DL.resolveTurn !== "function") return null;
          var hit = DL.resolveTurn(userText, lang);
          if (!hit || !hit.line) return null;
          if (hit.type === "execute" && hit.cmdId) {
            for (var i = 0; i < OSG_VOICE_COMMAND_REGISTRY.length; i++) {
              if (OSG_VOICE_COMMAND_REGISTRY[i].id === hit.cmdId) {
                try {
                  OSG_VOICE_COMMAND_REGISTRY[i].run();
                } catch (_) {}
                break;
              }
            }
            if (typeof DL.clearPending === "function") DL.clearPending();
            if (typeof osgEchoProtocol === "function") {
              osgEchoProtocol("skill_learn_success", {
                source: "detective_execute",
                cmdId: hit.cmdId,
              });
            }
            return hit.line;
          }
          return hit.line;
        }

        function osgApplyDraftConfirmOverlay(lang) {
          var DO = window.OSG_DRAFT_OWNERSHIP;
          if (!DO || typeof DO.overlayCopy !== "function") return;
          var c = DO.overlayCopy(lang);
          var heading = document.getElementById("osg-draft-confirm-heading");
          var lead = document.getElementById("osg-draft-confirm-lead");
          var ownership = document.getElementById("osg-draft-confirm-ownership");
          var confirmBtn = document.getElementById("osg-draft-confirm-btn");
          var cancelBtn = document.getElementById("osg-draft-confirm-cancel");
          var dialog = document.getElementById("osg-draft-confirm-dialog");
          if (heading) heading.textContent = c.heading || "";
          if (lead) lead.textContent = c.lead || "";
          if (ownership) ownership.textContent = c.ownership || "";
          if (confirmBtn) {
            confirmBtn.textContent = c.confirmBtn || "";
            confirmBtn.setAttribute("aria-label", c.confirmAria || c.confirmBtn || "");
          }
          if (cancelBtn) {
            cancelBtn.textContent = c.cancelBtn || "";
            cancelBtn.setAttribute("aria-label", c.cancelAria || c.cancelBtn || "");
          }
          if (dialog) {
            dialog.setAttribute("aria-label", c.dialogAria || c.heading || "");
          }
        }

        function osgShowDraftConfirmOverlay(draftText, lang) {
          osgApplyDraftConfirmOverlay(lang);
          var body = document.getElementById("osg-draft-confirm-body");
          if (body) body.textContent = String(draftText || "").trim();
          var overlay = document.getElementById("osg-draft-confirm-overlay");
          if (overlay) overlay.hidden = false;
        }

        function osgHideDraftConfirmOverlay() {
          var overlay = document.getElementById("osg-draft-confirm-overlay");
          if (overlay) overlay.hidden = true;
        }

        function osgClearComplaintConversationState() {
          try {
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
          } catch (_) {}
          try {
            if (
              window.OSG_RECLAMATION_COMPLIANCE &&
              typeof window.OSG_RECLAMATION_COMPLIANCE.clearSession === "function"
            ) {
              window.OSG_RECLAMATION_COMPLIANCE.clearSession();
            }
          } catch (_) {}
          try {
            osgHideDraftConfirmOverlay();
          } catch (_) {}
        }

        function osgResetComplaintLiveContext() {
          osgPauliLiveHistory = [];
          try {
            osgClearComplaintConversationState();
          } catch (_) {}
        }
        window.osgClearComplaintConversationState = osgClearComplaintConversationState;
        window.osgResetComplaintLiveContext = osgResetComplaintLiveContext;

        function osgReclamationComplianceReply(reply, lang, userText) {
          if (
            reply &&
            window.OSG_DETECTIVE_LOGIC &&
            typeof window.OSG_DETECTIVE_LOGIC.sanitizeReply === "function"
          ) {
            reply = window.OSG_DETECTIVE_LOGIC.sanitizeReply(reply, lang);
          }
          var RC = window.OSG_RECLAMATION_COMPLIANCE;
          if (
            !reply ||
            !RC ||
            typeof RC.complianceWrap !== "function"
          ) {
            return osgApplyAiTransparency(reply, lang, userText);
          }
          reply = RC.complianceWrap(reply, lang, {
            userText: String(userText || ""),
            platform:
              typeof RC.detectPlatform === "function"
                ? RC.detectPlatform(
                    String(userText || "") + " " + String(reply || "")
                  )
                : "both",
          });
          return osgApplyAiTransparency(reply, lang, userText);
        }

        function osgApplyAiTransparency(reply, lang, userText) {
          var AT = window.OSG_AI_TRANSPARENCY;
          if (
            !reply ||
            !AT ||
            typeof AT.appendIfNeeded !== "function"
          ) {
            return reply;
          }
          return AT.appendIfNeeded(reply, lang, String(userText || ""));
        }

        function osgPauliApplyIntentSideEffects(intentHit) {
          if (!intentHit || intentHit.intent !== "ACCESSIBILITY") return;
          try {
            if (window.osgA11y && typeof window.osgA11y.setEnabled === "function") {
              window.osgA11y.setEnabled(true);
            }
            if (
              window.osgA11y &&
              typeof window.osgA11y.setContrast === "function" &&
              window.osgA11y.getContrast &&
              window.osgA11y.getContrast() !== "high"
            ) {
              window.osgA11y.setContrast("high");
            }
          } catch (_) {}
        }

        function osgPauliResolveIntentReply(intentHit, pack) {
          if (!intentHit || intentHit.allowOpenAI) return "";
          const key = String(intentHit.packKey || "").trim();
          if (!key || !pack) return "";
          return String(pack[key] || "").trim();
        }

        function osgPauliIsDeliveryIntent(intentHit) {
          if (!intentHit || intentHit.allowOpenAI) return false;
          const id = String(intentHit.intent || "");
          return id.indexOf("delivery_") === 0;
        }

        async function osgPauliHandleDeliveryIntent(intentHit, pack, lang, isNight) {
          if (!osgPauliIsDeliveryIntent(intentHit)) return false;
          const sevenEl = document.getElementById("pickup-mode-seven");
          const panel = document.getElementById("delivery-choice-panel");
          const intent = String(intentHit.intent || "");
          const PV = window.PauliVoice;

          if (intent === "delivery_choose_seven") {
            if (typeof window.osgApplyDeliveryVoiceChoice === "function") {
              await window.osgApplyDeliveryVoiceChoice("seven_pickup");
            }
            return true;
          }
          if (intent === "delivery_choose_home") {
            if (typeof window.osgApplyDeliveryVoiceChoice === "function") {
              await window.osgApplyDeliveryVoiceChoice("marketplace");
            }
            return true;
          }
          if (intent === "delivery_compare") {
            if (PV && typeof PV.speakDeliveryCompareShort === "function") {
              await PV.speakDeliveryCompareShort();
            } else {
              const line = osgPauliResolveIntentReply(intentHit, pack);
              if (line) {
                await osgPauliLiveSpeakReply(line, pack, lang, isNight, {
                  speechKey: intentHit.speechKey || "",
                  segmentKey: intentHit.segmentKey || "",
                });
              }
            }
            return true;
          }
          if (intent === "delivery_recommend") {
            if (PV && typeof PV.speakDeliveryRecommend === "function") {
              await PV.speakDeliveryRecommend();
            } else {
              const line = osgPauliResolveIntentReply(intentHit, pack);
              if (line) {
                await osgPauliLiveSpeakReply(line, pack, lang, isNight, {
                  speechKey: intentHit.speechKey || "",
                  segmentKey: intentHit.segmentKey || "",
                });
              }
            }
            return true;
          }
          const infoKeyMap = {
            delivery_safe: "delivery.voice.safeTts",
            delivery_phone: "delivery.voice.phoneTts",
            delivery_bundle: "delivery.voice.bundleTts",
            delivery_night: "delivery.voice.nightTts",
            delivery_home_wait: "delivery.voice.homeWaitTts",
          };
          const infoKey = infoKeyMap[intent];
          if (infoKey) {
            const pointTarget =
              intent === "delivery_night" || intent === "delivery_safe"
                ? sevenEl || panel || false
                : panel || false;
            if (PV && typeof PV.speakDeliveryInfo === "function") {
              await PV.speakDeliveryInfo(infoKey, {
                gesture: "help",
                pointTarget: pointTarget,
              });
            } else {
              const line = osgPauliResolveIntentReply(intentHit, pack);
              if (line) {
                await osgPauliLiveSpeakReply(line, pack, lang, isNight, {
                  speechKey: intentHit.speechKey || "",
                  segmentKey: intentHit.segmentKey || "",
                });
              }
            }
            return true;
          }
          return false;
        }

        async function osgPauliHandleIntentHit(intentHit, pack, lang, isNight) {
          const line = osgPauliResolveIntentReply(intentHit, pack);
          if (!line) return false;
          osgPauliApplyIntentSideEffects(intentHit);
          await osgPauliLiveSpeakReply(line, pack, lang, isNight, {
            speechKey: intentHit.speechKey || "",
            segmentKey: intentHit.segmentKey || "",
          });
          return true;
        }

        async function osgPauliChatFetch(userText, lang) {
          const line = String(userText || "").trim();
          if (!line) return "";

          // ── Fall A: inject interrupt context so LLM keeps the conversational thread ──
          if (typeof window.osgBuildInterruptContextHint === 'function') {
            const hint = window.osgBuildInterruptContextHint(lang);
            if (hint) {
              osgPauliLiveHistory.push({ role: 'system', content: hint });
              if (typeof window.osgConsumeInterruptContext === 'function') {
                window.osgConsumeInterruptContext();
              }
            }
          }

          osgPauliLiveHistory.push({ role: "user", content: line });
          if (osgPauliLiveHistory.length > 14) {
            osgPauliLiveHistory = osgPauliLiveHistory.slice(-14);
          }
          const res = await osgApiFetch("/api/pauli-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lang,
              messages: osgPauliLiveHistory,
              isNight: !isPauliDayPhase() || !!window.osgUserInputIsWhisper,
            }),
          });
          const pack =
            window.__OSG_CURRENT_PACK_CACHE ||
            (typeof T !== "undefined" ? T.de : {});
          if (res.status === 429) {
            osgAlertRateLimitedIfSo(res, pack);
            throw new Error("rate_limited");
          }
          if (!res.ok) {
            var errCode = "chat_failed";
            try {
              var errData = await res.json();
              if (errData && errData.error) errCode = String(errData.error);
            } catch (_) {}
            throw new Error(errCode);
          }
          const data = await res.json();
          if (data && data.local && data.packKey) {
            const pack =
              window.__OSG_CURRENT_PACK_CACHE ||
              (typeof T !== "undefined" ? T[lang] || T.de : {});
            osgPauliApplyIntentSideEffects(data);
            window.__OSG_LAST_INTENT_SPEECH_KEY__ = data.speechKey || "";
            window.__OSG_LAST_INTENT_SEGMENT_KEY__ = data.segmentKey || "";
            const localLine = osgPauliResolveIntentReply(data, pack);
            if (localLine) {
              osgPauliLiveHistory.push({ role: "assistant", content: localLine });
              return localLine;
            }
            return "";
          }
          window.__OSG_LAST_INTENT_SPEECH_KEY__ = "";
          window.__OSG_LAST_INTENT_SEGMENT_KEY__ = "";
          let reply = String((data && data.reply) || "").trim();
          if (reply) {
            osgPauliLiveHistory.push({ role: "assistant", content: reply });
          }
          return reply;
        }

        window.osgPauliChatFetch = osgPauliChatFetch;

        async function osgPauliLiveSpeakReply(reply, pack, lang, isNight, extra) {
          extra = extra || {};
          const hasIntentAudio =
            !!(extra.speechKey || extra.segmentKey) && !extra.dynamicSpeech;
          if (!reply) reply = pack.pauliChatError || "";
          const dynamicSpeech = !!extra.dynamicSpeech || !hasIntentAudio;
          const LS = window.OSG_LANG_SWITCH_LOGIC;
          const parts =
            LS && typeof LS.splitSequentialBlocks === "function"
              ? LS.splitSequentialBlocks(reply)
              : [String(reply || "").trim()].filter(Boolean);
          for (let pi = 0; pi < parts.length; pi += 1) {
            const chunk = parts[pi];
            if (!chunk) continue;
            if (typeof osgAvatarPoint === "function") {
              osgAvatarPoint(
                "#coin-stage",
                chunk,
                Math.min(12000, Math.max(5000, chunk.length * 90))
              );
            }
            ttsLoading = true;
            try {
              // isNight OR acoustic whisper detection (user was whispering → Pauli whispers back)
              const effectiveWhisper = isNight || !!window.osgUserInputIsWhisper;
              await window.playPauliVoice(chunk, {
                whisper: effectiveWhisper,
                langCode: lang,
                speechKey: extra.speechKey || "",
                segmentKey: extra.segmentKey || "",
                intent: extra.intent || "",
                dynamicSpeech: true,
                clonedVoiceFirst: true,
                allowCloudTts: !window.OSG_PAULI_DISABLE_CLOUD_TTS,
                emotion:
                  window.OSG_DIGITAL_HUMAN &&
                  window.OSG_DIGITAL_HUMAN.state
                    ? window.OSG_DIGITAL_HUMAN.state.emotion
                    : undefined,
                gesture:
                  window.OSG_DIGITAL_HUMAN &&
                  window.OSG_DIGITAL_HUMAN.state
                    ? window.OSG_DIGITAL_HUMAN.state.gesture
                    : undefined,
              });
            } catch (e) {
              if (String(e && e.message) === "rate_limited") throw e;
            } finally {
              ttsLoading = false;
              osgLipSyncStop();
              waiActive = false;
            }
            if (pi < parts.length - 1) {
              await new Promise(function (r) {
                setTimeout(r, 420);
              });
            }
          }
          try {
            if (
              typeof window.osgAvatarFinanceTopicDetect === "function" &&
              window.osgAvatarFinanceTopicDetect(reply) &&
              window.osgAvatarController &&
              typeof window.osgAvatarController.speakDisclaimer === "function" &&
              window.osgAvatarController.requiresComplianceDisclaimer({
                category: "finance",
              })
            ) {
              var psychChat = window.OSG_PSYCHOLOGY_PROMPTS;
              var disclaimerKey = "compliance_disclaimer_chat";
              if (!psychChat || psychChat.mayFire(disclaimerKey)) {
                if (psychChat) psychChat.markFired(disclaimerKey);
                await window.osgAvatarController.speakDisclaimer({
                  pack: pack,
                  langCode: lang,
                });
              }
            }
          } catch (_) {}
        }

        function osgPauliLiveStop(opts) {
          if (!osgPauliLiveActive) return;
          if (typeof window.osgPauliTtsAbort === "function") {
            window.osgPauliTtsAbort();
          } else if (typeof window.stopAllSpeech === "function") {
            window.stopAllSpeech();
          }
          osgPauliLiveActive = false;
          if (osgPauliLiveStopper) {
            try {
              osgPauliLiveStopper();
            } catch (_) {}
            osgPauliLiveStopper = null;
          }
          const wakeBtn = document.getElementById("pauli-voice-wake-btn");
          if (wakeBtn) wakeBtn.classList.remove("is-listening");
          busy = false;
          container.classList.remove("is-busy");
          ttsLoading = false;
          osgLipSyncStop();
          osgTweenAvatarReturn();
          window.__OSG_DRAFT_CONFIRM_HANDLER__ = null;
          try {
            osgClearComplaintConversationState();
          } catch (_) {}
          if (!(opts && opts.skipWakeRestart)) {
            setTimeout(function () {
              try {
                if (typeof window.osgWakeStart === "function") window.osgWakeStart();
              } catch (_) {}
            }, 700);
          }
        }

        function osgPauliPickLiveAck(pack) {
          const pool = String((pack && pack.pauliLiveAckPool) || "")
            .split("|")
            .map(function (s) {
              return String(s || "").trim();
            })
            .filter(Boolean);
          if (!pool.length) return "";
          return pool[Math.floor(Math.random() * pool.length)];
        }

        async function osgPauliLiveMaybeAck(pack, lang, isNight, userText) {
          if (String(userText || "").trim().length < 35) return;
          const ack = osgPauliPickLiveAck(pack);
          if (!ack) return;
          try {
            await window.playPauliVoice(ack, {
              whisper: isNight,
              langCode: lang,
              skipCaptionClear: true,
            });
          } catch (_) {}
        }

        async function startPauliLiveConversation(opts) {
          opts = opts || {};
          if (!opts.fromGreeting) {
            if (typeof window.osgPauliTtsAbort === "function") {
              window.osgPauliTtsAbort();
            } else if (typeof window.stopAllSpeech === "function") {
              window.stopAllSpeech();
            }
          }
          if (
            window.__OSG_AVATAR_COMPANION_BOOT_RUNNING__ &&
            (opts.fromWake || opts.fromCoin || opts.fromGreeting)
          ) {
            window.__OSG_AVATAR_COMPANION_BOOT_RUNNING__ = false;
            window.__OSG_AVATAR_COMPANION_BOOT_DONE__ = true;
            busy = false;
            container.classList.remove("is-busy");
          } else if (window.__OSG_AVATAR_COMPANION_BOOT_RUNNING__) {
            return;
          }
          const freshConversation = !!(opts.fromWake || opts.fromCoin);
          const userInitiated = !!(
            opts.fromWake ||
            opts.fromCoin ||
            opts.fromGreeting ||
            opts.fromKeyboard
          );
          if (osgPauliLiveActive) {
            if (freshConversation) {
              osgPauliLiveStop({ skipWakeRestart: true });
            } else {
              return;
            }
          }
          if (busy && !userInitiated) return;
          osgPauliLiveActive = true;
          if (!opts.continueSession) {
            osgResetComplaintLiveContext();
          } else {
            osgClearComplaintConversationState();
          }
          busy = true;
          autoWaiDone = true;
          unlockAudioSystemFromCoinGesture();
          osgPauliLiveStopWake();
          container.classList.add("is-busy");

          const isNight = !isPauliDayPhase();
          const wakeBtn = document.getElementById("pauli-voice-wake-btn");
          let turns = 0;
          let osgPauliEmptyListenStreak = 0;
          const OSG_PAULI_EMPTY_LISTEN_MAX = 8;

          // Live dialogue: no marketing trend snippets — listen immediately after wake/coin.

          async function osgPauliHandleDraftPendingTurn(rawText, userText, pack, lang, isNight) {
            var draftOwn = window.OSG_DRAFT_OWNERSHIP;
            if (
              !draftOwn ||
              typeof draftOwn.hasPending !== "function" ||
              !draftOwn.hasPending()
            ) {
              return false;
            }

            if (osgPauliIsPureWakePhrase(rawText)) {
              osgResetComplaintLiveContext();
              return false;
            }

            var gateText = String(userText || "").trim();

            if (
              gateText &&
              typeof draftOwn.isConfirmIntent === "function" &&
              draftOwn.isConfirmIntent(gateText)
            ) {
              osgResetComplaintLiveContext();
              await osgPauliLiveSpeakReply(
                draftOwn.confirmedHandoffReply(lang),
                pack,
                lang,
                isNight
              );
              await listenOnce();
              return true;
            }
            if (
              gateText &&
              typeof draftOwn.isRejectIntent === "function" &&
              draftOwn.isRejectIntent(gateText)
            ) {
              osgResetComplaintLiveContext();
              await osgPauliLiveSpeakReply(
                draftOwn.rejectedReply(lang),
                pack,
                lang,
                isNight
              );
              await listenOnce();
              return true;
            }

            var rcFlow = window.OSG_RECLAMATION_COMPLIANCE;
            var draftFlowActive =
              rcFlow &&
              typeof rcFlow.isDraftRequest === "function" &&
              rcFlow.isDraftRequest(gateText);

            if (!draftFlowActive && gateText && !osgVoiceMatchCommand(gateText, pack)) {
              osgResetComplaintLiveContext();
              return false;
            }
            if (
              gateText &&
              typeof draftOwn.remindConfirmReply === "function" &&
              !osgVoiceMatchCommand(gateText, pack)
            ) {
              await osgPauliLiveSpeakReply(
                draftOwn.remindConfirmReply(lang),
                pack,
                lang,
                isNight
              );
              await listenOnce();
              return true;
            }
            return false;
          }

          async function processUserText(rawText) {
            if (!osgPauliLiveActive) return;

            // ── Interrupt: stop any active TTS the moment user speaks ──────────
            if (typeof window.osgPauliInterrupt === 'function') {
              await window.osgPauliInterrupt('user_spoke');
            }

            if (
              window.OSG_DIGITAL_HUMAN &&
              typeof window.OSG_DIGITAL_HUMAN.detectEmotion === "function"
            ) {
              window.OSG_DIGITAL_HUMAN.detectEmotion(String(rawText || ""));
            }

            const pack = osgVcCurrentPack();
            const lang = osgVcCurrentLangCode();
            turns += 1;
            if (turns > OSG_PAULI_LIVE_MAX_TURNS) {
              osgPauliLiveStop();
              return;
            }

            let userText = osgPauliStripWakePhrase(rawText);

            // ── Fall B: user wants Pauli to continue the interrupted sentence ──
            if (
              userText &&
              typeof window.osgDetectInterruptIntent === 'function' &&
              window.osgDetectInterruptIntent(userText, lang) === 'resume'
            ) {
              const resumeText =
                typeof window.osgBuildResumeText === 'function'
                  ? window.osgBuildResumeText(pack)
                  : '';
              if (resumeText) {
                await osgPauliLiveSpeakReply(resumeText, pack, lang, isNight);
                await listenOnce();
                return;
              }
            }

            if (await osgPauliHandleDraftPendingTurn(rawText, userText, pack, lang, isNight)) {
              return;
            }

            if (userText) {
              const cmd = osgVoiceMatchCommand(userText, pack);
              if (cmd) {
                if (cmd.id === "cancel") {
                  osgPauliLiveStop();
                  return;
                }
                if (cmd.id.indexOf("switchLang") === 0) {
                  const target = cmd.id.slice("switchLang".length).toLowerCase();
                  await osgAvatarExecuteLangSwitch(target, { pack: pack });
                  await listenOnce();
                  return;
                }
                try {
                  cmd.run();
                } catch (_) {}
                const ack = pack.voiceCmdAcknowledge || "";
                if (ack) {
                  await osgPauliLiveSpeakReply(ack, pack, lang, isNight);
                }
                await listenOnce();
                return;
              }
            }

            let reply = "";
            if (!userText) {
              if (osgPauliIsPureWakePhrase(rawText)) {
                osgResetComplaintLiveContext();
                turns = 0;
                osgPauliLiveStop({ skipWakeRestart: true });
                return;
              }
              osgPauliEmptyListenStreak += 1;
              if (osgPauliEmptyListenStreak >= OSG_PAULI_EMPTY_LISTEN_MAX) {
                osgPauliLiveStop({ skipWakeRestart: true });
                return;
              }
              await listenOnce();
              return;
            } else {
              osgPauliEmptyListenStreak = 0;
              var osgPauliLiveDialogueOnly = true;
              if (window.__OSG_AVATAR_PENDING_NAME_ASK__ && userText) {
                var spokenName = osgExtractSpokenName(userText);
                if (spokenName) {
                  osgPersistUserProfile({ userName: spokenName });
                  osgMarkPersonalOnboardDone("named");
                  window.__OSG_AVATAR_PENDING_NAME_ASK__ = false;
                  var nameAck = String(
                    (pack.avatarNameSavedTts || "").replace(
                      /\{NAME\}/g,
                      spokenName
                    ) || ""
                  ).trim();
                  if (nameAck) {
                    await osgPauliLiveSpeakReply(nameAck, pack, lang, isNight);
                  }
                  await listenOnce();
                  return;
                }
              }
              if (
                window.OSG_LANG_SWITCH_LOGIC &&
                window.osgAvatarController &&
                typeof window.osgAvatarController.speakPsychModule === "function"
              ) {
                var lsHit = window.OSG_LANG_SWITCH_LOGIC.analyze(
                  userText,
                  lang
                );
                if (lsHit) {
                  if (lsHit.type === "confirm_yes") {
                    await osgAvatarExecuteLangSwitch(lsHit.targetLang, {
                      pack: pack,
                    });
                    if (typeof osgEchoProtocol === "function") {
                      osgEchoProtocol("skill_learn_success", {
                        source: "lang_switch_confirm",
                        targetLang: lsHit.targetLang,
                      });
                    }
                    await listenOnce();
                    return;
                  }
                  if (lsHit.type === "confirm_no") {
                    window.OSG_LANG_SWITCH_LOGIC.clearPending();
                    var curLangName =
                      window.OSG_LANG_SWITCH_LOGIC.langDisplayName(lang, lang);
                    await window.osgAvatarController.speakPsychModule(
                      "lang_switch_declined",
                      {
                        langCode: lang,
                        pack: pack,
                        extras: { lang: curLangName },
                        skipBridge: true,
                        bridge: false,
                      }
                    );
                    await listenOnce();
                    return;
                  }
                  if (lsHit.type === "request") {
                    window.OSG_LANG_SWITCH_LOGIC.writePending(lsHit.targetLang);
                    var offerLangName =
                      window.OSG_LANG_SWITCH_LOGIC.langDisplayName(
                        lsHit.targetLang,
                        lang
                      );
                    await window.osgAvatarController.speakPsychModule(
                      "lang_switch_offer",
                      {
                        langCode: lang,
                        pack: pack,
                        extras: { lang: offerLangName },
                        skipBridge: true,
                        bridge: false,
                      }
                    );
                    await listenOnce();
                    return;
                  }
                  if (lsHit.type === "already") {
                    var alreadyLangName =
                      window.OSG_LANG_SWITCH_LOGIC.langDisplayName(
                        lsHit.targetLang,
                        lang
                      );
                    await window.osgAvatarController.speakPsychModule(
                      "lang_switch_already",
                      {
                        langCode: lang,
                        pack: pack,
                        extras: { lang: alreadyLangName },
                        skipBridge: true,
                        bridge: false,
                      }
                    );
                    await listenOnce();
                    return;
                  }
                }
              }
              if (
                !osgPauliLiveDialogueOnly &&
                window.osgAvatarController &&
                typeof window.osgAvatarController.noPressureCheck ===
                  "function" &&
                window.osgAvatarController.noPressureCheck(userText, lang)
              ) {
                await window.osgAvatarController.speakNoPressureRelease({
                  langCode: lang,
                  pack: pack,
                });
                await listenOnce();
                return;
              }
              if (
                !osgPauliLiveDialogueOnly &&
                window.OSG_INCLUSION_LOGIC &&
                window.osgAvatarController &&
                typeof window.osgAvatarController.speakInclusionBuddy ===
                  "function"
              ) {
                var incHit = window.OSG_INCLUSION_LOGIC.analyze(userText);
                if (incHit && incHit.moduleId) {
                  var spokeInc =
                    await window.osgAvatarController.speakInclusionBuddy(
                      incHit.moduleId,
                      { langCode: lang, pack: pack }
                    );
                  if (spokeInc) {
                    await listenOnce();
                    return;
                  }
                }
              }
              if (
                !osgPauliLiveDialogueOnly &&
                window.OSG_CROSS_SELL_LOGIC &&
                window.osgAvatarController &&
                typeof window.osgAvatarController.speakCrossSellModule ===
                  "function" &&
                !(
                  window.OSG_EMPATHY_LOGIC &&
                  typeof window.OSG_EMPATHY_LOGIC.isEmpathyRetreatActive ===
                    "function" &&
                  window.OSG_EMPATHY_LOGIC.isEmpathyRetreatActive()
                )
              ) {
                var csHit =
                  typeof window.OSG_CROSS_SELL_LOGIC.analyzeResolved ===
                  "function"
                    ? window.OSG_CROSS_SELL_LOGIC.analyzeResolved(userText)
                    : window.OSG_CROSS_SELL_LOGIC.analyze(userText);
                if (csHit && csHit.moduleId) {
                  var spokeCs =
                    await window.osgAvatarController.speakCrossSellModule(
                      csHit.moduleId,
                      { langCode: lang, pack: pack }
                    );
                  if (spokeCs) {
                    await listenOnce();
                    return;
                  }
                }
              }
              if (
                !osgPauliLiveDialogueOnly &&
                window.OSG_EMPATHY_LOGIC &&
                window.osgAvatarController &&
                typeof window.osgAvatarController.speakEmpathyChain ===
                  "function" &&
                !(
                  typeof window.OSG_EMPATHY_LOGIC.isEmpathyRetreatActive ===
                    "function" &&
                  window.OSG_EMPATHY_LOGIC.isEmpathyRetreatActive()
                )
              ) {
                var moodHit = window.OSG_EMPATHY_LOGIC.analyze(userText);
                if (moodHit && moodHit.triggerId) {
                  if (
                    moodHit.triggerId === "verliebt_mode" &&
                    typeof window.osgAvatarController.speakVerliebtChain ===
                      "function"
                  ) {
                    var spokeVerliebt =
                      await window.osgAvatarController.speakVerliebtChain({
                        langCode: lang,
                        pack: pack,
                      });
                    if (spokeVerliebt) {
                      await listenOnce();
                      return;
                    }
                  }
                  var spokeEmpathy =
                    await window.osgAvatarController.speakEmpathyChain(
                      moodHit.triggerId,
                      { langCode: lang, pack: pack, userText: userText }
                    );
                  if (spokeEmpathy) {
                    await listenOnce();
                    return;
                  }
                }
              }
              if (
                window.OSG_RECLAMATION_COMPLIANCE &&
                typeof window.OSG_RECLAMATION_COMPLIANCE.isRoleQuestion ===
                  "function" &&
                window.OSG_RECLAMATION_COMPLIANCE.isRoleQuestion(userText)
              ) {
                reply = window.OSG_RECLAMATION_COMPLIANCE.roleStatement(lang);
              } else if (
                window.OSG_RECLAMATION_COMPLIANCE &&
                typeof window.OSG_RECLAMATION_COMPLIANCE.isDraftRequest ===
                  "function" &&
                window.OSG_RECLAMATION_COMPLIANCE.isDraftRequest(userText) &&
                typeof window.OSG_RECLAMATION_COMPLIANCE.buildDraftSkeleton ===
                  "function"
              ) {
                reply = window.OSG_RECLAMATION_COMPLIANCE.buildDraftSkeleton(
                  lang,
                  {
                    issue: userText,
                    platform:
                      typeof window.OSG_RECLAMATION_COMPLIANCE.detectPlatform ===
                      "function"
                        ? window.OSG_RECLAMATION_COMPLIANCE.detectPlatform(
                            userText
                          )
                        : "both",
                  }
                );
              } else if (osgPauliDetectPoliticsReligionTopic(userText)) {
                reply = osgPauliWisdomDeflectReply(pack);
              } else {
                var intentHit =
                  window.OSG_INTENT_CLASSIFIER &&
                  typeof window.OSG_INTENT_CLASSIFIER.classify === "function"
                    ? window.OSG_INTENT_CLASSIFIER.classify(userText, lang)
                    : null;
                if (
                  intentHit &&
                  !intentHit.allowOpenAI &&
                  (await osgPauliHandleDeliveryIntent(
                    intentHit,
                    pack,
                    lang,
                    isNight
                  ))
                ) {
                  await listenOnce();
                  return;
                }
                if (
                  intentHit &&
                  !intentHit.allowOpenAI &&
                  (await osgPauliHandleIntentHit(
                    intentHit,
                    pack,
                    lang,
                    isNight
                  ))
                ) {
                  await listenOnce();
                  return;
                }
                var detLine = osgDetectiveLiveTurn(userText, lang);
                if (detLine) {
                  reply = detLine;
                } else {
                try {
                  await osgPauliLiveMaybeAck(pack, lang, isNight, userText);
                  if (
                    window.OSG_DIGITAL_HUMAN &&
                    typeof window.OSG_DIGITAL_HUMAN.enterThinking === "function"
                  ) {
                    window.OSG_DIGITAL_HUMAN.enterThinking(false);
                  }
                  reply = await osgPauliChatFetch(userText, lang);
                } catch (e) {
                  if (String(e && e.message) === "rate_limited") {
                    osgPauliLiveStop();
                    return;
                  }
                  reply = String(pack.pauliChatError || "").trim();
                  await osgPauliLiveSpeakReply(reply, pack, lang, isNight, {
                    dynamicSpeech: true,
                  });
                  await listenOnce();
                  return;
                } finally {
                  if (
                    window.OSG_DIGITAL_HUMAN &&
                    typeof window.OSG_DIGITAL_HUMAN.leaveThinking === "function"
                  ) {
                    window.OSG_DIGITAL_HUMAN.leaveThinking();
                  }
                }
                }
              }
            }

            reply = osgReclamationComplianceReply(reply, lang, userText);

            if (!reply && userText) {
              reply = String(pack.pauliChatError || "").trim();
              await osgPauliLiveSpeakReply(reply, pack, lang, isNight, {
                dynamicSpeech: true,
              });
              await listenOnce();
              return;
            }

            var draftOwnWrap = window.OSG_DRAFT_OWNERSHIP;
            if (
              reply &&
              draftOwnWrap &&
              typeof draftOwnWrap.needsConfirmation === "function" &&
              draftOwnWrap.needsConfirmation(reply, userText)
            ) {
              var draftPlatform = "both";
              if (
                window.OSG_RECLAMATION_COMPLIANCE &&
                typeof window.OSG_RECLAMATION_COMPLIANCE.detectPlatform ===
                  "function"
              ) {
                draftPlatform = window.OSG_RECLAMATION_COMPLIANCE.detectPlatform(
                  String(userText || "") + " " + reply
                );
              }
              draftOwnWrap.stagePending(reply, {
                lang: lang,
                platform: draftPlatform,
              });
              osgShowDraftConfirmOverlay(reply, lang);
              await osgPauliLiveSpeakReply(reply, pack, lang, isNight, {
                dynamicSpeech: true,
              });
              await osgPauliLiveSpeakReply(
                draftOwnWrap.reviewPrompt(lang),
                pack,
                lang,
                isNight,
                { dynamicSpeech: true }
              );
              await listenOnce();
              return;
            }

            if (
              reply &&
              window.OSG_DIGITAL_HUMAN &&
              typeof window.OSG_DIGITAL_HUMAN.chooseGesture === "function"
            ) {
              window.OSG_DIGITAL_HUMAN.chooseGesture(reply);
            }

            await osgPauliLiveSpeakReply(reply, pack, lang, isNight, {
              speechKey: window.__OSG_LAST_INTENT_SPEECH_KEY__ || "",
              segmentKey: window.__OSG_LAST_INTENT_SEGMENT_KEY__ || "",
              dynamicSpeech: !(
                window.__OSG_LAST_INTENT_SPEECH_KEY__ ||
                window.__OSG_LAST_INTENT_SEGMENT_KEY__
              ),
            });
            if (!osgPauliLiveActive) return;
            await listenOnce();
          }

          window.__OSG_DRAFT_CONFIRM_HANDLER__ = function (action) {
            if (!osgPauliLiveActive) return;
            void processUserText(
              action === "confirm" ? "bestätigen" : "verwerfen"
            );
          };

          function listenOnce() {
            return new Promise(function (resolve) {
              if (!osgPauliLiveActive) {
                resolve();
                return;
              }
              void (async function () {
                await osgPauliWaitTtsIdle(30000);
                if (!osgPauliLiveActive) {
                  resolve();
                  return;
                }
                const listenLang = osgVcCurrentLangCode();
                if (wakeBtn) wakeBtn.classList.add("is-listening");
                if (
                  window.OSG_DIGITAL_HUMAN &&
                  typeof window.OSG_DIGITAL_HUMAN.enterListening === "function"
                ) {
                  window.OSG_DIGITAL_HUMAN.enterListening(true);
                }
                osgPauliLiveStopper = osgVcStartListening(
                  listenLang,
                  function (text) {
                    osgPauliLiveStopper = null;
                    if (wakeBtn) wakeBtn.classList.remove("is-listening");
                    if (
                      window.OSG_DIGITAL_HUMAN &&
                      typeof window.OSG_DIGITAL_HUMAN.leaveListening === "function"
                    ) {
                      window.OSG_DIGITAL_HUMAN.leaveListening();
                    }
                    void processUserText(text).then(resolve);
                  },
                  function () {
                    osgPauliLiveStopper = null;
                    if (wakeBtn) wakeBtn.classList.remove("is-listening");
                    if (
                      window.OSG_DIGITAL_HUMAN &&
                      typeof window.OSG_DIGITAL_HUMAN.leaveListening === "function"
                    ) {
                      window.OSG_DIGITAL_HUMAN.leaveListening();
                    }
                    if (!osgPauliLiveActive) {
                      resolve();
                      return;
                    }
                    osgPauliEmptyListenStreak += 1;
                    if (osgPauliEmptyListenStreak >= OSG_PAULI_EMPTY_LISTEN_MAX) {
                      osgPauliLiveStop({ skipWakeRestart: true });
                      resolve();
                      return;
                    }
                    void listenOnce().then(resolve);
                  },
                  OSG_PAULI_LIVE_LISTEN_MS
                );
              })();
            });
          }

          if (opts.initialText) {
            await processUserText(opts.initialText);
          } else if (opts.fromGreeting || opts.fromKeyboard) {
            await listenOnce();
          } else if (opts.fromWake) {
            await listenOnce();
          } else if (opts.fromCoin) {
            return;
          } else {
            await listenOnce();
          }
        }

        window.startPauliLiveConversation = startPauliLiveConversation;

        function osgSpeakAck(line) {
          if (!line) return;
          try {
            if (
              window.PauliVoice &&
              typeof window.PauliVoice.speakText === "function"
            ) {
              Promise.resolve(window.PauliVoice.speakText(line, false)).catch(
                function () {}
              );
            } else if (typeof speakPauliUtterance === "function") {
              Promise.resolve(
                speakPauliUtterance(line, false, osgVcCurrentLangCode())
              ).catch(function () {});
            }
          } catch (_) {}
        }

        let osgVoiceCommandActive = false;
        let osgVoiceCommandStopper = null;

        /** Open a 6 s command window after wake. Returns true if a command fired. */
        window.osgStartVoiceCommandWindow = function osgStartVoiceCommandWindow(opts) {
          if (osgVoiceCommandActive) return false;
          osgVoiceCommandActive = true;
          const pack = osgVcCurrentPack();
          const lang = osgVcCurrentLangCode();
          const wakeBtn = document.getElementById("pauli-voice-wake-btn");
          if (wakeBtn) wakeBtn.classList.add("is-listening");
          if (
            window.OSG_DIGITAL_HUMAN &&
            typeof window.OSG_DIGITAL_HUMAN.enterListening === "function"
          ) {
            window.OSG_DIGITAL_HUMAN.enterListening(false);
          }
          let acted = false;
          let killTimer = 0;

          function finish(success) {
            if (!osgVoiceCommandActive) return;
            osgVoiceCommandActive = false;
            if (osgVoiceCommandStopper) {
              try { osgVoiceCommandStopper(); } catch (_) {}
              osgVoiceCommandStopper = null;
            }
            clearTimeout(killTimer);
            if (wakeBtn) wakeBtn.classList.remove("is-listening");
            if (
              window.OSG_DIGITAL_HUMAN &&
              typeof window.OSG_DIGITAL_HUMAN.leaveListening === "function"
            ) {
              window.OSG_DIGITAL_HUMAN.leaveListening();
            }
            if (opts && typeof opts.onDone === "function") {
              try { opts.onDone(!!success); } catch (_) {}
            }
          }

          osgVoiceCommandStopper = osgVcStartListening(
            lang,
            function onText(text) {
              if (acted) return;
              const cmd = osgVoiceMatchCommand(text, pack);
              if (!cmd) {
                var DL = window.OSG_DETECTIVE_LOGIC;
                var detAck =
                  DL && typeof DL.resolveTurn === "function"
                    ? (function () {
                        var hit = DL.resolveTurn(text, lang);
                        return hit && hit.line ? hit.line : "";
                      })()
                    : "";
                osgSpeakAck(
                  detAck ||
                    (DL && typeof DL.buildHypothesis === "function"
                      ? DL.buildHypothesis(
                          lang,
                          DL.defaultHypotheses(lang)
                        )
                      : pack.voiceCmdNoMatch || "")
                );
                finish(false);
                return;
              }
              acted = true;
              if (cmd.id.indexOf("switchLang") === 0) {
                const target = cmd.id.slice("switchLang".length).toLowerCase();
                void osgAvatarExecuteLangSwitch(target, { pack: pack }).then(
                  function () {
                    finish(true);
                  }
                );
                return;
              }
              const ack = pack.voiceCmdAcknowledge || "";
              try {
                cmd.run();
              } catch (_) {}
              if (ack) osgSpeakAck(ack);
              finish(true);
            },
            function onError() {
              if (acted) return;
              finish(false);
            }
          );

          killTimer = setTimeout(function () {
            if (!acted) finish(false);
          }, OSG_VC_LISTEN_MS + 500);

          return true;
        };

        /** Main API: open confirmation modal. Always tappable; voice listening only in A11y mode. */
        window.osgVoiceConfirm = function osgVoiceConfirm(intent, payload) {
          return new Promise((resolve) => {
            const root = document.getElementById("osg-voice-confirm");
            const titleEl = document.getElementById("osg-voice-confirm-title");
            const statusEl = document.getElementById("osg-voice-confirm-status");
            const yesBtn = document.getElementById("osg-voice-confirm-yes");
            const noBtn = document.getElementById("osg-voice-confirm-no");
            const backdrop = root && root.querySelector(".osg-voice-confirm__backdrop");
            if (!root || !titleEl || !yesBtn || !noBtn) {
              resolve(true);
              return;
            }
            const pack = osgVcCurrentPack();
            const lang = osgVcCurrentLangCode();
            const intentKey = "voiceConfirmAsk" +
              (intent ? intent.charAt(0).toUpperCase() + intent.slice(1) : "Generic");
            const tmpl = pack[intentKey] || pack.voiceConfirmAskGeneric || "Confirm?";
            const text = osgVcInterpolate(tmpl, payload);
            titleEl.textContent = text;
            yesBtn.textContent = pack.voiceConfirmYesBtn || "OK";
            noBtn.textContent = pack.voiceConfirmNoBtn || "Cancel";
            const a11y = window.osgA11y && window.osgA11y.isEnabled();
            statusEl.textContent = a11y
              ? (pack.voiceConfirmListening || "Listening …")
              : "";

            root.hidden = false;
            if (a11y) root.classList.add("is-listening");
            else root.classList.remove("is-listening");

            const prevFocus = document.activeElement;
            try { yesBtn.focus({ preventScroll: true }); } catch (_) { yesBtn.focus(); }

            let resolved = false;
            let stopListen = null;
            let hardTimer = 0;

            function cleanup(result) {
              if (resolved) return;
              resolved = true;
              if (stopListen) try { stopListen(); } catch (_) {}
              clearTimeout(hardTimer);
              root.hidden = true;
              root.classList.remove("is-listening");
              yesBtn.removeEventListener("click", onYes);
              noBtn.removeEventListener("click", onNo);
              if (backdrop) backdrop.removeEventListener("click", onNo);
              document.removeEventListener("keydown", onKey, true);
              try { if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true }); } catch (_) {}
              resolve(!!result);
            }
            function onYes() { cleanup(true); }
            function onNo() {
              var AC = window.osgAvatarController;
              if (AC && typeof AC.speakNoPressureRelease === "function") {
                void AC.speakNoPressureRelease({ langCode: lang, pack: pack })
                  .catch(function () {})
                  .finally(function () {
                    cleanup(false);
                  });
                return;
              }
              cleanup(false);
            }
            function onKey(ev) {
              if (ev.key === "Escape") { ev.preventDefault(); cleanup(false); }
              else if (ev.key === "Enter" && document.activeElement === yesBtn) {
                ev.preventDefault(); cleanup(true);
              }
            }
            yesBtn.addEventListener("click", onYes);
            noBtn.addEventListener("click", onNo);
            if (backdrop) backdrop.addEventListener("click", onNo);
            document.addEventListener("keydown", onKey, true);

            /* Speak the question (best-effort, never blocks the modal) */
            try {
              if (
                window.PauliVoice &&
                typeof window.PauliVoice.speakText === "function"
              ) {
                Promise.resolve(window.PauliVoice.speakText(text, false)).catch(
                  function () {}
                );
              } else if (typeof speakPauliUtterance === "function") {
                Promise.resolve(speakPauliUtterance(text, false, lang)).catch(
                  function () {}
                );
              }
            } catch (_) {}

            /* Start hybrid STT only in A11y mode */
            if (a11y) {
              stopListen = osgVcStartListening(
                lang,
                function onText(t) {
                  if (resolved) return;
                  if (osgVcPhraseMatch(t, pack.voiceConfirmYesPhrases)) {
                    cleanup(true);
                  } else if (osgVcPhraseMatch(t, pack.voiceConfirmNoPhrases)) {
                    var AC = window.osgAvatarController;
                    if (AC && typeof AC.speakNoPressureRelease === "function") {
                      void AC.speakNoPressureRelease({
                        langCode: lang,
                        pack: pack,
                      })
                        .catch(function () {})
                        .finally(function () {
                          cleanup(false);
                        });
                    } else {
                      cleanup(false);
                    }
                  } else {
                    statusEl.textContent =
                      pack.voiceConfirmTimeout ||
                      "No answer received. Please tap Confirm or Cancel.";
                    root.classList.remove("is-listening");
                  }
                },
                function onErr() {
                  if (resolved) return;
                  statusEl.textContent =
                    pack.voiceConfirmTimeout ||
                    "No answer received. Please tap Confirm or Cancel.";
                  root.classList.remove("is-listening");
                }
              );
            }

            /* Hard timeout: never block the UI forever (auto-cancel) */
            hardTimer = setTimeout(function () {
              if (!resolved) cleanup(false);
            }, OSG_VC_HARD_TIMEOUT_MS);
          });
        };

        function osgSpeechLangForUi(code) {
          const map = {
            de: "de-DE",
            en: "en-US",
            th: "th-TH",
            pl: "pl-PL",
            ru: "ru-RU",
            zh: "zh-CN",
          };
          return map[code] || "en-US";
        }

        /** Universeller Voice-Wake: Speech API (Chrome) → MediaRecorder+STT (Safari/Firefox). */
        function installPauliVoiceWake() {
          const wakeBtn = document.getElementById("pauli-voice-wake-btn");
          if (wakeBtn) wakeBtn.hidden = false;

          const SR =
            window.SpeechRecognition || window.webkitSpeechRecognition;
          const hasMedia =
            typeof navigator !== "undefined" &&
            navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === "function" &&
            typeof MediaRecorder !== "undefined";

          let rec = null;
          let wakeSrActive = false;
          let wakeMediaActive = false;
          let wakeMediaStream = null;
          let wakeMediaRecorder = null;
          let wakeMediaTimer = 0;
          let wakeRestartTimer = 0;

          function osgWakeSetListening(on) {
            if (wakeBtn) wakeBtn.classList.toggle("is-listening", !!on);
            var statusEl = document.getElementById("pauli-wake-status");
            if (!statusEl) return;
            if (on) {
              var pack =
                window.__OSG_CURRENT_PACK_CACHE ||
                (typeof T !== "undefined" ? T.de : {});
              statusEl.textContent =
                (pack && pack.pauliWakeListeningAnnounce) ||
                "Pauli is listening — say Hello Pauli or Hi Paulie";
            } else {
              statusEl.textContent = "";
            }
          }

          function osgWakeOnPhraseDetected(transcript) {
            osgWakeStopAll();
            unlockAudioSystemFromCoinGesture();
            const SB = window.OSG_STARTUP_BOOT;
            if (SB && !SB.sessionGreetDone()) {
              void osgPauliRunUserSessionGreeting({ fromWake: true });
              return;
            }
            void startPauliLiveConversation({
              fromWake: true,
              initialText: String(transcript || "").trim(),
            });
          }

          function osgWakeTestPhrase(text) {
            return osgPauliWakeMatches(text);
          }

          async function osgSttWakeTranscribe(blob, mime) {
            try {
              const b64 = await new Promise(function (resolve, reject) {
                const fr = new FileReader();
                fr.onload = function () {
                  const s = String(fr.result || "");
                  const idx = s.indexOf(",");
                  resolve(idx >= 0 ? s.slice(idx + 1) : "");
                };
                fr.onerror = reject;
                fr.readAsDataURL(blob);
              });
              if (!b64) return "";
              const I = window.__OSG_I18N;
              const code = I ? I.systemLangCode() : "en";
              const res = await osgApiFetch("/api/stt/wake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audioBase64: b64,
                  mime: mime || blob.type || "audio/webm",
                  lang: code,
                }),
              });
              if (!res.ok) return "";
              const data = await res.json();
              return typeof data.text === "string" ? data.text : "";
            } catch (_) {
              return "";
            }
          }

          function osgWakeStopSr() {
            wakeSrActive = false;
            clearTimeout(wakeRestartTimer);
            try {
              rec && rec.stop();
            } catch (_) {}
            rec = null;
          }

          function osgWakeStopMedia() {
            wakeMediaActive = false;
            clearTimeout(wakeMediaTimer);
            try {
              wakeMediaRecorder && wakeMediaRecorder.state !== "inactive" &&
                wakeMediaRecorder.stop();
            } catch (_) {}
            wakeMediaRecorder = null;
            if (wakeMediaStream) {
              wakeMediaStream.getTracks().forEach(function (t) {
                try {
                  t.stop();
                } catch (_) {}
              });
            }
            wakeMediaStream = null;
          }

          function osgWakeStopAll() {
            osgWakeStopSr();
            osgWakeStopMedia();
            osgWakeSetListening(false);
          }

          function osgWakeStartSr() {
            if (
              !SR ||
              wakeSrActive ||
              wakeMediaActive ||
              osgPauliLiveActive ||
              window.__OSG_SESSION_GREET_RUNNING__
            ) {
              return;
            }
            const I = window.__OSG_I18N;
            const code = I ? I.systemLangCode() : "en";
            try {
              rec = new SR();
              rec.continuous = true;
              rec.interimResults = true;
              rec.maxAlternatives = 1;
              rec.lang = osgSpeechLangForUi(code);
              rec.onresult = function (ev) {
                for (let i = ev.resultIndex; i < ev.results.length; i++) {
                  const t = String(
                    ev.results[i][0] && ev.results[i][0].transcript
                  ).trim();
                  if (osgWakeTestPhrase(t)) {
                    osgWakeOnPhraseDetected(t);
                    return;
                  }
                }
              };
              rec.onerror = function () {
                osgWakeStopSr();
                wakeRestartTimer = setTimeout(osgWakeStart, 2200);
              };
              rec.onend = function () {
                wakeSrActive = false;
                osgWakeSetListening(false);
                if (
                  !osgPauliLiveActive &&
                  !window.__OSG_SESSION_GREET_RUNNING__ &&
                  document.visibilityState === "visible"
                ) {
                  wakeRestartTimer = setTimeout(osgWakeStart, 900);
                }
              };
              rec.start();
              wakeSrActive = true;
              osgWakeSetListening(true);
            } catch (_) {
              wakeSrActive = false;
              osgWakeSetListening(false);
              wakeRestartTimer = setTimeout(osgWakeStart, 2800);
            }
          }

          async function osgWakeRecordOnceAndCheck() {
            if (!hasMedia || osgPauliLiveActive) return false;
            let stream = wakeMediaStream;
            try {
              if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                  },
                });
                wakeMediaStream = stream;
              }
            } catch (_) {
              return false;
            }
            const mime = MediaRecorder.isTypeSupported(
              "audio/webm;codecs=opus"
            )
              ? "audio/webm;codecs=opus"
              : MediaRecorder.isTypeSupported("audio/mp4")
                ? "audio/mp4"
                : "audio/webm";
            return new Promise(function (resolve) {
              const chunks = [];
              let recorder;
              try {
                recorder = new MediaRecorder(stream, { mimeType: mime });
              } catch (_) {
                resolve(false);
                return;
              }
              wakeMediaRecorder = recorder;
              recorder.ondataavailable = function (e) {
                if (e.data && e.data.size) chunks.push(e.data);
              };
              recorder.onstop = function () {
                wakeMediaRecorder = null;
                void (async function () {
                  if (!chunks.length) {
                    resolve(false);
                    return;
                  }
                  const blob = new Blob(chunks, { type: mime });
                  const text = await osgSttWakeTranscribe(blob, mime);
                  resolve(osgWakeTestPhrase(text));
                })();
              };
              recorder.onerror = function () {
                resolve(false);
              };
              try {
                recorder.start();
                setTimeout(function () {
                  try {
                    if (recorder.state !== "inactive") recorder.stop();
                  } catch (_) {
                    resolve(false);
                  }
                }, 2400);
              } catch (_) {
                resolve(false);
              }
            });
          }

          async function osgWakeMediaLoop() {
            if (
              !hasMedia ||
              wakeSrActive ||
              osgPauliLiveActive ||
              window.__OSG_SESSION_GREET_RUNNING__
            ) {
              return;
            }
            wakeMediaActive = true;
            osgWakeSetListening(true);
            while (
              wakeMediaActive &&
              !osgPauliLiveActive &&
              !window.__OSG_SESSION_GREET_RUNNING__ &&
              document.visibilityState === "visible"
            ) {
              const hit = await osgWakeRecordOnceAndCheck();
              if (hit) {
                osgWakeOnPhraseDetected("");
                return;
              }
              await new Promise(function (r) {
                wakeMediaTimer = setTimeout(r, 350);
              });
            }
            wakeMediaActive = false;
            osgWakeSetListening(false);
          }

          function osgWakeStart() {
            if (osgPauliLiveActive || window.__OSG_SESSION_GREET_RUNNING__) {
              return;
            }
            if (
              typeof window.osgIsPauliSpeaking === "function" &&
              window.osgIsPauliSpeaking()
            ) {
              return;
            }
            if (SR) {
              osgWakeStopMedia();
              osgWakeStartSr();
              return;
            }
            if (hasMedia) {
              osgWakeStopSr();
              void osgWakeMediaLoop();
            }
          }

          function osgWakeStartLiveFromAccessibility(opts) {
            opts = opts || {};
            unlockAudioSystemFromCoinGesture();
            osgWakeStopAll();
            const SB = window.OSG_STARTUP_BOOT;
            if (SB && !SB.sessionGreetDone()) {
              void osgPauliRunUserSessionGreeting({ fromWake: true });
              return;
            }
            void startPauliLiveConversation(
              Object.assign({ fromWake: true }, opts)
            );
          }

          async function osgWakePushToTalk() {
            unlockAudioSystemFromCoinGesture();
            osgWakeStopAll();
            osgWakeStartLiveFromAccessibility();
          }

          if (wakeBtn) {
            wakeBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              if (window.__OSG_GREETING_DONE_PENDING_MIC__) {
                window.__OSG_GREETING_DONE_PENDING_MIC__ = false;
                wakeBtn.classList.remove("osg-pulse-ready");
                if (
                  !osgPauliLiveActive &&
                  typeof startPauliLiveConversation === "function"
                ) {
                  unlockAudioSystemFromCoinGesture();
                  void startPauliLiveConversation({ fromGreeting: true });
                  return;
                }
              }
              void osgWakePushToTalk();
            });
          }

          document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") osgWakeStopAll();
            else if (window.__OSG_AUDIO_GESTURE_UNLOCKED__) {
              wakeRestartTimer = setTimeout(osgWakeMaybeStart, 700);
            }
          });

          function osgWakeArmAfterGesture() {
            document.removeEventListener("pointerdown", osgWakeArmAfterGesture);
            document.removeEventListener("keydown", osgWakeArmAfterGesture);
            setTimeout(osgWakeMaybeStart, 500);
          }
          document.addEventListener("pointerdown", osgWakeArmAfterGesture, {
            once: true,
            passive: true,
          });
          document.addEventListener("keydown", osgWakeArmAfterGesture, {
            once: true,
          });

          document.addEventListener("keydown", function (ev) {
            if (osgPauliLiveActive) return;
            if (!ev.altKey || !ev.shiftKey) return;
            if (String(ev.key || "").toLowerCase() !== "p") return;
            var tag = (ev.target && ev.target.tagName) || "";
            tag = String(tag).toUpperCase();
            if (
              tag === "INPUT" ||
              tag === "TEXTAREA" ||
              tag === "SELECT" ||
              (ev.target && ev.target.isContentEditable)
            ) {
              return;
            }
            ev.preventDefault();
            osgWakeStartLiveFromAccessibility({ fromKeyboard: true });
          });

          if (typeof window !== "undefined") {
            window.osgWakeStopAll = osgWakeStopAll;
            window.osgWakeStart = osgWakeStart;
            window.osgWakeStartLiveFromAccessibility =
              osgWakeStartLiveFromAccessibility;
          }
        }

        function osgWakeMaybeStart() {
          if (!window.__OSG_AUDIO_GESTURE_UNLOCKED__) {
            return;
          }
          if (window.__OSG_SESSION_GREET_RUNNING__) {
            return;
          }
          if (
            typeof window.osgIsPauliSpeaking === "function" &&
            window.osgIsPauliSpeaking()
          ) {
            return;
          }
          if (
            typeof osgPauliAudioAllowed === "function" &&
            !osgPauliAudioAllowed()
          ) {
            return;
          }
          if (typeof window.osgWakeStart === "function") window.osgWakeStart();
        }

        document.addEventListener("osg-terms-audio-unlocked", function () {
          unlockAudioSystemFromCoinGesture();
          void osgPauliPreloadBundledVoice();
          setTimeout(osgWakeMaybeStart, 320);
        });

        container.addEventListener("click", (e) => {
          if (osgEventTargetsStaticStand(e)) return;
          if (!osgEventTargetsCoinStage(e)) return;
          osgCoinActivateFromGesture();
        });

        container.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          if (osgEventTargetsStaticStand(e)) return;
          osgCoinActivateFromGesture();
        });

        function animate() {
          requestAnimationFrame(animate);
          const now = performance.now();
          const delta = Math.min(0.05, 1 / 60);
          osgTweenUpdate(now);
          osgLipSyncTick(now);
          if (
            window.OSG_DIGITAL_HUMAN &&
            typeof window.OSG_DIGITAL_HUMAN.tick === "function"
          ) {
            window.OSG_DIGITAL_HUMAN.tick(now, delta);
          }
          if (
            window.OSG_DIGITAL_HUMAN_MOTION &&
            typeof window.OSG_DIGITAL_HUMAN_MOTION.update === "function"
          ) {
            window.OSG_DIGITAL_HUMAN_MOTION.update(now, delta);
          }
          if (
            window.OSG_DH_EMOTION_LAYER &&
            typeof window.OSG_DH_EMOTION_LAYER.tick === "function"
          ) {
            window.OSG_DH_EMOTION_LAYER.tick(delta);
          }
          if (
            window.OSG_DH_EYE_CONTACT &&
            typeof window.OSG_DH_EYE_CONTACT.tick === "function"
          ) {
            window.OSG_DH_EYE_CONTACT.tick(delta);
          }
          if (
            window.OSG_DH_FINAL_POLISH &&
            typeof window.OSG_DH_FINAL_POLISH.tick === "function"
          ) {
            window.OSG_DH_FINAL_POLISH.tick(delta);
          }
          osgAvatarGestureTick(now, delta);
          if (waiActive) {
            const u = Math.min(1, (now - waiStart) / WAI_MS);
            const bow = Math.sin(u * Math.PI);
            avatarBow.rx = bow * -0.28;
            avatarBow.rz = Math.sin(u * Math.PI * 2) * 0.05 * bow;
            avatarBow.scale = 1 + bow * 0.04;
            osgApplyAvatarTransform(
              "rotateX(" +
                avatarBow.rx +
                "rad) rotateZ(" +
                avatarBow.rz +
                "rad) scale(" +
                avatarBow.scale +
                ")"
            );
          }
          if (ttsLoading || lipSyncActive) {
            container.classList.add("is-speaking");
          } else {
            container.classList.remove("is-speaking");
          }
          if (coinDebugOn && now >= coinDbgTickAt) {
            coinDbgTickAt = now + 700;
            coinDbgRender();
          }
        }
        function startAnimateLoop() {
          if (window.__OSG_ANIM_LOOP_STARTED__) return;
          window.__OSG_ANIM_LOOP_STARTED__ = true;
          animate();
        }
        if (
          window.OSG_DOM_BOOT &&
          typeof window.OSG_DOM_BOOT.whenWindowLoad === "function"
        ) {
          window.OSG_DOM_BOOT.whenWindowLoad(startAnimateLoop);
        } else if (document.readyState === "complete") {
          startAnimateLoop();
        } else {
          window.addEventListener("load", startAnimateLoop, { once: true });
        }

        installOsgGlobalFirstGestureUnlock();
        installPauliVoiceWake();
        installPauliVoice();
        if (typeof window.osgWirePsychologyTriggersOnce === "function") {
          window.osgWirePsychologyTriggersOnce();
        }
        if (typeof osgA11yInstallPanel === "function") osgA11yInstallPanel();
        if (typeof osgAvatarTourBoot === "function") osgAvatarTourBoot();
      }

      main();
