/**
 * Streaming services, drawn as small monochrome marks next to titles. TMDB
 * (via JustWatch) lists each service under several names ("Netflix",
 * "Netflix Standard with Ads"…): they collapse into one brand here.
 */
export type WatchProvider = {
  /** Brand key ("netflix", "max"…) or "tmdb:<id>" for a service without a mark. */
  key: string;
  name: string;
  /** TMDB logo path, used only for services without a mark. */
  logoPath: string | null;
};

export type WatchProviders = {
  /** Subscription or free with ads. */
  stream: WatchProvider[];
  /** Rent or buy. */
  store: WatchProvider[];
  /** TMDB's "where to watch" page (JustWatch data, Brazil). */
  link: string | null;
};

type Brand = { key: string; name: string; mark: string; match: RegExp };

export const BRANDS: Brand[] = [
  { key: "netflix", name: "Netflix", mark: "N", match: /^netflix/i },
  { key: "prime", name: "Prime Video", mark: "prime", match: /^amazon prime video|^prime video/i },
  { key: "max", name: "Max", mark: "max", match: /^(hbo )?max\b|^hbo/i },
  { key: "disney", name: "Disney+", mark: "D+", match: /^disney ?(plus|\+)|^star ?(plus|\+)/i },
  { key: "globoplay", name: "Globoplay", mark: "g", match: /^globoplay/i },
  { key: "appletv", name: "Apple TV+", mark: "tv+", match: /^apple tv ?(plus|\+)/i },
  { key: "paramount", name: "Paramount+", mark: "P+", match: /^paramount ?(plus|\+)/i },
  { key: "crunchyroll", name: "Crunchyroll", mark: "CR", match: /^crunchyroll/i },
  { key: "mubi", name: "MUBI", mark: "M", match: /^mubi/i },
  { key: "claro", name: "Claro tv+", mark: "C+", match: /^claro (tv|video)/i },
  { key: "telecine", name: "Telecine", mark: "TC", match: /^telecine/i },
  { key: "youtube", name: "YouTube", mark: "YT", match: /^youtube/i },
  { key: "google", name: "Google Play", mark: "GP", match: /^google play/i },
  { key: "apple", name: "Apple TV", mark: "tv", match: /^apple (tv|itunes)/i },
  { key: "amazon", name: "Amazon Video", mark: "a", match: /^amazon video/i },
];

const BY_KEY = new Map(BRANDS.map((b) => [b.key, b]));

export function brand(key: string) {
  return BY_KEY.get(key) ?? null;
}

/** The brand a TMDB provider belongs to, or a provider of its own. */
export function toProvider(p: { provider_id: number; provider_name: string; logo_path: string | null }): WatchProvider {
  const b = BRANDS.find((x) => x.match.test(p.provider_name.trim()));
  return b ? { key: b.key, name: b.name, logoPath: null } : { key: `tmdb:${p.provider_id}`, name: p.provider_name, logoPath: p.logo_path };
}

/** Drops repeats of the same brand, keeping the first (TMDB's display order). */
export function uniqueProviders(list: WatchProvider[]) {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.key) ? false : (seen.add(p.key), true)));
}

/** Two letters for a service without a mark. */
export function providerInitials(name: string) {
  return name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
