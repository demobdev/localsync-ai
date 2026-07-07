import { auth } from "@clerk/nextjs/server";

import {
  FEATURES,
  LISTING_PLANS,
  type PlanDefinition,
  type PlanTier,
} from "@/lib/billing/plan-catalog";

export type { PlanDefinition, PlanTier } from "@/lib/billing/plan-catalog";
export { FEATURES, LISTING_PLANS } from "@/lib/billing/plan-catalog";

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
