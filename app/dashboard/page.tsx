import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  listClientsAction,
  listLocationsAction,
  listPublishersAction,
} from "@/app/actions/locations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session.orgId) {
    redirect("/dashboard/onboarding");
  }

  const [clients, locations, publishers] = await Promise.all([
    listClientsAction(),
    listLocationsAction(),
    listPublishersAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Sprint 1 control center — master profiles, publisher registry, and
          version history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-3xl">{clients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Locations</CardDescription>
            <CardTitle className="text-3xl">{locations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Publishers in registry</CardDescription>
            <CardTitle className="text-3xl">{publishers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent locations</CardTitle>
            <CardDescription>
              Open a location to edit its Master Business Profile.
            </CardDescription>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/locations" />}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No locations yet. Create a client, then add your first location.
            </p>
          ) : (
            locations.slice(0, 5).map((location) => (
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
                <Badge variant="outline">Profile</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
