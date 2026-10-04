import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/CollectionView";
import { getCurrentUser } from "@/lib/auth";
import { computeStats, getCollection, getUserByUsername } from "@/lib/data";

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  return { title: user ? `${user.displayName} — coleção` : "Perfil" };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { new: highlight } = await searchParams;
  const [user, viewer] = await Promise.all([getUserByUsername(username), getCurrentUser()]);
  if (!user) notFound();

  const isOwner = viewer?.id === user.id;
  const cards = await getCollection(user.id, { includePrivate: isOwner });
  const stats = computeStats(cards);

  const statItems = [
    ["Nota média", stats.average != null ? stats.average.toFixed(1) : "—"],
    ["Gênero mais visto", stats.topGenre ?? "—"],
    ["Temporadas", String(stats.seasons)],
    ["Favoritas", String(stats.favorites)],
    ["Obras-primas", String(stats.masterpieces)],
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 sm:px-8">
      <header className="relative flex flex-col gap-10 pb-10 pt-12 sm:pt-16 lg:flex-row lg:items-end lg:justify-between">
        <div className="rise">
          <p className="eyebrow">
            Repertório de @{user.username}
          </p>
          <h1 className="mt-4 font-serif text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.85] tracking-[-0.03em]">
            {user.displayName}
          </h1>
          <p className="mt-5 max-w-xl font-serif text-2xl italic leading-snug text-mute">
            <span className="not-italic text-paper">{stats.total}</span>{" "}
            {stats.total === 1 ? "série concluída" : "séries concluídas"}
            {user.bio ? <span className="text-dim"> — {user.bio}</span> : null}
          </p>
        </div>
        {stats.total > 0 && (
          <dl className="rise grid grid-cols-2 gap-x-10 gap-y-5 sm:flex sm:flex-wrap lg:justify-end lg:pb-2" style={{ animationDelay: "120ms" }}>
            {statItems.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-dim">{k}</dt>
                <dd className="mt-1.5 font-serif text-2xl leading-none text-paper/90">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <CollectionView cards={cards} isOwner={isOwner} highlight={typeof highlight === "string" ? highlight : undefined} />
    </div>
  );
}
