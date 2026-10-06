"use client";

import type { CSSProperties } from "react";
import { ELEMENT_CYCLE, ELEMENT_LABEL, type ArenaElement } from "@/lib/arena";
import { formatCollectionNumber, formatRuntime, formatYears, type CardData } from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import { usePalette } from "./ContentCard";

/**
 * The back of a card, seen only in the Arena: the poster on top, fading into
 * the card's palette, with the game stats. The front stays exactly as it is.
 */
export function ArenaCardBack({ card }: { card: CardData }) {
  const palette = usePalette(card);
  const stats = card.arena ?? null;
  const src = posterUrl(card.posterPath, "w500");
  const years = formatYears(card.startYear, card.endYear);
  const length =
    card.contentType === "series" && card.seasons
      ? `${card.seasons} ${card.seasons > 1 ? "Seasons" : "Season"}`
      : card.contentType === "movie" && card.runtime
        ? formatRuntime(card.runtime)
        : null;
  const victim = stats ? ELEMENT_CYCLE[(ELEMENT_CYCLE.indexOf(stats.element) + 1) % ELEMENT_CYCLE.length] : null;

  const style = {
    "--accent": palette.accent,
    "--base": palette.base,
    "--glow": palette.glow,
  } as CSSProperties;

  const label = stats
    ? `${card.title}: poder ${stats.power}, defesa ${stats.defense}, ${ELEMENT_LABEL[stats.element]}, ${stats.stars} estrelas`
    : `${card.title}: atributos da Arena ainda não calculados`;

  return (
    <div className="sc-frame">
      <article className="sc ab" style={style} aria-label={label}>
        <div className="ab-poster" aria-hidden>
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" loading="lazy" decoding="async" draggable={false} />
          )}
        </div>
        <div className="ab-veil" />

        <header className="ab-rail">
          <div className="ab-kicker">
            <span>Arena</span>
            <b>N° {formatCollectionNumber(card.collectionNumber)}</b>
          </div>
          {stats && (
            <div className="ab-stars" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} on={i < stats.stars} />
              ))}
            </div>
          )}
        </header>

        <div className="ab-emblem">
          {stats ? (
            <>
              <div className="ab-sigil">
                <svg viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="48" fill="rgb(10 10 10 / 0.55)" />
                  <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1" opacity=".9" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".4" strokeDasharray="1.5 3" />
                </svg>
                <ElementGlyph element={stats.element} />
              </div>
              <div className="ab-element">{ELEMENT_LABEL[stats.element]}</div>
              {victim && <div className="ab-beats">Beats {ELEMENT_LABEL[victim]}</div>}
            </>
          ) : (
            <div className="ab-pending">Stats pending</div>
          )}
        </div>

        <div className="ab-plate">
          <h3 className="ab-title">{card.title}</h3>
          <div className="ab-meta">
            {years && <span>{years}</span>}
            {length && <span>{length}</span>}
          </div>

          <div className="ab-stats">
            <Ticket kind="power" value={stats?.power ?? null} serial={card.collectionNumber} />
            <Ticket kind="defense" value={stats?.defense ?? null} serial={card.collectionNumber} />
          </div>

          <footer className="ab-foot">
            <span>Certified Series</span>
            <span>{stats ? `${stats.stars} ★` : "—"}</span>
          </footer>
        </div>

        <div className="sc-grain" />
        <div className="sc-edge" />
      </article>
    </div>
  );
}

/**
 * A stat printed as a cinema ticket: tear-off stub with ADMIT ONE, notched
 * edges, foil numeral in italic serif and a serial like a real ticket.
 */
export function Ticket({ kind, value, serial }: { kind: "power" | "defense"; value: number | null; serial: number }) {
  const name = kind === "power" ? "Power" : "Defense";
  return (
    <div className={`tk is-${kind}`}>
      <div className="tk-stub" aria-hidden>
        <span>Admit one</span>
      </div>
      <div className="tk-body">
        <span className="tk-name">
          <StatIcon kind={kind} />
          {name}
        </span>
        <b className="tk-num">{value ?? "—"}</b>
        <span className="tk-serial">
          N° {formatCollectionNumber(serial)}·{kind === "power" ? "P" : "D"}
        </span>
      </div>
    </div>
  );
}

export function StatIcon({ kind }: { kind: "power" | "defense" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      {kind === "power" ? (
        <path d="M9.2 1.2L3.4 9h4.2l-.8 5.8L12.6 7H8.4z" fill="currentColor" />
      ) : (
        <path d="M8 1.3l5.4 2v4.2c0 3.3-2.3 5.9-5.4 7.2-3.1-1.3-5.4-3.9-5.4-7.2V3.3z" fill="currentColor" />
      )}
    </svg>
  );
}

function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={on ? "is-on" : ""}>
      <path d="M8 1.6l1.9 4.1 4.5.5-3.4 3 1 4.4L8 11.3l-4 2.3 1-4.4-3.4-3 4.5-.5z" />
    </svg>
  );
}

/** One line-art mark per element, drawn in the card's accent. */
export function ElementGlyph({ element, className = "ab-glyph" }: { element: ArenaElement; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {element === "action" && <path {...common} d="M13.5 2.5L5 13.5h6l-1 8 8.5-11h-6z" />}
      {element === "suspense" && (
        <>
          <circle {...common} cx="12" cy="9.5" r="3.6" />
          <path {...common} d="M10.6 12.6L9.5 20h5l-1.1-7.4" />
        </>
      )}
      {element === "comedy" && (
        <>
          <circle {...common} cx="12" cy="12" r="8.5" />
          <path {...common} d="M8 13.5c1 2 2.3 3 4 3s3-1 4-3" />
          <path {...common} d="M9 9.5h.01M15 9.5h.01" strokeWidth={2.4} />
        </>
      )}
      {element === "drama" && <path {...common} d="M12 3.5c-3 4.2-5.5 7.4-5.5 10.5a5.5 5.5 0 0 0 11 0c0-3.1-2.5-6.3-5.5-10.5z" />}
      {element === "fantasy" && (
        <>
          <path {...common} d="M12 2.5c.8 4.6 2.6 6.9 7.5 8-4.9 1.1-6.7 3.4-7.5 8-.8-4.6-2.6-6.9-7.5-8 4.9-1.1 6.7-3.4 7.5-8z" />
          <path {...common} d="M19 17.5v3M17.5 19h3" strokeWidth={1.2} />
        </>
      )}
    </svg>
  );
}
