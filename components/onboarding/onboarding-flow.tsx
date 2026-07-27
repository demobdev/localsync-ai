"use client";

import { useState } from "react";

import {
  AccountTypeSelector,
  type AccountType,
} from "@/components/onboarding/account-type-selector";
import { AgencySetupWizard } from "@/components/onboarding/agency-setup-wizard";
import {
  BusinessSetupWizard,
  type BusinessSetupMode,
} from "@/components/onboarding/business-setup-wizard";
import type { BusinessCategoryOption } from "@/components/onboarding/business-category-select";
import type { OrganizationType } from "@/lib/auth/organizations";
import type { OnboardingIntent } from "@/lib/onboarding/routing";
import type { SetupPrefill } from "@/lib/onboarding/prefill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OnboardingStep = "choose" | "agency-name" | "business";

function resolveInitialStep(input: {
  addingAnother: boolean;
  showAccountTypeChoice: boolean;
  hasWorkspace: boolean;
  organizationType: OrganizationType | null;
}): OnboardingStep {
  if (input.addingAnother) {
    return "business";
  }

  if (input.showAccountTypeChoice) {
    return "choose";
  }

  if (input.hasWorkspace && input.organizationType === "agency") {
    return "business";
  }

  if (input.hasWorkspace && input.organizationType === "business") {
    return "business";
  }

  return "choose";
}

export function OnboardingFlow({
  categories,
  hasWorkspace,
  organizationType,
  organizationName,
  addingAnother,
  showAccountTypeChoice,
  prefill = null,
  onboardingIntent = "organic",
}: {
  categories: BusinessCategoryOption[];
  hasWorkspace: boolean;
  organizationType: OrganizationType | null;
  organizationName: string | null;
  addingAnother: boolean;
  showAccountTypeChoice: boolean;
  prefill?: SetupPrefill | null;
  onboardingIntent?: OnboardingIntent;
}) {
  const [step, setStep] = useState<OnboardingStep>(() =>
    resolveInitialStep({
      addingAnother,
      showAccountTypeChoice,
      hasWorkspace,
      organizationType,
    }),
  );
  const [selectedType, setSelectedType] = useState<AccountType | null>(() => {
    if (addingAnother) {
      return organizationType === "agency" ? "agency" : "business";
    }

    if (organizationType === "agency") {
      return "agency";
    }

    if (organizationType === "business" && hasWorkspace) {
      return "business";
    }

    return null;
  });
  const [agencyName, setAgencyName] = useState(organizationName ?? "");

  const businessMode: BusinessSetupMode = addingAnother
    ? "add-business"
    : selectedType === "agency"
      ? "agency-client"
      : "initial-business";

  const heading = (() => {
    if (addingAnother) {
      return {
        title: "Create another Master Profile",
        description:
          "Each business gets one approved source of truth before any publisher is connected.",
      };
    }

    if (step === "choose") {
      return {
        title: "Who are you setting up?",
        description:
          "We’ll tailor the workspace without changing the core workflow: profile, connect, confirm, verify.",
      };
    }

    if (step === "agency-name") {
      return {
        title: "Set up your agency workspace",
        description:
          "Create a named workspace for your team, then add your first client business.",
      };
    }

    if (selectedType === "agency") {
      return {
        title: "Add your first client",
        description: agencyName
          ? `Tell us about the first business ${agencyName} will manage.`
          : "Tell us about the first client business you will manage.",
      };
    }

    return {
      title: "Create your Master Profile",
      description:
        "Start with the facts customers see most. You can add richer content after the core listing is connected.",
    };
  })();

  function handleAccountTypeSelect(type: AccountType) {
    setSelectedType(type);

    if (type === "agency") {
      setStep("agency-name");
      return;
    }

    setStep("business");
  }

  return (
    <>
      <div className="rounded-2xl border bg-card/75 p-3 localmap-card-glow">
        <ol className="grid grid-cols-3 gap-2" aria-label="Setup progress">
          {[
            ["1", "Master Profile", "Current"],
            ["2", "Connect", "Next"],
            ["3", "Approve & verify", "Then"],
          ].map(([number, label, state], index) => (
            <li
              key={label}
              className={`rounded-xl px-3 py-2.5 ${
                index === 0 ? "bg-primary text-primary-foreground" : "bg-muted/60"
              }`}
            >
              <p className="text-[10px] font-semibold tracking-wide uppercase opacity-70">
                {state} · {number}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold sm:text-sm">
                {label}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {heading.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{heading.description}</p>
        {prefill ? (
          <Badge
            variant="secondary"
            className="mt-3 rounded-full border border-primary/20 bg-primary/10 text-primary"
          >
            Pre-filled from your {prefill.source === "audit" ? "audit" : "scan"}{" "}
            of{" "}
            {(prefill.url ?? prefill.businessName ?? "your business")
              .replace(/^https?:\/\//, "")
              .replace(/\/$/, "")}{" "}
            · score {prefill.score}/100
          </Badge>
        ) : null}
      </div>

      {step === "choose" ? (
        <AccountTypeSelector onSelect={handleAccountTypeSelect} />
      ) : null}

      {step === "agency-name" ? (
        <>
          <AgencySetupWizard
            onComplete={(name) => {
              setAgencyName(name);
              setStep("business");
            }}
          />
          {!hasWorkspace ? (
            <Button
              variant="ghost"
              className="self-start px-0 text-muted-foreground"
              onClick={() => {
                setSelectedType(null);
                setStep("choose");
              }}
            >
              ← Back to account type
            </Button>
          ) : null}
        </>
      ) : null}

      {step === "business" ? (
        <>
          <BusinessSetupWizard
            categories={categories}
            hasWorkspace={hasWorkspace || selectedType === "agency"}
            mode={businessMode}
            agencyName={agencyName || organizationName || undefined}
            prefill={prefill}
            onboardingIntent={onboardingIntent}
          />
          {!addingAnother && !hasWorkspace && selectedType !== "agency" ? (
            <Button
              variant="ghost"
              className="self-start px-0 text-muted-foreground"
              onClick={() => {
                setSelectedType(null);
                setStep("choose");
              }}
            >
              ← Back to account type
            </Button>
          ) : null}
          {!addingAnother && step === "business" && selectedType === "agency" && !agencyName ? (
            <Button
              variant="ghost"
              className="self-start px-0 text-muted-foreground"
              onClick={() => setStep("agency-name")}
            >
              ← Back to agency name
            </Button>
          ) : null}
        </>
      ) : null}
    </>
  );
}
