/** Shared score naming — grader vs workspace vs reputation. See docs/score-architecture.md */

export const SCORE_LABELS = {
  /** External market audit from /grader (rankings, site, GBP signals). */
  marketAudit: "Market visibility audit",
  marketAuditShort: "Market audit",
  /** In-app 0–100: Master Profile completeness + listing consistency. */
  workspaceHealth: "Listing health",
  workspaceHealthShort: "Listing health",
  /** First 50 pts of workspace health. */
  profileCompleteness: "Profile completeness",
  /** Second 50 pts of workspace health (Firecrawl listing audit). */
  listingConsistency: "Listing consistency",
  /** Review rating + reply rate (separate from workspace health). */
  reputation: "Reputation score",
} as const;

export const SCORE_DESCRIPTIONS = {
  marketAudit:
    "How you appear in search and AI today — rankings, website, and public listing signals. Run from the free grader.",
  workspaceHealth:
    "How complete and consistent your listing data is. Master Profile readiness plus verified listing checks.",
  profileCompleteness:
    "Business profile fields, services, hours, and setup steps filled in inside LocalSync.",
  listingConsistency:
    "Points from listing audits you run on this location (name, address, phone match across directories).",
  reputation:
    "Google review rating and how often you reply. Shown on Reviews; not mixed into workspace health.",
} as const;
