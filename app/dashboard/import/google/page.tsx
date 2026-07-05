import Link from "next/link";

import { getGoogleImportStateAction } from "@/app/actions/google-import";
import { getLocationAction, listLocationsAction } from "@/app/actions/locations";
import { GoogleImportFlow } from "@/components/import/google-import-flow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function GoogleImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const state = await getGoogleImportStateAction();

  let targetLocations: Array<{
    id: string;
    name: string;
    profile: NonNullable<Awaited<ReturnType<typeof getLocationAction>>>["profile"];
  }> = [];

  if (state.status === "connected") {
    const summaries = await listLocationsAction();
    const resolved = await Promise.all(
      summaries.map((summary) => getLocationAction(summary.id)),
    );
    targetLocations = resolved
      .filter((location): location is NonNullable<typeof location> =>
        Boolean(location),
      )
      .map((location) => ({
        id: location.id,
        name: location.name,
        profile: location.profile,
      }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Import from Google</h1>
        <p className="text-muted-foreground">
          Read-only import from Google Business Profile with a field-level
          diff/merge into the master profile.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Connection error</CardTitle>
            <CardDescription>
              {error === "not_configured"
                ? "Google OAuth is not configured yet."
                : `Google returned an error: ${error}`}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {state.status === "not_configured" ? (
        <Card>
          <CardHeader>
            <CardTitle>Google OAuth not configured</CardTitle>
            <CardDescription>
              Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local, then
              restart the dev server. Setup steps are documented in
              docs/gbp-api-request.md.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : state.status === "not_connected" ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect your Google account</CardTitle>
            <CardDescription>
              Grant read access to your Business Profile locations. Nothing is
              written back to Google.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/api/connectors/google" />}
            >
              Connect Google Business Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <GoogleImportFlow
          gbpLocations={state.locations}
          targetLocations={targetLocations}
        />
      )}
    </div>
  );
}
