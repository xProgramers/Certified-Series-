import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MedalRow } from "@/components/achievements/AchievementsView";
import { CollectionView } from "@/components/CollectionView";
import { byPrestige } from "@/lib/achievements";
import { getUserAchievements, syncAchievements } from "@/lib/achievements-data";
import { getCurrentUser } from "@/lib/auth";
import { computeStats, getCollection, getUserByUsername, refreshSeasons } from "@/lib/data";
import { mailto } from "@/lib/site";

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  return { title: user ? `${user.displayName} — coleção` : "Perfil" };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { new: highlight } = await searchParams;
  const [user, viewer] = await Promise.all([getUserByUsername(username), getCurrentUser()]);
  if (!user) notFound();

  const isOwner = viewer?.id === user.id;
  // New seasons turn finished series back to black & white before the cards are read
  await refreshSeasons(user.id).catch(() => {});
  // Seals follow the cards (and fill in for collections from before achievements)
  await syncAchievements(user.id).catch((e) => console.error("achievements sync failed", e));
  const [cards, held] = await Promise.all([
    getCollection(user.id, { includePrivate: isOwner }),
    getUserAchievements(user.id),
  ]);
  const topSeals = [...new Set([...held].sort(byPrestige).map((h) => h.key))].slice(0, 5);
  const s = computeStats(cards);

  // Numbers stay secondary: one quiet line, the collection is the page
  const line = [
    plural(s.total, "obra", "obras"),
    plural(s.series, "série", "séries"),
    plural(s.movies, "filme", "filmes"),
    plural(s.certified, "certificada", "certificadas"),
    s.notCertified ? plural(s.notCertified, "não certificada", "não certificadas") : null,
    s.inProgress ? `${s.inProgress} em andamento` : null,
  ].filter(Boolean);

  return (
    <div className="spotlight">
      <div className="mx-auto max-w-[1440px] px-4 pb-32 sm:px-8">
        <header className="flex flex-col gap-6 pb-10 pt-10 sm:flex-row sm:items-end sm:justify-between sm:pb-14 sm:pt-16">
          <div className="rise min-w-0">
            <p className="eyebrow mb-4">{isOwner ? "Sua coleção" : "Coleção"}</p>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.03em]">{user.displayName}</h1>
            {user.bio && <p className="mt-3 max-w-xl font-serif text-xl italic leading-snug text-mute">{user.bio}</p>}
            {s.total > 0 && (
              <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-dim sm:text-[11px] sm:tracking-[0.18em]">
                {line.join(" · ")}
              </p>
            )}
            {(held.length > 0 || isOwner) && (
              <Link
                href={`/u/${user.username}/conquistas`}
                className="group mt-5 inline-flex max-w-full flex-wrap items-center gap-3 text-sm text-mute transition-colors hover:text-paper"
              >
                {topSeals.length > 0 && <MedalRow keys={topSeals} />}
                <span>
                  Conquistas
                  <span className="ml-2 font-mono text-[11px] text-dim">{held.length}</span>
                </span>
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            )}
          </div>
          {isOwner && cards.length > 0 && (
            <Link
              href="/search"
              className="rise inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-paper px-5 py-2.5 text-sm text-ink-0 transition-colors hover:bg-hi sm:self-auto"
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Adicionar obra
            </Link>
          )}
        </header>

        <CollectionView cards={cards} isOwner={isOwner} highlight={typeof highlight === "string" ? highlight : undefined} />

        {/* Profiles are public, so anyone can flag one that breaks the terms */}
        {!isOwner && (
          <p className="mt-24 text-center text-xs text-dim">
            <a
              href={mailto(`Denúncia do perfil @${user.username}`)}
              className="underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              Denunciar perfil
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
