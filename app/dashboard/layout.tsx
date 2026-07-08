import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { ensureOrganizationAction } from "@/app/actions/org";
import { DashboardLayoutGate } from "@/components/dashboard/dashboard-layout-gate";
import { getDb } from "@/db";
import { locations } from "@/db/schema";
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

  try {
    await ensureOrganizationAction();
  } catch (error) {
    console.error("[dashboard layout] ensureOrganization failed:", error);
  }

  const locationCount = await countOrgLocations(session.orgId);
  const setupIncomplete = locationCount === 0;

  const organization = await getOrganization(session.orgId);

  const db = getDb();
  const orgLocations = await db
    .select({
      id: locations.id,
      name: locations.name,
      profile: locations.profile,
    })
    .from(locations)
    .where(eq(locations.organizationId, session.orgId))
    .orderBy(desc(locations.updatedAt));

  const businesses = orgLocations.map((location) => ({
    id: location.id,
    name: location.name,
    city: location.profile?.city ?? null,
  }));

  return (
    <DashboardLayoutGate
      setupIncomplete={setupIncomplete}
      isAgency={organization?.type === "agency"}
      workspaceName={organization?.name ?? "LocalSync workspace"}
      workspaceImageUrl={organization?.imageUrl ?? null}
      businesses={businesses}
    >
      {children}
    </DashboardLayoutGate>
  );
}
