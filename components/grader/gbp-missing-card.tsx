import Link from "next/link";
import { ExternalLinkIcon, MapPinIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GOOGLE_BUSINESS_CREATE_URL,
  LOCALSYNC_PREMIUM_SETUP_URL,
} from "@/lib/grader/gbp-links";
import { onboardingGuideForModel } from "@/lib/onboarding/operating-model-paths";
import type { GraderAuditTier, GraderOperatingModel } from "@/lib/grader/types";

const GBP_CREATE_URL = GOOGLE_BUSINESS_CREATE_URL;

export function GbpMissingCard({
  businessLabel,
  searchedAs,
  operatingModel = "storefront",
  auditTier = "full_local",
  compact = false,
  onRetry,
  retryPending = false,
}: {
  businessLabel?: string | null;
  searchedAs?: string | null;
  operatingModel?: GraderOperatingModel;
  auditTier?: GraderAuditTier;
  compact?: boolean;
  onRetry?: () => void;
  retryPending?: boolean;
}) {
  const guide = onboardingGuideForModel(operatingModel, auditTier);
  const optionalGbp = operatingModel === "online";

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-amber-200 bg-amber-50 p-4"
          : "rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6"
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <MapPinIcon className="size-5 text-amber-700" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="font-semibold text-amber-950">
            {optionalGbp
              ? "No Google Business Profile matched (optional for your path)"
              : `No Google Business Profile matched${businessLabel ? ` for ${businessLabel}` : ""}`}
          </p>
          <p className="text-sm text-amber-900/80">
            {searchedAs
              ? `We searched Google for “${searchedAs}” and couldn’t link a listing to this website.`
              : "We couldn’t link a Google listing to this website."}{" "}
            {guide.noGbpNote ??
              (optionalGbp
                ? "You can still fix website and citation leaks first — add Google later if you meet customers locally."
                : "Without a profile, you won’t show in Google Maps or the local map pack — that’s often the #1 visibility leak.")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={GBP_CREATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Create your Google profile
              <ExternalLinkIcon className="size-3.5" />
            </Button>
            {onRetry ? (
              <Button
                size="sm"
                variant="outline"
                disabled={retryPending}
                onClick={onRetry}
              >
                <RefreshCwIcon
                  className={`size-3.5 ${retryPending ? "animate-spin" : ""}`}
                />
                {retryPending ? "Retrying…" : "Search again"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/grader" />}
              >
                Search by business name
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href={LOCALSYNC_PREMIUM_SETUP_URL} />}
            >
              Done-for-you setup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
