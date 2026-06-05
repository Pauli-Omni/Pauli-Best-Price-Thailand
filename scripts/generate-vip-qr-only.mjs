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
const baseUrl = process.env.OSG_VIP_BASE_URL || "http://localhost:3000/index.html";
const EXPECTED = 56;
const CANVAS_SIZE = 1200;
const QR_AREA = 1040;
const VIP_BOX_W = 430;
const VIP_BOX_H = 156;
const METAL_PRESETS = {
  champagne_gold: "#c7a45a",
  antique_gold: "#b8933f",
  deep_gold: "#96732e",
  silver: "#a8adb4",
  bronze: "#cd7f32",
};

const GROUP_STYLES = {
  friends_core: {
    key: "friends_core",
    label: "Friends 01-30",
    qrColor: METAL_PRESETS.bronze,
    vipColor: "#d49a4e",
    frameColor: "#8e5a20",
    vipShadow: "#4f2f11",
    vipHighlight: "#ffe4bf",
    slots: "01-30",
  },
  influencer: {
    key: "influencer",
    label: "Influencer 31-40",
    qrColor: METAL_PRESETS.silver,
    vipColor: "#c2c8cf",
    frameColor: "#727980",
    vipShadow: "#3f454b",
    vipHighlight: "#f3f5f8",
    slots: "31-40",
  },
  vip_influencer: {
    key: "vip_influencer",
    label: "VIP Influencer 41-50",
    qrColor: METAL_PRESETS.deep_gold,
    vipColor: METAL_PRESETS.antique_gold,
    frameColor: "#7b5b1d",
    vipShadow: "#3d2a08",
    vipHighlight: "#fff7dd",
    slots: "41-50",
  },
  family_special: {
    key: "family_special",
    label: "Family 51-54",
    qrColor: "#2f9e44",
    vipColor: "#3bb25a",
    frameColor: "#1d6f31",
    vipShadow: "#15431f",
    vipHighlight: "#d8ffe1",
    slots: "51-54",
  },
  owners: {
    key: "owners",
    label: "Wii + Pauli 55-56",
    qrColor: "#7b5cff",
    vipColor: "#9b7bff",
    frameColor: "#4d35c7",
    vipShadow: "#2d1f75",
    vipHighlight: "#eadfff",
    slots: "55-56",
  },
};

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

function loadCodes() {
  const raw = JSON.parse(fs.readFileSync(codesPath, "utf8"));
  if (!Array.isArray(raw) || raw.length !== EXPECTED) {
    throw new Error(`Expected ${EXPECTED} codes in data/vip_codes.json`);
  }
  return raw;
}

function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function qrRectsSvg(url, qrAreaPx) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const marginModules = 2;
  const totalModules = count + marginModules * 2;
  const unit = qrAreaPx / totalModules;
  const rects = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!qr.modules.get(c, r)) continue;
      const x = (c + marginModules) * unit;
      const y = (r + marginModules) * unit;
      rects.push(
        `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${unit.toFixed(3)}" height="${unit.toFixed(3)}" />`,
      );
    }
  }
  return rects.join("");
}

function groupStyleForSlot(slot) {
  if (slot >= 1 && slot <= 30) return GROUP_STYLES.friends_core;
  if (slot >= 31 && slot <= 40) return GROUP_STYLES.influencer;
  if (slot >= 41 && slot <= 50) return GROUP_STYLES.vip_influencer;
  if (slot >= 51 && slot <= 54) return GROUP_STYLES.family_special;
  return GROUP_STYLES.owners;
}

function buildEditableSvg(url, style, slot, code) {
  const qrLeft = Math.round((CANVAS_SIZE - QR_AREA) / 2);
  const qrTop = Math.round((CANVAS_SIZE - QR_AREA) / 2);
  const vipBoxX = Math.round((CANVAS_SIZE - VIP_BOX_W) / 2);
  const vipBoxY = Math.round((CANVAS_SIZE - VIP_BOX_H) / 2);
  const rects = qrRectsSvg(url, QR_AREA);
  const tag = `${String(slot).padStart(2, "0")} ${code}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
<!-- VIP Slot ${tag} | Group ${style.key} -->
<defs>
  <filter id="vip-relief" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2.2" stdDeviation="1.1" flood-color="${style.vipShadow}" flood-opacity="0.45"/>
    <feDropShadow dx="0" dy="-1.1" stdDeviation="0.8" flood-color="${style.vipHighlight}" flood-opacity="0.44"/>
  </filter>
</defs>
<rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#ffffff"/>
<rect x="${qrLeft - 4}" y="${qrTop - 4}" width="${QR_AREA + 8}" height="${QR_AREA + 8}" rx="18" fill="none" stroke="${style.frameColor}" stroke-width="3"/>
<g id="qr" transform="translate(${qrLeft},${qrTop})" fill="${style.qrColor}">
${rects}
</g>
<rect id="vip-box-bg" x="${vipBoxX}" y="${vipBoxY}" width="${VIP_BOX_W}" height="${VIP_BOX_H}" rx="18" fill="#ffffff"/>
<text id="vip-text" x="${CANVAS_SIZE / 2}" y="${Math.round(CANVAS_SIZE * 0.503)}" text-anchor="middle" dominant-baseline="middle"
  font-family="Didot, 'Times New Roman', Georgia, serif" font-size="132" font-weight="700" letter-spacing="8" fill="${style.vipColor}" filter="url(#vip-relief)">VIP</text>
<text id="vip-text-shine" x="${CANVAS_SIZE / 2}" y="${Math.round(CANVAS_SIZE * 0.503) - 2}" text-anchor="middle" dominant-baseline="middle"
  font-family="Didot, 'Times New Roman', Georgia, serif" font-size="132" font-weight="700" letter-spacing="8" fill="${style.vipHighlight}" opacity="0.28">VIP</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(vipDir, { recursive: true });
  const codes = loadCodes();

  // Wipe previous files in target folder.
  for (const f of fs.readdirSync(vipDir)) {
    fs.unlinkSync(path.join(vipDir, f));
  }

  const rows = [];
  for (let i = 0; i < codes.length; i++) {
    const n = i + 1;
    const code = codes[i];
    const url = buildVipUrl(code);
    const style = groupStyleForSlot(n);
    const stem = `vip-qr-${String(n).padStart(2, "0")}-${code}`;
    const svgFile = `${stem}.svg`;
    const pngFile = `${stem}.png`;
    const svgOut = path.join(vipDir, svgFile);
    const pngOut = path.join(vipDir, pngFile);

    const svg = buildEditableSvg(url, style, n, code);
    fs.writeFileSync(svgOut, svg, "utf8");
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngOut);

    rows.push(`${n}\t${code}\t${style.key}\t${url}\t${pngFile}\t${svgFile}`);
  }

  fs.writeFileSync(path.join(vipDir, "VIP_LINKS.txt"), rows.join("\n") + "\n", "utf8");
  fs.writeFileSync(
    path.join(vipDir, "README.txt"),
    "56 QR files for editing: PNG + editable SVG. Color groups by VIP role (owners/family/friends/influencers), including gold, silver, bronze, green, and purple palettes. Columns: Nr | Code | Group | URL | PNG | SVG.\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(vipDir, "VIP_COLOR_PRESETS.txt"),
    [
      "Metal presets:",
      `- champagne_gold = ${METAL_PRESETS.champagne_gold}`,
      `- antique_gold   = ${METAL_PRESETS.antique_gold}`,
      `- deep_gold      = ${METAL_PRESETS.deep_gold}`,
      `- silver         = ${METAL_PRESETS.silver}`,
      `- bronze         = ${METAL_PRESETS.bronze}`,
      "",
      "Group palettes in current files:",
      `- ${GROUP_STYLES.friends_core.label} (${GROUP_STYLES.friends_core.slots}): QR ${GROUP_STYLES.friends_core.qrColor}, VIP ${GROUP_STYLES.friends_core.vipColor}`,
      `- ${GROUP_STYLES.influencer.label} (${GROUP_STYLES.influencer.slots}): QR ${GROUP_STYLES.influencer.qrColor}, VIP ${GROUP_STYLES.influencer.vipColor}`,
      `- ${GROUP_STYLES.vip_influencer.label} (${GROUP_STYLES.vip_influencer.slots}): QR ${GROUP_STYLES.vip_influencer.qrColor}, VIP ${GROUP_STYLES.vip_influencer.vipColor}`,
      `- ${GROUP_STYLES.family_special.label} (${GROUP_STYLES.family_special.slots}): QR ${GROUP_STYLES.family_special.qrColor}, VIP ${GROUP_STYLES.family_special.vipColor}`,
      `- ${GROUP_STYLES.owners.label} (${GROUP_STYLES.owners.slots}): QR ${GROUP_STYLES.owners.qrColor}, VIP ${GROUP_STYLES.owners.vipColor}`,
      "",
      "To change color in any SVG quickly:",
      "- Replace fill color in element id=\"qr\" and/or id=\"vip-text\"",
      "- Optionally tweak opacity in id=\"vip-text-shine\"",
      "",
    ].join("\n"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(vipDir, "VIP_GROUP_COLORS.txt"),
    [
      "VIP groups and color policy",
      "",
      `friends_core (01-30): bronze theme (${GROUP_STYLES.friends_core.qrColor})`,
      `influencer (31-40): silver theme (${GROUP_STYLES.influencer.qrColor})`,
      `vip_influencer (41-50): gold theme (${GROUP_STYLES.vip_influencer.qrColor})`,
      `family_special (51-54): green theme (${GROUP_STYLES.family_special.qrColor})`,
      `owners wii+pauli (55-56): purple theme (${GROUP_STYLES.owners.qrColor})`,
      "",
      "Legend in filenames remains numeric for stable ordering.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(`OK - Generated ${codes.length} pure QR PNG files in ${vipDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

