import { auth } from "@clerk/nextjs/server";

export type OrgAuthContext = {
  userId: string;
  orgId: string;
  orgRole: string | undefined;
};

/** Explicit read-only roles cannot request syncs or mutate listing connections. */
const READ_ONLY_ROLES = new Set([
  "org:guest",
  "guest",
  "viewer",
  "org:viewer",
  "org:reader",
]);

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

/**
 * Require an org member who can mutate listings / request syncs.
 * Blocks known read-only roles; admins and members may sync.
 */
export async function requireOrgWriteAccess(): Promise<OrgAuthContext> {
  const ctx = await requireOrgAuth();

  if (ctx.orgRole && READ_ONLY_ROLES.has(ctx.orgRole)) {
    throw new Error(
      "Your organization role is read-only. Ask an admin to sync listings.",
    );
  }

  return ctx;
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
