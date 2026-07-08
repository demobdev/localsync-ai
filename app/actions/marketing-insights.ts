"use server";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { locations } from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import {
  fetchCompletedAuditsForLocations,
  getOrgGraderAuditSummary,
  type OrgGraderAuditSummary,
} from "@/lib/grader/client-audit-summaries";
import { buildGraderScoreTrend } from "@/lib/grader/location-audit-bridge";
import {
  resolveRecentMarketingInsight,
  type RecentMarketingInsight,
} from "@/lib/grader/dashboard";

export async function getLocationGraderScoresAction(): Promise<
  Record<string, { totalScore: number; scoreDelta: number | null }>
> {
  const { orgId } = await requireOrgAuth();
  const db = getDb();
  const locationRows = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.organizationId, orgId));

  const locationIds = locationRows.map((row) => row.id);
  const auditsByLocation = await fetchCompletedAuditsForLocations(locationIds);
  const scores: Record<string, { totalScore: number; scoreDelta: number | null }> =
    {};

  for (const locationId of locationIds) {
    const audits = auditsByLocation.get(locationId) ?? [];
    const current = audits[0];
    if (!current) continue;

    const trend = buildGraderScoreTrend({
      totalScore: current.totalScore,
      failedChecks: current.failedChecks,
      prior: audits[1] ?? null,
    });

    scores[locationId] = {
      totalScore: current.totalScore,
      scoreDelta: trend.scoreDelta,
    };
  }

  return scores;
}

export async function getOrgGraderAuditSummaryAction(): Promise<OrgGraderAuditSummary> {
  const { orgId } = await requireOrgAuth();
  return getOrgGraderAuditSummary(orgId);
}

export async function getRecentMarketingInsightAction(input?: {
  highlightAuditId?: string | null;
  highlightScanId?: string | null;
}): Promise<RecentMarketingInsight | null> {
  const { orgId } = await requireOrgAuth();
  return resolveRecentMarketingInsight({
    organizationId: orgId,
    highlightAuditId: input?.highlightAuditId,
    highlightScanId: input?.highlightScanId,
  });
}
