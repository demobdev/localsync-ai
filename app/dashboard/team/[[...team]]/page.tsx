import { auth, clerkClient } from "@clerk/nextjs/server";

import {
  TeamWorkspace,
  type TeamInvitationView,
  type TeamMemberView,
} from "@/components/team/team-workspace";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
});

export default async function TeamPage() {
  const session = await auth();

  if (!session.userId || !session.orgId) {
    return null;
  }

  const client = await clerkClient();
  const [organization, membershipResponse, invitationResponse] = await Promise.all([
    client.organizations.getOrganization({ organizationId: session.orgId }),
    client.organizations.getOrganizationMembershipList({
      organizationId: session.orgId,
      limit: 100,
      orderBy: "+created_at",
    }),
    client.organizations.getOrganizationInvitationList({
      organizationId: session.orgId,
      limit: 100,
    }),
  ]);

  const members: TeamMemberView[] = membershipResponse.data.map((membership) => {
    const person = membership.publicUserData;
    const isCurrentUser = person?.userId === session.userId;
    const name =
      [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
      person?.identifier ||
      "Team member";

    return {
      id: membership.id,
      userId: person?.userId ?? membership.id,
      name,
      email: person?.identifier ?? "No email available",
      imageUrl: person?.imageUrl ?? "",
      role:
        membership.role === "org:admin"
          ? isCurrentUser
            ? "Owner"
            : "Admin"
          : "Member",
      joinedAt: dateFormatter.format(new Date(membership.createdAt)),
      isCurrentUser,
    };
  });

  const invitations: TeamInvitationView[] = invitationResponse.data.map(
    (invitation) => ({
      id: invitation.id,
      email: invitation.emailAddress,
      role: invitation.role === "org:admin" ? "Admin" : "Member",
      status: invitation.status ?? "pending",
      sentAt: dateFormatter.format(new Date(invitation.createdAt)),
      expiresAt: dateFormatter.format(new Date(invitation.expiresAt)),
    }),
  );

  return (
    <TeamWorkspace
      workspaceName={organization.name}
      members={members}
      invitations={invitations}
      seatLimit={organization.maxAllowedMemberships}
      canManage={session.orgRole === "org:admin"}
    />
  );
}
