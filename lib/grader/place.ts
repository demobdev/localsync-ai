/**
 * Google Places (New) helpers for the grader: the place payload the client
 * sends after autocomplete selection, address parsing, and mapping Google's
 * primary type display name to our industry slugs.
 */

export type GraderPlaceInput = {
  placeId: string;
  name: string;
  formattedAddress?: string | null;
  phone?: string | null;
  websiteUri?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Places primaryTypeDisplayName, e.g. "Plumber", "Italian Restaurant". */
  primaryType?: string | null;
};

/**
 * Best-effort city/state from a formatted address like
 * "123 Main St, Bellevue, WA 98004, USA".
 */
export function parseCityState(formattedAddress: string | null | undefined): {
  city: string | null;
  state: string | null;
} {
  if (!formattedAddress) return { city: null, state: null };

  const parts = formattedAddress.split(",").map((p) => p.trim());
  if (parts.length < 3) return { city: null, state: null };

  // Last part is usually the country; the one before holds "STATE ZIP".
  const stateZip = parts[parts.length - 2] ?? "";
  const stateMatch = stateZip.match(/^([A-Za-z .]+?)(?:\s+[\d-]+)?$/);
  const city = parts[parts.length - 3] ?? null;

  return {
    city: city || null,
    state: stateMatch?.[1]?.trim() || null,
  };
}

const INDUSTRY_PATTERNS: Array<[RegExp, string]> = [
  [/plumb/i, "plumbing"],
  [/hvac|heating|air condition|furnace/i, "hvac"],
  [/roof/i, "roofing"],
  [/electric/i, "electrical"],
  [/landscap|lawn|garden/i, "landscaping"],
  [/pest|exterminat/i, "pest-control"],
  [/restorat|water damage|mold/i, "restoration"],
  [/law|attorney|legal/i, "legal"],
  [/account|tax|bookkeep|cpa/i, "accounting"],
  [/consult/i, "consulting"],
  [/dentist|dental|orthodont/i, "dental"],
  [/veterinar|animal hospital|pet clinic/i, "veterinary"],
  [/doctor|medical|clinic|physician|urgent care|health/i, "medical"],
  [/restaurant|cafe|coffee|pizza|food|bakery|bar|grill|diner|bistro|taco|sushi/i, "restaurant"],
  [/real estate|realtor|realty/i, "real-estate"],
  [/auto repair|mechanic|car repair|tire|auto service|body shop/i, "auto-repair"],
  [/marketing|advertis/i, "marketing-agency"],
  [/software|information technology|computer/i, "it-services"],
];

/** Maps a Places primary type display name to our category pack slug. */
export function mapPlaceTypeToIndustry(
  primaryType: string | null | undefined,
): string {
  if (!primaryType) return "retail";
  for (const [pattern, slug] of INDUSTRY_PATTERNS) {
    if (pattern.test(primaryType)) return slug;
  }
  return "retail";
}
