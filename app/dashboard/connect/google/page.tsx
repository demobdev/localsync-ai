import { Suspense } from "react";

import { getGoogleImportStateAction } from "@/app/actions/google-import";
import { getLocationAction, listLocationsAction } from "@/app/actions/locations";
import { GoogleConnectionStatus } from "@/components/import/google-connection-status";
import { GoogleImportFlow } from "@/components/import/google-import-flow";
import { GoogleImportToast } from "@/components/import/google-import-toast";
import { ConnectGoogleSkeleton } from "@/components/connect/connect-skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

async function GoogleConnectContent({
  error,
}: {
  error?: string;
}) {
  const state = await getGoogleImportStateAction();

  let targetLocations: Array<{
    id: string;
    name: string;
    profile: NonNullable<Awaited<ReturnType<typeof getLocationAction>>>["profile"];
  }> = [];

  if (state.status === "connected" && state.locations.length > 0) {
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

  const canImport =
    state.status === "connected" &&
    state.locations.length > 0 &&
    !state.fetchError;

  return (
    <>
      {error ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Connection error</CardTitle>
            <CardDescription>
              {error === "not_configured"
                ? "Google OAuth is not configured yet."
                : error === "exchange_failed"
                  ? "Google authorization succeeded but token exchange failed."
                  : error === "state_mismatch"
                    ? "Security check failed. Try connecting again."
                    : `Google returned an error: ${error}`}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <GoogleConnectionStatus state={state} />

      {canImport && targetLocations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Add a business first</CardTitle>
            <CardDescription>
              Google locations are ready, but this workspace has no target yet.{" "}
              <Link
                href="/dashboard/onboarding?add=1"
                className="text-primary underline-offset-4 hover:underline"
              >
                Add your business
              </Link>{" "}
              before merging fields.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {canImport && targetLocations.length > 0 ? (
        <GoogleImportFlow
          gbpLocations={state.locations}
          targetLocations={targetLocations}
        />
      ) : null}
    </>
  );
}

export default async function ConnectGooglePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <GoogleImportToast />
      </Suspense>

      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/connect" className="hover:text-foreground">
            ← Connections
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Google Business Profile
        </h1>
        <p className="text-muted-foreground">
          Read-only OAuth import with field-level diff and merge into your master
          profile.
        </p>
      </div>

      <Suspense fallback={<ConnectGoogleSkeleton />}>
        <GoogleConnectContent error={error} />
      </Suspense>
    </div>
  );
}
