import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ensureOrganizationAction } from "@/app/actions/org";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOrganization } from "@/lib/auth/organizations";
import { countOrgLocations } from "@/lib/org/locations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  if (!session.orgId) {
    return <>{children}</>;
  }

  await ensureOrganizationAction();

  const locationCount = await countOrgLocations(session.orgId);

  // First-time setup: keep onboarding full-screen without dashboard chrome.
  if (locationCount === 0) {
    return <>{children}</>;
  }

  const organization = await getOrganization(session.orgId);

  return (
    <DashboardShell
      isAgency={organization?.type === "agency"}
      workspaceName={organization?.name ?? "LocalSync workspace"}
    >
      {children}
    </DashboardShell>
  );
}
