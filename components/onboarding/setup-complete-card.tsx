import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileBarChart2Icon,
  GlobeIcon,
  RadarIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { GoToDashboardButton } from "@/components/onboarding/go-to-dashboard-button";
import { OrgAwareNavButton } from "@/components/navigation/org-aware-nav-button";
import type { OrganizationType } from "@/lib/auth/organizations";
import { modelLabel, resolvePostSetupRoute } from "@/lib/onboarding/routing";
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import { Button } from "@/components/ui/button";

export function SetupCompleteCard({
  locationId,
  publishersTracked,
  accountType = "business",
  auditId = null,
  scanId = null,
  organizationId = null,
  operatingContext = null,
}: {
  locationId: string;
  publishersTracked: number;
  accountType?: OrganizationType;
  auditId?: string | null;
  scanId?: string | null;
  organizationId?: string | null;
  operatingContext?: LocationOperatingContext | null;
}) {
  const isAgency = accountType === "agency";
  const context =
    operatingContext ??
    ({
      operatingModel: "storefront",
      auditTier: "full_local",
      gbpLinkedAtAudit: true,
      serviceAreaCities: null,
      onboardingIntent: null,
      graderAuditId: null,
    } satisfies LocationOperatingContext);

  const route = resolvePostSetupRoute({
    locationId,
    context,
    auditId,
    isAgency,
  });

  return (
    <div className="localmap-card-glow rounded-2xl border bg-card">
      <div className="space-y-1.5 p-6 pb-4">
        <div
          className={`mb-2 flex size-12 items-center justify-center rounded-2xl ${
            isAgency
              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          <CheckCircle2Icon className="size-6" />
        </div>
        <h2 className="text-xl font-semibold">
          {isAgency ? "Your agency workspace is ready" : "You're set up!"}
        </h2>
        {!isAgency && operatingContext ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {modelLabel(context.operatingModel)} path
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {isAgency
            ? "Your first client is live. Here's what we set up:"
            : "Here's what we just did behind the scenes:"}
        </p>
      </div>
      <div className="space-y-4 px-6 pb-6">
        <ul className="space-y-3 text-sm">
          {isAgency ? (
            <>
              <li className="flex items-start gap-3">
                <UsersIcon className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <span>
                  Created your <strong>agency workspace</strong> and a{" "}
                  <strong>client record</strong> for your first end-customer —
                  ready for more clients from the Clients page.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <BuildingIcon className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <span>
                  Built a <strong>master business profile</strong> for this
                  client — name, phone, address, hours, and services in one
                  place.
                </span>
              </li>
            </>
          ) : (
            <li className="flex items-start gap-3">
              <BuildingIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Created your workspace and a{" "}
                <strong>master business profile</strong> — the single source of
                truth for your name, phone, address, hours, and services.
              </span>
            </li>
          )}
          <li className="flex items-start gap-3">
            <RadarIcon
              className={`mt-0.5 size-4 shrink-0 ${
                isAgency
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-primary"
              }`}
            />
            <span>
              Started tracking <strong>{publishersTracked} publishers</strong> —
              directories like Google, Yelp, Angi, and BBB where{" "}
              {isAgency ? "this client" : "your business"} should be consistent.
              We&apos;ll audit them as you add listing URLs.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <GlobeIcon
              className={`mt-0.5 size-4 shrink-0 ${
                isAgency
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-primary"
              }`}
            />
            <span>
              Computed the first <strong>visibility score</strong>. It goes up as
              you complete the profile and fix listing inconsistencies.
            </span>
          </li>
        </ul>

        {!isAgency ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold">{route.headline}</p>
            <p className="mt-1 text-sm text-muted-foreground">{route.subline}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <GoToDashboardButton
            organizationId={organizationId}
            auditId={auditId}
            scanId={scanId}
          />

          {route.primary.external ? (
            <Button
              variant="default"
              className="w-full"
              nativeButton={false}
              render={
                <a
                  href={route.primary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              {route.primary.label}
              <ExternalLinkIcon className="size-4" />
            </Button>
          ) : (
            <OrgAwareNavButton
              href={route.primary.href}
              organizationId={organizationId}
            >
              {route.primary.label}
              <ArrowRightIcon className="size-4" />
            </OrgAwareNavButton>
          )}

          {route.secondary.map((action) =>
            action.external ? (
              <Button
                key={action.id}
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={
                  <a
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                {action.label}
                <ExternalLinkIcon className="size-3.5" />
              </Button>
            ) : (
              <OrgAwareNavButton
                key={action.id}
                href={action.href}
                organizationId={organizationId}
                variant="outline"
              >
                {action.id === "audit" ? (
                  <FileBarChart2Icon className="size-4" />
                ) : null}
                {action.label}
                {action.id !== "audit" ? (
                  <ArrowRightIcon className="size-4" />
                ) : null}
              </OrgAwareNavButton>
            ),
          )}

          {isAgency ? (
            <>
              <OrgAwareNavButton
                href="/dashboard/team"
                organizationId={organizationId}
                variant="outline"
              >
                <UserPlusIcon className="size-4" />
                Invite your team
              </OrgAwareNavButton>
              <OrgAwareNavButton
                href="/dashboard/clients"
                organizationId={organizationId}
                variant="outline"
              >
                Manage clients
              </OrgAwareNavButton>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
