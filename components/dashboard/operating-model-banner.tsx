import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, RadarIcon, GlobeIcon } from "lucide-react";

import type { GoogleImportState } from "@/app/actions/google-import";
import { googleConnectCopyForContext } from "@/lib/connect/google-connect-copy";
import { modelLabel } from "@/lib/onboarding/routing";
import { onboardingGuideForModel } from "@/lib/onboarding/operating-model-paths";
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function OperatingModelDashboardBanner({
  context,
  locationId,
  googleState,
}: {
  context: LocationOperatingContext;
  locationId: string;
  googleState: GoogleImportState;
}) {
  const guide = onboardingGuideForModel(
    context.operatingModel,
    context.auditTier,
  );
  const needsGbp =
    !context.gbpLinkedAtAudit || context.auditTier === "website_local";
  const googleConnected = googleState.status === "connected";
  const googleCopy = googleConnectCopyForContext({ context, googleState });

  const showGbpCta = needsGbp && !googleConnected;
  const showConnectCta =
    !googleConnected && googleState.status !== "not_configured";

  return (
    <div className="localmap-card-glow rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-primary/10 text-primary"
            >
              {modelLabel(context.operatingModel)} path
            </Badge>
            {needsGbp ? (
              <Badge variant="outline" className="rounded-full">
                {context.auditTier === "website_local"
                  ? "Website-first audit"
                  : "GBP action needed"}
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-800 dark:text-emerald-200">
                GBP linked at audit
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold tracking-tight">{guide.title}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {needsGbp && guide.noGbpNote
              ? guide.noGbpNote
              : guide.description}
          </p>
          {googleConnected && googleState.status === "connected" && googleState.fetchError ? (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {googleCopy.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {showConnectCta ? (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/connect/google" />}
            >
              <GlobeIcon className="size-4" />
              {googleCopy.cta}
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : googleConnected ? (
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/connect/google" />}
            >
              {googleCopy.cta}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/dashboard/locations/${locationId}`} />}
          >
            <MapPinIcon className="size-4" />
            Open profile
          </Button>
          {context.graderAuditId ? (
            <Button
              size="sm"
              variant="ghost"
              nativeButton={false}
              render={<Link href={`/grader/${context.graderAuditId}`} />}
            >
              <RadarIcon className="size-4" />
              View audit
            </Button>
          ) : null}
        </div>
      </div>
      {showGbpCta && context.operatingModel === "storefront" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Already created on Google?{" "}
          <Link
            href="/dashboard/connect/google"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Connect the manager account
          </Link>{" "}
          instead of creating a duplicate listing.
        </p>
      ) : null}
    </div>
  );
}
