"use server";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  locations,
  searchConsoleConnections,
  searchPerformanceDaily,
  websiteAuditRuns,
  websiteFindings,
} from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import { inngest } from "@/lib/inngest/client";
import { dispatchBackgroundJob } from "@/lib/inngest/dispatch";
import { executeWebsiteAudit } from "@/lib/search-intelligence/audit";
import { deriveSearchOpportunities } from "@/lib/search-intelligence/scoring";
import { syncSearchConsolePerformance } from "@/lib/search-intelligence/search-console";

async function requireLocation(locationId: string, orgId: string) {
  const db = getDb();
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.organizationId, orgId)))
    .limit(1);
  if (!location) throw new Error("Location not found");
  return location;
}

export async function startWebsiteAuditAction(locationId: string) {
  const { orgId, userId } = await requireOrgAuth();
  const location = await requireLocation(locationId, orgId);
  if (!location.profile.website) {
    throw new Error("Add a website to the master profile before running an audit");
  }

  const db = getDb();
  const [running] = await db
    .select({ id: websiteAuditRuns.id })
    .from(websiteAuditRuns)
    .where(
      and(
        eq(websiteAuditRuns.locationId, locationId),
        sql`${websiteAuditRuns.status} in ('queued', 'running')`,
      ),
    )
    .limit(1);
  if (running) return { auditRunId: running.id };

  const [run] = await db
    .insert(websiteAuditRuns)
    .values({
      locationId,
      targetUrl: location.profile.website,
      triggeredByUserId: userId,
    })
    .returning({ id: websiteAuditRuns.id });

  await dispatchBackgroundJob({
    send: () =>
      inngest.send({
        name: "search-intelligence/audit.requested",
        data: { auditRunId: run.id },
      }),
    runInline: () => executeWebsiteAudit(run.id),
  });
  revalidatePath(`/dashboard/locations/${locationId}/search`);
  return { auditRunId: run.id };
}

export async function syncSearchConsoleAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await requireLocation(locationId, orgId);
  const result = await syncSearchConsolePerformance({
    organizationId: orgId,
    locationId,
  });
  revalidatePath(`/dashboard/locations/${locationId}/search`);
  return result;
}

export async function getSearchIntelligenceAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  const location = await requireLocation(locationId, orgId);
  const db = getDb();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 28);
  const sinceDay = since.toISOString().slice(0, 10);

  const [runs, connection, performance, trend] = await Promise.all([
    db
      .select()
      .from(websiteAuditRuns)
      .where(eq(websiteAuditRuns.locationId, locationId))
      .orderBy(desc(websiteAuditRuns.createdAt))
      .limit(10),
    db
      .select()
      .from(searchConsoleConnections)
      .where(eq(searchConsoleConnections.locationId, locationId))
      .limit(1),
    db
      .select({
        query: searchPerformanceDaily.query,
        page: searchPerformanceDaily.page,
        clicks: sql<number>`sum(${searchPerformanceDaily.clicks})::int`,
        impressions: sql<number>`sum(${searchPerformanceDaily.impressions})::int`,
        ctr: sql<number>`case when sum(${searchPerformanceDaily.impressions}) = 0 then 0 else sum(${searchPerformanceDaily.clicks})::float / sum(${searchPerformanceDaily.impressions}) end`,
        position: sql<number>`sum(${searchPerformanceDaily.positionMicros} * ${searchPerformanceDaily.impressions})::float / nullif(sum(${searchPerformanceDaily.impressions}) * 1000000, 0)`,
      })
      .from(searchPerformanceDaily)
      .where(
        and(
          eq(searchPerformanceDaily.locationId, locationId),
          gte(searchPerformanceDaily.day, sinceDay),
        ),
      )
      .groupBy(searchPerformanceDaily.query, searchPerformanceDaily.page),
    db
      .select({
        day: searchPerformanceDaily.day,
        clicks: sql<number>`sum(${searchPerformanceDaily.clicks})::int`,
        impressions: sql<number>`sum(${searchPerformanceDaily.impressions})::int`,
      })
      .from(searchPerformanceDaily)
      .where(
        and(
          eq(searchPerformanceDaily.locationId, locationId),
          gte(searchPerformanceDaily.day, sinceDay),
        ),
      )
      .groupBy(searchPerformanceDaily.day)
      .orderBy(searchPerformanceDaily.day),
  ]);

  const latestComplete = runs.find((run) => run.status === "completed") ?? null;
  const findings = latestComplete
    ? await db
        .select()
        .from(websiteFindings)
        .where(eq(websiteFindings.auditRunId, latestComplete.id))
    : [];
  const opportunities = deriveSearchOpportunities(
    performance.map((row) => ({
      ...row,
      clicks: Number(row.clicks),
      impressions: Number(row.impressions),
      ctr: Number(row.ctr),
      position: Number(row.position),
    })),
  );

  return {
    locationId,
    website: location.profile.website ?? null,
    latestRun: runs[0] ?? null,
    latestComplete,
    runs,
    findings,
    connection: connection[0] ?? null,
    opportunities,
    trend: trend.map((row) => ({
      day: row.day,
      clicks: Number(row.clicks),
      impressions: Number(row.impressions),
    })),
  };
}
