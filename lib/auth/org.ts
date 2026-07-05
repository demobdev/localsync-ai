import { auth } from "@clerk/nextjs/server";

export type OrgAuthContext = {
  userId: string;
  orgId: string;
  orgRole: string | undefined;
};

export async function requireOrgAuth(): Promise<OrgAuthContext> {
  const session = await auth();

  if (!session.userId) {
    throw new Error("Not authenticated");
  }

  if (!session.orgId) {
    throw new Error("Select an organization to continue");
  }

  return {
    userId: session.userId,
    orgId: session.orgId,
    orgRole: session.orgRole ?? undefined,
  };
}

export async function getOptionalOrgAuth(): Promise<OrgAuthContext | null> {
  const session = await auth();

  if (!session.userId || !session.orgId) {
    return null;
  }

  return {
    userId: session.userId,
    orgId: session.orgId,
    orgRole: session.orgRole ?? undefined,
  };
}
