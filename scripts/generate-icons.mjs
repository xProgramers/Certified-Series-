// Gera os ícones PNG do app instalável (PWA) a partir da LogoMark.
// Uso: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const INK = "#0a0a0b";
const GOLD = "#c9b07a";

// `scale` = fração do lado ocupada pela marca (ícones maskable precisam de margem de segurança).
function svg(size, scale) {
  const mark = size * scale;
  const offset = (size - mark) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <g transform="translate(${offset} ${offset}) scale(${mark / 24})" fill="none" stroke="${GOLD}">
    <circle cx="12" cy="12" r="10.5" stroke-width="1.2"/>
    <circle cx="12" cy="12" r="6.5" stroke-width=".8" opacity=".5"/>
    <path d="M8.6 12.2l2.4 2.4 4.4-4.8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const outputs = [
  ["public/icons/icon-192.png", 192, 0.72],
  ["public/icons/icon-512.png", 512, 0.72],
  ["public/icons/maskable-512.png", 512, 0.56],
  ["src/app/apple-icon.png", 180, 0.72],
];

await mkdir("public/icons", { recursive: true });
for (const [file, size, scale] of outputs) {
  await sharp(Buffer.from(svg(size, scale))).png().toFile(file);
  console.log(file);
}
