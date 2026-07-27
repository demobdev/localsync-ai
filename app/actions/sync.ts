"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  locationPublishers,
  locations,
  publishers,
} from "@/db/schema";
import { logActivityEvent } from "@/lib/activity/log";
import { requireOrgAuth, requireOrgWriteAccess } from "@/lib/auth/org";
import { getWorkspacePlan } from "@/lib/billing/plans";
import { listSyncableFieldKeys } from "@/lib/fields/registry";
import { inngest } from "@/lib/inngest/client";
import { executeSyncJob } from "@/lib/sync/execute";
import {
  createSyncJob,
  describeSyncFields,
  listSyncJobsForLocation,
} from "@/lib/sync/jobs";

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

export async function listLocationSyncJobsAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  return listSyncJobsForLocation(locationId);
}

export async function requestPublisherSyncAction(input: {
  locationId: string;
  publisherSlug?: string;
  fieldKeys?: string[];
}) {
  const { orgId, userId } = await requireOrgWriteAccess();
  const workspace = await getWorkspacePlan();

  if (!workspace.features.apiSync) {
    throw new Error(
      "API listing sync is a Premium feature. Upgrade at /dashboard/billing to push changes automatically.",
    );
  }

  const location = await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();
  const publisherSlug = input.publisherSlug ?? "google-business-profile";

  const [publisher] = await db
    .select()
    .from(publishers)
    .where(eq(publishers.slug, publisherSlug))
    .limit(1);

  if (!publisher) {
    throw new Error("Publisher is not configured");
  }

  const [link] = await db
    .select()
    .from(locationPublishers)
    .where(
      and(
        eq(locationPublishers.locationId, location.id),
        eq(locationPublishers.publisherId, publisher.id),
      ),
    )
    .limit(1);

  if (!link?.externalId) {
    throw new Error(
      "Connect and match this location to the publisher before syncing.",
    );
  }

  const fieldKeys =
    input.fieldKeys && input.fieldKeys.length > 0
      ? input.fieldKeys
      : listSyncableFieldKeys().map(String);

  const versionPart = location.currentVersionId ?? "current";
  const idempotencyKey = [
    "sync",
    location.id,
    publisher.id,
    versionPart,
    fieldKeys.slice().sort().join(","),
  ].join(":");

  const job = await createSyncJob({
    organizationId: orgId,
    locationId: location.id,
    publisherId: publisher.id,
    locationVersionId: location.currentVersionId,
    requestedByUserId: userId,
    fieldKeys,
    profile: location.profile,
    idempotencyKey,
  });

  await logActivityEvent({
    organizationId: orgId,
    locationId: location.id,
    actorUserId: userId,
    action: "sync.requested",
    entityType: "sync_job",
    entityId: job.id,
    summary: `Requested ${publisher.name} sync for ${describeSyncFields(fieldKeys)}`,
    metadata: { fieldKeys, publisherSlug },
  });

  try {
    await inngest.send({
      name: "sync/job.requested",
      data: { syncJobId: job.id },
    });
  } catch {
    // Inngest may be offline in local dev — execute inline.
    await executeSyncJob(job.id);
  }

  revalidatePath(`/dashboard/locations/${location.id}/listings`);
  revalidatePath(`/dashboard/locations/${location.id}`);
  revalidatePath("/dashboard/connect/google");

  return { syncJobId: job.id, status: job.status };
}

/**
 * Back-compat entry used by Google import UI — routes through the sync job framework.
 */
export async function pushGbpFieldsViaSyncAction(input: {
  locationId: string;
  fields: string[];
}) {
  return requestPublisherSyncAction({
    locationId: input.locationId,
    publisherSlug: "google-business-profile",
    fieldKeys: input.fields,
  });
}
