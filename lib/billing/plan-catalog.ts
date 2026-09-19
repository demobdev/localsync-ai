/**
 * Marketing plan catalog — safe to import from client components.
 * Clerk slugs must match billing.json / Dashboard → Billing → Plans.
 */

export type PlanTier = "basic" | "premium" | "pro";

export type PlanDefinition = {
  tier: PlanTier;
  /** Clerk org plan slug (checked as `org:<slug>`) */
  slug: string;
  name: string;
  priceMonthly: number;
  tagline: string;
  highlights: string[];
};

export const LISTING_PLANS: PlanDefinition[] = [
  {
    tier: "basic",
    slug: "basic_listings",
    name: "Basic Listings",
    priceMonthly: 19,
    tagline: "Build a consistent business profile",
    highlights: [
      "Secondary + audit-only publishers",
      "NAP consistency tracking",
      "Manual & guided checklists",
      "Listing audits with evidence",
    ],
  },
  {
    tier: "premium",
    slug: "premium_listings",
    name: "Premium Listings",
    priceMonthly: 49,
    tagline: "Manage connections, updates, and evidence",
    highlights: [
      "Core publisher workflows in one workspace",
      "Approved sync on available connections",
      "Visibility score & history",
      "Everything in Basic",
    ],
  },
  {
    tier: "pro",
    slug: "pro_listings",
    name: "Pro Listings",
    priceMonthly: 79,
    tagline: "Add reporting, reviews, and discovery",
    highlights: [
      "Analytics & duplicate detection",
      "Expanded publisher set",
      "AI visibility pages (/l/[id], llms.txt)",
      "Reputation: review inbox + AI reply drafts",
      "Everything in Premium",
    ],
  },
];

/** Feature slugs gated with has({ feature }) — attach to plans in Clerk. */
export const FEATURES = {
  /** Direct API write sync to publishers (GBP etc.) */
  apiSync: "api_sync",
  /** Review inbox + AI reply drafts */
  reputation: "reputation",
  /** AI citation network: public pages, llms.txt, IndexNow */
  aiCitation: "ai_citation",
  /** Publisher analytics dashboards */
  analytics: "analytics",
} as const;
