"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CardData } from "@/lib/card-types";
import { SeriesCard } from "./card/SeriesCard";
import { CardLightbox } from "./CardLightbox";

type Sort = "recent" | "rating" | "number";

export function CollectionView({
  cards: initial,
  isOwner,
  highlight,
}: {
  cards: CardData[];
  isOwner: boolean;
  highlight?: string;
}) {
  const [cards, setCards] = useState(initial);
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [open, setOpen] = useState<CardData | null>(null);

  // Server data changed (router.refresh) → adopt it
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setCards(initial);
  }

  useEffect(() => {
    if (!highlight) return;
    document.getElementById(`card-${highlight}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  const shown = useMemo(() => {
    const list = filter === "fav" ? cards.filter((c) => c.isFavorite) : [...cards];
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating || b.collectionNumber - a.collectionNumber);
    else if (sort === "number") list.sort((a, b) => a.collectionNumber - b.collectionNumber);
    else list.sort((a, b) => b.watchedAt.localeCompare(a.watchedAt) || b.collectionNumber - a.collectionNumber);
    return list;
  }, [cards, filter, sort]);

  const favCount = cards.filter((c) => c.isFavorite).length;

  if (cards.length === 0) return <EmptyCollection isOwner={isOwner} />;

  return (
    <section aria-label="Coleção">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div role="tablist" aria-label="Filtrar coleção" className="flex gap-6">
          {(
            [
              ["all", "Coleção", cards.length],
              ["fav", "Favoritas", favCount],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`relative pb-4 -mb-[17px] text-sm transition-colors ${
                filter === key ? "text-paper" : "text-dim hover:text-mute"
              }`}
            >
              {label} <span className="ml-1 font-mono text-xs text-dim">{n}</span>
              {filter === key && <span className="absolute inset-x-0 bottom-0 h-px bg-gold" />}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm text-dim">
          <span className="eyebrow">Ordem</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full border border-line bg-ink-1 px-3 py-1.5 text-sm text-paper focus:border-gold/50 focus:outline-none"
          >
            <option value="recent">Mais recentes</option>
            <option value="rating">Maior nota</option>
            <option value="number">Ordem da coleção</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="py-24 text-center font-serif text-2xl italic text-mute">
          Nenhuma favorita ainda. Abra um card e marque com ✧.
        </p>
      ) : (
        <ul className="mx-auto grid max-w-[440px] grid-cols-1 gap-x-7 gap-y-12 min-[560px]:max-w-none min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {shown.map((c, i) => (
            <li
              key={c.entryId}
              id={`card-${c.entryId}`}
              className={c.entryId === highlight ? "sc-reveal" : "rise"}
              style={c.entryId === highlight ? undefined : { animationDelay: `${Math.min(i * 55, 660)}ms` }}
            >
              <button
                type="button"
                onClick={() => setOpen(c)}
                className="sc-interactive block w-full text-left"
                aria-label={`Abrir card de ${c.title}`}
              >
                <SeriesCard card={c} priority={i < 4} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <CardLightbox
        card={open}
        isOwner={isOwner}
        onClose={() => setOpen(null)}
        onChange={(next) => setCards((cs) => cs.map((c) => (c.entryId === next.entryId ? next : c)))}
        onDelete={(id) => setCards((cs) => cs.filter((c) => c.entryId !== id))}
      />
    </section>
  );
}

function EmptyCollection({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="grid items-center gap-12 py-10 md:grid-cols-[280px_1fr]">
      <div className="mx-auto aspect-[5/8] w-56 rounded-2xl border border-dashed border-line-strong bg-gradient-to-b from-white/[0.03] to-transparent p-5 md:w-full">
        <p className="font-mono text-[10px] tracking-[0.3em] text-dim">N° 0001</p>
      </div>
      <div>
        <h2 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          {isOwner ? "Sua coleção começa com a primeira obra." : "Esta coleção ainda está vazia."}
        </h2>
        {isOwner && (
          <>
            <p className="mt-4 max-w-md text-mute">
              Busque uma série que você terminou, dê sua nota e escreva o que ela significou. Ela vira o card N° 0001.
            </p>
            <Link
              href="/search"
              className="mt-8 inline-flex rounded-full bg-paper px-6 py-3 text-sm text-ink-0 transition-colors hover:bg-white"
            >
              Buscar uma série
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
