import type { Metadata } from "next";
import { TitlePage } from "@/components/TitlePage";
import { getTitle } from "@/lib/tmdb";

type Props = PageProps<"/series/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTitle("series", Number((await params).id)).catch(() => null);
  return { title: t?.name ?? "Série" };
}

export default async function SeriesPage({ params }: Props) {
  return <TitlePage type="series" id={Number((await params).id)} />;
}
