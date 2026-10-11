"use client";

import type { CSSProperties } from "react";
import {
  cardDate,
  formatCardDate,
  formatCollectionNumber,
  formatRating,
  formatRuntime,
  formatYears,
  seasonProgress,
  TYPE_LABEL,
  type CardData,
} from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import { usePalette } from "./card/ContentCard";

/**
 * The collection as a ledger: one row per work, for when there are too many
 * cards to scroll through. Each row borrows the card's own palette (glow
 * behind the poster, accent rule on hover) so it still reads as the same
 * collection, just filed more tightly.
 */
export function CollectionList({
  cards,
  firstIndex,
  highlight,
  onOpen,
}: {
  cards: CardData[];
  firstIndex: number;
  highlight?: string;
  onOpen: (card: CardData) => void;
}) {
  return (
    <ul className="ledger">
      {cards.map((c, i) => (
        <li
          key={c.entryId}
          id={`card-${c.entryId}`}
          className={c.entryId === highlight ? "sc-reveal" : "rise"}
          style={c.entryId === highlight ? undefined : { animationDelay: `${Math.min((firstIndex + i) * 30, 480)}ms` }}
        >
          <LedgerRow card={c} priority={firstIndex + i < 8} onOpen={() => onOpen(c)} />
        </li>
      ))}
    </ul>
  );
}

function LedgerRow({ card, priority, onOpen }: { card: CardData; priority: boolean; onOpen: () => void }) {
  const palette = usePalette(card);
  const src = posterUrl(card.posterPath, "w185");
  const inProgress = card.status === "in_progress" || card.rating == null;
  const certified = card.certification === "certified";
  const years = formatYears(card.startYear, card.endYear);
  const length =
    card.contentType === "movie"
      ? card.runtime
        ? formatRuntime(card.runtime)
        : ""
      : card.seasons
        ? `${card.seasons} ${card.seasons === 1 ? "temporada" : "temporadas"}`
        : "";
  const meta = [TYPE_LABEL[card.contentType].one, years, ...card.genres.slice(0, 2)].filter(Boolean).join(" · ");
  const seasons =
    inProgress && card.contentType === "series" && card.seasonList?.length
      ? seasonProgress(card.seasonList, card.watchedSeasons, card.rating != null)
      : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir card de ${card.title}`}
      className={`ledger-row ${inProgress ? "is-progress" : ""}`}
      style={{ "--accent": palette.accent, "--glow": palette.glow } as CSSProperties}
    >
      <span className="ledger-no" aria-hidden>
        <span className="text-dim">N°</span>
        {formatCollectionNumber(card.collectionNumber)}
      </span>

      <span className="ledger-poster">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- same-origin proxy, sized by CSS
          <img src={src} alt="" loading={priority ? "eager" : "lazy"} decoding="async" />
        ) : (
          <span className="grid h-full place-items-center font-serif text-lg text-mute">{card.title.slice(0, 1)}</span>
        )}
      </span>

      <span className="min-w-0">
        <span className="block truncate font-serif text-[1.35rem] leading-[1.1] tracking-tight sm:text-[1.6rem]">
          {card.title}
        </span>
        <span className="mt-1.5 block truncate font-mono text-[10px] uppercase tracking-[0.2em] text-dim sm:text-[11px]">
          {meta}
          {length && <span className="hidden sm:inline"> · {length}</span>}
        </span>
        {seasons && seasons.released.length > 0 ? (
          <span className="mt-2.5 flex items-center gap-2.5">
            <span className="flex gap-[3px]" aria-hidden>
              {seasons.released.slice(0, 12).map((n) => (
                <span key={n} className={`ledger-pip ${seasons.watched.includes(n) ? "is-on" : ""}`} />
              ))}
            </span>
            <span className="font-mono text-[10px] tracking-[0.16em] text-mute">
              {seasons.released.length - seasons.missing.length}/{seasons.released.length} temp.
            </span>
          </span>
        ) : (
          <span className="mt-2 block font-mono text-[10px] tracking-[0.16em] text-dim">
            {inProgress ? `desde ${formatCardDate(card.addedAt)}` : formatCardDate(cardDate(card))}
          </span>
        )}
      </span>

      <span className="ledger-mark">
        {card.newSeason ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">✦ Nova temp.</span>
        ) : inProgress ? (
          // Phones: the grey poster and the seasons line already say it
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-mute sm:inline">Em andamento</span>
        ) : (
          <>
            <span className="font-serif text-[1.9rem] leading-none tracking-tight sm:text-[2.2rem]">
              {formatRating(card.rating ?? 0)}
            </span>
            <span
              className={`mt-1.5 font-mono text-[9px] uppercase tracking-[0.24em] sm:text-[10px] ${
                certified ? "text-gold" : "text-dim"
              }`}
            >
              {certified ? "✓ Certified" : "✕ Not cert."}
            </span>
          </>
        )}
        {card.isFavorite && (
          <span className="ledger-fav" aria-label="Favorito">
            ✦
          </span>
        )}
      </span>
    </button>
  );
}
