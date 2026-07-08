import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { listOnboardingCategoriesAction } from "@/app/actions/onboarding";
import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { OperatingModelGuide } from "@/components/onboarding/operating-model-guide";
import { SetupCompleteCard } from "@/components/onboarding/setup-complete-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getOrganization } from "@/lib/auth/organizations";
import { getAuditPrefill } from "@/lib/grader/claim";
import { prefillFromScan, type SetupPrefill } from "@/lib/onboarding/prefill";
import { countOrgLocations } from "@/lib/org/locations";
import { getScanPrefill } from "@/lib/scan/leads";

export default async function DashboardOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    done?: string;
    location?: string;
    publishers?: string;
    add?: string;
    accountType?: string;
    scan?: string;
    auditId?: string;
    audit?: string;
    org?: string;
    intent?: string;
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
  const locationCount = session.orgId
    ? await countOrgLocations(session.orgId)
    : 0;
  const showAccountTypeChoice = locationCount === 0 && !addingAnother;

  // Grader audit prefill wins over scan prefill when both params exist.
  let prefill: SetupPrefill | null = null;
  if (!setupComplete) {
    if (params.auditId) {
      prefill = await getAuditPrefill(params.auditId);
    }
    if (!prefill && params.scan) {
      const scanPrefill = await getScanPrefill(params.scan);
      prefill = scanPrefill ? prefillFromScan(scanPrefill) : null;
    }
  }

  // An audit-driven visit behaves like "add another business" — existing
  // workspaces shouldn't be bounced to the dashboard before claiming it.
  if (session.orgId && !setupComplete && !addingAnother && !prefill?.auditId) {
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
              auditId={params.audit ?? null}
              scanId={params.scan ?? null}
              organizationId={params.org ?? session.orgId ?? null}
            />
          ) : (
            <>
              {prefill?.operatingModel ? (
                <OperatingModelGuide prefill={prefill} />
              ) : null}
              <OnboardingFlow
              categories={categories}
              hasWorkspace={Boolean(session.orgId)}
              organizationType={organization?.type ?? null}
              organizationName={organization?.name ?? null}
              addingAnother={addingAnother}
              showAccountTypeChoice={showAccountTypeChoice}
              prefill={prefill}
            />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
