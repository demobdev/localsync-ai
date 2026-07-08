/**
 * Keyword generation + SERP/map-pack rank provider seam.
 *
 * Today only `sampleRankProvider` exists: it produces deterministic, plausible
 * sample data (seeded by business URL) so the report always renders fully.
 *
 * To wire real rankings later, implement `RankProvider` against DataForSEO /
 * SerpAPI / Bright Data and return it from `getRankProvider()` when the
 * provider's env keys are present. Results are stored on the audit row, so
 * nothing downstream changes — `KeywordResult.source` flips to "provider".
 */

import { getIndustryProfile } from "./industry";
import { getSerpApiProvider } from "./serp-provider";
import type { SearchVertical } from "./vertical";
import type {
  Competitor,
  KeywordIntent,
  KeywordResult,
  MapResult,
  OrganicResult,
} from "./types";

export type RankLookupInput = {
  businessName: string;
  websiteDomain: string;
  city: string | null;
  state: string | null;
  industry: string;
  keywords: string[];
  /** Business coordinates when known (Places) — enables real map rendering. */
  latitude?: number | null;
  longitude?: number | null;
  /** Real businesses from Places — replaces fake "Harvest Table" style names. */
  realCompetitors?: Array<{
    name: string;
    rating: number;
    reviewCount: number;
    domain?: string;
    lat?: number | null;
    lng?: number | null;
  }>;
};

export interface RankProvider {
  fetchKeywordResults(input: RankLookupInput): Promise<KeywordResult[]>;
}

/**
 * Local-intent keywords from the resolved search vertical + city.
 *
 * The vertical noun is the niche customers actually type ("sports bar",
 * not "restaurant") — resolved automatically from Places type, business
 * name, and extracted services. Falls back to the industry pack when no
 * vertical is provided.
 */
export function generateKeywords(input: {
  industry: string;
  city: string | null;
  vertical?: SearchVertical;
}): string[] {
  const profile = getIndustryProfile(input.industry);
  const city = input.city?.trim() || "your area";

  const noun = input.vertical?.noun ?? profile.categoryNoun;
  const modifiers = input.vertical?.modifiers ?? [];
  const secondary = input.vertical?.secondaryTerms ?? profile.serviceTerms;

  const candidates = [
    `best ${noun} in ${city}`,
    `${noun} ${city}`,
    ...(modifiers[0] ? [`${modifiers[0]} ${noun} ${city}`] : []),
    `${noun} near me`,
    ...secondary.map((term) => `${term} ${city}`),
    ...(modifiers[1] ? [`${modifiers[1]} ${noun} ${city}`] : []),
  ];

  // Dedupe (case-insensitive) and cap to keep SERP probe costs predictable.
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      keywords.push(candidate);
    }
    if (keywords.length >= 6) break;
  }
  return keywords;
}

/**
 * Classifies a probed keyword by what it means for the business:
 * - protecting  — top-3 map or organic; dominance to defend
 * - competing   — ranked but below the fold; ground to gain
 * - opportunity — absent; searches competitors currently own
 */
export function classifyKeywordIntent(result: {
  yourMapRank: number | null;
  yourOrganicRank: number | null;
}): KeywordIntent {
  const best = Math.min(
    result.yourMapRank ?? Infinity,
    result.yourOrganicRank ?? Infinity,
  );
  if (best <= 3) return "protecting";
  if (best !== Infinity) return "competing";
  return "opportunity";
}

/** Deterministic PRNG (mulberry32) so sample data is stable per business. */
function createRng(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

function buildCompetitorNames(input: {
  rng: () => number;
  industry: string;
  city: string | null;
}): string[] {
  const profile = getIndustryProfile(input.industry);
  const city = input.city?.trim() || "Local";
  const names = new Set<string>();
  const styles = [...profile.competitorStyles];

  while (names.size < 3 && styles.length > 0) {
    const idx = Math.floor(input.rng() * styles.length);
    const [style] = styles.splice(idx, 1);
    if (!style) break;
    names.add(
      style.replace(/\{city\}/g, city).replace(/\{trade\}/g, profile.tradeNoun),
    );
  }
  while (names.size < 3) {
    names.add(`${city} ${profile.tradeNoun} ${names.size + 1}`);
  }

  return [...names];
}

const DIRECTORY_RESULTS: Array<{ domain: string; titleTemplate: string }> = [
  { domain: "yelp.com", titleTemplate: "THE BEST 10 {noun} in {city} - Yelp" },
  { domain: "angi.com", titleTemplate: "Top 10 {noun} near {city} | Angi" },
  { domain: "bbb.org", titleTemplate: "Accredited {noun} near {city} | BBB" },
  { domain: "thumbtack.com", titleTemplate: "The 10 Best {noun} in {city}" },
  { domain: "facebook.com", titleTemplate: "{noun} in {city} | Facebook" },
  { domain: "nextdoor.com", titleTemplate: "Recommended {noun} — Nextdoor" },
];

/**
 * Sample provider: generates plausible competitor rankings where the audited
 * business mostly loses — deterministic per domain, clearly typed as sample.
 */
export const sampleRankProvider: RankProvider = {
  async fetchKeywordResults(input: RankLookupInput): Promise<KeywordResult[]> {
    const rng = createRng(input.websiteDomain);
    const profile = getIndustryProfile(input.industry);
    const city = input.city?.trim() || "your area";
    const hasCoords = input.latitude != null && input.longitude != null;
    const realSeeds =
      input.realCompetitors && input.realCompetitors.length >= 2
        ? input.realCompetitors.slice(0, 3)
        : null;

    const competitorMeta = realSeeds
      ? realSeeds.map((competitor) => ({
          name: competitor.name,
          rating: competitor.rating || Math.round((3.9 + rng() * 1.0) * 10) / 10,
          reviewCount: competitor.reviewCount || 40 + Math.floor(rng() * 380),
          domain:
            competitor.domain ??
            `${competitor.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
          lat:
            competitor.lat ??
            (hasCoords ? input.latitude! + (rng() - 0.5) * 0.028 : null),
          lng:
            competitor.lng ??
            (hasCoords ? input.longitude! + (rng() - 0.5) * 0.036 : null),
        }))
      : buildCompetitorNames({
          rng,
          industry: input.industry,
          city: input.city,
        }).map((name) => ({
          name,
          rating: Math.round((3.9 + rng() * 1.0) * 10) / 10,
          reviewCount: 40 + Math.floor(rng() * 380),
          domain: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
          lat: hasCoords ? input.latitude! + (rng() - 0.5) * 0.028 : null,
          lng: hasCoords ? input.longitude! + (rng() - 0.5) * 0.036 : null,
        }));

    return input.keywords.map((keyword, keywordIndex) => {
      // The business ranks in the map pack for ~1/3 of keywords, never #1.
      const roll = rng();
      const yourMapRank =
        roll < 0.18 ? 3 : roll < 0.35 ? 4 + Math.floor(rng() * 4) : null;
      const organicRoll = rng();
      const yourOrganicRank =
        organicRoll < 0.25 ? 5 + Math.floor(rng() * 5) : null;

      // Rotate competitor order per keyword so ranks vary believably.
      const order = [...competitorMeta].sort(() => rng() - 0.5);

      const mapResults: MapResult[] = order.slice(0, 3).map((c, i) => ({
        rank: i + 1,
        name: c.name,
        rating: c.rating,
        reviewCount: c.reviewCount,
        isYou: false,
        lat: c.lat,
        lng: c.lng,
      }));
      if (yourMapRank !== null && yourMapRank <= 3) {
        mapResults[yourMapRank - 1] = {
          rank: yourMapRank,
          name: input.businessName,
          rating: 4.2,
          reviewCount: 28 + Math.floor(rng() * 40),
          isYou: true,
          lat: input.latitude ?? null,
          lng: input.longitude ?? null,
        };
      }

      const directories = [...DIRECTORY_RESULTS].sort(() => rng() - 0.5);
      const organicResults: OrganicResult[] = [];
      for (let rank = 1; rank <= 5; rank++) {
        if (yourOrganicRank === rank) {
          organicResults.push({
            rank,
            domain: input.websiteDomain,
            title: `${input.businessName} — ${profile.tradeNoun}`,
            type: "you",
            isYou: true,
          });
          continue;
        }
        if (rank <= 2 || rng() < 0.5) {
          const directory = directories[(keywordIndex + rank) % directories.length];
          if (directory) {
            organicResults.push({
              rank,
              domain: directory.domain,
              title: directory.titleTemplate
                .replace("{noun}", titleCase(profile.categoryNoun))
                .replace("{city}", titleCase(city)),
              type: directory.domain === "facebook.com" ? "social" : "directory",
              isYou: false,
            });
            continue;
          }
        }
        const competitor = order[rank % order.length];
        if (competitor) {
          organicResults.push({
            rank,
            domain: competitor.domain,
            title: `${competitor.name} | ${titleCase(profile.categoryNoun)} in ${titleCase(city)}`,
            type: "competitor",
            isYou: false,
          });
        }
      }

      return {
        keyword,
        monthlyVolume: 90 + Math.floor(rng() * 800),
        yourMapRank,
        yourOrganicRank,
        topCompetitor: mapResults[0]?.isYou ? null : (mapResults[0]?.name ?? null),
        mapResults,
        organicResults,
        source: "sample" as const,
      };
    });
  },
};

/** Aggregate competitor rows for the summary card from keyword results. */
export function deriveCompetitors(
  keywords: KeywordResult[],
  source?: Competitor["source"],
): Competitor[] {
  const byName = new Map<
    string,
    { rating: number; reviewCount: number; ranks: number[] }
  >();

  for (const keyword of keywords) {
    for (const result of keyword.mapResults) {
      if (result.isYou) continue;
      const existing = byName.get(result.name);
      if (existing) {
        existing.ranks.push(result.rank);
      } else {
        byName.set(result.name, {
          rating: result.rating,
          reviewCount: result.reviewCount,
          ranks: [result.rank],
        });
      }
    }
  }

  return [...byName.entries()]
    .map(([name, data]) => ({
      name,
      rating: data.rating,
      reviewCount: data.reviewCount,
      rank:
        Math.round(
          (data.ranks.reduce((sum, r) => sum + r, 0) / data.ranks.length) * 10,
        ) / 10,
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .map((competitor, index) => ({
      ...competitor,
      rank: index + 1,
      source: source ?? (keywords.some((k) => k.source === "provider") ? "serp" : "sample"),
    }));
}

/**
 * Real SERP data when SERPAPI_KEY is set; deterministic sample otherwise.
 * The SerpAPI provider falls back to sample results per-keyword on failure,
 * so the report always renders fully either way.
 */
export function getRankProvider(): RankProvider {
  return getSerpApiProvider(sampleRankProvider) ?? sampleRankProvider;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}
