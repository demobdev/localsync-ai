import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { listOnboardingCategoriesAction } from "@/app/actions/onboarding";
import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { GraderClaimOnboarding } from "@/components/onboarding/grader-claim-onboarding";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { OperatingModelGuide } from "@/components/onboarding/operating-model-guide";
import { SetupCompleteCard } from "@/components/onboarding/setup-complete-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDb } from "@/db";
import { locations } from "@/db/schema";
import { getOrganization } from "@/lib/auth/organizations";
import {
  getAuditClaimContext,
  rankOrgLocationsForAudit,
} from "@/lib/grader/claim-context";
import { resolveGraderEntryRoute } from "@/lib/onboarding/grader-entry";
import { parseOnboardingIntent } from "@/lib/onboarding/routing";
import { prefillFromScan, type SetupPrefill } from "@/lib/onboarding/prefill";
import { countOrgLocations } from "@/lib/org/locations";
import { getLocationOperatingContext } from "@/lib/profile/operating-model-meta";
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
  const [session, params] = await Promise.all([auth(), searchParams]);

  let categories: Awaited<ReturnType<typeof listOnboardingCategoriesAction>> =
    [];
  try {
    categories = await listOnboardingCategoriesAction();
  } catch (error) {
    console.error("[onboarding] listOnboardingCategories failed:", error);
  }

  const setupComplete = params.done === "1" && params.location;
  const addingAnother = params.add === "1";
  const onboardingIntent = parseOnboardingIntent(params.intent);
  const organization = session.orgId
    ? await getOrganization(session.orgId)
    : null;
  const locationCount = session.orgId
    ? await countOrgLocations(session.orgId)
    : 0;
  const showAccountTypeChoice = locationCount === 0 && !addingAnother;

  const claimContext = params.auditId
    ? await getAuditClaimContext(params.auditId, {
        userId: session.userId,
        orgId: session.orgId ?? null,
      })
    : null;

  // Grader audit prefill wins over scan prefill when both params exist.
  let prefill: SetupPrefill | null = claimContext;
  if (!setupComplete && !prefill && params.scan) {
    const scanPrefill = await getScanPrefill(params.scan);
    prefill = scanPrefill ? prefillFromScan(scanPrefill) : null;
  }

  let existingLocations: ReturnType<typeof rankOrgLocationsForAudit> = [];
  if (session.orgId && claimContext?.claimStatus === "unclaimed") {
    const db = getDb();
    const rows = await db
      .select({
        id: locations.id,
        name: locations.name,
        profile: locations.profile,
      })
      .from(locations)
      .where(eq(locations.organizationId, session.orgId));

    existingLocations = rankOrgLocationsForAudit(claimContext, rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.profile?.city ?? null,
      state: row.profile?.state ?? null,
    })));
  }

  const entryRoute = resolveGraderEntryRoute({
    claimContext,
    session: { userId: session.userId, orgId: session.orgId ?? null },
    existingLocations,
    addingAnother,
    setupComplete: Boolean(setupComplete),
  });

  if (entryRoute.type === "redirect") {
    redirect(entryRoute.href);
  }

  // Organic onboarding only — skip when user already has locations.
  if (
    session.orgId &&
    !setupComplete &&
    !addingAnother &&
    entryRoute.type === "generic_onboarding"
  ) {
    if (locationCount > 0) {
      redirect("/dashboard");
    }
  }

  let operatingContext = null;
  if (setupComplete && params.location) {
    const db = getDb();
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, params.location),
      columns: { profile: true },
    });
    if (location) {
      operatingContext = getLocationOperatingContext(location.profile);
    }
  }

  const graderClaimFlow = entryRoute.type === "claim_onboarding";

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
              operatingContext={operatingContext}
            />
          ) : graderClaimFlow ? (
            <GraderClaimOnboarding
              claimContext={entryRoute.claimContext}
              categories={categories}
              existingLocations={entryRoute.existingLocations}
              suggestedLocationId={entryRoute.suggestedLocationId}
              hasWorkspace={Boolean(session.orgId)}
              organizationId={session.orgId ?? null}
              organizationType={organization?.type ?? null}
              organizationName={organization?.name ?? null}
              onboardingIntent={onboardingIntent}
            />
          ) : entryRoute.type === "already_claimed" && claimContext ? (
            <GraderClaimOnboarding
              claimContext={claimContext}
              categories={categories}
              existingLocations={[]}
              suggestedLocationId={null}
              hasWorkspace={Boolean(session.orgId)}
              organizationId={session.orgId ?? null}
              organizationType={organization?.type ?? null}
              organizationName={organization?.name ?? null}
              onboardingIntent={onboardingIntent}
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
                onboardingIntent={onboardingIntent}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
