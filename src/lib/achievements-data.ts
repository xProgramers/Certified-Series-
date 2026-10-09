import "server-only";
import { and, countDistinct, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { evaluate, type AchievementKey, type CompletedWork, type Earned, type FranchiseInfo } from "./achievements";
import { getCollection, upsertTitle } from "./data";
import { getFranchise, getTitle } from "./tmdb";

const { titles, watchEntries, franchises, userAchievements } = schema;

const FRANCHISE_TTL = 30 * 24 * 3600 * 1000;
const FETCH_LIMIT = 20;

/**
 * Titles cached before achievements existed have no directors/creators or
 * franchise yet: fetch them again, a few per sync, never failing the caller.
 */
async function fillTitleMeta(userId: string) {
  const missing = await db
    .selectDistinct({ type: titles.type, id: titles.id })
    .from(watchEntries)
    .innerJoin(titles, and(eq(titles.type, watchEntries.contentType), eq(titles.id, watchEntries.contentId)))
    .where(and(eq(watchEntries.userId, userId), eq(watchEntries.status, "completed"), isNull(titles.makers)))
    .limit(FETCH_LIMIT);
  await Promise.allSettled(
    missing.map(async ({ type, id }) => {
      const d = await getTitle(type, id);
      if (d) await upsertTitle(d);
    }),
  );
}

/** Franchises of the user's finished films, refreshed monthly so a new sequel is noticed. */
async function fillFranchises(collectionIds: number[]) {
  if (!collectionIds.length) return;
  const known = await db
    .select({ id: franchises.id, checkedAt: franchises.checkedAt })
    .from(franchises)
    .where(inArray(franchises.id, collectionIds));
  const fresh = new Set(known.filter((f) => f.checkedAt.getTime() > Date.now() - FRANCHISE_TTL).map((f) => f.id));
  const stale = collectionIds.filter((id) => !fresh.has(id)).slice(0, FETCH_LIMIT);
  await Promise.allSettled(
    stale.map(async (id) => {
      const f = await getFranchise(id);
      if (!f) return;
      const values = { name: f.name, parts: f.parts, checkedAt: new Date() };
      await db.insert(franchises).values({ id, ...values }).onConflictDoUpdate({ target: franchises.id, set: values });
    }),
  );
}

/**
 * Re-derives a user's achievements from the collection and stores the
 * difference. Returns the ones earned just now (for the unlock moment).
 * Achievements follow the cards: deleting the card that earned one, or
 * changing the rating it rested on, takes it away again.
 */
export async function syncAchievements(userId: string): Promise<Earned[]> {
  await fillTitleMeta(userId);

  // The cards as the collection shows them: a series waiting on a new season is not complete
  const cards = (await getCollection(userId, { includePrivate: true })).filter(
    (c) => c.status === "completed" && c.rating != null && c.certification,
  );
  const meta = new Map<string, typeof titles.$inferSelect>();
  const rows = await db
    .selectDistinct({ t: titles })
    .from(watchEntries)
    .innerJoin(titles, and(eq(titles.type, watchEntries.contentType), eq(titles.id, watchEntries.contentId)))
    .where(and(eq(watchEntries.userId, userId), eq(watchEntries.status, "completed")));
  for (const { t } of rows) meta.set(`${t.type}:${t.id}`, t);

  const works: CompletedWork[] = cards.map((c) => {
    const t = meta.get(`${c.contentType}:${c.contentId}`);
    return {
      entryId: c.entryId,
      contentType: c.contentType,
      contentId: c.contentId,
      at: Date.parse(c.certifiedAt ?? c.completedAt ?? c.addedAt),
      addedAt: Date.parse(c.addedAt),
      completedAt: Date.parse(c.completedAt ?? c.addedAt),
      rating: c.rating!,
      certification: c.certification!,
      genres: c.genres,
      startYear: c.startYear,
      episodes: t?.numberOfEpisodes ?? null,
      runtime: t?.runtime ?? null,
      voteAverage: t?.voteAverage ?? null,
      voteCount: t?.voteCount ?? null,
      collectionId: t?.collectionId ?? null,
      makers: t?.makers ?? [],
    };
  });

  const collectionIds = [...new Set(works.map((w) => w.collectionId).filter((id): id is number => id != null))];
  await fillFranchises(collectionIds);
  const franchiseRows = collectionIds.length
    ? await db.select().from(franchises).where(inArray(franchises.id, collectionIds))
    : [];
  const franchiseMap = new Map<number, FranchiseInfo>(
    franchiseRows.map((f) => [f.id, { id: f.id, name: f.name, released: f.parts.filter((p) => p.released).map((p) => p.id) }]),
  );

  const earned = evaluate(works, franchiseMap);
  const held = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  const id = (a: { key: string; scope: string }) => `${a.key}|${a.scope}`;
  const earnedIds = new Set(earned.map(id));
  const heldById = new Map(held.map((h) => [id(h), h]));

  const gone = held.filter((h) => !earnedIds.has(id(h)));
  for (const h of gone) {
    await db
      .delete(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.key, h.key), eq(userAchievements.scope, h.scope)));
  }
  const fresh: Earned[] = [];
  for (const e of earned) {
    const h = heldById.get(id(e));
    if (h && h.entryId === e.entryId && h.label === e.label && h.earnedAt.getTime() === e.earnedAt) continue;
    if (!h) fresh.push(e);
    const values = { entryId: e.entryId, label: e.label, earnedAt: new Date(e.earnedAt) };
    await db
      .insert(userAchievements)
      .values({ userId, key: e.key, scope: e.scope, ...values })
      .onConflictDoUpdate({ target: [userAchievements.userId, userAchievements.key, userAchievements.scope], set: values });
  }
  return fresh;
}

export type HeldAchievement = {
  key: AchievementKey;
  scope: string;
  label: string | null;
  earnedAt: string; // ISO
  entryId: string;
};

export async function getUserAchievements(userId: string): Promise<HeldAchievement[]> {
  const rows = await db
    .select({
      key: userAchievements.key,
      scope: userAchievements.scope,
      label: userAchievements.label,
      earnedAt: userAchievements.earnedAt,
      entryId: userAchievements.entryId,
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  return rows.map((r) => ({ ...r, key: r.key as AchievementKey, earnedAt: r.earnedAt.toISOString() }));
}

/**
 * How many collectors hold each achievement, against everyone with at least
 * one finished card. Rarity is what makes a seal worth showing.
 */
export async function getRarity() {
  const [base] = await db
    .select({ n: countDistinct(watchEntries.userId) })
    .from(watchEntries)
    .where(eq(watchEntries.status, "completed"));
  const rows = await db
    .select({ key: userAchievements.key, n: countDistinct(userAchievements.userId) })
    .from(userAchievements)
    .groupBy(userAchievements.key);
  const collectors = base?.n ?? 0;
  const share: Partial<Record<AchievementKey, number>> = {};
  for (const r of rows) share[r.key as AchievementKey] = collectors ? r.n / collectors : 0;
  return { collectors, share };
}
