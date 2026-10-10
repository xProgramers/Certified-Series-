import "server-only";
import type { ContentType, EpisodeRef, FranchisePart, SeasonInfo } from "@/db/schema";
import { MOCK_CATALOG, findMock, mockImagePath, mockVotes, searchMock, type MockTitle } from "./mock-catalog";
import { MOCK_COLLECTIONS, MOCK_CREDITS, MOCK_PROVIDERS } from "./mock-extras";
import { brand, toProvider, uniqueProviders, type WatchProvider, type WatchProviders } from "./providers";

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
  /** Series only. */
  seasonList: SeasonInfo[] | null;
  /** Series only: the latest episode already aired. */
  lastEpisode: EpisodeRef | null;
  /** TMDB audience score (0–10) and its number of votes. */
  voteAverage: number | null;
  voteCount: number | null;
  /** Movies only: the TMDB collection (franchise) it belongs to. */
  collectionId: number | null;
  /** Directors (movies) or creators (series), by name. */
  makers: string[];
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

async function tmdb<T>(path: string, params: Record<string, string> = {}, fresh = false): Promise<T> {
  const url = new URL(API + path);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      Accept: "application/json",
    },
    // The daily episode check needs today's data, not the 12 h cache
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 60 * 60 * 12 } }),
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

const year = (d?: string | null) => (d && d.length >= 4 ? Number(d.slice(0, 4)) : null);

function fromMock(m: MockTitle): TitleDetail {
  const img = mockImagePath(m);
  const votes = mockVotes(m);
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
    numberOfSeasons: m.seasons != null ? m.seasons + (m.airing ? 1 : 0) : null,
    numberOfEpisodes: m.episodes ?? null,
    runtime: m.runtime ?? null,
    networks: m.networks,
    contentRating: m.contentRating ?? null,
    status: m.status,
    tagline: null,
    seasonList: m.type === "series" ? mockSeasons(m) : null,
    lastEpisode: m.type === "series" ? mockLastEpisode(mockSeasons(m)) : null,
    voteAverage: votes?.[0] ?? null,
    voteCount: votes?.[1] ?? null,
    collectionId: m.type === "movie" ? (MOCK_COLLECTIONS.find((c) => c.parts.includes(m.id))?.id ?? null) : null,
    makers: m.type === "movie" ? (MOCK_CREDITS[m.id]?.directors ?? []) : [],
  };
}

/** Even episode split across seasons, one season a year; an optional last season still airing. */
function mockSeasons(m: MockTitle): SeasonInfo[] {
  const n = m.seasons ?? 1;
  const per = Math.max(1, Math.round((m.episodes ?? n * 8) / n));
  const span = (m.lastAirYear ?? Math.min(m.firstAirYear + n - 1, new Date().getFullYear())) - m.firstAirYear;
  const list: SeasonInfo[] = Array.from({ length: n }, (_, i) => ({
    number: i + 1,
    name: `Temporada ${i + 1}`,
    episodes: per,
    aired: per,
    year: m.firstAirYear + (n > 1 ? Math.round((span * i) / (n - 1)) : 0),
    state: "released",
  }));
  if (m.airing) {
    list.push({
      number: n + 1,
      name: `Temporada ${n + 1}`,
      episodes: m.airing.episodes,
      aired: m.airing.aired,
      year: new Date().getFullYear(),
      state: m.airing.aired > 0 ? "airing" : "upcoming",
    });
  }
  return list;
}

/** Last aired episode of the sample seasons: one airing today, or the end of the last released season. */
function mockLastEpisode(seasons: SeasonInfo[]): EpisodeRef | null {
  const s = [...seasons].reverse().find((x) => x.aired > 0);
  if (!s) return null;
  const airing = s.state === "airing";
  return {
    season: s.number,
    episode: s.aired,
    name: `Episódio ${s.aired}`,
    airDate: airing ? new Date().toISOString().slice(0, 10) : `${s.year ?? 2000}-06-01`,
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
  seasons?: { season_number: number; name: string; episode_count: number; air_date: string | null }[];
  last_episode_to_air?: TmdbEpisodeRef | null;
  next_episode_to_air?: TmdbEpisodeRef | null;
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  created_by?: { name: string }[];
  vote_average?: number;
  vote_count?: number;
};

type TmdbEpisodeRef = { season_number: number; episode_number: number; air_date: string | null; name?: string };

/**
 * A season counts as released once its last episode has aired: it is before
 * the season of the latest aired episode, or that latest episode closes it and
 * nothing more of it is scheduled. Season 0 (specials) never counts.
 */
export function parseSeasons(d: Pick<TmdbTvDetail, "seasons" | "last_episode_to_air" | "next_episode_to_air">): SeasonInfo[] {
  const today = new Date().toISOString().slice(0, 10);
  const last = d.last_episode_to_air ?? null;
  const next = d.next_episode_to_air ?? null;
  return (d.seasons ?? [])
    .filter((s) => s.season_number > 0)
    .filter((s) => s.air_date || s.episode_count > 0)
    .map((s): SeasonInfo => {
      const started = Boolean(s.air_date && s.air_date <= today);
      let aired = 0;
      if (last && started) {
        if (s.season_number < last.season_number) aired = s.episode_count;
        else if (s.season_number === last.season_number) aired = Math.min(last.episode_number, s.episode_count || last.episode_number);
      }
      const moreScheduled = next?.season_number === s.season_number;
      const released = started && s.episode_count > 0 && aired >= s.episode_count && !moreScheduled;
      return {
        number: s.season_number,
        name: s.name || `Temporada ${s.season_number}`,
        episodes: s.episode_count,
        aired,
        year: year(s.air_date),
        state: released ? "released" : aired > 0 || (started && moreScheduled) ? "airing" : "upcoming",
      };
    })
    .sort((a, b) => a.number - b.number);
}

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
  belongs_to_collection?: { id: number; name: string } | null;
  credits?: { crew: { name: string; job: string }[] };
  vote_average?: number;
  vote_count?: number;
};

function pickRating(byCountry: { country: string; rating: string }[]) {
  for (const c of ["BR", "US"]) {
    const hit = byCountry.find((r) => r.country === c && r.rating);
    if (hit) return hit.rating;
  }
  return null;
}

/** `fresh` skips the 12 h cache (the daily episode check). */
export async function getTitle(type: ContentType, id: number, fresh = false): Promise<TitleDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!tmdbConfigured()) {
    const m = findMock(type, id);
    return m ? fromMock(m) : null;
  }
  try {
    if (type === "movie") {
      const d = await tmdb<TmdbMovieDetail>(`/movie/${id}`, { append_to_response: "release_dates,credits" }, fresh);
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
        seasonList: null,
        lastEpisode: null,
        voteAverage: d.vote_average ?? null,
        voteCount: d.vote_count ?? null,
        collectionId: d.belongs_to_collection?.id ?? null,
        makers: [...new Set((d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name))],
      };
    }
    const d = await tmdb<TmdbTvDetail>(`/tv/${id}`, { append_to_response: "content_ratings" }, fresh);
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
      seasonList: parseSeasons(d),
      lastEpisode: d.last_episode_to_air
        ? {
            season: d.last_episode_to_air.season_number,
            episode: d.last_episode_to_air.episode_number,
            name: d.last_episode_to_air.name || null,
            airDate: d.last_episode_to_air.air_date,
          }
        : null,
      voteAverage: d.vote_average ?? null,
      voteCount: d.vote_count ?? null,
      collectionId: null,
      makers: (d.created_by ?? []).map((c) => c.name),
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("TMDB 404")) return null;
    throw e;
  }
}

export type Person = {
  /** TMDB person id, or a name slug for the sample catalog. */
  id: string;
  name: string;
  /** Character played (cast) or nothing (crew). */
  role: string | null;
  profilePath: string | null;
  /** Episodes in the series (cast and crew of series only). */
  episodes?: number | null;
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

const person = (p: TmdbPerson, role: string | null = null, episodes: number | null = null): Person => ({
  id: String(p.id),
  name: p.name,
  role: role || null,
  profilePath: p.profile_path,
  episodes,
});

/** Sample-catalog people have no TMDB id: their name, slugged, is the id. */
export function personSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const mockPerson = (name: string, role: string | null = null): Person => ({
  id: personSlug(name),
  name,
  role,
  profilePath: null,
});

/** "Coleção Harry Potter" / "The Matrix Collection" → "Harry Potter" / "The Matrix". */
function franchiseName(name: string) {
  return name.replace(/^(Coleção|Collection)\s+(de\s+)?/i, "").replace(/\s*[-–:]?\s*(Coleção|Collection)\s*$/i, "") || name;
}

export type Franchise = { id: number; name: string; parts: FranchisePart[] };

/** A TMDB collection with every part and whether it is out yet (achievements: "Saga completa"). */
export async function getFranchise(id: number): Promise<Franchise | null> {
  if (!tmdbConfigured()) {
    const c = MOCK_COLLECTIONS.find((x) => x.id === id);
    if (!c) return null;
    return {
      id,
      name: c.name,
      parts: c.parts.map((p) => ({ id: p, year: findMock("movie", p)?.firstAirYear ?? null, released: true })),
    };
  }
  try {
    const c = await tmdb<{ id: number; name: string; parts: TmdbResult[] }>(`/collection/${id}`);
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: c.id,
      name: franchiseName(c.name),
      parts: c.parts.map((p) => ({
        id: p.id,
        year: year(p.release_date),
        released: Boolean(p.release_date && p.release_date <= today),
      })),
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("TMDB 404")) return null;
    throw e;
  }
}

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
          name: franchiseName(c.name),
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
    makers: (credits?.directors ?? []).map((name) => mockPerson(name)),
    cast: (credits?.cast ?? []).map(([name, role]) => mockPerson(name, role)),
    franchise,
    similar,
  };
}

export type TitleCredits = {
  /** Directors (movies) or creators (series). */
  makers: Person[];
  /** Everyone credited in the cast, in billing order (series: by episodes). */
  cast: Person[];
  /** Key crew roles, in a fixed order; empty roles are left out. */
  crew: { job: string; people: Person[] }[];
};

const FULL_CAST_LIMIT = 200;
const CREW_PER_JOB = 12;

/** TMDB crew jobs worth showing, with their Portuguese label (several jobs can share one). */
const CREW_JOBS: [string, string][] = [
  ["Director", "Direção"],
  ["Screenplay", "Roteiro"],
  ["Writer", "Roteiro"],
  ["Teleplay", "Roteiro"],
  ["Story", "Argumento"],
  ["Novel", "Obra original"],
  ["Comic Book", "Obra original"],
  ["Original Music Composer", "Música"],
  ["Music", "Música"],
  ["Director of Photography", "Fotografia"],
  ["Editor", "Montagem"],
  ["Production Design", "Direção de arte"],
  ["Casting", "Seleção de elenco"],
  ["Producer", "Produção"],
  ["Executive Producer", "Produção executiva"],
];
const JOB_LABEL = new Map(CREW_JOBS);
const JOB_ORDER = [...new Set(CREW_JOBS.map(([, label]) => label))];

/** Portuguese label of a TMDB crew job (the job itself when unknown). */
export function jobLabel(job: string) {
  return JOB_LABEL.get(job) ?? job;
}

function groupCrew(entries: { p: TmdbPerson; job: string; episodes: number | null }[], skip: string[] = []) {
  const groups = new Map<string, Map<string, Person>>();
  for (const { p, job, episodes } of entries) {
    const label = JOB_LABEL.get(job);
    if (!label || skip.includes(label)) continue;
    const group = groups.get(label) ?? new Map<string, Person>();
    groups.set(label, group);
    const prev = group.get(String(p.id));
    if (!prev) group.set(String(p.id), person(p, null, episodes));
    else if (episodes != null) prev.episodes = Math.max(prev.episodes ?? 0, episodes);
  }
  return JOB_ORDER.filter((label) => groups.has(label)).map((label) => ({
    job: label,
    people: [...groups.get(label)!.values()]
      .sort((a, b) => (b.episodes ?? 0) - (a.episodes ?? 0))
      .slice(0, CREW_PER_JOB),
  }));
}

/** The full cast and key crew, for the title's "elenco completo" page. */
export async function getTitleCredits(type: ContentType, id: number): Promise<TitleCredits> {
  if (!tmdbConfigured()) {
    const credits = type === "movie" ? MOCK_CREDITS[id] : undefined;
    return {
      makers: (credits?.directors ?? []).map((name) => mockPerson(name)),
      cast: (credits?.cast ?? []).map(([name, role]) => mockPerson(name, role)),
      crew: [],
    };
  }

  if (type === "movie") {
    const d = await tmdb<TmdbCredits>(`/movie/${id}/credits`);
    return {
      makers: d.crew.filter((c) => c.job === "Director").map((c) => person(c)),
      cast: d.cast.slice(0, FULL_CAST_LIMIT).map((c) => person(c, c.character)),
      // Directors are already the page's makers
      crew: groupCrew(d.crew.map((c) => ({ p: c, job: c.job, episodes: null })), ["Direção"]),
    };
  }

  const d = await tmdb<{
    created_by: TmdbPerson[];
    aggregate_credits?: {
      cast: (TmdbPerson & { roles?: { character: string }[]; total_episode_count?: number })[];
      crew: (TmdbPerson & { jobs?: { job: string; episode_count: number }[] })[];
    };
  }>(`/tv/${id}`, { append_to_response: "aggregate_credits" });
  const agg = d.aggregate_credits ?? { cast: [], crew: [] };
  return {
    makers: d.created_by.map((c) => person(c)),
    cast: agg.cast
      .slice(0, FULL_CAST_LIMIT)
      .map((c) => person(c, c.roles?.[0]?.character, c.total_episode_count ?? null)),
    crew: groupCrew(agg.crew.flatMap((c) => (c.jobs ?? []).map((j) => ({ p: c, job: j.job, episodes: j.episode_count })))),
  };
}

export type PersonCredit = TitleSummary & {
  /** Characters played, or crew jobs (in Portuguese), joined. */
  role: string | null;
  /** Episodes in the series. */
  episodes: number | null;
  /** TMDB vote count, used to rank what the person is known for. */
  votes: number;
};

export type PersonDetail = {
  id: string;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  profilePath: string | null;
  /** What they are mainly known for: "Atuação", "Direção", "Roteiro"… */
  knownFor: string | null;
  acting: PersonCredit[];
  crew: PersonCredit[];
};

const DEPARTMENTS: Record<string, string> = {
  Acting: "Atuação",
  Directing: "Direção",
  Writing: "Roteiro",
  Production: "Produção",
  Sound: "Música",
  Camera: "Fotografia",
  Editing: "Montagem",
  Creator: "Criação",
};

// Talk shows, news and reality: guest spots, not part of a filmography
const SKIP_GENRES = new Set([10767, 10763, 10764]);
const SELF = /^(self|himself|herself|themselves|ele mesmo|ela mesma|si mesmo|si mesma)\b/i;

type TmdbPersonCredit = TmdbResult & {
  media_type: "tv" | "movie";
  vote_count?: number;
  character?: string;
  episode_count?: number;
  job?: string;
};

/** Merges a person's credits on the same title (several characters or jobs), newest first. */
function mergeCredits(list: { r: TmdbPersonCredit; role: string | null }[]): PersonCredit[] {
  const byTitle = new Map<string, PersonCredit>();
  for (const { r, role } of list) {
    const type: ContentType = r.media_type === "movie" ? "movie" : "series";
    const key = `${type}:${r.id}`;
    const prev = byTitle.get(key);
    if (prev) {
      if (role && !prev.role?.split(" / ").includes(role)) prev.role = prev.role ? `${prev.role} / ${role}` : role;
      if (r.episode_count) prev.episodes = Math.max(prev.episodes ?? 0, r.episode_count);
      continue;
    }
    byTitle.set(key, {
      ...fromResult({ ...r, genre_ids: r.genre_ids ?? [] }, type),
      role,
      episodes: r.episode_count ?? null,
      votes: r.vote_count ?? 0,
    });
  }
  // Undated (announced) titles go last
  return [...byTitle.values()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.votes - a.votes);
}

/** A person's profile and filmography (cast and crew, series and movies). */
export async function getPerson(id: string): Promise<PersonDetail | null> {
  if (!tmdbConfigured()) return mockPersonDetail(id);
  if (!/^\d{1,10}$/.test(id)) return null;
  try {
    const d = await tmdb<{
      id: number;
      name: string;
      biography: string;
      birthday: string | null;
      deathday: string | null;
      place_of_birth: string | null;
      profile_path: string | null;
      known_for_department: string | null;
      combined_credits?: { cast: TmdbPersonCredit[]; crew: TmdbPersonCredit[] };
    }>(`/person/${id}`, { append_to_response: "combined_credits" });
    // Most people have no Portuguese biography: fall back to English
    const biography =
      d.biography ||
      (await tmdb<{ biography: string }>(`/person/${id}`, { language: "en-US" }).then((e) => e.biography).catch(() => ""));
    const keep = (r: TmdbPersonCredit) =>
      (r.media_type === "tv" || r.media_type === "movie") &&
      !(r.genre_ids ?? []).some((g) => SKIP_GENRES.has(g)) &&
      (r.poster_path || (r.vote_count ?? 0) > 0);
    const credits = d.combined_credits ?? { cast: [], crew: [] };
    return {
      id: String(d.id),
      name: d.name,
      biography,
      birthday: d.birthday,
      deathday: d.deathday,
      placeOfBirth: d.place_of_birth,
      profilePath: d.profile_path,
      knownFor: d.known_for_department ? (DEPARTMENTS[d.known_for_department] ?? d.known_for_department) : null,
      acting: mergeCredits(
        credits.cast.filter((r) => keep(r) && !SELF.test(r.character ?? "")).map((r) => ({ r, role: r.character || null })),
      ),
      crew: mergeCredits(credits.crew.filter(keep).map((r) => ({ r, role: r.job ? jobLabel(r.job) : null }))),
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("TMDB 404")) return null;
    throw e;
  }
}

/** Builds a sample-catalog person from every movie credit carrying their name. */
function mockPersonDetail(id: string): PersonDetail | null {
  let name: string | null = null;
  const acting: PersonCredit[] = [];
  const crew: PersonCredit[] = [];
  for (const [movieId, credits] of Object.entries(MOCK_CREDITS)) {
    const m = findMock("movie", Number(movieId));
    if (!m) continue;
    const credit = (role: string): PersonCredit => ({ ...fromMock(m), role, episodes: null, votes: mockVotes(m)?.[1] ?? 0 });
    for (const d of credits.directors) {
      if (personSlug(d) !== id) continue;
      name = d;
      crew.push(credit("Direção"));
    }
    for (const [actor, role] of credits.cast) {
      if (personSlug(actor) !== id) continue;
      name = actor;
      acting.push(credit(role));
    }
  }
  if (!name) return null;
  const byYear = (a: PersonCredit, b: PersonCredit) => (b.year ?? 0) - (a.year ?? 0);
  return {
    id,
    name,
    biography: "",
    birthday: null,
    deathday: null,
    placeOfBirth: null,
    profilePath: null,
    knownFor: acting.length >= crew.length ? "Atuação" : "Direção",
    acting: acting.sort(byYear),
    crew: crew.sort(byYear),
  };
}

const REGION = "BR";

type TmdbProvider = { provider_id: number; provider_name: string; logo_path: string | null; display_priority: number };
type TmdbProviderRegion = {
  link?: string;
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
};

const providerList = (...groups: (TmdbProvider[] | undefined)[]) =>
  uniqueProviders(
    groups
      .flatMap((g) => g ?? [])
      .sort((a, b) => a.display_priority - b.display_priority)
      .map(toProvider),
  );

function mockProviders(type: ContentType, id: number): WatchProviders {
  const m = MOCK_PROVIDERS[`${type}:${id}`];
  const fromKeys = (keys: string[] = []) =>
    keys.flatMap((k) => {
      const b = brand(k);
      return b ? [{ key: b.key, name: b.name, logoPath: null }] : [];
    });
  return { stream: fromKeys(m?.stream), store: fromKeys(m?.store), link: null };
}

/** Where a title can be watched in Brazil: streaming first, then rent or buy. */
export async function getWatchProviders(type: ContentType, id: number): Promise<WatchProviders> {
  if (!tmdbConfigured()) return mockProviders(type, id);
  const d = await tmdb<{ results?: Record<string, TmdbProviderRegion> }>(`/${tmdbKind(type)}/${id}/watch/providers`);
  const br = d.results?.[REGION];
  if (!br) return { stream: [], store: [], link: null };
  const stream = providerList(br.flatrate, br.free, br.ads);
  const streamKeys = new Set(stream.map((p) => p.key));
  return {
    stream,
    // A service already listed for streaming is not repeated under rent or buy
    store: providerList(br.rent, br.buy).filter((p) => !streamKeys.has(p.key)),
    link: br.link ?? null,
  };
}

/** Streaming services for a page of search results, keyed "type:id". A failed lookup is just left out. */
export async function getStreamingFor(items: { type: ContentType; id: number }[]) {
  const out: Record<string, WatchProvider[]> = {};
  await Promise.all(
    items.map(async ({ type, id }) => {
      const p = await getWatchProviders(type, id).catch(() => null);
      if (p) out[`${type}:${id}`] = p.stream;
    }),
  );
  return out;
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
