import Link from "next/link";

import type { GbpFetchErrorCode } from "@/lib/connectors/google";
import type { GoogleImportState } from "@/app/actions/google-import";
import { PublisherIcon } from "@/components/brand/publisher-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function fetchErrorTitle(code: GbpFetchErrorCode) {
  switch (code) {
    case "quota_exceeded":
      return "Google connected — API quota pending";
    case "permission_denied":
      return "Google connected — no listing access";
    case "api_not_approved":
      return "Google connected — APIs not ready";
    default:
      return "Google connected — could not load locations";
  }
}

export function GoogleConnectionStatus({ state }: { state: GoogleImportState }) {
  if (state.status === "not_configured") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google OAuth not configured</CardTitle>
          <CardDescription>
            Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local, then
            restart the dev server. See docs/gbp-api-request.md.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (state.status === "not_connected") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <PublisherIcon slug="google-business-profile" badge size={32} />
            <div className="space-y-1">
              <CardTitle>Connect your Google account</CardTitle>
              <CardDescription>
                Sign in with a Google account that is a test user in your Cloud
                project and an owner/manager on at least one Business Profile.
                Read only — nothing is written back to Google.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            nativeButton={false}
            render={<Link href="/api/connectors/google" />}
          >
            Connect Google Business Profile
          </Button>
          <p className="text-xs text-muted-foreground">
            No Business Profile yet? Create one at business.google.com first,
            then connect the same Google account you use as listing manager.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <PublisherIcon slug="google-business-profile" badge size={32} />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">Google account connected</CardTitle>
              <Badge variant="secondary">Linked to this workspace</Badge>
            </div>
            <CardDescription>
              {state.locations.length > 0
                ? `Found ${state.locations.length} Business Profile location${state.locations.length === 1 ? "" : "s"}.`
                : "OAuth succeeded. Location data depends on listing access and API approval below."}
            </CardDescription>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href="/api/connectors/google" />}
        >
          Reconnect
        </Button>
      </CardHeader>

      {state.fetchError ? (
        <CardContent>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium text-foreground">
              {fetchErrorTitle(state.fetchError.code)}
            </p>
            <p className="mt-2 text-muted-foreground">{state.fetchError.message}</p>
          </div>
        </CardContent>
      ) : null}

      {!state.fetchError && state.locations.length === 0 ? (
        <CardContent>
          <div className="rounded-xl border border-dashed p-4 text-sm">
            <p className="font-medium">No Business Profile locations found</p>
            <p className="mt-2 text-muted-foreground">
              The connected Google account does not manage any listings yet. Create
              a profile at{" "}
              <a
                href="https://business.google.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                business.google.com
              </a>
              , verify it, add this Google account as owner/manager, then click
              Reconnect.
            </p>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
