/**
 * Pauli Best Price — Reklamations-Compliance (kein Rechtsanwalt, Plattform-Treue).
 */
(function (global) {
  "use strict";

  var LANGS = ["de", "en", "th", "pl", "ru", "zh"];
  var SS_ROLE_SAID = "osg-reclamation-role-v1";
  var SS_SUPPORT_SAID = "osg-reclamation-support-v1";

  var ROLE = {
    id: "communication_assistant_wegweiser",
    isLawyer: false,
    isWegweiser: true,
  };

  var DISCLAIMER = {
    de: "Dies ist keine Rechtsberatung, sondern eine Vorlage für deine Kommunikation. Bitte prüfe die Angaben anhand deines Kaufbelegs.",
    en: "This is not legal advice — only a template for your communication. Please verify the details against your proof of purchase.",
    th: "นี่ไม่ใช่คำปรึกษาทางกฎหมาย แต่เป็นแม่แบบสำหรับการสื่อสารของคุณ โปรดตรวจสอบข้อมูลกับหลักฐานการซื้อ",
    pl: "To nie jest porada prawna, lecz szablon do Twojej komunikacji. Sprawdź dane na podstawie dowodu zakupu.",
    ru: "Это не юридическая консультация, а шаблон для вашего общения. Проверьте данные по подтверждению покупки.",
    zh: "这不是法律意见，而是供您沟通使用的模板。请对照购物凭证核对信息。",
  };

  var ROLE_STATEMENT = {
    de: "Kurz zur Einordnung: Ich bin kein Rechtsanwalt, sondern dein Kommunikations-Assistent und Wegweiser für Reklamationen.",
    en: "Quick note: I'm not a lawyer — I'm your communication assistant and guide for complaints.",
    th: "ขอชี้แจงสั้น ๆ: ผมไม่ใช่ทนายความ แต่เป็นผู้ช่วยสื่อสารและไกด์เรื่องการแจ้งปัญหา/เคลม",
    pl: "Krótko: nie jestem prawnikiem — jestem asystentem komunikacji i przewodnikiem w reklamacjach.",
    ru: "Коротко: я не юрист — я помощник по коммуникации и навигатор для рекламаций.",
    zh: "说明：我不是律师，而是协助您投诉沟通的向导助手。",
  };

  var SUPPORT_PLEDGE = {
    de: "Wir lassen dich nicht im Regen stehen – Pauli hilft dir, deine Rechte beim Händler effizient durchzusetzen!",
    en: "We won't leave you in the rain — Pauli helps you assert your rights with the merchant efficiently!",
    th: "เราไม่ทิ้งคุณให้เดียว — Pauli ช่วยให้คุณเดินสิทธิ์กับร้านค้าได้อย่างมีประสิทธิภาพ!",
    pl: "Nie zostawiamy cię w deszczu — Pauli pomaga skutecznie dochodzić twoich praw u sprzedawcy!",
    ru: "Мы не бросим вас — Pauli помогает эффективно отстаивать ваши права у продавца!",
    zh: "我们不会让您独自面对——Pauli 帮您高效地向商家主张权益！",
  };

  var WARRANTY_GAP_HINT = {
    de: "Der Händler sagt zwar {MERCHANT}, aber gesetzlich ist oft {LEGAL} üblich – wir setzen das in die Anfrage!",
    en: "The seller mentions {MERCHANT}, but {LEGAL} is often the usual statutory reference — we'll put that in your message!",
    th: "ร้านบอกว่า {MERCHANT} แต่ตามกฎหมายมักเป็น {LEGAL} — เราจะใส่ในแบบข้อความให้!",
    pl: "Sprzedawca mówi {MERCHANT}, ale prawnie często obowiązuje {LEGAL} — uwzględnimy to w wiadomości!",
    ru: "Продавец указывает {MERCHANT}, но по закону часто применяют {LEGAL} — добавим это в обращение!",
    zh: "商家称 {MERCHANT}，但法定常见为 {LEGAL}——我们会写进您的沟通文本！",
  };

  var WARRANTY_DRAFT_LINE = {
    de: "Hinweis: Die vom Händler genannte Garantie ({MERCHANT}) liegt unter dem, was gesetzlich oft üblich ist ({LEGAL}). Ich bitte um Prüfung nach den einschlägigen Verbraucherschutzregeln.",
    en: "Note: The seller's stated warranty ({MERCHANT}) is below what is often usual under consumer protection ({LEGAL}). Please review under applicable rules.",
    th: "หมายเหตุ: ระยะประกันที่ร้านแจ้ง ({MERCHANT}) ต่ำกว่าที่มักใช้ตามกฎหมาย ({LEGAL}) ขอให้ตรวจสอบตามสิทธิผู้บริโภค",
    pl: "Uwaga: Gwarancja sprzedawcy ({MERCHANT}) jest niższa niż często stosuje się prawnie ({LEGAL}). Proszę o weryfikację.",
    ru: "Примечание: гарантия продавца ({MERCHANT}) ниже обычно применяемой по закону ({LEGAL}). Прошу проверить.",
    zh: "说明：商家所述保修（{MERCHANT}）低于法定常见期限（{LEGAL}）。请依法核实。",
  };

  var PLATFORM_INSTRUCTION = {
    lazada: {
      de: "Bitte sende diesen Textentwurf direkt im Chat-System des Händlers auf Lazada — so hältst du dich an die Plattform-Richtlinien.",
      en: "Please send this draft directly in the merchant's Lazada chat — that keeps you within platform rules.",
      th: "กรุณาส่งข้อความร่างนี้ในแชทของร้านค้าบน Lazada โดยตรง — เพื่อให้สอดคล้องกับนโยบายแพลตฟอร์ม",
      pl: "Wyślij ten szkic bezpośrednio na czacie sprzedawcy w Lazada — zgodnie z zasadami platformy.",
      ru: "Отправьте черновик прямо в чат продавца на Lazada — так вы соблюдаете правила площадки.",
      zh: "请直接在 Lazada 商家聊天中发送本草稿——以符合平台规则。",
    },
    shopee: {
      de: "Bitte sende diesen Textentwurf direkt im Chat-System des Händlers auf Shopee — so hältst du dich an die Plattform-Richtlinien.",
      en: "Please send this draft directly in the merchant's Shopee chat — that keeps you within platform rules.",
      th: "กรุณาส่งข้อความร่างนี้ในแชทของร้านค้าบน Shopee โดยตรง — เพื่อให้สอดคล้องกับนโยบายแพลตฟอร์ม",
      pl: "Wyślij ten szkic bezpośrednio na czacie sprzedawcy w Shopee — zgodnie z zasadami platformy.",
      ru: "Отправьте черновик прямо в чат продавца на Shopee — так вы соблюдаете правила площадки.",
      zh: "请直接在 Shopee 商家聊天中发送本草稿——以符合平台规则。",
    },
    both: {
      de: "Bitte sende diesen Textentwurf direkt im Chat-System des Händlers auf Lazada oder Shopee — nicht per privater Messenger-App.",
      en: "Please send this draft in the merchant's Lazada or Shopee in-app chat — not via private messengers.",
      th: "กรุณาส่งข้อความร่างนี้ในแชทร้านค้าบน Lazada หรือ Shopee โดยตรง — ไม่ใช่แอปแชทส่วนตัว",
      pl: "Wyślij szkic na czacie sprzedawcy w Lazada lub Shopee — nie w prywatnym komunikatorze.",
      ru: "Отправьте черновик в чате продавца на Lazada или Shopee — не в личных мессенджерах.",
      zh: "请直接在 Lazada 或 Shopee 商家应用内聊天发送——不要用私人聊天软件。",
    },
  };

  var RECLAMATION_TOPIC_PATTERNS = [
    /\b(reklamation|reklamier|mängel|mangelhaft|defekt|beschädigt|falsch(?:e)?\s+lieferung|rückerstattung|erstattung|widerruf|garantie|gewährleistung|kaufbeleg|bestellnummer)\b/i,
    /\b(complaint|refund|return|defective|damaged|wrong\s+item|warranty|merchant|seller)\b/i,
    /\b(แจ้งปัญหา|คืนเงิน|สินค้าเสีย|ของผิด|เคลม|ร้องเรียน|ใบเสร็จ)\b/i,
    /\b(reklamacja|zwrot|wad|uszkodz|paragon)\b/i,
    /\b(рекламац|возврат|брак|поврежд|чек|продавец)\b/i,
    /\b(投诉|退款|退货|瑕疵|损坏|发错|收据|商家)\b/i,
  ];

  var LEGAL_REFERENCE_PATTERNS = [
    /\bocpb\b/i,
    /\boffice of the consumer protection board\b/i,
    /\bสคบ\b/,
    /\bzivilgesetzbuch\b/i,
    /\bcivil\s+code\b/i,
    /\bประมวลกฎหมายแพ่ง\b/,
    /\bพ\.ร\.บ\./,
    /\bconsumer protection\b/i,
    /\bverbraucherschutz\b/i,
    /\bgesetzliche\s+frist\b/i,
    /\bstatutory\s+(?:deadline|period)\b/i,
    /\bกำหนดเวลาตามกฎหมาย\b/,
    /\bprawo\s+konsumenckie\b/i,
    /\bзащит[аы]\s+прав\s+потребител/i,
    /\b消费者保护\b/,
    /\b民法\b/,
  ];

  var DRAFT_REQUEST_PATTERNS = [
    /\b(textentwurf|entwurf|vorlage|formulier(?:e|en)?|schreib(?:e|en)?\s+(?:mir\s+)?(?:einen?\s+)?(?:text|brief|nachricht|mail))\b/i,
    /\b(draft|template|write\s+(?:a\s+)?(?:letter|message|complaint|text))\b/i,
    /\b(ร่างข้อความ|ช่วยเขียน|เขียนจดหมาย)\b/i,
    /\b(szkic|napisz\s+(?:list|wiadomość))\b/i,
    /\b(черновик|напиш(?:и|ите)\s+(?:письмо|текст|жалобу))\b/i,
    /\b(草稿|帮我写|写一封)\b/i,
  ];

  var LAWYER_CLAIM_PATTERNS = [
    /\b(als\s+(?:dein(?:e|er)?\s+)?rechtsanwalt|dein\s+anwalt|ich\s+vertrete\s+dich\s+rechtlich)\b/gi,
    /\b(as your lawyer|your attorney|legal representative for you)\b/gi,
    /\b(ทนายของคุณ|เป็นทนายให้)\b/gi,
    /\b(twój\s+prawnik|reprezentuję\s+cię)\b/gi,
    /\b(ваш\s+юрист|представляю\s+вас)\b/gi,
    /\b(我是你的律师|作为你的律师)\b/gi,
  ];

  var DRAFT_MARKERS = [
    /\b(sehr geehrte|mit freundlichen grüßen|dear seller|dear sir|เรียน\s*ร้าน|уважаем)/i,
    /\b(textentwurf|entwurf|draft|template|vorlage|ร่างข้อความ|szkic|черновик|草稿)\b/i,
  ];

  var ROLE_QUESTION_PATTERNS = [
    /\b(bist du|sind sie)\s+(ein\s+)?(anwalt|rechtsanwalt|lawyer|attorney)\b/i,
    /\b(are you|you a)\s+(a\s+)?(lawyer|attorney|solicitor)\b/i,
    /\b(ใช่ทนาย|เป็นทนาย|ทนายความไหม)\b/i,
    /\b(czy jesteś|jesteś)\s+prawnik/i,
    /\b(ты\s+юрист|вы\s+юрист)\b/i,
    /\b(你是律师|是不是律师)\b/,
  ];

  var INSULT_PATTERNS = [
    /\b(betrüger|scammer|idiot|dumm|incompetent|moron|fraudster)\b/gi,
    /\b(โกง|โง่|บ้า)\b/gi,
    /\b(oszust|idiota)\b/gi,
    /\b(мошенник|идиот)\b/gi,
    /\b(骗子|白痴)\b/gi,
  ];

  var THREAT_PATTERNS = [
    /\b(ich werde dich verklagen|we will sue|lawsuit against you|or else|sonst wirst du)\b/gi,
    /\b(จะฟ้องคุณ|ดำเนินคดีทันที)\b/gi,
    /\b(pozwę cię|pójdę do sądu)\b/gi,
    /\b(подам в суд|судиться)\b/gi,
    /\b(起诉你|告你)\b/gi,
  ];

  function normalizeLang(code) {
    var c = String(code || "en")
      .toLowerCase()
      .split("-")[0];
    if (c === "zh") return "zh";
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function line(bucket, lang) {
    var L = normalizeLang(lang);
    return String((bucket && (bucket[L] || bucket.en || bucket.de)) || "").trim();
  }

  function matchesAny(text, patterns) {
    var t = String(text || "");
    var i;
    for (i = 0; i < patterns.length; i++) {
      if (patterns[i].test(t)) return true;
    }
    return false;
  }

  function isReclamationTopic(text) {
    return matchesAny(text, RECLAMATION_TOPIC_PATTERNS);
  }

  function isRoleQuestion(text) {
    return matchesAny(text, ROLE_QUESTION_PATTERNS);
  }

  function isDraftRequest(text) {
    if (matchesAny(text, DRAFT_REQUEST_PATTERNS)) return true;
    return (
      isReclamationTopic(text) &&
      /\b(schreib|formulier|entwurf|draft|template|vorlage|ร่าง|napisz|напиш|写)\b/i.test(
        String(text || "")
      )
    );
  }

  function referencesLaw(text) {
    return matchesAny(text, LEGAL_REFERENCE_PATTERNS);
  }

  function looksLikeDraft(text) {
    return matchesAny(text, DRAFT_MARKERS);
  }

  function detectPlatform(text) {
    var t = String(text || "").toLowerCase();
    var laz = /\blazada\b/i.test(t);
    var sho = /\bshopee\b/i.test(t);
    if (laz && sho) return "both";
    if (laz) return "lazada";
    if (sho) return "shopee";
    return "both";
  }

  function disclaimerFor(lang) {
    return line(DISCLAIMER, lang);
  }

  function roleStatement(lang) {
    return line(ROLE_STATEMENT, lang);
  }

  function platformInstruction(lang, platform) {
    var key = platform === "lazada" || platform === "shopee" ? platform : "both";
    return line(PLATFORM_INSTRUCTION[key], lang);
  }

  function supportPledge(lang) {
    return line(SUPPORT_PLEDGE, lang);
  }

  function fillPlaceholders(template, map) {
    var out = String(template || "");
    var k;
    for (k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) {
        out = out.replace(new RegExp("\\{" + k + "\\}", "g"), String(map[k] || ""));
      }
    }
    return out.trim();
  }

  function buildWarrantyGapHint(lang, userText) {
    var WL = global.OSG_WARRANTY_LEGAL_STANDARDS;
    if (!WL || typeof WL.buildWarrantyCheck !== "function") return "";
    var hit = WL.buildWarrantyCheck(lang, userText);
    if (!hit) return "";
    return fillPlaceholders(line(WARRANTY_GAP_HINT, lang), {
      MERCHANT: hit.merchantLabel,
      LEGAL: hit.legalLabel,
    });
  }

  function buildWarrantyDraftLine(lang, userText) {
    var WL = global.OSG_WARRANTY_LEGAL_STANDARDS;
    if (!WL || typeof WL.buildWarrantyCheck !== "function") return "";
    var hit = WL.buildWarrantyCheck(lang, userText);
    if (!hit) return "";
    return fillPlaceholders(line(WARRANTY_DRAFT_LINE, lang), {
      MERCHANT: hit.merchantLabel,
      LEGAL: hit.legalLabel,
    });
  }

  function markSupportSaid() {
    try {
      global.sessionStorage.setItem(SS_SUPPORT_SAID, "1");
    } catch (_) {}
  }

  function shouldSaySupport() {
    try {
      return global.sessionStorage.getItem(SS_SUPPORT_SAID) !== "1";
    } catch (_) {
      return true;
    }
  }

  function hasDisclaimer(text, lang) {
    var t = String(text || "");
    var d = disclaimerFor(lang);
    if (d && t.indexOf(d.slice(0, 40)) >= 0) return true;
    var i;
    for (i = 0; i < LANGS.length; i++) {
      var alt = disclaimerFor(LANGS[i]);
      if (alt && t.indexOf(alt.slice(0, 32)) >= 0) return true;
    }
    return /keine\s+rechtsberatung|not\s+legal\s+advice|ไม่ใช่คำปรึกษาทางกฎหมาย|Vorlage\s+für\s+deine\s+Kommunikation|template\s+for\s+your\s+communication/i.test(
      t
    );
  }

  function hasPlatformInstruction(text) {
    return /lazada|shopee|แพลตฟอร์ม|platform/i.test(String(text || ""));
  }

  function stripLawyerClaims(text) {
    var out = String(text || "");
    var i;
    for (i = 0; i < LAWYER_CLAIM_PATTERNS.length; i++) {
      out = out.replace(LAWYER_CLAIM_PATTERNS[i], "");
    }
    return out.replace(/\s{2,}/g, " ").trim();
  }

  function sanitizeTone(text) {
    var out = String(text || "");
    var i;
    for (i = 0; i < INSULT_PATTERNS.length; i++) {
      out = out.replace(INSULT_PATTERNS[i], "");
    }
    for (i = 0; i < THREAT_PATTERNS.length; i++) {
      out = out.replace(THREAT_PATTERNS[i], "");
    }
    return out.replace(/\s{2,}/g, " ").trim();
  }

  function markRoleSaid() {
    try {
      global.sessionStorage.setItem(SS_ROLE_SAID, "1");
    } catch (_) {}
  }

  function shouldSayRole() {
    try {
      return global.sessionStorage.getItem(SS_ROLE_SAID) !== "1";
    } catch (_) {
      return true;
    }
  }

  function needsComplianceWrap(userText, replyText) {
    if (isReclamationTopic(userText)) return true;
    if (looksLikeDraft(replyText)) return true;
    if (referencesLaw(replyText)) return true;
    return false;
  }

  function complianceWrap(replyText, lang, opts) {
    opts = opts || {};
    lang = normalizeLang(lang);
    var body = sanitizeTone(stripLawyerClaims(String(replyText || "").trim()));
    if (!body) return body;
    var userText = String(opts.userText || "");
    if (!needsComplianceWrap(userText, body) && !opts.force) {
      return body;
    }
    var parts = [];
    if (
      opts.includeSupport !== false &&
      shouldSaySupport() &&
      isReclamationTopic(userText)
    ) {
      parts.push(supportPledge(lang));
      markSupportSaid();
    }
    if (opts.includeRole !== false && shouldSayRole() && isReclamationTopic(userText)) {
      parts.push(roleStatement(lang));
      markRoleSaid();
    }
    var warrantyHint = buildWarrantyGapHint(lang, userText);
    if (warrantyHint && body.indexOf(warrantyHint.slice(0, 24)) < 0) {
      parts.push(warrantyHint);
    }
    parts.push(body);
    if (
      referencesLaw(body) ||
      looksLikeDraft(body) ||
      isReclamationTopic(userText) ||
      opts.force
    ) {
      if (!hasDisclaimer(body, lang)) {
        parts.push(disclaimerFor(lang));
      }
    }
    if (!hasPlatformInstruction(body)) {
      parts.push(
        platformInstruction(lang, opts.platform || detectPlatform(userText + " " + body))
      );
    }
    return parts.filter(Boolean).join("\n\n");
  }

  function buildDraftSkeleton(lang, opts) {
    opts = opts || {};
    lang = normalizeLang(lang);
    var order = String(opts.orderId || "[Bestellnummer]").trim();
    var issue = String(opts.issue || "[Sachverhalt]").trim();
    var warrantyLine = buildWarrantyDraftLine(lang, issue);
    var warrantyBlock = warrantyLine ? "\n\n" + warrantyLine : "";
    var templates = {
      de:
        "Sehr geehrte Damen und Herren,\n\n" +
        "bezugnehmend auf meine Bestellung " +
        order +
        " teile ich Ihnen mit, dass " +
        issue +
        "." +
        warrantyBlock +
        "\n\n" +
        "Ich bitte um eine sachliche Prüfung und eine Lösung innerhalb der gesetzlichen Fristen (z. B. nach einschlägigem Verbraucherschutz bzw. Zivilgesetzbuch/OCPB — je nach Fall).\n\n" +
        "Mit freundlichen Grüßen",
      en:
        "Dear Seller,\n\n" +
        "Regarding order " +
        order +
        ", I wish to report that " +
        issue +
        "." +
        warrantyBlock +
        "\n\n" +
        "Please review this matter and propose a solution within the applicable statutory periods (e.g. consumer protection / Civil Code / OCPB as relevant).\n\n" +
        "Kind regards",
      th:
        "เรียน ร้านค้า\n\n" +
        "อ้างอิงคำสั่งซื้อ " +
        order +
        " ขอแจ้งว่า " +
        issue +
        "." +
        warrantyBlock +
        "\n\n" +
        "ขอให้ตรวจสอบและเสนอทางแก้ไขภายในกรอบเวลาตามกฎหมายที่เกี่ยวข้อง (เช่น สคบ./ประมวลกฎหมายแพ่ง ตามกรณี)\n\n" +
        "ขอแสดงความนับถือ",
      pl:
        "Szanowni Państwo,\n\n" +
        "W sprawie zamówienia " +
        order +
        " informuję, że " +
        issue +
        "." +
        warrantyBlock +
        "\n\n" +
        "Proszę o sprawdzenie sprawy i rozwiązanie w ustawowych terminach (np. prawo konsumenckie / kodeks cywilny / OCPB — zależnie od przypadku).\n\n" +
        "Z poważaniem",
      ru:
        "Уважаемый продавец,\n\n" +
        "По заказу " +
        order +
        " сообщаю, что " +
        issue +
        "." +
        warrantyBlock +
        "\n\n" +
        "Прошу проверить ситуацию и предложить решение в сроки, установленные применимым законодательством (например, защита прав потребителей / Гражданский кодекс / OCPB).\n\n" +
        "С уважением",
      zh:
        "尊敬的商家：\n\n" +
        "关于订单 " +
        order +
        "，现说明：" +
        issue +
        "。" +
        warrantyBlock +
        "\n\n" +
        "请核实并在适用法律规定的期限内提出解决方案（如消费者保护/民法/OCPB 等，视情况而定）。\n\n" +
        "此致敬礼",
    };
    var draft = String(templates[lang] || templates.en).trim();
    return complianceWrap(draft, lang, {
      userText: issue,
      platform: opts.platform,
      includeRole: true,
      force: true,
    });
  }

  global.OSG_RECLAMATION_COMPLIANCE = {
    ROLE: ROLE,
    LANGS: LANGS,
    normalizeLang: normalizeLang,
    isReclamationTopic: isReclamationTopic,
    isRoleQuestion: isRoleQuestion,
    isDraftRequest: isDraftRequest,
    referencesLaw: referencesLaw,
    looksLikeDraft: looksLikeDraft,
    detectPlatform: detectPlatform,
    disclaimerFor: disclaimerFor,
    roleStatement: roleStatement,
    supportPledge: supportPledge,
    platformInstruction: platformInstruction,
    buildWarrantyGapHint: buildWarrantyGapHint,
    buildWarrantyDraftLine: buildWarrantyDraftLine,
    sanitizeTone: sanitizeTone,
    complianceWrap: complianceWrap,
    buildDraftSkeleton: buildDraftSkeleton,
    needsComplianceWrap: needsComplianceWrap,
  };
})(typeof window !== "undefined" ? window : globalThis);
