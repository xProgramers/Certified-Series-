import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";

const { notifications, titles } = schema;

/** Cookie holding this device's push token, so signing out stops its notifications. */
export const PUSH_COOKIE = "cs_push";

export async function unreadNotifications(userId: string) {
  const [r] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return r?.n ?? 0;
}

/** The bell: latest notices first, with the series poster. */
export async function listNotifications(userId: string, limit = 60) {
  return db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      url: notifications.url,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      posterPath: titles.posterPath,
    })
    .from(notifications)
    .leftJoin(titles, and(eq(titles.type, notifications.contentType), eq(titles.id, notifications.contentId)))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export type NotificationItem = Awaited<ReturnType<typeof listNotifications>>[number];
