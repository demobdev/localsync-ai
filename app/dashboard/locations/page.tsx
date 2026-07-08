import Link from "next/link";
import { MapPinIcon } from "lucide-react";

import {
  listClientsAction,
  listLocationsAction,
  listTaxonomyAction,
} from "@/app/actions/locations";
import { CreateLocationDialog } from "@/components/locations/create-location-dialog";
import { DeleteLocationButton } from "@/components/locations/delete-location-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LocationsPage() {
  const [locations, clients, taxonomy] = await Promise.all([
    listLocationsAction(),
    listClientsAction(),
    listTaxonomyAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Locations</h1>
          <p className="text-muted-foreground">
            Master Business Profiles with immutable version history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/grader" />}
          >
            Run visibility audit
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/onboarding?add=1" />}
          >
            Add manually
          </Button>
          <CreateLocationDialog
          clients={clients.map((client) => ({
            id: client.id,
            name: client.name,
          }))}
          categories={taxonomy.categories.map((category) => ({
            slug: category.slug,
            name: category.name,
            vertical: category.vertical,
            description: category.description ?? "",
          }))}
        />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All locations</CardTitle>
          <CardDescription>
            {locations.length} location{locations.length === 1 ? "" : "s"} in
            this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {locations.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
              <MapPinIcon className="mx-auto size-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">No businesses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                One quick form sets up your profile and directory tracking.
              </p>
              <Button
                size="sm"
                className="mt-4"
                nativeButton={false}
                render={<Link href="/dashboard/onboarding" />}
              >
                Add your business
              </Button>
            </div>
          ) : (
            locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <Link
                  href={`/dashboard/locations/${location.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{location.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {location.clientName}
                      {location.profile.city ? ` · ${location.profile.city}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {location.profile.categorySlug ?? "uncategorized"}
                  </Badge>
                </Link>
                <DeleteLocationButton
                  locationId={location.id}
                  locationName={location.name}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
