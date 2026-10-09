import Link from "next/link";
import type { ContentType } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { titleHref } from "@/lib/card-types";
import { getOwnership } from "@/lib/data";
import { getTitleExtras } from "@/lib/tmdb";
import { PeopleGrid, PeopleNames, PersonTile, PosterTile, Rail, SectionHead, type Owned } from "./Credits";

/**
 * Lower half of the title page: cast and director, the rest of the franchise
 * and similar titles. Streamed in after the hero so it never delays it.
 */
export async function TitleExtras({ type, id }: { type: ContentType; id: number }) {
  const [extras, user] = await Promise.all([getTitleExtras(type, id).catch(() => null), getCurrentUser()]);
  if (!extras) return null;
  const owned: Owned = user ? await getOwnership(user.id) : {};
  const { makers, cast, franchise, similar } = extras;
  const isMovie = type === "movie";

  return (
    <>
      {(makers.length > 0 || cast.length > 0) && (
        <section aria-labelledby="credits" className="mt-24 sm:mt-32">
          <SectionHead id="credits" eyebrow="Elenco e equipe" title={isMovie ? "Quem fez o filme" : "Quem fez a série"} />
          {makers.length > 0 && (
            <p className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">
                {isMovie ? "Direção" : makers.length > 1 ? "Criadores" : "Criação"}
              </span>
              <span className="font-serif text-2xl leading-tight sm:text-3xl">
                <PeopleNames people={makers} />
              </span>
            </p>
          )}
          {cast.length > 0 && (
            <PeopleGrid>
              {cast.map((p) => (
                <PersonTile key={p.id} person={p} />
              ))}
            </PeopleGrid>
          )}
          <p className="mt-10">
            <Link
              href={`${titleHref(type, id)}/cast`}
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-mute transition-colors hover:border-paper/40 hover:text-paper"
            >
              Ver elenco completo e equipe <span aria-hidden>→</span>
            </Link>
          </p>
        </section>
      )}

      {franchise && (
        <section aria-labelledby="franchise" className="mt-24 sm:mt-32">
          <SectionHead
            id="franchise"
            eyebrow={`A franquia · ${franchise.parts.length} filmes`}
            title={franchise.name}
          />
          <Rail>
            {franchise.parts.map((t, i) => (
              <PosterTile
                key={t.id}
                title={t}
                label={`Parte ${i + 1}`}
                current={t.id === id}
                owned={owned[`${t.type}:${t.id}`]}
              />
            ))}
          </Rail>
        </section>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="similar" className="mt-24 sm:mt-32">
          <SectionHead
            id="similar"
            eyebrow="Se você gostou"
            title={isMovie ? "Filmes parecidos" : "Séries parecidas"}
          />
          <Rail>
            {similar.map((t) => (
              <PosterTile key={t.id} title={t} owned={owned[`${t.type}:${t.id}`]} />
            ))}
          </Rail>
        </section>
      )}
    </>
  );
}

export function TitleExtrasSkeleton() {
  return (
    <div className="mt-24 sm:mt-32" aria-label="Carregando" aria-busy>
      <div className="skeleton h-3 w-32 rounded" />
      <div className="skeleton mt-4 h-9 w-64 rounded" />
      <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-6 sm:gap-x-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-square rounded-full" />
            <div className="skeleton mx-auto mt-3 h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
