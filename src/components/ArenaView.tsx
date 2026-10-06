"use client";

import { useMemo, useState } from "react";
import { ELEMENT_CYCLE, ELEMENT_LABEL, ELEMENT_BONUS } from "@/lib/arena";
import type { CardData } from "@/lib/card-types";
import { ArenaCard } from "./card/ArenaCard";
import { ElementGlyph } from "./card/ArenaCardBack";

type Sort = "stars" | "power" | "defense";

const SORTS: [Sort, string][] = [
  ["stars", "Estrelas"],
  ["power", "Poder"],
  ["defense", "Defesa"],
];

/** The player's playable cards, each one turning over to its Arena stats. */
export function ArenaView({ cards, missing }: { cards: CardData[]; missing: number }) {
  const [sort, setSort] = useState<Sort>("stars");
  const [allBack, setAllBack] = useState(true);
  // Cards turned the other way from the global side
  const [turned, setTurned] = useState<Set<string>>(new Set());

  const shown = useMemo(() => {
    const score = (c: CardData) => {
      const a = c.arena;
      if (!a) return -1;
      if (sort === "power") return a.power * 1000 + a.defense;
      if (sort === "defense") return a.defense * 1000 + a.power;
      return a.stars * 1000 + a.power + a.defense;
    };
    return [...cards].sort((a, b) => score(b) - score(a) || b.collectionNumber - a.collectionNumber);
  }, [cards, sort]);

  const flipAll = (back: boolean) => {
    setAllBack(back);
    setTurned(new Set());
  };
  const toggle = (id: string) =>
    setTurned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section aria-label="Suas cartas da Arena">
      <ElementCycle />

      {missing > 0 && (
        <p className="mb-8 rounded-2xl border border-line px-5 py-4 text-sm text-mute">
          Conclua mais {missing} {missing === 1 ? "obra" : "obras"} para montar seu primeiro deck.
        </p>
      )}

      <div className="mb-10 flex items-center justify-between gap-4">
        <div className="flex gap-1.5" role="group" aria-label="Lado das cartas">
          {(
            [
              [true, "Verso"],
              [false, "Frente"],
            ] as const
          ).map(([back, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={allBack === back}
              onClick={() => flipAll(back)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                allBack === back ? "bg-paper/[0.09] text-paper" : "text-dim hover:text-mute"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-dim">
          <span className="sr-only">Ordem</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-transparent py-1.5 text-[13px] text-mute focus:outline-none [&>option]:bg-ink-1"
          >
            {SORTS.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="card-grid">
        {shown.map((c, i) => (
          <li key={c.entryId} className="rise" style={{ animationDelay: `${Math.min(i * 50, 600)}ms` }}>
            <ArenaCard card={c} flipped={allBack !== turned.has(c.entryId)} onFlip={() => toggle(c.entryId)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The genre cycle, so the advantage rule reads at a glance. */
function ElementCycle() {
  return (
    <div className="mb-10 rounded-2xl border border-line px-5 py-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-dim">
        Vantagem de gênero · +{ELEMENT_BONUS} na rodada
      </p>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-mute">
        {[...ELEMENT_CYCLE, ELEMENT_CYCLE[0]].map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-label="vence" className="text-dim">
                →
              </span>
            )}
            <span className="flex items-center gap-1.5 text-paper">
              <ElementGlyph element={e} className="h-4 w-4 text-gold" />
              {ELEMENT_LABEL[e]}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
