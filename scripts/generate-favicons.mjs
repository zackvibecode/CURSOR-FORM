#!/usr/bin/env node
/**
 * Generate favicons: OneForm icon mark on a white circular background.
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

function faviconSvg() {
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="32" fill="#ffffff"/>
  <g transform="translate(8 8)">
    <path d="M24 2C13.059 2 4 11.059 4 22C4 28.125 6.75 33.5 10.8 36.938L8.25 45L16.875 41.063C18.15 41.438 19.575 41.688 24 41.688C34.941 41.688 44 32.629 44 21.688C44 10.747 34.941 2 24 2Z" stroke="#111827" stroke-width="2.75" stroke-linejoin="round"/>
    <path d="M14 16H34" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M14 22H29" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M14 28H23" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M25.5 30.5L28.5 33.5L36 24" stroke="#10D050" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function makeCircularFavicon(size) {
  const padding = Math.round(size * 0.14);
  const inner = size - padding * 2;

  const icon = await sharp(Buffer.from(ICON_MARK_SVG))
    .resize(inner, inner, { fit: "contain" })
    .png()
    .toBuffer();

  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/>
    </svg>`
  );

  return sharp(circleSvg).composite([{ input: icon, gravity: "center" }]).png();
}

async function main() {
  const outputs = [
    { size: 32, path: "public/favicon.png" },
    { size: 180, path: "public/apple-touch-icon.png" },
    { size: 512, path: "public/favicon-icon.png" },
    { size: 512, path: "src/app/icon.png" },
    { size: 180, path: "src/app/apple-icon.png" },
  ];

  for (const { size, path: out } of outputs) {
    await (await makeCircularFavicon(size)).toFile(join(ROOT, out));
    console.log(`✓ ${out} (${size}px)`);
  }

  writeFileSync(join(ROOT, "public/favicon.svg"), faviconSvg());
  console.log("✓ public/favicon.svg");

  writeFileSync(join(ROOT, "public/oneform-icon.svg"), ICON_MARK_SVG);
  console.log("✓ public/oneform-icon.svg");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
