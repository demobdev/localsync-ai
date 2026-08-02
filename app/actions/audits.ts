"use server";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  auditEvidence,
  auditFindings,
  auditRuns,
  locationPublishers,
  locations,
  publishers,
} from "@/db/schema";
import { executeAuditRun } from "@/lib/audit/run";
import { requireOrgAuth } from "@/lib/auth/org";
import { scrapeUrlFull } from "@/lib/firecrawl";
import { inngest } from "@/lib/inngest/client";
import {
  extractCandidateUrls,
  matchListingUrlsToPublishers,
  normalizeListingUrl,
} from "@/lib/publishers/detect-listing-url";
import {
  getLocationVisibilityScoreBreakdown,
} from "@/lib/visibility/location-score";
import { revalidateLocationScorePaths } from "@/lib/visibility/revalidate-location-score";
import type { VisibilityScoreBreakdown } from "@/lib/visibility/score";

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

async function waitForAuditRunCompletion(
  auditRunId: string,
  maxWaitMs = 120_000,
): Promise<"completed" | "failed"> {
  const db = getDb();
  const started = Date.now();

  while (Date.now() - started < maxWaitMs) {
    const [run] = await db
      .select({ status: auditRuns.status })
      .from(auditRuns)
      .where(eq(auditRuns.id, auditRunId))
      .limit(1);

    if (run?.status === "completed" || run?.status === "failed") {
      return run.status;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Audit is still running — refresh in a minute to see results.");
}

export type StartAuditResult = {
  auditRunId: string;
  status: "completed" | "failed";
  score: VisibilityScoreBreakdown;
  priorListingScore: number | null;
  listingScoreDelta: number | null;
};

export async function listLocationPublishersAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  return db
    .select({
      id: locationPublishers.id,
      publisherId: publishers.id,
      publisherName: publishers.name,
      publisherSlug: publishers.slug,
      rail: publishers.rail,
      deliveryRail: publishers.deliveryRail,
      approvalStatus: publishers.approvalStatus,
      verificationOwner: publishers.verificationOwner,
      costCadence: publishers.costCadence,
      estimatedCostCents: publishers.estimatedCostCents,
      costNotes: publishers.costNotes,
      ownershipPersists: publishers.ownershipPersists,
      supportedOperations: publishers.supportedOperations,
      evidenceRequirement: publishers.evidenceRequirement,
      isCore: publishers.isCore,
      isHomeServices: publishers.isHomeServices,
      status: locationPublishers.status,
      listingUrl: locationPublishers.listingUrl,
      externalId: locationPublishers.externalId,
      lastCheckedAt: locationPublishers.lastCheckedAt,
      sortOrder: publishers.sortOrder,
    })
    .from(locationPublishers)
    .innerJoin(publishers, eq(publishers.id, locationPublishers.publisherId))
    .where(eq(locationPublishers.locationId, locationId))
    .orderBy(publishers.sortOrder);
}

export async function updateListingUrlAction(input: {
  locationId: string;
  locationPublisherId: string;
  listingUrl: string;
  status?: "synced" | "pending" | "manual" | "unknown";
}) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();

  const trimmed = input.listingUrl.trim();
  const normalized =
    trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
  const canonical = normalized ? normalizeListingUrl(normalized) : null;

  if (trimmed && !canonical) {
    throw new Error("Listing URL must be a valid http:// or https:// link");
  }

  await db
    .update(locationPublishers)
    .set({
      listingUrl: canonical,
      ...(input.status ? { status: input.status } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(locationPublishers.id, input.locationPublisherId),
        eq(locationPublishers.locationId, input.locationId),
      ),
    );

  revalidateLocationScorePaths(input.locationId);
}

export type DiscoverListingUrlsResult = {
  scannedWebsite: string | null;
  filled: Array<{ publisherSlug: string; publisherName: string; url: string }>;
  skippedExisting: number;
  unmatchedCandidates: number;
};

/**
 * Crawl the location website (+ profile sameAs) and auto-fill empty
 * location_publishers.listing_url fields when Facebook/Yelp/etc. links are found.
 */
export async function discoverListingUrlsAction(
  locationId: string,
): Promise<DiscoverListingUrlsResult> {
  const { orgId } = await requireOrgAuth();
  const location = await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const profile = location.profile;
  const website =
    profile.website?.trim() ||
    (typeof profile.attributes?.websiteUrl === "string"
      ? profile.attributes.websiteUrl
      : null);

  const sameAs = Array.isArray(profile.sameAs) ? profile.sameAs : [];

  let html = "";
  let markdown = "";
  if (website) {
    try {
      const scraped = await scrapeUrlFull(
        /^https?:\/\//i.test(website) ? website : `https://${website}`,
      );
      html = scraped.rawHtml;
      markdown = scraped.markdown;
    } catch (error) {
      console.error("discoverListingUrls scrape failed", {
        locationId,
        website,
        error: error instanceof Error ? error.message : error,
      });
      // Continue with sameAs-only discovery.
    }
  }

  const candidates = extractCandidateUrls(html, markdown, ...sameAs);
  const matched = matchListingUrlsToPublishers(candidates);

  const rows = await db
    .select({
      id: locationPublishers.id,
      listingUrl: locationPublishers.listingUrl,
      publisherSlug: publishers.slug,
      publisherName: publishers.name,
    })
    .from(locationPublishers)
    .innerJoin(publishers, eq(publishers.id, locationPublishers.publisherId))
    .where(eq(locationPublishers.locationId, locationId));

  const bySlug = new Map(rows.map((row) => [row.publisherSlug, row]));
  const filled: DiscoverListingUrlsResult["filled"] = [];
  let skippedExisting = 0;

  for (const link of matched) {
    const row = bySlug.get(link.publisherSlug);
    if (!row) continue;

    const existingNormalized = row.listingUrl?.trim()
      ? normalizeListingUrl(row.listingUrl)
      : null;

    // Already have the same canonical URL
    if (existingNormalized && existingNormalized === link.url) {
      skippedExisting += 1;
      continue;
    }

    // Upgrade legacy Facebook /people/… URLs to profile.php?id=
    const shouldUpgrade =
      Boolean(existingNormalized) &&
      link.publisherSlug === "facebook" &&
      link.url.includes("profile.php?id=") &&
      existingNormalized !== link.url;

    if (row.listingUrl?.trim() && !shouldUpgrade) {
      skippedExisting += 1;
      continue;
    }

    await db
      .update(locationPublishers)
      .set({
        listingUrl: link.url,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(locationPublishers.id, row.id));

    filled.push({
      publisherSlug: link.publisherSlug,
      publisherName: row.publisherName,
      url: link.url,
    });
  }

  if (filled.length > 0) {
    revalidateLocationScorePaths(locationId);
  }

  return {
    scannedWebsite: website,
    filled,
    skippedExisting,
    unmatchedCandidates: Math.max(0, candidates.length - matched.length),
  };
}

export async function startAuditAction(
  locationId: string,
): Promise<StartAuditResult> {
  const { orgId, userId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const priorScore = await getLocationVisibilityScoreBreakdown(locationId);
  const priorListingScore = priorScore?.auditScore ?? null;

  const [run] = await db
    .insert(auditRuns)
    .values({
      locationId,
      status: "queued",
      triggeredByUserId: userId,
    })
    .returning();

  if (!run) {
    throw new Error("Failed to create audit run");
  }

  try {
    await inngest.send({
      name: "audit/run.requested",
      data: { auditRunId: run.id },
    });
  } catch {
    // Inngest dev server not running — execute inline so local dev still works.
    await executeAuditRun(run.id);
  }

  const status = await waitForAuditRunCompletion(run.id);

  if (status === "failed") {
    throw new Error("Listing audit failed — check URLs and try again.");
  }

  const score =
    (await getLocationVisibilityScoreBreakdown(locationId)) ??
    priorScore ?? {
      total: 0,
      profileScore: 0,
      auditScore: 0,
      profileChecks: [],
    };

  revalidateLocationScorePaths(locationId);

  return {
    auditRunId: run.id,
    status,
    score,
    priorListingScore,
    listingScoreDelta:
      priorListingScore === null
        ? score.auditScore
        : score.auditScore - priorListingScore,
  };
}

export async function listAuditRunsAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  return db
    .select()
    .from(auditRuns)
    .where(eq(auditRuns.locationId, locationId))
    .orderBy(desc(auditRuns.createdAt))
    .limit(20);
}

export async function getAuditRunDetailAction(input: {
  locationId: string;
  auditRunId: string;
}) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();

  const [run] = await db
    .select()
    .from(auditRuns)
    .where(
      and(
        eq(auditRuns.id, input.auditRunId),
        eq(auditRuns.locationId, input.locationId),
      ),
    )
    .limit(1);

  if (!run) {
    throw new Error("Audit run not found");
  }

  const findings = await db
    .select({
      id: auditFindings.id,
      publisherId: auditFindings.publisherId,
      publisherName: publishers.name,
      fieldKey: auditFindings.fieldKey,
      masterValue: auditFindings.masterValue,
      foundValue: auditFindings.foundValue,
      severity: auditFindings.severity,
      message: auditFindings.message,
      createdAt: auditFindings.createdAt,
    })
    .from(auditFindings)
    .leftJoin(publishers, eq(publishers.id, auditFindings.publisherId))
    .where(eq(auditFindings.auditRunId, input.auditRunId));

  const evidence = await db
    .select({
      id: auditEvidence.id,
      publisherId: auditEvidence.publisherId,
      publisherName: publishers.name,
      sourceUrl: auditEvidence.sourceUrl,
      extractedData: auditEvidence.extractedData,
      createdAt: auditEvidence.createdAt,
    })
    .from(auditEvidence)
    .leftJoin(publishers, eq(publishers.id, auditEvidence.publisherId))
    .where(eq(auditEvidence.auditRunId, input.auditRunId));

  return { run, findings, evidence };
}
