/**
 * Pauli Best Price Thailand — Psychology-Module (Wegweiser, kein Druck).
 * Locker, direkt, leicht provokativ. Disclaimer + Wink werden im Avatar-Controller gesetzt.
 */
(function (global) {
  "use strict";

  var LANGS = ["de", "en", "th", "pl", "ru", "zh"];
  var COOLDOWN_MS = 90000;
  var COMPLIANCE_GLOBAL_KEY = "compliance_global";

  var MODULES = {
    credit_view: {
      de: {
        speechKey: "psychCreditViewTts",
        tts: "Hey — du checkst den Bank-Link? Fair. Ich seh da oft Zins-Spielraum. Ob du klickst, ist deine Show.",
        bubble: "Kredit-Wegweiser — du entscheidest.",
      },
      en: {
        speechKey: "psychCreditViewTts",
        tts: "Hey — eyeing the bank link? Fair. I often spot interest wiggle room there. Click or not — your call.",
        bubble: "Credit guide — you decide.",
      },
      th: {
        speechKey: "psychCreditViewTts",
        tts: "เฮ้ — มองลิงก์ธนาคารอยู่เหรอ? โอเคนะ ผมมักเห็นช่องลดดอกเบี้ยตรงนี้ จะคลิกหรือไม่ — คุณเป็นคนกำหนด",
        bubble: "ไกด์เรื่องเครดิต — คุณตัดสินใจ",
      },
      pl: {
        speechKey: "psychCreditViewTts",
        tts: "Hej — gapisz na link banku? Spoko. Tu często widać luz na odsetkach. Klikasz czy nie — twoja decyzja.",
        bubble: "Przewodnik kredytowy — ty decydujesz.",
      },
      ru: {
        speechKey: "psychCreditViewTts",
        tts: "Эй — смотришь на банковскую ссылку? Норм. Тут часто есть запас по процентам. Кликать или нет — только твоё.",
        bubble: "Проводник по кредиту — решаешь ты.",
      },
      zh: {
        speechKey: "psychCreditViewTts",
        tts: "嘿——在看银行链接？没问题。这儿常有降息空间。点不点，你说了算。",
        bubble: "信贷向导——你来决定。",
      },
    },
    credit_hesitate: {
      de: {
        speechKey: "psychCreditHesitateTts",
        tts: "Zögerst du? Versteh ich total. Niemand springt gern blind auf Bank-Zeug. Schau in Ruhe — Druck gibt's hier null.",
        bubble: "Kein Druck — nur ein Wegweiser-Hinweis.",
      },
      en: {
        speechKey: "psychCreditHesitateTts",
        tts: "Hesitating? I get it. Nobody loves jumping blind into bank stuff. Take your time — zero pressure here.",
        bubble: "No pressure — just a guide nudge.",
      },
      th: {
        speechKey: "psychCreditHesitateTts",
        tts: "ลังเลอยู่เหรอ? เข้าใจเลย ใครจะอยากกระโดดเข้าเรื่องธนาคารแบบมืด ๆ ดูไปเรื่อย ๆ นะ — ไม่มีการบังคับ",
        bubble: "ไม่กดดัน — แค่ชี้ทาง",
      },
      pl: {
        speechKey: "psychCreditHesitateTts",
        tts: "Wahasz się? Rozumiem. Nikt nie skacze chętnie w bankowe tematy na oślep. Oglądaj spokojnie — zero nacisku.",
        bubble: "Bez presji — tylko podpowiedź.",
      },
      ru: {
        speechKey: "psychCreditHesitateTts",
        tts: "Сомневаешься? Понимаю. В банковские темы вслепую не прыгают. Смотри спокойно — давления ноль.",
        bubble: "Без давления — только подсказка.",
      },
      zh: {
        speechKey: "psychCreditHesitateTts",
        tts: "在犹豫？懂。没人爱盲目碰银行产品。慢慢看——这儿零施压。",
        bubble: "不施压——只是指路。",
      },
    },
    insurance_view: {
      de: {
        speechKey: "psychInsuranceViewTts",
        tts: "Versicherung — langweilig, bis's ohne richtig weh tut. Ich zeig dir nur den günstigeren Weg. Du bist der Boss.",
        bubble: "Versicherungs-Wegweiser — du hast das Sagen.",
      },
      en: {
        speechKey: "psychInsuranceViewTts",
        tts: "Insurance — boring until you need it without one. I'll just point to a cheaper lane. You're the boss.",
        bubble: "Insurance guide — you're in charge.",
      },
      th: {
        speechKey: "psychInsuranceViewTts",
        tts: "ประกัน — น่าเบื่อจนกว่าจะไม่มีแล้วเจ็บกระเป๋า ผมแค่ชี้ทางประหยัด คุณเป็นคนสั่ง",
        bubble: "ไกด์ประกัน — คุณเป็นหัวหน้า",
      },
      pl: {
        speechKey: "psychInsuranceViewTts",
        tts: "Ubezpieczenie — nudne, dopóki bez niego nie boli. Pokażę tylko tańszą ścieżkę. Ty rządzisz.",
        bubble: "Przewodnik ubezpieczeń — ty decydujesz.",
      },
      ru: {
        speechKey: "psychInsuranceViewTts",
        tts: "Страховка — скучно, пока без неё не больно. Покажу только путь подешевле. Ты главный.",
        bubble: "Проводник по страховке — ты решаешь.",
      },
      zh: {
        speechKey: "psychInsuranceViewTts",
        tts: "保险——没出事前都无聊，出事就疼钱包。我只指更省的路。你说了算。",
        bubble: "保险向导——你做主。",
      },
    },
    credit_click: {
      de: {
        speechKey: "psychCreditClickTts",
        tts: "Alles klar — ich zeig dir nur den Weg zum Anbieter. Kein Verkauf von mir, jeder Schritt liegt bei dir.",
        bubble: "Wegweiser-Modus — du entscheidest.",
      },
      en: {
        speechKey: "psychCreditClickTts",
        tts: "Got it — I'll just point you to the provider. No pitch from me; every step is yours.",
        bubble: "Guide mode — you decide.",
      },
      th: {
        speechKey: "psychCreditClickTts",
        tts: "โอเค — ผมแค่ชี้ทางไปยังผู้ให้บริการ ไม่ขายอะไร ทุกขั้นตอนคุณเป็นคนกำหนด",
        bubble: "โหมดไกด์ — คุณตัดสินใจ",
      },
      pl: {
        speechKey: "psychCreditClickTts",
        tts: "Jasne — tylko wskażę drogę do dostawcy. Bez sprzedaży ode mnie; każdy krok należy do ciebie.",
        bubble: "Tryb przewodnika — ty decydujesz.",
      },
      ru: {
        speechKey: "psychCreditClickTts",
        tts: "Понял — просто укажу путь к провайдеру. Без продаж с моей стороны; каждый шаг за тобой.",
        bubble: "Режим проводника — решаешь ты.",
      },
      zh: {
        speechKey: "psychCreditClickTts",
        tts: "明白——我只给你指路到服务商。我不推销，每一步都由你决定。",
        bubble: "向导模式——你来决定。",
      },
    },
    insurance_click: {
      de: {
        speechKey: "psychInsuranceClickTts",
        tts: "Okay — nur der Wegweiser öffnet sich. Ich bin kein Vertreter, du schaust in Ruhe und entscheidest selbst.",
        bubble: "Wegweiser-Modus — kein Vertrieb.",
      },
      en: {
        speechKey: "psychInsuranceClickTts",
        tts: "Okay — just opening the guide lane. I'm not an agent; look calmly and decide yourself.",
        bubble: "Guide mode — no sales desk.",
      },
      th: {
        speechKey: "psychInsuranceClickTts",
        tts: "โอเค — แค่เปิดทางไกด์ ผมไม่ใช่ตัวแทนขาย ดูสบาย ๆ แล้วตัดสินใจเอง",
        bubble: "โหมดไกด์ — ไม่ขายประกัน",
      },
      pl: {
        speechKey: "psychInsuranceClickTts",
        tts: "Okej — tylko otwieram ścieżkę przewodnika. Nie jestem agentem; oglądaj spokojnie i decyduj sam.",
        bubble: "Tryb przewodnika — bez sprzedaży.",
      },
      ru: {
        speechKey: "psychInsuranceClickTts",
        tts: "Ок — просто открываю путь-проводник. Я не агент; смотри спокойно и решай сам.",
        bubble: "Режим проводника — без продаж.",
      },
      zh: {
        speechKey: "psychInsuranceClickTts",
        tts: "好——只是打开向导通道。我不是销售代表；你慢慢看，自己决定。",
        bubble: "向导模式——不推销。",
      },
    },
    real_estate_click: {
      de: {
        speechKey: "psychRealEstateClickTts",
        tts: "Immobilien-Link — ich bin nur Wegweiser, kein Makler. Schau dir alles in Ruhe an, du entscheidest.",
        bubble: "Immo-Wegweiser — du hast das Sagen.",
      },
      en: {
        speechKey: "psychRealEstateClickTts",
        tts: "Property link — I'm just a guide, not a broker. Take your time looking; you decide.",
        bubble: "Property guide — you're in charge.",
      },
      th: {
        speechKey: "psychRealEstateClickTts",
        tts: "ลิงก์อสังหา — ผมเป็นแค่ไกด์ ไม่ใช่นายหน้า ดูให้ดี คุณตัดสินใจเอง",
        bubble: "ไกด์อสังหา — คุณเป็นคนสั่ง",
      },
      pl: {
        speechKey: "psychRealEstateClickTts",
        tts: "Link nieruchomości — jestem tylko przewodnikiem, nie pośrednikiem. Oglądaj spokojnie; ty decydujesz.",
        bubble: "Przewodnik nieruchomości — ty rządzisz.",
      },
      ru: {
        speechKey: "psychRealEstateClickTts",
        tts: "Ссылка на недвижимость — я только проводник, не брокер. Смотри спокойно; решаешь ты.",
        bubble: "Проводник по недвижимости — ты главный.",
      },
      zh: {
        speechKey: "psychRealEstateClickTts",
        tts: "房产链接——我只是向导，不是中介。慢慢看，你来决定。",
        bubble: "房产向导——你做主。",
      },
    },
    automotive_click: {
      de: {
        speechKey: "psychAutomotiveClickTts",
        tts: "Auto-Thema — ich zeig nur den Weg zum Partner. Kein Verkaufsdruck, du entscheidest jeden Schritt.",
        bubble: "Auto-Wegweiser — kein Druck.",
      },
      en: {
        speechKey: "psychAutomotiveClickTts",
        tts: "Car topic — I'll just point to the partner route. No sales pressure; you own every step.",
        bubble: "Auto guide — no pressure.",
      },
      th: {
        speechKey: "psychAutomotiveClickTts",
        tts: "เรื่องรถ — ผมแค่ชี้ทางไปพาร์ทเนอร์ ไม่กดดันขาย ทุกขั้นตอนคุณเป็นคนกำหนด",
        bubble: "ไกด์รถ — ไม่กดดัน",
      },
      pl: {
        speechKey: "psychAutomotiveClickTts",
        tts: "Temat auta — tylko wskażę drogę do partnera. Bez presji sprzedaży; każdy krok należy do ciebie.",
        bubble: "Przewodnik aut — bez presji.",
      },
      ru: {
        speechKey: "psychAutomotiveClickTts",
        tts: "Тема авто — просто укажу путь к партнёру. Без давления продаж; каждый шаг за тобой.",
        bubble: "Проводник по авто — без давления.",
      },
      zh: {
        speechKey: "psychAutomotiveClickTts",
        tts: "汽车话题——我只给你指到合作方。不施压推销，每一步都由你决定。",
        bubble: "汽车向导——不施压。",
      },
    },

    // ── Sokratische Module: Immobilien (Real Estate) ──────────────────────────
    // Trigger: user browses real estate section — Socratic guiding question first
    real_estate_view: {
      de: {
        speechKey: "psychRealEstateViewTts",
        tts: "Immobilien interessiert dich? Kurze Frage, kein Druck: Was wäre dir wichtiger — kurzer Arbeitsweg oder günstigerer Quadratmeterpreis? Die Antwort entscheidet mehr als du denkst.",
        bubble: "Immo-Wegweiser — deine Priorität zuerst.",
      },
      en: {
        speechKey: "psychRealEstateViewTts",
        tts: "Eyeing real estate? Quick question, no pressure: What matters more — shorter commute or lower price per square metre? Your answer changes everything.",
        bubble: "Property guide — your priority first.",
      },
      th: {
        speechKey: "psychRealEstateViewTts",
        tts: "สนใจอสังหาฯอยู่เหรอ? ขอถามหน่อยนะ: อะไรสำคัญกว่า — ระยะทางใกล้ หรือ ราคาต่อตารางเมตรถูกกว่า? คำตอบนั้นเปลี่ยนทุกอย่างเลย",
        bubble: "ไกด์อสังหา — ความสำคัญของคุณก่อน",
      },
      pl: {
        speechKey: "psychRealEstateViewTts",
        tts: "Nieruchomości cię interesują? Szybkie pytanie, bez presji: Co ważniejsze — krótszy dojazd czy niższa cena za metr? Ta odpowiedź zmienia wszystko.",
        bubble: "Przewodnik nieruchomości — twój priorytet pierwsze.",
      },
      ru: {
        speechKey: "psychRealEstateViewTts",
        tts: "Недвижимость интересует? Быстрый вопрос, без давления: Что важнее — близкий путь до работы или цена за метр? Ответ решает всё.",
        bubble: "Проводник по недвижимости — твой приоритет первым.",
      },
      zh: {
        speechKey: "psychRealEstateViewTts",
        tts: "在看房产？一个问题，不施压：通勤近一点还是单价低一点，哪个更重要？这个答案决定一切。",
        bubble: "房产向导——先说你的优先级。",
      },
    },
    // Trigger: user hesitates / scrolls back on real estate
    real_estate_hesitate: {
      de: {
        speechKey: "psychRealEstateHesitateTts",
        tts: "Noch unschlüssig bei der Immobilie? Verständlich. Stell dir nur eine Frage selbst: Wenn du in drei Jahren noch Miete zahlst — was hat dich das dann wirklich gekostet?",
        bubble: "Kein Druck — nur ein Rechengedanke.",
      },
      en: {
        speechKey: "psychRealEstateHesitateTts",
        tts: "Still on the fence about property? That's fine. Just ask yourself: if you're still paying rent three years from now — what has that actually cost you?",
        bubble: "No pressure — just one thought to consider.",
      },
      th: {
        speechKey: "psychRealEstateHesitateTts",
        tts: "ยังไม่แน่ใจเรื่องอสังหาฯ? เข้าใจเลย แค่ถามตัวเองข้อเดียว: ถ้าอีกสามปียังเช่าอยู่ — มันทำให้คุณเสียเงินไปจริง ๆ เท่าไหร่?",
        bubble: "ไม่กดดัน — แค่ลองคิดดู",
      },
      pl: {
        speechKey: "psychRealEstateHesitateTts",
        tts: "Nadal niezdecydowany z nieruchomością? Rozumiem. Zadaj sobie jedno pytanie: jeśli za trzy lata dalej płacisz czynsz — ile to cię tak naprawdę kosztuje?",
        bubble: "Bez presji — tylko jedna myśl do rozważenia.",
      },
      ru: {
        speechKey: "psychRealEstateHesitateTts",
        tts: "Всё ещё в раздумьях по недвижимости? Понятно. Задай себе один вопрос: если через три года ты всё ещё платишь аренду — во сколько тебе это реально обходится?",
        bubble: "Без давления — только одна мысль.",
      },
      zh: {
        speechKey: "psychRealEstateHesitateTts",
        tts: "对房产还在犹豫？没关系。只问自己一个问题：如果三年后你还在租房——那实际上花了你多少钱？",
        bubble: "不施压——只是一个思考点。",
      },
    },

    // ── Sokratische Module: Auto (Automotive) ─────────────────────────────────
    // Trigger: user browses auto/car section
    automotive_view: {
      de: {
        speechKey: "psychAutomotiveViewTts",
        tts: "Autos schaust du dir an? Kurze Frage, ohne Druck: Fährst du mehr Stadtverkehr oder Autobahn? Deine Antwort entscheidet, wo du gerade wirklich Geld sparst.",
        bubble: "Auto-Wegweiser — dein Nutzungsprofil zuerst.",
      },
      en: {
        speechKey: "psychAutomotiveViewTts",
        tts: "Browsing cars? Quick one, no pressure: Do you mostly drive in the city or on the highway? Your answer determines where you're actually saving money right now.",
        bubble: "Car guide — your usage profile first.",
      },
      th: {
        speechKey: "psychAutomotiveViewTts",
        tts: "ดูรถอยู่เหรอ? ถามหน่อยนะ ไม่กดดัน: ขับในเมืองมากกว่า หรือ ทางไกล? คำตอบนั้นบอกเลยว่าคุณประหยัดเงินได้ตรงไหน",
        bubble: "ไกด์รถ — บอกรูปแบบการใช้งานก่อน",
      },
      pl: {
        speechKey: "psychAutomotiveViewTts",
        tts: "Przeglądasz auta? Szybko, bez presji: Jeździsz głównie po mieście czy po autostradzie? Twoja odpowiedź decyduje, gdzie naprawdę oszczędzasz.",
        bubble: "Przewodnik aut — twój profil użytkowania pierwszy.",
      },
      ru: {
        speechKey: "psychAutomotiveViewTts",
        tts: "Смотришь авто? Быстро, без давления: Больше едешь в городе или по трассе? Ответ определяет, где ты реально экономишь.",
        bubble: "Проводник по авто — сначала твой профиль езды.",
      },
      zh: {
        speechKey: "psychAutomotiveViewTts",
        tts: "在看车？快问一下，不施压：你主要跑市区还是高速？你的答案决定你现在真正能省钱的地方。",
        bubble: "汽车向导——先说你的使用习惯。",
      },
    },
    // Trigger: user hesitates / scrolls back on car section
    automotive_hesitate: {
      de: {
        speechKey: "psychAutomotiveHesitateTts",
        tts: "Noch unschlüssig beim Auto? Cool. Eine Frage nur: Lieber wissen, was wirklich drin steckt — oder mit dem Budget mehr Ausstattung bekommen? Deine Antwort trennt Neu von Gebraucht.",
        bubble: "Kein Druck — nur die eine Schlüsselfrage.",
      },
      en: {
        speechKey: "psychAutomotiveHesitateTts",
        tts: "Still undecided on a car? That's fine. One question: would you rather know exactly what's under the hood — or get more features for your budget? That one answer separates new from used.",
        bubble: "No pressure — just the key question.",
      },
      th: {
        speechKey: "psychAutomotiveHesitateTts",
        tts: "ยังไม่แน่ใจเรื่องรถ? โอเค ถามข้อเดียว: ชอบรู้ว่าข้างในรถมีอะไร — หรือ อยากได้ฟีเจอร์เพิ่มในราคาเดิม? คำตอบนั้นแยก รถใหม่ กับ รถมือสอง ได้เลย",
        bubble: "ไม่กดดัน — แค่คำถามสำคัญข้อเดียว",
      },
      pl: {
        speechKey: "psychAutomotiveHesitateTts",
        tts: "Nadal niezdecydowany z autem? Spoko. Jedno pytanie: wolisz wiedzieć dokładnie co jest w środku — czy dostać więcej wyposażenia za budżet? Ta odpowiedź oddziela nowe od używanego.",
        bubble: "Bez presji — tylko jedno kluczowe pytanie.",
      },
      ru: {
        speechKey: "psychAutomotiveHesitateTts",
        tts: "Всё ещё в раздумьях по авто? Нормально. Один вопрос: хочешь знать точно что внутри — или больше комплектации за бюджет? Этот ответ отделяет новое от б/у.",
        bubble: "Без давления — только один ключевой вопрос.",
      },
      zh: {
        speechKey: "psychAutomotiveHesitateTts",
        tts: "对车还在犹豫？没关系。就一个问题：你更想知道车里面到底有什么——还是用同样的预算获得更多配置？这个答案直接区分了新车和二手车。",
        bubble: "不施压——只是一个关键问题。",
      },
    },

    insurance_hesitate: {
      de: {
        speechKey: "psychInsuranceHesitateTts",
        tts: "Noch am Überlegen bei der Police? Cool. Ich stupse nur — kein Verkaufsschmonzes. Du sagst, wann's reicht.",
        bubble: "Überlegen ist okay.",
      },
      en: {
        speechKey: "psychInsuranceHesitateTts",
        tts: "Still weighing that policy? Cool. I'm just nudging — no sales fluff. You say when it's enough.",
        bubble: "Thinking it over is fine.",
      },
      th: {
        speechKey: "psychInsuranceHesitateTts",
        tts: "ยังคิดเรื่องกรมธรรม์อยู่เหรอ? โอเคเลย ผมแค่เตือนเบา ๆ — ไม่ขายของ คุณบอกเมื่อไหร่พอ",
        bubble: "คิดต่อได้สบาย ๆ",
      },
      pl: {
        speechKey: "psychInsuranceHesitateTts",
        tts: "Jeszcze ważysz tę polisę? Spoko. Tylko szturchnę — bez gadania sprzedażowego. Ty mówisz, kiedy dość.",
        bubble: "Możesz się wahać.",
      },
      ru: {
        speechKey: "psychInsuranceHesitateTts",
        tts: "Ещё думаешь над полисом? Ок. Лёгкий толчок — без продажной болтовни. Ты скажешь, когда хватит.",
        bubble: "Можно подумать.",
      },
      zh: {
        speechKey: "psychInsuranceHesitateTts",
        tts: "还在琢磨那份保单？行。我就轻推一下——不卖弄。够了由你说。",
        bubble: "慢慢想没关系。",
      },
    },
    inclusion_click: {
      de: {
        speechKey: "psychInclusionClickTts",
        tts: "Hey {NAME}, mach dir keinen Stress wegen der Bedienung. Ich bin deine Hände — sag mir einfach, was du willst, und ich klicke das für dich.",
        bubble: "Wir schaffen das zusammen.",
      },
      en: {
        speechKey: "psychInclusionClickTts",
        tts: "Hey {NAME}, don't stress the taps. I'm your hands — tell me what you want and I'll click it for you.",
        bubble: "We got this together.",
      },
      th: {
        speechKey: "psychInclusionClickTts",
        tts: "เฮ้ {NAME} ไม่ต้องเครียดเรื่องกดปุ่มนะ ผมเป็นมือให้ — บอกมาเลยว่าอยากได้อะไร เดี๋ยวผมกดให้",
        bubble: "เราทำด้วยกันได้",
      },
      pl: {
        speechKey: "psychInclusionClickTts",
        tts: "Hej {NAME}, bez stresu z klikaniem. Jestem twoimi rękami — powiedz, czego chcesz, a kliknę za ciebie.",
        bubble: "Ogarniemy to razem.",
      },
      ru: {
        speechKey: "psychInclusionClickTts",
        tts: "Эй, {NAME}, без стресса с кнопками. Я твои руки — скажи, что нужно, и я нажму за тебя.",
        bubble: "Справимся вместе.",
      },
      zh: {
        speechKey: "psychInclusionClickTts",
        tts: "嘿 {NAME}，别为操作发愁。我当你的手——告诉我要什么，我来帮你点。",
        bubble: "我们一起搞定。",
      },
    },
    inclusion_read: {
      de: {
        speechKey: "psychInclusionReadTts",
        tts: "Hey {NAME}, kein Stress mit dem Kleingedruckten. Ich lese dir vor, was zählt — du sagst nur, wohin wir als Nächstes gehen.",
        bubble: "Ich lese — du entscheidest.",
      },
      en: {
        speechKey: "psychInclusionReadTts",
        tts: "Hey {NAME}, no stress with tiny text. I'll read what matters — you just say where we go next.",
        bubble: "I read — you decide.",
      },
      th: {
        speechKey: "psychInclusionReadTts",
        tts: "เฮ้ {NAME} ไม่ต้องกังวลตัวหนังสือเล็ก ๆ ผมอ่านให้สิ่งสำคัญ — คุณบอกทางต่อไป",
        bubble: "ผมอ่าน — คุณตัดสินใจ",
      },
      pl: {
        speechKey: "psychInclusionReadTts",
        tts: "Hej {NAME}, bez stresu z drobnym drukiem. Przeczytam, co ważne — ty mówisz, dokąd dalej.",
        bubble: "Ja czytam — ty decydujesz.",
      },
      ru: {
        speechKey: "psychInclusionReadTts",
        tts: "Эй, {NAME}, без стресса с мелким шрифтом. Прочитаю важное — ты скажешь, куда дальше.",
        bubble: "Я читаю — ты решаешь.",
      },
      zh: {
        speechKey: "psychInclusionReadTts",
        tts: "嘿 {NAME}，别为小字头疼。重要内容我来读——你只说下一步去哪。",
        bubble: "我来读——你来定。",
      },
    },
    gift_bundle: {
      de: {
        speechKey: "psychGiftBundleTts",
        tts: "Blumen, Pralinen, eine Flasche Champagner und später ein schickes Essen. Wenn wir das richtig machen, lässt sie dich heute nicht mit kalten Füßen schlafen — versprochen!",
        bubble: "Komplett-Paket — locker unter Freunden.",
      },
      en: {
        speechKey: "psychGiftBundleTts",
        tts: "Flowers, chocolates, a bottle of bubbly, and a nice dinner later. Nail it right and she won't let you sleep with cold feet tonight — promise!",
        bubble: "Full package — friend mode.",
      },
      th: {
        speechKey: "psychGiftBundleTts",
        tts: "ดอกไม้ ช็อกโกแลต แชมเปญหนึ่งขวด แล้วค่อยมื้อดี ๆ ทีหลัง จัดให้ถูกทาง คืนนี้เธอไม่ปล่อยให้เท้าเย็นแน่ — รับปาก!",
        bubble: "แพ็กครบ — แบบเพื่อน ๆ",
      },
      pl: {
        speechKey: "psychGiftBundleTts",
        tts: "Kwiaty, czekoladki, butelka bąbelków i potem fajna kolacja. Jak zrobimy to dobrze, dziś nie zostawisz jej z zimnymi stopami — obiecuję!",
        bubble: "Pełny pakiet — po kumpelsku.",
      },
      ru: {
        speechKey: "psychGiftBundleTts",
        tts: "Цветы, конфеты, бутылка игристого и потом ужин. Сделаем как надо — сегодня она не оставит тебя с холодными ногами, обещаю!",
        bubble: "Полный пакет — по-дружески.",
      },
      zh: {
        speechKey: "psychGiftBundleTts",
        tts: "鲜花、巧克力、一瓶香槟，再来顿像样的晚餐。办妥了，今晚她不会让你脚丫冰凉——保证！",
        bubble: "全套礼包——朋友语气。",
      },
    },
    gift_bundle_th: {
      de: {
        speechKey: "psychGiftBundleThTts",
        tts: "Für Thailand: großer Blumenstrauß, dezentes Schmuckstück, dann Quality-Time im Sanuk-Stil — Gesicht wahren, leichtes Wai-Gefühl.",
        bubble: "Blumen + Schmuck + Sanuk.",
      },
      en: {
        speechKey: "psychGiftBundleThTts",
        tts: "For Thailand: big bouquet, subtle jewelry, then fun quality time — save face, soft wai spirit.",
        bubble: "Flowers + jewelry + Sanuk.",
      },
      th: {
        speechKey: "psychGiftBundleThTts",
        tts: "ช่อดอกไม้สวย ๆ เครื่องประดับเล็ก ๆ จากใจ แล้วค่อยใช้เวลาดี ๆ แบบสนุก ๆ — รักษาน้ำหน้า ไหว้เบา ๆ พอนะครับ",
        bubble: "ดอกไม้ + เครื่องประดับ + สนุก",
      },
      pl: {
        speechKey: "psychGiftBundleThTts",
        tts: "W Tajlandii: duży bukiet, subtelna biżuteria i radosny czas razem — honor twarzy, lekki wai.",
        bubble: "Kwiaty + biżuteria + Sanuk.",
      },
      ru: {
        speechKey: "psychGiftBundleThTts",
        tts: "Для Таиланда: большой букет, аккуратное украшение и весёлое время вместе — лицо цело, лёгкий wai.",
        bubble: "Цветы + украшение + Sanuk.",
      },
      zh: {
        speechKey: "psychGiftBundleThTts",
        tts: "泰国心意：大束鲜花、精致小首饰，再来一段轻松的共处时光——保全面子，轻轻合十即可。",
        bubble: "鲜花 + 首饰 + Sanuk。",
      },
    },
    gift_bundle_de: {
      de: {
        speechKey: "psychGiftBundleDeTts",
        tts: "Feine Pralinen und echte Zeit zu zweit — ohne Tamtam. Kleine Geste, großer Respekt, kein Verkaufsdruck.",
        bubble: "Pralinen + Zeit — DE-Stil.",
      },
      en: {
        speechKey: "psychGiftBundleDeTts",
        tts: "Fine pralines and real time together — no fuss. Small gesture, big respect, zero sales pressure.",
        bubble: "Pralines + time — DE style.",
      },
      th: {
        speechKey: "psychGiftBundleDeTts",
        tts: "ช็อกโกแลตพรีเมียมแบบเยอรมัน + เวลาจริงจังด้วยกัน ไม่โอ้อวด ท่าทางเล็ก ๆ เกียรติใหญ่ ไม่กดดันขาย",
        bubble: "พราลีน + เวลา — สไตล์เยอรมัน",
      },
      pl: {
        speechKey: "psychGiftBundleDeTts",
        tts: "Fine praliny i prawdziwy czas we dwoje — bez kitu. Mały gest, duży szacunek.",
        bubble: "Praliny + czas — styl DE.",
      },
      ru: {
        speechKey: "psychGiftBundleDeTts",
        tts: "Отборные пралине и настоящее время вдвоём — без пафоса. Малый жест, большое уважение.",
        bubble: "Пралине + время — стиль DE.",
      },
      zh: {
        speechKey: "psychGiftBundleDeTts",
        tts: "精致巧克力加实实在在的共处时间——不铺张。小举动，大尊重。",
        bubble: "巧克力 + 时间——德系。",
      },
    },
    cross_tools: {
      de: {
        speechKey: "psychCrossToolsTts",
        complianceDisclaimer: true,
        tts: "Na, schickes Werkzeug! Jetzt fehlt nur noch die richtige Absicherung — sonst wird's bei nem Kratzer richtig teuer. Ich vermittel dir was, ganz ohne Krawatten-Theater.",
        bubble: "Werkzeug top — Versicherung smarter.",
      },
      en: {
        speechKey: "psychCrossToolsTts",
        complianceDisclaimer: true,
        tts: "Nice tools! Now you need proper cover — one scratch gets pricey fast. I'll hook you up, no tie-guy theatre.",
        bubble: "Tools rock — cover smarter.",
      },
      th: {
        speechKey: "psychCrossToolsTts",
        complianceDisclaimer: true,
        tts: "เครื่องมือเจ๋ง! ต่อไปต้องมีประกันที่ใช่ — ขีดนิดเดียวอาจแพงมาก ผมช่วยต่อให้ ไม่มีละครเนคไท",
        bubble: "เครื่องมือโอเค — ประกันสำคัญ",
      },
      pl: {
        speechKey: "psychCrossToolsTts",
        complianceDisclaimer: true,
        tts: "Ładne narzędzia! Teraz ubezpieczenie — jeden rysa i portfel płacze. Połączę cię, bez teatru w krawacie.",
        bubble: "Narzędzia git — polisa też.",
      },
      ru: {
        speechKey: "psychCrossToolsTts",
        complianceDisclaimer: true,
        tts: "Классные инструменты! Теперь страховка — царапина и кошелёк плачет. Свожу без галстучного театра.",
        bubble: "Инструменты топ — покрытие тоже.",
      },
      zh: {
        speechKey: "psychCrossToolsTts",
        complianceDisclaimer: true,
        tts: "工具不错！接下来要保障——小刮蹭就疼钱包。我帮你牵线，不打领带戏码。",
        bubble: "工具行——保障也要。",
      },
    },
    cross_carpet: {
      de: {
        speechKey: "psychCrossCarpetTts",
        tts: "Sehr edel! Jetzt fehlt nur noch die passende Villa, damit der Teppich richtig zur Geltung kommt. Soll ich mich mal nach was Passendem umsehen?",
        bubble: "Teppich verdient eine Villa.",
      },
      en: {
        speechKey: "psychCrossCarpetTts",
        tts: "Very classy! Now you just need the right villa so that carpet can shine. Want me to scout something fitting?",
        bubble: "That carpet deserves a villa.",
      },
      th: {
        speechKey: "psychCrossCarpetTts",
        tts: "หรูมาก! ต่อไปแค่ต้องมีวิลล่าให้พรมโชว์เต็มที่ ให้ผมช่วยหามั้ย?",
        bubble: "พรมนี้สมควรได้วิลล่า",
      },
      pl: {
        speechKey: "psychCrossCarpetTts",
        tts: "Klasa! Brakuje tylko willi, żeby dywan zabłysnął. Mam poszukać czegoś pasującego?",
        bubble: "Dywan zasługuje na willę.",
      },
      ru: {
        speechKey: "psychCrossCarpetTts",
        tts: "Очень стильно! Осталась вилла, чтобы ковёр сиял. Поискать что-то подходящее?",
        bubble: "Ковёр заслуживает виллу.",
      },
      zh: {
        speechKey: "psychCrossCarpetTts",
        tts: "很上档次！就差一栋配得上的别墅让地毯发光。要我帮你物色？",
        bubble: "这地毯配得上别墅。",
      },
    },
    cross_moped: {
      de: {
        speechKey: "psychCrossMopedTts",
        complianceDisclaimer: true,
        tts: "Top-Teil! Da ist die Versicherung bei mir aber Pflicht, sonst bist du bei einem Kratzer sofort pleite. Ich vermittle dir da was, wo du dir keine Sorgen machen musst!",
        bubble: "Moped ja — Absicherung auch.",
      },
      en: {
        speechKey: "psychCrossMopedTts",
        complianceDisclaimer: true,
        tts: "Sweet ride! Insurance is non-negotiable though — one scratch and you're broke. I'll hook you up with something worry-free!",
        bubble: "Ride yes — cover too.",
      },
      th: {
        speechKey: "psychCrossMopedTts",
        complianceDisclaimer: true,
        tts: "ของเจ๋ง! แต่ประกันจำเป็นนะ — ขีดนิดเดียวอาจเจ็บกระเป๋า ผมช่วยหาที่ไม่ต้องกังวลให้",
        bubble: "ได้รถ — ต้องมีประกัน",
      },
      pl: {
        speechKey: "psychCrossMopedTts",
        complianceDisclaimer: true,
        tts: "Fajny sprzęt! Ubezpieczenie to must — jeden rysa i kieszeń płacze. Połączę cię z czymś bez stresu!",
        bubble: "Motor tak — polisa też.",
      },
      ru: {
        speechKey: "psychCrossMopedTts",
        complianceDisclaimer: true,
        tts: "Топчик! Но страховка обязательна — царапина и кошелёк плачет. Найду вариант без головной боли!",
        bubble: "Мопед да — и покрытие.",
      },
      zh: {
        speechKey: "psychCrossMopedTts",
        complianceDisclaimer: true,
        tts: "好车！但保险不能省——小刮蹭就掏空钱包。我帮你找省心的方案！",
        bubble: "有车——也要有保。",
      },
    },
    cross_authenticity: {
      de: {
        speechKey: "psychCrossAuthTts",
        complianceDisclaimer: true,
        tts: "Du, bei dem Preis — willst du sichergehen, dass es das echte Original ist, oder reicht dir eine hochwertige Alternative? Ich bin kein Berater, aber bei dem Teil würde ich nicht sparen …",
        bubble: "Original-Check — Augen auf.",
      },
      en: {
        speechKey: "psychCrossAuthTts",
        complianceDisclaimer: true,
        tts: "At that price — want genuine original or is a solid alternative fine? I'm not an advisor, but I wouldn't cheap out on this part …",
        bubble: "Authenticity check — eyes open.",
      },
      th: {
        speechKey: "psychCrossAuthTts",
        complianceDisclaimer: true,
        tts: "ราคานี้นะ — อยากมั่นใจว่าของแท้ หรือทางเลือกคุณภาพดีก็พอ? ผมไม่ใช่ที่ปรึกษา แต่ชิ้นนี้อย่าประหยัดเกินไป …",
        bubble: "เช็คของแท้ — ตาไว ๆ",
      },
      pl: {
        speechKey: "psychCrossAuthTts",
        complianceDisclaimer: true,
        tts: "Przy tej cenie — chcesz pewny oryginał, czy wystarczy solidna alternatywa? Nie jestem doradcą, ale tu bym nie oszczędzał …",
        bubble: "Check oryginału — oczy szeroko.",
      },
      ru: {
        speechKey: "psychCrossAuthTts",
        complianceDisclaimer: true,
        tts: "За такую цену — нужен оригинал или сойдёт достойная альтернатива? Я не советник, но тут бы не экономил …",
        bubble: "Проверка подлинности.",
      },
      zh: {
        speechKey: "psychCrossAuthTts",
        complianceDisclaimer: true,
        tts: "这价位——要确定正品，还是优质替代也行？我不是顾问，但这零件别省 …",
        bubble: "真伪把关——睁大眼。",
      },
    },
    hero_savings_scan: {
      de: {
        speechKey: "psychHeroScanTts",
        tts: "Moment — ich scanne kurz nach versteckten Ersparnissen für dich …",
        bubble: "Helden-Moment — kurz scannen.",
      },
      en: {
        speechKey: "psychHeroScanTts",
        tts: "Hang on — let me scan for hidden savings for you …",
        bubble: "Hero moment — quick scan.",
      },
      th: {
        speechKey: "psychHeroScanTts",
        tts: "เดี๋ยวนะ — ผมเช็คว่ามีส่วนลดแอบ ๆ ให้คุณไหม …",
        bubble: "โมเมนต์ฮีโร่ — สแกนนิดนึง",
      },
      pl: {
        speechKey: "psychHeroScanTts",
        tts: "Chwila — sprawdzam ukryte oszczędności dla ciebie …",
        bubble: "Moment bohatera — szybki skan.",
      },
      ru: {
        speechKey: "psychHeroScanTts",
        tts: "Секунду — проверю скрытые скидки для тебя …",
        bubble: "Момент героя — быстрый скан.",
      },
      zh: {
        speechKey: "psychHeroScanTts",
        tts: "等等——我帮你扫一眼有没有藏着的优惠……",
        bubble: "英雄时刻——快扫一下。",
      },
    },
    hero_coupon: {
      de: {
        speechKey: "psychHeroCouponTts",
        tts: "Warte — ich hab da noch was gefunden! Geheimer Gutschein: {AMOUNT} THB, nur für dich, nur jetzt.",
        bubble: "Helden-Moment — {AMOUNT} THB.",
      },
      en: {
        speechKey: "psychHeroCouponTts",
        tts: "Wait — I just dug up a secret coupon for you! {AMOUNT} THB, just for you, right now.",
        bubble: "Secret coupon — {AMOUNT} THB.",
      },
      th: {
        speechKey: "psychHeroCouponTts",
        tts: "เดี๋ยว — ผมเพิ่งเจอคูปองลับให้คุณ! {AMOUNT} บาท มีแค่คุณ ตอนนี้เท่านั้น",
        bubble: "คูปองลับ — {AMOUNT} บาท",
      },
      pl: {
        speechKey: "psychHeroCouponTts",
        tts: "Czekaj — właśnie wyciągnąłem tajny kupon! {AMOUNT} THB, tylko dla ciebie, tylko teraz.",
        bubble: "Tajny kupon — {AMOUNT} THB.",
      },
      ru: {
        speechKey: "psychHeroCouponTts",
        tts: "Погоди — только что нашёл секретный купон! {AMOUNT} бат, только для тебя, только сейчас.",
        bubble: "Секретный купон — {AMOUNT} бат.",
      },
      zh: {
        speechKey: "psychHeroCouponTts",
        tts: "等等——我刚给你挖到一张秘密优惠券！{AMOUNT} 泰铢，只给你，就现在。",
        bubble: "秘密券——{AMOUNT} 泰铢。",
      },
    },
    purchase_urgency: {
      de: {
        speechKey: "psychPurchaseUrgencyTts",
        tts: "Tick tack, tick tack — die Zeit läuft! Willst du das Schnäppchen wirklich riskieren? Nur Spaß — du entscheidest.",
        bubble: "Tick tack — kein Druck, nur Spaß.",
      },
      en: {
        speechKey: "psychPurchaseUrgencyTts",
        tts: "Tick tock, tick tock — time's moving! Gonna risk losing this deal? Just kidding — you're the boss.",
        bubble: "Tick tock — fun, no pressure.",
      },
      th: {
        speechKey: "psychPurchaseUrgencyTts",
        tts: "ติ๊ก ต๊อก ติ๊ก ต๊อก — เวลาเดินนะ! จะเสี่ยงพลาดดีลไหม? ล้อเล่น — คุณตัดสินใจเอง",
        bubble: "ติ๊กต๊อก — สนุก ๆ ไม่กดดัน",
      },
      pl: {
        speechKey: "psychPurchaseUrgencyTts",
        tts: "Tyk, tyk, tyk — czas leci! Oddasz to okazję? Żartuję — ty decydujesz.",
        bubble: "Tyk tyk — zabawnie, bez presji.",
      },
      ru: {
        speechKey: "psychPurchaseUrgencyTts",
        tts: "Тик-так, тик-так — время идёт! Рискнёшь упустить сделку? Шучу — ты решаешь.",
        bubble: "Тик-так — в шутку, без давления.",
      },
      zh: {
        speechKey: "psychPurchaseUrgencyTts",
        tts: "滴答滴答——时间在走！真要错过这笔好买卖？开玩笑的——你说了算。",
        bubble: "滴答——玩笑话，不施压。",
      },
    },
    mishap_stumble: {
      de: {
        speechKey: "psychMishapStumbleTts",
        tts: "Ups! Fast hingeschmissen — aber ich steh wieder!",
        bubble: "Ups!",
      },
      en: {
        speechKey: "psychMishapStumbleTts",
        tts: "Oops! Nearly ate it — but I'm back up!",
        bubble: "Oops!",
      },
      th: {
        speechKey: "psychMishapStumbleTts",
        tts: "อุ๊ปส์! เกือบล้ม — แต่ลุกขึ้นแล้ว!",
        bubble: "อุ๊ปส์!",
      },
      pl: {
        speechKey: "psychMishapStumbleTts",
        tts: "Ups! Prawie się przewróciłem — ale już stoję!",
        bubble: "Ups!",
      },
      ru: {
        speechKey: "psychMishapStumbleTts",
        tts: "Упс! Чуть не свалился — но я снова на ногах!",
        bubble: "Упс!",
      },
      zh: {
        speechKey: "psychMishapStumbleTts",
        tts: "哎呀！差点摔了——但我又站起来了！",
        bubble: "哎呀！",
      },
    },
    mishap_snag: {
      de: {
        speechKey: "psychMishapSnagTts",
        tts: "Huch — kurz hängen geblieben. Alles gut, weiter!",
        bubble: "Huch…",
      },
      en: {
        speechKey: "psychMishapSnagTts",
        tts: "Whoa — got snagged for a sec. All good, moving on!",
        bubble: "Whoa…",
      },
      th: {
        speechKey: "psychMishapSnagTts",
        tts: "โอ้ — ติดนิดหน่อย โอเคแล้ว ไปต่อ!",
        bubble: "โอ้…",
      },
      pl: {
        speechKey: "psychMishapSnagTts",
        tts: "Ups — na chwilę się zaczepiłem. Spoko, lecimy dalej!",
        bubble: "Ups…",
      },
      ru: {
        speechKey: "psychMishapSnagTts",
        tts: "Ой — на секунду застрял. Всё ок, идём дальше!",
        bubble: "Ой…",
      },
      zh: {
        speechKey: "psychMishapSnagTts",
        tts: "哟——卡了一下。没事，继续！",
        bubble: "哟…",
      },
    },
    mishap_trip: {
      de: {
        speechKey: "psychMishapTripTts",
        tts: "Aua — bin drüber gestolpert! Passiert. Weiter geht's!",
        bubble: "Aua!",
      },
      en: {
        speechKey: "psychMishapTripTts",
        tts: "Ouch — tripped right over it! Happens. On we go!",
        bubble: "Ouch!",
      },
      th: {
        speechKey: "psychMishapTripTts",
        tts: "โอ๊ย — สะดุดเลย! เป็นไปได้ ไปต่อ!",
        bubble: "โอ๊ย!",
      },
      pl: {
        speechKey: "psychMishapTripTts",
        tts: "Ała — potknąłem się! Bywa. Jedziemy dalej!",
        bubble: "Ała!",
      },
      ru: {
        speechKey: "psychMishapTripTts",
        tts: "Ай — споткнулся! Бывает. Погнали дальше!",
        bubble: "Ай!",
      },
      zh: {
        speechKey: "psychMishapTripTts",
        tts: "哎哟——绊了一下！没事，继续走！",
        bubble: "哎哟！",
      },
    },
    mishap_tumble: {
      de: {
        speechKey: "psychMishapTumbleTts",
        tts: "Hoppla — bin umgekippt! … Und wieder hoch. So, da bin ich.",
        bubble: "Hoppla!",
      },
      en: {
        speechKey: "psychMishapTumbleTts",
        tts: "Whoops — I tipped over! … And back up. There we go.",
        bubble: "Whoops!",
      },
      th: {
        speechKey: "psychMishapTumbleTts",
        tts: "โอ๊ะ — ล้มคว่ำ! … ลุกแล้ว เรียบร้อย",
        bubble: "โอ๊ะ!",
      },
      pl: {
        speechKey: "psychMishapTumbleTts",
        tts: "Hopla — przewróciłem się! … I z powrotem. No i po sprawie.",
        bubble: "Hopla!",
      },
      ru: {
        speechKey: "psychMishapTumbleTts",
        tts: "Ой — перевернулся! … И снова встал. Вот и всё.",
        bubble: "Ой!",
      },
      zh: {
        speechKey: "psychMishapTumbleTts",
        tts: "哎呀——翻倒了！……又站起来了。好了。",
        bubble: "哎呀！",
      },
    },
    lang_switch_offer: {
      de: {
        speechKey: "psychLangSwitchOfferTts",
        tts: "Ja, natürlich! Soll ich die App komplett auf {LANG} umstellen?",
        bubble: "Sprachwechsel — {LANG}?",
      },
      en: {
        speechKey: "psychLangSwitchOfferTts",
        tts: "Sure thing! Should I switch the whole app to {LANG}?",
        bubble: "Switch to {LANG}?",
      },
      th: {
        speechKey: "psychLangSwitchOfferTts",
        tts: "ได้เลยครับ! ให้ผมเปลี่ยนแอปทั้งหมดเป็น{LANG}ไหมครับ?",
        bubble: "เปลี่ยนเป็น {LANG}?",
      },
      pl: {
        speechKey: "psychLangSwitchOfferTts",
        tts: "Jasne! Mam przełączyć całą aplikację na {LANG}?",
        bubble: "Przełączyć na {LANG}?",
      },
      ru: {
        speechKey: "psychLangSwitchOfferTts",
        tts: "Конечно! Переключить всё приложение на {LANG}?",
        bubble: "Переключить на {LANG}?",
      },
      zh: {
        speechKey: "psychLangSwitchOfferTts",
        tts: "当然可以！要把整个应用切换成{LANG}吗？",
        bubble: "切换到{LANG}？",
      },
    },
    lang_switch_confirmed: {
      de: {
        speechKey: "psychLangSwitchConfirmedTts",
        tts: "Alles klar, ab jetzt sprechen wir {LANG}!",
        bubble: "Ab jetzt: {LANG}.",
      },
      en: {
        speechKey: "psychLangSwitchConfirmedTts",
        tts: "All set — from now on we're speaking {LANG}!",
        bubble: "Now: {LANG}.",
      },
      th: {
        speechKey: "psychLangSwitchConfirmedTts",
        tts: "เรียบร้อยครับ ตั้งแต่นี้เราคุยกันเป็น{LANG}นะครับ!",
        bubble: "ต่อไป: {LANG}",
      },
      pl: {
        speechKey: "psychLangSwitchConfirmedTts",
        tts: "Jasne — od teraz mówimy po {LANG}!",
        bubble: "Od teraz: {LANG}.",
      },
      ru: {
        speechKey: "psychLangSwitchConfirmedTts",
        tts: "Готово — с этого момента говорим на {LANG}!",
        bubble: "Теперь: {LANG}.",
      },
      zh: {
        speechKey: "psychLangSwitchConfirmedTts",
        tts: "好的，从现在开始我们用{LANG}交流！",
        bubble: "现在：{LANG}",
      },
    },
    lang_switch_declined: {
      de: {
        speechKey: "psychLangSwitchDeclinedTts",
        tts: "Alles klar, wir bleiben bei {LANG}. Sag Bescheid, wenn du wechseln willst!",
        bubble: "Bleiben bei {LANG}.",
      },
      en: {
        speechKey: "psychLangSwitchDeclinedTts",
        tts: "No problem — we'll stick with {LANG}. Just say if you want to switch!",
        bubble: "Staying on {LANG}.",
      },
      th: {
        speechKey: "psychLangSwitchDeclinedTts",
        tts: "โอเคครับ เรายังใช้{LANG}ต่อไป อยากเปลี่ยนบอกได้เลยนะครับ!",
        bubble: "ยังเป็น {LANG}",
      },
      pl: {
        speechKey: "psychLangSwitchDeclinedTts",
        tts: "OK — zostajemy przy {LANG}. Daj znać, jak będziesz chciał zmienić!",
        bubble: "Zostajemy: {LANG}.",
      },
      ru: {
        speechKey: "psychLangSwitchDeclinedTts",
        tts: "Хорошо — остаёмся на {LANG}. Скажешь, если захочешь переключить!",
        bubble: "Остаёмся: {LANG}.",
      },
      zh: {
        speechKey: "psychLangSwitchDeclinedTts",
        tts: "好的，我们继续用{LANG}。想换语言随时告诉我！",
        bubble: "继续：{LANG}",
      },
    },
    lang_switch_proactive: {
      de: {
        speechKey: "psychLangSwitchProactiveTts",
        tts: "Falls du lieber {ALT_LANG} sprichst, sag einfach Bescheid — ich stell die App gern um!",
        bubble: "Lieber {ALT_LANG}? Sag Bescheid.",
      },
      en: {
        speechKey: "psychLangSwitchProactiveTts",
        tts: "If you'd rather speak {ALT_LANG}, just say so — I'll switch the app for you!",
        bubble: "Prefer {ALT_LANG}? Just ask.",
      },
      th: {
        speechKey: "psychLangSwitchProactiveTts",
        tts: "ถ้าอยากคุย{ALT_LANG}มากกว่า บอกได้เลยนะครับ ผมเปลี่ยนแอปให้ได้ทันที!",
        bubble: "อยากใช้ {ALT_LANG}? บอกมาเลย",
      },
      pl: {
        speechKey: "psychLangSwitchProactiveTts",
        tts: "Jeśli wolisz {ALT_LANG}, daj znać — przełączę aplikację!",
        bubble: "Wolisz {ALT_LANG}? Powiedz.",
      },
      ru: {
        speechKey: "psychLangSwitchProactiveTts",
        tts: "Если удобнее на {ALT_LANG} — скажи, переключу приложение!",
        bubble: "Удобнее {ALT_LANG}? Скажи.",
      },
      zh: {
        speechKey: "psychLangSwitchProactiveTts",
        tts: "如果你更想用{ALT_LANG}，告诉我就行——我马上帮你切换应用！",
        bubble: "更喜欢{ALT_LANG}？说一声。",
      },
    },
    lang_switch_already: {
      de: {
        speechKey: "psychLangSwitchAlreadyTts",
        tts: "Wir sprechen schon {LANG} — passt so?",
        bubble: "Schon {LANG}.",
      },
      en: {
        speechKey: "psychLangSwitchAlreadyTts",
        tts: "We're already on {LANG} — all good?",
        bubble: "Already {LANG}.",
      },
      th: {
        speechKey: "psychLangSwitchAlreadyTts",
        tts: "ตอนนี้เราใช้{LANG}อยู่แล้วครับ โอเคไหมครับ?",
        bubble: "เป็น {LANG} อยู่แล้ว",
      },
      pl: {
        speechKey: "psychLangSwitchAlreadyTts",
        tts: "Już mówimy po {LANG} — pasuje?",
        bubble: "Już {LANG}.",
      },
      ru: {
        speechKey: "psychLangSwitchAlreadyTts",
        tts: "Мы уже на {LANG} — всё ок?",
        bubble: "Уже {LANG}.",
      },
      zh: {
        speechKey: "psychLangSwitchAlreadyTts",
        tts: "我们现在已经是{LANG}了——可以吗？",
        bubble: "已是{LANG}",
      },
    },
  };

  var NO_PRESSURE = {
    de: {
      speechKey: "psychNoPressureTts",
      tts: "Alles klar, du bist der Chef. Wir schauen später weiter.",
      bubble: "Kein Druck — du bestimmst.",
    },
    en: {
      speechKey: "psychNoPressureTts",
      tts: "All good — you're the boss. We'll pick this up later.",
      bubble: "No pressure — your call.",
    },
    th: {
      speechKey: "psychNoPressureTts",
      tts: "โอเคครับ คุณเป็นหัวหน้า ไว้ค่อยดูต่อทีหลังนะ",
      bubble: "ไม่กดดัน — คุณตัดสินใจ",
    },
    pl: {
      speechKey: "psychNoPressureTts",
      tts: "Jasne, ty tu rządzisz. Wrócimy do tego później.",
      bubble: "Bez presji — twoja decyzja.",
    },
    ru: {
      speechKey: "psychNoPressureTts",
      tts: "Ок, ты тут главный. Вернёмся к этому позже.",
      bubble: "Без давления — твоё решение.",
    },
    zh: {
      speechKey: "psychNoPressureTts",
      tts: "好的，你说了算。我们以后再聊。",
      bubble: "不施压——你决定。",
    },
  };

  var DECLINE_PATTERNS = [
    /\b(nein|nö|nope|nee|naa|lieber\s+nicht|lass\s+(?:mal|mich)|nicht\s+interessiert|kein\s+interesse|brauch\s+ich\s+nicht|will\s+ich\s+nicht)\b/i,
    /\b(no\s+thanks?|not\s+interested|no\s+way|pass\b|maybe\s+later|not\s+now|don'?t\s+want)\b/i,
    /\b(ไม่(?:เอา|ต้องการ|สนใจ)|ไว้ก่อน|ยังไม่)\b/i,
    /\b(nie\s+chcę|nie\s+teraz|nie\s+interesuje|zostaw\s+mnie|później)\b/i,
    /\b(нет|не\s+надо|не\s+хочу|не\s+сейчас|потом|не\s+интерес)\b/i,
    /\b(不要|不用|不需要|没兴趣|以后再说|先不要)\b/i,
  ];

  function normalizeLang(code) {
    var c = String(code || "en").toLowerCase().split("-")[0];
    return LANGS.indexOf(c) >= 0 ? c : "en";
  }

  function getModule(lang, moduleId) {
    var bucket = MODULES[moduleId];
    if (!bucket) return null;
    var L = normalizeLang(lang);
    return bucket[L] || bucket.en || bucket.de || null;
  }

  function pickForTrigger(lang, category, trigger) {
    var cat = String(category || "finance").toLowerCase();
    if (cat === "bank") cat = "finance";
    if (cat === "finance" && trigger === "view") cat = "credit";
    var id = cat + "_" + String(trigger || "view");
    return getModule(lang, id);
  }

  function getNoPressure(lang) {
    var L = normalizeLang(lang);
    return NO_PRESSURE[L] || NO_PRESSURE.en || NO_PRESSURE.de;
  }

  function isDecline(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    if (t.length > 220) return false;
    for (var i = 0; i < DECLINE_PATTERNS.length; i++) {
      if (DECLINE_PATTERNS[i].test(t)) return true;
    }
    return false;
  }

  function storageKey(moduleId) {
    return "osg-psych-fired-" + String(moduleId || "any");
  }

  function isComplianceTrigger(moduleId) {
    var id = String(moduleId || "");
    if (moduleRequiresCompliance(id)) return true;
    if (/^(credit|insurance|real_estate|automotive)_click$/.test(id)) return true;
    if (id === "compliance_disclaimer_chat") return true;
    return false;
  }

  function mayFireComplianceGlobal() {
    try {
      var raw = sessionStorage.getItem(storageKey(COMPLIANCE_GLOBAL_KEY));
      if (!raw) return true;
      var ts = parseInt(raw, 10);
      if (!isFinite(ts)) return true;
      return Date.now() - ts >= COOLDOWN_MS;
    } catch (_) {
      return true;
    }
  }

  function markComplianceGlobal() {
    try {
      sessionStorage.setItem(
        storageKey(COMPLIANCE_GLOBAL_KEY),
        String(Date.now())
      );
    } catch (_) {}
  }

  function mayFire(moduleId) {
    var id = String(moduleId || "");
    if (isComplianceTrigger(id)) {
      return mayFireComplianceGlobal();
    }
    try {
      var raw = sessionStorage.getItem(storageKey(moduleId));
      if (!raw) return true;
      var ts = parseInt(raw, 10);
      if (!isFinite(ts)) return true;
      return Date.now() - ts >= COOLDOWN_MS;
    } catch (_) {
      return true;
    }
  }

  function markFired(moduleId) {
    var id = String(moduleId || "");
    if (isComplianceTrigger(id)) {
      markComplianceGlobal();
      return;
    }
    try {
      sessionStorage.setItem(storageKey(moduleId), String(Date.now()));
    } catch (_) {}
  }

  function moduleIdForLink(el) {
    if (!el || !el.getAttribute) return "";
    var ch = String(el.getAttribute("data-osg-channel") || "").toLowerCase();
    var partner = String(el.getAttribute("data-osg-partner") || "").toLowerCase();
    var cert = String(el.getAttribute("data-osg-cert-realm") || "").toLowerCase();
    if (ch === "insurance" || partner === "roojai" || cert === "insurance")
      return "insurance";
    if (ch === "bank" || partner === "kasikorn") return "credit";
    if (ch === "real_estate" || ch === "immo" || cert === "real_estate")
      return "real_estate";
    if (ch === "dealer" || ch === "automotive" || cert === "automotive")
      return "automotive";
    return "";
  }

  function clickModuleIdForCompliance(channel, certRealm) {
    var ch = String(channel || "").toLowerCase();
    var cert = String(certRealm || "").toLowerCase();
    if (ch === "insurance" || cert === "insurance") return "insurance_click";
    if (ch === "bank") return "credit_click";
    if (ch === "real_estate" || ch === "immo" || cert === "real_estate")
      return "real_estate_click";
    if (ch === "dealer" || ch === "automotive" || cert === "automotive")
      return "automotive_click";
    return "";
  }

  /** Eskalation: Schritt 1 Zuhören → 2 kleiner Rat → 3 große Lösung (financeDisclaimer vor Immo/Finanz). */
  var EMPATHY_CHAINS = {
    grief_relationship: {
      de: [
        {
          speechKey: "psychEmpathyGrief1Tts",
          tts: "Hey — was ist denn los? Du kannst mir alles sagen, alles bleibt bei dir hier auf dem Gerät. Wenn du magst, schieße ich dir einen Rat oder wir finden eine Lösung — ganz ohne Druck.",
          bubble: "Ich höre zu — du bestimmst.",
        },
        {
          speechKey: "psychEmpathyGrief2Tts",
          tts: "Hättest du die Kohle, könnte ich dir sagen, womit du sie zurückgewinnst … aber fangen wir mal klein an: ein ehrlicher Blumenstrauß oder ein Geschenk über Pauli Best Price — nur als Idee, kein Kitsch-Verkauf.",
          bubble: "Kleiner Schritt zuerst — Blumen & Geschenke.",
        },
      ],
      en: [
        {
          speechKey: "psychEmpathyGrief1Tts",
          tts: "Hey — what's going on? You can tell me anything; it stays on your device. If you want, I'll toss you a tip or we find a fix — zero pressure.",
          bubble: "I'm listening — you're in charge.",
        },
        {
          speechKey: "psychEmpathyGrief2Tts",
          tts: "If you had the cash, I could tell you how to win it back … but let's start small: honest flowers or a gift via Pauli Best Price — just an idea, no cheesy sales pitch.",
          bubble: "Small step first — flowers & gifts.",
        },
      ],
      th: [
        {
          speechKey: "psychEmpathyGrief1Tts",
          tts: "เฮ้ — เป็นอะไรไปบ้าง? เล่าได้ทุกอย่าง ข้อมูลอยู่แค่ในเครื่องคุณ ถ้าอยาก ผมช่วยแนะนำหรือหาทางออก — ไม่กดดันนะ",
          bubble: "ผมฟังอยู่ — คุณเป็นคนกำหนด",
        },
        {
          speechKey: "psychEmpathyGrief2Tts",
          tts: "ถ้ามีเงินพอ ผมบอกได้ว่าควรลงทุนอะไร … แต่เริ่มเล็ก ๆ ก่อน: ช่อดอกไม้จริงใจหรือของขวัญผ่าน Pauli Best Price — แค่ไอเดีย ไม่ขายของ",
          bubble: "เริ่มเล็ก ๆ — ดอกไม้และของขวัญ",
        },
      ],
      pl: [
        {
          speechKey: "psychEmpathyGrief1Tts",
          tts: "Hej — co się dzieje? Możesz mi wszystko powiedzieć, zostaje na twoim urządzeniu. Jak chcesz, podrzucę radę albo znajdziemy rozwiązanie — zero presji.",
          bubble: "Słucham — ty decydujesz.",
        },
        {
          speechKey: "psychEmpathyGrief2Tts",
          tts: "Gdybyś miał kasę, powiedziałbym, jak ją odzyskać … ale zacznijmy od małego kroku: szczery bukiet albo prezent przez Pauli Best Price — tylko pomysł, bez kitszu.",
          bubble: "Mały krok — kwiaty i prezenty.",
        },
      ],
      ru: [
        {
          speechKey: "psychEmpathyGrief1Tts",
          tts: "Эй — что случилось? Можешь рассказать всё, это остаётся на твоём устройстве. Хочешь — подскажу или найдём выход — без давления.",
          bubble: "Я слушаю — ты решаешь.",
        },
        {
          speechKey: "psychEmpathyGrief2Tts",
          tts: "Будь деньги — сказал бы, как их вернуть … но начнём с малого: честные цветы или подарок через Pauli Best Price — просто идея, без продажного пафоса.",
          bubble: "Сначала маленький шаг — цветы и подарки.",
        },
      ],
      zh: [
        {
          speechKey: "psychEmpathyGrief1Tts",
          tts: "嘿——怎么了？什么都可以跟我说，只留在你的设备上。愿意的话我给你个小建议或一起找办法——零施压。",
          bubble: "我在听——你说了算。",
        },
        {
          speechKey: "psychEmpathyGrief2Tts",
          tts: "要是钱够，我能告诉你怎么赢回来……但先从小的开始：一束真心的花或通过 Pauli Best Price 挑份礼物——只是想法，不卖弄。",
          bubble: "先迈小步——鲜花与礼物。",
        },
      ],
    },
    housing_stress: {
      de: [
        {
          speechKey: "psychEmpathyHousing1Tts",
          tts: "Immobilien-Stress — kenn ich. Erstmal durchatmen. Du musst das nicht allein schleppen.",
          bubble: "Verstanden — ich bin da.",
        },
        {
          speechKey: "psychEmpathyHousing2Tts",
          tts: "Kleiner Rat: vergleich die Miete mit anderen Vierteln und lass dir nichts schönreden — nur Fakten, keine Show.",
          bubble: "Erst Fakten, dann Entscheidung.",
        },
        {
          speechKey: "psychEmpathyHousing3Tts",
          financeDisclaimer: true,
          tts: "Ich kenne den Markt. Lass uns schauen, ob wir den Typen in der Krawatte überspringen und dir ein besseres Angebot besorgen — ich kenne Leute, die das sauber vermitteln, ohne Abzocke.",
          bubble: "Vermittler statt Krawatte — nur Kontakt.",
        },
      ],
      en: [
        {
          speechKey: "psychEmpathyHousing1Tts",
          tts: "Property stress — I get it. Breathe first. You don't have to carry this alone.",
          bubble: "Got it — I'm here.",
        },
        {
          speechKey: "psychEmpathyHousing2Tts",
          tts: "Small tip: compare rent with other areas and don't let anyone sweet-talk you — facts only, no theatre.",
          bubble: "Facts first, then you decide.",
        },
        {
          speechKey: "psychEmpathyHousing3Tts",
          financeDisclaimer: true,
          tts: "I know the market. Let's see if we can skip the tie guy and land a better offer — I know people who broker this cleanly, no rip-off.",
          bubble: "Broker, not tie guy — just an intro.",
        },
      ],
      th: [
        {
          speechKey: "psychEmpathyHousing1Tts",
          tts: "เครียดเรื่องบ้าน — เข้าใจเลย หายใจก่อน ไม่ต้องแบกคนเดียว",
          bubble: "เข้าใจ — ผมอยู่ตรงนี้",
        },
        {
          speechKey: "psychEmpathyHousing2Tts",
          tts: "ทิปเล็ก ๆ: เทียบค่าเช่ากับย่านอื่น อย่าให้ใครพูดหวานเกินจริง — เอาแค่ข้อเท็จจริง",
          bubble: "ข้อเท็จจริงก่อน แล้วค่อยตัดสินใจ",
        },
        {
          speechKey: "psychEmpathyHousing3Tts",
          financeDisclaimer: true,
          tts: "ผมรู้ตลาดอยู่ ลองดูว่าข้ามคนใส่เนคไทไปหาข้อเสนอที่ดีกว่าได้ไหม — ผมรู้จักคนที่ช่วยต่อให้จริงจัง ไม่โกง",
          bubble: "คนกลาง ไม่ใช่นายขาย — แค่แนะนำ",
        },
      ],
      pl: [
        {
          speechKey: "psychEmpathyHousing1Tts",
          tts: "Stres mieszkaniowy — rozumiem. Najpierw oddech. Nie musisz dźwigać tego sam.",
          bubble: "Rozumiem — jestem.",
        },
        {
          speechKey: "psychEmpathyHousing2Tts",
          tts: "Mała rada: porównaj czynsz z innymi dzielnicami i nie daj się omamić — same fakty.",
          bubble: "Najpierw fakty, potem decyzja.",
        },
        {
          speechKey: "psychEmpathyHousing3Tts",
          financeDisclaimer: true,
          tts: "Znam rynek. Zobaczmy, czy ominiemy faceta w krawacie i dostaniesz lepszą ofertę — znam ludzi, którzy to uczciwie pośredniczą.",
          bubble: "Pośrednik, nie krawat — tylko kontakt.",
        },
      ],
      ru: [
        {
          speechKey: "psychEmpathyHousing1Tts",
          tts: "Стресс с жильём — понимаю. Сначала выдохни. Не обязан тащить это один.",
          bubble: "Понял — я рядом.",
        },
        {
          speechKey: "psychEmpathyHousing2Tts",
          tts: "Маленький совет: сравни аренду с другими районами и не ведись на сладкие речи — только факты.",
          bubble: "Сначала факты, потом решение.",
        },
        {
          speechKey: "psychEmpathyHousing3Tts",
          financeDisclaimer: true,
          tts: "Я знаю рынок. Давай обойдём типа в галстуке и найдём лучшее предложение — знаю людей, кто честно посредничает, без развода.",
          bubble: "Посредник, не галстук — только контакт.",
        },
      ],
      zh: [
        {
          speechKey: "psychEmpathyHousing1Tts",
          tts: "住房压力——懂。先喘口气。不必一个人扛。",
          bubble: "明白——我在。",
        },
        {
          speechKey: "psychEmpathyHousing2Tts",
          tts: "小建议：把租金和其他区域比一比，别被花言巧语忽悠——只看事实。",
          bubble: "先事实，再决定。",
        },
        {
          speechKey: "psychEmpathyHousing3Tts",
          financeDisclaimer: true,
          tts: "我了解市场。看看能不能跳过打领带的那类人，给你更好的方案——我认识靠谱中介，不坑人。",
          bubble: "中介不是销售——只牵线。",
        },
      ],
    },
    sadness_anger: {
      de: [
        {
          speechKey: "psychEmpathySad1Tts",
          tts: "Hey — ich höre, dass es gerade drückt. Du kannst mir alles sagen, alles bleibt bei dir. Wenn du magst, geben wir uns einen Rat oder eine kleine Lösung — du bestimmst das Tempo.",
          bubble: "Ich bin der Zuhörer — kein Verkäufer.",
        },
        {
          speechKey: "psychEmpathySad2Tts",
          tts: "Erstmal: ein Schluck Wasser, kurz durchatmen. Manchmal ist der beste nächste Schritt gar kein Einkauf — nur ein ehrliches Gespräch. Ich bin noch da.",
          bubble: "Guter Rat vor jedem Kauf.",
        },
      ],
      en: [
        {
          speechKey: "psychEmpathySad1Tts",
          tts: "Hey — I hear it's heavy right now. Tell me anything; it stays with you. If you want, we'll trade a tip or a small fix — you set the pace.",
          bubble: "Listener first — not a seller.",
        },
        {
          speechKey: "psychEmpathySad2Tts",
          tts: "First: water, a breath. Sometimes the best next step isn't shopping — just an honest talk. I'm still here.",
          bubble: "Good advice before any purchase.",
        },
      ],
      th: [
        {
          speechKey: "psychEmpathySad1Tts",
          tts: "เฮ้ — ผมรู้ว่าตอนนี้หนักใจ เล่าได้ทุกอย่าง อยู่แค่กับคุณ ถ้าอยาก เราค่อย ๆ หาคำแนะนำ — คุณกำหนดจังหวะ",
          bubble: "ฟังก่อน — ไม่ใช่คนขาย",
        },
        {
          speechKey: "psychEmpathySad2Tts",
          tts: "ก่อนอื่น: ดื่มน้ำ หายใจลึก ๆ บางทีขั้นต่อไปที่ดีที่สุดไม่ใช่การซื้อ — แค่คุยจริงใจ ผมยังอยู่",
          bubble: "คำแนะนำดีก่อนการซื้อ",
        },
      ],
      pl: [
        {
          speechKey: "psychEmpathySad1Tts",
          tts: "Hej — słyszę, że jest ciężko. Powiedz wszystko, zostaje u ciebie. Jak chcesz, dam radę albo mały krok — ty ustawiasz tempo.",
          bubble: "Słucham — nie sprzedaję.",
        },
        {
          speechKey: "psychEmpathySad2Tts",
          tts: "Najpierw: łyk wody, oddech. Czasem najlepszy krok to nie zakupy — tylko szczera rozmowa. Dalej tu jestem.",
          bubble: "Dobra rada przed zakupem.",
        },
      ],
      ru: [
        {
          speechKey: "psychEmpathySad1Tts",
          tts: "Эй — слышу, тяжело. Расскажи всё, это остаётся у тебя. Хочешь — дадим совет или маленький шаг — темп задаёшь ты.",
          bubble: "Слушаю — не продаю.",
        },
        {
          speechKey: "psychEmpathySad2Tts",
          tts: "Сначала: глоток воды, вдох. Иногда лучший шаг — не покупка, а честный разговор. Я ещё здесь.",
          bubble: "Совет важнее покупки.",
        },
      ],
      zh: [
        {
          speechKey: "psychEmpathySad1Tts",
          tts: "嘿——听得出你现在不好受。什么都可以说，只留在你这儿。愿意的话我们慢慢找建议或小办法——节奏你来定。",
          bubble: "先倾听——不是推销。",
        },
        {
          speechKey: "psychEmpathySad2Tts",
          tts: "先喝口水，深吸一口气。有时最好的下一步不是买东西——而是真心聊几句。我还在。",
          bubble: "好建议先于购买。",
        },
      ],
    },
    new_beginning: {
      de: [
        {
          speechKey: "psychEmpathyNew1Tts",
          tts: "Neuanfang — das hat Mut. Ich freu mich mit dir, auch wenn's wacklig anfühlt.",
          bubble: "Neuer Abschnitt — ich begleite.",
        },
        {
          speechKey: "psychEmpathyNew2Tts",
          tts: "Hättest du die Kohle, könnte ich dir sagen, womit du sie zurückgewinnst … aber fangen wir mal mit einem kleinen Upgrade an, das sich gut anfühlt.",
          bubble: "Kleiner Hebel zuerst.",
        },
        {
          speechKey: "psychEmpathyNew3Tts",
          financeDisclaimer: true,
          tts: "Für die großen Schritte — Haus, Absicherung — kenne ich Vermittler ohne Krawatten-Theater. Ich stell nur den Kontakt, kein Vertriebsquatsch.",
          bubble: "Wegweiser — kein Versicherungsvertreter.",
        },
      ],
      en: [
        {
          speechKey: "psychEmpathyNew1Tts",
          tts: "Fresh start — that takes guts. I'm with you, even if it feels wobbly.",
          bubble: "New chapter — I've got your back.",
        },
        {
          speechKey: "psychEmpathyNew2Tts",
          tts: "If you had the cash, I'd tell you how to win it back … but let's start with a small upgrade that feels right.",
          bubble: "Small lever first.",
        },
        {
          speechKey: "psychEmpathyNew3Tts",
          financeDisclaimer: true,
          tts: "For big moves — home, coverage — I know brokers without tie-guy theatre. I only make the intro, no sales spiel.",
          bubble: "Guide — not an insurance rep.",
        },
      ],
      th: [
        {
          speechKey: "psychEmpathyNew1Tts",
          tts: "เริ่มต้นใหม่ — ใช้ความกล้า ผมอยู่ข้างคุณ แม้จะรู้สึกไม่มั่นคง",
          bubble: "บทใหม่ — ผมช่วยได้",
        },
        {
          speechKey: "psychEmpathyNew2Tts",
          tts: "ถ้ามีเงินพอ ผมบอกได้ว่าควรลงทุนอะไร … แต่เริ่มจากอัปเกรดเล็ก ๆ ที่รู้สึกดีก่อน",
          bubble: "คันโยกเล็ก ๆ ก่อน",
        },
        {
          speechKey: "psychEmpathyNew3Tts",
          financeDisclaimer: true,
          tts: "เรื่องใหญ่ — บ้าน ประกัน — ผมรู้จักคนกลางที่ไม่เล่นละครเนคไท แค่แนะนำ ไม่ขายของ",
          bubble: "ไกด์ — ไม่ใช่ตัวแทนประกัน",
        },
      ],
      pl: [
        {
          speechKey: "psychEmpathyNew1Tts",
          tts: "Nowy początek — to odwaga. Jestem z tobą, nawet jak się chwieje.",
          bubble: "Nowy rozdział — jestem obok.",
        },
        {
          speechKey: "psychEmpathyNew2Tts",
          tts: "Gdybyś miał kasę, powiedziałbym, jak ją odzyskać … ale zacznijmy od małego upgrade'u, który czuć.",
          bubble: "Mała dźwignia najpierw.",
        },
        {
          speechKey: "psychEmpathyNew3Tts",
          financeDisclaimer: true,
          tts: "Przy dużych krokach — dom, ubezpieczenie — znam pośredników bez teatru w krawacie. Tylko kontakt, zero sprzedaży.",
          bubble: "Przewodnik — nie agent ubezpieczeń.",
        },
      ],
      ru: [
        {
          speechKey: "psychEmpathyNew1Tts",
          tts: "Новая глава — это смело. Я с тобой, даже если шатает.",
          bubble: "Новый этап — я рядом.",
        },
        {
          speechKey: "psychEmpathyNew2Tts",
          tts: "Будь деньги — сказал бы, как вернуть … но начнём с маленького апгрейда, который приятен.",
          bubble: "Сначала маленький рычаг.",
        },
        {
          speechKey: "psychEmpathyNew3Tts",
          financeDisclaimer: true,
          tts: "Для больших шагов — жильё, страховка — знаю посредников без галстучного театра. Только знакомство, без продаж.",
          bubble: "Проводник — не страховой агент.",
        },
      ],
      zh: [
        {
          speechKey: "psychEmpathyNew1Tts",
          tts: "新开始——需要勇气。我陪着你，哪怕心里发虚。",
          bubble: "新篇章——我在旁边。",
        },
        {
          speechKey: "psychEmpathyNew2Tts",
          tts: "要是钱够，我能告诉你怎么赢回来……但先从让你舒服的小升级开始。",
          bubble: "先小杠杆。",
        },
        {
          speechKey: "psychEmpathyNew3Tts",
          financeDisclaimer: true,
          tts: "大动作——住房、保障——我认识不打领带戏码的中介。只牵线，不推销。",
          bubble: "向导——不是保险代表。",
        },
      ],
    },
    improvement_wish: {
      de: [
        {
          speechKey: "psychEmpathyImprove1Tts",
          tts: "Du willst besser werden? Respekt — das ist schon der halbe Weg.",
          bubble: "Wunsch nach Verbesserung — stark.",
        },
        {
          speechKey: "psychEmpathyImprove2Tts",
          tts: "Kleiner Hebel zuerst: etwas für dich oder jemand Wichtigen — Pflege, Blumen, was dich wirklich pusht. Kein Muss, nur Inspiration.",
          bubble: "Zone A — kleine Freude.",
        },
        {
          speechKey: "psychEmpathyImprove3Tts",
          financeDisclaimer: true,
          tts: "Willst du später groß optimieren — Finanzen, Absicherung — ich kenne Leute, die das ohne Krawatten-Abzocke regeln. Ich vermittle nur.",
          bubble: "Zone B — Vermittler, kein Vertreter.",
        },
      ],
      en: [
        {
          speechKey: "psychEmpathyImprove1Tts",
          tts: "You want to level up? Respect — that's half the battle.",
          bubble: "Drive to improve — strong.",
        },
        {
          speechKey: "psychEmpathyImprove2Tts",
          tts: "Small lever first: something for you or someone who matters — care, flowers, whatever truly lifts you. No must — just inspiration.",
          bubble: "Zone A — small joy.",
        },
        {
          speechKey: "psychEmpathyImprove3Tts",
          financeDisclaimer: true,
          tts: "When you're ready to optimize big — money, coverage — I know folks who handle it without tie-guy rip-offs. I only connect.",
          bubble: "Zone B — broker, not rep.",
        },
      ],
      th: [
        {
          speechKey: "psychEmpathyImprove1Tts",
          tts: "อยากดีขึ้นเหรอ? เก่งแล้ว — นั่นคือครึ่งทาง",
          bubble: "อยากพัฒนา — ดีมาก",
        },
        {
          speechKey: "psychEmpathyImprove2Tts",
          tts: "เริ่มเล็ก ๆ: ของดี ๆ ให้ตัวเองหรือคนสำคัญ — ดูแลตัว ดอกไม้ อะไรที่ทำให้มีกำลังใจ ไม่บังคับ แค่ไอเดีย",
          bubble: "โซน A — ความสุขเล็ก ๆ",
        },
        {
          speechKey: "psychEmpathyImprove3Tts",
          financeDisclaimer: true,
          tts: "พร้อมปรับใหญ่ — การเงิน ประกัน — ผมรู้จักคนที่จัดการโดยไม่โกงแบบเนคไท แค่แนะนำต่อ",
          bubble: "โซน B — คนกลาง ไม่ใช่ตัวแทน",
        },
      ],
      pl: [
        {
          speechKey: "psychEmpathyImprove1Tts",
          tts: "Chcesz być lepiej? Szacun — to już połowa drogi.",
          bubble: "Chęć poprawy — mocna.",
        },
        {
          speechKey: "psychEmpathyImprove2Tts",
          tts: "Mała dźwignia: coś dla ciebie albo bliskiej osoby — pielęgnacja, kwiaty, co naprawdę dodaje energii. Bez przymusu.",
          bubble: "Strefa A — mała radość.",
        },
        {
          speechKey: "psychEmpathyImprove3Tts",
          financeDisclaimer: true,
          tts: "Gdy chcesz optymalizować na dużą skalę — finanse, ubezpieczenie — znam ludzi bez krawatowego naciągania. Tylko łączę.",
          bubble: "Strefa B — pośrednik, nie agent.",
        },
      ],
      ru: [
        {
          speechKey: "psychEmpathyImprove1Tts",
          tts: "Хочешь стать лучше? Уважаю — это уже полдела.",
          bubble: "Желание улучшиться — сильно.",
        },
        {
          speechKey: "psychEmpathyImprove2Tts",
          tts: "Сначала маленький рычаг: что-то для себя или близкого — уход, цветы, что реально подбодрит. Без обязаловки.",
          bubble: "Зона A — маленькая радость.",
        },
        {
          speechKey: "psychEmpathyImprove3Tts",
          financeDisclaimer: true,
          tts: "Когда захочешь крупно оптимизировать — финансы, страховка — знаю людей без галстучного развода. Только свожу.",
          bubble: "Зона B — посредник, не агент.",
        },
      ],
      zh: [
        {
          speechKey: "psychEmpathyImprove1Tts",
          tts: "想变得更好？佩服——这已经走了一半。",
          bubble: "想进步——很棒。",
        },
        {
          speechKey: "psychEmpathyImprove2Tts",
          tts: "先小杠杆：给自己或重要的人一点好——护理、鲜花，任何真能提振你的。不强迫，只是灵感。",
          bubble: "A区——小确幸。",
        },
        {
          speechKey: "psychEmpathyImprove3Tts",
          financeDisclaimer: true,
          tts: "准备大优化——财务、保障——我认识不靠领带套路的人。只牵线。",
          bubble: "B区——中介，不是代表。",
        },
      ],
    },
  };

  /** Beziehungs-Brücke: Frage → Kultur-Empfehlung → Wärme-Garantie (+Disclaimer) → Anker. */
  var RELATIONSHIP_BRIDGE = {
    question: {
      de: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Hand aufs Herz: Was glaubst du, würde sie sich in diesem Moment von dir wünschen? Was würde sie zum Lächeln bringen?",
        bubble: "Ehrlich nachdenken — kein Druck.",
      },
      en: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Hand on heart: what do you think she'd want from you right now? What would make her smile?",
        bubble: "Think honestly — no pressure.",
      },
      th: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "ลองจริงจังนะ: คิดว่าเธออยากได้อะไรจากคุณตอนนี้? อะไรที่ทำให้เธอยิ้มได้?",
        bubble: "คิดตรง ๆ — ไม่กดดัน",
      },
      pl: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Szczerze: co twoim zdaniem chciałaby od ciebie właśnie teraz? Co sprawi, że się uśmiechnie?",
        bubble: "Pomyśl szczerze — bez presji.",
      },
      ru: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Честно: что, по-твоему, она хочет от тебя прямо сейчас? Что заставит её улыбнуться?",
        bubble: "Подумай честно — без давления.",
      },
      zh: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "扪心自问：你觉得她现在最想从你这儿得到什么？什么能让她笑出来？",
        bubble: "诚实想想——不施压。",
      },
    },
    question_male: {
      de: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Hand aufs Herz: Was glaubst du, würde er sich in diesem Moment von dir wünschen? Was würde ihn zum Lächeln bringen?",
        bubble: "Ehrlich nachdenken — kein Druck.",
      },
      en: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Hand on heart: what do you think he'd want from you right now? What would make him smile?",
        bubble: "Think honestly — no pressure.",
      },
      th: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "ลองจริงจังนะ: คิดว่าเขาอยากได้อะไรจากคุณตอนนี้? อะไรที่ทำให้เขายิ้มได้?",
        bubble: "คิดตรง ๆ — ไม่กดดัน",
      },
      pl: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Szczerze: co twoim zdaniem chciałby od ciebie właśnie teraz? Co sprawi, że się uśmiechnie?",
        bubble: "Pomyśl szczerze — bez presji.",
      },
      ru: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "Честно: что, по-твоему, он хочет от тебя прямо сейчас? Что заставит его улыбнуться?",
        bubble: "Подумай честно — без давления.",
      },
      zh: {
        speechKey: "psychRelBridgeQuestionTts",
        tts: "扪心自问：你觉得他现在最想从你这儿得到什么？什么能让他笑出来？",
        bubble: "诚实想想——不施压。",
      },
    },
    recommend_intimate: {
      de: {
        speechKey: "psychRelBridgeRecommendTts",
        tts: "Mein Tipp: ehrliche Blumen, ein Stück Schmuck oder echte Zeit zu zweit — über Pauli Best Price findest du saubere Optionen, ohne Verkaufsquatsch.",
        bubble: "Blumen, Schmuck, Zeit.",
      },
    },
    recommend_gift: {
      de: {
        speechKey: "psychRelBridgeRecommendTts",
        tts: "Mein Tipp: ehrliche Blumen, ein Stück Schmuck oder echte Zeit zu zweit — über Pauli Best Price findest du saubere Optionen, ohne Verkaufsquatsch.",
        bubble: "Blumen, Schmuck, Zeit.",
      },
      en: {
        speechKey: "psychRelBridgeRecommendTts",
        tts: "My read: honest flowers, a piece of jewelry, or real attention — Pauli Best Price has clean options, no cheesy pitch.",
        bubble: "Flowers, jewelry, attention.",
      },
      th: {
        speechKey: "psychRelBridgeRecommendTts",
        tts: "จากที่ผมเห็น: ช่อดอกไม้จริงใจ เครื่องประดับเล็ก ๆ หรือความใส่ใจจริง — ผ่าน Pauli Best Price ได้เรียบ ๆ ไม่ขายของ",
        bubble: "ดอกไม้ เครื่องประดับ ความใส่ใจ",
      },
      pl: {
        speechKey: "psychRelBridgeRecommendTts",
        tts: "Moja rada: szczere kwiaty, drobna biżuteria albo prawdziwa uwaga — przez Pauli Best Price, bez kitszu.",
        bubble: "Kwiaty, biżuteria, uwaga.",
      },
      ru: {
        speechKey: "psychRelBridgeRecommendTts",
        tts: "Мой совет: честные цветы, небольшое украшение или настоящее внимание — через Pauli Best Price, без продажного пафоса.",
        bubble: "Цветы, украшения, внимание.",
      },
      zh: {
        speechKey: "psychRelBridgeRecommendTts",
        tts: "我的看法：真心的花、一件小首饰，或实实在在的关心——通过 Pauli Best Price，低调不推销。",
        bubble: "鲜花、首饰、用心。",
      },
    },
    warmth: {
      de: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "Ich helfe dir, das zu besorgen — damit sie heute Abend nicht mit kalten Füßen im Bett liegt, sondern du für Wärme sorgst.",
        bubble: "Wärme-Garantie — ich vermittle.",
      },
      en: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "I'll help you get it sorted — so tonight she's not lying there with cold feet while you could be the one bringing warmth.",
        bubble: "Warmth guarantee — I connect.",
      },
      th: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "ผมช่วยจัดให้ — คืนนี้เธอไม่ต้องนอนเย็น ๆ ในที่นอน แต่คุณเป็นคนสร้างความอบอุ่น",
        bubble: "การันตีความอบอุ่น — ผมแค่ช่วยต่อ",
      },
      pl: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "Pomogę to ogarnąć — żeby dziś wieczorem nie leżała z zimnymi stopami, tylko żebyś to ty dał jej ciepło.",
        bubble: "Gwarancja ciepła — tylko kontakt.",
      },
      ru: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "Помогу это устроить — чтобы сегодня вечером она не лежала с холодными ногами, а ты подарил тепло.",
        bubble: "Гарантия тепла — только связь.",
      },
      zh: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "我帮你张罗——今晚别让她脚丫冰凉地躺着，你来送上温暖。",
        bubble: "温暖保证——我只牵线。",
      },
    },
    warmth_male: {
      de: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "Ich helfe dir, das zu besorgen — damit er heute Abend nicht mit kalten Füßen im Bett liegt, sondern du für Wärme sorgst.",
        bubble: "Wärme-Garantie — ich vermittle.",
      },
      en: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "I'll help you get it sorted — so tonight he's not lying there with cold feet while you could be the one bringing warmth.",
        bubble: "Warmth guarantee — I connect.",
      },
      th: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "ผมช่วยจัดให้ — คืนนี้เขาไม่ต้องนอนเย็น ๆ ในที่นอน แต่คุณเป็นคนสร้างความอบอุ่น",
        bubble: "การันตีความอบอุ่น — ผมแค่ช่วยต่อ",
      },
      pl: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "Pomogę to ogarnąć — żeby dziś wieczorem nie leżał z zimnymi stopami, tylko żebyś to ty dała mu ciepło.",
        bubble: "Gwarancja ciepła — tylko kontakt.",
      },
      ru: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "Помогу это устроить — чтобы сегодня вечером он не лежал с холодными ногами, а ты подарила тепло.",
        bubble: "Гарантия тепла — только связь.",
      },
      zh: {
        speechKey: "psychRelBridgeWarmthTts",
        warmthGuarantee: true,
        tts: "我帮你张罗——今晚别让他脚丫冰凉地躺着，你来送上温暖。",
        bubble: "温暖保证——我只牵线。",
      },
    },
    anchor: {
      de: {
        speechKey: "psychRelBridgeAnchorTts",
        tts: "Ich vermittle nur das Beste, damit das zwischen euch knistert. Der Rest ist dein Job!",
        bubble: "Knistern — dein Part.",
      },
      en: {
        speechKey: "psychRelBridgeAnchorTts",
        tts: "I only broker the good stuff so sparks fly between you. The rest is your job!",
        bubble: "Sparks — your part.",
      },
      th: {
        speechKey: "psychRelBridgeAnchorTts",
        tts: "ผมแค่ช่วยหาของดีที่สุดให้ประกายระหว่างคุณกับเธอ ที่เหลือเป็นหน้าที่คุณ!",
        bubble: "ประกาย — งานของคุณ",
      },
      pl: {
        speechKey: "psychRelBridgeAnchorTts",
        tts: "Łączę tylko z tym, co najlepsze, żeby między wami iskrzyło. Reszta to twoja robota!",
        bubble: "Iskry — twoja część.",
      },
      ru: {
        speechKey: "psychRelBridgeAnchorTts",
        tts: "Свожу только с лучшим, чтобы между вами искрило. Остальное — твоя работа!",
        bubble: "Искры — твоя часть.",
      },
      zh: {
        speechKey: "psychRelBridgeAnchorTts",
        tts: "我只牵线最好的，让你们之间擦出火花。剩下的靠你！",
        bubble: "火花——你的事。",
      },
    },
  };

  function resolveEmpathyTriggerId(triggerId) {
    var id = String(triggerId || "").trim();
    if (id === "grief_relationship") return "relationship_bridge";
    return id;
  }

  function getRelationshipRecommend(lang) {
    var L = normalizeLang(lang);
    return (
      RELATIONSHIP_BRIDGE.recommend_gift[L] ||
      RELATIONSHIP_BRIDGE.recommend_gift.en ||
      RELATIONSHIP_BRIDGE.recommend_intimate.de
    );
  }

  function prefersMalePartner(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    return (
      /\b(freund(?!in)|boyfriend|husband|chłopak|парень|男朋友|老公)\b/i.test(
        t
      ) ||
      /\b(er\s+(ist|war|hat|wird)|ihn\b|miss\s+him|he\s+left)\b/i.test(t)
    );
  }

  function getRelationshipBridgeSteps(lang, userText) {
    var L = normalizeLang(lang);
    var male = prefersMalePartner(userText);
    var questionBucket = male
      ? RELATIONSHIP_BRIDGE.question_male
      : RELATIONSHIP_BRIDGE.question;
    var question = questionBucket[L] || questionBucket.en;
    var recommend = getRelationshipRecommend(L);
    var warmthBucket = male
      ? RELATIONSHIP_BRIDGE.warmth_male
      : RELATIONSHIP_BRIDGE.warmth;
    var warmth = warmthBucket[L] || warmthBucket.en;
    var anchor =
      RELATIONSHIP_BRIDGE.anchor[L] || RELATIONSHIP_BRIDGE.anchor.en;
    if (!question || !recommend || !warmth || !anchor) return null;
    return [question, recommend, warmth, anchor];
  }

  /** Verliebt-Modus: Fuchs-Spruch → Notizbuch+Wink → Erlebnis-Brücke → Glücks-Disclaimer. */
  var VERLIEBT_CHAIN = {
    de: {
      opener: {
        speechKey: "psychVerliebt1Tts",
        tts: "Na du kleiner Fuchs, jetzt bist du also hin und weg? Das ist ein schönes Gefühl!",
        bubble: "Verliebt-Modus — schön!",
      },
      notebookA: {
        speechKey: "psychVerliebt2aTts",
        tts: "Lass mich mal im Notizbuch nachsehen …",
        bubble: "Kurz im Notizbuch …",
      },
      notebookB: {
        speechKey: "psychVerliebt2bTts",
        tts: "… da haben wir doch was!",
        bubble: "Da ist was!",
      },
      bridge: {
        speechKey: "psychVerliebt3Tts",
        tts: "Was glaubst du, worauf sie steht? Schuhe? Tasche? Oder doch lieber ein Kinoticket? Sag mir, was sie mag — ich vermittle dir das perfekte Erlebnis.",
        bubble: "Schuhe, Tasche, Kino — du sagst.",
      },
      disclaimer: {
        speechKey: "psychVerliebtFriendlyTts",
        tts: "Alles klar — ich bin dein Kumpel auf Augenhöhe. Sag Bescheid, was sie mag, dann legen wir los!",
        bubble: "Kumpel-Modus — kein Verkaufsdruck.",
      },
    },
    en: {
      opener: {
        speechKey: "psychVerliebt1Tts",
        tts: "Well, well — head over heels, huh? That's a beautiful feeling!",
        bubble: "Crush mode — nice!",
      },
      notebookA: {
        speechKey: "psychVerliebt2aTts",
        tts: "Let me check my little notebook …",
        bubble: "Checking the notebook …",
      },
      notebookB: {
        speechKey: "psychVerliebt2bTts",
        tts: "… oh, we've got something!",
        bubble: "Found something!",
      },
      bridge: {
        speechKey: "psychVerliebt3Tts",
        tts: "What do you think she's into? Shoes? A bag? Or maybe cinema tickets? Tell me what she likes — I'll connect you to the perfect experience.",
        bubble: "Shoes, bag, cinema — your call.",
      },
      disclaimer: {
        speechKey: "psychVerliebtFriendlyTts",
        tts: "All good — I'm your buddy on your level. Tell me what she likes and we'll roll!",
        bubble: "Buddy mode — no sales pressure.",
      },
    },
    th: {
      opener: {
        speechKey: "psychVerliebt1Tts",
        tts: "โอ้โห — ตกหลุมรักแล้วสินะ? ความรู้สึกดี ๆ แบบนี้เยี่ยมเลย!",
        bubble: "โหมดหลงรัก — ดีมาก!",
      },
      notebookA: {
        speechKey: "psychVerliebt2aTts",
        tts: "ขอเปิดสมุดจดสักครู่นะ …",
        bubble: "เปิดสมุดจด …",
      },
      notebookB: {
        speechKey: "psychVerliebt2bTts",
        tts: "… มีของดีอยู่นี่!",
        bubble: "เจอแล้ว!",
      },
      bridge: {
        speechKey: "psychVerliebt3Tts",
        tts: "คิดว่าเธอชอบอะไร? รองเท้า? กระเป๋า? หรือตั๋วหนัง? บอกมาว่าเธอชอบอะไร — ผมช่วยต่อให้ได้ประสบการณ์ที่ลงตัว",
        bubble: "รองเท้า กระเป๋า หนัง — คุณบอก",
      },
      disclaimer: {
        speechKey: "psychVerliebtFriendlyTts",
        tts: "โอเค — ผมเป็นเพื่อนระดับเดียวกับคุณ บอกมาว่าเธอชอบอะไร แล้วเราเริ่มได้เลย!",
        bubble: "โหมดเพื่อน — ไม่กดดันขาย",
      },
    },
    pl: {
      opener: {
        speechKey: "psychVerliebt1Tts",
        tts: "No no, mały lisie — zakochany po uszy? To piękne uczucie!",
        bubble: "Tryb zakochania — super!",
      },
      notebookA: {
        speechKey: "psychVerliebt2aTts",
        tts: "Zerknę do notatnika …",
        bubble: "Notatnik …",
      },
      notebookB: {
        speechKey: "psychVerliebt2bTts",
        tts: "… mamy coś!",
        bubble: "Jest coś!",
      },
      bridge: {
        speechKey: "psychVerliebt3Tts",
        tts: "Na co ją stać? Buty? Torebka? A może bilet do kina? Powiedz, co lubi — połączę cię z idealnym przeżyciem.",
        bubble: "Buty, torebka, kino — ty mówisz.",
      },
      disclaimer: {
        speechKey: "psychVerliebtFriendlyTts",
        tts: "Spoko — jestem kumplem na równi. Powiedz, co ona lubi, i lecimy!",
        bubble: "Tryb kumpla — zero presji.",
      },
    },
    ru: {
      opener: {
        speechKey: "psychVerliebt1Tts",
        tts: "Ну ты, хитрец — по уши влюблён? Красивое чувство!",
        bubble: "Режим влюблённости — круто!",
      },
      notebookA: {
        speechKey: "psychVerliebt2aTts",
        tts: "Сейчас гляну в блокнот …",
        bubble: "Блокнот …",
      },
      notebookB: {
        speechKey: "psychVerliebt2bTts",
        tts: "… вот, есть кое-что!",
        bubble: "Есть!",
      },
      bridge: {
        speechKey: "psychVerliebt3Tts",
        tts: "Как думаешь, что ей зайдёт? Туфли? Сумка? Или билеты в кино? Скажи, что она любит — сведу с идеальным впечатлением.",
        bubble: "Туфли, сумка, кино — ты решаешь.",
      },
      disclaimer: {
        speechKey: "psychVerliebtFriendlyTts",
        tts: "Ок — я кент на равных. Скажи, что ей нравится, и погнали!",
        bubble: "Режим друга — без давления.",
      },
    },
    zh: {
      opener: {
        speechKey: "psychVerliebt1Tts",
        tts: "哟，小狐狸——神魂颠倒了？这感觉真不错！",
        bubble: "热恋模式——真好！",
      },
      notebookA: {
        speechKey: "psychVerliebt2aTts",
        tts: "让我翻翻小本子……",
        bubble: "翻本子……",
      },
      notebookB: {
        speechKey: "psychVerliebt2bTts",
        tts: "……嘿，有货！",
        bubble: "找到了！",
      },
      bridge: {
        speechKey: "psychVerliebt3Tts",
        tts: "你觉得她中意什么？鞋子？包包？还是电影票？告诉我她的喜好——我帮你牵线完美体验。",
        bubble: "鞋、包、电影——你来定。",
      },
      disclaimer: {
        speechKey: "psychVerliebtFriendlyTts",
        tts: "行——我是跟你平起平坐的朋友。告诉我她的喜好，咱们开干！",
        bubble: "哥们模式——不推销。",
      },
    },
  };

  function getVerliebtSteps(lang) {
    var L = normalizeLang(lang);
    return VERLIEBT_CHAIN[L] || VERLIEBT_CHAIN.en || VERLIEBT_CHAIN.de || null;
  }

  function getEmpathySteps(lang, triggerId, userText) {
    triggerId = resolveEmpathyTriggerId(triggerId);
    if (triggerId === "relationship_bridge") {
      return getRelationshipBridgeSteps(lang, userText);
    }
    var bucket = EMPATHY_CHAINS[triggerId];
    if (!bucket) return null;
    var L = normalizeLang(lang);
    return bucket[L] || bucket.en || bucket.de || null;
  }

  function moduleRequiresCompliance(moduleId) {
    var id = String(moduleId || "");
    if (
      id === "cross_moped" ||
      id === "cross_authenticity" ||
      id === "cross_tools"
    ) {
      return true;
    }
    if (
      /^(credit_|insurance_|real_estate_|automotive_)/.test(id)
    ) {
      return true;
    }
    var mod = getModule("de", id) || getModule("en", id);
    return !!(mod && mod.complianceDisclaimer);
  }

  function formatModuleLine(mod, name, extras) {
    if (!mod || !mod.tts) return "";
    extras = extras || {};
    var n = String(name || "").trim();
    var line = mod.tts.replace(/\{NAME\}/g, n || "du");
    if (extras.amount != null) {
      line = line
        .replace(/\{AMOUNT\}/g, String(extras.amount))
        .replace(/\{THB\}/g, String(extras.amount));
    }
    if (extras.lang != null) {
      line = line.replace(/\{LANG\}/g, String(extras.lang));
    }
    if (extras.altLang != null) {
      line = line.replace(/\{ALT_LANG\}/g, String(extras.altLang));
    }
    return line;
  }

  function formatModuleBubble(mod, name, extras) {
    if (!mod) return "";
    var bubble = String(mod.bubble || mod.tts || "").trim();
    extras = extras || {};
    var n = String(name || "").trim();
    bubble = bubble.replace(/\{NAME\}/g, n || "du");
    if (extras.amount != null) {
      bubble = bubble
        .replace(/\{AMOUNT\}/g, String(extras.amount))
        .replace(/\{THB\}/g, String(extras.amount));
    }
    if (extras.lang != null) {
      bubble = bubble.replace(/\{LANG\}/g, String(extras.lang));
    }
    if (extras.altLang != null) {
      bubble = bubble.replace(/\{ALT_LANG\}/g, String(extras.altLang));
    }
    return bubble;
  }

  function resolvePsychModuleId(moduleId, lang) {
    var id = String(moduleId || "").trim();
    if (id !== "gift_bundle") return id;
    var g =
      typeof global !== "undefined" && global.OSG_I18N_LANG_GUARD
        ? global.OSG_I18N_LANG_GUARD
        : null;
    if (g && typeof g.giftBundleModuleForLang === "function") {
      return g.giftBundleModuleForLang(lang);
    }
    var L = normalizeLang(lang);
    if (L === "th") return "gift_bundle_th";
    if (L === "de") return "gift_bundle_de";
    return "gift_bundle";
  }

  function getMishapLine(lang, type) {
    var modId = "mishap_" + String(type || "stumble");
    var mod = getModule(lang, modId);
    return mod && mod.tts ? mod.tts : "";
  }

  global.OSG_PSYCHOLOGY_PROMPTS = {
    LANGS: LANGS,
    MODULES: MODULES,
    NO_PRESSURE: NO_PRESSURE,
    HESITATE_MS: 2800,
    VIEW_DWELL_MS: 1500,
    COOLDOWN_MS: COOLDOWN_MS,
    normalizeLang: normalizeLang,
    getModule: getModule,
    pickForTrigger: pickForTrigger,
    getNoPressure: getNoPressure,
    isDecline: isDecline,
    isComplianceTrigger: isComplianceTrigger,
    mayFire: mayFire,
    markFired: markFired,
    moduleIdForLink: moduleIdForLink,
    clickModuleIdForCompliance: clickModuleIdForCompliance,
    EMPATHY_CHAINS: EMPATHY_CHAINS,
    RELATIONSHIP_BRIDGE: RELATIONSHIP_BRIDGE,
    getEmpathySteps: getEmpathySteps,
    getRelationshipBridgeSteps: getRelationshipBridgeSteps,
    resolveEmpathyTriggerId: resolveEmpathyTriggerId,
    VERLIEBT_CHAIN: VERLIEBT_CHAIN,
    getVerliebtSteps: getVerliebtSteps,
    moduleRequiresCompliance: moduleRequiresCompliance,
    formatModuleLine: formatModuleLine,
    formatModuleBubble: formatModuleBubble,
    getMishapLine: getMishapLine,
    resolvePsychModuleId: resolvePsychModuleId,
  };
})(typeof window !== "undefined" ? window : globalThis);
