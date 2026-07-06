import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ensureOrganizationAction } from "@/app/actions/org";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOrganization } from "@/lib/auth/organizations";

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
