import type { Metadata } from "next";
import { TitlePage } from "@/components/TitlePage";
import { getTitle } from "@/lib/tmdb";

type Props = PageProps<"/movies/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTitle("movie", Number((await params).id)).catch(() => null);
  return { title: t?.name ?? "Filme" };
}

export default async function MoviePage({ params }: Props) {
  return <TitlePage type="movie" id={Number((await params).id)} />;
}
