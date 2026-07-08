/**
 * Server-side Google Places lookup when the user enters a website URL instead of
 * picking from autocomplete. Matches listings whose websiteUri shares the host.
 */

import type { GraderPlaceInput } from "@/lib/grader/place";

function mapsApiKey(): string | null {
  return (
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ??
    null
  );
}

/** Common brand fragments for splitting glued domains ("onedessertplace"). */
const BRAND_FRAGMENTS = [
  "dessert",
  "desserts",
  "bakery",
  "kitchen",
  "restaurant",
  "coffee",
  "carolina",
  "restore",
  "restoration",
  "owners",
  "local",
  "place",
  "shop",
  "grill",
  "truck",
  "food",
  "sweet",
  "treats",
  "cafe",
  "box",
  "one",
  "the",
];

function splitGluedBrandSlug(slug: string): string {
  let remaining = slug.toLowerCase().replace(/[-_]/g, "");
  if (remaining.length < 6) return slug;

  const words: string[] = [];
  const sorted = [...BRAND_FRAGMENTS].sort((a, b) => b.length - a.length);

  while (remaining.length > 0) {
    let matched = false;
    for (const fragment of sorted) {
      if (remaining.startsWith(fragment)) {
        words.push(fragment);
        remaining = remaining.slice(fragment.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (remaining.length > 0) words.push(remaining);
      break;
    }
  }

  return words.length >= 2 ? words.join(" ") : slug;
}

/** "onedessertplace.com" → "one dessert place" for text search. */
export function domainToSearchQuery(hostname: string): string {
  const base = hostname.replace(/^www\./, "").split(".")[0] ?? hostname;
  const normalized = base
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.includes(" ")) return normalized;
  return splitGluedBrandSlug(normalized);
}

export function normalizeHost(urlOrHost: string): string {
  try {
    const withProtocol = urlOrHost.includes("://")
      ? urlOrHost
      : `https://${urlOrHost}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return urlOrHost.replace(/^www\./, "").toLowerCase();
  }
}

function hostsMatch(a: string, b: string): boolean {
  const left = normalizeHost(a);
  const right = normalizeHost(b);
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`);
}

type PlacesSearchPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  primaryTypeDisplayName?: { text?: string };
};

function toGraderPlace(place: PlacesSearchPlace): GraderPlaceInput | null {
  if (!place.id) return null;
  const placeId = place.id.replace(/^places\//, "");

  return {
    placeId,
    name: place.displayName?.text ?? "Your business",
    formattedAddress: place.formattedAddress ?? null,
    phone: place.nationalPhoneNumber ?? null,
    websiteUri: place.websiteUri ?? null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    primaryType: place.primaryTypeDisplayName?.text ?? null,
    photoUrls: [],
    photoCount: 0,
    reviews: [],
  };
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
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.nationalPhoneNumber",
          "places.websiteUri",
          "places.rating",
          "places.userRatingCount",
          "places.location",
          "places.primaryTypeDisplayName",
        ].join(","),
      },
      body: JSON.stringify({ textQuery, maxResultCount: 8 }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.warn("[grader] Places searchText failed", response.status, body);
    if (response.status === 400 || response.status === 403) {
      throw new Error(
        "Google Places API rejected the server key — use business name search or enable Places API on a server key.",
      );
    }
    return [];
  }

  const payload = (await response.json()) as { places?: PlacesSearchPlace[] };
  return payload.places ?? [];
}

export type PlaceLookupResult =
  | { status: "found"; place: GraderPlaceInput; matchedBy: "website" | "name" }
  | { status: "not_found"; searchedAs: string }
  | { status: "error"; message: string };

/**
 * Finds a Google Business Profile that matches the website host, or falls back
 * to the best name match from the domain.
 */
export async function lookupPlaceByWebsite(
  websiteUrl: string,
): Promise<PlaceLookupResult> {
  const key = mapsApiKey();
  if (!key) {
    return {
      status: "error",
      message: "Places API key not configured — pick your business from search instead of pasting a URL.",
    };
  }

  const host = normalizeHost(websiteUrl);
  const brandQuery = domainToSearchQuery(host);

  try {
    const queries = [
      brandQuery,
      brandQuery.replace(/\s+/g, ""),
      host,
    ].filter((q, i, arr) => q.length >= 2 && arr.indexOf(q) === i);

    for (const textQuery of queries) {
      const places = await searchPlaces(textQuery);
      if (places.length === 0) continue;

      const websiteMatch = places.find(
        (place) => place.websiteUri && hostsMatch(place.websiteUri, host),
      );
      if (websiteMatch) {
        const mapped = toGraderPlace(websiteMatch);
        if (mapped) {
          return { status: "found", place: mapped, matchedBy: "website" };
        }
      }
    }

    // Single strong name match when only one result looks like the brand.
    const namePlaces = await searchPlaces(brandQuery);
    const single =
      namePlaces.length === 1 ? toGraderPlace(namePlaces[0]!) : null;
    if (single) {
      return { status: "found", place: single, matchedBy: "name" };
    }

    return { status: "not_found", searchedAs: brandQuery };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Places lookup failed";
    if (message.includes("server key")) {
      return { status: "error", message };
    }
    return { status: "error", message };
  }
}

function normalizeBusinessName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesLooselyMatch(a: string, b: string): boolean {
  const na = normalizeBusinessName(a);
  const nb = normalizeBusinessName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Text search for a business by name (optionally with city). Used after the
 * website crawl when the domain-only lookup missed the listing.
 */
export async function lookupPlaceByText(
  textQuery: string,
  options?: { websiteHost?: string; preferName?: string },
): Promise<PlaceLookupResult> {
  const key = mapsApiKey();
  if (!key) {
    return {
      status: "error",
      message: "Places API key not configured.",
    };
  }

  const query = textQuery.trim();
  if (query.length < 2) {
    return { status: "not_found", searchedAs: query };
  }

  try {
    const places = await searchPlaces(query);
    if (places.length === 0) {
      return { status: "not_found", searchedAs: query };
    }

    if (options?.websiteHost) {
      const websiteMatch = places.find(
        (place) =>
          place.websiteUri &&
          hostsMatch(place.websiteUri, options.websiteHost!),
      );
      if (websiteMatch) {
        const mapped = toGraderPlace(websiteMatch);
        if (mapped) {
          return { status: "found", place: mapped, matchedBy: "website" };
        }
      }
    }

    if (options?.preferName) {
      const nameMatch = places.find((place) =>
        namesLooselyMatch(
          place.displayName?.text ?? "",
          options.preferName!,
        ),
      );
      if (nameMatch) {
        const mapped = toGraderPlace(nameMatch);
        if (mapped) {
          return { status: "found", place: mapped, matchedBy: "name" };
        }
      }
    }

    if (places.length === 1) {
      const mapped = toGraderPlace(places[0]!);
      if (mapped) {
        return { status: "found", place: mapped, matchedBy: "name" };
      }
    }

    return { status: "not_found", searchedAs: query };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Places lookup failed";
    return { status: "error", message };
  }
}
