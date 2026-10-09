import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AchievementsView, type Tile } from "@/components/achievements/AchievementsView";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getRarity, getUserAchievements, syncAchievements } from "@/lib/achievements-data";
import { getCurrentUser } from "@/lib/auth";
import { getCollection, getUserByUsername, refreshSeasons } from "@/lib/data";

type Props = PageProps<"/u/[username]/conquistas">;

/** Below this many collectors a percentage says nothing about rarity. */
const RARITY_MIN_COLLECTORS = 10;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  return { title: user ? `${user.displayName} — conquistas` : "Conquistas" };
}

export default async function AchievementsPage({ params }: Props) {
  const { username } = await params;
  const [user, viewer] = await Promise.all([getUserByUsername(username), getCurrentUser()]);
  if (!user) notFound();
  const isOwner = viewer?.id === user.id;

  await refreshSeasons(user.id).catch(() => {});
  await syncAchievements(user.id).catch((e) => console.error("achievements sync failed", e));
  const [held, cards, rarity] = await Promise.all([
    getUserAchievements(user.id),
    getCollection(user.id, { includePrivate: true }),
    getRarity(),
  ]);
  const byEntry = new Map(cards.map((c) => [c.entryId, c]));

  const tiles: Tile[] = ACHIEVEMENTS.map((def) => ({
    key: def.key,
    share: rarity.collectors >= RARITY_MIN_COLLECTORS ? (rarity.share[def.key] ?? 0) : null,
    instances: held
      .filter((h) => h.key === def.key)
      .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
      .map((h) => {
        const card = byEntry.get(h.entryId);
        const visible = card && (isOwner || card.isPublic);
        return {
          label: h.label,
          earnedAt: h.earnedAt,
          cardTitle: visible ? card.title : null,
          cardHref: visible ? `/u/${user.username}?new=${card.entryId}` : null,
        };
      }),
  }));
  const earnedKinds = tiles.filter((t) => t.instances.length).length;

  return (
    <div className="spotlight">
      <div className="mx-auto max-w-[1440px] px-4 pb-32 sm:px-8">
        <header className="pb-14 pt-10 sm:pb-20 sm:pt-16">
          <div className="rise">
            <Link href={`/u/${user.username}`} className="eyebrow transition-colors hover:text-paper">
              ← {isOwner ? "Sua coleção" : `Coleção de ${user.displayName}`}
            </Link>
            <h1 className="mt-4 font-serif text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.03em]">Conquistas</h1>
            <p className="mt-3 max-w-xl font-serif text-xl italic leading-snug text-mute">
              {held.length
                ? isOwner
                  ? "Cada selo foi cunhado por um card da sua coleção."
                  : `Cada selo foi cunhado por um card de ${user.displayName}.`
                : isOwner
                  ? "Conclua obras para cunhar seus primeiros selos."
                  : "Nenhum selo cunhado ainda."}
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-dim sm:text-[11px] sm:tracking-[0.18em]">
              {earnedKinds} de {ACHIEVEMENTS.length} conquistas · {held.length} {held.length === 1 ? "selo" : "selos"}
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-mute">
              Toda conquista vem de um card concluído. Toque em qualquer medalha para ver a regra com um exemplo. Se um card
              for apagado ou a nota mudar, o selo que dependia dele sai junto.
            </p>
          </div>
        </header>
        <AchievementsView tiles={tiles} isOwner={isOwner} />
      </div>
    </div>
  );
}
