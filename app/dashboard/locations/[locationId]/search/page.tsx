import { notFound } from "next/navigation";

import { getLocationAction } from "@/app/actions/locations";
import { getSearchIntelligenceAction } from "@/app/actions/search-intelligence";
import { SearchIntelligencePanel } from "@/components/locations/search-intelligence-panel";

export default async function LocationSearchIntelligencePage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, data] = await Promise.all([
    getLocationAction(locationId),
    getSearchIntelligenceAction(locationId),
  ]);
  if (!location) notFound();

  return (
    <SearchIntelligencePanel
      data={data}
      locationName={location.name}
    />
  );
}

