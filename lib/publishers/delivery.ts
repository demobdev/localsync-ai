export const PUBLISHER_DELIVERY_RAILS = [
  "first_party_direct",
  "approval_gated_direct",
  "partner_network",
  "managed_submission",
  "customer_action",
  "monitor_only",
] as const;

export type PublisherDeliveryRail =
  (typeof PUBLISHER_DELIVERY_RAILS)[number];

export const PUBLISHER_APPROVAL_STATUSES = [
  "not_required",
  "not_applied",
  "pending",
  "sandbox",
  "production",
  "unavailable",
] as const;

export type PublisherApprovalStatus =
  (typeof PUBLISHER_APPROVAL_STATUSES)[number];

export const PUBLISHER_VERIFICATION_OWNERS = [
  "localsync",
  "customer",
  "partner",
  "publisher",
] as const;

export type PublisherVerificationOwner =
  (typeof PUBLISHER_VERIFICATION_OWNERS)[number];

export const PUBLISHER_COST_CADENCES = [
  "none",
  "one_time",
  "monthly",
  "annual",
  "quote",
] as const;

export type PublisherCostCadence =
  (typeof PUBLISHER_COST_CADENCES)[number];

export const PUBLISHER_OPERATIONS = [
  "discover",
  "create",
  "claim",
  "update",
  "verify",
  "monitor",
  "analytics",
  "suppress_duplicates",
] as const;

export type PublisherOperation = (typeof PUBLISHER_OPERATIONS)[number];

export type PublisherDeliveryState = {
  deliveryRail: PublisherDeliveryRail | string;
  approvalStatus: PublisherApprovalStatus | string;
  verificationOwner?: PublisherVerificationOwner | string;
};

export function publisherDeliveryLabel(
  state: PublisherDeliveryState,
): string {
  switch (state.deliveryRail) {
    case "first_party_direct":
      return "Directly synchronized";
    case "approval_gated_direct":
      if (state.approvalStatus === "production") {
        return "Directly synchronized";
      }
      if (state.approvalStatus === "sandbox") return "API sandbox";
      if (state.approvalStatus === "pending") return "API approval pending";
      return "API approval required";
    case "partner_network":
      return "Partner-distributed";
    case "managed_submission":
      return "LocalMap-managed";
    case "customer_action":
      return "Customer verification";
    case "monitor_only":
    default:
      return "Monitoring only";
  }
}

export function publisherDeliveryDescription(
  state: PublisherDeliveryState,
): string {
  switch (state.deliveryRail) {
    case "first_party_direct":
      return "LocalMap can publish approved changes and verify them against the live listing.";
    case "approval_gated_direct":
      if (state.approvalStatus === "production") {
        return "LocalMap can publish after the business authorizes this publisher.";
      }
      return "The publisher supports automation, but LocalMap must finish partner approval before writes can begin.";
    case "partner_network":
      return "An approved distribution partner delivers updates while LocalMap tracks status and evidence.";
    case "managed_submission":
      return "LocalMap prepares and manages the submission; the publisher may still review it before publication.";
    case "customer_action":
      return "The publisher requires the business owner to complete a claim or verification step.";
    case "monitor_only":
    default:
      return "LocalMap can discover and monitor this listing but does not claim direct write access.";
  }
}

export function publisherNextActionLabel(input: {
  state: PublisherDeliveryState;
  hasListingUrl: boolean;
}): string {
  if (input.hasListingUrl) return "View listing";

  switch (input.state.deliveryRail) {
    case "first_party_direct":
      return "Connect";
    case "approval_gated_direct":
      return input.state.approvalStatus === "production"
        ? "Connect"
        : "Track approval";
    case "partner_network":
      return "Start distribution";
    case "managed_submission":
      return "Prepare submission";
    case "customer_action":
      return "Verify business";
    case "monitor_only":
    default:
      return "Add listing URL";
  }
}

export function isAutomationRail(state: PublisherDeliveryState): boolean {
  if (state.deliveryRail === "first_party_direct") return true;
  if (state.deliveryRail === "partner_network") return true;
  return (
    state.deliveryRail === "approval_gated_direct" &&
    state.approvalStatus === "production"
  );
}
