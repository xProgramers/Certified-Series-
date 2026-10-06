"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { startMatch } from "@/app/actions/arena";
import { DECK_SIZE, DECK_STAR_BUDGET, ELEMENT_BONUS, ELEMENT_CYCLE, ELEMENT_LABEL } from "@/lib/arena";
import { deckStars } from "@/lib/arena-game";
import type { Challenge } from "@/lib/arena-server";
import type { CardData } from "@/lib/card-types";
import { ArenaCardBack, ElementGlyph } from "../card/ArenaCardBack";

type Sort = "stars" | "power" | "defense";

const SORTS: [Sort, string][] = [
  ["stars", "Estrelas"],
  ["power", "Poder"],
  ["defense", "Defesa"],
];

const DECK_KEY = "arena-deck";

/** Pick a challenge and five cards within the star budget, then enter the Arena. */
export function DeckBuilder({ cards, challenges, weekly }: { cards: CardData[]; challenges: Challenge[]; weekly: string }) {
  const router = useRouter();
  const [challenge, setChallenge] = useState(weekly);
  const [picked, setPicked] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("stars");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Bring back the last deck (only cards still playable)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DECK_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        const ok = saved.filter((id) => cards.some((c) => c.entryId === id && c.arena)).slice(0, DECK_SIZE);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
        if (ok.length) setPicked(ok);
      }
    } catch {}
  }, [cards]);

  const playable = cards.filter((c) => c.arena);
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

  const deck = picked.map((id) => cards.find((c) => c.entryId === id)!).filter(Boolean);
  const stars = deckStars(deck.map((c) => c.arena!));
  const over = stars > DECK_STAR_BUDGET;
  const ready = deck.length === DECK_SIZE && !over;

  const toggle = (id: string) => {
    setError(null);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < DECK_SIZE ? [...p, id] : p));
  };

  const play = () =>
    start(async () => {
      try {
        localStorage.setItem(DECK_KEY, JSON.stringify(picked));
      } catch {}
      const res = await startMatch({ entryIds: picked, challenge });
      if (res.ok) router.push(`/arena/partida/${res.data.id}`);
      else setError(res.error);
    });

  const missing = Math.max(0, DECK_SIZE - playable.length);

  return (
    <section aria-label="Montar deck">
      <h2 className="eyebrow mb-4">1 · Escolha o desafio</h2>
      <div className="no-scrollbar -mx-4 mb-12 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0" role="radiogroup" aria-label="Desafio">
        {challenges.map((c) => (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={challenge === c.key}
            onClick={() => setChallenge(c.key)}
            className={`challenge ${challenge === c.key ? "is-on" : ""}`}
          >
            <span className="challenge-glyph">
              {c.element ? <ElementGlyph element={c.element} className="h-5 w-5" /> : <span className="font-serif text-lg">★</span>}
            </span>
            {c.key === weekly && <span className="challenge-badge">Da semana</span>}
            <span className="mt-4 block font-serif text-xl leading-tight text-paper">{c.name}</span>
            <span className="mt-1 block text-[13px] leading-snug text-mute">{c.tagline}</span>
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="eyebrow">2 · Monte seu deck</h2>
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

      <ElementCycle />

      {missing > 0 && (
        <p className="mb-8 rounded-2xl border border-line px-5 py-4 text-sm text-mute">
          Conclua mais {missing} {missing === 1 ? "obra" : "obras"} para montar seu primeiro deck.
        </p>
      )}

      <ul className="card-grid">
        {shown.map((c, i) => {
          const on = picked.includes(c.entryId);
          const full = !on && picked.length >= DECK_SIZE;
          return (
            <li key={c.entryId} className="rise" style={{ animationDelay: `${Math.min(i * 40, 500)}ms` }}>
              <button
                type="button"
                onClick={() => toggle(c.entryId)}
                disabled={!c.arena || full}
                aria-pressed={on}
                aria-label={`${on ? "Tirar do deck" : "Colocar no deck"}: ${c.title}`}
                className={`deck-pick sc-interactive block w-full text-left ${on ? "is-on" : ""} ${full ? "is-full" : ""}`}
              >
                <ArenaCardBack card={c} />
                {on && <span className="deck-pick-badge">{picked.indexOf(c.entryId) + 1}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="deck-tray" role="region" aria-label="Seu deck">
        <div className="deck-tray-inner">
          <div className="deck-slots">
            {Array.from({ length: DECK_SIZE }, (_, i) => {
              const c = deck[i];
              return (
                <button
                  key={i}
                  type="button"
                  className={`deck-slot ${c ? "is-filled" : ""}`}
                  onClick={() => c && toggle(c.entryId)}
                  disabled={!c}
                  aria-label={c ? `Tirar ${c.title} do deck` : `Vaga ${i + 1} vazia`}
                >
                  {c ? <ArenaCardBack card={c} /> : <span>{i + 1}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <p className={`whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] ${over ? "text-danger" : "text-mute"}`}>
              <span className="block text-[10px] text-dim">Estrelas</span>
              <b className="text-base font-normal tracking-normal text-paper">{stars}</b> / {DECK_STAR_BUDGET} ★
            </p>
            <button
              type="button"
              onClick={play}
              disabled={!ready || pending}
              className="whitespace-nowrap rounded-full bg-paper px-5 py-2.5 text-sm text-ink-0 transition-colors hover:bg-hi disabled:opacity-40"
            >
              {pending ? "Montando a mesa…" : "Entrar na Arena"}
            </button>
          </div>
        </div>
        {(error || over) && (
          <p role="alert" className="mx-auto mt-2 max-w-[1440px] px-4 text-sm text-danger sm:px-8">
            {error ?? `Passou do limite: tire cartas até ficar com no máximo ${DECK_STAR_BUDGET} estrelas.`}
          </p>
        )}
      </div>
    </section>
  );
}

/** The genre cycle, so the advantage rule reads at a glance. */
function ElementCycle() {
  return (
    <div className="mb-8 rounded-2xl border border-line px-5 py-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-dim">Vantagem de gênero · +{ELEMENT_BONUS} na rodada</p>
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
