import type {
  PublisherApprovalStatus,
  PublisherDeliveryRail,
} from "@/lib/publishers/delivery";

export const SUBMISSION_CAMPAIGN_STATUSES = [
  "draft",
  "active",
  "paused",
  "completed",
  "canceled",
] as const;

export type SubmissionCampaignStatus =
  (typeof SUBMISSION_CAMPAIGN_STATUSES)[number];

export const SUBMISSION_TARGET_STATUSES = [
  "planned",
  "ready_for_review",
  "approved",
  "queued",
  "submitting",
  "submitted",
  "verification_required",
  "live",
  "verified",
  "monitoring",
  "blocked",
  "failed",
  "skipped",
] as const;

export type SubmissionTargetStatus =
  (typeof SUBMISSION_TARGET_STATUSES)[number];

export type InitialSubmissionTarget = {
  status: SubmissionTargetStatus;
  statusDetail: string;
  nextAction: string;
  customerActionRequired: boolean;
};

type InitialSubmissionInput = {
  publisherName: string;
  deliveryRail: PublisherDeliveryRail;
  approvalStatus: PublisherApprovalStatus;
  listingUrl?: string | null;
  lastCheckedAt?: Date | string | null;
};

/**
 * Convert publisher capabilities into the first honest campaign state.
 * This function never equates an application, URL, or queued task with a
 * successful external submission.
 */
export function deriveInitialSubmissionTarget(
  input: InitialSubmissionInput,
): InitialSubmissionTarget {
  const hasListingUrl = Boolean(input.listingUrl?.trim());

  if (hasListingUrl) {
    return {
      status: "monitoring",
      statusDetail: input.lastCheckedAt
        ? "A public listing URL is saved and has audit evidence."
        : "A public listing URL is saved; the first verification check is pending.",
      nextAction: input.lastCheckedAt ? "Review evidence" : "Run listing check",
      customerActionRequired: false,
    };
  }

  switch (input.deliveryRail) {
    case "first_party_direct":
      return {
        status: "ready_for_review",
        statusDetail: "The Master Profile is ready for customer approval.",
        nextAction: "Approve profile",
        customerActionRequired: true,
      };
    case "approval_gated_direct":
      if (input.approvalStatus !== "production") {
        return {
          status: "blocked",
          statusDetail: `${input.publisherName} production API access is not active yet.`,
          nextAction: "Track partner approval",
          customerActionRequired: false,
        };
      }
      return {
        status: "ready_for_review",
        statusDetail: "Production access is active; customer approval is still required.",
        nextAction: "Approve profile",
        customerActionRequired: true,
      };
    case "partner_network":
      return {
        status: "ready_for_review",
        statusDetail: "The partner delivery payload is ready for customer review.",
        nextAction: "Approve distribution",
        customerActionRequired: true,
      };
    case "managed_submission":
      return {
        status: "ready_for_review",
        statusDetail: "LocalMap can prepare this publisher submission for approval.",
        nextAction: "Approve managed submission",
        customerActionRequired: true,
      };
    case "customer_action":
      return {
        status: "verification_required",
        statusDetail: `${input.publisherName} requires the business owner to claim or verify the listing.`,
        nextAction: "Complete verification",
        customerActionRequired: true,
      };
    case "monitor_only":
    default:
      return {
        status: "planned",
        statusDetail: "LocalMap can discover and monitor this source after a public URL is found.",
        nextAction: "Find listing",
        customerActionRequired: false,
      };
  }
}

export const SUBMISSION_TARGET_LABELS: Record<
  SubmissionTargetStatus,
  string
> = {
  planned: "Discovery planned",
  ready_for_review: "Ready for approval",
  approved: "Customer approved",
  queued: "Queued for delivery",
  submitting: "Submitting",
  submitted: "Submitted — awaiting publisher",
  verification_required: "Customer verification required",
  live: "Live — verification pending",
  verified: "Verified live",
  monitoring: "Monitoring",
  blocked: "Blocked",
  failed: "Needs attention",
  skipped: "Skipped",
};

export function submissionTargetLabel(status: SubmissionTargetStatus): string {
  return SUBMISSION_TARGET_LABELS[status];
}

export function isSubmissionTargetInFlight(
  status: SubmissionTargetStatus,
): boolean {
  return [
    "approved",
    "queued",
    "submitting",
    "submitted",
    "live",
  ].includes(status);
}

export function submissionCampaignProgress(
  statuses: SubmissionTargetStatus[],
): {
  total: number;
  verified: number;
  inFlight: number;
  awaitingApproval: number;
  customerAction: number;
  monitored: number;
  blocked: number;
  progressPercent: number;
} {
  const total = statuses.length;
  const verified = statuses.filter((status) => status === "verified").length;
  const inFlight = statuses.filter(isSubmissionTargetInFlight).length;
  const awaitingApproval = statuses.filter(
    (status) => status === "ready_for_review",
  ).length;
  const customerAction = statuses.filter(
    (status) => status === "verification_required",
  ).length;
  const monitored = statuses.filter(
    (status) => status === "monitoring",
  ).length;
  const blocked = statuses.filter((status) =>
    ["blocked", "failed"].includes(status),
  ).length;
  const progressed = verified + inFlight + monitored;

  return {
    total,
    verified,
    inFlight,
    awaitingApproval,
    customerAction,
    monitored,
    blocked,
    progressPercent: total === 0 ? 0 : Math.round((progressed / total) * 100),
  };
}
