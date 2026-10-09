import type { ContentType } from "@/db/schema";

/**
 * Achievements (conquistas): the catalogue and the rules, shared by the server
 * (which awards them) and the client (which draws the seals).
 *
 * Two families:
 *   obra  → earned by one card; repeatable (one per work, franchise or
 *           director) and its seal is pinned to that card
 *   marco → milestones of the whole collection, earned once; the card that
 *           crossed the line carries the seal
 */

export type Tier = "bronze" | "silver" | "gold" | "platinum";
/** Silhouette of the medal: coin for a work, rosette for a body of work, octagon for milestones. */
export type MedalShape = "coin" | "rosette" | "octagon";

export type AchievementKey =
  | "estreia"
  | "acervo-10"
  | "acervo-25"
  | "acervo-50"
  | "acervo-100"
  | "saga"
  | "autor"
  | "maratona"
  | "odisseia"
  | "joia"
  | "cinemateca"
  | "voz-propria"
  | "implacavel"
  | "prisma";

export type AchievementDef = {
  key: AchievementKey;
  name: string;
  /** One line of story: why the seal exists. */
  story: string;
  /** How it is earned, plainly. */
  rule: string;
  tier: Tier;
  shape: MedalShape;
  family: "obra" | "marco";
  /** Hidden until earned. */
  secret?: boolean;
  /** Roman numeral engraved under the emblem (tiered milestones). */
  numeral?: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "saga",
    name: "Saga Completa",
    story: "Do primeiro ao último filme lançado. A história inteira, sem pular capítulo.",
    rule: "Conclua todos os filmes já lançados de uma franquia.",
    tier: "gold",
    shape: "rosette",
    family: "obra",
  },
  {
    key: "autor",
    name: "Olhar de Autor",
    story: "Cinco obras da mesma mão. Você já reconhece a assinatura de longe.",
    rule: "Conclua 5 obras do mesmo diretor ou criador.",
    tier: "gold",
    shape: "rosette",
    family: "obra",
  },
  {
    key: "odisseia",
    name: "Odisseia",
    story: "Cem episódios ou três horas de sala escura. Poucos chegam ao fim.",
    rule: "Conclua uma série com 100 episódios ou mais, ou um filme de 3 horas ou mais.",
    tier: "gold",
    shape: "coin",
    family: "obra",
  },
  {
    key: "maratona",
    name: "Maratona",
    story: "Começou e não conseguiu parar. A madrugada que o diga.",
    rule: "Conclua uma série de 20 episódios ou mais em até 7 dias depois de adicioná-la.",
    tier: "silver",
    shape: "coin",
    family: "obra",
  },
  {
    key: "joia",
    name: "Joia Rara",
    story: "Quase ninguém viu. Você viu, e certificou.",
    rule: "Dê 8.0 ou mais a uma obra com menos de mil votos no TMDB.",
    tier: "silver",
    shape: "coin",
    family: "obra",
  },
  {
    key: "cinemateca",
    name: "Cinemateca",
    story: "Uma obra com pelo menos quarenta anos, vista como se fosse nova.",
    rule: "Conclua uma obra lançada 40 anos ou mais antes de você assistir.",
    tier: "silver",
    shape: "coin",
    family: "obra",
  },
  {
    key: "voz-propria",
    name: "Voz Própria",
    story: "O mundo disse uma coisa. Você disse outra, com todas as letras.",
    rule: "Dê uma nota 3 pontos ou mais distante da média do público no TMDB.",
    tier: "silver",
    shape: "coin",
    family: "obra",
    secret: true,
  },
  {
    key: "estreia",
    name: "Estreia",
    story: "O primeiro card. Toda coleção começa com um ingresso.",
    rule: "Conclua sua primeira obra.",
    tier: "bronze",
    shape: "octagon",
    family: "marco",
  },
  {
    key: "acervo-10",
    name: "Acervo I",
    story: "Dez obras concluídas. Já não é acaso, é repertório.",
    rule: "Conclua 10 obras.",
    tier: "bronze",
    shape: "octagon",
    family: "marco",
    numeral: "I",
  },
  {
    key: "acervo-25",
    name: "Acervo II",
    story: "Vinte e cinco obras. A estante começa a contar quem você é.",
    rule: "Conclua 25 obras.",
    tier: "silver",
    shape: "octagon",
    family: "marco",
    numeral: "II",
  },
  {
    key: "acervo-50",
    name: "Acervo III",
    story: "Cinquenta obras. Um acervo de verdade.",
    rule: "Conclua 50 obras.",
    tier: "gold",
    shape: "octagon",
    family: "marco",
    numeral: "III",
  },
  {
    key: "acervo-100",
    name: "Acervo IV",
    story: "Cem obras. Uma vida inteira de histórias guardadas.",
    rule: "Conclua 100 obras.",
    tier: "platinum",
    shape: "octagon",
    family: "marco",
    numeral: "IV",
  },
  {
    key: "prisma",
    name: "Prisma",
    story: "Dez gêneros diferentes. Seu gosto não cabe numa prateleira só.",
    rule: "Conclua obras de 10 gêneros diferentes.",
    tier: "gold",
    shape: "octagon",
    family: "marco",
  },
  {
    key: "implacavel",
    name: "Implacável",
    story: "Cinco obras assistidas até o fim, e nenhuma levou seu selo.",
    rule: "Tenha 5 obras NOT CERTIFIED.",
    tier: "silver",
    shape: "octagon",
    family: "marco",
  },
];

export const ACHIEVEMENT_BY_KEY = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a])) as Record<
  AchievementKey,
  AchievementDef
>;

export const TIER_LABEL: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  platinum: "Platina",
};

const TIER_RANK: Record<Tier, number> = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const SHAPE_RANK: Record<MedalShape, number> = { rosette: 0, coin: 1, octagon: 2 };

/** Most prestigious first: the order seals take on a card. */
export function byPrestige(a: { key: AchievementKey }, b: { key: AchievementKey }) {
  const x = ACHIEVEMENT_BY_KEY[a.key];
  const y = ACHIEVEMENT_BY_KEY[b.key];
  return TIER_RANK[x.tier] - TIER_RANK[y.tier] || SHAPE_RANK[x.shape] - SHAPE_RANK[y.shape];
}

/** A seal as a card carries it. */
export type CardBadge = { key: AchievementKey; label: string | null };

/** Seals shown on a card: the two most prestigious, never more. */
export const CARD_BADGE_LIMIT = 2;

/* ——— Rules ——— */

/** A completed card with what the rules look at. */
export type CompletedWork = {
  entryId: string;
  contentType: ContentType;
  contentId: number;
  /** When the card was certified (ms); orders who crossed a line first. */
  at: number;
  addedAt: number;
  /** Completion day (ms). */
  completedAt: number;
  rating: number;
  certification: "certified" | "not_certified";
  genres: string[];
  startYear: number | null;
  episodes: number | null;
  runtime: number | null;
  voteAverage: number | null;
  voteCount: number | null;
  collectionId: number | null;
  makers: string[];
};

export type FranchiseInfo = { id: number; name: string; released: number[] };

export type Earned = {
  key: AchievementKey;
  scope: string;
  label: string | null;
  entryId: string;
  earnedAt: number;
};

const DAY = 24 * 3600 * 1000;

/**
 * Every achievement a collection holds right now. Pure and deterministic: the
 * same cards always give the same seals, each pinned to the card that earned
 * it and dated by that card's certification.
 */
export function evaluate(cards: CompletedWork[], franchises: Map<number, FranchiseInfo>): Earned[] {
  // One card per work: a rewatch never earns twice, the first viewing counts
  const sorted = [...cards].sort((a, b) => a.at - b.at);
  const firstOf = new Map<string, CompletedWork>();
  for (const c of sorted) {
    const k = `${c.contentType}:${c.contentId}`;
    if (!firstOf.has(k)) firstOf.set(k, c);
  }
  const works = [...firstOf.values()];
  const out: Earned[] = [];
  const award = (key: AchievementKey, c: CompletedWork, scope = "", label: string | null = null) =>
    out.push({ key, scope, label, entryId: c.entryId, earnedAt: c.at });
  const nth = (list: CompletedWork[], n: number) => (list.length >= n ? list[n - 1] : null);

  // Milestones
  if (works[0]) award("estreia", works[0]);
  for (const [n, key] of [
    [10, "acervo-10"],
    [25, "acervo-25"],
    [50, "acervo-50"],
    [100, "acervo-100"],
  ] as const) {
    const c = nth(works, n);
    if (c) award(key, c);
  }
  const harsh = nth(
    works.filter((c) => c.certification === "not_certified"),
    5,
  );
  if (harsh) award("implacavel", harsh);
  const genres = new Set<string>();
  for (const c of works) {
    const before = genres.size;
    c.genres.forEach((g) => genres.add(g));
    if (before < 10 && genres.size >= 10) {
      award("prisma", c);
      break;
    }
  }

  // One work, one seal
  for (const c of works) {
    const scope = `${c.contentType}:${c.contentId}`;
    if ((c.contentType === "series" && (c.episodes ?? 0) >= 100) || (c.contentType === "movie" && (c.runtime ?? 0) >= 180))
      award("odisseia", c, scope);
    // Added while still watching ("Já assisti" adds and completes at once, that is no marathon)
    if (c.contentType === "series" && (c.episodes ?? 0) >= 20 && c.at - c.addedAt >= 10 * 60 * 1000 && c.at - c.addedAt <= 7 * DAY)
      award("maratona", c, scope);
    if (c.rating >= 8 && c.voteCount != null && c.voteCount < 1000) award("joia", c, scope);
    if (c.startYear && new Date(c.completedAt).getUTCFullYear() - c.startYear >= 40) award("cinemateca", c, scope);
    if (c.voteAverage != null && (c.voteCount ?? 0) >= 200 && Math.abs(c.rating - c.voteAverage) >= 3)
      award("voz-propria", c, scope);
  }

  // Franchises: every released film done; the one that closed it earns the seal
  const byCollection = new Map<number, CompletedWork[]>();
  for (const c of works) {
    if (c.contentType !== "movie" || c.collectionId == null) continue;
    byCollection.set(c.collectionId, [...(byCollection.get(c.collectionId) ?? []), c]);
  }
  for (const [id, seen] of byCollection) {
    const f = franchises.get(id);
    if (!f || f.released.length < 2) continue;
    const done = new Map(seen.map((c) => [c.contentId, c]));
    if (!f.released.every((p) => done.has(p))) continue;
    const closer = f.released.map((p) => done.get(p)!).sort((a, b) => b.at - a.at)[0];
    award("saga", closer, String(id), f.name);
  }

  // Directors and creators: the fifth work signed by the same name
  const byMaker = new Map<string, CompletedWork[]>();
  for (const c of works) for (const m of new Set(c.makers)) byMaker.set(m, [...(byMaker.get(m) ?? []), c]);
  for (const [name, list] of byMaker) {
    const c = nth(list, 5);
    if (c) award("autor", c, name, name);
  }

  return out;
}
