"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
import { inngest } from "@/lib/inngest/client";

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
      isCore: publishers.isCore,
      isHomeServices: publishers.isHomeServices,
      status: locationPublishers.status,
      listingUrl: locationPublishers.listingUrl,
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

  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Listing URL must start with http:// or https://");
  }

  await db
    .update(locationPublishers)
    .set({
      listingUrl: trimmed || null,
      ...(input.status ? { status: input.status } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(locationPublishers.id, input.locationPublisherId),
        eq(locationPublishers.locationId, input.locationId),
      ),
    );

  revalidatePath(`/dashboard/locations/${input.locationId}/listings`);
}

export async function startAuditAction(locationId: string) {
  const { orgId, userId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

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

  revalidatePath(`/dashboard/locations/${locationId}/listings`);
  return run;
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
