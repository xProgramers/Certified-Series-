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
import { MOCK_CATALOG } from "../src/lib/mock-catalog";

const client = createClient({ url: dbUrl(), authToken: dbAuthToken() });
const db = drizzle(client, { schema });

const ENTRIES: [number, number, string, string, boolean?][] = [
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
];

async function main() {
  const username = "luan";
  const existing = await db.query.users.findFirst({ where: eq(schema.users.username, username) });
  if (existing) {
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

  const sorted = [...ENTRIES].sort((a, b) => a[2].localeCompare(b[2]));
  let n = 0;
  for (const [id, rating, date, reflection, fav] of sorted) {
    const m = MOCK_CATALOG.find((s) => s.id === id)!;
    await db
      .insert(schema.series)
      .values({
        id: m.id,
        name: m.name,
        originalName: m.originalName ?? null,
        overview: m.overview,
        posterPath: `mock:${m.id}`,
        backdropPath: `mock:${m.id}`,
        firstAirYear: m.firstAirYear,
        lastAirYear: m.lastAirYear ?? null,
        numberOfSeasons: m.seasons,
        numberOfEpisodes: m.episodes,
        genres: m.genres,
        networks: m.networks,
        status: m.status,
      })
      .onConflictDoNothing();
    await db.insert(schema.watchEntries).values({
      id: crypto.randomUUID(),
      userId,
      seriesId: id,
      collectionNumber: ++n,
      viewingNumber: 1,
      ratingHalves: rating * 2,
      reflection,
      isPublic: true,
      watchedAt: new Date(date + "T12:00:00Z"),
    });
    if (fav) await db.insert(schema.favorites).values({ userId, seriesId: id });
  }
  console.log(`Seeded @${username} with ${n} cards (password: certified)`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
