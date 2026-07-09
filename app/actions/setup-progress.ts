"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getGoogleImportStateAction } from "@/app/actions/google-import";
import { getDb } from "@/db";
import {
  auditRuns,
  generatedPages,
  locationPublishers,
  locationReviews,
  locations,
} from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import { getLocationOperatingContext, type LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import {
  buildLocationSetupProgress,
  type SetupProgress,
} from "@/lib/profile/setup-workflow";
import { getGraderAuditForLocation } from "@/lib/grader/location-audit-bridge";
import { getLocationVisibilityScoreBreakdown } from "@/lib/visibility/location-score";
import {
  countOpenGraderTasksForLocation,
} from "@/lib/grader/seed-tasks-from-audit";

async function assertLocationInOrg(locationId: string, orgId: string) {
  const db = getDb();
  const [location] = await db
    .select()
    .from(locations)
    .where(
      and(eq(locations.id, locationId), eq(locations.organizationId, orgId)),
    )
    .limit(1);

  if (!location) {
    throw new Error("Location not found");
  }

  return location;
}

export async function getLocationSetupProgressAction(
  locationId: string,
): Promise<SetupProgress> {
  const { orgId } = await requireOrgAuth();
  const location = await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const [googleState, publisherUrls, auditRow, page, reviewTotalRow, reviewUnrepliedRow] =
    await Promise.all([
    getGoogleImportStateAction().catch((error) => {
      console.error("[setup-progress] Google import state failed:", error);
      return { status: "not_connected" as const };
    }),
    db
      .select({ listingUrl: locationPublishers.listingUrl })
      .from(locationPublishers)
      .where(eq(locationPublishers.locationId, locationId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditRuns)
      .where(
        and(
          eq(auditRuns.locationId, locationId),
          eq(auditRuns.status, "completed"),
        ),
      ),
    db
      .select({ status: generatedPages.status })
      .from(generatedPages)
      .where(eq(generatedPages.locationId, locationId))
      .orderBy(desc(generatedPages.updatedAt))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(locationReviews)
      .where(eq(locationReviews.locationId, locationId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(locationReviews)
      .where(
        and(
          eq(locationReviews.locationId, locationId),
          inArray(locationReviews.replyStatus, ["unreplied", "draft_pending"]),
        ),
      ),
  ]);

  const googleConnected = googleState.status === "connected";
  const googleCanImport =
    googleState.status === "connected" &&
    googleState.locations.length > 0 &&
    !googleState.fetchError;

  const listingUrlsConfigured = publisherUrls.filter((row) =>
    row.listingUrl?.trim(),
  ).length;

  const linkedAudit = await getGraderAuditForLocation(locationId);
  const graderOpenTaskCount = await countOpenGraderTasksForLocation({
    db,
    locationId,
  });
  const visibilityScore = await getLocationVisibilityScoreBreakdown(locationId);

  return buildLocationSetupProgress({
    locationId,
    profile: location.profile,
    operatingContext: getLocationOperatingContext(location.profile),
    graderChecks: linkedAudit?.checks ?? null,
    graderOpenTaskCount,
    googleConnected,
    googleCanImport,
    listingUrlsConfigured,
    auditRunsCompleted: auditRow[0]?.count ?? 0,
    listingAuditScore: visibilityScore?.auditScore ?? 0,
    hasGeneratedPage: Boolean(page[0]),
    hasPublishedPage: page[0]?.status === "published",
    reviewCount: reviewTotalRow[0]?.count ?? 0,
    unrepliedReviewCount: reviewUnrepliedRow[0]?.count ?? 0,
  });
}

export async function getPrimaryLocationSetupAction(): Promise<{
  locationId: string | null;
  progress: SetupProgress | null;
  operatingContext: LocationOperatingContext | null;
}> {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const [location] = await db
    .select({ id: locations.id, profile: locations.profile })
    .from(locations)
    .where(eq(locations.organizationId, orgId))
    .orderBy(desc(locations.updatedAt))
    .limit(1);

  if (!location) {
    return { locationId: null, progress: null, operatingContext: null };
  }

  const progress = await getLocationSetupProgressAction(location.id);
  return {
    locationId: location.id,
    progress,
    operatingContext: getLocationOperatingContext(location.profile),
  };
}
