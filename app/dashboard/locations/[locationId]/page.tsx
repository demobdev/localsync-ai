import { notFound } from "next/navigation";

import {
  getLocationAction,
  listLocationVersionsAction,
  listTaxonomyAction,
} from "@/app/actions/locations";
import { LocationProfileEditor } from "@/components/locations/location-profile-editor";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, versions, taxonomy] = await Promise.all([
    getLocationAction(locationId),
    listLocationVersionsAction(locationId),
    listTaxonomyAction(),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <LocationProfileEditor
      locationId={location.id}
      initialProfile={location.profile}
      initialVersions={versions}
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
