import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import {
  getLocationReviewSummaryAction,
  listLocationReviewsAction,
} from "@/app/actions/reviews";
import { getLocationAction } from "@/app/actions/locations";
import { UpgradeBanner } from "@/components/billing/upgrade-banner";
import { ReviewsPanel } from "@/components/locations/reviews-panel";
import { getDb } from "@/db";
import { locationPublishers, publishers } from "@/db/schema";
import { getWorkspacePlan } from "@/lib/billing/plans";

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

  const [reviews, summary, googleLinked, workspace] = await Promise.all([
    listLocationReviewsAction(locationId),
    getLocationReviewSummaryAction(locationId),
    isGoogleLinked(locationId),
    getWorkspacePlan(),
  ]);

  return (
    <div className="space-y-6">
      {!workspace.features.reputation ? (
        <UpgradeBanner
          badge="Pro plan"
          title="Reply to every review in minutes, not hours"
          description="Draft replies manually for free. Pro writes on-brand AI drafts for every review — you approve, we publish."
          ctaLabel="Upgrade to Pro"
        />
      ) : null}
      <ReviewsPanel
        locationId={locationId}
        reviews={reviews}
        summary={summary}
        googleLinked={googleLinked}
      />
    </div>
  );
}
