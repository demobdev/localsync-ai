import {
  getAuditClaimContext,
  type AuditClaimContext,
  type OrgLocationOption,
} from "@/lib/grader/claim-context";
import { locationFixQueueHref } from "@/lib/grader/location-audit-bridge";
import {
  buildFixOnboardingUrl,
  buildSignupUrl,
  type OnboardingIntent,
} from "@/lib/onboarding/routing";

export type GraderEntryRoute =
  | { type: "redirect"; href: string }
  | { type: "already_claimed" }
  | {
      type: "claim_onboarding";
      claimContext: AuditClaimContext;
      existingLocations: OrgLocationOption[];
      suggestedLocationId: string | null;
    }
  | { type: "generic_onboarding" };

export function resolveGraderEntryRoute(input: {
  claimContext: AuditClaimContext | null;
  session: { userId: string | null; orgId: string | null };
  existingLocations: OrgLocationOption[];
  addingAnother: boolean;
  setupComplete: boolean;
}): GraderEntryRoute {
  const { claimContext, session, existingLocations, addingAnother, setupComplete } =
    input;

  if (setupComplete || addingAnother || !claimContext?.auditId) {
    return { type: "generic_onboarding" };
  }

  if (claimContext.claimStatus === "claimed_other_org") {
    return { type: "already_claimed" };
  }

  if (
    claimContext.claimStatus === "claimed_same_org" &&
    claimContext.claimedLocationId
  ) {
    return {
      type: "redirect",
      href: locationFixQueueHref(claimContext.claimedLocationId),
    };
  }

  if (
    claimContext.claimStatus === "claimed_same_org" &&
    !claimContext.claimedLocationId
  ) {
    return {
      type: "redirect",
      href: `/dashboard?audit=${encodeURIComponent(claimContext.auditId)}`,
    };
  }

  if (!session.userId) {
    return { type: "generic_onboarding" };
  }

  const suggested =
    existingLocations.find((location) => location.matchScore >= 70)?.id ?? null;

  return {
    type: "claim_onboarding",
    claimContext,
    existingLocations,
    suggestedLocationId: suggested,
  };
}

/** Server-side href for grader report CTAs (Dashboard, Fix). */
export async function resolveGraderDashboardHref(input: {
  auditId: string;
  userId: string | null;
  orgId: string | null;
  intent?: OnboardingIntent;
  existingLocations?: OrgLocationOption[];
}): Promise<string> {
  if (!input.userId) {
    return buildSignupUrl(input.auditId);
  }

  const claimContext = await getAuditClaimContext(input.auditId, {
    userId: input.userId,
    orgId: input.orgId,
  });

  if (!claimContext) {
    return "/dashboard";
  }

  const route = resolveGraderEntryRoute({
    claimContext,
    session: { userId: input.userId, orgId: input.orgId },
    existingLocations: input.existingLocations ?? [],
    addingAnother: false,
    setupComplete: false,
  });

  if (route.type === "redirect") {
    return route.href;
  }

  if (route.type === "already_claimed") {
    return `/grader/${input.auditId}`;
  }

  return buildFixOnboardingUrl({
    auditId: input.auditId,
    intent: input.intent ?? "fix",
  });
}
