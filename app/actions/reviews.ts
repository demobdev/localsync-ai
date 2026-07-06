"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  approvalRequests,
  locationPublishers,
  locationReviews,
  locations,
  publishers,
} from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import { fetchGoogleReviewsSafe } from "@/lib/connectors/google-reviews";
import { getValidGoogleAccessToken } from "@/lib/connectors/google";
import { buildDemoReviews } from "@/lib/reviews/demo-seed";
import { generateReviewReplyDraft } from "@/lib/reviews/reply-generate";
import {
  computeReviewScore,
  type ReviewScoreBreakdown,
} from "@/lib/reviews/score";

export type LocationReviewRow = {
  id: string;
  source: "google" | "yelp" | "manual" | "demo";
  authorName: string;
  rating: number;
  text: string;
  publishedAt: Date | null;
  replyStatus: "unreplied" | "draft_pending" | "replied" | "skipped";
  replyText: string | null;
  replyPostedAt: Date | null;
  pendingDraft: {
    requestId: string;
    draftReply: string;
  } | null;
};

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

async function getPendingReplyDrafts(locationId: string, orgId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.locationId, locationId),
        eq(approvalRequests.organizationId, orgId),
        eq(approvalRequests.requestType, "review_reply_draft"),
        eq(approvalRequests.status, "pending"),
      ),
    );

  const map = new Map<
    string,
    { requestId: string; draftReply: string }
  >();

  for (const row of rows) {
    const reviewId = row.payload.reviewId as string | undefined;
    const draftReply = row.payload.draftReply as string | undefined;
    if (reviewId && draftReply) {
      map.set(reviewId, { requestId: row.id, draftReply });
    }
  }

  return map;
}

function mapReviewRow(
  row: typeof locationReviews.$inferSelect,
  pendingDrafts: Map<string, { requestId: string; draftReply: string }>,
): LocationReviewRow {
  return {
    id: row.id,
    source: row.source,
    authorName: row.authorName,
    rating: row.rating,
    text: row.text,
    publishedAt: row.publishedAt,
    replyStatus: row.replyStatus,
    replyText: row.replyText,
    replyPostedAt: row.replyPostedAt,
    pendingDraft: pendingDrafts.get(row.id) ?? null,
  };
}

export async function listLocationReviewsAction(
  locationId: string,
): Promise<LocationReviewRow[]> {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const [rows, pendingDrafts] = await Promise.all([
    db
      .select()
      .from(locationReviews)
      .where(
        and(
          eq(locationReviews.locationId, locationId),
          eq(locationReviews.organizationId, orgId),
        ),
      )
      .orderBy(desc(locationReviews.publishedAt), desc(locationReviews.createdAt)),
    getPendingReplyDrafts(locationId, orgId),
  ]);

  return rows.map((row) => mapReviewRow(row, pendingDrafts));
}

export async function getLocationReviewSummaryAction(
  locationId: string,
): Promise<ReviewScoreBreakdown> {
  const reviews = await listLocationReviewsAction(locationId);
  return computeReviewScore(
    reviews.map((review) => ({
      rating: review.rating,
      replyStatus: review.replyStatus,
    })),
  );
}

export async function getOrgReviewSummaryAction(): Promise<{
  totalReviews: number;
  unrepliedCount: number;
  averageScore: number;
  topLocation: { id: string; name: string; unrepliedCount: number } | null;
}> {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const rows = await db
    .select({
      id: locationReviews.id,
      locationId: locationReviews.locationId,
      locationName: locations.name,
      rating: locationReviews.rating,
      replyStatus: locationReviews.replyStatus,
    })
    .from(locationReviews)
    .innerJoin(locations, eq(locations.id, locationReviews.locationId))
    .where(eq(locationReviews.organizationId, orgId));

  const score = computeReviewScore(
    rows.map((row) => ({
      rating: row.rating,
      replyStatus: row.replyStatus,
    })),
  );

  const unrepliedByLocation = new Map<
    string,
    { name: string; count: number }
  >();

  for (const row of rows) {
    if (
      row.replyStatus !== "unreplied" &&
      row.replyStatus !== "draft_pending"
    ) {
      continue;
    }

    const current = unrepliedByLocation.get(row.locationId) ?? {
      name: row.locationName,
      count: 0,
    };
    current.count += 1;
    unrepliedByLocation.set(row.locationId, current);
  }

  const topEntry = [...unrepliedByLocation.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  )[0];

  return {
    totalReviews: score.totalCount,
    unrepliedCount: score.unrepliedCount,
    averageScore: score.score,
    topLocation: topEntry
      ? {
          id: topEntry[0],
          name: topEntry[1].name,
          unrepliedCount: topEntry[1].count,
        }
      : null,
  };
}

export async function seedDemoReviewsAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  const location = await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const seeds = buildDemoReviews(location.profile);
  const now = Date.now();
  let inserted = 0;

  for (const seed of seeds) {
    const externalId = `demo-${seed.authorName.toLowerCase().replace(/\s+/g, "-")}`;
    const [existing] = await db
      .select({ id: locationReviews.id })
      .from(locationReviews)
      .where(
        and(
          eq(locationReviews.locationId, locationId),
          eq(locationReviews.source, "demo"),
          eq(locationReviews.externalId, externalId),
        ),
      )
      .limit(1);

    if (existing) {
      continue;
    }

    await db.insert(locationReviews).values({
      organizationId: orgId,
      locationId,
      source: "demo",
      externalId,
      authorName: seed.authorName,
      rating: seed.rating,
      text: seed.text,
      publishedAt: new Date(now - seed.daysAgo * 86_400_000),
    });
    inserted += 1;
  }

  revalidatePath(`/dashboard/locations/${locationId}/reviews`);
  revalidatePath("/dashboard");

  return { inserted };
}

async function getGooglePublisherLink(locationId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      externalId: locationPublishers.externalId,
    })
    .from(locationPublishers)
    .innerJoin(publishers, eq(publishers.id, locationPublishers.publisherId))
    .where(
      and(
        eq(locationPublishers.locationId, locationId),
        eq(publishers.slug, "google-business-profile"),
      ),
    )
    .limit(1);

  return row?.externalId ?? null;
}

export async function syncGoogleReviewsAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const gbpResourceName = await getGooglePublisherLink(locationId);
  if (!gbpResourceName) {
    throw new Error(
      "Link this location to Google first — import fields from Connect → Google.",
    );
  }

  const accessToken = await getValidGoogleAccessToken(orgId);
  if (!accessToken) {
    throw new Error("Google is not connected. Link your account in Connect.");
  }

  const result = await fetchGoogleReviewsSafe(accessToken, gbpResourceName);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  let inserted = 0;
  let updated = 0;

  for (const review of result.reviews) {
    const [existing] = await db
      .select()
      .from(locationReviews)
      .where(
        and(
          eq(locationReviews.locationId, locationId),
          eq(locationReviews.source, "google"),
          eq(locationReviews.externalId, review.externalId),
        ),
      )
      .limit(1);

    if (existing) {
      if (
        review.existingReply &&
        existing.replyStatus === "unreplied" &&
        !existing.replyText
      ) {
        await db
          .update(locationReviews)
          .set({
            replyStatus: "replied",
            replyText: review.existingReply,
            replyPostedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(locationReviews.id, existing.id));
        updated += 1;
      }
      continue;
    }

    await db.insert(locationReviews).values({
      organizationId: orgId,
      locationId,
      source: "google",
      externalId: review.externalId,
      authorName: review.authorName,
      rating: review.rating,
      text: review.text,
      publishedAt: review.publishedAt,
      replyStatus: review.existingReply ? "replied" : "unreplied",
      replyText: review.existingReply ?? null,
      replyPostedAt: review.existingReply ? new Date() : null,
    });
    inserted += 1;
  }

  revalidatePath(`/dashboard/locations/${locationId}/reviews`);
  revalidatePath("/dashboard");

  return { inserted, updated, total: result.reviews.length };
}

export async function generateReviewReplyDraftAction(reviewId: string) {
  const { orgId, userId } = await requireOrgAuth();
  const db = getDb();

  const [review] = await db
    .select()
    .from(locationReviews)
    .where(
      and(
        eq(locationReviews.id, reviewId),
        eq(locationReviews.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.replyStatus === "replied") {
    throw new Error("This review already has a reply");
  }

  const pendingDrafts = await getPendingReplyDrafts(review.locationId, orgId);
  if (pendingDrafts.has(reviewId)) {
    throw new Error("Approve or reject the pending reply draft first");
  }

  const location = await assertLocationInOrg(review.locationId, orgId);
  const draftReply = await generateReviewReplyDraft({
    profile: location.profile,
    authorName: review.authorName,
    rating: review.rating,
    reviewText: review.text,
  });

  const [request] = await db
    .insert(approvalRequests)
    .values({
      organizationId: orgId,
      locationId: review.locationId,
      requestType: "review_reply_draft",
      payload: { reviewId, draftReply },
      requestedByUserId: userId,
    })
    .returning();

  await db
    .update(locationReviews)
    .set({ replyStatus: "draft_pending", updatedAt: new Date() })
    .where(eq(locationReviews.id, reviewId));

  revalidatePath(`/dashboard/locations/${review.locationId}/reviews`);

  return { requestId: request!.id, draftReply };
}

export async function approveReviewReplyAction(requestId: string) {
  const { orgId, userId } = await requireOrgAuth();
  const db = getDb();

  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.id, requestId),
        eq(approvalRequests.organizationId, orgId),
        eq(approvalRequests.requestType, "review_reply_draft"),
        eq(approvalRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    throw new Error("Reply draft not found or already reviewed");
  }

  const reviewId = request.payload.reviewId as string;
  const draftReply = request.payload.draftReply as string;

  const [review] = await db
    .select()
    .from(locationReviews)
    .where(
      and(
        eq(locationReviews.id, reviewId),
        eq(locationReviews.locationId, request.locationId),
        eq(locationReviews.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!review) {
    throw new Error("Review not found");
  }

  await db
    .update(locationReviews)
    .set({
      replyStatus: "replied",
      replyText: draftReply,
      replyPostedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(locationReviews.id, reviewId));

  await db
    .update(approvalRequests)
    .set({
      status: "approved",
      reviewedByUserId: userId,
      reviewedAt: new Date(),
    })
    .where(eq(approvalRequests.id, requestId));

  revalidatePath(`/dashboard/locations/${request.locationId}/reviews`);
  revalidatePath("/dashboard");

  return { reviewId };
}

export async function rejectReviewReplyAction(requestId: string) {
  const { orgId, userId } = await requireOrgAuth();
  const db = getDb();

  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.id, requestId),
        eq(approvalRequests.organizationId, orgId),
        eq(approvalRequests.requestType, "review_reply_draft"),
        eq(approvalRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    throw new Error("Reply draft not found or already reviewed");
  }

  const reviewId = request.payload.reviewId as string;

  await db
    .update(approvalRequests)
    .set({
      status: "rejected",
      reviewedByUserId: userId,
      reviewedAt: new Date(),
    })
    .where(eq(approvalRequests.id, requestId));

  await db
    .update(locationReviews)
    .set({ replyStatus: "unreplied", updatedAt: new Date() })
    .where(eq(locationReviews.id, reviewId));

  revalidatePath(`/dashboard/locations/${request.locationId}/reviews`);
}

export async function skipReviewAction(reviewId: string) {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const [review] = await db
    .select({ id: locationReviews.id, locationId: locationReviews.locationId })
    .from(locationReviews)
    .where(
      and(
        eq(locationReviews.id, reviewId),
        eq(locationReviews.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!review) {
    throw new Error("Review not found");
  }

  await db
    .update(locationReviews)
    .set({ replyStatus: "skipped", updatedAt: new Date() })
    .where(eq(locationReviews.id, reviewId));

  revalidatePath(`/dashboard/locations/${review.locationId}/reviews`);
  revalidatePath("/dashboard");
}
