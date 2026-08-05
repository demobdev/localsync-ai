import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { TeamInvitationWelcome } from "@/components/team/team-invitation-welcome";
import { ThemeToggle } from "@/components/theme-toggle";
import { resolveDashboardEntry } from "@/lib/onboarding/dashboard-entry";
import {
  recentInvitationCutoff,
  selectInvitationMembership,
  selectWorkspaceMembership,
} from "@/lib/team/invitation-flow";

export const metadata: Metadata = {
  title: "Workspace invitation",
  description: "Confirm the LocalMap workspace you were invited to join.",
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

  const memberships = membershipResponse.data.map((item) => ({
      membership: item,
      organizationId: item.organization.id,
      createdAt: item.createdAt,
    }));
  const entry = resolveDashboardEntry({
    hasWorkspace: memberships.length > 0,
    hasActiveWorkspace: Boolean(session.orgId),
  });

  if (entry === "onboarding") redirect("/dashboard/onboarding");

  const recentMembership = selectInvitationMembership(
    memberships,
    session.orgId,
    recentInvitationCutoff(),
  );

  if (entry === "dashboard" && !recentMembership) redirect("/dashboard");

  const membership =
    (recentMembership ??
      selectWorkspaceMembership(memberships, session.orgId))?.membership;

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
          isNewMembership={Boolean(recentMembership)}
        />
      ) : (
        <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16 text-center">
          <section className="w-full rounded-3xl border bg-card p-8 localmap-card-glow">
            <h1 className="text-2xl font-semibold">
              Invitation not confirmed yet
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This account has not joined the invited workspace. Open the most
              recent invitation email and finish with {email}. Older links stop
              working after a new link is sent.
            </p>
          </section>
        </main>
      )}
    </div>
  );
}
