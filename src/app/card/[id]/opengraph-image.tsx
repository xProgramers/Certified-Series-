import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { formatCollectionNumber, formatRating, HOUSE_PALETTE, type CardData } from "@/lib/card-types";
import { getEntry } from "@/lib/data";
import { findMockByImageKey } from "@/lib/mock-catalog";
import { mockPoster } from "@/lib/mock-poster";
import { clip, workFacts } from "@/lib/share";

/**
 * The picture WhatsApp, Discord, X, iMessage and the like show for a shared
 * card: poster, title and, for a public card, the owner's verdict. Drawn with
 * the site's own faces; 1200×630 is the size every network crops well.
 */
export const alt = "Card do Certified Series";
export const size = { width: 1200, height: 630 };
// JPEG: a photo poster makes a PNG of ~300 KB, past what WhatsApp shows
export const contentType = "image/jpeg";

const fontDir = join(process.cwd(), "assets/fonts");
const fonts = Promise.all([
  readFile(join(fontDir, "InstrumentSerif-Regular.woff")),
  readFile(join(fontDir, "InstrumentSerif-Italic.woff")),
  readFile(join(fontDir, "GeistMono-Regular.woff")),
]);

const PAPER = "#f3eee6";
const GOLD = "#c9b07a";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [card, [serif, serifItalic, mono]] = await Promise.all([getEntry(id).catch(() => null), fonts]);
  const poster = card ? await posterData(card.posterPath) : null;
  const p = card?.palette ?? HOUSE_PALETTE;
  // Previews are fetched signed out: a private card shows only its work
  const pub = !!card?.isPublic;
  const rated = pub && card?.status === "completed" && card.rating != null;
  const certified = card?.certification === "certified";
  const title = card?.title ?? "Certified Series";

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 90px",
          gap: 72,
          color: PAPER,
          fontFamily: "Instrument Serif",
          backgroundColor: p.base,
          backgroundImage: `radial-gradient(circle at 22% 50%, ${p.glow} 0%, ${p.base} 62%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 314,
            height: 471,
            flexShrink: 0,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "#1d1b19",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            border: `1px solid ${rated && certified ? GOLD + "66" : "rgba(243,238,230,0.12)"}`,
          }}
        >
          {poster && (
            <img src={poster} alt="" width={314} height={471} style={{ objectFit: "cover", filter: card?.status === "completed" ? "none" : "grayscale(1)" }} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 19, letterSpacing: 5, textTransform: "uppercase", color: "rgba(243,238,230,0.6)" }}>
            {card && pub ? `Certified Series · N° ${formatCollectionNumber(card.collectionNumber)}` : "Certified Series"}
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: titleSize(title), lineHeight: 0.95, letterSpacing: -1.5 }}>{title}</div>
          {card && (
            <div style={{ display: "flex", marginTop: 18, fontFamily: "Geist Mono", fontSize: 19, letterSpacing: 2, textTransform: "uppercase", color: "rgba(243,238,230,0.55)" }}>
              {workFacts(card).slice(0, 3).join(" · ")}
            </div>
          )}

          {rated && card ? (
            <Verdict card={card} certified={certified} />
          ) : (
            <div style={{ display: "flex", marginTop: 40, fontStyle: "italic", fontSize: 36, color: "rgba(243,238,230,0.8)" }}>
              {card && pub ? "Em andamento" : "Onde assistir e muito mais"}
            </div>
          )}

          {card && pub && (
            <div style={{ display: "flex", marginTop: 34, fontFamily: "Geist Mono", fontSize: 20, letterSpacing: 2, color: "rgba(243,238,230,0.5)" }}>
              @{card.ownerUsername}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Instrument Serif", data: serifItalic, style: "italic", weight: 400 },
        { name: "Geist Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": contentType,
      // The rating or reflection can change; networks keep their own copy anyway
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function Verdict({ card, certified }: { card: CardData; certified: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-end", marginTop: 34, gap: 16 }}>
        <div style={{ display: "flex", fontSize: 112, lineHeight: 0.85 }}>{formatRating(card.rating ?? 0)}</div>
        <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 22, color: "rgba(243,238,230,0.5)", paddingBottom: 6 }}>/ 10</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginLeft: 18,
            marginBottom: 4,
            padding: "8px 16px",
            borderRadius: 999,
            border: `1.5px solid ${certified ? GOLD : "rgba(243,238,230,0.4)"}`,
            fontFamily: "Geist Mono",
            fontSize: 18,
            letterSpacing: 4,
            color: certified ? GOLD : "rgba(243,238,230,0.75)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d={certified ? "M3 8.5l3.2 3.2L13 4.5" : "M4 4l8 8M12 4l-8 8"}
              fill="none"
              stroke={certified ? GOLD : "rgba(243,238,230,0.75)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {certified ? "CERTIFIED" : "NOT CERTIFIED"}
        </div>
      </div>
      {card.reflection && (
        <div style={{ display: "flex", marginTop: 30, fontStyle: "italic", fontSize: 32, lineHeight: 1.25, color: "rgba(243,238,230,0.85)" }}>
          “{clip(card.reflection, 110)}”
        </div>
      )}
    </div>
  );
}

function titleSize(t: string) {
  if (t.length <= 12) return 108;
  if (t.length <= 20) return 92;
  if (t.length <= 32) return 72;
  return 58;
}

/** The poster as a data URL: a TMDB image fetched here, or a sample-catalog SVG drawn here. */
async function posterData(path: string | null) {
  if (!path) return null;
  if (path.startsWith("mock:")) {
    const m = findMockByImageKey(path.slice(5));
    return m ? `data:image/svg+xml;base64,${Buffer.from(mockPoster(m)).toString("base64")}` : null;
  }
  try {
    const res = await fetch(`https://image.tmdb.org/t/p/w500${path}`, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) return null;
    const type = res.headers.get("Content-Type") ?? "image/jpeg";
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}
