import "server-only";
import type { ContentType } from "@/db/schema";
import { MOCK_CATALOG, findMock, mockImagePath, searchMock, type MockTitle } from "./mock-catalog";
import { MOCK_COLLECTIONS, MOCK_CREDITS } from "./mock-extras";

export type SearchType = ContentType | "all";

export type TitleSummary = {
  type: ContentType;
  id: number;
  name: string;
  originalName: string | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  /** First air year (series) or release year (movie). */
  year: number | null;
  genres: string[];
};

export type TitleDetail = TitleSummary & {
  /** Last air year of an ended series. */
  endYear: number | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  /** Movie runtime in minutes. */
  runtime: number | null;
  /** TV networks or movie studios. */
  networks: string[];
  /** Age rating (classificação indicativa), Brazil first, then US. */
  contentRating: string | null;
  status: string | null;
  tagline: string | null;
};

const API = "https://api.themoviedb.org/3";
const LANG = "pt-BR";

export function tmdbConfigured() {
  return Boolean(process.env.TMDB_READ_TOKEN);
}

// TMDB genre ids → Portuguese labels (search results only carry ids)
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

const MOVIE_GENRES: Record<number, string> = {
  28: "Ação",
  12: "Aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  14: "Fantasia",
  36: "História",
  27: "Terror",
  10402: "Música",
  9648: "Mistério",
  10749: "Romance",
  878: "Ficção científica",
  10770: "Cinema TV",
  53: "Thriller",
  10752: "Guerra",
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

function fromMock(m: MockTitle): TitleDetail {
  const img = mockImagePath(m);
  return {
    type: m.type,
    id: m.id,
    name: m.name,
    originalName: m.originalName ?? null,
    overview: m.overview,
    posterPath: img,
    backdropPath: img,
    year: m.firstAirYear,
    endYear: m.lastAirYear ?? null,
    genres: m.genres,
    numberOfSeasons: m.seasons ?? null,
    numberOfEpisodes: m.episodes ?? null,
    runtime: m.runtime ?? null,
    networks: m.networks,
    contentRating: m.contentRating ?? null,
    status: m.status,
    tagline: null,
  };
}

type TmdbResult = {
  id: number;
  media_type?: "tv" | "movie" | "person";
  // tv
  name?: string;
  original_name?: string;
  first_air_date?: string;
  // movie
  title?: string;
  original_title?: string;
  release_date?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  popularity: number;
};

function fromResult(r: TmdbResult, type: ContentType): TitleSummary {
  const name = (type === "movie" ? r.title : r.name) ?? "";
  const original = (type === "movie" ? r.original_title : r.original_name) ?? null;
  const genres = type === "movie" ? MOVIE_GENRES : TV_GENRES;
  return {
    type,
    id: r.id,
    name,
    originalName: original && original !== name ? original : null,
    overview: r.overview,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    year: year(type === "movie" ? r.release_date : r.first_air_date),
    genres: r.genre_ids.map((g) => genres[g]).filter(Boolean),
  };
}

const tmdbKind = (t: ContentType) => (t === "movie" ? "movie" : "tv");

export async function searchTitles(query: string, type: SearchType = "all"): Promise<TitleSummary[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  if (!tmdbConfigured()) return searchMock(q, type).map(fromMock);

  if (type === "all") {
    const data = await tmdb<{ results: TmdbResult[] }>("/search/multi", { query: q, include_adult: "false" });
    return data.results
      .filter((r) => r.media_type === "tv" || r.media_type === "movie")
      .slice(0, 24)
      .map((r) => fromResult(r, r.media_type === "movie" ? "movie" : "series"));
  }
  const data = await tmdb<{ results: TmdbResult[] }>(`/search/${tmdbKind(type)}`, { query: q, include_adult: "false" });
  return data.results.slice(0, 24).map((r) => fromResult(r, type));
}

type TmdbTvDetail = {
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
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
};

type TmdbMovieDetail = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  tagline: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  production_companies: { name: string }[];
  status: string;
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] };
};

function pickRating(byCountry: { country: string; rating: string }[]) {
  for (const c of ["BR", "US"]) {
    const hit = byCountry.find((r) => r.country === c && r.rating);
    if (hit) return hit.rating;
  }
  return null;
}

export async function getTitle(type: ContentType, id: number): Promise<TitleDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!tmdbConfigured()) {
    const m = findMock(type, id);
    return m ? fromMock(m) : null;
  }
  try {
    if (type === "movie") {
      const d = await tmdb<TmdbMovieDetail>(`/movie/${id}`, { append_to_response: "release_dates" });
      return {
        type,
        id: d.id,
        name: d.title,
        originalName: d.original_title !== d.title ? d.original_title : null,
        overview: d.overview,
        tagline: d.tagline || null,
        posterPath: d.poster_path,
        backdropPath: d.backdrop_path,
        year: year(d.release_date),
        endYear: null,
        numberOfSeasons: null,
        numberOfEpisodes: null,
        runtime: d.runtime || null,
        genres: d.genres.map((g) => g.name),
        networks: d.production_companies.slice(0, 3).map((n) => n.name),
        contentRating: pickRating(
          (d.release_dates?.results ?? []).map((r) => ({
            country: r.iso_3166_1,
            rating: r.release_dates.map((x) => x.certification).find(Boolean) ?? "",
          })),
        ),
        status: d.status,
      };
    }
    const d = await tmdb<TmdbTvDetail>(`/tv/${id}`, { append_to_response: "content_ratings" });
    return {
      type,
      id: d.id,
      name: d.name,
      originalName: d.original_name !== d.name ? d.original_name : null,
      overview: d.overview,
      tagline: d.tagline || null,
      posterPath: d.poster_path,
      backdropPath: d.backdrop_path,
      year: year(d.first_air_date),
      endYear: d.status === "Ended" || d.status === "Canceled" ? year(d.last_air_date) : null,
      numberOfSeasons: d.number_of_seasons ?? null,
      numberOfEpisodes: d.number_of_episodes ?? null,
      runtime: null,
      genres: d.genres.map((g) => g.name),
      networks: d.networks.map((n) => n.name),
      contentRating: pickRating(
        (d.content_ratings?.results ?? []).map((r) => ({ country: r.iso_3166_1, rating: r.rating })),
      ),
      status: d.status,
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("TMDB 404")) return null;
    throw e;
  }
}

export type Person = {
  id: string;
  name: string;
  /** Character played (cast) or nothing (crew). */
  role: string | null;
  profilePath: string | null;
};

export type TitleExtras = {
  /** Directors (movies) or creators (series). */
  makers: Person[];
  cast: Person[];
  /** Other entries of the movie's franchise, in release order, including itself. */
  franchise: { name: string; parts: TitleSummary[] } | null;
  /** TMDB recommendations, falling back to similar titles. */
  similar: TitleSummary[];
};

const CAST_LIMIT = 6;
const SIMILAR_LIMIT = 12;

type TmdbPerson = { id: number; name: string; profile_path: string | null };
type TmdbCredits = {
  cast: (TmdbPerson & { character?: string })[];
  crew: (TmdbPerson & { job: string })[];
};
type TmdbAggregateCredits = {
  cast: (TmdbPerson & { roles?: { character: string }[] })[];
};
type TmdbPage = { results: TmdbResult[] };

const person = (p: TmdbPerson, role: string | null = null): Person => ({
  id: String(p.id),
  name: p.name,
  role: role || null,
  profilePath: p.profile_path,
});

/** Cast, director/creators, franchise and similar titles for the title page. */
export async function getTitleExtras(type: ContentType, id: number): Promise<TitleExtras> {
  if (!tmdbConfigured()) return mockExtras(type, id);

  const pickSimilar = (rec?: TmdbPage, sim?: TmdbPage) => {
    const pool = rec?.results.length ? rec.results : (sim?.results ?? []);
    return pool
      .filter((r) => r.poster_path)
      .slice(0, SIMILAR_LIMIT)
      .map((r) => fromResult({ ...r, genre_ids: r.genre_ids ?? [] }, type));
  };

  if (type === "movie") {
    const d = await tmdb<{
      belongs_to_collection: { id: number; name: string } | null;
      credits?: TmdbCredits;
      recommendations?: TmdbPage;
      similar?: TmdbPage;
    }>(`/movie/${id}`, { append_to_response: "credits,recommendations,similar" });

    let franchise: TitleExtras["franchise"] = null;
    if (d.belongs_to_collection) {
      const c = await tmdb<{ name: string; parts: TmdbResult[] }>(`/collection/${d.belongs_to_collection.id}`).catch(
        () => null,
      );
      if (c && c.parts.length > 1) {
        franchise = {
          name: c.name.replace(/^(Coleção|Collection)\s+(de\s+)?/i, "").replace(/\s*[-–:]?\s*(Coleção|Collection)\s*$/i, "") || c.name,
          parts: c.parts
            .map((r) => fromResult({ ...r, genre_ids: r.genre_ids ?? [] }, "movie"))
            .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999)),
        };
      }
    }
    const inFranchise = new Set(franchise?.parts.map((p) => p.id));
    return {
      makers: (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => person(c)),
      cast: (d.credits?.cast ?? []).slice(0, CAST_LIMIT).map((c) => person(c, c.character)),
      franchise,
      similar: pickSimilar(d.recommendations, d.similar).filter((s) => !inFranchise.has(s.id)),
    };
  }

  const d = await tmdb<{
    created_by: TmdbPerson[];
    aggregate_credits?: TmdbAggregateCredits;
    recommendations?: TmdbPage;
    similar?: TmdbPage;
  }>(`/tv/${id}`, { append_to_response: "aggregate_credits,recommendations,similar" });
  return {
    makers: d.created_by.map((c) => person(c)),
    cast: (d.aggregate_credits?.cast ?? []).slice(0, CAST_LIMIT).map((c) => person(c, c.roles?.[0]?.character)),
    franchise: null,
    similar: pickSimilar(d.recommendations, d.similar),
  };
}

function mockExtras(type: ContentType, id: number): TitleExtras {
  const self = findMock(type, id);
  const credits = type === "movie" ? MOCK_CREDITS[id] : undefined;
  const collection = type === "movie" ? MOCK_COLLECTIONS.find((c) => c.parts.includes(id)) : undefined;
  const franchise = collection
    ? {
        name: collection.name,
        parts: collection.parts
          .map((p) => findMock("movie", p))
          .filter((m): m is MockTitle => Boolean(m))
          .map(fromMock),
      }
    : null;
  const exclude = new Set(collection?.parts ?? [id]);
  // Similar = most shared genres, then most recent
  const similar = self
    ? MOCK_CATALOG.filter((m) => m.type === type && !exclude.has(m.id))
        .map((m) => ({ m, score: m.genres.filter((g) => self.genres.includes(g)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || b.m.firstAirYear - a.m.firstAirYear)
        .slice(0, SIMILAR_LIMIT)
        .map((x) => fromMock(x.m))
    : [];
  return {
    makers: (credits?.directors ?? []).map((name) => ({ id: name, name, role: null, profilePath: null })),
    cast: (credits?.cast ?? []).map(([name, role]) => ({ id: name, name, role, profilePath: null })),
    franchise,
    similar,
  };
}

/** Trending titles for the search page's empty state. */
export async function popularTitles(type: SearchType = "all"): Promise<TitleSummary[]> {
  if (!tmdbConfigured()) {
    const pool = type === "all" ? interleave(MOCK_CATALOG) : MOCK_CATALOG.filter((m) => m.type === type);
    return pool.slice(0, 12).map(fromMock);
  }
  if (type === "all") {
    const data = await tmdb<{ results: TmdbResult[] }>("/trending/all/week");
    return data.results
      .filter((r) => r.media_type === "tv" || r.media_type === "movie")
      .slice(0, 12)
      .map((r) => fromResult(r, r.media_type === "movie" ? "movie" : "series"));
  }
  const data = await tmdb<{ results: TmdbResult[] }>(`/trending/${tmdbKind(type)}/week`);
  return data.results.slice(0, 12).map((r) => fromResult(r, type));
}

/** Alternates series and movies so the sample "all" shelf shows both. */
function interleave(list: MockTitle[]) {
  const s = list.filter((m) => m.type === "series");
  const m = list.filter((x) => x.type === "movie");
  const out: MockTitle[] = [];
  for (let i = 0; i < Math.max(s.length, m.length); i++) {
    if (s[i]) out.push(s[i]);
    if (m[i]) out.push(m[i]);
  }
  return out;
}
