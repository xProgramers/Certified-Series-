import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArenaView } from "@/components/ArenaView";
import { getCurrentUser } from "@/lib/auth";
import { DECK_SIZE, DECK_STAR_BUDGET } from "@/lib/arena";
import { backfillVotes, getCollection } from "@/lib/data";

export const metadata: Metadata = { title: "Arena" };

export default async function ArenaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/arena");

  // Titles cached before the Arena get their TMDB votes before the cards are read
  await backfillVotes(user.id).catch(() => {});
  const cards = (await getCollection(user.id, { includePrivate: true })).filter((c) => c.status === "completed");
  const missing = Math.max(0, DECK_SIZE - cards.length);

  return (
    <div className="spotlight">
      <div className="mx-auto max-w-[1440px] px-4 pb-32 sm:px-8">
        <header className="pb-10 pt-10 sm:pb-14 sm:pt-16">
          <div className="rise max-w-2xl">
            <p className="eyebrow mb-4">Card game</p>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.9] tracking-[-0.03em]">Arena</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              Toda obra concluída vira uma carta de jogo. O poder vem da nota do público, a defesa do tamanho do
              fã-clube e da duração, e o gênero decide quem leva vantagem. Toque numa carta para ver o verso.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-dim sm:text-[11px] sm:tracking-[0.18em]">
              {cards.length} {cards.length === 1 ? "carta pronta" : "cartas prontas"} · deck de {DECK_SIZE} cartas · até{" "}
              {DECK_STAR_BUDGET} ★
            </p>
          </div>
        </header>

        {cards.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl italic text-mute">Nenhuma carta pronta ainda.</p>
            <p className="mt-3 text-sm text-dim">Só obras concluídas entram na Arena.</p>
            <Link href={`/u/${user.username}`} className="mt-6 inline-block rounded-full bg-paper px-5 py-2.5 text-sm text-ink-0 hover:bg-hi">
              Ver minha coleção
            </Link>
          </div>
        ) : (
          <ArenaView cards={cards} missing={missing} />
        )}
      </div>
    </div>
  );
}
