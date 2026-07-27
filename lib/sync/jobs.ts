import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  locationPublishers,
  publishers,
  syncJobItems,
  syncJobs,
} from "@/db/schema";
import { getFieldLabel, stringifyFieldValue } from "@/lib/fields/registry";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

export type CreateSyncJobInput = {
  organizationId: string;
  locationId: string;
  publisherId: string;
  locationVersionId?: string | null;
  requestedByUserId?: string | null;
  fieldKeys: string[];
  profile: LocationProfileSnapshot;
  idempotencyKey: string;
};

export async function findExistingSyncJob(idempotencyKey: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.idempotencyKey, idempotencyKey))
    .limit(1);

  return existing ?? null;
}

export async function createSyncJob(input: CreateSyncJobInput) {
  const db = getDb();
  const existing = await findExistingSyncJob(input.idempotencyKey);
  if (existing) {
    return existing;
  }

  const [job] = await db
    .insert(syncJobs)
    .values({
      organizationId: input.organizationId,
      locationId: input.locationId,
      publisherId: input.publisherId,
      locationVersionId: input.locationVersionId ?? null,
      status: "queued",
      requestedByUserId: input.requestedByUserId ?? null,
      idempotencyKey: input.idempotencyKey,
      fieldKeys: input.fieldKeys,
    })
    .returning();

  if (!job) {
    throw new Error("Failed to create sync job");
  }

  if (input.fieldKeys.length > 0) {
    await db.insert(syncJobItems).values(
      input.fieldKeys.map((fieldKey) => ({
        syncJobId: job.id,
        fieldKey,
        status: "queued" as const,
        masterValue: stringifyFieldValue(
          input.profile[fieldKey as keyof LocationProfileSnapshot],
        ),
      })),
    );
  }

  await db
    .update(locationPublishers)
    .set({
      status: "syncing",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(locationPublishers.locationId, input.locationId),
        eq(locationPublishers.publisherId, input.publisherId),
      ),
    );

  return job;
}

export async function listSyncJobsForLocation(locationId: string, limit = 20) {
  const db = getDb();
  return db
    .select({
      id: syncJobs.id,
      status: syncJobs.status,
      fieldKeys: syncJobs.fieldKeys,
      errorMessage: syncJobs.errorMessage,
      createdAt: syncJobs.createdAt,
      completedAt: syncJobs.completedAt,
      publisherName: publishers.name,
      publisherSlug: publishers.slug,
    })
    .from(syncJobs)
    .innerJoin(publishers, eq(publishers.id, syncJobs.publisherId))
    .where(eq(syncJobs.locationId, locationId))
    .orderBy(desc(syncJobs.createdAt))
    .limit(limit);
}

export async function getSyncJobWithItems(syncJobId: string) {
  const db = getDb();
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.id, syncJobId))
    .limit(1);

  if (!job) {
    return null;
  }

  const items = await db
    .select()
    .from(syncJobItems)
    .where(eq(syncJobItems.syncJobId, syncJobId));

  return { job, items };
}

export function describeSyncFields(fieldKeys: string[]): string {
  if (fieldKeys.length === 0) {
    return "no fields";
  }

  if (fieldKeys.length === 1) {
    return getFieldLabel(fieldKeys[0]!);
  }

  return `${fieldKeys.length} fields`;
}
