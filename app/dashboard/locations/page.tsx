import Link from "next/link";

import {
  listClientsAction,
  listLocationsAction,
  listTaxonomyAction,
} from "@/app/actions/locations";
import { CreateLocationDialog } from "@/components/locations/create-location-dialog";
import { Badge } from "@/components/ui/badge";
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
        <CreateLocationDialog
          clients={clients.map((client) => ({
            id: client.id,
            name: client.name,
          }))}
          categories={taxonomy.categories.map((category) => ({
            slug: category.slug,
            name: category.name,
          }))}
        />
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
            <p className="text-sm text-muted-foreground">
              Create a client first, then add a location to start building a
              master profile.
            </p>
          ) : (
            locations.map((location) => (
              <Link
                key={location.id}
                href={`/dashboard/locations/${location.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{location.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {location.clientName}
                    {location.profile.city ? ` · ${location.profile.city}` : ""}
                  </p>
                </div>
                <Badge variant="outline">
                  {location.profile.categorySlug ?? "uncategorized"}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
