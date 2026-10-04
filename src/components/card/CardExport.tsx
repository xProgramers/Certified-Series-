"use client";

import { toPng } from "html-to-image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { formatCollectionNumber, HOUSE_PALETTE, type CardData } from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import { extractPalette } from "@/lib/palette";
import { SeriesCard } from "./SeriesCard";

export type ExportFormat = "card" | "story";

type Job = { card: CardData; format: ExportFormat; resolve: () => void; reject: (e: unknown) => void };

/**
 * Client-side PNG export. The card is re-rendered off-screen at a fixed
 * design size (not a screenshot of the page) and rasterised at 2× with
 * html-to-image:
 *   card  → 1080 × 1728  (the piece alone)
 *   story → 1080 × 1920  (Instagram/Stories composition)
 */
export function useCardExport() {
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const exportCard = useCallback((card: CardData, format: ExportFormat) => {
    setBusy(format);
    return new Promise<void>((resolve, reject) => setJob({ card, format, resolve, reject })).finally(() => {
      setJob(null);
      setBusy(null);
    });
  }, []);

  const stage = job ? <ExportStage job={job} /> : null;
  return { exportCard, busy, stage };
}

function ExportStage({ job }: { job: Job }) {
  const ref = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState<CardData | null>(job.card.palette ? job.card : null);

  // The export must carry the poster palette, even if it was never stored
  useEffect(() => {
    if (card) return;
    const src = posterUrl(job.card.posterPath, "w185");
    (src ? extractPalette(src) : Promise.resolve(HOUSE_PALETTE))
      .catch(() => HOUSE_PALETTE)
      .then((palette) => setCard({ ...job.card, palette }));
  }, [card, job.card]);

  useEffect(() => {
    if (!card) return;
    let cancelled = false;
    (async () => {
      const node = ref.current;
      if (!node) return;
      try {
        await document.fonts.ready;
        await Promise.all(
          Array.from(node.querySelectorAll("img")).map((img) =>
            img.complete && img.naturalWidth ? img.decode().catch(() => {}) : new Promise((r) => {
              img.onload = img.onerror = r;
            }),
          ),
        );
        const size = job.format === "story" ? { width: 540, height: 960 } : { width: 540, height: 864 };
        const opts = { ...size, pixelRatio: 2, cacheBust: false, skipAutoScale: true };
        // First pass warms html-to-image's resource cache (fonts/images) — Safari needs it
        await toPng(node, opts);
        const url = await toPng(node, opts);
        if (cancelled) return;
        const a = document.createElement("a");
        const slug = card.title.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        a.download = `certified-${formatCollectionNumber(card.collectionNumber)}-${slug}${job.format === "story" ? "-story" : ""}.png`;
        a.href = url;
        a.click();
        job.resolve();
      } catch (e) {
        job.reject(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [card, job]);

  if (!card) return null;

  return createPortal(
    <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
      {job.format === "story" ? <StoryLayout card={card} nodeRef={ref} /> : (
        <div ref={ref} className="sc-export" style={{ width: 540, height: 864 }}>
          <SeriesCard card={card} posterSize="w780" priority />
        </div>
      )}
    </div>,
    document.body,
  );
}

function StoryLayout({ card, nodeRef }: { card: CardData; nodeRef: React.RefObject<HTMLDivElement | null> }) {
  const p = card.palette ?? HOUSE_PALETTE;
  const bg = posterUrl(card.posterPath, "w342");
  return (
    <div
      ref={nodeRef}
      className="sc-export-story"
      style={{
        width: 540,
        height: 960,
        position: "relative",
        overflow: "hidden",
        background: p.base,
        color: "#f3eee6",
        fontFamily: "var(--font-sans)",
      } as CSSProperties}
    >
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bg}
          alt=""
          style={{
            position: "absolute",
            inset: -60,
            width: 660,
            height: 1080,
            objectFit: "cover",
            filter: "blur(38px) saturate(1.1)",
            opacity: 0.55,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(420px 300px at 50% 45%, ${p.glow}55, transparent 70%), linear-gradient(180deg, ${p.base}cc 0%, ${p.base}55 30%, ${p.base}66 70%, ${p.base}ee 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 46,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.42em",
          textTransform: "uppercase",
          color: "rgb(243 238 230 / 0.7)",
        }}
      >
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, letterSpacing: "0", textTransform: "none", color: "#f3eee6", marginBottom: 10 }}>
          Certified <span style={{ fontStyle: "italic", opacity: 0.6 }}>Series</span>
        </div>
        Watched · N° {formatCollectionNumber(card.collectionNumber)}
      </div>
      <div style={{ position: "absolute", left: 60, width: 420, top: 148 }}>
        <SeriesCard card={card} posterSize="w780" priority />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.36em",
          textTransform: "uppercase",
          color: "rgb(243 238 230 / 0.6)",
        }}
      >
        @{card.ownerUsername} · my repertoire
      </div>
    </div>
  );
}
