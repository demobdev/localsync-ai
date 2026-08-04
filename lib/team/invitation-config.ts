export type OrganizationInvitationInput = {
  organizationId: string;
  emailAddress: string;
  role: "org:admin" | "org:member";
  inviterUserId: string;
};

/**
 * Keep Clerk in charge of the invitation acceptance screen. A custom
 * redirectUrl receives a __clerk_ticket and requires a dedicated acceptance
 * flow; sending that ticket directly to /dashboard leaves the invite pending.
 */
export function buildOrganizationInvitation(
  input: OrganizationInvitationInput,
) {
  return {
    ...input,
    expiresInDays: 14,
    publicMetadata: {
      invitedFrom: "localmap-team",
      accessScope: "workspace",
    },
  } as const;
}
