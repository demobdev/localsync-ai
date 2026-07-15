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
    tagline: "Citation cleanup on your own steam",
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
    tagline: "The majors, synced and monitored",
    highlights: [
      "Google, Apple, Bing, Facebook, Yelp + map graph",
      "Approve-first profile sync",
      "Visibility score & history",
      "Everything in Basic",
    ],
  },
  {
    tier: "pro",
    slug: "pro_listings",
    name: "Pro Listings",
    priceMonthly: 79,
    tagline: "Automation + AI discovery layer",
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
