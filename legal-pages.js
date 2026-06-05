/**
 * Modular legal copy (template — have counsel review before Go-Live).
 * index.html mounts Imprint, Terms, Affiliate disclosure by UI language.
 */
(function () {
  var L = {};

  function p(html) {
    return String(html || "");
  }

  L.de = {
    imprintLead:
      p(
        "<p><strong>Hinweis:</strong> Vor Live-Gang durch eine Fachkanzlei gegen eure echten Angaben prüfen.</p>",
      ),
    imprintHtml:
      p(
        "<h3>Impressum — Angaben zur verantwortlichen Stelle</h3>" +
          "<p><strong>Omni Solutions Global Co., Ltd.</strong> (Markenbezug: „BestPrice“ / „PAULI BEST PRICE THAILAND“)<br />" +
          "Königreich Thailand — eingetragen beim Department of Business Development (DBD), Ministerium für Handel, Thailand.<br />" +
          "<strong>DBD-Registernummer (einsetzen laut Urkunde):</strong> [DBD_REGISTRATION_NUMBER]</p>" +
          "<p><strong>Vertretungsberechtigt / Inhaberin (laut Gewerbeanmeldung):</strong> Chatchadapha Hausser</p>" +
          "<p class=\"osg-imprint-address-min\"><strong>Eingetragener Sitz (nur gesetzliches Minimum — vollständig laut Registereintrag):</strong> [REGISTERED_OFFICE_ADDRESS_TH]</p>" +
          "<p><strong>Hauptkontakt:</strong> <a href=\"mailto:chatchadapha.hausser81@gmail.com\">chatchadapha.hausser81@gmail.com</a></p>" +
          "<p><strong>Zahlungsabwicklung:</strong> Vermittlungs- und Provisionsflüsse (u. a. Marktplatz-Affiliate, B2B-Kanäle) werden wesentlich über ein Geschäftskonto bei <strong>Kasikornbank (kBank)</strong>, Thailand, abgewickelt. Kontodaten werden nicht öffentlich ausgewiesen — Mitteilung auf Rechnung oder auf schriftliche Anfrage.</p>" +
          "<p><strong>Hinweis USt/IdNr. außerhalb Thailands:</strong> Nur aufnehmen, sofern für eure Rechtslage zutreffend.</p>" +
          "<p><strong>Verbraucherstreitbeilegung:</strong> Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle weder verpflichtet noch angeboten, sofern nicht separat erklärt.</p>" +
          "<p><strong>Redaktionelle Kontrolle:</strong> Platzhalter durch Amtzahlen/Adresse aus der Urkunde ersetzen; juristisch prüfen.</p>",
      ),
    termsLead:
      p("<p>Allgemeine Nutzungsbedingungen dieser Web-Anwendung (Orientierung).</p>"),
    termsHtml:
      p(
        "<h3>Abschnitt 1 Vertragsgegenstand und Vermittlerrolle</h3>" +
          "<p>Die Anwendung führt strukturierte Preis- und Einkaufshinweise zusammen sowie technische Tracking-IDs für Fremd-Angebote (<code>osg_*</code>). Die App selbst verkauft keine Waren oder Finanzprodukte. <strong>Wir sind die Wegweiser und keine Berater.</strong> BestPrice/PauliBestPrice-Protokolle dokumentieren Routenwahl lokal beim Nutzerendgerät.</p>" +
          "<h3>Abschnitt 2 Daten und Zero-Cloud-Grundsatz für Profil-/Personendaten</h3>" +
          "<p>Freiwillig eingegebene Stammdaten (z. B. Vorname zur Ansprache), Mitgliedshinweise und lokale Nachweise werden in <code>localStorage</code> des Browsers verwaltet — nicht automatisch durch diese UI an einen Personen-/CRM-Server übermittelt.</p>" +
          "<h3>Abschnitt 3 Keine Beratungsleistung / Haftung (Tippgeber)</h3>" +
          "<p>BestPrice bietet keine Anlage-, Immobilien-, Finanz- oder Versicherungsberatung an. Wir sind reiner Vermittler (Tippgeber). Keine Haftung für fingierte Angebote Dritter, Warenzustände bei Fremdangeboten sowie falsche Alters-/Identitätsangaben. Verträge kommen nur zwischen Nutzer und Partner zustande.</p>" +
          "<h3>Hinweis zu modellierten Gesamtpreisen</h3>" +
          "<p>Der modellierte Endpreis kann einen dokumentierten Plattform-/Infrastrukturbeitrag von 59 THB enthalten (vgl. Live‑UI / Geschäftsbedingungen).</p>" +
          "<h3>Abschnitt 4 Änderungen</h3>" +
          "<p>Textstände können aktualisiert werden; dokumentabel via Datumsangabe beim Aufruf im Browser.</p>",
      ),
    affiliateLead:
      p(
        "<p><strong>Affiliate-/Vermittleroffenlegung:</strong></p>",
      ),
    affiliateHtml:
      p(
        "<h3>Vergütungen & Provisionen</h3>" +
          "<p>Wir können Provisionen („Affiliate‑Vergütung“) durch vermittelte Klicks oder abgeschlossene Partnerprozesse erhalten. Für Nutzer soll kein struktureller Mehrpreis entstehen, sofern der Partner keine abweichenden Gebühren vorsieht.</p>" +
          "<h3>Anzeige & Dokumentationspflicht lokal</h3>" +
          "<p>Technische Hinweis‑Pararmeter können in Links enthalten sein (<code>osg_*</code>). Ein Gerätemitschnitt/Leadjournal kann die Weiterleitungen für Nachweise archivieren — ohne Cloud‑Zwangsprofilerstellung durch diese SPA.</p>" +
          "<h3>Unabhängigkeit</h3>" +
          "<p>Partnerlisten sind illustrativ; Reihenfolgen und Markenwechsel ohne gesonderten Hinweis möglich. Keine Ranking‑„Bestätigung“ zulasten Dritter.</p>",
      ),
  };

  L.en = {
    imprintLead:
      p(
        "<p><strong>Notice:</strong> Replace placeholders with verified operator data prior to publication.</p>",
      ),
    imprintHtml:
      p(
        "<h3>Legal disclosure / imprint</h3>" +
          "<p><strong>Omni Solutions Global Co., Ltd.</strong> (brand references: BestPrice / PAULI BEST PRICE THAILAND)<br />" +
          "Kingdom of Thailand — registered with the <strong>Department of Business Development (DBD)</strong>, Ministry of Commerce, Thailand.<br />" +
          "<strong>DBD registration number (from certificate):</strong> [DBD_REGISTRATION_NUMBER]</p>" +
          "<p><strong>Authorized representative / operator (Thai business registration):</strong> Chatchadapha Hausser</p>" +
          "<p class=\"osg-imprint-address-min\"><strong>Registered address (statutory minimum only — full text as filed):</strong> [REGISTERED_OFFICE_ADDRESS_TH]</p>" +
          "<p><strong>Primary contact:</strong> <a href=\"mailto:chatchadapha.hausser81@gmail.com\">chatchadapha.hausser81@gmail.com</a></p>" +
          "<p><strong>Settlements:</strong> Commission and intermediary flows (including marketplace affiliate and B2B channels) are handled primarily via a <strong>Kasikornbank (kBank)</strong> business account in Thailand. Account numbers are not published — provided on invoice or upon written request.</p>" +
          "<p><strong>EU/DE VAT ID:</strong> Add only if applicable to your legal structure.</p>" +
          "<p><strong>Dispute resolution:</strong> Consumer mediation participation neither mandatory nor offered unless expressly stated.</p>" +
          "<p><strong>Before publication:</strong> Replace placeholders with official extract data; counsel review.</p>",
      ),
    termsLead: p("<p>Terms of use (outline).</p>"),
    termsHtml:
      p(
        "<h3>1 Subject matter & referrer role</h3>" +
          "<p>This interface aggregates public partner links plus technical outbound tags (<code>osg_*</code>). <strong>We are the signposts, not advisors.</strong> No inventories are sold via this codebase.</p>" +
          "<h3>2 Local profile data</h3>" +
          "<p>Optional display names/membership notes stay handset-local unless users browse out or you operate server mirrors.</p>" +
          "<h3>3 No regulated advice / liability (referrer)</h3>" +
          "<p>No investment/real-estate/finance/insurance advice — pure intermediary tipping. No liability for fraudulent third-party offers, product condition on external listings, or false age/identity statements. Contracts are only between users and partner brands.</p>" +
          "<h3>Model totals / infrastructure fee</h3>" +
          "<p>Modeled totals may include a disclosed platform/infrastructure contribution of 59 THB (see live UI / terms).</p>" +
          "<h3>4 Changes</h3>" +
          "<p>Documents may be updated — review footer timestamp on deploy.</p>",
      ),
    affiliateLead: p("<p><strong>Affiliate & commission disclosure</strong></p>"),
    affiliateHtml:
      p(
        "<h3>How we may earn commissions</h3>" +
          "<p>Clicks routed through tagged URLs may qualify for affiliate payouts. Ordinary goal: <strong>no surcharge</strong> to you versus arriving directly unless the retailer states otherwise.</p>" +
          "<h3>Local logging</h3>" +
          "<p>Outbound attempts can be hashed into the device journal (<code>osg_lead</code> records) — not a centralized dossier mandated by UI alone.</p>" +
          "<h3>Independent partners</h3>" +
          "<p>Partner matrices are illustrative; listings may change anytime.</p>",
      ),
  };

  L.th = {
    imprintLead:
      p(
        "<p><strong>ประกาศ:</strong> ควรให้ที่ปรึกษากฎหมายตรวจสอบก่อนเปิดใช้งานจริง</p>",
      ),
    imprintHtml:
      p(
        "<h3>ข้อมูลนิติบุคคล (ร่าง — ต้องตรวจกับใบจดทะเบียนจริง)</h3>" +
          "<p><strong>Omni Solutions Global Co., Ltd.</strong> (แบรนด์ BestPrice / PAULI BEST PRICE THAILAND)<br />" +
          "ราชอาณาจักรไทย — จดทะเบียนกับ <strong>กรมพัฒนาธุรกิจการค้า (DBD)</strong> กระทรวงพาณิชย์<br />" +
          "<strong>เลขทะเบียน DBD (กรอกตามหนังสือรับรอง):</strong> [DBD_REGISTRATION_NUMBER]</p>" +
          "<p><strong>ผู้รับผิดชอบ/ผู้ประกอบการ (ตามใบทะเบียนพาณิชย์):</strong> Chatchadapha Hausser</p>" +
          "<p class=\"osg-imprint-address-min\"><strong>ที่ตั้งจดทะเบียน (เท่าที่กฎหมายกำหนด — เต็มตามใบจดทะเบียน):</strong> [REGISTERED_OFFICE_ADDRESS_TH]</p>" +
          "<p><strong>ติดต่อหลัก:</strong> <a href=\"mailto:chatchadapha.hausser81@gmail.com\">chatchadapha.hausser81@gmail.com</a></p>" +
          "<p><strong>การชำระเงิน:</strong> รายได้ค่านายหน้า/B2B หลักใช้บัญชีธุรกิจ <strong>ธนาคารกสิกรไทย (kBank)</strong> — ไม่เผยแพร่เลขบัญชีสาธารณะ แจ้งตามใบแจ้งหนี้หรือคำขอเป็นลายลักษณ์อักษร</p>" +
          "<p><strong>คำเตือน:</strong> แทนที่ค่าในวงเล็บ [] ด้วยข้อมูลทางราชการที่ถูกต้อง — ให้ที่ปรึกษากฎหมายตรวจก่อนเผยแพร่</p>",
      ),
    termsLead: p("<p>เงื่อนไขการใช้งาน (ภาพรวม)</p>"),
    termsHtml:
      p(
        "<h3>เราเป็นเพียงผู้ชี้ช่องทาง — ไม่ใช่ที่ปรึกษาการเงิน/อสังหา/ประกัน</h3>" +
          "<p>แอปนี้รวบรวมลิงก์และพารามิเตอร์ติดตามเทคนิค — BestPrice/PauliBestPrice ไม่จำหน่ายหรือประมูลผลิตภัณฑ์โดยตรงจากหน้าเว็บนี้</p>" +
          "<p>เราไม่ให้คำปรึกษาเกี่ยวกับการลงทุน ที่ดิน ยานยนต์ ประกัน การเงิน — <strong>เราเป็นเพียงตัวกลางผู้แนะนำ</strong>; ข้อผูกพันเกิดระหว่างคุณกับผู้ประกอบการเท่านั้น</p>" +
          "<p>ไม่รับผิดชอบต่อข้อเสนอหลอกลวงของบุคคลที่สาม สภาพสินค้าจากแหล่งภายนอก หรือการแถมอายุ/ตัวตนที่เป็นเท็จ — โปรดตรวจสอบด้วยตนเอง</p>" +
          "<h3>ค่าบริการแพลตฟอร์ม (ข้อมูลประกอบราคาแบบจำลอง)</h3>" +
          "<p>ยอดรวมแบบจำลองอาจรวมค่าบริการโครงสร้าง/แพลตฟอร์มที่ระบุไว้ 59 THB (ดู UI จริงและข้อกำหนด)</p>",
      ),
    affiliateLead: p("<p><strong>การเปิดเผยค่านายหน้า/ความเป็นพันธมิตร</strong></p>"),
    affiliateHtml:
      p(
        "<h3>รายได้ที่อาจได้รับจากคลิก/การแนะนำ</h3>" +
          "<p>โปรแกรมพันธมิตรอาจให้ค่านายหน้าแก่ Platform — เราพยายามไม่สร้างค่าใช้จ่ายเกินจากผู้ซื้อเทียบกับเข้าร้านโดยตรง หากคู่ค้ากำหนดไม่แตกต่าง</p>",
      ),
  };

  L.pl = {
    imprintLead: L.en.imprintLead,
    imprintHtml: L.en.imprintHtml,
    termsLead: p("<p>Regulamin (wersja pomocnicza).</p>"),
    termsHtml:
      p(
        "<h3>1 Zakres i rola pośrednika</h3><p>Aplikacja agreguje linki i znaczniki <code>osg_*</code>. <strong>Jesteśmy drogowskazem, nie doradcą.</strong></p>" +
          "<h3>2 Brak porad profesjonalnych / odpowiedzialność</h3><p>Nie prowadzimy doradztwa inwestycyjnego ani finansowego — czyste pośrednictwo. Brak odpowiedzialności za fałszywe oferty, stan towarów u innych sprzedawców oraz fałszywe dane wieku/tożsamości. Umowy wyłącznie z partnerem.</p>" +
          "<h3>Model cen końcowych / infrastruktura</h3><p>Modelowe sum mogą obejmować ujawniony wkład infrastruktury/platformy 59 THB (patrz interfejs na żywo / regulamin).</p>",
      ),
    affiliateLead:
      p("<p><strong>Oświadczenie afiliacyjne / prowizje</strong></p>"),
    affiliateHtml:
      p(
        "<h3>Ewentualne prowizje</h3>" +
          "<p>Partner może wypłacać rekompensaty za przejście z tagowanym URI; zwykle bez dopłaty dla Ciebie względem prostego wejścia bez tagu.</p>",
      ),
  };

  L.ru = {
    imprintLead: L.en.imprintLead,
    imprintHtml: L.en.imprintHtml,
    termsLead:
      p("<p>Пользовательское соглашение — ориентир.</p>"),
    termsHtml:
      p(
        "<h3>1 Объём и роль навигатора</h3>" +
          "<p>Интерфейс агрегирует партнёрские ссылки и служебные параметры (<code>osg_*</code>). <strong>Мы указатели, не консультанты.</strong> Договоров с нами как с продавцом нет.</p>" +
          "<h3>2 Нет регулируемых консультаций / ответственность</h3>" +
          "<p>Никаких рекомендаций по финансам/недвижимости/страхованию — чистое посредничество. Не несём ответственности за мошеннические предложения третьих лиц, состояние товаров у внешних продавцов и ложные сведения о возрасте/личности. Договор только между вами и партнёром.</p>" +
          "<h3>Модели итога / платформа</h3><p>Иллюстративные итоги могут включать раскрытый вклад инфраструктуры/платформы 59 THB (см. актуальный UI / условия).</p>",
      ),
    affiliateLead:
      p("<p><strong>Раскрытие партнёрских вознаграждений</strong></p>"),
    affiliateHtml:
      p(
        "<h3>Возможные выплаты</h3>" +
          "<p>Тегируемые клики могут квалифицировать вознаграждение платформе; пользователю обычно не добавляется наценки относительно прямого визита, если партнёр иное явно не оговаривает.</p>",
      ),
  };

  L.zh = {
    imprintLead:
      p("<p><strong>说明：</strong>以下为模版，请以律师审核为准。</p>"),
    imprintHtml:
      p(
        "<h3>法律披露 / 登记信息（模版 — 须用官方法件替换方括号）</h3>" +
          "<p><strong>Omni Solutions Global Co., Ltd.</strong>（BestPrice / PAULI BEST PRICE THAILAND 品牌称谓）<br />" +
          "泰王国 — 依据泰国商业发展厅（<strong>DBD</strong>，商务部）登记。<br />" +
          "<strong>DBD 注册号（请按证书原文填写）：</strong>[DBD_REGISTRATION_NUMBER]</p>" +
          "<p><strong>负责人（以泰国营业登记为准）：</strong>Chatchadapha Hausser</p>" +
          "<p class=\"osg-imprint-address-min\"><strong>注册地址（法定披露最低限度 — 以登记簿为准）：</strong>[REGISTERED_OFFICE_ADDRESS_TH]</p>" +
          "<p><strong>首要联系：</strong><a href=\"mailto:chatchadapha.hausser81@gmail.com\">chatchadapha.hausser81@gmail.com</a></p>" +
          "<p><strong>结算：</strong>佣金及 B2B 相关款项主要通过泰国 <strong>Kasikornbank（开泰银行）</strong>企业账户处理；账号不公开展示，见于账单或书面索取。</p>" +
          "<p>发布前请由法律顾问核对并与登记摘要保持一致。</p>",
      ),
    termsLead: p("<p>用户条款（提要）</p>"),
    termsHtml:
      p(
        "<h3>服务对象与角色</h3>" +
          "<p>本产品汇总对外链接与技术跟踪参数。<strong>我们为引路提示，不承担投资/房贷/车贷/保险的顾问义务。</strong>合同仅在您与合作方之间成立。</p>" +
          "<p>对第三方虚假宣传、外部商品状态及年龄/身份不实陈述不承担责任，请自行核实。</p>" +
          "<h3>数据</h3>" +
          "<p>自选姓名等信息默认保存在浏览器本地存储，除非另行部署镜像接口。</p>" +
          "<h3>平台服务费（示范性总价说明）</h3>" +
          "<p>示意总价可包含已披露的 59 THB 平台/基础设施费用项（以线上界面与条款为准）。</p>",
      ),
    affiliateLead: p("<p><strong>联盟营销 / 佣金披露</strong></p>"),
    affiliateHtml:
      p(
        "<h3>收益模式</h3>" +
          "<p>通过带参数的跳转可能触发联盟佣金；通常<strong>不向您加价</strong>（除非零售商另有规则）。本地可记录出站尝试以便对账。</p>",
      ),
  };

  window.__OSG_LEGAL_MODULES__ = L;
})();
