"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { CONTENT_TYPES, type ContentType } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { certificationFor, titleHref, type CardData } from "@/lib/card-types";
import { getEntry, nextCollectionNumber, nextViewingNumber, releasedSeasons, upsertTitle } from "@/lib/data";
import { getTitle } from "@/lib/tmdb";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const paletteSchema = z.object({ accent: hex, base: hex, glow: hex }).nullable();
const contentRef = {
  contentType: z.enum(CONTENT_TYPES),
  contentId: z.number().int().positive(),
};

const entryFields = {
  rating: z
    .number()
    .min(0)
    .max(10)
    .refine((v) => Number.isInteger(v * 2), "A nota usa passos de 0.5."),
  reflection: z.string().trim().max(600, "A reflexão pode ter até 600 caracteres."),
  isPublic: z.boolean(),
  completedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => {
      const t = Date.parse(d + "T12:00:00Z");
      return t > Date.parse("1950-01-01") && t <= Date.now() + 36 * 3600 * 1000;
    }, "Data inválida."),
};

type EntryFields = z.infer<z.ZodObject<typeof entryFields>>;

/** The columns a rating writes. Certification is always derived here, on the server. */
function ratedColumns(v: EntryFields) {
  return {
    status: "completed" as const,
    ratingHalves: Math.round(v.rating * 2),
    certificationStatus: certificationFor(v.rating),
    reflection: v.reflection,
    isPublic: v.isPublic,
    completedAt: new Date(v.completedAt + "T12:00:00Z"),
  };
}

function revalidate(username: string, type: ContentType, id: number) {
  revalidatePath(`/u/${username}`);
  revalidatePath(titleHref(type, id));
  revalidatePath("/search");
}

/** Metadata always comes from TMDB on the server, never from the client. */
async function cacheTitle(type: ContentType, id: number) {
  const detail = await getTitle(type, id);
  if (!detail) return false;
  await upsertTitle(detail);
  return true;
}

/** Inserts a new entry with the next N°, retrying once if two inserts race for it. */
async function insertEntry(
  userId: string,
  type: ContentType,
  id: number,
  extra: Partial<typeof schema.watchEntries.$inferInsert>,
) {
  const entryId = crypto.randomUUID();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await db.insert(schema.watchEntries).values({
        id: entryId,
        userId,
        contentType: type,
        contentId: id,
        collectionNumber: await nextCollectionNumber(userId),
        viewingNumber: await nextViewingNumber(userId, type, id),
        addedAt: new Date(),
        ...extra,
      });
      break;
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  return entryId;
}

function findInProgress(userId: string, type: ContentType, id: number) {
  return db.query.watchEntries.findFirst({
    where: and(
      eq(schema.watchEntries.userId, userId),
      eq(schema.watchEntries.contentType, type),
      eq(schema.watchEntries.contentId, id),
      eq(schema.watchEntries.status, "in_progress"),
    ),
    columns: { id: true },
  });
}

/**
 * Released seasons of a series, fetching its season list first if the cache
 * has none. Null when TMDB could not tell: a completed entry then keeps
 * watched_seasons null and gets every released season on the next refresh.
 */
async function seasonsReleased(id: number) {
  const cached = await releasedSeasons(id);
  if (cached) return cached;
  await cacheTitle("series", id).catch(() => false);
  return releasedSeasons(id);
}

const addSchema = z.object(contentRef);

/** Adds a work to the collection right away, in progress (black & white card, no certification). */
export async function addToCollection(input: z.input<typeof addSchema>): Promise<Result<CardData>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre na sua conta para montar sua coleção." };
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Obra inválida." };
  const { contentType: type, contentId: id } = parsed.data;

  const existing = await findInProgress(user.id, type, id);
  if (existing) {
    const card = await getEntry(existing.id);
    return card ? { ok: true, data: card } : { ok: false, error: "Erro ao adicionar." };
  }
  if (!(await cacheTitle(type, id))) return { ok: false, error: "Obra não encontrada." };

  let entryId: string;
  try {
    entryId = await insertEntry(user.id, type, id, {
      status: "in_progress",
      watchedSeasons: type === "series" ? [] : null,
    });
  } catch {
    // The one-in-progress index caught a double click
    const again = await findInProgress(user.id, type, id);
    if (!again) return { ok: false, error: "Erro ao adicionar." };
    entryId = again.id;
  }

  revalidate(user.username, type, id);
  const card = await getEntry(entryId);
  return card ? { ok: true, data: card } : { ok: false, error: "Erro ao adicionar." };
}

const completeSchema = z.object({
  /** The in-progress entry being finished; omit to add and complete in one step ("Já assisti"). */
  entryId: z.string().uuid().optional(),
  ...contentRef,
  palette: paletteSchema,
  ...entryFields,
});

/** Completes a work with rating + reflection. The card gains colour and its certification. */
export async function completeEntry(input: z.input<typeof completeSchema>): Promise<Result<CardData>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre na sua conta para criar cards." };
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { contentType: type, contentId: id } = v;
  // Finishing a series means every season released so far was watched
  const seasons = async () => (type === "series" ? { watchedSeasons: await seasonsReleased(id) } : {});

  let entryId = v.entryId;
  if (entryId) {
    const res = await db
      .update(schema.watchEntries)
      .set({ ...ratedColumns(v), palette: v.palette, ...(await seasons()) })
      .where(
        and(
          eq(schema.watchEntries.id, entryId),
          eq(schema.watchEntries.userId, user.id),
          eq(schema.watchEntries.status, "in_progress"),
        ),
      )
      .returning({ id: schema.watchEntries.id });
    if (!res.length) return { ok: false, error: "Esta obra não está em andamento na sua coleção." };
  } else {
    if (!(await cacheTitle(type, id))) return { ok: false, error: "Obra não encontrada." };
    // Finishing something already in progress completes that entry instead of duplicating it
    const open = await findInProgress(user.id, type, id);
    if (open) {
      entryId = open.id;
      await db
        .update(schema.watchEntries)
        .set({ ...ratedColumns(v), palette: v.palette, ...(await seasons()) })
        .where(eq(schema.watchEntries.id, open.id));
    } else {
      entryId = await insertEntry(user.id, type, id, { ...ratedColumns(v), palette: v.palette, ...(await seasons()) });
    }
  }

  revalidate(user.username, type, id);
  const card = await getEntry(entryId);
  return card ? { ok: true, data: card } : { ok: false, error: "Erro ao criar o card." };
}

const seasonsSchema = z.object({
  /** The entry whose seasons change; omit to add the series to the collection with them. */
  entryId: z.string().uuid().optional(),
  contentId: z.number().int().positive(),
  seasons: z.array(z.number().int().min(1).max(500)).max(500),
});

/**
 * Sets which seasons of a series the user finished. Only released seasons can
 * be marked. With every released season marked a rated card gets its colour
 * back; an unrated one still waits for its rating.
 */
export async function setWatchedSeasons(input: z.input<typeof seasonsSchema>): Promise<Result<CardData>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre na sua conta para marcar temporadas." };
  const parsed = seasonsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Temporadas inválidas." };
  const { contentId: id } = parsed.data;

  let entryId = parsed.data.entryId;
  if (!entryId) {
    const added = await addToCollection({ contentType: "series", contentId: id });
    if (!added.ok) return added;
    entryId = added.data.entryId;
  }

  const list = await seasonsReleased(id);
  if (!list) return { ok: false, error: "Não foi possível carregar as temporadas. Tente de novo." };
  const released = new Set(list);
  const seasons = [...new Set(parsed.data.seasons)].filter((n) => released.has(n)).sort((a, b) => a - b);
  const res = await db
    .update(schema.watchEntries)
    .set({ watchedSeasons: seasons })
    .where(
      and(
        eq(schema.watchEntries.id, entryId),
        eq(schema.watchEntries.userId, user.id),
        eq(schema.watchEntries.contentType, "series"),
        eq(schema.watchEntries.contentId, id),
      ),
    )
    .returning({ id: schema.watchEntries.id });
  if (!res.length) return { ok: false, error: "Série não encontrada na sua coleção." };

  revalidate(user.username, "series", id);
  const card = await getEntry(entryId);
  return card ? { ok: true, data: card } : { ok: false, error: "Erro ao salvar." };
}

const updateSchema = z.object({ entryId: z.string().uuid(), ...entryFields });

/** Edits the rating/reflection of a completed card; the certification follows the new rating. */
export async function updateEntry(input: z.input<typeof updateSchema>): Promise<Result<CardData>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const res = await db
    .update(schema.watchEntries)
    .set(ratedColumns(v))
    .where(
      and(
        eq(schema.watchEntries.id, v.entryId),
        eq(schema.watchEntries.userId, user.id),
        eq(schema.watchEntries.status, "completed"),
      ),
    )
    .returning({ type: schema.watchEntries.contentType, id: schema.watchEntries.contentId });
  if (!res.length) return { ok: false, error: "Card não encontrado." };

  revalidate(user.username, res[0].type, res[0].id);
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
    .returning({ type: schema.watchEntries.contentType, id: schema.watchEntries.contentId });
  if (!res.length) return { ok: false, error: "Card não encontrado." };
  revalidate(user.username, res[0].type, res[0].id);
  return { ok: true, data: null };
}

export async function toggleFavorite(input: z.input<typeof addSchema>): Promise<Result<boolean>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Obra inválida." };
  const { contentType: type, contentId: id } = parsed.data;

  const owned = await db.query.watchEntries.findFirst({
    where: and(
      eq(schema.watchEntries.userId, user.id),
      eq(schema.watchEntries.contentType, type),
      eq(schema.watchEntries.contentId, id),
    ),
    columns: { id: true },
  });
  if (!owned) return { ok: false, error: "Adicione a obra à coleção antes de favoritá-la." };

  const where = and(
    eq(schema.favorites.userId, user.id),
    eq(schema.favorites.contentType, type),
    eq(schema.favorites.contentId, id),
  );
  const existing = await db.query.favorites.findFirst({ where });
  if (existing) await db.delete(schema.favorites).where(where);
  else await db.insert(schema.favorites).values({ userId: user.id, contentType: type, contentId: id });

  revalidate(user.username, type, id);
  return { ok: true, data: !existing };
}
