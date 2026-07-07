import { notFound } from "next/navigation";

import {
  listAuditRunsAction,
  listLocationPublishersAction,
} from "@/app/actions/audits";
import { getLocationAction } from "@/app/actions/locations";
import { UpgradeBanner } from "@/components/billing/upgrade-banner";
import { ListingsManager } from "@/components/locations/listings-manager";
import { getWorkspacePlan } from "@/lib/billing/plans";

export default async function LocationListingsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, publisherRows, auditRuns, workspace] = await Promise.all([
    getLocationAction(locationId),
    listLocationPublishersAction(locationId),
    listAuditRunsAction(locationId),
    getWorkspacePlan(),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {!workspace.features.apiSync ? (
        <UpgradeBanner
          badge="Listing packages"
          title="Skip the copy-paste — sync the majors automatically"
          description="You can manage every listing manually on Basic. Premium pushes Google, Apple, Bing, Facebook & Yelp from one master profile with approve-first sync."
          ctaLabel="View listing packages"
        />
      ) : null}
      <ListingsManager
        locationId={locationId}
        publisherRows={publisherRows}
        auditRuns={auditRuns}
      />
    </div>
  );
}
