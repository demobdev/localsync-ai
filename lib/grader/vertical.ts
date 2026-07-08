/**
 * Search-vertical resolution: turns a coarse industry slug into the niche
 * noun customers actually type. A sports bar should be audited on
 * "sports bar Greenville", not "restaurant Greenville".
 *
 * Signals, in priority order (all automatic — never user-entered):
 *   1. Google Places primaryTypeDisplayName ("Sports bar", "Italian restaurant")
 *   2. Business-name cues ("Owners Box Sports Grill" → sports bar)
 *   3. Services extracted from the website crawl
 *   4. Industry pack fallback (categoryNoun / serviceTerms)
 */

import { getIndustryProfile } from "./industry";

export type SearchVertical = {
  /** The noun customers type, e.g. "sports bar", "plumber". */
  noun: string;
  /** Intent modifiers composed with the noun, e.g. "family friendly". */
  modifiers: string[];
  /** Up to two service phrases worth their own keyword. */
  secondaryTerms: string[];
};

/** Places types too generic to be a useful search noun. */
const GENERIC_TYPES = new Set([
  "establishment",
  "point of interest",
  "business",
  "company",
  "corporate office",
  "store",
  "service",
  "food",
]);

/**
 * Coarse single-word categories where a business-name cue is usually more
 * specific ("Bar" + "Owners Box Sports Grill" → sports bar).
 */
const COARSE_TYPES = new Set([
  "restaurant",
  "bar",
  "cafe",
  "shop",
  "clinic",
  "doctor",
  "lawyer",
  "contractor",
  "salon",
]);

/** Name fragments that reveal the niche when the place type is coarse. */
const NAME_CUES: Array<[RegExp, string]> = [
  [/sports?\s?(bar|grill|pub)/i, "sports bar"],
  [/bar\s?(&|and)\s?grill/i, "bar and grill"],
  [/(bbq|barbecue|barbeque|smokehouse)/i, "bbq restaurant"],
  [/pizz(a|eria)/i, "pizza restaurant"],
  [/(taco|taqueria|mexican)/i, "mexican restaurant"],
  [/sushi|ramen|hibachi/i, "japanese restaurant"],
  [/steak\s?house/i, "steakhouse"],
  [/seafood|oyster/i, "seafood restaurant"],
  [/wing(s|stop|house)/i, "wings restaurant"],
  [/brew(ery|ing|pub)|taproom/i, "brewery"],
  [/coffee|espresso|roaster/i, "coffee shop"],
  [/bakery|donut|doughnut|pastry/i, "bakery"],
  [/diner/i, "diner"],
  [/urgent\s?care/i, "urgent care clinic"],
  [/chiropract/i, "chiropractor"],
  [/barber/i, "barber shop"],
  [/nail(s| salon| bar)/i, "nail salon"],
  [/tattoo/i, "tattoo shop"],
];

/**
 * Search modifiers by industry — composed as "{modifier} {noun} {city}".
 * These are the qualified long-tail searches with the highest intent.
 */
const INDUSTRY_MODIFIERS: Record<string, string[]> = {
  restaurant: ["family friendly", "late night"],
  hvac: ["emergency", "24 hour"],
  plumbing: ["emergency", "24 hour"],
  electrical: ["licensed", "emergency"],
  roofing: ["affordable", "emergency"],
  restoration: ["emergency", "24 hour"],
  landscaping: ["affordable", "residential"],
  "pest-control": ["same day", "affordable"],
  dental: ["family", "emergency"],
  medical: ["walk in", "family"],
  veterinary: ["emergency", "affordable"],
  legal: ["top rated", "free consultation"],
  accounting: ["small business", "affordable"],
  "auto-repair": ["trusted", "affordable"],
  "real-estate": ["top rated", "local"],
  retail: ["local", "best"],
};

const DEFAULT_MODIFIERS = ["top rated"];

function normalizeNoun(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveSearchVertical(input: {
  /** Places primaryTypeDisplayName, when the audit started from a place. */
  primaryType: string | null | undefined;
  businessName: string | null | undefined;
  /** Services extracted from the website crawl (may be empty). */
  services: string[];
  industry: string;
}): SearchVertical {
  const profile = getIndustryProfile(input.industry);
  const placeType = input.primaryType ? normalizeNoun(input.primaryType) : null;
  const nameCue = matchNameCue(input.businessName);

  let noun: string;
  if (placeType && !GENERIC_TYPES.has(placeType) && !COARSE_TYPES.has(placeType)) {
    // Specific place type ("sports bar", "italian restaurant") wins outright.
    noun = placeType;
  } else if (nameCue) {
    // Coarse or missing type, but the business name reveals the niche.
    noun = nameCue;
  } else if (placeType && COARSE_TYPES.has(placeType)) {
    // Coarse type is still better than the industry pack ("bar" > "restaurant").
    noun = placeType;
  } else {
    noun = profile.categoryNoun;
  }

  // Secondary terms: real extracted services first, industry pack as filler.
  const services = input.services
    .map(normalizeNoun)
    .filter((s) => s.length > 3 && s !== noun);
  const secondaryTerms = [...new Set([...services, ...profile.serviceTerms])]
    .filter((term) => term !== noun)
    .slice(0, 2);

  return {
    noun,
    modifiers: INDUSTRY_MODIFIERS[input.industry] ?? DEFAULT_MODIFIERS,
    secondaryTerms,
  };
}

function matchNameCue(businessName: string | null | undefined): string | null {
  if (!businessName) return null;
  for (const [pattern, noun] of NAME_CUES) {
    if (pattern.test(businessName)) return noun;
  }
  return null;
}
