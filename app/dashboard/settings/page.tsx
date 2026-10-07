import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { listLocationsAction } from "@/app/actions/locations";
import { WorkspaceGuidanceSettings } from "@/components/settings/workspace-guidance-settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");
  if (!session.orgId) redirect("/welcome/team");

  const locationRows = await listLocationsAction();

  return (
    <WorkspaceGuidanceSettings
      isAdmin={session.orgRole === "org:admin"}
      locations={locationRows.map((location) => ({
        id: location.id,
        name: location.name,
        city: location.profile.city ?? null,
        state: location.profile.state ?? null,
      }))}
    />
  );
}
