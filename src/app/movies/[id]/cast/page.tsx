import type { Metadata } from "next";
import { CastPage } from "@/components/CastPage";
import { getTitle } from "@/lib/tmdb";

type Props = PageProps<"/movies/[id]/cast">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTitle("movie", Number((await params).id)).catch(() => null);
  return { title: `Elenco · ${t?.name ?? "Filme"}` };
}

export default async function Page({ params }: Props) {
  return <CastPage type="movie" id={Number((await params).id)} />;
}
