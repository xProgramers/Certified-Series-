"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { titleHref, TYPE_LABEL } from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import type { SearchType, TitleSummary } from "@/lib/tmdb";
import { AddButton, type Owned } from "./AddButton";

type Fetched =
  | { key: string; status: "done"; results: TitleSummary[] }
  | { key: string; status: "error"; message: string };

type State = { status: "loading" } | Fetched;

const TABS: [SearchType, string, string | null][] = [
  ["all", "Todos", null],
  ["series", "Séries", "series"],
  ["movie", "Filmes", "filmes"],
];

export function SearchClient({
  initialQuery,
  initialType,
  popular,
  owned: initialOwned,
  signedIn,
  sample,
}: {
  initialQuery: string;
  initialType: SearchType;
  popular: TitleSummary[];
  owned: Record<string, NonNullable<Owned>>;
  signedIn: boolean;
  sample: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchType>(initialType);
  const [owned, setOwned] = useState(initialOwned);
  const q = query.trim();
  const key = `${type}|${q}`;
  const initialKey = `${initialType}|`;
  // The server already rendered trending titles for the initial tab
  const [fetched, setFetched] = useState<Fetched | null>({ key: initialKey, status: "done", results: popular });
  const state: State = fetched && fetched.key === key ? fetched : { status: "loading" };
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    const slug = TABS.find(([t]) => t === type)?.[2];
    if (slug) url.searchParams.set("tipo", slug);
    else url.searchParams.delete("tipo");
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url);

    if (fetched?.key === key) return;
    const ctrl = new AbortController();
    const t = setTimeout(
      async () => {
        try {
          const res = await fetch(`/api/tmdb/search?type=${type}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setFetched({ key, status: "done", results: data.results });
        } catch (e) {
          if (ctrl.signal.aborted) return;
          setFetched({ key, status: "error", message: e instanceof Error && e.message ? e.message : "Erro na busca." });
        }
      },
      q ? 220 : 0,
    );
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // fetched is read only to skip a request that is already answered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // "/" focuses the search, like most catalogues
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const what = type === "series" ? "série" : type === "movie" ? "filme" : "série ou filme";

  return (
    <div>
      <div>
        <label htmlFor="q" className="sr-only">
          Buscar {what}
        </label>
        <input
          ref={inputRef}
          id="q"
          type="search"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar ${what}`}
          className="w-full border-0 border-b border-line bg-transparent pb-3 font-serif text-[clamp(2rem,5.5vw,4rem)] leading-tight tracking-tight text-paper placeholder:text-dim/60 focus:border-gold/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <div role="tablist" aria-label="Tipo de obra" className="mt-5 flex gap-6">
          {TABS.map(([t, label]) => (
            <button key={t} role="tab" type="button" aria-selected={type === t} onClick={() => setType(t)} className="tab">
              {label}
            </button>
          ))}
        </div>
        {sample && (
          <p className="mt-4 text-xs text-dim">
            Catálogo de exemplo ativo. Configure <code className="font-mono text-mute">TMDB_READ_TOKEN</code> para buscar
            em todo o TMDB.
          </p>
        )}
      </div>

      <div className="mt-10" aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" && <SkeletonGrid />}
        {state.status === "error" && <p className="text-danger">{state.message}</p>}
        {state.status === "done" &&
          (state.results.length ? (
            <>
              <p className="eyebrow mb-6">
                {q
                  ? `${state.results.length} ${state.results.length === 1 ? "resultado" : "resultados"}`
                  : sample
                    ? "No catálogo"
                    : "Em alta esta semana"}
              </p>
              <ResultGrid
                items={state.results}
                owned={owned}
                signedIn={signedIn}
                showType={type === "all"}
                onAdded={(k, o) => setOwned((m) => ({ ...m, [k]: o }))}
              />
            </>
          ) : (
            <p className="py-16 font-serif text-3xl italic text-mute">
              {q ? `Nada encontrado para “${q}”.` : "Nada por aqui agora."}
              {sample && q && (
                <span className="mt-3 block font-sans text-sm not-italic text-dim">
                  Tente Breaking Bad, Dark, Matrix, Parasita…
                </span>
              )}
            </p>
          ))}
      </div>
    </div>
  );
}

function ResultGrid({
  items,
  owned,
  signedIn,
  showType,
  onAdded,
}: {
  items: TitleSummary[];
  owned: Record<string, NonNullable<Owned>>;
  signedIn: boolean;
  showType: boolean;
  onAdded: (key: string, o: NonNullable<Owned>) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 xl:grid-cols-6">
      {items.map((s, i) => {
        const src = posterUrl(s.posterPath, "w342");
        const k = `${s.type}:${s.id}`;
        const href = titleHref(s.type, s.id);
        return (
          <li key={k} className="rise" style={{ animationDelay: `${Math.min(i * 30, 360)}ms` }}>
            <Link href={href} className="group block" aria-label={`${s.name} (${TYPE_LABEL[s.type].one})`}>
              <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-ink-3">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-cinema)] group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full place-items-center p-4 text-center font-serif text-xl text-dim">{s.name}</div>
                )}
              </div>
              <h3 className="mt-3 font-serif text-lg leading-tight transition-colors group-hover:text-white sm:text-xl">{s.name}</h3>
              <p className="mt-1 truncate font-mono text-[11px] tracking-wider text-dim">
                {[showType ? (s.type === "movie" ? "Filme" : "Série") : null, s.year].filter(Boolean).join(" · ")}
              </p>
            </Link>
            <div className="-ml-0.5 mt-2.5">
              <AddButton
                type={s.type}
                id={s.id}
                owned={owned[k]}
                signedIn={signedIn}
                onAdded={(o) => onAdded(k, o)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 xl:grid-cols-6" aria-label="Carregando">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}>
          <div className="skeleton aspect-[2/3] rounded-md" />
          <div className="skeleton mt-3 h-5 w-3/4 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </li>
      ))}
    </ul>
  );
}
