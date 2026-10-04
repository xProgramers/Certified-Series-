"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import type { CardPalette } from "@/db/schema";
import {
  cardDate,
  formatCardDate,
  formatCollectionNumber,
  formatRating,
  formatRuntime,
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

/**
 * The card — one component for series and movies. Its design is locked; the
 * only variations are the states:
 *   in progress   → same card in black & white, no certification
 *   completed     → full colour + CERTIFIED (rating ≥ 5.0) or NOT CERTIFIED (< 5.0)
 * Going from in progress to completed fades the colour back in (see .sc filter).
 */
export function ContentCard({ card, posterSize = "w500", priority, className }: Props) {
  const palette = usePalette(card);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const src = posterUrl(card.posterPath, posterSize);
  const years = formatYears(card.startYear, card.endYear);
  const inProgress = card.status === "in_progress" || card.rating == null;
  const rating = card.rating ?? 0;
  const date = formatCardDate(cardDate(card));
  const longTitle = card.title.length > 16;

  const style = {
    "--accent": palette.accent,
    "--base": palette.base,
    "--glow": palette.glow,
    "--title-size": titleSize(card.title),
    "--reflection-lines": longTitle ? 3 : 4,
  } as CSSProperties;

  const label = inProgress
    ? `${card.title}, em andamento desde ${date}`
    : `${card.title}, nota ${formatRating(rating)} de 10, concluída em ${date}, ${
        card.certification === "not_certified" ? "não certificada" : "certificada"
      }`;
  const stateClass = inProgress ? "is-progress" : card.certification === "not_certified" ? "is-not-certified" : "";

  return (
    <div className={`sc-frame ${className ?? ""}`}>
      <article className={`sc ${card.isFavorite ? "is-favorite" : ""} ${stateClass}`} style={style} aria-label={label}>
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
          <Stamp id={`stamp${uid}`} viewing={card.viewingNumber} inProgress={inProgress} />
        </header>

        <div className="sc-plate">
          {card.genres.length > 0 && (
            <div className="sc-eyebrow">{card.genres.slice(0, 3).join(" · ")}</div>
          )}
          <h3 className="sc-title">{card.title}</h3>
          <div className="sc-meta">
            {years && <span>{years}</span>}
            {card.contentType === "series" && card.seasons ? (
              <span>
                {card.seasons} {card.seasons > 1 ? "Seasons" : "Season"}
              </span>
            ) : null}
            {card.contentType === "movie" && card.runtime ? <span>{formatRuntime(card.runtime)}</span> : null}
          </div>

          <div className="sc-rating">
            <div className="sc-score">
              <b>{inProgress ? "—" : formatRating(rating)}</b>
              <span>/10</span>
            </div>
            <div className="sc-scale" aria-hidden>
              <div className="sc-scale-label">
                <span>Rating</span>
                <span>{inProgress ? "In progress" : ratingWord(rating)}</span>
              </div>
              <div className="sc-bars">
                {Array.from({ length: 10 }, (_, i) => {
                  const fill = inProgress ? 0 : Math.max(0, Math.min(1, rating - i));
                  return (
                    <div className="sc-bar" key={i}>
                      {fill > 0 && <i style={{ width: `${fill * 100}%` }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <blockquote className={`sc-reflection ${card.reflection && !inProgress ? "" : "is-empty"}`}>
            <p>
              {inProgress
                ? "Em andamento. A reflexão vem depois dos créditos."
                : card.reflection || "Sem reflexão — a obra fala por si."}
            </p>
          </blockquote>

          <footer className="sc-foot">
            <span>
              <strong>{card.ownerName}</strong> · {date}
            </span>
            {inProgress ? (
              <span className="sc-mark">
                <MarkGlyph kind="progress" />
                In progress
              </span>
            ) : card.certification === "not_certified" ? (
              <span className="sc-mark">
                <MarkGlyph kind="not-certified" />
                Not certified
              </span>
            ) : (
              <span className="sc-mark">
                <MarkGlyph kind="certified" />
                Certified
              </span>
            )}
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

function Stamp({ id, viewing, inProgress }: { id: string; viewing: number; inProgress: boolean }) {
  const text = inProgress
    ? "IN PROGRESS · IN PROGRESS · "
    : viewing > 1
      ? `REWATCHED · ${viewing}× · COMPLETED · `
      : "COMPLETED · COMPLETED · ";
  return (
    <div className="sc-stamp" aria-label={inProgress ? "In progress" : "Completed"}>
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
          letterSpacing={inProgress ? 1.55 : 2.6}
          style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
        >
          <textPath href={`#${id}`} startOffset="0">
            {text}
          </textPath>
        </text>
        {inProgress ? (
          // An open ring: the work is not finished yet
          <path d="M50 39 A11 11 0 1 1 39 50" fill="none" stroke="#f3eee6" strokeWidth="2.6" strokeLinecap="round" />
        ) : (
          <path d="M39 50.5l7.5 7.5L62 42.5" fill="none" stroke="#f3eee6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

/** The seal glyph: ✓ certified, ✕ not certified, open ring while in progress. */
function MarkGlyph({ kind }: { kind: "certified" | "not-certified" | "progress" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {kind === "certified" && (
        <path d="M5 8.2l2 2 4-4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {kind === "not-certified" && (
        <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      )}
      {kind === "progress" && (
        <path d="M8 4.6 A3.4 3.4 0 1 1 4.6 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  );
}
