import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  locationPublishers,
  locations,
  publishers,
  syncJobItems,
  syncJobs,
} from "@/db/schema";
import { logActivityEvent } from "@/lib/activity/log";
import { getConnectorBySlug } from "@/lib/connectors/google-adapter";
import { stringifyFieldValue } from "@/lib/fields/registry";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

async function transitionJob(
  syncJobId: string,
  status: (typeof syncJobs.$inferInsert)["status"],
  patch?: Partial<typeof syncJobs.$inferInsert>,
) {
  const db = getDb();
  await db
    .update(syncJobs)
    .set({
      status,
      updatedAt: new Date(),
      ...patch,
    })
    .where(eq(syncJobs.id, syncJobId));
}

export async function executeSyncJob(syncJobId: string): Promise<{
  syncJobId: string;
  status: string;
}> {
  const db = getDb();
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.id, syncJobId))
    .limit(1);

  if (!job) {
    throw new Error("Sync job not found");
  }

  if (job.status === "live" || job.status === "failed" || job.status === "rejected") {
    return { syncJobId, status: job.status };
  }

  await transitionJob(syncJobId, "validating", {
    startedAt: job.startedAt ?? new Date(),
  });

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, job.locationId))
    .limit(1);

  const [publisher] = await db
    .select()
    .from(publishers)
    .where(eq(publishers.id, job.publisherId))
    .limit(1);

  if (!location || !publisher) {
    await transitionJob(syncJobId, "failed", {
      errorCode: "missing_entity",
      errorMessage: "Location or publisher missing for sync job",
      completedAt: new Date(),
    });
    return { syncJobId, status: "failed" };
  }

  const connector = getConnectorBySlug(publisher.slug);
  if (!connector?.updateListing) {
    await transitionJob(syncJobId, "failed", {
      errorCode: "unsupported_connector",
      errorMessage: `${publisher.name} does not support direct sync yet.`,
      completedAt: new Date(),
    });

    await db
      .update(locationPublishers)
      .set({ status: "unsupported", updatedAt: new Date() })
      .where(
        and(
          eq(locationPublishers.locationId, job.locationId),
          eq(locationPublishers.publisherId, job.publisherId),
        ),
      );

    return { syncJobId, status: "failed" };
  }

  const [link] = await db
    .select()
    .from(locationPublishers)
    .where(
      and(
        eq(locationPublishers.locationId, job.locationId),
        eq(locationPublishers.publisherId, job.publisherId),
      ),
    )
    .limit(1);

  if (!link?.externalId) {
    await transitionJob(syncJobId, "failed", {
      errorCode: "needs_match",
      errorMessage:
        "Link this location to a publisher listing before syncing.",
      completedAt: new Date(),
    });

    if (link) {
      await db
        .update(locationPublishers)
        .set({ status: "needs_connection", updatedAt: new Date() })
        .where(eq(locationPublishers.id, link.id));
    }

    return { syncJobId, status: "failed" };
  }

  await transitionJob(syncJobId, "sent");

  const writeResult = await connector.updateListing({
    organizationId: job.organizationId,
    listingId: link.externalId,
    profile: location.profile,
    changes: job.fieldKeys.map((fieldKey) => ({
      fieldKey,
      value: location.profile[fieldKey as keyof LocationProfileSnapshot],
    })),
  });

  if (writeResult.status === "rejected" || writeResult.status === "failed") {
    const nextStatus =
      writeResult.status === "rejected" ? "rejected" : "failed";

    await transitionJob(syncJobId, nextStatus, {
      errorCode: writeResult.status,
      errorMessage: writeResult.message ?? "Publisher write failed",
      publisherResponse: writeResult.raw ?? null,
      completedAt: new Date(),
    });

    await db
      .update(syncJobItems)
      .set({
        status: "failed",
        errorMessage: writeResult.message ?? "Publisher write failed",
        updatedAt: new Date(),
      })
      .where(eq(syncJobItems.syncJobId, syncJobId));

    await db
      .update(locationPublishers)
      .set({
        status: writeResult.status === "rejected" ? "rejected" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(locationPublishers.id, link.id));

    await logActivityEvent({
      organizationId: job.organizationId,
      locationId: job.locationId,
      actorUserId: job.requestedByUserId,
      action: "sync.failed",
      entityType: "sync_job",
      entityId: syncJobId,
      summary: `${publisher.name} sync failed: ${writeResult.message ?? "unknown error"}`,
      metadata: { status: nextStatus },
    });

    return { syncJobId, status: nextStatus };
  }

  await transitionJob(syncJobId, "accepted_by_publisher", {
    externalJobId: writeResult.externalJobId ?? null,
    publisherResponse: {
      message: writeResult.message,
      updatedFields: writeResult.updatedFields ?? [],
    },
  });

  await db
    .update(syncJobItems)
    .set({
      status: "accepted",
      updatedAt: new Date(),
    })
    .where(eq(syncJobItems.syncJobId, syncJobId));

  // Honest status: accepted is not Live and synced until verified.
  await db
    .update(locationPublishers)
    .set({
      status: "changes_pending",
      lastSyncedAt: new Date(),
      lastCheckedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(locationPublishers.id, link.id));

  if (connector.verifyListing) {
    await transitionJob(syncJobId, "processing");

    try {
      const verification = await connector.verifyListing({
        organizationId: job.organizationId,
        listingId: link.externalId,
        profile: location.profile,
        fieldKeys: job.fieldKeys,
      });

      for (const fieldKey of verification.matchedFields) {
        await db
          .update(syncJobItems)
          .set({
            status: "live",
            verifiedValue: stringifyFieldValue(
              location.profile[fieldKey as keyof LocationProfileSnapshot],
            ),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(syncJobItems.syncJobId, syncJobId),
              eq(syncJobItems.fieldKey, fieldKey),
            ),
          );
      }

      for (const mismatch of verification.mismatchedFields) {
        await db
          .update(syncJobItems)
          .set({
            status: "accepted",
            verifiedValue: mismatch.actual,
            errorMessage: `Expected "${mismatch.expected}" but publisher shows "${mismatch.actual}"`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(syncJobItems.syncJobId, syncJobId),
              eq(syncJobItems.fieldKey, mismatch.fieldKey),
            ),
          );
      }

      if (verification.verified) {
        await transitionJob(syncJobId, "live", {
          completedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        });

        await db
          .update(locationPublishers)
          .set({
            status: "live_synced",
            lastVerifiedAt: new Date(),
            lastCheckedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(locationPublishers.id, link.id));

        await logActivityEvent({
          organizationId: job.organizationId,
          locationId: job.locationId,
          actorUserId: job.requestedByUserId,
          action: "sync.live",
          entityType: "sync_job",
          entityId: syncJobId,
          summary: `${publisher.name} verified live and synced`,
          metadata: { matchedFields: verification.matchedFields },
        });

        return { syncJobId, status: "live" };
      }

      await transitionJob(syncJobId, "partially_applied", {
        completedAt: new Date(),
        errorMessage:
          "Publisher accepted changes, but live values are not fully verified yet.",
      });

      await logActivityEvent({
        organizationId: job.organizationId,
        locationId: job.locationId,
        actorUserId: job.requestedByUserId,
        action: "sync.partial",
        entityType: "sync_job",
        entityId: syncJobId,
        summary: `${publisher.name} accepted changes — verification incomplete`,
        metadata: {
          matchedFields: verification.matchedFields,
          mismatchedFields: verification.mismatchedFields,
        },
      });

      return { syncJobId, status: "partially_applied" };
    } catch (error) {
      await transitionJob(syncJobId, "accepted_by_publisher", {
        completedAt: new Date(),
        errorMessage:
          error instanceof Error
            ? `Write accepted; verification deferred: ${error.message}`
            : "Write accepted; verification deferred",
      });

      return { syncJobId, status: "accepted_by_publisher" };
    }
  }

  await transitionJob(syncJobId, "accepted_by_publisher", {
    completedAt: new Date(),
  });

  return { syncJobId, status: "accepted_by_publisher" };
}
