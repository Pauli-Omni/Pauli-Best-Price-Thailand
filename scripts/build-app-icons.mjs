/**
 * Builds store-ready PNG app icons from the coin reverse source:
 * — keys out near-black backdrop to transparency
 * — applies a circular matte (isolates round coin art only)
 * — centers on transparent square canvases 1024 (iOS) and 512 (Android)
 *
 * Source (default): Paulis_App_Imperium/hinterseite.png
 *
 * Usage: node scripts/build-app-icons.mjs [path/to/hinterseite.png]
 */
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "app-icons");

const BLACK_MAX = 22;
const MASK_INSET = 0.993;

async function main() {
  const src =
    process.argv[2] || path.join(ROOT, "Paulis_App_Imperium", "hinterseite.png");
  await fs.mkdir(OUT_DIR, { recursive: true });

  const input = sharp(src).ensureAlpha();
  const meta = await input.metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) throw new Error("missing dimensions");

  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf = Buffer.from(data);
  const cw = info.width;
  const ch = info.height;
  const cx = (cw - 1) / 2;
  const cy = (ch - 1) / 2;
  const rMax = Math.min(cw, ch) * 0.5 * MASK_INSET;

  for (let y = 0; y < ch; y++) {
    const dy = y - cy;
    for (let x = 0; x < cw; x++) {
      const dx = x - cx;
      const i = (y * cw + x) << 2;
      const red = buf[i];
      const green = buf[i + 1];
      const blue = buf[i + 2];

      let a = buf[i + 3];
      if (
        red <= BLACK_MAX &&
        green <= BLACK_MAX &&
        blue <= BLACK_MAX &&
        red + green + blue < BLACK_MAX * 2.4
      ) {
        buf[i + 3] = 0;
        a = 0;
      }
      if (a > 0 && dx * dx + dy * dy > rMax * rMax) {
        buf[i + 3] = 0;
      }
    }
  }

  const cut = await sharp(Buffer.from(buf), {
    raw: { width: cw, height: ch, channels: 4 },
  })
    .png()
    .trim()
    .toBuffer();

  const iosPath = path.join(OUT_DIR, "app-icon-ios-1024.png");
  const adrPath = path.join(OUT_DIR, "app-icon-android-512.png");

  await sharp(cut)
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(iosPath);

  await sharp(cut)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(adrPath);

  console.log("Wrote", iosPath);
  console.log("Wrote", adrPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
