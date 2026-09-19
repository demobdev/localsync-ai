import { notFound } from "next/navigation";

import {
  listAuditRunsAction,
  listLocationPublishersAction,
} from "@/app/actions/audits";
import { getGoogleImportStateAction } from "@/app/actions/google-import";
import { getLatestSubmissionCampaignAction } from "@/app/actions/listing-campaigns";
import { getLocationAction } from "@/app/actions/locations";
import { AutomatedListingsWorkspace } from "@/components/listings/automated-listings-workspace";
import { getWorkspacePlan } from "@/lib/billing/plans";
import { getLocationVisibilityScoreBreakdown } from "@/lib/visibility/location-score";

export default async function LocationListingsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [
    location,
    publisherRows,
    auditRuns,
    workspace,
    scoreBreakdown,
    googleState,
    submissionCampaign,
  ] = await Promise.all([
    getLocationAction(locationId),
    listLocationPublishersAction(locationId),
    listAuditRunsAction(locationId),
    getWorkspacePlan(),
    getLocationVisibilityScoreBreakdown(locationId),
    getGoogleImportStateAction().catch((error) => {
      console.error("[listings] Google state failed:", error);
      return { status: "not_connected" as const };
    }),
    getLatestSubmissionCampaignAction(locationId).catch((error) => {
      console.error("[listings] Submission campaign state failed:", error);
      return null;
    }),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <AutomatedListingsWorkspace
      locationId={locationId}
      profile={location.profile}
      publisherRows={publisherRows}
      auditRuns={auditRuns}
      googleState={googleState}
      profileScore={scoreBreakdown?.profileScore ?? 0}
      listingConsistencyScore={scoreBreakdown?.auditScore ?? 0}
      listingHealthScore={scoreBreakdown?.total ?? 0}
      canSync={workspace.features.apiSync}
      submissionCampaign={submissionCampaign}
    />
  );
}
