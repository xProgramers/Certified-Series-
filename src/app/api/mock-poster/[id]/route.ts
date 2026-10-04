import { findMock, type MockSeries } from "@/lib/mock-catalog";

/**
 * Generates abstract art posters for the sample catalog (no TMDB token).
 * Pure SVG, deterministic per series.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/mock-poster/[id]">) {
  const { id } = await ctx.params;
  const m = findMock(Number(id));
  if (!m) return new Response("Not found", { status: 404 });
  const kind = new URL(req.url).searchParams.get("kind") === "backdrop" ? "backdrop" : "poster";
  const svg = kind === "poster" ? poster(m) : backdrop(m);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function motif(m: MockSeries, w: number, h: number) {
  const [, mid, hi] = m.colors;
  const cx = w / 2;
  const cy = h * 0.4;
  const u = Math.min(w, h);
  switch (m.motif) {
    case "sun":
      return `
        <circle cx="${cx}" cy="${cy}" r="${u * 0.3}" fill="${hi}" opacity=".92"/>
        ${Array.from({ length: 7 }, (_, i) => `<rect x="0" y="${cy + u * 0.05 + i * u * 0.045}" width="${w}" height="${u * 0.022}" fill="${m.colors[0]}"/>`).join("")}
        <rect x="0" y="${cy + u * 0.36}" width="${w}" height="${h}" fill="${mid}" opacity=".35"/>`;
    case "stripes":
      return `
        <g transform="rotate(-24 ${cx} ${cy})">
          ${Array.from({ length: 14 }, (_, i) => `<rect x="${-w + i * u * 0.16}" y="${-h * 0.2}" width="${u * 0.07}" height="${h * 1.4}" fill="${i % 4 === 1 ? hi : mid}" opacity="${i % 4 === 1 ? 0.95 : 0.5}"/>`).join("")}
        </g>`;
    case "orbit":
      return `
        ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${cx}" cy="${cy}" rx="${u * (0.12 + i * 0.07)}" ry="${u * (0.12 + i * 0.07) * 0.42}" fill="none" stroke="${i === 3 ? hi : mid}" stroke-width="${i === 3 ? 2.5 : 1.2}" opacity="${0.9 - i * 0.08}" transform="rotate(-18 ${cx} ${cy})"/>`).join("")}
        <circle cx="${cx}" cy="${cy}" r="${u * 0.075}" fill="${hi}"/>
        <circle cx="${cx + u * 0.3}" cy="${cy - u * 0.12}" r="${u * 0.018}" fill="${hi}"/>`;
    case "grid": {
      const n = 7;
      const s = (u * 0.7) / n;
      const x0 = cx - (s * n) / 2;
      const y0 = cy - (s * n) / 2;
      return Array.from({ length: n * n }, (_, i) => {
        const x = x0 + (i % n) * s;
        const y = y0 + Math.floor(i / n) * s;
        const lit = i === 24;
        return `<rect x="${x + s * 0.12}" y="${y + s * 0.12}" width="${s * 0.76}" height="${s * 0.76}" fill="${lit ? hi : mid}" opacity="${lit ? 1 : 0.25 + ((i * 37) % 10) / 30}"/>`;
      }).join("");
    }
    case "peaks":
      return `
        <circle cx="${cx + u * 0.18}" cy="${cy - u * 0.16}" r="${u * 0.09}" fill="${hi}" opacity=".9"/>
        <polygon points="0,${h * 0.62} ${w * 0.3},${h * 0.34} ${w * 0.55},${h * 0.56} ${w * 0.75},${h * 0.4} ${w},${h * 0.6} ${w},${h} 0,${h}" fill="${mid}" opacity=".55"/>
        <polygon points="0,${h * 0.72} ${w * 0.22},${h * 0.52} ${w * 0.48},${h * 0.7} ${w * 0.7},${h * 0.5} ${w},${h * 0.74} ${w},${h} 0,${h}" fill="${mid}" opacity=".85"/>
        <polygon points="0,${h * 0.82} ${w * 0.4},${h * 0.66} ${w},${h * 0.84} ${w},${h} 0,${h}" fill="${m.colors[0]}"/>`;
    case "waves":
      return Array.from({ length: 9 }, (_, i) => {
        const y = h * 0.28 + i * u * 0.06;
        const a = u * 0.05;
        return `<path d="M0 ${y} C ${w * 0.25} ${y - a}, ${w * 0.25} ${y + a}, ${w * 0.5} ${y} S ${w * 0.75} ${y - a}, ${w} ${y}" fill="none" stroke="${i === 4 ? hi : mid}" stroke-width="${i === 4 ? 3 : 1.5}" opacity="${i === 4 ? 1 : 0.6}"/>`;
      }).join("");
    case "door":
      return `
        <rect x="${cx - u * 0.13}" y="${cy - u * 0.28}" width="${u * 0.26}" height="${u * 0.5}" fill="${hi}" filter="url(#glow)"/>
        <rect x="${cx - u * 0.13}" y="${cy - u * 0.28}" width="${u * 0.26}" height="${u * 0.5}" fill="${hi}"/>
        <polygon points="${cx - u * 0.13},${cy + u * 0.22} ${cx + u * 0.13},${cy + u * 0.22} ${cx + u * 0.5},${h} ${cx - u * 0.5},${h}" fill="${hi}" opacity=".18"/>
        <rect x="${cx - u * 0.018}" y="${cy + u * 0.06}" width="${u * 0.036}" height="${u * 0.16}" rx="${u * 0.018}" fill="${m.colors[0]}"/>
        <circle cx="${cx}" cy="${cy + u * 0.035}" r="${u * 0.026}" fill="${m.colors[0]}"/>`;
    case "eye":
      return `
        <path d="M${cx - u * 0.36} ${cy} Q ${cx} ${cy - u * 0.3} ${cx + u * 0.36} ${cy} Q ${cx} ${cy + u * 0.3} ${cx - u * 0.36} ${cy} Z" fill="none" stroke="${mid}" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="${u * 0.11}" fill="${hi}"/>
        <circle cx="${cx}" cy="${cy}" r="${u * 0.045}" fill="${m.colors[0]}"/>
        <line x1="${cx}" y1="${cy + u * 0.22}" x2="${cx}" y2="${h}" stroke="${mid}" stroke-width="1.2" opacity=".6"/>`;
    case "crown":
      return `
        <polygon points="${cx - u * 0.3},${cy + u * 0.12} ${cx - u * 0.3},${cy - u * 0.14} ${cx - u * 0.15},${cy} ${cx},${cy - u * 0.24} ${cx + u * 0.15},${cy} ${cx + u * 0.3},${cy - u * 0.14} ${cx + u * 0.3},${cy + u * 0.12}" fill="none" stroke="${hi}" stroke-width="3"/>
        <rect x="${cx - u * 0.006}" y="${cy + u * 0.2}" width="${u * 0.012}" height="${h * 0.5}" fill="${mid}"/>
        <rect x="${cx - u * 0.08}" y="${cy + u * 0.26}" width="${u * 0.16}" height="${u * 0.014}" fill="${mid}"/>
        ${Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 97) % w}" cy="${(i * 53) % (h * 0.3)}" r="1.3" fill="${hi}" opacity=".5"/>`).join("")}`;
    case "tower":
      return Array.from({ length: 11 }, (_, i) => {
        const bw = w / 11;
        const bh = h * (0.25 + (((i * 7) % 11) / 11) * 0.4) * (i === 5 ? 1.5 : 1);
        return `<rect x="${i * bw + 2}" y="${h - bh}" width="${bw - 4}" height="${bh}" fill="${i === 5 ? hi : mid}" opacity="${i === 5 ? 0.95 : 0.4 + (i % 3) * 0.15}"/>`;
      }).join("");
  }
}

function defs(m: MockSeries, w: number, h: number) {
  const [bg, mid] = m.colors;
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mid}" stop-opacity=".55"/>
      <stop offset=".55" stop-color="${bg}"/>
      <stop offset="1" stop-color="${bg}"/>
    </linearGradient>
    <radialGradient id="vig" cx=".5" cy=".42" r=".75">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".55"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.min(w, h) * 0.05}"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>`;
}

function poster(m: MockSeries) {
  const w = 500;
  const h = 750;
  const [, , hi] = m.colors;
  const title = esc(m.name.toUpperCase());
  const size = title.length > 16 ? 30 : title.length > 10 ? 38 : 48;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  ${defs(m, w, h)}
  ${motif(m, w, h)}
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <text x="${w / 2}" y="48" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" letter-spacing="6" fill="${hi}" opacity=".75">${esc(m.networks[0].toUpperCase())} ORIGINAL</text>
  <text x="${w / 2}" y="${h - 92}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" letter-spacing="${size * 0.12}" fill="#f4efe6">${title}</text>
  <text x="${w / 2}" y="${h - 56}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="10" letter-spacing="5" fill="#f4efe6" opacity=".55">${m.firstAirYear} · ${m.seasons} ${m.seasons > 1 ? "SEASONS" : "SEASON"}</text>
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}

function backdrop(m: MockSeries) {
  const w = 1280;
  const h = 720;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  ${defs(m, w, h)}
  <g transform="translate(${w * 0.22} 0)">${motif(m, w * 0.6, h)}</g>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)"/>
</svg>`;
}
