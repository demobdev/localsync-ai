import type { GoogleImportState } from "@/app/actions/google-import";
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import { modelLabel } from "@/lib/onboarding/routing";

export type GoogleConnectCopy = {
  headline: string;
  description: string;
  cta: string;
  helper?: string;
};

const ADS_CREDIT_HELPER =
  "Google’s Performance UI often shows a $500 Ads credit for new advertisers — check and claim there if eligible (not detected via API yet).";

export function googleConnectCopyForContext(input: {
  context: LocationOperatingContext | null;
  googleState: GoogleImportState;
}): GoogleConnectCopy {
  const model = input.context?.operatingModel ?? "storefront";
  const needsGbp =
    input.context != null &&
    (!input.context.gbpLinkedAtAudit ||
      input.context.auditTier === "website_local");
  const connected = input.googleState.status === "connected";
  const quotaLimited =
    connected &&
    input.googleState.status === "connected" &&
    Boolean(input.googleState.fetchError?.code === "quota_exceeded");

  if (quotaLimited) {
    return {
      headline: "Google connected — API rate or quota limit reached",
      description:
        "Google's API rate or quota limit was reached. Retry later and check the calling project's quota and usage. This error alone does not mean API access is unapproved. If the project is already approved, verify the OAuth project and effective quota instead of applying again.",
      cta: "View connection status",
      helper: `You can still add listing URLs and run audits manually meanwhile. ${ADS_CREDIT_HELPER}`,
    };
  }

  if (connected) {
    return {
      headline: "Google Business Profile linked",
      description:
        "Import NAP, hours, and categories into your master profile — approve every field before it saves.",
      cta: "Manage import",
      helper: ADS_CREDIT_HELPER,
    };
  }

  if (model === "storefront" && needsGbp) {
    return {
      headline: "Connect or create your Google listing",
      description:
        "Storefront businesses need a verified Google profile for map pack visibility. Connect an existing listing, or create one on Google first.",
      cta: "Connect Google account",
      helper:
        "Use the Google account that manages the Business Profile — read-only OAuth first.",
    };
  }

  if (model === "service_area") {
    return {
      headline: needsGbp
        ? "Connect a service-area Google profile"
        : "Sync your Google service-area profile",
      description: needsGbp
        ? "Create a service-area listing (hide home address) then connect the manager Google account to import cities and categories."
        : "Pull verified hours and categories from Google into your master profile.",
      cta: "Connect Google account",
    };
  }

  if (model === "mobile") {
    return {
      headline: needsGbp
        ? "Add Google — optional but powerful for mobile"
        : "Connect your Google profile",
      description:
        "Food trucks and pop-ups often use service-area Google profiles. Connect to sync hours, posts, and review replies.",
      cta: "Connect Google account",
    };
  }

  // online
  return {
    headline: needsGbp
      ? "Google is optional for online-first brands"
      : "Connect Google (optional)",
    description: needsGbp
      ? `${modelLabel(model)} path: prioritize website + citations first. Connect Google only if you meet buyers locally or at pickup points.`
      : "Import verified business facts when you do meet customers locally.",
    cta: "Connect Google account",
    helper: needsGbp ? "Skip for now if you are fully online — listings and visibility page matter more." : undefined,
  };
}
