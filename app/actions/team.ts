"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["org:admin", "org:member"]),
  accessAcknowledged: z.literal("on", {
    error: "Confirm that this teammate will receive workspace-wide access",
  }),
});

export type InviteTeamState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"email" | "role" | "accessAcknowledged", string[]>>;
};

export const initialInviteTeamState: InviteTeamState = {
  status: "idle",
  message: "",
};

export async function inviteTeamMemberAction(
  _previousState: InviteTeamState,
  formData: FormData,
): Promise<InviteTeamState> {
  const session = await auth();

  if (!session.userId || !session.orgId) {
    return {
      status: "error",
      message: "Select a workspace before inviting a teammate.",
    };
  }

  if (session.orgRole !== "org:admin") {
    return {
      status: "error",
      message: "Only workspace administrators can invite teammates.",
    };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    accessAcknowledged: formData.get("accessAcknowledged"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the invitation details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const client = await clerkClient();
  const emailAddress = parsed.data.email.toLowerCase();
  const publicAppUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://app.localmap.co";

  const [memberships, invitations] = await Promise.all([
    client.organizations.getOrganizationMembershipList({
      organizationId: session.orgId,
      emailAddress: [emailAddress],
      limit: 1,
    }),
    client.organizations.getOrganizationInvitationList({
      organizationId: session.orgId,
      status: ["pending"],
      limit: 100,
    }),
  ]);

  if (memberships.totalCount > 0) {
    return {
      status: "error",
      message: `${emailAddress} is already a member of this workspace.`,
    };
  }

  if (
    invitations.data.some(
      (invitation) => invitation.emailAddress.toLowerCase() === emailAddress,
    )
  ) {
    return {
      status: "error",
      message: `${emailAddress} already has a pending invitation.`,
    };
  }

  try {
    await client.organizations.createOrganizationInvitation({
      organizationId: session.orgId,
      emailAddress,
      role: parsed.data.role,
      inviterUserId: session.userId,
      expiresInDays: 14,
      redirectUrl: new URL("/dashboard", publicAppUrl).toString(),
      publicMetadata: {
        invitedFrom: "localmap-team",
        accessScope: "workspace",
      },
    });
  } catch (error) {
    console.error("[team] invitation failed", error);
    return {
      status: "error",
      message: "Clerk could not send this invitation. Try again in a moment.",
    };
  }

  revalidatePath("/dashboard/team");

  return {
    status: "success",
    message: `Invitation sent to ${emailAddress}.`,
  };
}
