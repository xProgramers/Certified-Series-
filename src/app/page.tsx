import Link from "next/link";
import { SeriesCard } from "@/components/card/SeriesCard";
import { getCurrentUser } from "@/lib/auth";
import type { CardData } from "@/lib/card-types";
import { getShowcase } from "@/lib/data";
import { sampleCards } from "@/lib/sample-cards";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, showcase] = await Promise.all([getCurrentUser(), getShowcase(9)]);
  const cards: CardData[] = showcase.length >= 5 ? showcase : sampleCards();
  const fan = cards.slice(0, 5);
  const shelf = cards.slice(0, 9);

  return (
    <div className="overflow-x-clip">
      {/* ——— Hero ——— */}
      <section className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-4 pb-16 pt-4 sm:px-8 sm:pt-12 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pb-24 lg:pt-0">
        <div className="relative z-10 rise">
          <p className="eyebrow">Uma coleção de séries assistidas</p>
          <h1 className="mt-6 font-serif text-[clamp(3.4rem,7.4vw,7rem)] leading-[0.88] tracking-[-0.025em]">
            Seu repertório,
            <br />
            <em className="text-mute">em cartaz.</em>
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-mute">
            Cada série que você termina vira um card: o pôster, a sua nota e o que ela significou para você.
            Juntos, eles contam quem você é.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={user ? "/search" : "/signup"}
              className="rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-white"
            >
              {user ? "Adicionar uma série" : "Começar minha coleção"}
            </Link>
            <Link
              href={`/u/${user?.username ?? cards[0]?.ownerUsername ?? "luan"}`}
              className="rounded-full border border-line-strong px-6 py-3.5 text-sm text-paper transition-colors hover:border-gold/50"
            >
              {user ? "Ver minha coleção" : "Ver uma coleção"}
            </Link>
          </div>
        </div>

        {/* Fanned cards */}
        <div className="relative order-first -mx-4 h-[400px] sm:mx-0 sm:h-[640px] lg:order-none lg:h-[760px]" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.07] blur-[100px]" />
          {fan.map((c, i) => {
            const pos = [
              { x: -78, y: 8, r: -11, z: 1, d: 260 },
              { x: -40, y: 2, r: -5, z: 2, d: 160 },
              { x: 0, y: -2, r: 0, z: 5, d: 40 },
              { x: 40, y: 2, r: 5, z: 2, d: 160 },
              { x: 78, y: 8, r: 11, z: 1, d: 260 },
            ][i];
            return (
              <div
                key={c.entryId}
                className="absolute left-1/2 top-1/2 w-[46%] max-w-[330px] sm:w-[38%]"
                style={{
                  zIndex: pos.z,
                  transform: `translate(calc(-50% + ${pos.x}%), calc(-50% + ${pos.y}%)) rotate(${pos.r}deg) scale(${i === 2 ? 1.06 : 0.92})`,
                  filter: i === 2 ? undefined : "brightness(.72)",
                }}
              >
                <div className="sc-reveal" style={{ animationDelay: `${pos.d}ms` }}>
                  <SeriesCard card={c} priority />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ——— Manifesto ——— */}
      <section className="border-y border-line bg-ink-1/60">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-8 md:grid-cols-3 md:py-20">
          {[
            ["01", "Busque", "Encontre a série que você acabou de terminar."],
            ["02", "Certifique", "Dê sua nota, de 0 a 10, e escreva o que ficou depois dos créditos."],
            ["03", "Coleção", "O card entra para o seu repertório, pronto para salvar e compartilhar."],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-5">
              <span className="font-mono text-xs tracking-[0.3em] text-gold">{n}</span>
              <div>
                <h2 className="font-serif text-3xl leading-none">{t}</h2>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Shelf ——— */}
      <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="font-serif text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-tight">
            Não é uma lista.
            <br />
            <em className="text-mute">É uma coleção.</em>
          </h2>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-6 sm:-mx-8 sm:px-8 [scrollbar-width:none]">
          {shelf.map((c) => (
            <div key={c.entryId} className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-[300px]">
              <SeriesCard card={c} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
