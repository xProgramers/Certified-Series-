import type { CardData } from "./card-types";
import { findMock } from "./mock-catalog";

/** Static showcase cards for the home page when the database has none yet. */
const SAMPLES: [number, number, string, string, boolean][] = [
  [1396, 9.5, "2026-03-02", "A transformação mais convincente que já vi numa tela. Fiquei dias pensando em orgulho, e em até onde ele leva alguém.", true],
  [95396, 9, "2026-02-28", "Estranha, elegante e assustadoramente familiar. Me fez repensar a linha entre trabalho e vida.", false],
  [87108, 10, "2026-01-12", "Nunca senti tanto peso em cinco episódios. Sobre o custo das mentiras.", false],
  [70523, 9.5, "2025-06-21", "Um quebra-cabeça que respeita quem assiste. O tempo é um personagem.", true],
  [136315, 8.5, "2026-05-30", "Ansiedade em forma de cozinha. Cuidar é um trabalho diário.", false],
];

export function sampleCards(): CardData[] {
  return SAMPLES.map(([id, rating, date, reflection, fav], i) => {
    const m = findMock(id)!;
    return {
      entryId: `sample-${id}`,
      seriesId: id,
      title: m.name,
      firstAirYear: m.firstAirYear,
      lastAirYear: m.lastAirYear ?? null,
      seasons: m.seasons,
      genres: m.genres,
      posterPath: `mock:${id}`,
      backdropPath: `mock:${id}`,
      rating,
      reflection,
      watchedAt: date + "T12:00:00.000Z",
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
