import { and, eq, isNotNull } from "drizzle-orm";

import { getDb } from "@/db";
import {
  auditEvidence,
  auditFindings,
  auditRuns,
  locationPublishers,
  locations,
  publishers,
} from "@/db/schema";
import { compareListingToMaster, summarizeFindings } from "@/lib/audit/compare";
import { extractListingData } from "@/lib/audit/extract";
import { scrapeUrl } from "@/lib/firecrawl";

export type AuditTarget = {
  locationPublisherId: string;
  publisherId: string;
  publisherName: string;
  listingUrl: string;
};

export async function getAuditTargets(locationId: string): Promise<AuditTarget[]> {
  const db = getDb();

  const rows = await db
    .select({
      locationPublisherId: locationPublishers.id,
      publisherId: publishers.id,
      publisherName: publishers.name,
      listingUrl: locationPublishers.listingUrl,
    })
    .from(locationPublishers)
    .innerJoin(publishers, eq(publishers.id, locationPublishers.publisherId))
    .where(
      and(
        eq(locationPublishers.locationId, locationId),
        isNotNull(locationPublishers.listingUrl),
      ),
    );

  return rows
    .filter((row): row is typeof row & { listingUrl: string } =>
      Boolean(row.listingUrl?.trim()),
    )
    .map((row) => ({
      locationPublisherId: row.locationPublisherId,
      publisherId: row.publisherId,
      publisherName: row.publisherName,
      listingUrl: row.listingUrl,
    }));
}

export async function auditSingleTarget(
  auditRunId: string,
  locationId: string,
  target: AuditTarget,
): Promise<{ findingCount: number; error?: string }> {
  const db = getDb();

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  if (!location) {
    throw new Error("Location not found");
  }

  try {
    const scraped = await scrapeUrl(target.listingUrl);
    const extracted = await extractListingData(scraped.markdown, target.listingUrl);
    const findings = compareListingToMaster(location.profile, extracted);

    await db.insert(auditEvidence).values({
      auditRunId,
      publisherId: target.publisherId,
      sourceUrl: target.listingUrl,
      markdownSnapshot: scraped.markdown.slice(0, 100000),
      extractedData: extracted as Record<string, unknown>,
    });

    if (findings.length > 0) {
      await db.insert(auditFindings).values(
        findings.map((finding) => ({
          auditRunId,
          publisherId: target.publisherId,
          fieldKey: finding.fieldKey,
          masterValue: finding.masterValue,
          foundValue: finding.foundValue,
          severity: finding.severity,
          message: `${target.publisherName}: ${finding.message}`,
        })),
      );
    }

    await db
      .update(locationPublishers)
      .set({ lastCheckedAt: new Date(), updatedAt: new Date() })
      .where(eq(locationPublishers.id, target.locationPublisherId));

    return { findingCount: findings.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed";

    await db.insert(auditFindings).values({
      auditRunId,
      publisherId: target.publisherId,
      fieldKey: "_crawl",
      masterValue: null,
      foundValue: null,
      severity: "warning",
      message: `${target.publisherName}: could not audit listing — ${message.slice(0, 300)}`,
    });

    return { findingCount: 1, error: message };
  }
}

export async function executeAuditRun(auditRunId: string): Promise<void> {
  const db = getDb();

  const [run] = await db
    .select()
    .from(auditRuns)
    .where(eq(auditRuns.id, auditRunId))
    .limit(1);

  if (!run) {
    throw new Error("Audit run not found");
  }

  await db
    .update(auditRuns)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(auditRuns.id, auditRunId));

  try {
    const targets = await getAuditTargets(run.locationId);

    for (const target of targets) {
      await auditSingleTarget(auditRunId, run.locationId, target);
    }

    const findings = await db
      .select()
      .from(auditFindings)
      .where(eq(auditFindings.auditRunId, auditRunId));

    await db
      .update(auditRuns)
      .set({
        status: "completed",
        completedAt: new Date(),
        summary:
          targets.length === 0
            ? "No listing URLs configured — add listing URLs to publishers first"
            : `Audited ${targets.length} listing${targets.length === 1 ? "" : "s"}: ${summarizeFindings(
                findings.map((finding) => ({
                  fieldKey: finding.fieldKey,
                  masterValue: finding.masterValue,
                  foundValue: finding.foundValue,
                  severity: finding.severity,
                  message: finding.message,
                })),
              )}`,
      })
      .where(eq(auditRuns.id, auditRunId));
  } catch (error) {
    await db
      .update(auditRuns)
      .set({
        status: "failed",
        completedAt: new Date(),
        summary: error instanceof Error ? error.message.slice(0, 500) : "Audit failed",
      })
      .where(eq(auditRuns.id, auditRunId));

    throw error;
  }
}
