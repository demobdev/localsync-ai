/**
 * Real local competitors via Google Places text search — used when SerpAPI
 * isn't configured so we never show fake names like "Harvest Table".
 */

import { normalizeHost } from "./place-lookup";

function mapsApiKey(): string | null {
  return (
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ??
    null
  );
}

type PlacesSearchPlace = {
  displayName?: { text?: string };
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
};

export type LocalCompetitorSeed = {
  name: string;
  rating: number;
  reviewCount: number;
  domain: string;
  lat: number | null;
  lng: number | null;
  source: "places";
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSameBusiness(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4) {
    return na.includes(nb) || nb.includes(na);
  }
  return false;
}

async function searchPlaces(textQuery: string): Promise<PlacesSearchPlace[]> {
  const key = mapsApiKey();
  if (!key) return [];

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": [
          "places.displayName",
          "places.websiteUri",
          "places.rating",
          "places.userRatingCount",
          "places.location",
        ].join(","),
      },
      body: JSON.stringify({ textQuery, maxResultCount: 10 }),
    },
  );

  if (!response.ok) {
    console.warn("[grader] competitor search failed", response.status);
    return [];
  }

  const payload = (await response.json()) as { places?: PlacesSearchPlace[] };
  return payload.places ?? [];
}

/**
 * Finds real nearby businesses for the competitor summary and sample SERP
 * fallback. Excludes the audited business by name and website host.
 */
export async function fetchLocalCompetitors(input: {
  verticalNoun: string;
  city: string | null;
  state: string | null;
  businessName: string;
  websiteDomain: string;
}): Promise<LocalCompetitorSeed[]> {
  const location = [input.city, input.state, "United States"]
    .filter(Boolean)
    .join(", ");
  const queries = [
    input.city ? `best ${input.verticalNoun} in ${location}` : null,
    input.city ? `${input.verticalNoun} ${location}` : null,
    input.city ? `${input.verticalNoun} near ${input.city}` : null,
  ].filter((q): q is string => Boolean(q && q.length > 8));

  if (queries.length === 0) return [];

  const seen = new Set<string>();
  const results: LocalCompetitorSeed[] = [];

  for (const textQuery of queries) {
    if (results.length >= 5) break;
    const places = await searchPlaces(textQuery);
    for (const place of places) {
      const name = place.displayName?.text?.trim();
      if (!name) continue;
      const key = normalizeName(name);
      if (seen.has(key)) continue;
      if (isSameBusiness(name, input.businessName)) continue;
      const domain = place.websiteUri
        ? normalizeHost(place.websiteUri)
        : `${key.replace(/\s+/g, "")}.com`;
      if (domain === input.websiteDomain) continue;

      seen.add(key);
      results.push({
        name,
        rating: place.rating ?? 0,
        reviewCount: place.userRatingCount ?? 0,
        domain,
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
        source: "places",
      });
      if (results.length >= 5) break;
    }
  }

  return results.slice(0, 5);
}
