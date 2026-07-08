import {
  GOOGLE_BUSINESS_CREATE_URL,
  LOCALSYNC_PREMIUM_SETUP_URL,
} from "@/lib/grader/gbp-links";
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import type { SetupStep } from "@/lib/profile/setup-workflow";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

/**
 * Model-specific steps injected at the start of the connect phase.
 * These are the routing moat inside the dashboard setup guide.
 */
export function buildOperatingModelSetupSteps(input: {
  locationId: string;
  context: LocationOperatingContext;
  profile: LocationProfileSnapshot;
  googleConnected: boolean;
}): SetupStep[] {
  const { locationId, context, profile, googleConnected } = input;
  const steps: SetupStep[] = [];
  const needsGbp =
    !context.gbpLinkedAtAudit || context.auditTier === "website_local";
  const hasWebsite = Boolean(profile.website?.trim());
  const hasServiceArea = Boolean(context.serviceAreaCities?.trim());
  const hasSocial =
    profile.sameAs.filter((url) => url.trim().length > 0).length > 0;

  if (context.operatingModel === "storefront" && needsGbp && !googleConnected) {
    steps.push({
      id: "model-gbp-create",
      phase: "connect",
      title: "Claim your Google Business Profile",
      description:
        "No listing was found during your audit — create or claim on Google first",
      done: false,
      href: GOOGLE_BUSINESS_CREATE_URL,
    });
    steps.push({
      id: "model-premium-setup",
      phase: "connect",
      title: "Or let us set it up (Premium)",
      description: "Done-for-you Google profile + directory sync",
      done: false,
      href: LOCALSYNC_PREMIUM_SETUP_URL,
      optional: true,
    });
  }

  if (context.operatingModel === "mobile") {
    steps.push({
      id: "model-mobile-website",
      phase: "connect",
      title: "Confirm website & where you operate",
      description: hasWebsite
        ? "Website saved — add social links so customers find your schedule"
        : "Add your website or link-in-bio so audits have a home base",
      done: hasWebsite && hasSocial,
      href: `/dashboard/locations/${locationId}?tab=links`,
    });
    if (needsGbp && !googleConnected) {
      steps.push({
        id: "model-mobile-gbp",
        phase: "connect",
        title: "Add Google profile (service area)",
        description:
          "List as a service-area business — no storefront address required",
        done: false,
        href: GOOGLE_BUSINESS_CREATE_URL,
        optional: true,
      });
    }
  }

  if (context.operatingModel === "service_area") {
    steps.push({
      id: "model-service-cities",
      phase: "connect",
      title: "Define cities you serve",
      description: hasServiceArea
        ? `Serving: ${context.serviceAreaCities}`
        : "Add service-area cities to your profile for local ranking",
      done: hasServiceArea,
      href: `/dashboard/locations/${locationId}?tab=nap`,
    });
    if (needsGbp && !googleConnected) {
      steps.push({
        id: "model-service-gbp",
        phase: "connect",
        title: "Create service-area Google profile",
        description: "Hide your home address — show cities & trade category",
        done: false,
        href: GOOGLE_BUSINESS_CREATE_URL,
      });
    }
  }

  if (context.operatingModel === "online") {
    steps.push({
      id: "model-online-website",
      phase: "connect",
      title: "Confirm website & local positioning",
      description: hasWebsite
        ? "Website linked — tighten description for local buyers"
        : "Add your website — online-first businesses still need local trust signals",
      done: hasWebsite,
      href: `/dashboard/locations/${locationId}?tab=nap`,
    });
    if (needsGbp && !googleConnected) {
      steps.push({
        id: "model-online-gbp-optional",
        phase: "connect",
        title: "Add Google profile (optional)",
        description: "Only if you meet customers locally or at pickup points",
        done: false,
        href: GOOGLE_BUSINESS_CREATE_URL,
        optional: true,
      });
    }
  }

  return steps;
}
