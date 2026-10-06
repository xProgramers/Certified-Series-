import type { ContentType } from "@/db/schema";

/**
 * Arena: the card game. Every number comes from TMDB data, so a work has the
 * same stats for everybody; the user's own rating never changes them.
 *   Power   → audience score, weighted by how many votes back it
 *   Defense → size of the fan base (votes) and the length of the work
 *   Element → genre, in a cycle where each one beats the next
 *   Stars   → Power + Defense in five bands; a deck has 5 cards and at most 15 stars
 * Rules and balance tests: the "Certified Series Arena: regras do jogo" doc.
 */

export type ArenaElement = "action" | "suspense" | "comedy" | "drama" | "fantasy";

export type ArenaStats = {
  power: number;
  defense: number;
  element: ArenaElement;
  stars: 1 | 2 | 3 | 4 | 5;
};

export type ArenaInput = {
  type: ContentType;
  voteAverage: number | null;
  voteCount: number | null;
  /** Series only. */
  episodes: number | null;
  /** Movies only, minutes. */
  runtime: number | null;
  genres: string[];
};

export const DECK_SIZE = 5;
export const DECK_STAR_BUDGET = 15;
/** Stat bonus for the card whose element beats the other one's. */
export const ELEMENT_BONUS = 10;

/** Each element beats the next one: Action → Suspense → Comedy → Drama → Fantasy → Action. */
export const ELEMENT_CYCLE: ArenaElement[] = ["action", "suspense", "comedy", "drama", "fantasy"];

export function beats(a: ArenaElement, b: ArenaElement) {
  const i = ELEMENT_CYCLE.indexOf(a);
  return ELEMENT_CYCLE[(i + 1) % ELEMENT_CYCLE.length] === b;
}

/** Card labels are in English, like the rest of the card. */
export const ELEMENT_LABEL: Record<ArenaElement, string> = {
  action: "Action",
  suspense: "Suspense",
  comedy: "Comedy",
  drama: "Drama",
  fantasy: "Fantasy",
};

/** The prior a few votes are pulled toward, and how many votes it counts as. */
const PRIOR_SCORE = 6.8;
const PRIOR_VOTES = 1000;

/** Upper bounds of Power + Defense for 1–4 stars; quintiles of a sample of well-known titles. */
const STAR_BANDS = [84, 104, 119, 133] as const;

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const stat = (x: number) => clamp(Math.round(x), 10, 99);

// Genre names as TMDB returns them in pt-BR (TV genres are partly untranslated)
const STRONG: [ArenaElement, string[]][] = [
  ["action", ["ação", "action & adventure", "ação e aventura", "guerra", "war & politics", "guerra e política", "faroeste"]],
  ["suspense", ["terror", "thriller", "crime", "mistério"]],
  ["fantasy", ["ficção científica", "fantasia", "sci-fi & fantasy", "ficção científica e fantasia"]],
  ["comedy", ["comédia"]],
];
// Broad genres that only decide when nothing more specific is there
const WEAK: [ArenaElement, string[]][] = [
  ["action", ["aventura"]],
  ["comedy", ["animação", "família", "kids", "infantil"]],
];

function lookup(table: [ArenaElement, string[]][], genre: string) {
  const g = genre.trim().toLowerCase();
  return table.find(([, names]) => names.includes(g))?.[0];
}

/** First specific genre in TMDB's order, then a broad one; Drama when nothing else fits. */
export function elementFor(genres: string[]): ArenaElement {
  for (const table of [STRONG, WEAK]) {
    for (const g of genres) {
      const hit = lookup(table, g);
      if (hit) return hit;
    }
  }
  return "drama";
}

/** Null until the title has TMDB vote data. */
export function arenaStats(t: ArenaInput): ArenaStats | null {
  if (t.voteAverage == null || t.voteCount == null) return null;
  const votes = Math.max(0, t.voteCount);
  const weighted = (t.voteAverage * votes + PRIOR_SCORE * PRIOR_VOTES) / (votes + PRIOR_VOTES);
  const power = stat((weighted - 6) * 30);

  // 100 votes → 0, ~31k votes → 100
  const fans = clamp((Math.log10(Math.max(votes, 1)) - 2) * 40, 0, 100);
  const length =
    t.type === "series"
      ? t.episodes
        ? clamp(18 * Math.log(t.episodes) - 5, 0, 100)
        : 0
      : t.runtime
        ? clamp((t.runtime - 75) * 0.8, 0, 100)
        : 0;
  const defense = stat(0.5 * fans + 0.35 * length);

  const total = power + defense;
  const band = STAR_BANDS.findIndex((max) => total <= max);
  const stars = (band === -1 ? 5 : band + 1) as ArenaStats["stars"];
  return { power, defense, element: elementFor(t.genres), stars };
}
