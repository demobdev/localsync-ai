export type WorkspaceMembershipSummary = {
  organizationId: string;
  name: string;
  slug: string | null;
  role: string;
  businessCount: number;
};

export type WorkspaceOption = WorkspaceMembershipSummary & {
  setupComplete: boolean;
};

function canonicalWorkspaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.',]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(
      /\s+(?:llc|inc|incorporated|ltd|limited|co|company|corp|corporation)$/i,
      "",
    )
    .trim();
}

export function selectWorkspaceOptions({
  memberships,
  activeOrganizationId,
}: {
  memberships: WorkspaceMembershipSummary[];
  activeOrganizationId: string;
}): WorkspaceOption[] {
  const eligible = memberships
    .filter(
      (membership) =>
        membership.businessCount > 0 ||
        membership.organizationId === activeOrganizationId,
    )
    .map((membership) => ({
      ...membership,
      setupComplete: membership.businessCount > 0,
    }))
    .sort((left, right) => {
      if (left.organizationId === activeOrganizationId) return -1;
      if (right.organizationId === activeOrganizationId) return 1;
      return left.name.localeCompare(right.name);
    });

  const seen = new Set<string>();
  return eligible.filter((workspace) => {
    const identity = canonicalWorkspaceName(workspace.name);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}
