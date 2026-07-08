/**
 * SerpAPI rank provider — real Google map-pack + organic results.
 *
 * Active when SERPAPI_KEY is set. Each keyword is probed with one Google
 * search localized to the business's city/state; failures fall back to the
 * sample provider per-keyword so the report always renders fully.
 */

import type { RankLookupInput, RankProvider } from "./rank-provider";
import type { KeywordResult, MapResult, OrganicResult } from "./types";

const SERP_TIMEOUT_MS = 12_000;

type SerpLocalPlace = {
  position?: number;
  title?: string;
  rating?: number;
  reviews?: number;
  gps_coordinates?: { latitude?: number; longitude?: number };
};

type SerpOrganicResult = {
  position?: number;
  title?: string;
  link?: string;
};

type SerpResponse = {
  local_results?: { places?: SerpLocalPlace[] } | SerpLocalPlace[];
  organic_results?: SerpOrganicResult[];
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Loose containment match — "The Owners Box" ≈ "Owners Box Sports Grill". */
function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

function domainOf(link: string | undefined): string | null {
  if (!link) return null;
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const DIRECTORY_DOMAINS = new Set([
  "yelp.com",
  "tripadvisor.com",
  "angi.com",
  "bbb.org",
  "thumbtack.com",
  "nextdoor.com",
  "yellowpages.com",
  "opentable.com",
  "grubhub.com",
  "doordash.com",
  "ubereats.com",
  "mapquest.com",
  "foursquare.com",
]);

const SOCIAL_DOMAINS = new Set([
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "youtube.com",
]);

function classifyOrganic(domain: string, isYou: boolean): OrganicResult["type"] {
  if (isYou) return "you";
  if (DIRECTORY_DOMAINS.has(domain)) return "directory";
  if (SOCIAL_DOMAINS.has(domain)) return "social";
  return "competitor";
}

async function probeKeyword(input: {
  apiKey: string;
  keyword: string;
  businessName: string;
  websiteDomain: string;
  city: string | null;
  state: string | null;
}): Promise<KeywordResult> {
  const params = new URLSearchParams({
    engine: "google",
    q: input.keyword,
    google_domain: "google.com",
    gl: "us",
    hl: "en",
    num: "10",
    api_key: input.apiKey,
  });
  if (input.city) {
    params.set(
      "location",
      [input.city, input.state, "United States"].filter(Boolean).join(", "),
    );
  }

  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(SERP_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`SerpAPI ${response.status} for "${input.keyword}"`);
  }
  const data = (await response.json()) as SerpResponse;

  const places = Array.isArray(data.local_results)
    ? data.local_results
    : (data.local_results?.places ?? []);

  let yourMapRank: number | null = null;
  const mapResults: MapResult[] = places.slice(0, 3).map((place, index) => {
    const rank = place.position ?? index + 1;
    const isYou = namesMatch(place.title ?? "", input.businessName);
    if (isYou && yourMapRank === null) yourMapRank = rank;
    return {
      rank,
      name: place.title ?? "Unknown business",
      rating: place.rating ?? 0,
      reviewCount: place.reviews ?? 0,
      isYou,
      lat: place.gps_coordinates?.latitude ?? null,
      lng: place.gps_coordinates?.longitude ?? null,
    };
  });
  // Check beyond the top 3 so "position 4-20" reads as ranked, not absent.
  if (yourMapRank === null) {
    for (const place of places.slice(3, 20)) {
      if (namesMatch(place.title ?? "", input.businessName)) {
        yourMapRank = place.position ?? null;
        break;
      }
    }
  }

  let yourOrganicRank: number | null = null;
  const organicResults: OrganicResult[] = (data.organic_results ?? [])
    .slice(0, 5)
    .map((result, index) => {
      const rank = result.position ?? index + 1;
      const domain = domainOf(result.link) ?? "unknown";
      const isYou = domain === input.websiteDomain;
      if (isYou && yourOrganicRank === null) yourOrganicRank = rank;
      return {
        rank,
        domain,
        title: result.title ?? domain,
        type: classifyOrganic(domain, isYou),
        isYou,
      };
    });
  if (yourOrganicRank === null) {
    for (const result of (data.organic_results ?? []).slice(5, 20)) {
      if (domainOf(result.link) === input.websiteDomain) {
        yourOrganicRank = result.position ?? null;
        break;
      }
    }
  }

  const topMap = mapResults.find((r) => r.rank === 1);

  return {
    keyword: input.keyword,
    monthlyVolume: null, // SerpAPI has no volume data; UI treats null as n/a.
    yourMapRank,
    yourOrganicRank,
    topCompetitor: topMap && !topMap.isYou ? topMap.name : null,
    mapResults,
    organicResults,
    source: "provider",
  };
}

/** Returns the SerpAPI provider when the key exists, otherwise null. */
export function getSerpApiProvider(
  fallback: RankProvider,
): RankProvider | null {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  return {
    async fetchKeywordResults(input: RankLookupInput): Promise<KeywordResult[]> {
      // All keywords probed in parallel; individual failures fall back to
      // the sample result for that keyword only.
      const settled = await Promise.allSettled(
        input.keywords.map((keyword) =>
          probeKeyword({
            apiKey,
            keyword,
            businessName: input.businessName,
            websiteDomain: input.websiteDomain,
            city: input.city,
            state: input.state,
          }),
        ),
      );

      const failedKeywords = input.keywords.filter(
        (_, i) => settled[i]?.status === "rejected",
      );
      const sampleByKeyword = new Map<string, KeywordResult>();
      if (failedKeywords.length > 0) {
        console.warn("SerpAPI probe failed for keywords", failedKeywords);
        const samples = await fallback.fetchKeywordResults({
          ...input,
          keywords: failedKeywords,
        });
        for (const sample of samples) {
          sampleByKeyword.set(sample.keyword, sample);
        }
      }

      return input.keywords.map((keyword, i) => {
        const result = settled[i];
        if (result?.status === "fulfilled") return result.value;
        return (
          sampleByKeyword.get(keyword) ?? {
            keyword,
            monthlyVolume: null,
            yourMapRank: null,
            yourOrganicRank: null,
            topCompetitor: null,
            mapResults: [],
            organicResults: [],
            source: "sample" as const,
          }
        );
      });
    },
  };
}
