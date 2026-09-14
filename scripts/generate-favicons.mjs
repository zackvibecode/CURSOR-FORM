#!/usr/bin/env node
/**
 * Generate OneForm app icons as Apple-style squares.
 * Full-bleed square PNGs (iOS/Android apply their own squircle/circle mask).
 * Safe-zone padding keeps the mark readable when masked.
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ICON_MARK_SVG = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 2C13.059 2 4 11.059 4 22C4 28.125 6.75 33.5 10.8 36.938L8.25 45L16.875 41.063C18.15 41.438 19.575 41.688 24 41.688C34.941 41.688 44 32.629 44 21.688C44 10.747 34.941 2 24 2Z" stroke="#111827" stroke-width="2.75" stroke-linejoin="round"/>
  <path d="M14 16H34" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
  <path d="M14 22H29" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
  <path d="M14 28H23" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
  <path d="M25.5 30.5L28.5 33.5L36 24" stroke="#10D050" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** ~Apple continuous-corner radius (~22% of side). Used only for SVG favicon preview. */
function roundedSquareSvg(size, radiusRatio = 0.2237) {
  const r = Math.round(size * radiusRatio);
  return `<svg viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#ffffff"/>
  <g transform="translate(${size * 0.156} ${size * 0.156}) scale(${(size * 0.688) / 48})">
    <path d="M24 2C13.059 2 4 11.059 4 22C4 28.125 6.75 33.5 10.8 36.938L8.25 45L16.875 41.063C18.15 41.438 19.575 41.688 24 41.688C34.941 41.688 44 32.629 44 21.688C44 10.747 34.941 2 24 2Z" stroke="#111827" stroke-width="2.75" stroke-linejoin="round"/>
    <path d="M14 16H34" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M14 22H29" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M14 28H23" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M25.5 30.5L28.5 33.5L36 24" stroke="#10D050" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

/**
 * Square full-bleed icon. Padding keeps mark inside maskable / Apple safe zone.
 * @param {number} size
 * @param {number} padRatio 0.14–0.18 typical for "any"; ~0.2 for maskable safe zone
 */
async function makeSquareAppIcon(size, padRatio = 0.16) {
  const padding = Math.round(size * padRatio);
  const inner = size - padding * 2;

  const icon = await sharp(Buffer.from(ICON_MARK_SVG))
    .resize(inner, inner, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: icon, gravity: "center" }])
    .png();
}

async function main() {
  const outputs = [
    { size: 32, path: "public/favicon.png", pad: 0.14 },
    { size: 180, path: "public/apple-touch-icon.png", pad: 0.15 },
    { size: 192, path: "public/pwa-icon-192.png", pad: 0.15 },
    { size: 512, path: "public/favicon-icon.png", pad: 0.15 },
    { size: 512, path: "public/pwa-icon-512.png", pad: 0.15 },
    { size: 512, path: "public/pwa-maskable-512.png", pad: 0.2 },
    { size: 512, path: "src/app/icon.png", pad: 0.15 },
    { size: 180, path: "src/app/apple-icon.png", pad: 0.15 },
  ];

  for (const { size, path: out, pad } of outputs) {
    await (await makeSquareAppIcon(size, pad)).toFile(join(ROOT, out));
    console.log(`✓ ${out} (${size}×${size} square)`);
  }

  writeFileSync(join(ROOT, "public/favicon.svg"), roundedSquareSvg(64));
  console.log("✓ public/favicon.svg (rounded square)");

  writeFileSync(join(ROOT, "public/oneform-icon.svg"), ICON_MARK_SVG);
  console.log("✓ public/oneform-icon.svg");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
