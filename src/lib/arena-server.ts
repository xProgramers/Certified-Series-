import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ContentType } from "@/db/schema";
import { arenaStats, DECK_SIZE, DECK_STAR_BUDGET, elementFor, type ArenaElement } from "./arena";
import type { MatchCard } from "./arena-game";
import type { CardData } from "./card-types";
import { getCollection, upsertTitle } from "./data";
import { MOCK_CATALOG } from "./mock-catalog";
import { getTitle } from "./tmdb";

const { titles, arenaMatches } = schema;

/**
 * The computer's decks. Each challenge draws 5 cards from a pool of
 * well-known titles (real TMDB ids, shared with the sample catalog), always
 * within the same 15-star budget as the player.
 */
export type Challenge = {
  key: string;
  name: string;
  tagline: string;
  /** The element the deck leans on; null = mixed. */
  element: ArenaElement | null;
};

export const CHALLENGES: Challenge[] = [
  { key: "suspense", name: "Noite de Suspense", tagline: "Crimes, mistérios e ninguém dorme direito.", element: "suspense" },
  { key: "fantasy", name: "Maratona Sci-Fi", tagline: "Outros mundos, outras regras.", element: "fantasy" },
  { key: "action", name: "Ação Total", tagline: "Explosões, perseguições e família.", element: "action" },
  { key: "comedy", name: "Sessão Comédia", tagline: "Risadas que derrubam qualquer drama.", element: "comedy" },
  { key: "prestige", name: "Clássicos de Prestígio", tagline: "Os mais premiados, num deck só.", element: null },
];

// Prestige: a hand-picked mix (TMDB ids)
const PRESTIGE: [ContentType, number][] = [
  ["series", 87108], ["series", 76331], ["movie", 872585], ["series", 1438], ["movie", 238],
  ["series", 60059], ["movie", 13], ["series", 136315], ["movie", 496243], ["series", 67744],
];

function poolFor(c: Challenge): [ContentType, number][] {
  if (!c.element) return PRESTIGE;
  return MOCK_CATALOG.filter((m) => elementFor(m.genres) === c.element).map((m) => [m.type, m.id]);
}

export function findChallenge(key: string) {
  return CHALLENGES.find((c) => c.key === key) ?? null;
}

/** One challenge is featured each week, in turn. */
export function weeklyChallenge(now = new Date()) {
  const week = Math.floor(now.getTime() / (7 * 24 * 3600 * 1000));
  return CHALLENGES[week % CHALLENGES.length];
}

const refKey = (type: ContentType, id: number) => `${type}:${id}`;

function parseRef(key: string): [ContentType, number] {
  const [type, id] = key.split(":");
  return [type as ContentType, Number(id)];
}

function combinations<T>(list: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (list.length < k) return [];
  const [head, ...rest] = list;
  return [...combinations(rest, k - 1).map((c) => [head, ...c]), ...combinations(rest, k)];
}

/**
 * Builds the computer's deck: stats from TMDB (titles are cached so the match
 * can show them), then a random legal deck from the stronger half of the
 * legal ones, so a challenge is tough but beatable.
 */
export async function buildOpponentDeck(c: Challenge, random = Math.random): Promise<MatchCard[]> {
  const pool = poolFor(c);
  const details = await Promise.all(pool.map(([type, id]) => getTitle(type, id).catch(() => null)));
  const cards: MatchCard[] = [];
  for (const d of details) {
    if (!d) continue;
    const stats = arenaStats({
      type: d.type,
      voteAverage: d.voteAverage,
      voteCount: d.voteCount,
      episodes: d.numberOfEpisodes,
      runtime: d.runtime,
      genres: d.genres,
    });
    if (!stats) continue;
    await upsertTitle(d);
    cards.push({ key: refKey(d.type, d.id), ...stats });
  }
  const strength = (deck: MatchCard[]) => deck.reduce((n, x) => n + x.power + x.defense, 0);
  const legal = combinations(cards, DECK_SIZE)
    .filter((deck) => deck.reduce((n, x) => n + x.stars, 0) <= DECK_STAR_BUDGET)
    .sort((a, b) => strength(b) - strength(a));
  if (legal.length) {
    const top = legal.slice(0, Math.max(1, Math.ceil(legal.length / 2)));
    return top[Math.floor(random() * top.length)];
  }
  // Pool too strong for the budget: the weakest cards make the deck
  return [...cards].sort((a, b) => a.stars - b.stars).slice(0, DECK_SIZE);
}

/** Card data for the computer's cards, read from the title cache. */
export async function opponentCards(deck: MatchCard[], ownerName: string): Promise<CardData[]> {
  const refs = deck.map((c) => parseRef(c.key));
  const rows = refs.length
    ? await db
        .select()
        .from(titles)
        .where(inArray(titles.id, refs.map(([, id]) => id)))
    : [];
  return deck.map((card, i) => {
    const [type, id] = refs[i];
    const t = rows.find((r) => r.type === type && r.id === id);
    return {
      entryId: card.key,
      contentType: type,
      contentId: id,
      title: t?.name ?? "—",
      startYear: t?.startYear ?? null,
      endYear: t?.endYear ?? null,
      seasons: type === "series" ? (t?.numberOfSeasons ?? null) : null,
      runtime: type === "movie" ? (t?.runtime ?? null) : null,
      genres: t?.genres ?? [],
      posterPath: t?.posterPath ?? null,
      backdropPath: t?.backdropPath ?? null,
      status: "completed",
      rating: null,
      certification: null,
      reflection: "",
      addedAt: new Date(0).toISOString(),
      completedAt: null,
      collectionNumber: i + 1,
      viewingNumber: 1,
      ownerName,
      ownerUsername: "",
      isFavorite: false,
      isPublic: true,
      palette: null,
      // Stats frozen at the start of the match
      arena: { power: card.power, defense: card.defense, element: card.element, stars: card.stars },
    } satisfies CardData;
  });
}

/** The user's cards that can join a deck: completed, with stats. */
export async function playableCards(userId: string) {
  const cards = await getCollection(userId, { includePrivate: true });
  return cards.filter((c) => c.status === "completed" && c.arena);
}

export async function getMatch(id: string, userId: string) {
  const match = await db.query.arenaMatches.findFirst({
    where: and(eq(arenaMatches.id, id), eq(arenaMatches.userId, userId)),
  });
  if (!match) return null;
  const challenge = findChallenge(match.challenge) ?? CHALLENGES[0];
  const own = await getCollection(userId, { includePrivate: true });
  const playerCards = match.playerDeck.map((card): CardData | null => {
    const c = own.find((x) => x.entryId === card.key);
    // Frozen stats win over today's, so a refresh never changes a match
    return c ? { ...c, arena: { power: card.power, defense: card.defense, element: card.element, stars: card.stars } } : null;
  });
  return {
    match,
    challenge,
    playerCards: playerCards.filter((c): c is CardData => c != null),
    opponentCards: await opponentCards(match.opponentDeck, challenge.name),
  };
}
