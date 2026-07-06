import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import {
  getLocationReviewSummaryAction,
  listLocationReviewsAction,
} from "@/app/actions/reviews";
import { getLocationAction } from "@/app/actions/locations";
import { ReviewsPanel } from "@/components/locations/reviews-panel";
import { getDb } from "@/db";
import { locationPublishers, publishers } from "@/db/schema";

async function isGoogleLinked(locationId: string) {
  const db = getDb();
  const [row] = await db
    .select({ externalId: locationPublishers.externalId })
    .from(locationPublishers)
    .innerJoin(publishers, eq(publishers.id, locationPublishers.publisherId))
    .where(
      and(
        eq(locationPublishers.locationId, locationId),
        eq(publishers.slug, "google-business-profile"),
      ),
    )
    .limit(1);

  return Boolean(row?.externalId?.trim());
}

export default async function LocationReviewsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const location = await getLocationAction(locationId);

  if (!location) {
    notFound();
  }

  const [reviews, summary, googleLinked] = await Promise.all([
    listLocationReviewsAction(locationId),
    getLocationReviewSummaryAction(locationId),
    isGoogleLinked(locationId),
  ]);

  return (
    <ReviewsPanel
      locationId={locationId}
      reviews={reviews}
      summary={summary}
      googleLinked={googleLinked}
    />
  );
}
