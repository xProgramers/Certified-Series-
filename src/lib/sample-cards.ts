import type { ContentType } from "@/db/schema";
import { certificationFor, type CardData } from "./card-types";
import { findMock, mockImagePath } from "./mock-catalog";

/** Static showcase cards for the home page when the database has none yet. rating null = in progress. */
const SAMPLES: [ContentType, number, number | null, string, string, boolean][] = [
  ["series", 1396, 9.5, "2026-03-02", "A transformação mais convincente que já vi numa tela. Fiquei dias pensando em orgulho, e em até onde ele leva alguém.", true],
  ["movie", 496243, 9, "2026-02-28", "Uma escada que desce e não para mais. Rir e sentir vergonha ao mesmo tempo.", false],
  ["series", 87108, 10, "2026-01-12", "Nunca senti tanto peso em cinco episódios. Sobre o custo das mentiras.", false],
  ["series", 125988, null, "2026-09-21", "", false],
  ["movie", 19995, 4.5, "2025-06-21", "Lindo de olhar, vazio de sentir. Saí sem nada para levar comigo.", false],
  ["series", 136315, 8.5, "2026-05-30", "Ansiedade em forma de cozinha. Cuidar é um trabalho diário.", false],
];

export function sampleCards(): CardData[] {
  return SAMPLES.map(([type, id, rating, date, reflection, fav], i) => {
    const m = findMock(type, id)!;
    const iso = date + "T12:00:00.000Z";
    return {
      entryId: `sample-${type}-${id}`,
      contentType: type,
      contentId: id,
      title: m.name,
      startYear: m.firstAirYear,
      endYear: m.lastAirYear ?? null,
      seasons: m.seasons ?? null,
      runtime: m.runtime ?? null,
      genres: m.genres,
      posterPath: mockImagePath(m),
      backdropPath: mockImagePath(m),
      status: rating == null ? "in_progress" : "completed",
      rating,
      certification: rating == null ? null : certificationFor(rating),
      reflection,
      addedAt: iso,
      completedAt: rating == null ? null : iso,
      collectionNumber: 47 - i * 6,
      viewingNumber: 1,
      ownerName: "Luan",
      ownerUsername: "luan",
      isFavorite: fav,
      isPublic: true,
      palette: null,
    };
  });
}
