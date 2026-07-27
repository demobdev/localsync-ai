/**
 * Copy + prioritization for the listings setup funnel
 * (coverage meter, next-best publishers, empty-row hints).
 */

export type ListingSetupRow = {
  id: string;
  publisherName: string;
  publisherSlug: string;
  rail: string;
  isCore: boolean;
};

/** Default priority for “next 2” when no model pack is passed. */
const DEFAULT_PRIORITY = [
  "google-business-profile",
  "yelp",
  "facebook",
  "apple-business-connect",
  "bbb",
  "bing-places",
  "nextdoor",
];

const PLACEHOLDERS: Record<string, string> = {
  "google-business-profile": "https://maps.google.com/… or g.page/…",
  "apple-business-connect": "https://maps.apple.com/…",
  "bing-places": "https://www.bing.com/maps?…",
  facebook: "https://www.facebook.com/YourPage",
  yelp: "https://www.yelp.com/biz/your-business",
  nextdoor: "https://nextdoor.com/pages/…",
  bbb: "https://www.bbb.org/us/…/profile/…",
  angi: "https://www.angi.com/companylist/…",
  homeadvisor: "https://www.homeadvisor.com/rated.…",
  thumbtack: "https://www.thumbtack.com/…",
};

const WHY_ONE_LINERS: Record<string, string> = {
  "google-business-profile": "Where most local searches start.",
  "apple-business-connect": "iPhone / Maps / Siri discovery.",
  "bing-places": "Microsoft search + Copilot citations.",
  facebook: "Social proof and local recommendations.",
  yelp: "Reviews and category rankings customers trust.",
  nextdoor: "Neighborhood word-of-mouth.",
  bbb: "Trust / accreditation checks before they call.",
};

export function listingUrlPlaceholder(slug: string): string {
  return PLACEHOLDERS[slug] ?? "https://…";
}

export function listingWhyLine(slug: string): string | null {
  return WHY_ONE_LINERS[slug] ?? null;
}

export function railSetupHint(rail: string): string {
  switch (rail) {
    case "api":
      return "Connect once — LocalMap can sync updates with approve-first.";
    case "guided_import":
      return "Guided setup — import from Google, then we monitor.";
    case "audit_only":
      return "We’ll audit this listing; you update it on their site (or upgrade for sync later).";
    case "manual":
      return "Paste the URL — LocalMap monitors NAP consistency.";
    default:
      return "Paste the public listing URL so we can audit it.";
  }
}

export function coreCoverage(input: {
  rows: ListingSetupRow[];
  urls: Record<string, string>;
}): { linked: number; total: number; percent: number } {
  const core = input.rows.filter((row) => row.isCore);
  const linked = core.filter((row) => (input.urls[row.id] ?? "").trim()).length;
  const total = core.length;
  return {
    linked,
    total,
    percent: total === 0 ? 0 : Math.round((linked / total) * 100),
  };
}

/** Next unlinked publishers to push — core first, by priority slug order. */
export function nextUnlinkedPublishers(input: {
  rows: ListingSetupRow[];
  urls: Record<string, string>;
  prioritySlugs?: string[];
  limit?: number;
}): ListingSetupRow[] {
  const priority = input.prioritySlugs ?? DEFAULT_PRIORITY;
  const limit = input.limit ?? 2;
  const unlinked = input.rows.filter(
    (row) => row.isCore && !(input.urls[row.id] ?? "").trim(),
  );

  const rank = (slug: string) => {
    const index = priority.indexOf(slug);
    return index === -1 ? priority.length + 50 : index;
  };

  return [...unlinked]
    .sort((a, b) => rank(a.publisherSlug) - rank(b.publisherSlug))
    .slice(0, limit);
}
