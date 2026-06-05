/**
 * Neu-Generierung aller 56 VIP-Münzen (runde, transparente PNGs) im Ordner:
 *   Desktop/VIP Zugang
 *
 * Design:
 * - Basis aus Hinterseite.png / hinterseite.png (mit Kreis-Alpha, kein schwarzer Hintergrund)
 * - Zentrum: geprägter, goldener QR-Code ersetzt das Symbol vollständig
 * - Ringtext oben/unten + Sterne gemäß Vorgaben
 * - 6 Spezialmünzen (Familie) + 50 nummerierte Kundenmünzen
 *
 * Usage:
 *   OSG_VIP_BASE_URL="https://your-domain.example/index.html" npm run vip:gen
 */
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const vipDir = path.join(root, "VIP Zugang");
const dataDir = path.join(root, "data");
const codesPath = path.join(dataDir, "vip_codes.json");
const CODE_COUNT = 56;

const BOTTOM_RING_TEXT = "เพาลี่เปรียบเทียบราคาสำหรับประเทศไทย";

const SPECIAL_LABELS = [
  "คุณแม่",
  "พี่ชาย",
  "วนิดา",
  "รำพรรณ",
  "ครอบครัว 1",
  "ครอบครัว 2",
];

function resolveCoinBackPath() {
  const candidates = [
    path.join(root, "public", "Hinterseite.png"),
    path.join(root, "public", "hinterseite.png"),
    path.join(root, "public", "hinterseite.jpg"),
    path.join(root, "Paulis_App_Imperium", "Muenz_Design", "Hinterseite.png"),
    path.join(root, "Paulis_App_Imperium", "Muenz_Design", "hinterseite.png"),
    path.join(root, "qr beispielmuenze.jpeg"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return "";
}

const COIN_BACK = resolveCoinBackPath();
const baseUrl = process.env.OSG_VIP_BASE_URL || "http://localhost:3000/index.html";

function randCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "PF-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
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

function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function labelForIndex(i) {
  if (i < SPECIAL_LABELS.length) return SPECIAL_LABELS[i];
  return `VIP ${String(i - SPECIAL_LABELS.length + 1)}`;
}

function loadOrCreateCodes() {
  try {
    const raw = JSON.parse(fs.readFileSync(codesPath, "utf8"));
    const arr = Array.isArray(raw) ? raw : [];
    if (arr.length === CODE_COUNT) return arr;
  } catch {
    // noop
  }
  const codes = uniqCodes(CODE_COUNT);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(codesPath, JSON.stringify(codes, null, 2) + "\n", "utf8");
  return codes;
}

async function maskedColorLayer(size, color, maskBuf, blur = 0) {
  let mask = sharp(maskBuf).ensureAlpha();
  if (blur > 0) mask = mask.blur(blur);
  const preparedMask = await mask.png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color,
    },
  })
    .composite([{ input: preparedMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function maskedColorLayerRect(width, height, color, maskBuf, blur = 0) {
  let mask = sharp(maskBuf).ensureAlpha();
  if (blur > 0) mask = mask.blur(blur);
  const preparedMask = await mask.png().toBuffer();
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: color,
    },
  })
    .composite([{ input: preparedMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

function metalPaletteForIndex(i) {
  if (i === 0) {
    return {
      baseLight: "#f6f6f4",
      baseMid: "#cbcbca",
      baseDark: "#7f8084",
      cutDark: "#57585f",
      cutLight: "#f7f7f5",
      textDark: "#55575d",
      textLight: "#f1f2f0",
    };
  }
  if (i === 2) {
    return {
      baseLight: "#f3d2be",
      baseMid: "#c99a79",
      baseDark: "#83563e",
      cutDark: "#6f452f",
      cutLight: "#ffd9c4",
      textDark: "#6f452f",
      textLight: "#ffd9c4",
    };
  }
  return {
    baseLight: "#f7e4ab",
    baseMid: "#d4af55",
    baseDark: "#87601f",
    cutDark: "#5e4214",
    cutLight: "#ffeebf",
    textDark: "#5e4214",
    textLight: "#fff0bf",
  };
}

function ringTextMaskSvg(size, topText) {
  const cx = size / 2;
  const cy = size / 2;
  const rText = Math.round(size * 0.42);
  const topStartX = cx - rText;
  const topEndX = cx + rText;
  const y = Math.round(size * 0.5);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <path id="topArc" d="M ${topStartX} ${y} A ${rText} ${rText} 0 0 1 ${topEndX} ${y}" />
  <path id="botArc" d="M ${topEndX} ${y} A ${rText} ${rText} 0 0 1 ${topStartX} ${y}" />
</defs>
<text font-family="Noto Sans Thai, Thonburi, Tahoma, sans-serif" font-size="${Math.round(size * 0.066)}" letter-spacing="1.6" fill="#ffffff">
  <textPath href="#topArc" startOffset="50%" text-anchor="middle">${escXml(topText)}</textPath>
</text>
<text font-family="Noto Sans Thai, Thonburi, Tahoma, sans-serif" font-size="${Math.round(size * 0.067)}" letter-spacing="1.9" fill="#ffffff">
  <textPath href="#botArc" startOffset="50%" text-anchor="middle">${escXml(BOTTOM_RING_TEXT)}</textPath>
</text>
</svg>`;
}

function centerDecorationSvg(size, palette) {
  const c = size / 2;
  const r = Math.round(size * 0.495);
  const rInner = Math.round(size * 0.42);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="ctrFill" cx="35%" cy="30%" r="76%">
    <stop offset="0%" stop-color="${palette.baseLight}"/>
    <stop offset="58%" stop-color="${palette.baseMid}"/>
    <stop offset="100%" stop-color="${palette.baseDark}"/>
  </radialGradient>
  <linearGradient id="ctrEdge" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${palette.textLight}"/>
    <stop offset="100%" stop-color="${palette.textDark}"/>
  </linearGradient>
</defs>
<circle cx="${c}" cy="${c}" r="${r}" fill="url(#ctrFill)"/>
<circle cx="${c}" cy="${c}" r="${rInner}" fill="none" stroke="url(#ctrEdge)" stroke-width="3"/>
<path d="M ${Math.round(size * 0.27)} ${Math.round(size * 0.37)} Q ${Math.round(size * 0.31)} ${Math.round(size * 0.33)} ${Math.round(size * 0.35)} ${Math.round(size * 0.37)}" fill="none" stroke="${palette.textDark}" stroke-width="5" stroke-linecap="round"/>
<path d="M ${Math.round(size * 0.73)} ${Math.round(size * 0.37)} Q ${Math.round(size * 0.69)} ${Math.round(size * 0.33)} ${Math.round(size * 0.65)} ${Math.round(size * 0.37)}" fill="none" stroke="${palette.textDark}" stroke-width="5" stroke-linecap="round"/>
<path d="M ${Math.round(size * 0.27)} ${Math.round(size * 0.63)} Q ${Math.round(size * 0.31)} ${Math.round(size * 0.67)} ${Math.round(size * 0.35)} ${Math.round(size * 0.63)}" fill="none" stroke="${palette.textDark}" stroke-width="5" stroke-linecap="round"/>
<path d="M ${Math.round(size * 0.73)} ${Math.round(size * 0.63)} Q ${Math.round(size * 0.69)} ${Math.round(size * 0.67)} ${Math.round(size * 0.65)} ${Math.round(size * 0.63)}" fill="none" stroke="${palette.textDark}" stroke-width="5" stroke-linecap="round"/>
</svg>`;
}

async function renderCoin(outPath, url, labelText, index) {
  const size = 1200;
  const qrSize = 360;
  const centerDiameter = 560;
  const palette = metalPaletteForIndex(index);

  const qrMaskBuf = await QRCode.toBuffer(url, {
    type: "png",
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#ffffffff", light: "#00000000" },
  });

  if (!COIN_BACK) {
    await QRCode.toFile(outPath, url, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#8f6a21", light: "#00000000" },
    });
    return;
  }

  const baseRaw = await sharp(COIN_BACK)
    .resize(size, size, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .toBuffer();

  const coinMaskSvg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
<circle cx="${size / 2}" cy="${size / 2}" r="${Math.round(size * 0.495)}" fill="#fff"/>
</svg>`;
  const coinMaskBuf = await sharp(Buffer.from(coinMaskSvg)).png().toBuffer();
  const coinBase = await sharp(baseRaw)
    .composite([{ input: coinMaskBuf, blend: "dest-in" }])
    .png()
    .toBuffer();

  const centerLeft = Math.round((size - centerDiameter) / 2);
  const centerTop = Math.round((size - centerDiameter) / 2);
  const centerPatchSvg = centerDecorationSvg(centerDiameter, palette);
  const centerPatch = await sharp(Buffer.from(centerPatchSvg)).png().toBuffer();

  const qrDark = await maskedColorLayer(qrSize, `${palette.cutDark}f2`, qrMaskBuf, 0);
  const qrShadow = await maskedColorLayer(qrSize, `${palette.cutDark}bf`, qrMaskBuf, 0.9);
  const qrHighlight = await maskedColorLayer(qrSize, `${palette.cutLight}7f`, qrMaskBuf, 0.7);

  const qrLeft = Math.round((size - qrSize) / 2);
  const qrTop = Math.round((size - qrSize) / 2) - 54;

  const qrFrameSize = qrSize + 30;
  const qrFrameLeft = Math.round((size - qrFrameSize) / 2);
  const qrFrameTop = Math.round((size - qrFrameSize) / 2) - 54;
  const qrFrameSvg = `<svg width="${qrFrameSize}" height="${qrFrameSize}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="vipFrame" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${palette.textLight}"/>
    <stop offset="100%" stop-color="${palette.textDark}"/>
  </linearGradient>
</defs>
<rect x="1.5" y="1.5" width="${qrFrameSize - 3}" height="${qrFrameSize - 3}" rx="11" fill="none" stroke="url(#vipFrame)" stroke-width="3"/>
</svg>`;
  const qrFrame = await sharp(Buffer.from(qrFrameSvg)).png().toBuffer();

  const vipTextW = Math.round(qrSize * 0.52);
  const vipTextH = Math.round(qrSize * 0.18);
  const vipTextLeft = Math.round((size - vipTextW) / 2);
  const vipTextTop = qrTop + Math.round((qrSize - vipTextH) / 2);
  const vipTextMaskSvg = `<svg width="${vipTextW}" height="${vipTextH}" xmlns="http://www.w3.org/2000/svg">
<text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle" font-family="Cinzel, Noto Sans Thai, serif" font-size="${Math.round(vipTextH * 0.76)}" font-weight="700" letter-spacing="2.6" fill="#ffffff">VIP</text>
</svg>`;
  const vipTextMask = await sharp(Buffer.from(vipTextMaskSvg)).png().toBuffer();
  const vipReliefBase = await maskedColorLayerRect(
    vipTextW,
    vipTextH,
    `${palette.baseMid}ff`,
    vipTextMask,
    0.3,
  );
  const vipReliefShadow = await maskedColorLayerRect(
    vipTextW,
    vipTextH,
    `${palette.cutDark}be`,
    vipTextMask,
    1.05,
  );
  const vipReliefHighlight = await maskedColorLayerRect(
    vipTextW,
    vipTextH,
    `${palette.cutLight}95`,
    vipTextMask,
    0.9,
  );

  const textMask = await sharp(Buffer.from(ringTextMaskSvg(size, labelText))).png().toBuffer();
  const txtDark = await maskedColorLayer(size, `${palette.textDark}d5`, textMask, 0.55);
  const txtLight = await maskedColorLayer(size, `${palette.textLight}9a`, textMask, 0.4);

  await sharp(coinBase)
    .composite([
      { input: centerPatch, left: centerLeft, top: centerTop },
      { input: qrFrame, left: qrFrameLeft, top: qrFrameTop },
      { input: qrShadow, left: qrLeft + 2, top: qrTop + 2 },
      { input: qrHighlight, left: qrLeft - 2, top: qrTop - 2 },
      { input: qrDark, left: qrLeft, top: qrTop },
      { input: vipReliefShadow, left: vipTextLeft + 2, top: vipTextTop + 2 },
      { input: vipReliefHighlight, left: vipTextLeft - 1, top: vipTextTop - 1 },
      { input: vipReliefBase, left: vipTextLeft, top: vipTextTop },
      { input: txtDark, left: 1, top: 1 },
      { input: txtLight, left: -1, top: -1 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  fs.mkdirSync(vipDir, { recursive: true });
  const codes = loadOrCreateCodes();

  for (const f of fs.readdirSync(vipDir)) {
    if (f.endsWith(".png") || f.endsWith(".txt")) {
      fs.unlinkSync(path.join(vipDir, f));
    }
  }

  if (!COIN_BACK) {
    console.warn("[vip:gen] Kein Münz-Asset gefunden. Nutze Fallback-QR-Ausgabe.");
  }

  const rows = [];
  for (let i = 0; i < codes.length; i++) {
    const slot = i + 1;
    const code = codes[i];
    const url = buildVipUrl(code);
    const label = labelForIndex(i);
    const file = `vip-qr-${String(slot).padStart(2, "0")}-${code}.png`;
    await renderCoin(path.join(vipDir, file), url, label, i);
    rows.push(`${slot}\t${code}\t${url}\t${label}\t${file}`);
  }

  fs.writeFileSync(path.join(vipDir, "VIP_LINKS.txt"), rows.join("\n") + "\n", "utf8");
  fs.writeFileSync(
    path.join(vipDir, "README.txt"),
    "56 runde VIP-Muenzen (transparent PNG): 6 Familie + 50 Kunden, gold gepraegter QR in der Mitte. Spalten VIP_LINKS: Nr | Code | URL | Label | PNG.\n",
    "utf8",
  );

  console.log(`OK - ${codes.length} VIP-Muenzen erstellt in: ${vipDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
