"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { DECK_SIZE, DECK_STAR_BUDGET } from "@/lib/arena";
import { isLegalDeck, opponentPick, outcome, resolveRound, ROUNDS, type MatchCard, type RoundResult } from "@/lib/arena-game";
import { buildOpponentDeck, findChallenge, playableCards } from "@/lib/arena-server";
import { getCurrentUser } from "@/lib/auth";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const { arenaMatches } = schema;

const startSchema = z.object({
  entryIds: z.array(z.string().min(1).max(64)).length(DECK_SIZE),
  challenge: z.string().max(32),
});

/** Starts a match: the deck is checked and frozen here, never trusted from the client. */
export async function startMatch(input: z.infer<typeof startSchema>): Promise<Result<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre na sua conta para jogar." };
  const parsed = startSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.entryIds).size !== DECK_SIZE) return { ok: false, error: "Escolha 5 cartas diferentes." };
  const challenge = findChallenge(parsed.data.challenge);
  if (!challenge) return { ok: false, error: "Desafio não encontrado." };

  const playable = await playableCards(user.id);
  const deck: MatchCard[] = [];
  for (const id of parsed.data.entryIds) {
    const c = playable.find((x) => x.entryId === id);
    if (!c?.arena) return { ok: false, error: "Só cartas concluídas entram no deck." };
    deck.push({ key: c.entryId, ...c.arena });
  }
  if (!isLegalDeck(deck)) return { ok: false, error: `O deck pode ter no máximo ${DECK_STAR_BUDGET} estrelas.` };

  const opponent = await buildOpponentDeck(challenge);
  if (opponent.length < DECK_SIZE) return { ok: false, error: "Não foi possível montar o deck do desafio agora. Tente de novo." };

  const id = crypto.randomUUID();
  await db.insert(arenaMatches).values({ id, userId: user.id, challenge: challenge.key, playerDeck: deck, opponentDeck: opponent });
  return { ok: true, data: { id } };
}

/**
 * Plays one round. The computer's card is chosen here from its remaining
 * cards and the player's remaining cards, without looking at the player's pick.
 */
export async function playRound(matchId: string, entryId: string): Promise<Result<{ round: RoundResult; status: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre na sua conta para jogar." };
  const match = await db.query.arenaMatches.findFirst({
    where: and(eq(arenaMatches.id, String(matchId)), eq(arenaMatches.userId, user.id)),
  });
  if (!match) return { ok: false, error: "Partida não encontrada." };
  if (match.status !== "playing") return { ok: false, error: "Essa partida já terminou." };

  const i = match.rounds.length;
  const used = (key: "playerKey" | "opponentKey") => new Set(match.rounds.map((r) => r[key]));
  const myLeft = match.playerDeck.filter((c) => !used("playerKey").has(c.key));
  const theirLeft = match.opponentDeck.filter((c) => !used("opponentKey").has(c.key));
  const mine = myLeft.find((c) => c.key === entryId);
  if (!mine) return { ok: false, error: "Essa carta já foi usada." };

  const theirs = opponentPick(i, theirLeft, myLeft);
  const round = resolveRound(i, mine, theirs);
  const rounds = [...match.rounds, round];
  const status = rounds.length >= ROUNDS ? outcome(rounds) : "playing";

  // Only the expected round lands: a double click cannot play twice
  const res = await db
    .update(arenaMatches)
    .set({ rounds, status })
    .where(and(eq(arenaMatches.id, match.id), eq(arenaMatches.status, "playing"), eq(arenaMatches.updatedAt, match.updatedAt)));
  if (res.rowsAffected === 0) return { ok: false, error: "A rodada já foi jogada. Recarregue a página." };
  return { ok: true, data: { round, status } };
}
