import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { SearchClient } from "@/components/SearchClient";
import { getCurrentUser } from "@/lib/auth";
import { popularSeries, tmdbConfigured } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Buscar" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q, welcome } = await searchParams;
  const user = await getCurrentUser();
  const [popular, watched] = await Promise.all([
    popularSeries().catch(() => []),
    user
      ? db
          .select({ seriesId: schema.watchEntries.seriesId, n: schema.watchEntries.collectionNumber })
          .from(schema.watchEntries)
          .where(eq(schema.watchEntries.userId, user.id))
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-32 pt-12 sm:px-8 sm:pt-16">
      {welcome && (
        <p className="rise mb-8 font-serif text-2xl italic text-gold">
          Bem-vindo, {user?.displayName}. Qual foi a última série que você terminou?
        </p>
      )}
      <SearchClient
        initialQuery={typeof q === "string" ? q : ""}
        popular={popular}
        watched={Object.fromEntries(watched.map((w) => [w.seriesId, w.n]))}
        sample={!tmdbConfigured()}
      />
    </div>
  );
}
