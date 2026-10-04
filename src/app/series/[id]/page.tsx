import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompleteButton, type SeriesForCard } from "@/components/CompleteDialog";
import { OwnedCard } from "@/components/OwnedCard";
import { getCurrentUser } from "@/lib/auth";
import { formatCardDate, formatRating, formatYears } from "@/lib/card-types";
import { getLatestEntry, nextCollectionNumber } from "@/lib/data";
import { backdropUrl, posterUrl } from "@/lib/images";
import { getSeries } from "@/lib/tmdb";

type Props = PageProps<"/series/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getSeries(Number((await params).id)).catch(() => null);
  return { title: s?.name ?? "Série" };
}

export default async function SeriesPage({ params }: Props) {
  const id = Number((await params).id);
  const [series, user] = await Promise.all([getSeries(id), getCurrentUser()]);
  if (!series) notFound();

  const entry = user ? await getLatestEntry(user.id, id) : null;
  const nextNumber = user ? await nextCollectionNumber(user.id) : 1;

  const backdrop = backdropUrl(series.backdropPath, "w1280");
  const poster = posterUrl(series.posterPath, "w500");
  const years = formatYears(series.firstAirYear, series.lastAirYear);
  const forCard: SeriesForCard = {
    seriesId: series.id,
    title: series.name,
    firstAirYear: series.firstAirYear,
    lastAirYear: series.lastAirYear,
    seasons: series.numberOfSeasons,
    genres: series.genres,
    posterPath: series.posterPath,
    backdropPath: series.backdropPath,
  };
  const owner = user ? { name: user.displayName, username: user.username } : null;

  return (
    <article className="relative">
      {/* Backdrop */}
      <div className="absolute inset-x-0 top-0 -z-0 h-[78vh] min-h-[520px] overflow-hidden" aria-hidden>
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdrop} alt="" className="h-full w-full object-cover opacity-60 fade-in" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-0/40 via-ink-0/70 to-ink-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-0/90 via-ink-0/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 pb-32 pt-[22vh] sm:px-8 md:pt-[28vh]">
        <div className="grid gap-10 md:grid-cols-[minmax(0,300px)_1fr] md:gap-14 lg:gap-20">
          <div className="mx-auto w-52 md:w-full rise">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt={`Pôster de ${series.name}`}
                className="aspect-[2/3] w-full rounded-xl object-cover shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] ring-1 ring-line"
              />
            ) : (
              <div className="aspect-[2/3] rounded-xl bg-ink-3 ring-1 ring-line" />
            )}
          </div>

          <div className="rise" style={{ animationDelay: "100ms" }}>
            <p className="eyebrow">{[series.networks[0], years].filter(Boolean).join(" · ")}</p>
            <h1 className="mt-4 font-serif text-[clamp(3rem,7vw,6.5rem)] leading-[0.88] tracking-[-0.025em]">{series.name}</h1>
            {series.originalName && <p className="mt-3 font-serif text-xl italic text-mute">{series.originalName}</p>}

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {[
                ["Estreia", series.firstAirYear ?? "—"],
                ["Temporadas", series.numberOfSeasons ?? "—"],
                ["Episódios", series.numberOfEpisodes ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">{k}</dt>
                  <dd className="mt-1.5 font-serif text-2xl leading-none">{v}</dd>
                </div>
              ))}
            </dl>

            {series.genres.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2" aria-label="Gêneros">
                {series.genres.map((g) => (
                  <li key={g} className="rounded-full border border-line-strong px-3 py-1 text-xs text-mute">
                    {g}
                  </li>
                ))}
              </ul>
            )}

            {series.tagline && <p className="mt-8 font-serif text-2xl italic text-paper/80">{series.tagline}</p>}
            {series.overview && <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-mute">{series.overview}</p>}

            <div className="mt-10">
              {!owner ? (
                <Link
                  href={`/login?next=/series/${series.id}`}
                  className="inline-flex rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-white"
                >
                  Entre para marcar como concluída
                </Link>
              ) : (
                // Stays mounted after completion (trigger hidden) so the reveal survives the server refresh
                <CompleteButton
                  series={forCard}
                  owner={owner}
                  nextNumber={entry ? entry.collectionNumber : nextNumber}
                  viewingNumber={1}
                  hideTrigger={!!entry}
                />
              )}
            </div>
          </div>
        </div>

        {entry && owner && (
          <section aria-labelledby="your-card" className="mt-24 border-t border-line pt-16">
            <div className="grid items-center gap-12 md:grid-cols-[minmax(0,380px)_1fr] md:gap-20">
              <OwnedCard card={entry} />
              <div>
                <p id="your-card" className="eyebrow">
                  Na sua coleção · concluída em {formatCardDate(entry.watchedAt)}
                </p>
                <p className="mt-5 flex items-baseline gap-3">
                  <span className="font-serif text-7xl leading-none">{formatRating(entry.rating)}</span>
                  <span className="font-mono text-sm text-dim">/ 10</span>
                  {entry.isFavorite && <span className="ml-2 font-mono text-xs tracking-widest text-gold">✦ FAVORITA</span>}
                </p>
                {entry.reflection ? (
                  <blockquote className="mt-8 max-w-xl border-l border-gold/40 pl-6 font-serif text-2xl italic leading-relaxed text-paper/90">
                    {entry.reflection}
                  </blockquote>
                ) : (
                  <p className="mt-8 text-mute">Você ainda não escreveu uma reflexão para esta série.</p>
                )}
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <OwnedCard card={entry} asEditButton />
                  <CompleteButton
                    series={forCard}
                    owner={owner}
                    nextNumber={nextNumber}
                    viewingNumber={entry.viewingNumber + 1}
                    label="Assisti de novo"
                    variant="text"
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
