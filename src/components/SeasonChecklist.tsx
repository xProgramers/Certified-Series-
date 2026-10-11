"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setWatchedSeasons } from "@/app/actions/collection";
import type { CardData, SeasonInfo } from "@/lib/card-types";

/**
 * Seasons of a series as a checklist: tap a season to mark it as finished.
 * Only released seasons can be marked; one still airing or announced is shown
 * but waits. Marking the first season of a series not yet in the collection
 * adds it, in progress.
 */
export function SeasonChecklist({
  contentId,
  entryId,
  seasons,
  watched: initial,
  editable,
  compact,
  onSaved,
}: {
  contentId: number;
  entryId?: string;
  seasons: SeasonInfo[];
  watched: number[];
  editable: boolean;
  compact?: boolean;
  /** Called with the updated card after each save, and whether every released season is now marked. */
  onSaved?: (card: CardData, allMarked: boolean) => void;
}) {
  const router = useRouter();
  const [watched, setWatched] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Server data changed (router.refresh) → adopt it
  const [prev, setPrev] = useState(initial);
  if (initial !== prev) {
    setPrev(initial);
    setWatched(initial);
  }

  const released = seasons.filter((s) => s.state === "released").map((s) => s.number);
  const airing = seasons.some((s) => s.state === "airing");
  const allMarked = released.length > 0 && released.every((n) => watched.includes(n));

  const save = (next: number[]) => {
    const before = watched;
    setWatched(next);
    setError(null);
    start(async () => {
      const res = await setWatchedSeasons({ entryId, contentId, seasons: next });
      if (!res.ok) {
        setWatched(before);
        return setError(res.error);
      }
      const marked = res.data.watchedSeasons ?? next;
      // A season on air keeps the series unfinished until its last episode
      onSaved?.(res.data, !airing && released.every((n) => marked.includes(n)));
      router.refresh();
    });
  };

  const toggle = (n: number) => save(watched.includes(n) ? watched.filter((x) => x !== n) : [...watched, n].sort((a, b) => a - b));

  if (seasons.length === 0) return null;

  return (
    <div>
      <ul className={`grid gap-2 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {seasons.map((s) => {
          const isReleased = s.state === "released";
          const on = isReleased && watched.includes(s.number);
          const detail =
            s.state === "airing"
              ? `Em exibição · ${s.aired} de ${s.episodes || "?"} ep.`
              : s.state === "upcoming"
                ? s.year
                  ? `Estreia em ${s.year}`
                  : "Em breve"
                : [s.episodes ? `${s.episodes} ep.` : null, s.year].filter(Boolean).join(" · ");
          return (
            <li key={s.number}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={!editable || !isReleased}
                onClick={() => toggle(s.number)}
                className={`group flex w-full items-center gap-4 rounded-xl border px-4 text-left transition-colors ${
                  compact ? "py-2.5" : "py-3.5"
                } ${
                  on
                    ? "border-gold/45 bg-gold/[0.06]"
                    : isReleased
                      ? "border-line-strong enabled:hover:border-paper/40"
                      : "border-dashed border-line-strong opacity-60"
                } disabled:cursor-default`}
              >
                <span className={`font-serif leading-none ${compact ? "w-7 text-2xl" : "w-9 text-3xl"} ${on ? "text-paper" : "text-mute"}`}>
                  {s.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-paper/90">{s.name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-dim">{detail}</span>
                </span>
                <Mark on={on} waiting={!isReleased} />
              </button>
            </li>
          );
        })}
      </ul>
      {editable && released.length > 1 && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          <button
            type="button"
            disabled={pending}
            onClick={() => save(allMarked ? [] : released)}
            className="text-mute underline-offset-4 hover:text-paper hover:underline disabled:opacity-60"
          >
            {allMarked ? "Desmarcar todas" : "Marcar todas"}
          </button>
          {pending && <span className="font-mono text-[11px] text-dim">Salvando…</span>}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}

function Mark({ on, waiting }: { on: boolean; waiting: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-5 w-5 shrink-0 ${on ? "text-gold" : "text-dim"}`} aria-hidden>
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray={waiting ? "2 2.4" : undefined} />
      {on && <path d="M6.2 10.3l2.6 2.6 5-5.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
