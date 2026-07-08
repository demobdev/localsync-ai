import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { graderAudits } from "@/db/schema";
import type { SetupPrefill } from "@/lib/onboarding/prefill";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AuditClaimStatus =
  | "unclaimed"
  | "claimed_same_org"
  | "claimed_other_org";

/** Grader audit + claim state for dashboard onboarding routing. */
export type AuditClaimContext = SetupPrefill & {
  failedChecks: number;
  estimatedMonthlyLoss: number;
  claimStatus: AuditClaimStatus;
  claimedLocationId: string | null;
  claimedOrganizationId: string | null;
};

export type OrgLocationOption = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  /** Higher = better match to the audit business. */
  matchScore: number;
};

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

/** Score how well an org location matches an audit (0–100). */
export function scoreLocationAuditMatch(input: {
  auditName: string | null;
  auditCity: string | null;
  locationName: string;
  locationCity: string | null;
}): number {
  if (!input.auditName) return 0;

  const auditNorm = normalizeName(input.auditName);
  const locationNorm = normalizeName(input.locationName);

  if (!auditNorm || !locationNorm) return 0;

  let score = 0;

  if (auditNorm === locationNorm) {
    score += 70;
  } else if (
    auditNorm.includes(locationNorm) ||
    locationNorm.includes(auditNorm)
  ) {
    score += 45;
  } else {
    const auditTokens = new Set(auditNorm.split(" "));
    const overlap = locationNorm
      .split(" ")
      .filter((token) => token.length > 2 && auditTokens.has(token)).length;
    score += Math.min(overlap * 15, 40);
  }

  if (input.auditCity && input.locationCity) {
    const auditCity = input.auditCity.trim().toLowerCase();
    const locationCity = input.locationCity.trim().toLowerCase();
    if (auditCity === locationCity) score += 30;
  }

  return Math.min(score, 100);
}

export function rankOrgLocationsForAudit(
  audit: Pick<SetupPrefill, "businessName" | "city" | "state">,
  locations: Array<{
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  }>,
): OrgLocationOption[] {
  return locations
    .map((location) => ({
      id: location.id,
      name: location.name,
      city: location.city,
      state: location.state,
      matchScore: scoreLocationAuditMatch({
        auditName: audit.businessName,
        auditCity: audit.city,
        locationName: location.name,
        locationCity: location.city,
      }),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getAuditClaimContext(
  auditId: string,
  session: { userId: string | null; orgId: string | null },
): Promise<AuditClaimContext | null> {
  if (!UUID_RE.test(auditId)) return null;

  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, auditId),
    columns: {
      id: true,
      websiteUrl: true,
      businessName: true,
      phone: true,
      city: true,
      state: true,
      totalScore: true,
      industry: true,
      progress: true,
      gbpProfile: true,
      failedChecks: true,
      estimatedMonthlyLoss: true,
      claimedByUserId: true,
      organizationId: true,
      locationId: true,
    },
  });

  if (!audit) return null;

  let claimStatus: AuditClaimStatus = "unclaimed";
  if (audit.claimedByUserId) {
    claimStatus =
      session.orgId && audit.organizationId === session.orgId
        ? "claimed_same_org"
        : "claimed_other_org";
  }

  return {
    source: "audit",
    auditId: audit.id,
    url: audit.websiteUrl,
    businessName: audit.businessName,
    phone: audit.phone,
    city: audit.city,
    state: audit.state,
    score: audit.totalScore,
    categorySlug: audit.industry,
    operatingModel: audit.progress?.operatingModel,
    auditTier: audit.progress?.auditTier,
    gbpLinked: audit.gbpProfile?.gbpLinked !== false,
    serviceAreaCities:
      audit.city && audit.state
        ? `${audit.city}, ${audit.state}`
        : audit.city ?? null,
    failedChecks: audit.failedChecks,
    estimatedMonthlyLoss: audit.estimatedMonthlyLoss,
    claimStatus,
    claimedLocationId: audit.locationId,
    claimedOrganizationId: audit.organizationId,
  };
}
