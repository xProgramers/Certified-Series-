import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { ContentType } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCardDate, formatRating, formatRuntime, formatYears, titleHref } from "@/lib/card-types";
import { backfillWatchedSeasons, getLatestEntry, nextCollectionNumber, upsertTitle } from "@/lib/data";
import { backdropUrl, posterUrl } from "@/lib/images";
import { getTitle } from "@/lib/tmdb";
import { AddButton } from "./AddButton";
import { CompleteButton, type WorkForCard } from "./CompleteDialog";
import { OwnedCard } from "./OwnedCard";
import { RewatchButton } from "./RewatchButton";
import { SeasonsSection } from "./SeasonsSection";
import { TitleExtras, TitleExtrasSkeleton } from "./TitleExtras";

/** Title page shared by /series/[id] and /movies/[id]. */
export async function TitlePage({ type, id }: { type: ContentType; id: number }) {
  const [title, user] = await Promise.all([getTitle(type, id), getCurrentUser()]);
  if (!title) notFound();

  let entry = user ? await getLatestEntry(user.id, type, id) : null;
  if (user && entry && type === "series" && title.seasonList) {
    // The page just fetched the seasons: store them so a new season shows on the card now
    await upsertTitle(title);
    await backfillWatchedSeasons(user.id);
    entry = await getLatestEntry(user.id, type, id);
  }
  // Rated, but a released season is unmarked: the card is back in black & white
  const pendingSeasons = entry?.status === "in_progress" && entry.rating != null;
  const missingSeasons =
    pendingSeasons && entry?.seasonList
      ? entry.seasonList.filter((s) => s.state === "released" && !entry.watchedSeasons?.includes(s.number)).map((s) => s.number)
      : [];
  const nextNumber = user ? await nextCollectionNumber(user.id) : 1;

  const backdrop = backdropUrl(title.backdropPath, "w1280");
  const poster = posterUrl(title.posterPath, "w500");
  const years = formatYears(title.year, title.endYear);
  const work: WorkForCard = {
    contentType: type,
    contentId: title.id,
    title: title.name,
    startYear: title.year,
    endYear: title.endYear,
    seasons: type === "series" ? title.numberOfSeasons : null,
    runtime: type === "movie" ? title.runtime : null,
    genres: title.genres,
    posterPath: title.posterPath,
    backdropPath: title.backdropPath,
  };
  const owner = user ? { name: user.displayName, username: user.username } : null;
  const kind = type === "movie" ? "Filme" : "Série";

  const facts: [string, string | number][] =
    type === "movie"
      ? [
          ["Lançamento", title.year ?? "—"],
          ["Duração", title.runtime ? formatRuntime(title.runtime) : "—"],
        ]
      : [
          ["Estreia", title.year ?? "—"],
          ["Temporadas", title.numberOfSeasons ?? "—"],
          ["Episódios", title.numberOfEpisodes ?? "—"],
        ];
  if (title.contentRating) facts.push(["Classificação", title.contentRating]);

  return (
    <article className="relative">
      <div className="absolute inset-x-0 top-0 h-[64vh] min-h-[440px] overflow-hidden" aria-hidden>
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdrop} alt="" className="h-full w-full object-cover opacity-35 fade-in" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-0/30 via-ink-0/75 to-ink-0" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 pb-32 pt-[14vh] sm:px-8 md:pt-[22vh]">
        <div className="grid gap-8 md:grid-cols-[minmax(0,260px)_1fr] md:gap-14">
          <div className="w-36 rise sm:w-44 md:w-full">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={`Pôster de ${title.name}`} className="aspect-[2/3] w-full rounded-lg object-cover" />
            ) : (
              <div className="aspect-[2/3] rounded-lg bg-ink-3" />
            )}
          </div>

          <div className="rise" style={{ animationDelay: "100ms" }}>
            <p className="eyebrow">{[kind, title.networks[0], years].filter(Boolean).join(" · ")}</p>
            <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.9] tracking-[-0.025em]">{title.name}</h1>
            {title.originalName && <p className="mt-3 font-serif text-xl italic text-mute">{title.originalName}</p>}

            <dl className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">{k}</dt>
                  <dd className="mt-1.5 font-serif text-2xl leading-none">{v}</dd>
                </div>
              ))}
            </dl>

            {title.genres.length > 0 && <p className="mt-6 text-sm text-mute">{title.genres.join(" · ")}</p>}
            {title.tagline && <p className="mt-7 font-serif text-2xl italic text-paper/80">{title.tagline}</p>}
            {title.overview && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-mute">{title.overview}</p>}

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              {!owner ? (
                <Link
                  href={`/login?next=${titleHref(type, id)}`}
                  className="inline-flex rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-hi"
                >
                  Entre para adicionar à coleção
                </Link>
              ) : !entry ? (
                <>
                  <AddButton type={type} id={id} owned={undefined} signedIn variant="primary" />
                  <CompleteButton
                    work={work}
                    owner={owner}
                    nextNumber={nextNumber}
                    viewingNumber={1}
                    label="Já terminei"
                    variant="text"
                  />
                </>
              ) : pendingSeasons ? (
                <a href="#seasons" className="text-sm text-mute underline-offset-4 hover:text-paper hover:underline">
                  <span className="text-gold">✦</span> {seasonLabel(missingSeasons, entry.newSeason)}
                </a>
              ) : entry.status === "in_progress" ? (
                <CompleteButton work={work} owner={owner} entry={entry} nextNumber={nextNumber} viewingNumber={entry.viewingNumber} />
              ) : (
                <p className="text-sm text-mute">
                  <span className="text-gold">✓</span> Na sua coleção
                </p>
              )}
            </div>
          </div>
        </div>

        {entry && owner && (
          <section aria-labelledby="your-card" className="mt-20 pt-4 sm:mt-28">
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,340px)_1fr] md:gap-16">
              <OwnedCard card={entry} />
              <div>
                <p id="your-card" className="eyebrow">
                  {pendingSeasons
                    ? `Na sua coleção · ${entry.newSeason ? "nova temporada" : "temporadas pendentes"}`
                    : entry.status === "in_progress"
                      ? `Na sua coleção · em andamento desde ${formatCardDate(entry.addedAt)}`
                      : `Na sua coleção · concluído em ${formatCardDate(entry.completedAt ?? entry.addedAt)}`}
                </p>
                {pendingSeasons ? (
                  <>
                    <p className="mt-5 max-w-md font-serif text-3xl italic leading-snug text-paper/90">
                      {entry.newSeason
                        ? "Saiu temporada nova. O card voltou ao preto e branco até você marcar que terminou."
                        : "O card voltou ao preto e branco até todas as temporadas estarem marcadas."}
                    </p>
                    <p className="mt-6 font-mono text-sm text-mute">
                      Sua nota continua guardada: {formatRating(entry.rating ?? 0)} / 10
                    </p>
                  </>
                ) : entry.status === "in_progress" ? (
                  <>
                    <p className="mt-5 max-w-md font-serif text-3xl italic leading-snug text-paper/90">
                      {type === "series"
                        ? "O card espera em preto e branco. Marque as temporadas que terminou; com todas marcadas, ele ganha cor."
                        : "O card espera em preto e branco. Quando terminar, ele ganha cor."}
                    </p>
                    <div className="mt-8">
                      <CompleteButton work={work} owner={owner} entry={entry} nextNumber={nextNumber} viewingNumber={entry.viewingNumber} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                      <span className="font-serif text-7xl leading-none">{formatRating(entry.rating ?? 0)}</span>
                      <span className="font-mono text-sm text-dim">/ 10</span>
                      <span
                        className={`ml-2 font-mono text-xs tracking-widest ${
                          entry.certification === "certified" ? "text-gold" : "text-paper/70"
                        }`}
                      >
                        {entry.certification === "certified" ? "✓ CERTIFIED" : "✕ NOT CERTIFIED"}
                      </span>
                    </p>
                    {entry.reflection ? (
                      <blockquote className="mt-8 max-w-xl border-l border-gold/40 pl-6 font-serif text-2xl italic leading-relaxed text-paper/90">
                        {entry.reflection}
                      </blockquote>
                    ) : (
                      <p className="mt-8 text-mute">Você ainda não escreveu uma reflexão.</p>
                    )}
                    <div className="mt-10 flex flex-wrap items-center gap-6">
                      <OwnedCard card={entry} asEditButton />
                      <RewatchButton type={type} id={id} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {type === "series" && title.seasonList && title.seasonList.length > 0 && (
          <SeasonsSection
            work={work}
            seasons={title.seasonList}
            entry={entry}
            owner={owner}
            nextNumber={nextNumber}
            loginHref={`/login?next=${titleHref(type, id)}`}
          />
        )}

        <Suspense fallback={<TitleExtrasSkeleton />}>
          <TitleExtras type={type} id={id} />
        </Suspense>
      </div>
    </article>
  );
}

function seasonLabel(missing: number[], isNew?: boolean) {
  const nums = missing.join(", ").replace(/, (\d+)$/, " e $1");
  if (isNew) return `${missing.length > 1 ? `Novas temporadas ${nums}` : `Nova temporada ${nums}`} · marque quando terminar`;
  return missing.length > 1 ? `Falta marcar as temporadas ${nums}` : `Falta marcar a temporada ${nums}`;
}
