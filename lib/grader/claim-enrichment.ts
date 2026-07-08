import type { ExtractedBusiness } from "@/lib/grader/types";
import type {
  DayOfWeek,
  LocationProfileSnapshot,
  RegularHours,
} from "@/lib/types/location-profile";

export const ATTR_GOOGLE_PLACE_ID = "googlePlaceId";
export const ATTR_HOURS_SUMMARY_FROM_AUDIT = "hoursSummaryFromAudit";

type TaxonomyService = {
  slug: string;
  name: string;
  categorySlug: string;
};

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Map crawl-detected service names to taxonomy slugs (category-first). */
export function matchExtractedServicesToSlugs(input: {
  extractedServices: string[];
  taxonomyServices: TaxonomyService[];
  categorySlug: string;
}): string[] {
  const slugs = new Set<string>();
  const categoryServices = input.taxonomyServices.filter(
    (row) => row.categorySlug === input.categorySlug,
  );
  const pool =
    categoryServices.length > 0 ? categoryServices : input.taxonomyServices;

  for (const raw of input.extractedServices) {
    const norm = normalizeLabel(raw);
    if (!norm) continue;

    const exact = pool.find((row) => normalizeLabel(row.name) === norm);
    if (exact) {
      slugs.add(exact.slug);
      continue;
    }

    const partial = pool.find((row) => {
      const rowNorm = normalizeLabel(row.name);
      return rowNorm.includes(norm) || norm.includes(rowNorm);
    });
    if (partial) {
      slugs.add(partial.slug);
    }
  }

  return [...slugs].slice(0, 8);
}

const DAY_ALIASES: Record<string, DayOfWeek> = {
  mon: "monday",
  monday: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thursday: "thursday",
  fri: "friday",
  friday: "friday",
  sat: "saturday",
  saturday: "saturday",
  sun: "sunday",
  sunday: "sunday",
};

const DAY_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function parseTimeToken(raw: string): string | null {
  const match = raw
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ?? "00";
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!meridiem && hour <= 7) hour += 12;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function expandDayRange(startToken: string, endToken: string): DayOfWeek[] {
  const start = DAY_ALIASES[startToken.toLowerCase().slice(0, 3)];
  const end = DAY_ALIASES[endToken.toLowerCase().slice(0, 3)];
  if (!start || !end) return [];

  const startIdx = DAY_ORDER.indexOf(start);
  const endIdx = DAY_ORDER.indexOf(end);
  if (startIdx === -1 || endIdx === -1) return [];

  if (startIdx <= endIdx) {
    return DAY_ORDER.slice(startIdx, endIdx + 1);
  }
  return [...DAY_ORDER.slice(startIdx), ...DAY_ORDER.slice(0, endIdx + 1)];
}

/**
 * Best-effort parser for free-text hours from grader extraction.
 * Returns partial regularHours when patterns match; caller may store raw summary.
 */
export function parseHoursSummaryToRegularHours(
  summary: string | null | undefined,
): RegularHours {
  if (!summary?.trim()) return {};

  const text = summary.replace(/\s+/g, " ").trim();
  const hours: RegularHours = {};

  const rangePattern =
    /(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*(?:[-–—to]+\s*(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?))?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))/gi;

  let match: RegExpExecArray | null;
  while ((match = rangePattern.exec(text)) !== null) {
    const startDay = match[1];
    const endDay = match[2] ?? match[1];
    const open = parseTimeToken(match[3]);
    const close = parseTimeToken(match[4]);
    if (!open || !close || !startDay) continue;

    const days = expandDayRange(startDay, endDay);
    for (const day of days) {
      hours[day] = { open, close };
    }
  }

  return hours;
}

/** Merge grader extraction into a profile snapshot at claim time. */
export function enrichProfileFromGraderExtracted(input: {
  profile: LocationProfileSnapshot;
  extracted: ExtractedBusiness | null;
  matchedServiceSlugs: string[];
}): LocationProfileSnapshot {
  const { profile, extracted, matchedServiceSlugs } = input;
  if (!extracted) return profile;

  const parsedHours = parseHoursSummaryToRegularHours(extracted.hoursSummary);
  const hasParsedHours = Object.keys(parsedHours).length > 0;
  const nextAttributes = { ...profile.attributes };

  if (extracted.placeId) {
    nextAttributes[ATTR_GOOGLE_PLACE_ID] = extracted.placeId;
  }
  if (extracted.hoursSummary && !hasParsedHours) {
    nextAttributes[ATTR_HOURS_SUMMARY_FROM_AUDIT] = extracted.hoursSummary;
  }

  return {
    ...profile,
    serviceSlugs:
      matchedServiceSlugs.length > 0
        ? matchedServiceSlugs
        : profile.serviceSlugs,
    regularHours: hasParsedHours
      ? { ...profile.regularHours, ...parsedHours }
      : profile.regularHours,
    attributes: nextAttributes,
  };
}
