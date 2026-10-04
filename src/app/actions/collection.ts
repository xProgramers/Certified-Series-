"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import type { CardData } from "@/lib/card-types";
import { getEntry, nextCollectionNumber, nextViewingNumber, upsertSeries } from "@/lib/data";
import { getSeries } from "@/lib/tmdb";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const paletteSchema = z.object({ accent: hex, base: hex, glow: hex }).nullable();

const entryFields = {
  rating: z
    .number()
    .min(0)
    .max(10)
    .refine((v) => Number.isInteger(v * 2), "A nota usa passos de 0.5."),
  reflection: z.string().trim().max(600, "A reflexão pode ter até 600 caracteres."),
  isPublic: z.boolean(),
  watchedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => {
      const t = Date.parse(d + "T12:00:00Z");
      return t > Date.parse("1950-01-01") && t <= Date.now() + 36 * 3600 * 1000;
    }, "Data inválida."),
};

const completeSchema = z.object({
  seriesId: z.number().int().positive(),
  palette: paletteSchema,
  ...entryFields,
});

export async function completeSeries(input: z.input<typeof completeSchema>): Promise<Result<CardData>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre na sua conta para criar cards." };
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  // Metadata always comes from TMDB on the server, never from the client
  const detail = await getSeries(v.seriesId);
  if (!detail) return { ok: false, error: "Série não encontrada." };
  await upsertSeries(detail);

  const id = crypto.randomUUID();
  // Retry once in case two completions race for the same collection number
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await db.insert(schema.watchEntries).values({
        id,
        userId: user.id,
        seriesId: v.seriesId,
        collectionNumber: await nextCollectionNumber(user.id),
        viewingNumber: await nextViewingNumber(user.id, v.seriesId),
        ratingHalves: Math.round(v.rating * 2),
        reflection: v.reflection,
        isPublic: v.isPublic,
        palette: v.palette,
        watchedAt: new Date(v.watchedAt + "T12:00:00Z"),
      });
      break;
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }

  revalidatePath(`/u/${user.username}`);
  revalidatePath(`/series/${v.seriesId}`);
  const card = await getEntry(id);
  return card ? { ok: true, data: card } : { ok: false, error: "Erro ao criar o card." };
}

const updateSchema = z.object({ entryId: z.string().uuid(), ...entryFields });

export async function updateEntry(input: z.input<typeof updateSchema>): Promise<Result<CardData>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const res = await db
    .update(schema.watchEntries)
    .set({
      ratingHalves: Math.round(v.rating * 2),
      reflection: v.reflection,
      isPublic: v.isPublic,
      watchedAt: new Date(v.watchedAt + "T12:00:00Z"),
    })
    .where(and(eq(schema.watchEntries.id, v.entryId), eq(schema.watchEntries.userId, user.id)))
    .returning({ seriesId: schema.watchEntries.seriesId });
  if (!res.length) return { ok: false, error: "Card não encontrado." };

  revalidatePath(`/u/${user.username}`);
  revalidatePath(`/series/${res[0].seriesId}`);
  const card = await getEntry(v.entryId);
  return card ? { ok: true, data: card } : { ok: false, error: "Card não encontrado." };
}

export async function deleteEntry(entryId: string): Promise<Result<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  if (!z.string().uuid().safeParse(entryId).success) return { ok: false, error: "Card inválido." };
  const res = await db
    .delete(schema.watchEntries)
    .where(and(eq(schema.watchEntries.id, entryId), eq(schema.watchEntries.userId, user.id)))
    .returning({ seriesId: schema.watchEntries.seriesId });
  if (!res.length) return { ok: false, error: "Card não encontrado." };
  revalidatePath(`/u/${user.username}`);
  revalidatePath(`/series/${res[0].seriesId}`);
  return { ok: true, data: null };
}

export async function toggleFavorite(seriesId: number): Promise<Result<boolean>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  if (!Number.isInteger(seriesId) || seriesId <= 0) return { ok: false, error: "Série inválida." };

  const watched = await db.query.watchEntries.findFirst({
    where: and(eq(schema.watchEntries.userId, user.id), eq(schema.watchEntries.seriesId, seriesId)),
    columns: { id: true },
  });
  if (!watched) return { ok: false, error: "Conclua a série antes de favoritá-la." };

  const where = and(eq(schema.favorites.userId, user.id), eq(schema.favorites.seriesId, seriesId));
  const existing = await db.query.favorites.findFirst({ where });
  if (existing) await db.delete(schema.favorites).where(where);
  else await db.insert(schema.favorites).values({ userId: user.id, seriesId });

  revalidatePath(`/u/${user.username}`);
  revalidatePath(`/series/${seriesId}`);
  return { ok: true, data: !existing };
}
