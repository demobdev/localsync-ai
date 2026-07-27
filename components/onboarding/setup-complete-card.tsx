import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { GoToDashboardButton } from "@/components/onboarding/go-to-dashboard-button";
import { OrgAwareNavButton } from "@/components/navigation/org-aware-nav-button";
import type { OrganizationType } from "@/lib/auth/organizations";
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";

export function SetupCompleteCard({
  locationId,
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
  operatingContext?: LocationOperatingContext | null;
}) {
  const isAgency = accountType === "agency";
  const steps = [
    {
      label: "Master Profile",
      description: "Core business facts saved",
      done: true,
      current: false,
    },
    {
      label: "Connect Google",
      description: "Authorize the manager account",
      done: false,
      current: true,
    },
    {
      label: "Confirm listing",
      description: "Choose the correct publisher record",
      done: false,
      current: false,
    },
    {
      label: "Approve & verify",
      description: "Review every difference before sync",
      done: false,
      current: false,
    },
  ];

  return (
    <div className="localmap-card-glow overflow-hidden rounded-[1.75rem] border bg-card">
      <div className="border-b bg-[#102d32] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
          <CheckCircle2Icon className="size-4" />
          Step 1 complete
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Your Master Profile is ready.
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
          {isAgency
            ? "Your agency workspace and first client profile are ready. Next, connect the account that manages this client’s Google listing."
            : "This is now the source of truth for your business. Next, connect the account that manages your Google listing."}
        </p>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        <ol className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.label}
              className={`flex items-start gap-3 rounded-2xl border p-4 ${
                step.current ? "border-primary/35 bg-primary/5" : "bg-muted/15"
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-emerald-600 text-white"
                    : step.current
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background text-muted-foreground"
                }`}
              >
                {step.done ? (
                  <CheckCircle2Icon className="size-4" />
                ) : step.current ? (
                  <span className="text-xs font-bold">{index + 1}</span>
                ) : (
                  <CircleIcon className="size-3" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Nothing publishes automatically</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You will see the field-by-field comparison and approve the direction
              of every change. LocalMap verifies the publisher state before it
              says Live &amp; synced.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <OrgAwareNavButton
            href={`/dashboard/locations/${locationId}/listings`}
            organizationId={organizationId}
            className="w-full"
          >
            Continue to publisher setup
            <ArrowRightIcon className="size-4" />
          </OrgAwareNavButton>
          <GoToDashboardButton
            organizationId={organizationId}
            auditId={auditId}
            scanId={scanId}
            variant="outline"
          />
          {isAgency ? (
            <OrgAwareNavButton
              href="/dashboard/clients"
              organizationId={organizationId}
              variant="ghost"
              className="w-full"
            >
              <UsersIcon className="size-4" />
              Manage clients instead
            </OrgAwareNavButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
