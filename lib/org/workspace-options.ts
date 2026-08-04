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

export function selectWorkspaceOptions({
  memberships,
  activeOrganizationId,
}: {
  memberships: WorkspaceMembershipSummary[];
  activeOrganizationId: string;
}): WorkspaceOption[] {
  return memberships
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
}
