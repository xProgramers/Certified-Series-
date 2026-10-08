import type { Metadata } from "next";
import { CastPage } from "@/components/CastPage";
import { getTitle } from "@/lib/tmdb";

type Props = PageProps<"/series/[id]/cast">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTitle("series", Number((await params).id)).catch(() => null);
  return { title: `Elenco · ${t?.name ?? "Série"}` };
}

export default async function Page({ params }: Props) {
  return <CastPage type="series" id={Number((await params).id)} />;
}
