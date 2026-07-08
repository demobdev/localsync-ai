import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { graderAudits } from "@/db/schema";
import { buildGraderScoreTrend } from "@/lib/grader/location-audit-bridge";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

export type LocationAuditSummary = {
  locationId: string;
  locationName: string;
  city: string | null;
  auditId: string | null;
  totalScore: number | null;
  grade: string | null;
  failedChecks: number | null;
  priorTotalScore: number | null;
  scoreDelta: number | null;
  canRunAudit: boolean;
};

type AuditRow = {
  id: string;
  locationId: string | null;
  totalScore: number;
  grade: string | null;
  failedChecks: number;
};

function locationCanRunAudit(profile: LocationProfileSnapshot): boolean {
  const website = profile.website?.trim();
  const placeId = profile.attributes.googlePlaceId;
  return Boolean(website || (typeof placeId === "string" && placeId.length > 0));
}

function auditsByLocation(audits: AuditRow[]) {
  const map = new Map<string, AuditRow[]>();

  for (const audit of audits) {
    if (!audit.locationId) continue;
    const list = map.get(audit.locationId) ?? [];
    list.push(audit);
    map.set(audit.locationId, list);
  }

  return map;
}

export function summarizeLocationAudit(input: {
  profile: LocationProfileSnapshot;
  locationId: string;
  locationName: string;
  auditsForLocation: AuditRow[];
}): LocationAuditSummary {
  const current = input.auditsForLocation[0] ?? null;
  const prior = input.auditsForLocation[1] ?? null;
  const trend =
    current != null
      ? buildGraderScoreTrend({
          totalScore: current.totalScore,
          failedChecks: current.failedChecks,
          prior,
        })
      : {
          priorTotalScore: null,
          scoreDelta: null,
          priorFailedChecks: null,
          failedChecksDelta: null,
        };

  return {
    locationId: input.locationId,
    locationName: input.locationName,
    city: input.profile.city ?? null,
    auditId: current?.id ?? null,
    totalScore: current?.totalScore ?? null,
    grade: current?.grade ?? null,
    failedChecks: current?.failedChecks ?? null,
    priorTotalScore: trend.priorTotalScore,
    scoreDelta: trend.scoreDelta,
    canRunAudit: locationCanRunAudit(input.profile),
  };
}

export async function fetchCompletedAuditsForLocations(locationIds: string[]) {
  if (locationIds.length === 0) return new Map<string, AuditRow[]>();

  const db = getDb();
  const audits = await db
    .select({
      id: graderAudits.id,
      locationId: graderAudits.locationId,
      totalScore: graderAudits.totalScore,
      grade: graderAudits.grade,
      failedChecks: graderAudits.failedChecks,
      createdAt: graderAudits.createdAt,
    })
    .from(graderAudits)
    .where(
      and(
        inArray(graderAudits.locationId, locationIds),
        eq(graderAudits.status, "complete"),
      ),
    )
    .orderBy(desc(graderAudits.createdAt));

  return auditsByLocation(audits);
}
