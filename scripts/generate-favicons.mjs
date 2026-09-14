#!/usr/bin/env node
/**
 * Generate OneForm app icons as Apple-style squircles (rounded squares).
 * - Squircle PNGs (transparent outside) for login UI + PWA "any" icons
 * - Full-bleed opaque squares for apple-touch / maskable safe-zone
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Continuous-corner radius ≈ Apple iOS icon (~22.37%). */
const APPLE_RADIUS_RATIO = 0.2237;

const ICON_MARK_SVG = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 2C13.059 2 4 11.059 4 22C4 28.125 6.75 33.5 10.8 36.938L8.25 45L16.875 41.063C18.15 41.438 19.575 41.688 24 41.688C34.941 41.688 44 32.629 44 21.688C44 10.747 34.941 2 24 2Z" stroke="#111827" stroke-width="2.75" stroke-linejoin="round"/>
  <path d="M14 16H34" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
  <path d="M14 22H29" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
  <path d="M14 28H23" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
  <path d="M25.5 30.5L28.5 33.5L36 24" stroke="#10D050" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function squirclePlateSvg(size, fill = "#ffffff") {
  const r = Math.round(size * APPLE_RADIUS_RATIO);
  // Soft edge so the rounded-square plate reads clearly on white pages.
  const stroke = Math.max(1, Math.round(size * 0.012));
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${fill}"/>
      <rect x="${stroke / 2}" y="${stroke / 2}" width="${size - stroke}" height="${size - stroke}" rx="${Math.max(0, r - stroke / 2)}" ry="${Math.max(0, r - stroke / 2)}" fill="none" stroke="#E5E7EB" stroke-width="${stroke}"/>
    </svg>`
  );
}

function faviconSvg() {
  const size = 64;
  const r = Math.round(size * APPLE_RADIUS_RATIO);
  const pad = size * 0.16;
  const scale = (size - pad * 2) / 48;
  return `<svg viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#ffffff"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})">
    <path d="M24 2C13.059 2 4 11.059 4 22C4 28.125 6.75 33.5 10.8 36.938L8.25 45L16.875 41.063C18.15 41.438 19.575 41.688 24 41.688C34.941 41.688 44 32.629 44 21.688C44 10.747 34.941 2 24 2Z" stroke="#111827" stroke-width="2.75" stroke-linejoin="round"/>
    <path d="M14 16H34" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M14 22H29" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M14 28H23" stroke="#111827" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M25.5 30.5L28.5 33.5L36 24" stroke="#10D050" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function makeMarkBuffer(innerSize) {
  return sharp(Buffer.from(ICON_MARK_SVG))
    .resize(innerSize, innerSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Rounded-square icon with transparent corners (clear squircle silhouette). */
async function makeSquircleIcon(size, padRatio = 0.16, fill = "#ffffff") {
  const padding = Math.round(size * padRatio);
  const inner = size - padding * 2;
  const mark = await makeMarkBuffer(inner);
  const plate = squirclePlateSvg(size, fill);

  return sharp(plate)
    .composite([{ input: mark, gravity: "center" }])
    .png();
}

/** Full opaque square (for apple-touch / maskable — OS applies its own mask). */
async function makeFullSquareIcon(size, padRatio = 0.16, fill = { r: 255, g: 255, b: 255 }) {
  const padding = Math.round(size * padRatio);
  const inner = size - padding * 2;
  const mark = await makeMarkBuffer(inner);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: fill,
    },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png();
}

async function main() {
  const jobs = [
    // Visible squircle (transparent outside) — login + PWA "any"
    // Low padding so the mark fills the plate (avoids “floating circle” look).
    { fn: () => makeSquircleIcon(180, 0.08), path: "public/apple-touch-icon.png" },
    { fn: () => makeSquircleIcon(192, 0.08), path: "public/pwa-icon-192.png" },
    { fn: () => makeSquircleIcon(512, 0.08), path: "public/pwa-icon-512.png" },
    { fn: () => makeSquircleIcon(512, 0.08), path: "public/favicon-icon.png" },
    { fn: () => makeSquircleIcon(512, 0.08), path: "public/app-icon.png" },
    { fn: () => makeSquircleIcon(64, 0.08), path: "public/favicon.png" },
    { fn: () => makeSquircleIcon(180, 0.08), path: "src/app/apple-icon.png" },
    { fn: () => makeSquircleIcon(512, 0.08), path: "src/app/icon.png" },

    // Maskable: full square + safe padding for adaptive launchers
    { fn: () => makeFullSquareIcon(512, 0.12), path: "public/pwa-maskable-512.png" },
  ];

  for (const { fn, path: out } of jobs) {
    await (await fn()).toFile(join(ROOT, out));
    console.log(`✓ ${out}`);
  }

  writeFileSync(join(ROOT, "public/favicon.svg"), faviconSvg());
  console.log("✓ public/favicon.svg (squircle)");

  writeFileSync(join(ROOT, "public/oneform-icon.svg"), ICON_MARK_SVG);
  console.log("✓ public/oneform-icon.svg");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
