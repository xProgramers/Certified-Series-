import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { EpisodeRef } from "@/db/schema";
import { titleHref } from "./card-types";
import { upsertTitle } from "./data";
import { sendPush, type PushMessage } from "./push";
import { getTitle } from "./tmdb";

const { titles, watchEntries, notifications } = schema;

/** An episode older than this when first seen is not news anymore (e.g. the check was down for days). */
const STALE_DAYS = 4;
const KEEP_DAYS = 120;
const CONCURRENCY = 6;

const after = (a: EpisodeRef, b: EpisodeRef) => a.season > b.season || (a.season === b.season && a.episode > b.episode);

function daysAgo(date: string | null) {
  if (!date) return Infinity;
  return (Date.now() - Date.parse(date + "T00:00:00Z")) / 86_400_000;
}

/** What the notice says, from the last episode announced to the one just out. */
export function describe(prev: EpisodeRef, cur: EpisodeRef) {
  const name = cur.name && !/^epis[oó]dio \d+$/i.test(cur.name) ? ` «${cur.name}»` : "";
  if (cur.season > prev.season) {
    return {
      kind: "season" as const,
      body:
        cur.episode === 1
          ? `A temporada ${cur.season} estreou: o episódio 1${name} já saiu.`
          : `A temporada ${cur.season} chegou: ${cur.episode} episódios já disponíveis.`,
    };
  }
  const count = cur.episode - prev.episode;
  return {
    kind: "episode" as const,
    body:
      count === 1
        ? `Episódio ${cur.episode} da temporada ${cur.season}${name} já saiu.`
        : `Episódios ${prev.episode + 1} a ${cur.episode} da temporada ${cur.season} já saíram.`,
  };
}

/**
 * The daily check (Vercel Cron → /api/cron/episodes). For every running series
 * someone has in their collection it reads TMDB fresh, stores the seasons (so
 * cards go back to black & white the day a new season starts) and, when the
 * latest aired episode moved past the one already announced, notifies every
 * user who has the series, in the bell and by push. A series seen for the first
 * time only records its latest episode, so nobody gets a backlog.
 */
export async function checkNewEpisodes() {
  const series = await db
    .selectDistinct({ id: titles.id, name: titles.name, notified: titles.notifiedEpisode })
    .from(titles)
    .innerJoin(watchEntries, and(eq(watchEntries.contentType, titles.type), eq(watchEntries.contentId, titles.id)))
    .where(and(eq(titles.type, "series"), sql`coalesce(${titles.status}, '') not in ('Ended', 'Canceled')`));

  const report = { series: series.length, failed: 0, announced: 0, notifications: 0, pushed: 0 };
  const pushes: PushMessage[] = [];

  for (let i = 0; i < series.length; i += CONCURRENCY) {
    await Promise.all(
      series.slice(i, i + CONCURRENCY).map(async (s) => {
        try {
          const detail = await getTitle("series", s.id, true);
          if (!detail) return;
          await upsertTitle(detail);
          const cur = detail.lastEpisode;
          if (!cur) return;
          const prev = s.notified;
          if (prev && !after(cur, prev)) return;

          await db.update(titles).set({ notifiedEpisode: cur }).where(and(eq(titles.type, "series"), eq(titles.id, s.id)));
          if (!prev || daysAgo(cur.airDate) > STALE_DAYS) return;

          const created = await notify(s.id, detail.name, prev, cur);
          report.announced++;
          report.notifications += created.length;
          pushes.push(...created);
        } catch {
          report.failed++;
        }
      }),
    );
  }

  report.pushed = await sendPush(pushes).catch(() => 0);
  await db.delete(notifications).where(lt(notifications.createdAt, new Date(Date.now() - KEEP_DAYS * 86_400_000)));
  return report;
}

/** One notice per user who has the series; the unique index keeps a re-run from repeating it. */
async function notify(id: number, name: string, prev: EpisodeRef, cur: EpisodeRef): Promise<PushMessage[]> {
  const users = await db
    .selectDistinct({ userId: watchEntries.userId })
    .from(watchEntries)
    .where(and(eq(watchEntries.contentType, "series"), eq(watchEntries.contentId, id)));
  if (users.length === 0) return [];

  const { kind, body } = describe(prev, cur);
  const url = titleHref("series", id);
  const rows = await db
    .insert(notifications)
    .values(
      users.map((u) => ({
        id: crypto.randomUUID(),
        userId: u.userId,
        kind,
        contentType: "series" as const,
        contentId: id,
        season: cur.season,
        episode: cur.episode,
        title: name,
        body,
        url,
      })),
    )
    .onConflictDoNothing()
    .returning({ userId: notifications.userId });
  return rows.map((r) => ({ userId: r.userId, title: name, body, url }));
}
