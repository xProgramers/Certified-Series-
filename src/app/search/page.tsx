import type { Metadata } from "next";
import { SearchClient } from "@/components/SearchClient";
import { getCurrentUser } from "@/lib/auth";
import { getOwnership } from "@/lib/data";
import { popularTitles, tmdbConfigured, type SearchType } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Buscar" };

const TYPES: Record<string, SearchType> = { series: "series", filmes: "movie" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q, welcome, tipo } = await searchParams;
  const type = (typeof tipo === "string" && TYPES[tipo]) || "all";
  const user = await getCurrentUser();
  const [popular, owned] = await Promise.all([
    popularTitles(type).catch(() => []),
    user ? getOwnership(user.id) : Promise.resolve({}),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-10 sm:px-8 sm:pt-16">
      {welcome && (
        <p className="rise mb-8 font-serif text-2xl italic text-gold">
          Bem-vindo, {user?.displayName}. O que você está assistindo agora?
        </p>
      )}
      <SearchClient
        initialQuery={typeof q === "string" ? q : ""}
        initialType={type}
        popular={popular}
        owned={owned}
        signedIn={!!user}
        sample={!tmdbConfigured()}
      />
    </div>
  );
}
