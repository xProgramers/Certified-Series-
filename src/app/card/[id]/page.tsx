import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddButton } from "@/components/AddButton";
import { ContentCard } from "@/components/card/ContentCard";
import { WhereToWatch } from "@/components/WhereToWatch";
import { getCurrentUser } from "@/lib/auth";
import {
  cardHref,
  formatCollectionNumber,
  formatRating,
  titleHref,
  TYPE_LABEL,
} from "@/lib/card-types";
import { getEntry, getLatestEntry } from "@/lib/data";
import { backdropUrl, posterUrl } from "@/lib/images";
import { shareDescription, workFacts } from "@/lib/share";

type Props = PageProps<"/card/[id]">;

/**
 * The page a shared card opens on. A public card shows the card itself, the
 * owner's rating and reflection; a private one only the work, so a link never
 * reveals what its owner kept to themselves. Both lead to "Onde assistir",
 * adding the work to your own collection and the full title page.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getEntry(id).catch(() => null);
  if (!card) return { title: "Card" };
  // Link previews are fetched signed out: only what a stranger may see goes in them
  const title = card.isPublic ? `${card.title} · card de ${card.ownerName}` : card.title;
  const description = shareDescription(card);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: cardHref(card.entryId),
      siteName: "Certified Series",
      locale: "pt_BR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedCardPage({ params }: Props) {
  const { id } = await params;
  const [card, viewer] = await Promise.all([getEntry(id).catch(() => null), getCurrentUser()]);
  if (!card) notFound();

  const isOwner = viewer?.username === card.ownerUsername;
  const visible = card.isPublic || isOwner;
  const own = viewer ? await getLatestEntry(viewer.id, card.contentType, card.contentId) : null;
  const completed = card.status === "completed" && card.rating != null;
  const certified = card.certification === "certified";
  const backdrop = backdropUrl(card.backdropPath, "w1280");
  const poster = posterUrl(card.posterPath, "w500");

  return (
    <article className="relative">
      <div className="absolute inset-x-0 top-0 h-[64vh] min-h-[440px] overflow-hidden" aria-hidden>
        {backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdrop} alt="" className="h-full w-full object-cover opacity-30 fade-in" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-0/30 via-ink-0/75 to-ink-0" />
      </div>

      <div className="relative mx-auto max-w-[1100px] px-4 pb-32 pt-10 sm:px-8 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,400px)_1fr] md:gap-16">
          <div className="mx-auto w-full max-w-[min(400px,78vw)] rise">
            {visible ? (
              <ContentCard card={card} posterSize="w780" priority />
            ) : poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={`Pôster de ${card.title}`} className="mx-auto aspect-[2/3] w-full max-w-[280px] rounded-lg object-cover" />
            ) : null}
          </div>

          <div className="rise" style={{ animationDelay: "120ms" }}>
            <p className="eyebrow">
              {visible ? (
                <>
                  Card de{" "}
                  <Link href={`/u/${card.ownerUsername}`} className="underline-offset-4 hover:text-paper hover:underline">
                    @{card.ownerUsername}
                  </Link>{" "}
                  · N° {formatCollectionNumber(card.collectionNumber)}
                  {isOwner && !card.isPublic && " · privado"}
                </>
              ) : (
                TYPE_LABEL[card.contentType].one
              )}
            </p>
            <h1 className="mt-3 font-serif text-[clamp(2.6rem,6vw,4.75rem)] leading-[0.92] tracking-[-0.025em]">{card.title}</h1>
            <p className="mt-3 text-sm text-mute">{workFacts(card).join(" · ")}</p>

            {visible &&
              (completed ? (
                <p className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <span className="font-serif text-6xl leading-none">{formatRating(card.rating ?? 0)}</span>
                  <span className="font-mono text-sm text-dim">/ 10</span>
                  <span className={`ml-2 font-mono text-xs tracking-widest ${certified ? "text-gold" : "text-paper/70"}`}>
                    {certified ? "✓ CERTIFIED" : "✕ NOT CERTIFIED"}
                  </span>
                </p>
              ) : (
                <p className="mt-7 font-mono text-sm text-mute">{card.rating != null ? "Temporadas pendentes" : "Em andamento"}</p>
              ))}
            {visible && completed && card.reflection && (
              <blockquote className="mt-7 max-w-xl border-l border-gold/40 pl-5 font-serif text-xl italic leading-relaxed text-paper/90 sm:text-2xl">
                {card.reflection}
              </blockquote>
            )}

            <Suspense fallback={null}>
              <WhereToWatch type={card.contentType} id={card.contentId} />
            </Suspense>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {viewer ? (
                <AddButton
                  type={card.contentType}
                  id={card.contentId}
                  owned={own ? { status: own.status, n: own.collectionNumber } : undefined}
                  signedIn
                  variant="primary"
                />
              ) : (
                <Link
                  href={`/login?next=${cardHref(card.entryId)}`}
                  className="inline-flex rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-hi"
                >
                  Entre para adicionar à coleção
                </Link>
              )}
              <Link
                href={titleHref(card.contentType, card.contentId)}
                className="inline-flex rounded-full border border-line-strong px-6 py-3.5 text-sm text-paper transition-colors hover:border-gold/50"
              >
                Ver detalhes completos
              </Link>
            </div>

            {visible && !isOwner && (
              <Link
                href={`/u/${card.ownerUsername}`}
                className="group mt-8 inline-flex items-center gap-2 text-sm text-mute transition-colors hover:text-paper"
              >
                Ver a coleção de {card.ownerName}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
