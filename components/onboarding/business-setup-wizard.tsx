"use client";

import { useClerk } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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

export function BusinessSetupWizard({
  categories,
  hasWorkspace,
}: {
  categories: BusinessCategoryOption[];
  hasWorkspace: boolean;
}) {
  const router = useRouter();
  const { setActive } = useClerk();
  const [categorySlug, setCategorySlug] = useState(
    categories.find((category) => category.slug === "internet-saas")?.slug ??
      categories[0]?.slug ??
      "internet-saas",
  );
  const [isPending, startTransition] = useTransition();

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
        });

        if (setup.createdOrganization) {
          // Activating the new workspace remounts the layout, so success
          // state must live in the URL — not in component memory.
          await setActive({ organization: setup.organizationId });
        }

        router.replace(
          `/dashboard/onboarding?done=1&location=${setup.locationId}&publishers=${setup.publishersTracked}`,
        );
        router.refresh();
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
        <CardTitle>Tell us about your business</CardTitle>
        <CardDescription>
          One form — we&apos;ll set up your workspace, master profile, and
          directory tracking automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name *</Label>
            <Input
              id="businessName"
              name="businessName"
              placeholder="e.g. LocalSync or Smith Heating & Cooling"
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
              <Input id="city" name="city" placeholder="Austin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="TX" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="(555) 010-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" placeholder="https://…" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Setting everything up…"
              : hasWorkspace
                ? "Add this business"
                : "Create my workspace"}
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
