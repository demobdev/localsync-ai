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
import { onboardingGuideForModel } from "@/lib/onboarding/operating-model-paths";
import type { SetupPrefill } from "@/lib/onboarding/prefill";

export type BusinessSetupMode =
  | "initial-business"
  | "agency-client"
  | "add-business";

const copyByMode = {
  "initial-business": {
    title: "Tell us about your business",
    description:
      "One form — we'll set up your workspace, master profile, and directory tracking automatically.",
    nameLabel: "Business name *",
    namePlaceholder: "e.g. LocalSync or Smith Heating & Cooling",
    submitIdle: "Create my workspace",
    submitWithWorkspace: "Add this business",
  },
  "agency-client": {
    title: "Your first client business",
    description:
      "We create a client record and master profile under your agency workspace.",
    nameLabel: "Client business name *",
    namePlaceholder: "e.g. Smith Heating & Cooling",
    submitIdle: "Add first client",
    submitWithWorkspace: "Add this client",
  },
  "add-business": {
    title: "Tell us about your business",
    description:
      "Each business gets its own client record, profile, and directory tracking.",
    nameLabel: "Business name *",
    namePlaceholder: "e.g. LocalSync or Smith Heating & Cooling",
    submitIdle: "Add this business",
    submitWithWorkspace: "Add this business",
  },
} as const;

export function BusinessSetupWizard({
  categories,
  hasWorkspace,
  mode = "initial-business",
  agencyName,
  prefill = null,
}: {
  categories: BusinessCategoryOption[];
  hasWorkspace: boolean;
  mode?: BusinessSetupMode;
  agencyName?: string;
  prefill?: SetupPrefill | null;
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="Austin"
                defaultValue={prefill?.city ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                placeholder="TX"
                defaultValue={prefill?.state ?? undefined}
              />
            </div>
          </div>

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
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                placeholder="https://…"
                defaultValue={prefill?.url ?? undefined}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Setting everything up…"
              : hasWorkspace
                ? copy.submitWithWorkspace
                : copy.submitIdle}
            {!isPending && <ArrowRightIcon className="size-4" />}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            City, phone, and website are optional — you can finish your profile
            after setup.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
