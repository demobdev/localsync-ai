import { notFound } from "next/navigation";

import {
  listAuditRunsAction,
  listLocationPublishersAction,
} from "@/app/actions/audits";
import { getLocationAction } from "@/app/actions/locations";
import { ListingsManager } from "@/components/locations/listings-manager";

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
    <ListingsManager
      locationId={locationId}
      publisherRows={publisherRows}
      auditRuns={auditRuns}
    />
  );
}
