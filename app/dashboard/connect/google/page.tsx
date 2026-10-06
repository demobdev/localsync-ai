import { Suspense } from "react";

import { listLocationPublishersAction } from "@/app/actions/audits";
import { getGoogleImportStateAction } from "@/app/actions/google-import";
import {
  getLocationAction,
  listLocationsAction,
} from "@/app/actions/locations";
import { getPrimaryLocationSetupAction } from "@/app/actions/setup-progress";
import { getWorkspacePlan } from "@/lib/billing/plans";
import { googleOAuthErrorMessage } from "@/lib/connect/google-oauth-errors";
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import { PublisherIcon } from "@/components/brand/publisher-icon";
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
  operatingContext,
  canPush,
}: {
  error?: string;
  operatingContext: LocationOperatingContext | null;
  canPush: boolean;
}) {
  const state = await getGoogleImportStateAction();

  let targetLocations: Array<{
    id: string;
    name: string;
    linkedGoogleName: string | null;
    googleLinkConfirmed: boolean;
    googleLinkCheckedAt: string | null;
    profile: NonNullable<
      Awaited<ReturnType<typeof getLocationAction>>
    >["profile"];
  }> = [];

  if (state.status === "connected" && state.locations.length > 0) {
    const summaries = await listLocationsAction();
    const resolved = await Promise.all(
      summaries.map(async (summary) => {
        const [location, publisherRows] = await Promise.all([
          getLocationAction(summary.id),
          listLocationPublishersAction(summary.id),
        ]);
        if (!location) return null;
        const googleLink = publisherRows.find(
          (row) => row.publisherSlug === "google-business-profile",
        );
        return {
          id: location.id,
          name: location.name,
          profile: location.profile,
          linkedGoogleName: googleLink?.externalId ?? null,
          googleLinkCheckedAt: googleLink?.lastCheckedAt?.toISOString() ?? null,
          googleLinkConfirmed: Boolean(
            googleLink?.externalId && googleLink.lastCheckedAt,
          ),
        };
      }),
    );
    targetLocations = resolved.filter(
      (location): location is NonNullable<typeof location> => Boolean(location),
    );
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
              {googleOAuthErrorMessage(error)}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <GoogleConnectionStatus
        state={state}
        operatingContext={operatingContext}
      />

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
          canPush={canPush}
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
  const [{ operatingContext }, workspace, params] = await Promise.all([
    getPrimaryLocationSetupAction(),
    getWorkspacePlan(),
    searchParams,
  ]);
  const { error } = params;

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
        <div className="mt-2 flex items-center gap-3">
          <PublisherIcon slug="google-business-profile" badge size={36} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Google Business Profile
            </h1>
            <p className="text-muted-foreground">
              Connect once, compare every supported field, and approve the
              direction of each change.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<ConnectGoogleSkeleton />}>
        <GoogleConnectContent
          error={error}
          operatingContext={operatingContext}
          canPush={workspace.features.apiSync}
        />
      </Suspense>
    </div>
  );
}
