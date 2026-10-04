import type { CardPalette } from "@/db/schema";
import { HOUSE_PALETTE } from "./card-types";

/**
 * Extracts a restrained palette from a poster with plain pixel statistics
 * (no AI). The result is deliberately clamped — the poster tints the card,
 * it never takes over the house style:
 *   accent → mid saturation, fixed lightness (readable on dark)
 *   base   → near-black with a hint of the hue
 *   glow   → muted mid tone for atmosphere
 */
export async function extractPalette(src: string): Promise<CardPalette> {
  const img = await loadImage(src);
  const w = 48;
  const h = 72;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return HOUSE_PALETTE;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const BINS = 36;
  const weight = new Float64Array(BINS);
  const satSum = new Float64Array(BINS);
  const binCount = new Float64Array(BINS);
  const darkHue = new Float64Array(BINS);
  let totalSat = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const [hue, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    count++;
    totalSat += s;
    const bin = Math.min(BINS - 1, Math.floor((hue / 360) * BINS));
    // Ambient (dark) hue — used for the base tint
    if (l < 0.35) darkHue[bin] += s * (0.35 - l);
    // Accent candidates: colourful, neither crushed nor blown out
    if (l < 0.12 || l > 0.92 || s < 0.18) continue;
    const w8 = s * s * (1 - Math.abs(l - 0.55) * 1.4);
    weight[bin] += Math.max(0, w8);
    satSum[bin] += s;
    binCount[bin]++;
  }

  const avgSat = totalSat / Math.max(1, count);
  // Smooth neighbouring bins so a hue spread across two bins still wins
  const score = Array.from(weight, (v, i) => v + 0.5 * (weight[(i + BINS - 1) % BINS] + weight[(i + 1) % BINS]));
  const best = score.indexOf(Math.max(...score));
  if (avgSat < 0.08 || score[best] < count * 0.004) return HOUSE_PALETTE;

  const hue = (best + 0.5) * (360 / BINS);
  const sat = satSum[best] / Math.max(1, binCount[best]);
  const dark = Array.from(darkHue);
  const baseBin = dark.indexOf(Math.max(...dark));
  const baseHue = dark[baseBin] > 0 ? (baseBin + 0.5) * (360 / BINS) : hue;

  const accentSat = clamp(sat, 0.38, 0.62);
  return {
    accent: hslToHex(hue, accentSat, accentLightness(hue)),
    base: hslToHex(baseHue, clamp(avgSat * 0.6, 0.08, 0.28), 0.075),
    glow: hslToHex(hue, clamp(sat * 0.7, 0.25, 0.5), 0.32),
  };
}

/** Perceptual nudge: blues/purples need more lightness to read on black. */
function accentLightness(h: number) {
  if (h >= 200 && h <= 290) return 0.7;
  if (h >= 40 && h <= 70) return 0.62;
  return 0.66;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}
