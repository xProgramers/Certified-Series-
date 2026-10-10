import Link from "next/link";
import { ContentCard } from "@/components/card/ContentCard";
import { SearchClient } from "@/components/SearchClient";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import type { CardData } from "@/lib/card-types";
import { getOwnership, getShowcase } from "@/lib/data";
import { sampleCards } from "@/lib/sample-cards";
import { popularTitles, tmdbConfigured, type SearchType } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const TYPES: Record<string, SearchType> = { series: "series", filmes: "movie" };

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  // Signed in, home is the catalogue: what's out there, beyond the collection
  if (user) return <Explore user={user} params={await searchParams} />;

  const showcase = await getShowcase(8);
  const cards: CardData[] = showcase.length >= 5 ? showcase : sampleCards();

  return (
    <div className="overflow-x-clip">
      <section className="mx-auto max-w-[1440px] px-4 pb-14 pt-10 sm:px-8 sm:pt-24 lg:pt-28">
        <div className="max-w-3xl rise">
          <h1 className="font-serif text-[clamp(2.75rem,7vw,6rem)] leading-[0.9] tracking-[-0.025em]">
            Seu repertório,
            <br />
            <em className="text-mute">em cartaz.</em>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-mute sm:mt-7 sm:text-lg">
            Séries e filmes viram cards. Adicione o que está assistindo, termine, dê sua nota e escreva o que ficou. A
            obra ganha cor e entra para a sua coleção.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9 sm:gap-6">
            <Link
              href="/signup"
              className="rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-hi"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-line px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:border-paper/40"
            >
              Entrar
            </Link>
          </div>
          <Link
            href="/search"
            className="mt-6 inline-flex items-center gap-2 text-sm text-mute underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            Explorar séries e filmes sem conta
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section aria-label="Cards de exemplo" className="pb-20">
        <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 sm:scroll-px-8 pb-6 sm:gap-6 sm:px-8 [&>*:last-child]:mr-4 sm:[&>*:last-child]:mr-8">
          {cards.map((c, i) => (
            <div
              key={c.entryId}
              className="rise w-[62vw] max-w-[300px] shrink-0 snap-start sm:w-[280px]"
              style={{ animationDelay: `${Math.min(i * 70, 500)}ms` }}
            >
              <ContentCard card={c} priority={i < 3} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-28 sm:px-8">
        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {[
            ["Adicione", "Busque uma série ou um filme e coloque na coleção. O card nasce em preto e branco."],
            ["Conclua", "Terminou? Dê sua nota de 0 a 10 e escreva sua reflexão. O card ganha cor."],
            ["Certifique", "Nota 5.0 ou mais: Certified. Abaixo disso: Not certified. É a sua opinião, com assinatura."],
          ].map(([t, d], i) => (
            <li key={t}>
              <p className="font-mono text-[11px] tracking-[0.3em] text-dim">0{i + 1}</p>
              <h2 className="mt-3 font-serif text-3xl leading-none">{t}</h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

async function Explore({ user, params }: { user: SessionUser; params: Awaited<PageProps<"/">["searchParams"]> }) {
  const { q, tipo } = params;
  const type = (typeof tipo === "string" && TYPES[tipo]) || "all";
  const [popular, owned] = await Promise.all([popularTitles(type).catch(() => []), getOwnership(user.id)]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-8 sm:px-8 sm:pt-14">
      <p className="eyebrow mb-3">Olá, {user.displayName}</p>
      <SearchClient
        initialQuery={typeof q === "string" ? q : ""}
        initialType={type}
        popular={popular}
        owned={owned}
        signedIn
        sample={!tmdbConfigured()}
        autoFocus={false}
      />
    </div>
  );
}
