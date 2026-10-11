"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { byMostRecent, formatCollectionNumber, type CardData, type ContentType } from "@/lib/card-types";
import { ContentCard } from "./card/ContentCard";
import { CardLightbox } from "./CardLightbox";
import { CollectionList } from "./CollectionList";

type Sort = "recent" | "rating" | "number";
type TypeFilter = "all" | ContentType;
type StatusFilter = "all" | "in_progress" | "completed" | "fav";
type ViewMode = "cards" | "list";

const VIEW_KEY = "collection-view";

const TYPE_TABS: [TypeFilter, string][] = [
  ["all", "Todos"],
  ["series", "Séries"],
  ["movie", "Filmes"],
];

const SECTIONS: [ContentType, string][] = [
  ["series", "Séries"],
  ["movie", "Filmes"],
];

const STATUS_TABS: [StatusFilter, string][] = [
  ["all", "Tudo"],
  ["in_progress", "Em andamento"],
  ["completed", "Concluídos"],
  ["fav", "Favoritos"],
];

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
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [open, setOpen] = useState<CardData | null>(null);
  // Remembered on this device; the server always renders cards
  const view = useSyncExternalStore(subscribeView, storedView, () => "cards" as ViewMode);

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

  const ofType = useMemo(() => (type === "all" ? cards : cards.filter((c) => c.contentType === type)), [cards, type]);

  const shown = useMemo(() => {
    const list = ofType.filter((c) =>
      status === "all" ? true : status === "fav" ? c.isFavorite : c.status === status,
    );
    if (sort === "rating") list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.collectionNumber - a.collectionNumber);
    else if (sort === "number") list.sort((a, b) => a.collectionNumber - b.collectionNumber);
    else list.sort(byMostRecent);
    return list;
  }, [ofType, status, sort]);

  const count = (s: StatusFilter) =>
    s === "all" ? ofType.length : ofType.filter((c) => (s === "fav" ? c.isFavorite : c.status === s)).length;

  if (cards.length === 0) return <EmptyCollection isOwner={isOwner} />;

  // The collection is a binder with two pages: series and movies. Inside each,
  // what is being watched comes first, then what is already certified.
  const sections = SECTIONS.filter(([t]) => type === "all" || type === t)
    .map(([t, label]) => {
      const list = shown.filter((c) => c.contentType === t);
      // A series with a new season jumps to the front so it gets noticed,
      // then what is being watched, then what is already certified
      const rank = (c: CardData) => (c.newSeason ? 0 : status === "all" && c.status === "in_progress" ? 1 : 2);
      list.sort((a, b) => rank(a) - rank(b));
      return { type: t, label, list, total: cards.filter((c) => c.contentType === t).length };
    })
    .filter((s) => s.list.length > 0);
  const nextNumber = Math.max(0, ...cards.map((c) => c.collectionNumber)) + 1;
  let index = 0;
  // Where each section starts in the stagger, for the list view
  const firstOf = sections.map((_, i) => sections.slice(0, i).reduce((n, sec) => n + sec.list.length, 0));

  return (
    <section aria-label="Coleção">
      <div className="mb-10 flex flex-col gap-4 sm:mb-12">
        <div role="tablist" aria-label="Tipo de obra" className="flex gap-6">
          {TYPE_TABS.map(([key, label]) => (
            <button key={key} role="tab" type="button" aria-selected={type === key} onClick={() => setType(key)} className="tab text-base">
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="no-scrollbar -ml-4 flex min-w-0 gap-1.5 overflow-x-auto pl-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar">
            {STATUS_TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={status === key}
                onClick={() => setStatus(key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  status === key ? "bg-paper/[0.09] text-paper" : "text-dim hover:text-mute"
                }`}
              >
                {label} <span className="ml-0.5 font-mono text-[11px] text-dim">{count(key)}</span>
              </button>
            ))}
          </div>
          <label className="ml-auto hidden shrink-0 items-center gap-2 text-sm text-dim sm:flex">
            <span className="sr-only">Ordem</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-transparent py-1.5 text-[13px] text-mute focus:outline-none [&>option]:bg-ink-1"
            >
              <option value="recent">Mais recentes</option>
              <option value="rating">Maior nota</option>
              <option value="number">Ordem da coleção</option>
            </select>
          </label>
          <ViewSwitch view={view} onChange={pickView} />
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="py-24 text-center font-serif text-2xl italic text-mute">{emptyLine(status, type)}</p>
      ) : (
        <div className="space-y-20 sm:space-y-28">
          {sections.map((sec, si) => (
            <section key={sec.type} aria-labelledby={`sec-${sec.type}`}>
              <header className="binder-head mb-8 sm:mb-10">
                <h2 id={`sec-${sec.type}`} className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-none tracking-tight">
                  {sec.label}
                </h2>
                <span className="binder-rule" aria-hidden />
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-dim sm:text-[11px]">
                  {sec.list.length === sec.total
                    ? `${sec.total} ${sec.total === 1 ? "card" : "cards"}`
                    : `${sec.list.length} de ${sec.total}`}
                </p>
              </header>
              {view === "list" ? (
                <>
                  <CollectionList cards={sec.list} firstIndex={firstOf[si]} highlight={highlight} onOpen={setOpen} />
                  {isOwner && status !== "fav" && (
                    <Link
                      href={`/search?tipo=${sec.type === "movie" ? "filmes" : "series"}`}
                      className="mt-4 flex items-center gap-3 px-1 py-2 text-sm text-mute transition-colors hover:text-paper"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-line-strong" aria-hidden>
                        +
                      </span>
                      {sec.type === "movie" ? "Adicionar filme" : "Adicionar série"}
                      <span className="font-mono text-[10px] tracking-[0.3em] text-dim">N° {formatCollectionNumber(nextNumber)}</span>
                    </Link>
                  )}
                </>
              ) : (
                <ul className="card-grid">
                  {sec.list.map((c) => {
                    const i = index++;
                    return (
                      <li
                        key={c.entryId}
                        id={`card-${c.entryId}`}
                        className={`${c.entryId === highlight ? "sc-reveal" : "rise"}`}
                        style={c.entryId === highlight ? undefined : { animationDelay: `${Math.min(i * 50, 600)}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpen(c)}
                          onPointerMove={tilt}
                          onPointerLeave={untilt}
                          className="sc-interactive block w-full text-left"
                          aria-label={`Abrir card de ${c.title}`}
                        >
                          <span className="card-tilt">
                            <ContentCard card={c} priority={i < 4} />
                          </span>
                        </button>
                        {c.newSeason && (
                          <p className="mt-2.5 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
                            ✦ Nova temporada
                          </p>
                        )}
                      </li>
                    );
                  })}
                  {isOwner && status !== "fav" && (
                    <li className="rise" style={{ animationDelay: `${Math.min(index * 50, 600)}ms` }}>
                      <Link href={`/search?tipo=${sec.type === "movie" ? "filmes" : "series"}`} className="empty-slot">
                        <span className="empty-slot-plus" aria-hidden>
                          +
                        </span>
                        <span className="mt-3 text-sm text-mute">{sec.type === "movie" ? "Adicionar filme" : "Adicionar série"}</span>
                        <span className="mt-1 font-mono text-[10px] tracking-[0.3em] text-dim">
                          N° {formatCollectionNumber(nextNumber)}
                        </span>
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </section>
          ))}
        </div>
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

const VIEW_EVENT = "cs-collection-view";
// Fallback when storage is blocked: the switch still works for this visit
let viewInMemory: ViewMode = "cards";

function storedView(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "list" || v === "cards" ? v : viewInMemory;
  } catch {
    return viewInMemory;
  }
}

function subscribeView(onChange: () => void) {
  window.addEventListener(VIEW_EVENT, onChange);
  return () => window.removeEventListener(VIEW_EVENT, onChange);
}

function pickView(v: ViewMode) {
  viewInMemory = v;
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {}
  window.dispatchEvent(new Event(VIEW_EVENT));
}

function ViewSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="view-switch shrink-0" role="group" aria-label="Modo de exibição">
      <button type="button" aria-pressed={view === "cards"} onClick={() => onChange("cards")} aria-label="Ver em cards" title="Cards">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <rect x="1.75" y="1.75" width="5.25" height="7.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9" y="1.75" width="5.25" height="7.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.75 12.5h5.25M9 12.5h5.25M1.75 14.5h3.5M9 14.5h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity=".6" />
        </svg>
      </button>
      <button type="button" aria-pressed={view === "list"} onClick={() => onChange("list")} aria-label="Ver em lista" title="Lista">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <rect x="1.5" y="2" width="3" height="4.5" rx=".6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1.5" y="9.5" width="3" height="4.5" rx=".6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.75 3.25h7.5M6.75 5.5h4.5M6.75 10.75h7.5M6.75 13h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/** Collectible-card tilt: the card leans toward the pointer and catches the light. */
function tilt(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  const s = e.currentTarget.style;
  s.setProperty("--rx", `${((0.5 - y) * 9).toFixed(2)}deg`);
  s.setProperty("--ry", `${((x - 0.5) * 11).toFixed(2)}deg`);
  s.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
  s.setProperty("--my", `${(y * 100).toFixed(1)}%`);
}

function untilt(e: React.PointerEvent<HTMLElement>) {
  const s = e.currentTarget.style;
  for (const k of ["--rx", "--ry", "--mx", "--my"]) s.removeProperty(k);
}

const EMPTY: Record<Exclude<StatusFilter, "fav">, Record<TypeFilter, string>> = {
  all: { all: "", series: "Nenhuma série na coleção ainda.", movie: "Nenhum filme na coleção ainda." },
  in_progress: { all: "Nada em andamento agora.", series: "Nenhuma série em andamento.", movie: "Nenhum filme em andamento." },
  completed: { all: "Nada concluído ainda.", series: "Nenhuma série concluída ainda.", movie: "Nenhum filme concluído ainda." },
};

function emptyLine(status: StatusFilter, type: TypeFilter) {
  return status === "fav" ? "Nenhum favorito ainda. Abra um card e marque com ✧." : EMPTY[status][type];
}

function EmptyCollection({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="grid items-center gap-10 py-6 sm:grid-cols-[220px_1fr] sm:gap-14">
      <div className="mx-auto aspect-[5/8] w-44 rounded-xl border border-dashed border-line-strong p-4 sm:w-full">
        <p className="font-mono text-[10px] tracking-[0.3em] text-dim">N° 0001</p>
      </div>
      <div>
        <h2 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          {isOwner ? "Sua coleção começa com a primeira obra." : "Esta coleção ainda está vazia."}
        </h2>
        {isOwner && (
          <>
            <p className="mt-4 max-w-md text-mute">
              Busque uma série ou um filme e adicione. O card nasce em preto e branco e ganha cor quando você terminar.
            </p>
            <Link
              href="/search"
              className="mt-8 inline-flex rounded-full bg-paper px-6 py-3 text-sm text-ink-0 transition-colors hover:bg-hi"
            >
              Buscar séries e filmes
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
