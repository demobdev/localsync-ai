import { notFound } from "next/navigation";

import {
  listAuditRunsAction,
  listLocationPublishersAction,
} from "@/app/actions/audits";
import { getLocationAction } from "@/app/actions/locations";
import { ListingsManager } from "@/components/locations/listings-manager";
import { LocationTabs } from "@/components/locations/location-tabs";

export default async function LocationListingsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, publisherRows, auditRuns] = await Promise.all([
    getLocationAction(locationId),
    listLocationPublishersAction(locationId),
    listAuditRunsAction(locationId),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{location.name}</h2>
        <p className="text-sm text-muted-foreground">
          Listings, publisher status, and audit history for this location.
        </p>
      </div>
      <LocationTabs locationId={locationId} />
      <ListingsManager
        locationId={locationId}
        publisherRows={publisherRows}
        auditRuns={auditRuns}
      />
    </div>
  );
}
