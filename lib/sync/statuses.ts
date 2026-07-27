/**
 * Honest listing / sync status labels per Don's Automated Listings Platform spec.
 * "Live and synced" is reserved for verified publisher state only.
 */

export type ListingWorkflowStatus =
  | "live_synced"
  | "changes_pending"
  | "syncing"
  | "needs_connection"
  | "needs_verification"
  | "match_requires_approval"
  | "duplicate_detected"
  | "rejected"
  | "auth_expired"
  | "audit_only"
  | "unsupported"
  | "pending"
  | "manual"
  | "unknown"
  /** Legacy DB value — never shown as Live and synced without verification. */
  | "synced";

export type ListingStatusPresentation = {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral" | "info";
  description: string;
};

const PRESENTATIONS: Record<ListingWorkflowStatus, ListingStatusPresentation> = {
  live_synced: {
    label: "Live and synced",
    tone: "success",
    description: "Verified publisher values match the Master Profile.",
  },
  changes_pending: {
    label: "Changes pending",
    tone: "warning",
    description: "Approved changes exist but are not verified live yet.",
  },
  syncing: {
    label: "Syncing",
    tone: "info",
    description: "One or more publisher jobs are being processed.",
  },
  needs_connection: {
    label: "Needs account connection",
    tone: "warning",
    description: "Authorize a publisher account before syncing.",
  },
  needs_verification: {
    label: "Needs verification",
    tone: "warning",
    description: "Publisher requires ownership or identity verification.",
  },
  match_requires_approval: {
    label: "Match requires approval",
    tone: "warning",
    description: "A probable listing exists but confidence is below auto-match.",
  },
  duplicate_detected: {
    label: "Duplicate detected",
    tone: "danger",
    description: "Multiple records may represent the same business.",
  },
  rejected: {
    label: "Publisher rejected update",
    tone: "danger",
    description: "The publisher returned an error or policy rejection.",
  },
  auth_expired: {
    label: "Authentication expired",
    tone: "danger",
    description: "Credentials must be refreshed or reauthorized.",
  },
  audit_only: {
    label: "Audit-only",
    tone: "neutral",
    description: "LocalMap can monitor this listing but cannot write updates.",
  },
  unsupported: {
    label: "Unsupported",
    tone: "neutral",
    description: "This publisher or field set is unavailable for sync.",
  },
  pending: {
    label: "Pending",
    tone: "warning",
    description: "Work is queued or waiting on the next step.",
  },
  manual: {
    label: "Manual",
    tone: "neutral",
    description: "Managed outside automated sync.",
  },
  unknown: {
    label: "Not configured",
    tone: "neutral",
    description: "No connection, match, or audit URL yet.",
  },
  synced: {
    label: "Accepted (unverified)",
    tone: "warning",
    description:
      "Publisher accepted a write, but LocalMap has not verified the live listing.",
  },
};

export function presentListingStatus(
  status: string,
): ListingStatusPresentation {
  if (status in PRESENTATIONS) {
    return PRESENTATIONS[status as ListingWorkflowStatus];
  }

  return {
    label: status,
    tone: "neutral",
    description: "Unknown status",
  };
}

export type IntegrationTierLabel = "Direct" | "Distributed" | "Audit-only" | "Manual";

export function presentIntegrationTier(
  rail: string,
): IntegrationTierLabel {
  switch (rail) {
    case "api":
      return "Direct";
    case "guided_import":
      return "Distributed";
    case "audit_only":
      return "Audit-only";
    default:
      return "Manual";
  }
}

export function isNeedsActionStatus(status: string): boolean {
  return [
    "needs_connection",
    "needs_verification",
    "match_requires_approval",
    "duplicate_detected",
    "rejected",
    "auth_expired",
    "changes_pending",
    "synced",
    "pending",
  ].includes(status);
}

export function isErrorStatus(status: string): boolean {
  return ["rejected", "auth_expired", "duplicate_detected"].includes(status);
}
