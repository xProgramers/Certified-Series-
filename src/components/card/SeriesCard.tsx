"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import type { CardPalette } from "@/db/schema";
import {
  formatCardDate,
  formatCollectionNumber,
  formatRating,
  formatYears,
  HOUSE_PALETTE,
  type CardData,
} from "@/lib/card-types";
import { posterUrl, type ImageSize } from "@/lib/images";
import { extractPalette } from "@/lib/palette";

type Props = {
  card: CardData;
  posterSize?: ImageSize;
  /** Eager-load the poster (lightbox, export, above the fold). */
  priority?: boolean;
  className?: string;
};

function titleSize(title: string) {
  const n = title.length;
  if (n <= 9) return "13cqw";
  if (n <= 14) return "11.5cqw";
  if (n <= 22) return "9.6cqw";
  if (n <= 32) return "8cqw";
  return "6.8cqw";
}

/** Uses the stored palette; extracts one client-side only when none was saved. */
function usePalette(card: CardData): CardPalette {
  const [palette, setPalette] = useState<CardPalette | null>(card.palette);
  useEffect(() => {
    if (card.palette) return;
    const src = posterUrl(card.posterPath, "w185");
    if (!src) return;
    let alive = true;
    extractPalette(src)
      .then((p) => alive && setPalette(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [card.palette, card.posterPath]);
  return card.palette ?? palette ?? HOUSE_PALETTE;
}

export function SeriesCard({ card, posterSize = "w500", priority, className }: Props) {
  const palette = usePalette(card);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const src = posterUrl(card.posterPath, posterSize);
  const years = formatYears(card.firstAirYear, card.lastAirYear);
  const longTitle = card.title.length > 16;

  const style = {
    "--accent": palette.accent,
    "--base": palette.base,
    "--glow": palette.glow,
    "--title-size": titleSize(card.title),
    "--reflection-lines": longTitle ? 3 : 4,
  } as CSSProperties;

  const label = `${card.title}, nota ${formatRating(card.rating)} de 10, concluída em ${formatCardDate(card.watchedAt)}`;

  return (
    <div className={`sc-frame ${className ?? ""}`}>
      <article className={`sc ${card.isFavorite ? "is-favorite" : ""}`} style={style} aria-label={label}>
        <div className="sc-poster">
          {src ? (
            // Plain <img>: served from our own origin so it can be exported to PNG.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`Pôster de ${card.title}`}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
            />
          ) : (
            <div className="sc-poster-empty" />
          )}
        </div>
        <div className="sc-shade" />
        <div className="sc-atmos" />

        <header className="sc-rail">
          <div className="sc-no">
            <span>N°</span>
            <b>{formatCollectionNumber(card.collectionNumber)}</b>
            <span className="sc-no-rule" />
            {card.isFavorite && (
              <span className="sc-fav" aria-label="Favorita">
                ✦ FAV
              </span>
            )}
          </div>
          <Stamp id={`stamp${uid}`} viewing={card.viewingNumber} />
        </header>

        <div className="sc-plate">
          {card.genres.length > 0 && (
            <div className="sc-eyebrow">{card.genres.slice(0, 3).join(" · ")}</div>
          )}
          <h3 className="sc-title">{card.title}</h3>
          <div className="sc-meta">
            {years && <span>{years}</span>}
            {card.seasons ? (
              <span>
                {card.seasons} {card.seasons > 1 ? "Seasons" : "Season"}
              </span>
            ) : null}
          </div>

          <div className="sc-rating">
            <div className="sc-score">
              <b>{formatRating(card.rating)}</b>
              <span>/10</span>
            </div>
            <div className="sc-scale" aria-hidden>
              <div className="sc-scale-label">
                <span>Rating</span>
                <span>{ratingWord(card.rating)}</span>
              </div>
              <div className="sc-bars">
                {Array.from({ length: 10 }, (_, i) => {
                  const fill = Math.max(0, Math.min(1, card.rating - i));
                  return (
                    <div className="sc-bar" key={i}>
                      {fill > 0 && <i style={{ width: `${fill * 100}%` }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <blockquote className={`sc-reflection ${card.reflection ? "" : "is-empty"}`}>
            <p>{card.reflection || "Sem reflexão — a obra fala por si."}</p>
          </blockquote>

          <footer className="sc-foot">
            <span>
              <strong>{card.ownerName}</strong> · {formatCardDate(card.watchedAt)}
            </span>
            <span className="sc-mark">
              <MarkGlyph />
              Certified
            </span>
          </footer>
        </div>

        <div className="sc-grain" />
        <div className="sc-sheen" />
        <div className="sc-edge" />
      </article>
    </div>
  );
}

function ratingWord(r: number) {
  if (r >= 9.5) return "Masterpiece";
  if (r >= 8.5) return "Essential";
  if (r >= 7.5) return "Great";
  if (r >= 6.5) return "Good";
  if (r >= 5) return "Fair";
  if (r >= 3) return "Weak";
  return "Avoid";
}

function Stamp({ id, viewing }: { id: string; viewing: number }) {
  const text = viewing > 1 ? `REWATCHED · ${viewing}× · COMPLETED · ` : "COMPLETED · COMPLETED · ";
  return (
    <div className="sc-stamp" aria-label="Completed">
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs>
          <path id={id} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <circle cx="50" cy="50" r="48" fill="rgb(10 10 10 / 0.45)" />
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1" opacity=".9" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".55" />
        <text
          fill="currentColor"
          fontSize="9.4"
          letterSpacing="2.6"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
        >
          <textPath href={`#${id}`} startOffset="0">
            {text}
          </textPath>
        </text>
        <path d="M39 50.5l7.5 7.5L62 42.5" fill="none" stroke="#f3eee6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MarkGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 8.2l2 2 4-4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
