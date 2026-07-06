import { notFound } from "next/navigation";

import { getLocationSetupProgressAction } from "@/app/actions/setup-progress";
import {
  getLocationAction,
  listLocationVersionsAction,
  listTaxonomyAction,
} from "@/app/actions/locations";
import { LocationProfileView } from "@/components/locations/location-profile-view";

const VALID_TABS = new Set([
  "nap",
  "hours",
  "services",
  "attributes",
  "photos",
  "links",
]);

export default async function LocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locationId } = await params;
  const { tab } = await searchParams;

  const [location, versions, taxonomy, setupProgress] = await Promise.all([
    getLocationAction(locationId),
    listLocationVersionsAction(locationId),
    listTaxonomyAction(),
    getLocationSetupProgressAction(locationId),
  ]);

  if (!location) {
    notFound();
  }

  const defaultTab = tab && VALID_TABS.has(tab) ? tab : "nap";

  return (
    <LocationProfileView
      key={`${locationId}-${defaultTab}`}
      locationId={locationId}
      initialProfile={location.profile}
      initialVersions={versions}
      setupProgress={setupProgress}
      defaultTab={defaultTab}
      taxonomy={{
        categories: taxonomy.categories.map((category) => ({
          slug: category.slug,
          name: category.name,
        })),
        services: taxonomy.services.map((service) => ({
          slug: service.slug,
          name: service.name,
          categorySlug: service.categorySlug,
        })),
      }}
    />
  );
}
