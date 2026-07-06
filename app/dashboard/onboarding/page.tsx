import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { listOnboardingCategoriesAction } from "@/app/actions/onboarding";
import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SetupCompleteCard } from "@/components/onboarding/setup-complete-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getOrganization } from "@/lib/auth/organizations";
import { countOrgLocations } from "@/lib/org/locations";

export default async function DashboardOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    done?: string;
    location?: string;
    publishers?: string;
    add?: string;
    accountType?: string;
  }>;
}) {
  const [session, categories, params] = await Promise.all([
    auth(),
    listOnboardingCategoriesAction(),
    searchParams,
  ]);

  const setupComplete = params.done === "1" && params.location;
  const addingAnother = params.add === "1";
  const organization = session.orgId
    ? await getOrganization(session.orgId)
    : null;

  if (
    session.orgId &&
    !setupComplete &&
    !addingAnother
  ) {
    const locationCount = await countOrgLocations(session.orgId);
    if (locationCount > 0) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="localmap-mesh min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <LocalMapLogo />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-6 pb-12">
          {setupComplete ? (
            <SetupCompleteCard
              locationId={params.location!}
              publishersTracked={Number(params.publishers ?? 0) || 20}
              accountType={
                params.accountType === "agency" ? "agency" : "business"
              }
            />
          ) : (
            <OnboardingFlow
              categories={categories}
              hasWorkspace={Boolean(session.orgId)}
              organizationType={organization?.type ?? null}
              organizationName={organization?.name ?? null}
              addingAnother={addingAnother}
            />
          )}
        </div>
      </div>
    </div>
  );
}
