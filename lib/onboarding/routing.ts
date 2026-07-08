import {
  GOOGLE_BUSINESS_CREATE_URL,
  LOCALSYNC_PREMIUM_SETUP_URL,
} from "@/lib/grader/gbp-links";
import type {
  GraderAuditTier,
  GraderOperatingModel,
} from "@/lib/grader/types";
import { locationFixQueueHref } from "@/lib/grader/location-audit-bridge";
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import type { SetupPrefill } from "@/lib/onboarding/prefill";

export type OnboardingIntent = "fix" | "organic";

export type RouteAction = {
  id: string;
  label: string;
  href: string;
  /** When true, render as primary button. */
  primary?: boolean;
  external?: boolean;
};

export type PostSetupRoute = {
  headline: string;
  subline: string;
  primary: RouteAction;
  secondary: RouteAction[];
};

const MODEL_LABEL: Record<GraderOperatingModel, string> = {
  storefront: "Storefront",
  mobile: "Mobile business",
  service_area: "Service area",
  online: "Online-first local",
};

const VALID_MODELS = new Set<GraderOperatingModel>([
  "storefront",
  "mobile",
  "service_area",
  "online",
]);

/** Parse `/grader?model=mobile` (and legacy aliases). */
export function parseGraderModelParam(
  value: string | undefined,
): GraderOperatingModel | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  if (VALID_MODELS.has(normalized as GraderOperatingModel)) {
    return normalized as GraderOperatingModel;
  }
  if (normalized === "truck" || normalized === "food_truck") return "mobile";
  if (normalized === "home_services" || normalized === "service") {
    return "service_area";
  }
  return null;
}

export function parseOnboardingIntent(
  value: string | undefined,
): OnboardingIntent {
  return value === "fix" ? "fix" : "organic";
}

export function prefillToRouteContext(
  prefill: SetupPrefill,
  intent: OnboardingIntent = "organic",
): LocationOperatingContext {
  return {
    operatingModel: prefill.operatingModel ?? "storefront",
    auditTier: prefill.auditTier ?? "full_local",
    gbpLinkedAtAudit: prefill.gbpLinked !== false,
    serviceAreaCities: null,
    onboardingIntent: intent,
    graderAuditId: prefill.auditId ?? null,
  };
}

export function buildSignupUrl(auditId: string): string {
  return `/sign-up?audit=${encodeURIComponent(auditId)}`;
}

export function buildFixOnboardingUrl(input: {
  auditId: string;
  intent?: OnboardingIntent;
}): string {
  const params = new URLSearchParams({
    auditId: input.auditId,
    intent: input.intent ?? "fix",
  });
  return `/dashboard/onboarding?${params.toString()}`;
}

export function buildGraderFixHref(input: {
  auditId: string;
  signedIn: boolean;
}): string {
  return input.signedIn
    ? buildFixOnboardingUrl({ auditId: input.auditId, intent: "fix" })
    : buildSignupUrl(input.auditId);
}

export function buildGraderEntryUrl(model?: GraderOperatingModel): string {
  if (!model) return "/grader";
  return `/grader?model=${encodeURIComponent(model)}`;
}

/** Primary + secondary actions after onboarding completes. */
export function resolvePostSetupRoute(input: {
  locationId: string;
  context: LocationOperatingContext;
  auditId?: string | null;
  isAgency?: boolean;
}): PostSetupRoute {
  const { locationId, context, auditId, isAgency = false } = input;
  const model = context.operatingModel;
  const needsGbp =
    !context.gbpLinkedAtAudit || context.auditTier === "website_local";
  const profileHref = `/dashboard/locations/${locationId}?tab=nap`;
  const connectHref = "/dashboard/connect";
  const connectGoogleHref = "/dashboard/connect/google";
  const listingsHref = `/dashboard/locations/${locationId}/listings`;
  const visibilityHref = `/dashboard/locations/${locationId}/visibility`;
  const auditHref = auditId ? `/grader/${auditId}` : null;

  const fixQueueHref = locationFixQueueHref(locationId);
  const fromGraderFix = context.onboardingIntent === "fix" && auditId;

  if (isAgency) {
    return {
      headline: "Agency workspace ready",
      subline: "Your first client is set up — work through their audit fix queue.",
      primary: {
        id: "fix-queue",
        label: "Open client fix queue",
        href: fixQueueHref,
        primary: true,
      },
      secondary: [
        {
          id: "profile",
          label: "Complete client profile",
          href: profileHref,
        },
        ...(auditHref
          ? [{ id: "audit", label: "View audit report", href: auditHref }]
          : []),
      ],
    };
  }

  if (fromGraderFix) {
    return {
      headline: "Next: fix your audit leaks",
      subline:
        "Your visibility audit is linked to this workspace — work through the fix queue on your profile.",
      primary: {
        id: "fix-queue",
        label: "Open fix queue",
        href: fixQueueHref,
        primary: true,
      },
      secondary: [
        ...(auditHref
          ? [{ id: "audit", label: "View full audit report", href: auditHref }]
          : []),
        {
          id: "connect",
          label: "Connect Google & listings",
          href: connectHref,
        },
      ],
    };
  }

  // Storefront without GBP at audit — create listing first.
  if (model === "storefront" && needsGbp) {
    return {
      headline: "Next: get on Google Maps",
      subline:
        "Your audit found no verified Google listing. Claim or create one — it's the hub for local discovery.",
      primary: {
        id: "google-create",
        label: "Add your business to Google",
        href: GOOGLE_BUSINESS_CREATE_URL,
        primary: true,
        external: true,
      },
      secondary: [
        {
          id: "premium",
          label: "We'll set it up for you (Premium)",
          href: LOCALSYNC_PREMIUM_SETUP_URL,
        },
        {
          id: "fix-queue",
          label: "Work through audit fixes",
          href: fixQueueHref,
        },
        ...(auditHref
          ? [{ id: "audit", label: "Back to audit report", href: auditHref }]
          : []),
      ],
    };
  }

  if (model === "mobile") {
    return {
      headline: "Next: where customers find you",
      subline:
        "Link your website, set your service area on Google, and sync listings for trucks, carts, and pop-ups.",
      primary: {
        id: "connect",
        label: needsGbp ? "Connect Google & listings" : "Connect listings",
        href: needsGbp ? connectGoogleHref : connectHref,
        primary: true,
      },
      secondary: [
        {
          id: "profile-links",
          label: "Add website & social links",
          href: `/dashboard/locations/${locationId}?tab=links`,
        },
        {
          id: "listings",
          label: "Add directory URLs",
          href: listingsHref,
        },
        ...(auditHref
          ? [{ id: "audit", label: "View audit report", href: auditHref }]
          : []),
      ],
    };
  }

  if (model === "service_area") {
    return {
      headline: "Next: own your service area",
      subline:
        "Define the cities you serve, connect a service-area Google profile, and sync trade directories.",
      primary: {
        id: "profile-nap",
        label: "Set service area & category",
        href: profileHref,
        primary: true,
      },
      secondary: [
        {
          id: "connect-google",
          label: needsGbp ? "Create service-area Google profile" : "Connect Google",
          href: needsGbp ? GOOGLE_BUSINESS_CREATE_URL : connectGoogleHref,
          external: needsGbp,
        },
        {
          id: "connect",
          label: "Connect listings",
          href: connectHref,
        },
        ...(auditHref
          ? [{ id: "audit", label: "View audit report", href: auditHref }]
          : []),
      ],
    };
  }

  // online-first
  return {
    headline: "Next: website + local trust",
    subline:
      "Confirm your website story, add citations, and optionally connect Google if you meet buyers locally.",
    primary: {
      id: "visibility",
      label: "Build AI visibility page",
      href: visibilityHref,
      primary: true,
    },
    secondary: [
      {
        id: "profile",
        label: "Complete website & description",
        href: profileHref,
      },
      {
        id: "listings",
        label: "Add directory & social URLs",
        href: listingsHref,
      },
      ...(needsGbp
        ? [
            {
              id: "google-optional",
              label: "Add Google profile (optional)",
              href: GOOGLE_BUSINESS_CREATE_URL,
              external: true,
            },
          ]
        : [
            {
              id: "connect",
              label: "Connect Google",
              href: connectGoogleHref,
            },
          ]),
      ...(auditHref
        ? [{ id: "audit", label: "View audit report", href: auditHref }]
        : []),
    ],
  };
}

export function modelLabel(model: GraderOperatingModel): string {
  return MODEL_LABEL[model];
}

export function dashboardContinueHref(input: {
  locationId: string;
  context: LocationOperatingContext;
}): string {
  const route = resolvePostSetupRoute({
    locationId: input.locationId,
    context: input.context,
  });
  return route.primary.href;
}
