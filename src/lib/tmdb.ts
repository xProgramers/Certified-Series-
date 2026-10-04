import "server-only";
import { findMock, searchMock, type MockSeries } from "./mock-catalog";

export type SeriesSummary = {
  id: number;
  name: string;
  originalName: string | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirYear: number | null;
  genres: string[];
};

export type SeriesDetail = SeriesSummary & {
  lastAirYear: number | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  networks: string[];
  status: string | null;
  tagline: string | null;
};

const API = "https://api.themoviedb.org/3";
const LANG = "pt-BR";

export function tmdbConfigured() {
  return Boolean(process.env.TMDB_READ_TOKEN);
}

// TMDB TV genre ids → Portuguese labels (used for search results, which only carry ids)
const TV_GENRES: Record<number, string> = {
  10759: "Ação e Aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  10762: "Infantil",
  9648: "Mistério",
  10763: "Notícias",
  10764: "Reality",
  10765: "Ficção científica e Fantasia",
  10766: "Novela",
  10767: "Talk show",
  10768: "Guerra e Política",
  37: "Faroeste",
};

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(API + path);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      Accept: "application/json",
    },
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

const year = (d?: string | null) => (d && d.length >= 4 ? Number(d.slice(0, 4)) : null);

function fromMock(m: MockSeries): SeriesDetail {
  return {
    id: m.id,
    name: m.name,
    originalName: m.originalName ?? null,
    overview: m.overview,
    posterPath: `mock:${m.id}`,
    backdropPath: `mock:${m.id}`,
    firstAirYear: m.firstAirYear,
    lastAirYear: m.lastAirYear ?? null,
    genres: m.genres,
    numberOfSeasons: m.seasons,
    numberOfEpisodes: m.episodes,
    networks: m.networks,
    status: m.status,
    tagline: null,
  };
}

type TmdbSearchResult = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  genre_ids: number[];
  popularity: number;
};

export async function searchSeries(query: string): Promise<SeriesSummary[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  if (!tmdbConfigured()) return searchMock(q).map(fromMock);

  const data = await tmdb<{ results: TmdbSearchResult[] }>("/search/tv", {
    query: q,
    include_adult: "false",
  });
  return data.results.slice(0, 20).map((r) => ({
    id: r.id,
    name: r.name,
    originalName: r.original_name !== r.name ? r.original_name : null,
    overview: r.overview,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    firstAirYear: year(r.first_air_date),
    genres: r.genre_ids.map((g) => TV_GENRES[g]).filter(Boolean),
  }));
}

type TmdbDetail = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  tagline: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  last_air_date?: string;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  networks: { name: string }[];
  status: string;
};

export async function getSeries(id: number): Promise<SeriesDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!tmdbConfigured()) {
    const m = findMock(id);
    return m ? fromMock(m) : null;
  }
  try {
    const d = await tmdb<TmdbDetail>(`/tv/${id}`);
    return {
      id: d.id,
      name: d.name,
      originalName: d.original_name !== d.name ? d.original_name : null,
      overview: d.overview,
      tagline: d.tagline || null,
      posterPath: d.poster_path,
      backdropPath: d.backdrop_path,
      firstAirYear: year(d.first_air_date),
      lastAirYear: d.status === "Ended" || d.status === "Canceled" ? year(d.last_air_date) : null,
      numberOfSeasons: d.number_of_seasons ?? null,
      numberOfEpisodes: d.number_of_episodes ?? null,
      genres: d.genres.map((g) => g.name),
      networks: d.networks.map((n) => n.name),
      status: d.status,
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("TMDB 404")) return null;
    throw e;
  }
}

/** Popular/trending series for the search page's empty state. */
export async function popularSeries(): Promise<SeriesSummary[]> {
  if (!tmdbConfigured()) {
    const { MOCK_CATALOG } = await import("./mock-catalog");
    return MOCK_CATALOG.slice(0, 12).map(fromMock);
  }
  const data = await tmdb<{ results: TmdbSearchResult[] }>("/trending/tv/week");
  return data.results.slice(0, 12).map((r) => ({
    id: r.id,
    name: r.name,
    originalName: r.original_name !== r.name ? r.original_name : null,
    overview: r.overview,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    firstAirYear: year(r.first_air_date),
    genres: r.genre_ids.map((g) => TV_GENRES[g]).filter(Boolean),
  }));
}
