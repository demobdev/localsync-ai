"use client";

import { useClerk } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { createAgencyWorkspaceAction } from "@/app/actions/onboarding";
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

export function AgencySetupWizard({
  onComplete,
}: {
  onComplete: (agencyName: string) => void;
}) {
  const router = useRouter();
  const { setActive } = useClerk();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const agencyName = String(formData.get("agencyName") ?? "");
        const workspace = await createAgencyWorkspaceAction({ agencyName });

        await setActive({ organization: workspace.organizationId });
        router.refresh();
        onComplete(workspace.organizationName);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create agency workspace",
        );
      }
    });
  }

  return (
    <Card className="localmap-card-glow">
      <CardHeader>
        <CardTitle>Name your agency workspace</CardTitle>
        <CardDescription>
          This is your team workspace — not your client&apos;s business name.
          You&apos;ll add clients on the next step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agencyName">Agency name *</Label>
            <Input
              id="agencyName"
              name="agencyName"
              placeholder="e.g. Summit Local Marketing"
              required
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating workspace…" : "Create agency workspace"}
            {!isPending && <ArrowRightIcon className="size-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
