export type DashboardEntry =
  | "dashboard"
  | "onboarding"
  | "workspace_handoff";

export function resolveDashboardEntry(input: {
  hasWorkspace: boolean;
  hasActiveWorkspace: boolean;
}): DashboardEntry {
  if (input.hasActiveWorkspace) return "dashboard";
  if (input.hasWorkspace) return "workspace_handoff";
  return "onboarding";
}
