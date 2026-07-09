import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { auditFindings, auditRuns, locations } from "@/db/schema";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import {
  computeVisibilityScore,
  type VisibilityScoreBreakdown,
} from "@/lib/visibility/score";

export type ListingAuditCounts = {
  runs: number;
  critical: number;
  warning: number;
  info: number;
};

export async function getListingAuditCounts(
  locationId: string,
): Promise<ListingAuditCounts> {
  const db = getDb();

  const [latestRun] = await db
    .select({ id: auditRuns.id })
    .from(auditRuns)
    .where(
      and(
        eq(auditRuns.locationId, locationId),
        eq(auditRuns.status, "completed"),
      ),
    )
    .orderBy(desc(auditRuns.createdAt))
    .limit(1);

  const [runCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditRuns)
    .where(
      and(
        eq(auditRuns.locationId, locationId),
        eq(auditRuns.status, "completed"),
      ),
    );

  if (!latestRun) {
    return {
      runs: runCountRow?.count ?? 0,
      critical: 0,
      warning: 0,
      info: 0,
    };
  }

  const findings = await db
    .select({ severity: auditFindings.severity })
    .from(auditFindings)
    .where(eq(auditFindings.auditRunId, latestRun.id));

  return {
    runs: runCountRow?.count ?? 0,
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}

export function computeLocationVisibilityScore(input: {
  profile: LocationProfileSnapshot;
  audit: ListingAuditCounts;
}): VisibilityScoreBreakdown {
  return computeVisibilityScore({
    profile: input.profile,
    audit: input.audit.runs > 0 ? input.audit : undefined,
  });
}

export async function getLocationVisibilityScoreBreakdown(
  locationId: string,
): Promise<VisibilityScoreBreakdown | null> {
  const db = getDb();
  const [location] = await db
    .select({ profile: locations.profile })
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  if (!location) return null;

  const audit = await getListingAuditCounts(locationId);
  return computeLocationVisibilityScore({
    profile: location.profile,
    audit,
  });
}