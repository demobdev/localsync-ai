/**
 * Query normalization + relevance scoring for Google Places search/autocomplete.
 * Helps "owners box" rank "The Owners Box" above unrelated results.
 */

export function normalizePlaceQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/^the\s+/i, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Variants to probe — autocomplete often needs "the" for branded names. */
export function buildSearchVariants(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const withoutThe = trimmed.replace(/^the\s+/i, "").trim();
  const variants = [
    trimmed,
    withoutThe,
    withoutThe.length >= 3 ? `the ${withoutThe}` : null,
    withoutThe.replace(/\s+/g, ""),
  ].filter((v): v is string => Boolean(v && v.length >= 2));

  return [...new Set(variants)];
}

/**
 * Higher = better match. Exact and prefix matches beat partial token overlap.
 */
export function scorePlaceMatch(query: string, candidateName: string): number {
  const q = normalizePlaceQuery(query);
  const name = normalizePlaceQuery(candidateName);
  if (!q || !name) return 0;

  if (name === q) return 100;
  if (name.startsWith(q) || q.startsWith(name)) return 92;
  if (name.includes(q) || q.includes(name)) return 85;

  const qTokens = q.split(" ").filter((t) => t.length > 1);
  const nameTokens = new Set(name.split(" "));
  if (qTokens.length === 0) return 0;

  let matched = 0;
  for (const token of qTokens) {
    if (nameTokens.has(token)) matched += 1;
    else if ([...nameTokens].some((nt) => nt.includes(token) || token.includes(nt))) {
      matched += 0.5;
    }
  }

  return Math.round((matched / qTokens.length) * 72);
}
