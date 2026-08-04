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

export function visibleInvitationHistory<T extends { status: string }>(
  invitations: T[],
): T[] {
  return invitations.filter((invitation) => invitation.status !== "revoked");
}
