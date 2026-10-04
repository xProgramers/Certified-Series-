"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatCollectionNumber } from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import type { SeriesSummary } from "@/lib/tmdb";

type Fetched =
  | { q: string; status: "done"; results: SeriesSummary[] }
  | { q: string; status: "error"; message: string };

type State = { status: "idle" } | { status: "loading" } | Fetched;

export function SearchClient({
  initialQuery,
  popular,
  watched,
  sample,
}: {
  initialQuery: string;
  popular: SeriesSummary[];
  watched: Record<number, number>;
  sample: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const q = query.trim();
  const state: State = !q ? { status: "idle" } : fetched && fetched.q === q ? fetched : { status: "loading" };
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url);

    if (!q) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFetched({ q, status: "done", results: data.results });
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setFetched({ q, status: "error", message: e instanceof Error && e.message ? e.message : "Erro na busca." });
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

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

  return (
    <div>
      <div className="relative">
        <label htmlFor="q" className="eyebrow">
          Buscar série
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
          placeholder="O que você terminou de assistir?"
          className="mt-3 w-full border-0 border-b border-line-strong bg-transparent pb-4 font-serif text-[clamp(2.2rem,6vw,4.5rem)] leading-tight tracking-tight text-paper placeholder:text-dim/70 focus:border-gold/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {sample && (
          <p className="mt-3 text-xs text-dim">
            Catálogo de exemplo ativo. Configure <code className="font-mono text-mute">TMDB_READ_TOKEN</code> para buscar
            em todo o TMDB.
          </p>
        )}
      </div>

      <div className="mt-12" aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "idle" && popular.length > 0 && (
          <>
            <p className="eyebrow mb-6">{sample ? "No catálogo" : "Em alta esta semana"}</p>
            <ResultGrid items={popular} watched={watched} />
          </>
        )}
        {state.status === "loading" && <SkeletonGrid />}
        {state.status === "error" && <p className="text-danger">{state.message}</p>}
        {state.status === "done" &&
          (state.results.length ? (
            <>
              <p className="eyebrow mb-6">
                {state.results.length} {state.results.length === 1 ? "resultado" : "resultados"}
              </p>
              <ResultGrid items={state.results} watched={watched} />
            </>
          ) : (
            <p className="py-16 font-serif text-3xl italic text-mute">
              Nada encontrado para “{query.trim()}”.
              {sample && <span className="mt-3 block font-sans text-sm not-italic text-dim">Tente Breaking Bad, Dark, Severance…</span>}
            </p>
          ))}
      </div>
    </div>
  );
}

function ResultGrid({ items, watched }: { items: SeriesSummary[]; watched: Record<number, number> }) {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {items.map((s, i) => {
        const src = posterUrl(s.posterPath, "w342");
        const n = watched[s.id];
        return (
          <li key={s.id} className="rise" style={{ animationDelay: `${Math.min(i * 35, 400)}ms` }}>
            <Link href={`/series/${s.id}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ink-3 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.8)] ring-1 ring-line">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`Pôster de ${s.name}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-cinema)] group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="grid h-full place-items-center p-4 text-center font-serif text-xl text-dim">{s.name}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {n && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] tracking-widest text-gold backdrop-blur">
                    ✓ N° {formatCollectionNumber(n)}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-serif text-xl leading-tight transition-colors group-hover:text-white">{s.name}</h3>
              <p className="mt-1 truncate font-mono text-[11px] tracking-wider text-dim">
                {[s.firstAirYear, s.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6" aria-label="Carregando">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}>
          <div className="skeleton aspect-[2/3] rounded-lg" />
          <div className="skeleton mt-3 h-5 w-3/4 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </li>
      ))}
    </ul>
  );
}
