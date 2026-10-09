/**
 * Seeds a demo collection so the profile and home can be previewed.
 *   npm run db:seed          → demo user "luan" / password "certified"
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema";
import { dbAuthToken, dbUrl } from "../src/db/url";
import type { ContentType } from "../src/db/schema";
import { certificationFor } from "../src/lib/card-types";
import { findMock, mockImagePath } from "../src/lib/mock-catalog";

const client = createClient({ url: dbUrl(), authToken: dbAuthToken() });
const db = drizzle(client, { schema });

// [type, TMDB id, rating (null = in progress), date added/completed, reflection, favorite?]
const SERIES: [number, number | null, string, string, boolean?][] = [
  [87108, 10, "2026-01-12", "Nunca senti tanto peso em cinco episódios. Sobre o custo das mentiras e as pessoas comuns que pagam por elas."],
  [1396, 9.5, "2025-03-02", "A transformação mais convincente que já vi numa tela. Terminei e fiquei dias pensando em orgulho, e em até onde ele leva alguém.", true],
  [70523, 9.5, "2025-06-21", "Um quebra-cabeça que respeita quem assiste. Saí com a sensação de que o tempo é um personagem.", true],
  [95396, 9, "2026-02-28", "Estranha, elegante e assustadoramente familiar. Me fez repensar a linha entre trabalho e vida."],
  [60059, 9.5, "2025-09-14", "Mais humana e mais triste do que eu esperava. Ficou comigo de um jeito silencioso.", true],
  [1438, 10, "2024-11-03", "Não é uma série, é um retrato de uma cidade inteira. Paciente, honesta, gigante.", true],
  [136315, 8.5, "2026-05-30", "Ansiedade em forma de cozinha. Me lembrou que cuidar é um trabalho diário."],
  [76331, 9, "2025-12-20", "Ninguém ali é feliz, e mesmo assim eu não conseguia parar. Diálogos afiados como lâmina."],
  [100088, 8.5, "2026-04-06", "O episódio três sozinho já valeria a temporada. Sobre amor em tempos impossíveis."],
  [42009, 8, "2025-01-18", "Desconfortável do jeito certo. Alguns episódios ainda me assombram quando olho para o celular."],
  [66732, 7.5, "2025-11-26", "Nostalgia bem feita, amizade no centro de tudo. Cresci um pouco junto com eles."],
  [67744, 9, "2025-08-09", "Conversas que dão mais medo que qualquer cena de ação. Fico triste que tenha acabado ali."],
  [1668, 8, "2024-07-15", "Conforto em forma de série. Volto para ela como quem volta para casa."],
  [125988, 8.5, "2026-08-17", "Mistério construído com calma e um mundo que dá vontade de explorar."],
  [93405, 7.5, "2025-04-11", "Uma crítica brutal embrulhada em cores de parquinho. Difícil de esquecer."],
  [4607, 7, "2024-09-30", ""],
  [2316, 8.5, "2026-09-27", "Rir de vergonha alheia nunca foi tão reconfortante. Os personagens viraram amigos."],
  [71912, 4, "2026-07-02", "Muito barulho, pouca alma. Terminei por teimosia."],
  [90462, 8, "2026-08-29", "Ninguém fala dessa série e ela é deliciosamente absurda. Terror que sabe rir de si."],
  [94997, null, "2026-09-30", ""],
  [110316, null, "2026-10-02", ""],
];

const MOVIES: [number, number | null, string, string, boolean?][] = [
  [496243, 9.5, "2025-10-11", "Uma escada que desce e não para mais. Rir e sentir vergonha ao mesmo tempo.", true],
  [157336, 9, "2026-01-30", "Saí do cinema olhando para o céu e pensando no meu pai."],
  [603, 8.5, "2025-05-17", "Envelheceu como uma pergunta, não como efeito especial."],
  [604, 7.5, "2025-06-02", "Mais ambição do que fôlego, mas a cena da estrada ainda impressiona."],
  [605, 6.5, "2025-06-09", "Um fim grandioso que fala mais alto do que diz."],
  [624860, 5.5, "2026-09-12", "Uma carta de amor confusa à própria trilogia. Fechei o ciclo."],
  [238, 10, "2025-02-08", "Cada silêncio pesa. Entendi por que todo mundo fala desse filme há cinquenta anos.", true],
  [129, 10, "2026-06-08", "Coragem pequena, do tamanho de uma criança. Perfeito."],
  [19995, 4.5, "2026-03-14", "Lindo de olhar, vazio de sentir. Saí sem nada para levar comigo."],
  [872585, null, "2026-10-01", ""],
];

const ENTRIES: [ContentType, number, number | null, string, string, boolean?][] = [
  ...SERIES.map((e) => ["series", ...e] as [ContentType, ...typeof e]),
  ...MOVIES.map((e) => ["movie", ...e] as [ContentType, ...typeof e]),
];

async function main() {
  const username = "luan";
  const existing = await db.query.users.findFirst({ where: eq(schema.users.username, username) });
  if (existing) {
    await db.delete(schema.userAchievements).where(eq(schema.userAchievements.userId, existing.id));
    await db.delete(schema.favorites).where(eq(schema.favorites.userId, existing.id));
    await db.delete(schema.watchEntries).where(eq(schema.watchEntries.userId, existing.id));
    await db.delete(schema.users).where(eq(schema.users.id, existing.id));
  }
  const userId = crypto.randomUUID();
  await db.insert(schema.users).values({
    id: userId,
    username,
    displayName: "Luan",
    email: "luan@example.com",
    passwordHash: await bcrypt.hash("certified", 12),
    bio: "Colecionando histórias desde 2024.",
  });

  const sorted = [...ENTRIES].sort((a, b) => a[3].localeCompare(b[3]));
  let n = 0;
  for (const [type, id, rating, date, reflection, fav] of sorted) {
    const m = findMock(type, id)!;
    await db
      .insert(schema.titles)
      .values({
        type,
        id: m.id,
        name: m.name,
        originalName: m.originalName ?? null,
        overview: m.overview,
        posterPath: mockImagePath(m),
        backdropPath: mockImagePath(m),
        startYear: m.firstAirYear,
        endYear: m.lastAirYear ?? null,
        numberOfSeasons: m.seasons ?? null,
        numberOfEpisodes: m.episodes ?? null,
        runtime: m.runtime ?? null,
        genres: m.genres,
        networks: m.networks,
        contentRating: m.contentRating ?? null,
        status: m.status,
      })
      .onConflictDoNothing();
    const at = new Date(date + "T12:00:00Z");
    await db.insert(schema.watchEntries).values({
      id: crypto.randomUUID(),
      userId,
      contentType: type,
      contentId: id,
      collectionNumber: ++n,
      viewingNumber: 1,
      ...(rating == null
        ? { status: "in_progress" as const, addedAt: at }
        : {
            status: "completed" as const,
            ratingHalves: rating * 2,
            certificationStatus: certificationFor(rating),
            reflection,
            addedAt: new Date(at.getTime() - 14 * 86400000),
            completedAt: at,
          }),
      isPublic: true,
    });
    if (fav) await db.insert(schema.favorites).values({ userId, contentType: type, contentId: id });
  }
  console.log(`Seeded @${username} with ${n} cards (password: certified)`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
