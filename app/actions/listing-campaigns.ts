"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import {
  locationPublishers,
  locations,
  manualTasks,
  publishers,
  submissionCampaigns,
  submissionEvents,
  submissionTargets,
} from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import {
  deriveInitialSubmissionTarget,
  type SubmissionTargetStatus,
} from "@/lib/publishers/campaign";
import type { PublisherDeliveryRail } from "@/lib/publishers/delivery";

const locationIdSchema = z.string().uuid();
const approveTargetSchema = z.object({
  locationId: z.string().uuid(),
  targetId: z.string().uuid(),
});

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

function revalidateCampaignPaths(locationId: string) {
  revalidatePath(`/dashboard/locations/${locationId}/listings`);
  revalidatePath("/dashboard/tasks");
}

async function isSubmissionCampaignStorageReady() {
  const result = await getDb().execute<{ relation: string | null }>(
    sql`select to_regclass('public.submission_campaigns')::text as relation`,
  );

  return Boolean(result.rows[0]?.relation);
}

async function requireSubmissionCampaignStorage() {
  if (!(await isSubmissionCampaignStorageReady())) {
    throw new Error(
      "Submission campaign storage is awaiting the reviewed database migration",
    );
  }
}

export type SubmissionCampaignTargetRow = {
  id: string;
  campaignId: string;
  publisherId: string;
  publisherName: string;
  publisherSlug: string;
  deliveryRail: PublisherDeliveryRail;
  status: SubmissionTargetStatus;
  statusDetail: string;
  nextAction: string;
  customerActionRequired: boolean;
  listingUrl: string | null;
  approvedAt: Date | null;
  submittedAt: Date | null;
  liveAt: Date | null;
  verifiedAt: Date | null;
  updatedAt: Date;
};

export type LatestSubmissionCampaign = {
  id: string;
  status: "draft" | "active" | "paused" | "completed" | "canceled";
  targetCount: number;
  startedAt: Date;
  updatedAt: Date;
  targets: SubmissionCampaignTargetRow[];
  recentEvents: Array<{
    id: string;
    eventType: string;
    message: string;
    createdAt: Date;
  }>;
};

export async function getLatestSubmissionCampaignAction(
  rawLocationId: string,
): Promise<LatestSubmissionCampaign | null> {
  const locationId = locationIdSchema.parse(rawLocationId);
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  if (!(await isSubmissionCampaignStorageReady())) return null;

  const [campaign] = await db
    .select()
    .from(submissionCampaigns)
    .where(eq(submissionCampaigns.locationId, locationId))
    .orderBy(desc(submissionCampaigns.createdAt))
    .limit(1);

  if (!campaign) return null;

  const [targets, recentEvents] = await Promise.all([
    db
      .select({
        id: submissionTargets.id,
        campaignId: submissionTargets.campaignId,
        publisherId: submissionTargets.publisherId,
        publisherName: publishers.name,
        publisherSlug: publishers.slug,
        deliveryRail: submissionTargets.deliveryRail,
        status: submissionTargets.status,
        statusDetail: submissionTargets.statusDetail,
        nextAction: submissionTargets.nextAction,
        customerActionRequired: submissionTargets.customerActionRequired,
        listingUrl: locationPublishers.listingUrl,
        approvedAt: submissionTargets.approvedAt,
        submittedAt: submissionTargets.submittedAt,
        liveAt: submissionTargets.liveAt,
        verifiedAt: submissionTargets.verifiedAt,
        updatedAt: submissionTargets.updatedAt,
      })
      .from(submissionTargets)
      .innerJoin(publishers, eq(publishers.id, submissionTargets.publisherId))
      .innerJoin(
        locationPublishers,
        eq(locationPublishers.id, submissionTargets.locationPublisherId),
      )
      .where(eq(submissionTargets.campaignId, campaign.id))
      .orderBy(publishers.sortOrder),
    db
      .select({
        id: submissionEvents.id,
        eventType: submissionEvents.eventType,
        message: submissionEvents.message,
        createdAt: submissionEvents.createdAt,
      })
      .from(submissionEvents)
      .where(eq(submissionEvents.campaignId, campaign.id))
      .orderBy(desc(submissionEvents.createdAt))
      .limit(12),
  ]);

  return {
    id: campaign.id,
    status: campaign.status,
    targetCount: campaign.targetCount,
    startedAt: campaign.startedAt,
    updatedAt: campaign.updatedAt,
    targets,
    recentEvents,
  };
}

export async function startSubmissionCampaignAction(rawLocationId: string) {
  const locationId = locationIdSchema.parse(rawLocationId);
  const { orgId, userId } = await requireOrgAuth();
  const location = await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  await requireSubmissionCampaignStorage();

  const [existing] = await db
    .select({ id: submissionCampaigns.id, targetCount: submissionCampaigns.targetCount })
    .from(submissionCampaigns)
    .where(
      and(
        eq(submissionCampaigns.locationId, locationId),
        inArray(submissionCampaigns.status, ["draft", "active", "paused"]),
      ),
    )
    .orderBy(desc(submissionCampaigns.createdAt))
    .limit(1);

  if (existing) {
    return {
      campaignId: existing.id,
      targetCount: existing.targetCount,
      reused: true,
    };
  }

  const publisherRows = await db
    .select({
      locationPublisherId: locationPublishers.id,
      publisherId: publishers.id,
      publisherName: publishers.name,
      deliveryRail: publishers.deliveryRail,
      approvalStatus: publishers.approvalStatus,
      listingUrl: locationPublishers.listingUrl,
      lastCheckedAt: locationPublishers.lastCheckedAt,
    })
    .from(locationPublishers)
    .innerJoin(publishers, eq(publishers.id, locationPublishers.publisherId))
    .where(eq(locationPublishers.locationId, locationId))
    .orderBy(publishers.sortOrder);

  if (publisherRows.length === 0) {
    throw new Error("No publishers are configured for this location yet");
  }

  const [campaign] = await db
    .insert(submissionCampaigns)
    .values({
      locationId,
      status: "active",
      profileSnapshot: location.profile,
      targetCount: publisherRows.length,
      createdByUserId: userId,
    })
    .returning();

  if (!campaign) {
    throw new Error("Could not create the submission campaign");
  }

  const targetValues = publisherRows.map((row) => {
    const initial = deriveInitialSubmissionTarget({
      publisherName: row.publisherName,
      deliveryRail: row.deliveryRail,
      approvalStatus: row.approvalStatus,
      listingUrl: row.listingUrl,
      lastCheckedAt: row.lastCheckedAt,
    });

    return {
      campaignId: campaign.id,
      locationPublisherId: row.locationPublisherId,
      publisherId: row.publisherId,
      deliveryRail: row.deliveryRail,
      status: initial.status,
      statusDetail: initial.statusDetail,
      nextAction: initial.nextAction,
      customerActionRequired: initial.customerActionRequired,
    };
  });

  const createdTargets = await db
    .insert(submissionTargets)
    .values(targetValues)
    .returning({
      id: submissionTargets.id,
      publisherId: submissionTargets.publisherId,
      status: submissionTargets.status,
      statusDetail: submissionTargets.statusDetail,
    });

  await db.insert(submissionEvents).values([
    {
      campaignId: campaign.id,
      eventType: "campaign_started",
      message: `Submission campaign started with ${createdTargets.length} publisher sources.`,
      actorUserId: userId,
      metadata: { sourceCount: createdTargets.length },
    },
    ...createdTargets.map((target) => ({
      campaignId: campaign.id,
      targetId: target.id,
      eventType: "target_routed",
      toStatus: target.status,
      message: target.statusDetail,
      actorUserId: userId,
      metadata: { publisherId: target.publisherId },
    })),
  ]);

  revalidateCampaignPaths(locationId);

  return {
    campaignId: campaign.id,
    targetCount: createdTargets.length,
    reused: false,
  };
}

export async function approveSubmissionTargetAction(rawInput: {
  locationId: string;
  targetId: string;
}) {
  const input = approveTargetSchema.parse(rawInput);
  const { orgId, userId } = await requireOrgAuth();
  await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();

  await requireSubmissionCampaignStorage();

  const [target] = await db
    .select({
      id: submissionTargets.id,
      campaignId: submissionTargets.campaignId,
      publisherId: submissionTargets.publisherId,
      publisherName: publishers.name,
      publisherSlug: publishers.slug,
      deliveryRail: submissionTargets.deliveryRail,
      status: submissionTargets.status,
      campaignLocationId: submissionCampaigns.locationId,
    })
    .from(submissionTargets)
    .innerJoin(
      submissionCampaigns,
      eq(submissionCampaigns.id, submissionTargets.campaignId),
    )
    .innerJoin(publishers, eq(publishers.id, submissionTargets.publisherId))
    .where(
      and(
        eq(submissionTargets.id, input.targetId),
        eq(submissionCampaigns.locationId, input.locationId),
      ),
    )
    .limit(1);

  if (!target) {
    throw new Error("Submission target not found");
  }

  if (target.status !== "ready_for_review") {
    throw new Error("This publisher is not waiting for approval");
  }

  const statusDetail =
    target.deliveryRail === "managed_submission"
      ? "Customer approved. LocalSync managed fulfillment is now queued for review."
      : "Customer approved. Delivery will begin when the publisher connection is available.";
  const nextAction =
    target.deliveryRail === "managed_submission"
      ? "Track managed fulfillment"
      : "Track delivery connection";

  await db
    .update(submissionTargets)
    .set({
      status: "approved",
      statusDetail,
      nextAction,
      customerActionRequired: false,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submissionTargets.id, target.id));

  if (target.deliveryRail === "managed_submission") {
    await db.insert(manualTasks).values({
      locationId: input.locationId,
      publisherId: target.publisherId,
      title: `Fulfill approved ${target.publisherName} submission`,
      description:
        "The customer approved the Master Profile payload. Complete the publisher workflow and attach live evidence before marking it verified.",
      status: "open",
      checklistItemKey: `campaign-${target.campaignId}-${target.publisherSlug}`,
    });
  }

  await db.insert(submissionEvents).values({
    campaignId: target.campaignId,
    targetId: target.id,
    eventType: "customer_approved",
    fromStatus: target.status,
    toStatus: "approved",
    message: `${target.publisherName} submission approved by the customer.`,
    actorUserId: userId,
  });

  revalidateCampaignPaths(input.locationId);

  return { targetId: target.id, status: "approved" as const };
}
