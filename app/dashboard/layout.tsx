import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ensureOrganizationAction } from "@/app/actions/org";
import { DashboardLayoutGate } from "@/components/dashboard/dashboard-layout-gate";
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
  const setupIncomplete = locationCount === 0;
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/dashboard/onboarding");

  if (setupIncomplete && !isOnboarding) {
    redirect("/dashboard/onboarding");
  }

  const organization = await getOrganization(session.orgId);

  return (
    <DashboardLayoutGate
      setupIncomplete={setupIncomplete}
      isAgency={organization?.type === "agency"}
      workspaceName={organization?.name ?? "LocalSync workspace"}
    >
      {children}
    </DashboardLayoutGate>
  );
}
