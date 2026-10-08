import Link from "next/link";
import { notFound } from "next/navigation";
import type { ContentType } from "@/db/schema";
import { formatYears, personHref, titleHref } from "@/lib/card-types";
import { posterUrl } from "@/lib/images";
import { getTitle, getTitleCredits } from "@/lib/tmdb";
import { PeopleGrid, PeopleNames, PersonTile, SectionHead } from "./Credits";

/** Full cast and key crew of a title, shared by /series/[id]/cast and /movies/[id]/cast. */
export async function CastPage({ type, id }: { type: ContentType; id: number }) {
  const [title, credits] = await Promise.all([getTitle(type, id), getTitleCredits(type, id).catch(() => null)]);
  if (!title) notFound();
  const isMovie = type === "movie";
  const poster = posterUrl(title.posterPath, "w185");
  const makers = credits?.makers ?? [];
  const cast = credits?.cast ?? [];
  const crew = credits?.crew ?? [];

  return (
    <article className="mx-auto max-w-[1200px] px-4 pb-32 pt-12 sm:px-8 sm:pt-16">
      <Link
        href={titleHref(type, id)}
        className="group flex items-center gap-5 rounded-lg"
        aria-label={`Voltar para ${title.name}`}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="aspect-[2/3] w-16 shrink-0 rounded object-cover sm:w-20" />
        ) : (
          <div className="aspect-[2/3] w-16 shrink-0 rounded bg-ink-3 sm:w-20" />
        )}
        <div className="min-w-0">
          <p className="eyebrow">
            <span aria-hidden>← </span>
            {[isMovie ? "Filme" : "Série", formatYears(title.year, title.endYear)].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-2 font-serif text-2xl leading-tight transition-colors group-hover:text-hi sm:text-3xl">
            {title.name}
          </p>
        </div>
      </Link>

      <h1 className="mt-14 font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[0.9] tracking-[-0.025em]">
        Elenco e equipe
      </h1>
      {makers.length > 0 && (
        <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
            {isMovie ? "Direção" : makers.length > 1 ? "Criadores" : "Criação"}
          </span>
          <span className="font-serif text-2xl leading-tight sm:text-3xl">
            <PeopleNames people={makers} />
          </span>
        </p>
      )}

      {cast.length > 0 ? (
        <section aria-labelledby="cast" className="mt-16 sm:mt-20">
          <SectionHead id="cast" eyebrow={`${cast.length} ${cast.length === 1 ? "pessoa" : "pessoas"}`} title="Elenco" />
          <PeopleGrid>
            {cast.map((p) => (
              <PersonTile key={p.id} person={p} />
            ))}
          </PeopleGrid>
        </section>
      ) : (
        <p className="mt-16 text-mute">O elenco {isMovie ? "deste filme" : "desta série"} ainda não está disponível.</p>
      )}

      {crew.length > 0 && (
        <section aria-labelledby="crew" className="mt-24 sm:mt-32">
          <SectionHead id="crew" eyebrow="Por trás das câmeras" title="Equipe" />
          <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {crew.map((g) => (
              <div key={g.job}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">{g.job}</dt>
                <dd className="mt-3">
                  <ul className="space-y-1.5">
                    {g.people.map((p) => (
                      <li key={p.id} className="flex items-baseline justify-between gap-3">
                        <Link
                          href={personHref(p.id)}
                          className="font-serif text-xl leading-tight underline-offset-[5px] transition-colors hover:text-hi hover:underline"
                        >
                          {p.name}
                        </Link>
                        {p.episodes ? <span className="shrink-0 font-mono text-[10px] text-dim">{p.episodes} ep.</span> : null}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}

export function CastPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-12 sm:px-8 sm:pt-16" aria-label="Carregando" aria-busy>
      <div className="flex items-center gap-5">
        <div className="skeleton aspect-[2/3] w-16 rounded sm:w-20" />
        <div className="skeleton h-8 w-48 rounded" />
      </div>
      <div className="skeleton mt-14 h-16 w-2/3 max-w-md rounded-lg" />
      <div className="mt-16 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-6 sm:gap-x-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-square rounded-full" />
            <div className="skeleton mx-auto mt-3 h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
