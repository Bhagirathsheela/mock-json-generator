// Rasterize icons/icon.svg into the exact PNG sizes Chrome expects.
//
// Key correctness guarantees:
//  - We render the SVG once at high resolution, then downscale with a
//    high-quality kernel for crisp small icons.
//  - Each output is forced to EXACT integer dimensions (N x N) with no
//    extra padding, so a stray sub-pixel can't push 128 -> 129 and make
//    Chrome reject or blur the icon.
//  - After writing, we read the PNG metadata back and assert the size.
//
// Run:  npm run icons     (i.e. node scripts/generate-icons.mjs)

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "icons");
const svgPath = join(iconsDir, "icon.svg");

const SIZES = [16, 32, 48, 128, 256];
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const svg = readFileSync(svgPath);

// density 384 -> a 128pt SVG renders at 512px (128 * 384/96).
const master = await sharp(svg, { density: 384 })
  .resize(512, 512, { fit: "contain", background: TRANSPARENT })
  .png()
  .toBuffer();

let failed = false;
for (const size of SIZES) {
  const outPath = join(iconsDir, `icon-${size}.png`);
  await sharp(master)
    .resize(size, size, { fit: "contain", kernel: "lanczos3", background: TRANSPARENT })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  const ok = meta.width === size && meta.height === size;
  if (!ok) failed = true;
  console.log(`${ok ? "✓" : "✗"} icon-${size}.png  →  ${meta.width}x${meta.height}`);
}

if (failed) {
  console.error("\nOne or more icons have incorrect dimensions.");
  process.exit(1);
}
console.log("\nAll icons generated at exact dimensions.");
