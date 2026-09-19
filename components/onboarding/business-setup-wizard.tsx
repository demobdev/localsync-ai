"use client";

import { useClerk } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { quickSetupBusinessAction } from "@/app/actions/onboarding";
import {
  BusinessCategorySelect,
  type BusinessCategoryOption,
} from "@/components/onboarding/business-category-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelSetupFields } from "@/components/onboarding/model-setup-fields";
import { onboardingGuideForModel } from "@/lib/onboarding/operating-model-paths";
import { getWizardFieldConfig } from "@/lib/onboarding/wizard-field-config";
import type { OnboardingIntent } from "@/lib/onboarding/routing";
import type { SetupPrefill } from "@/lib/onboarding/prefill";

export type BusinessSetupMode =
  | "initial-business"
  | "agency-client"
  | "add-business";

const copyByMode = {
  "initial-business": {
    title: "Core business facts",
    description:
      "These approved facts become the source of truth for every connected publisher.",
    nameLabel: "Business name *",
    namePlaceholder: "e.g. LocalMap or Smith Heating & Cooling",
    submitIdle: "Save Master Profile",
    submitWithWorkspace: "Save Master Profile",
  },
  "agency-client": {
    title: "Client’s core business facts",
    description:
      "Create one approved Master Profile under your agency workspace.",
    nameLabel: "Client business name *",
    namePlaceholder: "e.g. Smith Heating & Cooling",
    submitIdle: "Save client profile",
    submitWithWorkspace: "Save client profile",
  },
  "add-business": {
    title: "Core business facts",
    description:
      "Create one source of truth before connecting a publisher account.",
    nameLabel: "Business name *",
    namePlaceholder: "e.g. LocalMap or Smith Heating & Cooling",
    submitIdle: "Save Master Profile",
    submitWithWorkspace: "Save Master Profile",
  },
} as const;

export function BusinessSetupWizard({
  categories,
  hasWorkspace,
  mode = "initial-business",
  agencyName,
  prefill = null,
  onboardingIntent = "organic",
}: {
  categories: BusinessCategoryOption[];
  hasWorkspace: boolean;
  mode?: BusinessSetupMode;
  agencyName?: string;
  prefill?: SetupPrefill | null;
  onboardingIntent?: OnboardingIntent;
}) {
  const { setActive } = useClerk();
  const [categorySlug, setCategorySlug] = useState(
    // Audit prefill carries a detected industry — preselect it when valid.
    (prefill?.categorySlug &&
      categories.find((category) => category.slug === prefill.categorySlug)
        ?.slug) ||
      (categories.find((category) => category.slug === "internet-saas")?.slug ??
        categories[0]?.slug ??
        "internet-saas"),
  );
  const [isPending, startTransition] = useTransition();
  const copy = copyByMode[mode];
  const modelGuide = prefill?.operatingModel
    ? onboardingGuideForModel(
        prefill.operatingModel,
        prefill.auditTier ?? "full_local",
      )
    : null;
  const fieldConfig = getWizardFieldConfig(prefill?.operatingModel);
  const description = modelGuide?.description ?? copy.description;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const setup = await quickSetupBusinessAction({
          businessName: String(formData.get("businessName") ?? ""),
          categorySlug,
          phone: String(formData.get("phone") ?? "") || undefined,
          city: String(formData.get("city") ?? "") || undefined,
          state: String(formData.get("state") ?? "") || undefined,
          website: String(formData.get("website") ?? "") || undefined,
          serviceAreaCities:
            String(formData.get("serviceAreaCities") ?? "") || undefined,
          onboardingIntent,
          workspaceType: mode === "agency-client" ? "agency" : "business",
          auditId: prefill?.auditId,
          scanId: prefill?.scanId,
        });

        if (setup.createdOrganization) {
          await setActive({ organization: setup.organizationId });
        }

        const doneParams = new URLSearchParams({
          done: "1",
          location: setup.locationId,
          publishers: String(setup.publishersTracked),
          accountType: mode === "agency-client" ? "agency" : "business",
        });
        if (setup.claimedAuditId) {
          doneParams.set("audit", setup.claimedAuditId);
        }
        if (setup.claimedScanId) {
          doneParams.set("scan", setup.claimedScanId);
        }
        if (setup.organizationId) {
          doneParams.set("org", setup.organizationId);
        }
        window.location.assign(
          `/dashboard/onboarding?${doneParams.toString()}`,
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Setup failed — try again",
        );
      }
    });
  }

  return (
    <Card className="localmap-card-glow">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>
          {agencyName && mode === "agency-client"
            ? `${description} Workspace: ${agencyName}.`
            : description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">{copy.nameLabel}</Label>
            <Input
              id="businessName"
              name="businessName"
              placeholder={copy.namePlaceholder}
              defaultValue={prefill?.businessName ?? undefined}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>What kind of business? *</Label>
            <BusinessCategorySelect
              categories={categories}
              value={categorySlug}
              onValueChange={setCategorySlug}
            />
          </div>

          {fieldConfig.showCityState ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">{fieldConfig.cityLabel}</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Austin"
                  defaultValue={prefill?.city ?? undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{fieldConfig.stateLabel}</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="TX"
                  defaultValue={prefill?.state ?? undefined}
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 010-0000"
                defaultValue={prefill?.phone ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">
                {fieldConfig.websiteLabel}
              </Label>
              <Input
                id="website"
                name="website"
                placeholder={fieldConfig.websitePlaceholder}
                defaultValue={prefill?.url ?? undefined}
                required={fieldConfig.websiteRequired}
              />
            </div>
          </div>

          {prefill?.operatingModel ? (
            <ModelSetupFields
              operatingModel={prefill.operatingModel}
              defaultServiceAreaCities={prefill.serviceAreaCities}
            />
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Saving Master Profile…"
              : hasWorkspace
                ? copy.submitWithWorkspace
                : copy.submitIdle}
            {!isPending && <ArrowRightIcon className="size-4" />}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {fieldConfig.footerHint}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
