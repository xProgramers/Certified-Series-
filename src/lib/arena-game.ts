import { beats, DECK_SIZE, DECK_STAR_BUDGET, ELEMENT_BONUS, type ArenaElement, type ArenaStats } from "./arena";

/**
 * Arena match rules, shared by the server (which resolves every round) and
 * the client (which only displays them).
 *   Rounds 1 and 3: the player attacks. Rounds 2 and 4: the opponent attacks.
 *   Attack: attacker's Power vs defender's Defense; a tie goes to the defender.
 *   Round 5, the Climax: Power + Defense on both sides; tie → higher Power.
 *   A card whose element beats the other's gets +10 in that round.
 */

export const ROUNDS = DECK_SIZE;

/** A card frozen into a match: its stats are those it had when the match started. */
export type MatchCard = ArenaStats & {
  /** Player: watch entry id. Opponent: "series:1396" / "movie:603". */
  key: string;
};

export type RoundKind = "attack" | "defend" | "climax";

/** What the player does in round i (0-based). */
export function roundKind(i: number): RoundKind {
  if (i === ROUNDS - 1) return "climax";
  return i % 2 === 0 ? "attack" : "defend";
}

export type RoundResult = {
  playerKey: string;
  opponentKey: string;
  kind: RoundKind;
  /** Values compared, bonus included. */
  playerValue: number;
  opponentValue: number;
  playerBonus: number;
  opponentBonus: number;
  /** 1 player, -1 opponent, 0 nobody. */
  winner: 1 | -1 | 0;
};

const bonus = (a: ArenaElement, b: ArenaElement) => (beats(a, b) ? ELEMENT_BONUS : 0);

export function resolveRound(i: number, me: MatchCard, them: MatchCard): RoundResult {
  const kind = roundKind(i);
  const myBonus = bonus(me.element, them.element);
  const theirBonus = bonus(them.element, me.element);
  let mine: number;
  let theirs: number;
  let winner: 1 | -1 | 0;
  if (kind === "climax") {
    mine = me.power + me.defense + myBonus;
    theirs = them.power + them.defense + theirBonus;
    winner = mine > theirs ? 1 : theirs > mine ? -1 : me.power > them.power ? 1 : them.power > me.power ? -1 : 0;
  } else if (kind === "attack") {
    mine = me.power + myBonus;
    theirs = them.defense + theirBonus;
    winner = mine > theirs ? 1 : -1;
  } else {
    mine = me.defense + myBonus;
    theirs = them.power + theirBonus;
    winner = theirs > mine ? -1 : 1;
  }
  return {
    playerKey: me.key,
    opponentKey: them.key,
    kind,
    playerValue: mine,
    opponentValue: theirs,
    playerBonus: myBonus,
    opponentBonus: theirBonus,
    winner,
  };
}

export function score(rounds: RoundResult[]) {
  return {
    player: rounds.filter((r) => r.winner === 1).length,
    opponent: rounds.filter((r) => r.winner === -1).length,
  };
}

export type MatchOutcome = "won" | "lost" | "draw";

export function outcome(rounds: RoundResult[]): MatchOutcome {
  const s = score(rounds);
  return s.player > s.opponent ? "won" : s.player < s.opponent ? "lost" : "draw";
}

export function deckStars(cards: Pick<ArenaStats, "stars">[]) {
  return cards.reduce((n, c) => n + c.stars, 0);
}

export function isLegalDeck(cards: Pick<ArenaStats, "stars">[]) {
  return cards.length === DECK_SIZE && deckStars(cards) <= DECK_STAR_BUDGET;
}

function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));
}

/**
 * The computer's pick for round i. It never sees the player's choice: it
 * plans the order of its remaining cards against every card the player may
 * still play, and now and then (`slip`) plays a random card so it can be beaten.
 */
export function opponentPick(i: number, mine: MatchCard[], theirs: MatchCard[], random = Math.random, slip = 0.2) {
  if (random() < slip) return mine[Math.floor(random() * mine.length)];
  const rounds = Array.from({ length: mine.length }, (_, k) => i + k);
  let best: { v: number; card: MatchCard } | null = null;
  for (const order of permutations(mine)) {
    let v = 0;
    order.forEach((card, k) => {
      for (const t of theirs) v -= resolveRound(rounds[k], t, card).winner;
    });
    if (!best || v > best.v) best = { v, card: order[0] };
  }
  return best!.card;
}
