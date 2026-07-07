import { auth } from "@clerk/nextjs/server";

/**
 * LocalSync offering buckets — mirrors docs/pricing-and-offerings.md.
 * Plan + feature slugs must match Clerk Dashboard → Billing → Plans
 * (Organization Plans tab; billing is org-level for LocalSync).
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
      "Review inbox + AI reply drafts",
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

export type WorkspacePlan = {
  tier: PlanTier;
  plan: PlanDefinition;
  isPaid: boolean;
  features: {
    apiSync: boolean;
    reputation: boolean;
    aiCitation: boolean;
    analytics: boolean;
  };
};

const BASIC_PLAN = LISTING_PLANS[0]!;

/**
 * Resolve the current workspace's plan from Clerk billing.
 * Until billing is enabled in the Clerk Dashboard, every has() check
 * returns false and workspaces resolve to Basic — safe default.
 */
export async function getWorkspacePlan(): Promise<WorkspacePlan> {
  const { has } = await auth();

  const isPro = has({ plan: "org:pro_listings" });
  const isPremium = isPro || has({ plan: "org:premium_listings" });

  const plan = isPro
    ? LISTING_PLANS[2]!
    : isPremium
      ? LISTING_PLANS[1]!
      : BASIC_PLAN;

  return {
    tier: plan.tier,
    plan,
    isPaid: isPremium,
    features: {
      apiSync: has({ feature: FEATURES.apiSync }),
      reputation: has({ feature: FEATURES.reputation }),
      aiCitation: has({ feature: FEATURES.aiCitation }),
      analytics: has({ feature: FEATURES.analytics }),
    },
  };
}
