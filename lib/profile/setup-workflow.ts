import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import { buildOperatingModelSetupSteps } from "@/lib/profile/model-setup-steps";
import { buildGraderFixSteps } from "@/lib/grader/location-audit-bridge";
import type { AuditCheck } from "@/lib/grader/types";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import { computeProfileScore } from "@/lib/visibility/score";

export type SetupPhase = "audit" | "profile" | "connect" | "visibility" | "reviews";

export type SetupStep = {
  id: string;
  phase: SetupPhase;
  title: string;
  description: string;
  done: boolean;
  href: string;
  profileTab?: "nap" | "hours" | "services" | "photos" | "links";
  optional?: boolean;
};

export type SetupProgress = {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  percent: number;
  nextStep: SetupStep | null;
};

const PROFILE_TAB_BY_CHECK: Record<string, SetupStep["profileTab"]> = {
  "Business name": "nap",
  Phone: "nap",
  Address: "nap",
  Description: "nap",
  Website: "nap",
  Category: "services",
  Hours: "hours",
  Services: "services",
  FAQs: "links",
};

export function buildProfileFieldSteps(input: {
  locationId: string;
  profile: LocationProfileSnapshot;
}): SetupStep[] {
  const { profileChecks } = computeProfileScore(input.profile);

  return profileChecks.map((check) => {
    const isFaq = check.label === "FAQs";
    const profileTab = PROFILE_TAB_BY_CHECK[check.label];

    return {
      id: `profile-${check.label.toLowerCase().replace(/\s+/g, "-")}`,
      phase: "profile" as const,
      title: check.label,
      description: check.passed
        ? `${check.label} is complete`
        : `Add your ${check.label.toLowerCase()} to strengthen NAP consistency`,
      done: check.passed,
      href: isFaq
        ? `/dashboard/locations/${input.locationId}/visibility`
        : `/dashboard/locations/${input.locationId}?tab=${profileTab ?? "nap"}`,
      profileTab: isFaq ? undefined : profileTab,
      optional: isFaq,
    };
  });
}

export function buildConnectionSteps(input: {
  locationId: string;
  googleConnected: boolean;
  googleCanImport: boolean;
  listingUrlsConfigured: number;
  auditRunsCompleted: number;
}): SetupStep[] {
  const {
    locationId,
    googleConnected,
    googleCanImport,
    listingUrlsConfigured,
    auditRunsCompleted,
  } = input;

  return [
    {
      id: "connect-google",
      phase: "connect",
      title: "Connect Google Business Profile",
      description: googleConnected
        ? "Google account linked to this workspace"
        : "OAuth link — read-only until API quota is approved",
      done: googleConnected,
      href: "/dashboard/connect/google",
    },
    {
      id: "import-google",
      phase: "connect",
      title: "Import fields from Google",
      description: googleCanImport
        ? "Merge GBP data into your master profile"
        : "Available once Google API quota is approved",
      done: false,
      href: "/dashboard/connect/google",
      optional: !googleCanImport,
    },
    {
      id: "listing-urls",
      phase: "connect",
      title: "Add listing URLs",
      description:
        listingUrlsConfigured > 0
          ? `${listingUrlsConfigured} publisher URL${listingUrlsConfigured === 1 ? "" : "s"} saved`
          : "Paste Yelp, BBB, or other directory links to audit",
      done: listingUrlsConfigured > 0,
      href: `/dashboard/locations/${locationId}/listings`,
    },
    {
      id: "first-audit",
      phase: "connect",
      title: "Run your first listing audit",
      description:
        auditRunsCompleted > 0
          ? `${auditRunsCompleted} audit${auditRunsCompleted === 1 ? "" : "s"} completed`
          : "Crawl listings and compare against your master profile",
      done: auditRunsCompleted > 0,
      href: `/dashboard/locations/${locationId}/listings`,
    },
  ];
}

export function buildReviewSteps(input: {
  locationId: string;
  reviewCount: number;
  unrepliedCount: number;
}): SetupStep[] {
  const { locationId, reviewCount, unrepliedCount } = input;

  return [
    {
      id: "load-reviews",
      phase: "reviews",
      title: "Load customer reviews",
      description:
        reviewCount > 0
          ? `${reviewCount} review${reviewCount === 1 ? "" : "s"} in inbox`
          : "Demo seed or Google sync",
      done: reviewCount > 0,
      href: `/dashboard/locations/${locationId}/reviews`,
    },
    {
      id: "reply-reviews",
      phase: "reviews",
      title: "Approve AI reply drafts",
      description:
        unrepliedCount === 0 && reviewCount > 0
          ? "All reviews handled"
          : unrepliedCount > 0
            ? `${unrepliedCount} need a reply`
            : "Draft and approve public replies",
      done: reviewCount > 0 && unrepliedCount === 0,
      href: `/dashboard/locations/${locationId}/reviews`,
      optional: reviewCount === 0,
    },
  ];
}

export function buildVisibilitySteps(input: {
  locationId: string;
  hasGeneratedPage: boolean;
  hasPublishedPage: boolean;
  faqCount: number;
}): SetupStep[] {
  const { locationId, hasGeneratedPage, hasPublishedPage, faqCount } = input;

  return [
    {
      id: "generate-page",
      phase: "visibility",
      title: "Generate AI visibility page",
      description: hasGeneratedPage
        ? "Schema.org page draft is ready"
        : "Create hosted HTML + JSON-LD from your profile",
      done: hasGeneratedPage,
      href: `/dashboard/locations/${locationId}/visibility`,
    },
    {
      id: "approve-faqs",
      phase: "visibility",
      title: "Approve FAQ drafts",
      description:
        faqCount >= 3
          ? `${faqCount} FAQs on your public page`
          : "Generate and approve FAQs for AI discoverability",
      done: faqCount >= 3,
      href: `/dashboard/locations/${locationId}/visibility`,
      optional: true,
    },
    {
      id: "publish-page",
      phase: "visibility",
      title: "Publish visibility page",
      description: hasPublishedPage
        ? "Public page and llms.txt are live"
        : "Make your structured page crawlable",
      done: hasPublishedPage,
      href: `/dashboard/locations/${locationId}/visibility`,
    },
  ];
}

export function mergeSetupProgress(steps: SetupStep[]): SetupProgress {
  const required = steps.filter((step) => !step.optional);
  const completedCount = required.filter((step) => step.done).length;
  const totalCount = required.length;
  const percent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextStep = steps.find((step) => !step.done && !step.optional) ?? null;

  return {
    steps,
    completedCount,
    totalCount,
    percent,
    nextStep,
  };
}

export function buildLocationSetupProgress(input: {
  locationId: string;
  profile: LocationProfileSnapshot;
  operatingContext?: LocationOperatingContext | null;
  graderChecks?: AuditCheck[] | null;
  googleConnected: boolean;
  googleCanImport: boolean;
  listingUrlsConfigured: number;
  auditRunsCompleted: number;
  hasGeneratedPage: boolean;
  hasPublishedPage: boolean;
  reviewCount?: number;
  unrepliedReviewCount?: number;
}): SetupProgress {
  const faqCount = input.profile.faqs?.length ?? 0;
  const reviewCount = input.reviewCount ?? 0;
  const unrepliedCount = input.unrepliedReviewCount ?? 0;

  const modelSteps = input.operatingContext
    ? buildOperatingModelSetupSteps({
        locationId: input.locationId,
        context: input.operatingContext,
        profile: input.profile,
        googleConnected: input.googleConnected,
      })
    : [];

  const graderFixSteps =
    input.graderChecks && input.graderChecks.length > 0
      ? buildGraderFixSteps({
          locationId: input.locationId,
          checks: input.graderChecks,
        })
      : [];

  const steps = [
    ...graderFixSteps,
    ...buildProfileFieldSteps({
      locationId: input.locationId,
      profile: input.profile,
    }),
    ...modelSteps,
    ...buildConnectionSteps({
      locationId: input.locationId,
      googleConnected: input.googleConnected,
      googleCanImport: input.googleCanImport,
      listingUrlsConfigured: input.listingUrlsConfigured,
      auditRunsCompleted: input.auditRunsCompleted,
    }),
    ...buildVisibilitySteps({
      locationId: input.locationId,
      hasGeneratedPage: input.hasGeneratedPage,
      hasPublishedPage: input.hasPublishedPage,
      faqCount,
    }),
    ...buildReviewSteps({
      locationId: input.locationId,
      reviewCount,
      unrepliedCount,
    }),
  ];

  return mergeSetupProgress(steps);
}

export const PHASE_LABELS: Record<SetupPhase, string> = {
  audit: "From your visibility audit",
  profile: "Master profile",
  connect: "Connections & audits",
  visibility: "AI visibility",
  reviews: "Reviews & replies",
};
