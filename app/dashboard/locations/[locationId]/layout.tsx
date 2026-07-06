import { notFound } from "next/navigation";

import { getLocationAction } from "@/app/actions/locations";
import { getLocationVisibilityAction } from "@/app/actions/visibility";
import { LocationDetailHeader } from "@/components/locations/location-detail-header";
import { LocationTabs } from "@/components/locations/location-tabs";

export default async function LocationDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, visibility] = await Promise.all([
    getLocationAction(locationId),
    getLocationVisibilityAction(locationId).catch(() => null),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <div className="pb-8">
      <LocationDetailHeader
        locationId={locationId}
        name={location.name}
        city={location.profile.city}
        state={location.profile.state}
        visibilityScore={visibility?.score.total}
      />
      <LocationTabs locationId={locationId} />
      {children}
    </div>
  );
}
