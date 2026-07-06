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
import { Button } from "@/components/ui/button";

type OnboardingStep = "choose" | "agency-name" | "business";

function resolveInitialStep(input: {
  addingAnother: boolean;
  hasWorkspace: boolean;
  organizationType: OrganizationType | null;
}): OnboardingStep {
  if (input.addingAnother) {
    return "business";
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
}: {
  categories: BusinessCategoryOption[];
  hasWorkspace: boolean;
  organizationType: OrganizationType | null;
  organizationName: string | null;
  addingAnother: boolean;
}) {
  const [step, setStep] = useState<OnboardingStep>(() =>
    resolveInitialStep({ addingAnother, hasWorkspace, organizationType }),
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
        title: "Add another business",
        description:
          "Each business gets its own profile and directory tracking.",
      };
    }

    if (step === "choose") {
      return {
        title: "How will you use LocalSync?",
        description:
          "Pick the path that matches how you manage local listings. You can always add more businesses later.",
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
      title: "Let's get your business found",
      description:
        "Takes about a minute. We handle the workspace, profile, and directory tracking for you.",
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {heading.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{heading.description}</p>
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
