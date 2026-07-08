"use client";

import { useState } from "react";

import { AuditAlreadyClaimedCard } from "@/components/onboarding/audit-already-claimed-card";
import { AuditLinkPicker } from "@/components/onboarding/audit-link-picker";
import {
  BusinessSetupWizard,
  type BusinessSetupMode,
} from "@/components/onboarding/business-setup-wizard";
import type { BusinessCategoryOption } from "@/components/onboarding/business-category-select";
import { OperatingModelGuide } from "@/components/onboarding/operating-model-guide";
import { Badge } from "@/components/ui/badge";
import type { AuditClaimContext, OrgLocationOption } from "@/lib/grader/claim-context";
import type { OrganizationType } from "@/lib/auth/organizations";
import type { OnboardingIntent } from "@/lib/onboarding/routing";
import { gradeForScore } from "@/lib/grader/scoring";

function GraderAuditHero({ claimContext }: { claimContext: AuditClaimContext }) {
  const grade = gradeForScore(claimContext.score);
  const label = claimContext.businessName ?? "Your business";

  return (
    <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 to-white p-5 dark:from-emerald-950/20 dark:to-card">
      <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
        Visibility audit · {label}
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-4xl font-bold tabular-nums tracking-tight">
            {claimContext.score}
            <span className="text-lg font-medium text-muted-foreground">/100</span>
          </p>
          <Badge className="mt-1 rounded-full capitalize">{grade}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">
              {claimContext.failedChecks}
            </span>{" "}
            leaks to fix
          </p>
          {claimContext.estimatedMonthlyLoss > 0 ? (
            <p>
              ~$
              {claimContext.estimatedMonthlyLoss.toLocaleString()}/mo estimated
              at stake
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Connect this audit to your LocalSync workspace to open your fix queue,
        sync listings, and track improvement when you re-grade.
      </p>
    </div>
  );
}

export function GraderClaimOnboarding({
  claimContext,
  categories,
  existingLocations,
  suggestedLocationId,
  hasWorkspace,
  organizationId,
  organizationType,
  organizationName,
  onboardingIntent = "fix",
}: {
  claimContext: AuditClaimContext;
  categories: BusinessCategoryOption[];
  existingLocations: OrgLocationOption[];
  suggestedLocationId: string | null;
  hasWorkspace: boolean;
  organizationId: string | null;
  organizationType: OrganizationType | null;
  organizationName: string | null;
  onboardingIntent?: OnboardingIntent;
}) {
  const [showCreateForm, setShowCreateForm] = useState(
    existingLocations.length === 0,
  );

  if (claimContext.claimStatus === "claimed_other_org") {
    return (
      <AuditAlreadyClaimedCard
        auditId={claimContext.auditId!}
        businessName={claimContext.businessName}
      />
    );
  }

  const businessMode: BusinessSetupMode =
    organizationType === "agency" ? "agency-client" : "initial-business";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Connect your audit to LocalSync
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your grader results are ready — link them to a workspace location and
          start fixing what&apos;s holding you back in local search.
        </p>
      </div>

      <GraderAuditHero claimContext={claimContext} />

      {claimContext.operatingModel ? (
        <OperatingModelGuide prefill={claimContext} />
      ) : null}

      {hasWorkspace &&
      existingLocations.length > 0 &&
      !showCreateForm &&
      organizationId ? (
        <AuditLinkPicker
          auditId={claimContext.auditId!}
          businessName={claimContext.businessName}
          existingLocations={existingLocations}
          suggestedLocationId={suggestedLocationId}
          organizationId={organizationId}
          onboardingIntent={onboardingIntent}
          onCreateNew={() => setShowCreateForm(true)}
        />
      ) : (
        <>
          {hasWorkspace && existingLocations.length > 0 ? (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setShowCreateForm(false)}
            >
              ← Link to an existing business instead
            </button>
          ) : null}
          <BusinessSetupWizard
            categories={categories}
            hasWorkspace={hasWorkspace}
            mode={businessMode}
            agencyName={organizationName ?? undefined}
            prefill={claimContext}
            onboardingIntent={onboardingIntent}
          />
        </>
      )}
    </div>
  );
}
