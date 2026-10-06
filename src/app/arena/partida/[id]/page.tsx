import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Duel } from "@/components/arena/Duel";
import { getMatch } from "@/lib/arena-server";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Partida · Arena" };

export default async function MatchPage({ params }: PageProps<"/arena/partida/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/arena/partida/${id}`);
  const data = await getMatch(id, user.id);
  if (!data) notFound();
  return (
    <Duel
      matchId={data.match.id}
      challenge={data.challenge}
      playerName={user.displayName}
      playerCards={data.playerCards}
      opponentCards={data.opponentCards}
      initialRounds={data.match.rounds}
      initialStatus={data.match.status}
    />
  );
}
