import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { TeamInvitationWelcome } from "@/components/team/team-invitation-welcome";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Workspace invitation accepted",
  description: "Open the LocalMap workspace you were invited to join.",
};

export default async function TeamWelcomePage() {
  const session = await auth();
  if (!session.userId) return null;

  const client = await clerkClient();
  const [user, membershipResponse] = await Promise.all([
    client.users.getUser(session.userId),
    client.users.getOrganizationMembershipList({
      userId: session.userId,
      limit: 100,
    }),
  ]);

  const membership =
    membershipResponse.data.find(
      (item) => item.organization.id === session.orgId,
    ) ??
    membershipResponse.data.toSorted((a, b) => b.createdAt - a.createdAt)[0];

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "your account";

  return (
    <div className="localmap-mesh flex min-h-full flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <LocalMapLogo />
        <ThemeToggle />
      </header>
      {membership ? (
        <TeamInvitationWelcome
          organizationId={membership.organization.id}
          organizationName={membership.organization.name}
          role={membership.role === "org:admin" ? "Workspace admin" : "Team member"}
          email={email}
        />
      ) : (
        <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16 text-center">
          <section className="w-full rounded-3xl border bg-card p-8 localmap-card-glow">
            <h1 className="text-2xl font-semibold">No workspace found yet</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Open the latest invitation email and accept it with {email}. If
              you already accepted, ask the workspace owner to resend it.
            </p>
          </section>
        </main>
      )}
    </div>
  );
}
