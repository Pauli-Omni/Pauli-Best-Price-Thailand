/**
 * Pauli Best Price — Entwurfs-Freigabe & User-Ownership (kein Blind-Versand).
 */
(function (global) {
  "use strict";

  var LANGS = [
    "th", "en", "de", "pl", "ru", "zh",
    "fr", "es", "it", "pt", "nl",
    "ar", "ja", "ko", "vi", "tr", "hi", "id",
  ];
  var SS_PENDING = "osg-draft-pending-v1";

  var COPY = {
    heading: {
      de: "Reklamations-Entwurf prüfen",
      en: "Review your complaint draft",
      th: "ตรวจสอบร่างข้อความร้องเรียน",
      pl: "Sprawdź szkic reklamacji",
      ru: "Проверьте черновик жалобы",
      zh: "请审核投诉草稿",
    },
    lead: {
      de: "Pauli sendet nichts für dich. Bitte lies den Text und bestätige erst dann den Versand im Händler-Chat.",
      en: "Pauli does not send anything for you. Read the text and confirm before you paste it in the merchant chat.",
      th: "Pauli ไม่ส่งให้คุณ โปรดอ่านข้อความและยืนยันก่อนส่งในแชทร้านค้า",
      pl: "Pauli nic nie wysyła za ciebie. Przeczytaj tekst i potwierdź przed wysłaniem na czacie sprzedawcy.",
      ru: "Pauli ничего не отправляет за вас. Прочитайте текст и подтвердите перед отправкой в чате продавца.",
      zh: "Pauli 不会代您发送。请先阅读文本，再在商家聊天中确认发送。",
    },
    ownership: {
      de: "Die letzte Entscheidung liegt bei dir — Pauli ist nur Wegweiser.",
      en: "The final decision is yours — Pauli is only your guide.",
      th: "การตัดสินใจสุดท้ายเป็นของคุณ — Pauli เป็นแค่ไกด์",
      pl: "Ostateczna decyzja należy do ciebie — Pauli jest tylko przewodnikiem.",
      ru: "Последнее решение за вами — Pauli лишь навигатор.",
      zh: "最终决定权在您——Pauli 只是向导。",
    },
    confirmBtn: {
      de: "Entwurf geprüft — ich sende selbst",
      en: "Draft reviewed — I'll send it myself",
      th: "ตรวจแล้ว — ฉันจะส่งเอง",
      pl: "Sprawdzone — wyślę sam",
      ru: "Проверил — отправлю сам",
      zh: "已审核——我自己发送",
    },
    cancelBtn: {
      de: "Verwerfen",
      en: "Discard",
      th: "ยกเลิก",
      pl: "Odrzuć",
      ru: "Отменить",
      zh: "放弃",
    },
    reviewPrompt: {
      de: "Hier ist dein Entwurf auf dem Bildschirm. Bitte prüfe jeden Satz — ich sende nichts automatisch. Sag „bestätigen“ oder tippe den Button, wenn du den Text selbst im Händler-Chat einfügen willst.",
      en: "Your draft is on screen. Please check every line — I never send automatically. Say “confirm” or tap the button when you're ready to paste it in the merchant chat yourself.",
      th: "ร่างอยู่บนหน้าจอแล้ว โปรดตรวจทุกบรรทัด — ผมไม่ส่งอัตโนมัติ พูดว่า “ยืนยัน” หรือกดปุ่มเมื่อพร้อมวางในแชทร้านค้าเอง",
      pl: "Szkic jest na ekranie. Sprawdź każde zdanie — nic nie wysyłam automatycznie. Powiedz „potwierdzam” lub naciśnij przycisk, gdy wkleisz tekst sam na czacie.",
      ru: "Черновик на экране. Проверьте каждую строку — я ничего не отправляю сам. Скажите «подтверждаю» или нажмите кнопку, когда вставите текст в чат продавца.",
      zh: "草稿已在屏幕上。请逐句核对——我不会自动发送。准备好自行粘贴到商家聊天时说“确认”或点按钮。",
    },
    confirmed: {
      de: "Alles klar — füge den Text jetzt selbst im Lazada- oder Shopee-Chat ein. Pauli sendet nichts für dich; die Freigabe hattest du gerade selbst gegeben.",
      en: "Got it — paste the text yourself in the Lazada or Shopee chat now. Pauli never sends for you; you just gave the final approval.",
      th: "โอเค — วางข้อความในแชท Lazada หรือ Shopee เองนะ Pauli ไม่ส่งแทน คุณเพิ่งยืนยันเอง",
      pl: "Jasne — wklej tekst sam na czacie Lazada lub Shopee. Pauli nic nie wysyła; właśnie sam potwierdziłeś.",
      ru: "Понял — вставьте текст сами в чат Lazada или Shopee. Pauli не отправляет; вы только что сами подтвердили.",
      zh: "好的——请自行粘贴到 Lazada 或 Shopee 聊天。Pauli 不会代发；您刚才已自行确认。",
    },
    rejected: {
      de: "Entwurf verworfen — kein Versand. Sag Bescheid, wenn du einen neuen Text brauchst.",
      en: "Draft discarded — nothing sent. Tell me if you need a new one.",
      th: "ยกเลิกร่างแล้ว — ไม่มีการส่ง บอกได้ถ้าต้องการร่างใหม่",
      pl: "Szkic odrzucony — nic nie wysłano. Daj znać, jeśli chcesz nowy.",
      ru: "Черновик отменён — ничего не отправлено. Скажите, если нужен новый.",
      zh: "草稿已放弃——未发送。需要新稿请告诉我。",
    },
    remind: {
      de: "Der Entwurf wartet noch auf deine Freigabe. Prüfe den Text auf dem Bildschirm und bestätige — oder sag „verwerfen“.",
      en: "The draft still needs your approval. Check the text on screen and confirm — or say “discard”.",
      th: "ร่างยังรอการยืนยันของคุณ ตรวจบนหน้าจอแล้วยืนยัน — หรือพูดว่า “ยกเลิก”",
      pl: "Szkic czeka na twoją zgodę. Sprawdź na ekranie i potwierdź — albo powiedz „odrzuć”.",
      ru: "Черновик ждёт вашего подтверждения. Проверьте на экране и подтвердите — или скажите «отменить».",
      zh: "草稿仍待您确认。请在屏幕上核对并确认——或说“放弃”。",
    },
  };

  var CONFIRM_PATTERNS = [
    /\b(bestätigen|bestätige|bestätigt|bestätig|confirm|confirmed|ja\s+senden|sende\s+ab|passt\s+so|okay\s+passt|freigeben)\b/i,
    /\b(ยืนยัน|ส่งเอง|โอเค\s*ส่ง)\b/i,
    /\b(potwierdzam|wyślę\s+sam)\b/i,
    /\b(подтверждаю|отправлю\s+сам)\b/i,
    /\b(确认|我自己发|发送)\b/i,
  ];

  var REJECT_PATTERNS = [
    /\b(verwerf|abbrechen|discard|cancel|nein|nicht\s+senden|do\s+not\s+send)\b/i,
    /\b(ยกเลิก|ไม่ส่ง)\b/i,
    /\b(odrzuć|anuluj)\b/i,
    /\b(отмен|не\s+отправ)\b/i,
    /\b(放弃|不发送|取消)\b/i,
  ];

  function normalizeLang(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    if (c === "zh") return "zh";
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function line(bucket, lang) {
    return String((bucket && (bucket[normalizeLang(lang)] || bucket.en || bucket.de)) || "").trim();
  }

  function matchesAny(text, patterns) {
    var t = String(text || "");
    var i;
    for (i = 0; i < patterns.length; i++) {
      if (patterns[i].test(t)) return true;
    }
    return false;
  }

  function needsConfirmation(replyText, userText) {
    var RC = global.OSG_RECLAMATION_COMPLIANCE;
    if (!RC) return false;
    var reply = String(replyText || "").trim();
    var user = String(userText || "").trim();
    if (!reply) return false;
    if (typeof RC.isDraftRequest === "function" && RC.isDraftRequest(user)) {
      return true;
    }
    return false;
  }

  function readPending() {
    try {
      var raw = global.sessionStorage.getItem(SS_PENDING);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && o.draft ? o : null;
    } catch (_) {
      return null;
    }
  }

  function hasPending() {
    return !!readPending();
  }

  function stagePending(draft, meta) {
    meta = meta || {};
    try {
      global.sessionStorage.setItem(
        SS_PENDING,
        JSON.stringify({
          draft: String(draft || "").trim(),
          lang: normalizeLang(meta.lang),
          platform: String(meta.platform || "both"),
          at: Date.now(),
        })
      );
    } catch (_) {}
  }

  function clearPending() {
    try {
      global.sessionStorage.removeItem(SS_PENDING);
    } catch (_) {}
  }

  function isConfirmIntent(text) {
    return matchesAny(text, CONFIRM_PATTERNS);
  }

  function isRejectIntent(text) {
    return matchesAny(text, REJECT_PATTERNS);
  }

  function overlayCopy(lang) {
    lang = normalizeLang(lang);
    return {
      heading: line(COPY.heading, lang),
      lead: line(COPY.lead, lang),
      ownership: line(COPY.ownership, lang),
      confirmBtn: line(COPY.confirmBtn, lang),
      cancelBtn: line(COPY.cancelBtn, lang),
      confirmAria: line(COPY.confirmBtn, lang),
      cancelAria: line(COPY.cancelBtn, lang),
      dialogAria: line(COPY.heading, lang),
    };
  }

  function reviewPrompt(lang) {
    return line(COPY.reviewPrompt, lang);
  }

  function confirmedHandoffReply(lang) {
    return line(COPY.confirmed, lang);
  }

  function rejectedReply(lang) {
    return line(COPY.rejected, lang);
  }

  function remindConfirmReply(lang) {
    return line(COPY.remind, lang);
  }

  function clearWorkflow() {
    clearPending();
  }

  global.OSG_DRAFT_OWNERSHIP = {
    LANGS: LANGS,
    normalizeLang: normalizeLang,
    needsConfirmation: needsConfirmation,
    hasPending: hasPending,
    readPending: readPending,
    stagePending: stagePending,
    clearPending: clearPending,
    isConfirmIntent: isConfirmIntent,
    isRejectIntent: isRejectIntent,
    overlayCopy: overlayCopy,
    reviewPrompt: reviewPrompt,
    confirmedHandoffReply: confirmedHandoffReply,
    rejectedReply: rejectedReply,
    remindConfirmReply: remindConfirmReply,
    clearWorkflow: clearWorkflow,
  };
})(typeof window !== "undefined" ? window : globalThis);
