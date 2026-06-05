/**
 * [Legacy] VIP-Karten per Puppeteer — nicht mehr per npm-Skript verdrahtet.
 * Münz-QR-Ausgabe: `npm run vip:gen` (scripts/generate-vip-zugang.mjs).
 *
 * Renders 56 gold-on-black VIP card PNGs (6 family specials + Imperium 1–50),
 * writes data/vip_codes.json in the same order, and replaces PNGs under VIP_ZUGANG/.
 *
 * Rückseite: Rand/Sterne/Zier bleiben sichtbar. Nur weiches zentrales „Medaillon“ dämpft die
 * alte Mitte (B). QR als goldene Prägung: Maske (weiß = Modul) × metallischer Goldverlauf — kein schwarzer Druck.
 *
 * Manuell: `node scripts/generate-vip-visuals.mjs` (Chrome/Puppeteer). Für Münz-QR: `npm run vip:gen`.
 *
 * Card copy is authored only inside this offline generator script (VIP_ZUGANG output),
 * not as runtime shopper-facing literals in HTML/JS/CSS.
 */
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const vipDir = path.join(root, "VIP_ZUGANG");
const dataDir = path.join(root, "data");
/** Rückseite: bevorzugt public/hinterseite.jpg, sonst Muenz_Design/hinterseite.png */
function resolveCoinBackPath() {
  const jpg = path.join(root, "public", "hinterseite.jpg");
  const png = path.join(
    root,
    "Paulis_App_Imperium",
    "Muenz_Design",
    "hinterseite.png",
  );
  if (fs.existsSync(jpg)) return jpg;
  if (fs.existsSync(png)) return png;
  return jpg;
}
const COIN_BACK_PATH = resolveCoinBackPath();
const coinBackFileUrl = fs.existsSync(COIN_BACK_PATH)
  ? pathToFileURL(COIN_BACK_PATH).href
  : "";

const baseUrl =
  process.env.OSG_VIP_BASE_URL || "http://localhost:3000/index.html";

const SPECIAL_ROWS = [
  {
    png: "VIP-Bruder.png",
    line: "VIP® - สำหรับพี่ชายของฉันโดยเฉพาะ",
  },
  {
    png: "VIP-Schwester-Vanida.png",
    line: "VIP® - สำหรับพี่สาววานิดาโดยเฉพาะ",
  },
  {
    png: "VIP-Wii.png",
    line: "VIP® - EXKLUSIV FOR Wii",
  },
  {
    png: "VIP-Pauli.png",
    line: "VIP® - EXKLUSIV FOR PAULI",
  },
  {
    png: "VIP-Mama.png",
    line: "VIP® - สำหรับคุณแม่โดยเฉพาะ",
  },
  {
    png: "VIP-Ramphan.png",
    line: "VIP® - สำหรับคุณรำพรรณโดยเฉพาะ",
  },
];

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function randCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "PF-";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function uniqCodes(count) {
  const used = new Set();
  const list = [];
  while (list.length < count) {
    const c = randCode();
    if (used.has(c)) continue;
    used.add(c);
    list.push(c);
  }
  return list;
}

function buildVipUrl(code) {
  try {
    const u = new URL(baseUrl, "http://localhost");
    u.searchParams.set("osg_vip", code);
    return u.href;
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}osg_vip=${encodeURIComponent(code)}`;
  }
}

/**
 * @typedef {{
 *   headline: string;
 *   hlHtml: string;
 *   edge?: string;
 *   edgeId?: string;
 *   gradientId?: string;
 *   code?: string;
 *   ribbon?: boolean;
 *   hlWrapClass?: string;
 *   vipSlotTag?: string;
 *   imperialSlot?: string;
 *   imperialMax?: string;
 * }} CardModel
 */

async function qrMaskDataUrlForCode(code) {
  const url = buildVipUrl(code);
  return QRCode.toDataURL(url, {
    width: 420,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#ffffffff", light: "#00000000" },
  });
}

/** @param {CardModel} model */
async function htmlDocument(model) {
  const gid = model.gradientId || "goldTextMain";
  const pathId = model.edgeId || "vipArcLow";

  const edgeSvg =
    model.edge != null
      ? `
      <svg class="rim" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" aria-hidden="true">
        <defs>
          <path id="${pathId}" fill="none" d="M 120 560 A 520 520 0 0 1 1160 560"/>
          <linearGradient id="${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fff9e6"/>
            <stop offset="45%" stop-color="#d4af37"/>
            <stop offset="100%" stop-color="#6e5410"/>
          </linearGradient>
        </defs>
        <text fill="url(#${gid})" font-family="'Noto Sans Thai','Palatino Linotype',serif" font-size="19" letter-spacing="0.35em" opacity="0.72">
          <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${escHtml(
            model.edge,
          )}</textPath>
        </text>
      </svg>`
      : "";

  const ribbon = model.ribbon ? `<div class="ribbon">IMPERIUM</div>` : "";

  const footerCode =
    model.code != null
      ? `<div class="code-foot">${escHtml(model.code)}</div>`
      : "";

  const qrMaskSrc =
    model.code && coinBackFileUrl
      ? await qrMaskDataUrlForCode(model.code)
      : "";
  const coinBackSrc = coinBackFileUrl;
  let qrCaptions = "";
  if (model.imperialSlot) {
    qrCaptions = `<div class="qr-caption"><span class="qr-cap-main">VIP QR-CODE</span><span class="qr-cap-sub">NO. ${escHtml(model.imperialSlot)} / ${escHtml(model.imperialMax || "50")}</span></div>`;
  } else if (model.vipSlotTag) {
    qrCaptions = `<div class="qr-caption"><span class="qr-cap-main">VIP QR-CODE</span><span class="qr-cap-sub">${escHtml(model.vipSlotTag)}</span></div>`;
  } else if (model.code) {
    qrCaptions = `<div class="qr-caption"><span class="qr-cap-main">VIP QR-CODE</span></div>`;
  }
  const coinBody =
    coinBackFileUrl && qrMaskSrc
      ? `<div class="coin-wrap">
      <div class="coin-ring"></div>
      <div class="coin-photo">
        <img class="coin-back-img" src="${coinBackSrc}" alt="" decoding="sync"/>
        <div class="coin-b-veil" aria-hidden="true"></div>
        <div class="coin-qr-stack">
          <div class="coin-qr-metallic" style="-webkit-mask-image:url('${qrMaskSrc}');mask-image:url('${qrMaskSrc}');-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;"></div>
          ${qrCaptions}
        </div>
      </div>
    </div>`
      : `<div class="coin-wrap"><div class="coin-ring"></div><div class="coin coin-fallback"><div class="coin-text">PAULI<br/>BEST PRICE</div></div></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Noto+Sans+Thai:wght@400;600;700&display=swap"/>
  <style>
    html, body { margin:0; padding:0; width:1280px; height:720px; background:#070707;
      font-family:'Noto Sans Thai','Palatino Linotype','Times New Roman',serif;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      position:relative; width:1280px; height:720px; box-sizing:border-box;
      overflow:hidden;
      border: double 10px transparent;
      background:
        linear-gradient(#050505,#050505) padding-box,
        linear-gradient(135deg,#a67c2e,#f5e6a9 28%,#8a7018 52%,#f2d98c 74%,#4a3710) border-box;
      box-shadow: inset 0 0 140px rgba(0,0,0,0.75);
    }
    .grain {
      pointer-events:none; position:absolute; inset:0;
      opacity:0.04;
      background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAARklEQVR42mNkYGD4z8DAwMgABYwwBgAYwYjBZ8AIIBhABoYRI4AMDCNGABkwjBgBZMCwYQSQDcOGEUC2DIuMAbJlhJEBAABWPAWf8Z5f8QAAAABJRU5ErkJggg==");
    }
    .rim { position:absolute; left:0; top:0; width:1280px; height:720px; pointer-events:none; }
    .head {
      margin-top:52px;
      padding:0 64px;
      font-family:Cinzel,serif;
      font-weight:700;
      letter-spacing:0.42em;
      text-align:center;
      font-size:34px;
      line-height:1.25;
      background:linear-gradient(180deg,#fff8e7 0%,#e6c766 42%,#7a5f18 88%);
      -webkit-background-clip:text;
      background-clip:text;
      color:transparent;
      text-shadow:0 2px 18px rgba(212,175,55,0.35);
      filter: drop-shadow(0 1px 0 #2a2108);
    }
    .ribbon {
      margin:18px auto 0 auto;
      text-align:center;
      font-family:Cinzel,serif;
      font-size:16px;
      letter-spacing:0.55em;
      color:rgba(212,175,55,0.55);
      font-weight:600;
    }
    .coin-wrap {
      position:relative;
      display:flex;
      justify-content:center;
      margin-top:36px;
    }
    .coin-photo {
      position:relative;
      width:380px;height:380px;border-radius:50%;
      overflow:hidden;
      box-shadow:
        inset -8px -16px 32px rgba(0,0,0,0.35),
        0 0 0 6px rgba(120,93,26,0.65),
        0 22px 50px rgba(0,0,0,0.65);
    }
    .coin-back-img {
      width:100%;height:100%;
      object-fit:cover;
      object-position:center;
      display:block;
      position:relative;
      z-index:0;
    }
    /* Weich ausblendend: nur die Mitte (B), nicht Rand/Sterne/Zier */
    .coin-b-veil {
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      width:39%;
      max-width:148px;
      aspect-ratio:1;
      border-radius:50%;
      z-index:1;
      pointer-events:none;
      background:radial-gradient(
        circle at 36% 30%,
        rgba(252, 246, 228, 0.55) 0%,
        rgba(232, 204, 120, 0.28) 42%,
        rgba(200, 155, 60, 0.08) 68%,
        rgba(212, 175, 55, 0) 82%
      );
    }
    .coin-qr-stack {
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      width:34%;
      max-width:130px;
      display:flex;
      flex-direction:column;
      align-items:center;
      pointer-events:none;
      z-index:2;
    }
    /* Gold-Prägung: Verlauf nur dort sichtbar, wo die QR-Maske weiß ist */
    .coin-qr-metallic {
      width:100%;
      aspect-ratio:1;
      flex-shrink:0;
      background:linear-gradient(
        155deg,
        #fffef8 0%,
        #f7e8b0 18%,
        #e8c868 38%,
        #d4af37 52%,
        #aa8624 72%,
        #5c4110 100%
      );
      -webkit-mask-size:contain;
      mask-size:contain;
      -webkit-mask-repeat:no-repeat;
      mask-repeat:no-repeat;
      -webkit-mask-position:center;
      mask-position:center;
      filter:
        drop-shadow(-0.8px -0.8px 0.6px rgba(255, 252, 240, 0.95))
        drop-shadow(1.2px 1.5px 1.8px rgba(0, 0, 0, 0.48))
        drop-shadow(0 0 1px rgba(212, 175, 55, 0.35));
    }
    .qr-caption {
      margin-top:6px;
      text-align:center;
      width:120%;
    }
    .qr-cap-main {
      display:block;
      font-family:Cinzel,serif;
      font-weight:700;
      font-size:10px;
      letter-spacing:0.42em;
      color:rgba(212,175,55,0.92);
      text-shadow:0 1px 3px rgba(0,0,0,0.8);
    }
    .qr-cap-sub {
      display:block;
      margin-top:3px;
      font-family:'Noto Sans Thai','Palatino Linotype',serif;
      font-size:11px;
      letter-spacing:0.18em;
      font-weight:600;
      color:rgba(247,239,216,0.88);
      text-shadow:0 2px 6px rgba(0,0,0,0.75);
    }
    .coin.coin-fallback {
      width:356px;height:356px;border-radius:50%;
      background:
        radial-gradient(circle at 32% 28%, #fffef2 0%, #f6e09a 22%, #c9a23a 48%, #5c4510 100%);
      box-shadow:
        inset -8px -16px 32px rgba(0,0,0,0.45),
        inset 6px 10px 24px rgba(255,248,215,0.55),
        0 0 0 6px rgba(120,93,26,0.65),
        0 22px 50px rgba(0,0,0,0.65);
      position:relative;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
    }
    .coin-ring {
      position:absolute; inset:-14px;border-radius:50%;
      border: solid 4px transparent;
      background:
        linear-gradient(#1a1406,#1a1406) padding-box,
        linear-gradient(140deg,#6e5410,#f3e2a8 40%,#8a7018 60%,#2a2108) border-box;
    }
    .coin-text {
      font-family:Cinzel,serif;font-weight:700;
      letter-spacing:0.18em;line-height:1.15;text-align:center;
      font-size:23px;color:#2a2110;text-shadow:0 1px 0 rgba(255,250,215,0.75);
      margin-top:-8px;
    }
    .divider {
      width:56%; height:2px;margin:48px auto 0 auto;border-radius:2px;
      background:linear-gradient(90deg,transparent,#c9a23a,#f9f2c9,#c9a23a,transparent);
      opacity:0.55;
    }
    .hl {
      text-align:center; margin-top:36px;padding:0 110px;line-height:1.52;font-size:31px;font-weight:600;
      background:linear-gradient(180deg,#fff8e8 15%, #e4c056 52%, #8c6f1d 94%);
      -webkit-background-clip:text; background-clip:text; color:transparent;
      filter: drop-shadow(0 1px 0 #1a1406);
      word-break: break-word;
      font-family:'Noto Sans Thai','Palatino Linotype',serif;
    }
    .code-foot {
      position:absolute;
      bottom:26px;
      left:50%;
      transform:translateX(-50%);
      font-family:ui-monospace,monospace,'Noto Sans Thai',sans-serif;
      font-size:14px;
      letter-spacing:0.22em;
      color:rgba(212,175,55,0.48);
      text-transform:none;
      white-space:nowrap;
    }
    .hl.imp {
      background:none;-webkit-background-clip:border-box;background-clip:border-box;
      color:rgba(247,239,216,0.96);
      filter: drop-shadow(0 3px 12px rgba(0,0,0,0.65));
      text-shadow:none;
    }
    .hl.imp .mono {
      letter-spacing:0.52em;margin-bottom:14px;display:block;color:#fdecc4;
      text-shadow:
        0 0 1px rgba(212,175,55,0.55),
        0 14px 32px rgba(0,0,0,0.55);
      font-family:Cinzel,serif;
      font-weight:700;
      font-size:44px;
    }
    .hl.imp .muted {
      display:block;
      margin-top:4px;
      font-size:20px;
      letter-spacing:0.38em;
      color:rgba(212,175,55,0.62);
      font-family:'Noto Sans Thai','Palatino Linotype',serif;
      font-weight:600;
      text-transform:uppercase;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="grain"></div>
    ${ribbon}
    ${edgeSvg}
    <div class="head">${model.headline}</div>
    ${coinBody}
    <div class="divider"></div>
    <div class="hl ${model.hlWrapClass || ""}">${model.hlHtml}</div>
    ${footerCode}
  </div>
</body>
</html>`;
}

/** @param {CardModel} model */
async function renderCard(page, outfile, model) {
  const html = await htmlDocument(model);
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() =>
    Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 10000)),
    ]),
  );
  await page.waitForSelector(".card", { timeout: 60000 });
  await page.evaluate(() =>
    Promise.all(Array.from(document.images, (img) => img.decode?.() ?? Promise.resolve())),
  );
  await new Promise((r) => setTimeout(r, 80));

  const el = await page.$(".card");
  await el?.screenshot({
    path: outfile,
    omitBackground: false,
    type: "png",
  });
}

async function main() {
  fs.mkdirSync(vipDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
  if (!coinBackFileUrl) {
    console.warn(
      "[vip:art] Keine Münz-Rückseite — erwarte public/hinterseite.jpg oder Paulis_App_Imperium/Muenz_Design/hinterseite.png",
    );
  }

  const nSpecial = SPECIAL_ROWS.length;
  const codes = uniqCodes(nSpecial + 50);

  for (const f of fs.readdirSync(vipDir)) {
    if (f.endsWith(".png")) fs.unlinkSync(path.join(vipDir, f));
  }

  fs.writeFileSync(
    path.join(dataDir, "vip_codes.json"),
    JSON.stringify(codes, null, 2) + "\n",
    "utf8",
  );

  const rows = [];
  const jobs = [];

  for (let i = 0; i < nSpecial; i++) {
    const row = SPECIAL_ROWS[i];
    const code = codes[i];
    jobs.push({
      outfile: path.join(vipDir, row.png),
      model: {
        headline: "VIP ACCESS",
        hlWrapClass: "",
        hlHtml: escHtml(row.line),
        code,
        vipSlotTag: `FAMILY ${i + 1} / 6`,
      },
    });
    rows.push(`${i + 1}\t${code}\t${buildVipUrl(code)}\t${row.png}`);
  }

  const offset = nSpecial;
  for (let n = 1; n <= 50; n++) {
    const code = codes[offset + n - 1];
    const pad = String(n).padStart(2, "0");
    const fname = `VIP-Imperium-${pad}.png`;
    jobs.push({
      outfile: path.join(vipDir, fname),
      model: {
        headline: "",
        hlWrapClass: "imp",
        hlHtml:
          `<span class="mono">${escHtml(pad)}</span>` +
          `<span class="muted">${escHtml("/ 50")}</span>`,
        edge: `${pad}  ·  1–50 SERIES PASS`,
        edgeId: `arc${pad}`,
        gradientId: `g${pad}`,
        ribbon: true,
        code,
        imperialSlot: pad,
        imperialMax: "50",
      },
    });
    rows.push(`${offset + n}\t${code}\t${buildVipUrl(code)}\t${fname}`);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 720,
    deviceScaleFactor: 2,
  });

  try {
    for (const job of jobs) {
      console.log(job.outfile);
      await renderCard(page, job.outfile, job.model);
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(vipDir, "VIP_LINKS.txt"), rows.join("\n") + "\n", "utf8");
  fs.writeFileSync(
    path.join(vipDir, "README.txt"),
      "Pauli VIP: 56 Karten (npm run vip:art) — Münz-Rückseite public/hinterseite.jpg + eingraviert wirkender VIP-QR; VIP_LINKS.txt via npm run vip:gen. Optional: VIP_WITH_QR=1 npm run vip:qr für Münz-QR-PNGs.\n",
    "utf8",
  );

  console.log("OK —", jobs.length, "PNG +", codes.length, "codes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
