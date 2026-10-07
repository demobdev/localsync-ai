const recentAcceptanceWindowMs = 15 * 60 * 1000;

export function recentInvitationCutoff(now = Date.now()): number {
  return now - recentAcceptanceWindowMs;
}

export function selectInvitationMembership<
  T extends { organizationId: string; createdAt?: number },
>(
  memberships: T[],
  organizationId: string | null | undefined,
  acceptedAfter?: number,
): T | undefined {
  if (!organizationId) return undefined;

  return memberships.find(
    (membership) =>
      membership.organizationId === organizationId &&
      (acceptedAfter === undefined ||
        (membership.createdAt !== undefined &&
          membership.createdAt >= acceptedAfter)),
  );
}

export function selectWorkspaceMembership<
  T extends { organizationId: string; createdAt?: number },
>(
  memberships: T[],
  organizationId: string | null | undefined,
): T | undefined {
  const activeMembership = organizationId
    ? memberships.find(
        (membership) => membership.organizationId === organizationId,
      )
    : undefined;

  if (activeMembership) return activeMembership;

  return [...memberships].sort(
    (left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0),
  )[0];
}

export function visibleInvitationHistory<T extends { status: string }>(
  invitations: T[],
): T[] {
  return invitations.filter((invitation) => invitation.status !== "revoked");
}
