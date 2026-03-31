/**
 * Собирает static/og-image.png (1200×630) из корневого screenshot.png
 * для Open Graph / Telegram / VK / X и др.
 */
import sharp from 'sharp';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const shotPath = path.join(root, 'screenshot.png');
const outPath = path.join(root, 'static', 'og-image.png');

const W = 1200;
const H = 630;

const line1 = 'Sakhatype - веб-приложения для проверки скорости печати';
const line2 = 'с элементами культуры и традиций Республики Саха (Якутия)';

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (!existsSync(shotPath)) {
  console.error('Нет файла screenshot.png в корне репозитория.');
  process.exit(1);
}

const overlaySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="ogfade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a0a0c" stop-opacity="0"/>
      <stop offset="0.45" stop-color="#0a0a0c" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#0a0a0c" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#ogfade)"/>
  <text x="64" y="${H - 98}" font-family="Segoe UI,system-ui,sans-serif" font-size="24" font-weight="700" fill="#fafafa">${escapeXml(line1)}</text>
  <text x="64" y="${H - 58}" font-family="Segoe UI,system-ui,sans-serif" font-size="24" font-weight="500" fill="#c4c4cc">${escapeXml(line2)}</text>
</svg>`;

const overlayPng = await sharp(Buffer.from(overlaySvg, 'utf-8')).png().toBuffer();

await sharp(shotPath)
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlayPng, top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log('Записано:', outPath);
