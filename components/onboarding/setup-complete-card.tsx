import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCircle2Icon,
  FileBarChart2Icon,
  GlobeIcon,
  RadarIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { GoToDashboardButton } from "@/components/onboarding/go-to-dashboard-button";
import { OrgAwareNavButton } from "@/components/navigation/org-aware-nav-button";
import type { OrganizationType } from "@/lib/auth/organizations";

export function SetupCompleteCard({
  locationId,
  publishersTracked,
  accountType = "business",
  auditId = null,
  scanId = null,
  organizationId = null,
}: {
  locationId: string;
  publishersTracked: number;
  accountType?: OrganizationType;
  auditId?: string | null;
  scanId?: string | null;
  organizationId?: string | null;
}) {
  const isAgency = accountType === "agency";

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
        <div className="flex flex-col gap-2">
          <GoToDashboardButton
            organizationId={organizationId}
            auditId={auditId}
            scanId={scanId}
          />
          <OrgAwareNavButton
            href={`/dashboard/locations/${locationId}?tab=nap`}
            organizationId={organizationId}
            variant="outline"
          >
            {isAgency ? "Complete client profile" : "Complete your profile"}
            <ArrowRightIcon className="size-4" />
          </OrgAwareNavButton>
          {auditId ? (
            <OrgAwareNavButton
              href={`/grader/${auditId}`}
              organizationId={organizationId}
              variant="outline"
            >
              <FileBarChart2Icon className="size-4" />
              View your full audit report
            </OrgAwareNavButton>
          ) : null}
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
          ) : (
            <OrgAwareNavButton
              href="/dashboard/connect"
              organizationId={organizationId}
              variant="outline"
            >
              Connect listings & Google
            </OrgAwareNavButton>
          )}
        </div>
      </div>
    </div>
  );
}
