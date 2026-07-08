"use client";

import { useState, useTransition } from "react";
import { ArrowRightIcon, MapPinIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { linkGraderAuditToLocationAction } from "@/app/actions/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrgLocationOption } from "@/lib/grader/claim-context";
import type { OnboardingIntent } from "@/lib/onboarding/routing";

type LinkMode = "pick" | "create";

export function AuditLinkPicker({
  auditId,
  businessName,
  existingLocations,
  suggestedLocationId,
  organizationId,
  onboardingIntent = "fix",
  onCreateNew,
}: {
  auditId: string;
  businessName: string | null;
  existingLocations: OrgLocationOption[];
  suggestedLocationId: string | null;
  organizationId: string;
  onboardingIntent?: OnboardingIntent;
  onCreateNew: () => void;
}) {
  const [mode, setMode] = useState<LinkMode>(
    suggestedLocationId ? "pick" : "create",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    suggestedLocationId,
  );
  const [isPending, startTransition] = useTransition();

  function handleLink() {
    if (!selectedId) return;

    startTransition(async () => {
      try {
        const result = await linkGraderAuditToLocationAction({
          auditId,
          locationId: selectedId,
          onboardingIntent,
        });

        const doneParams = new URLSearchParams({
          done: "1",
          location: result.locationId,
          audit: result.claimedAuditId,
          org: organizationId,
        });
        window.location.assign(
          `/dashboard/onboarding?${doneParams.toString()}`,
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not link audit — try again",
        );
      }
    });
  }

  if (mode === "create") {
    return (
      <Card className="localmap-card-glow">
        <CardHeader>
          <CardTitle>Add this audit as a new business</CardTitle>
          <CardDescription>
            {businessName
              ? `Create a new location for ${businessName} and connect your audit fix queue.`
              : "Create a new location and connect your audit fix queue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={onCreateNew}>
            Continue with new business
            <ArrowRightIcon className="size-4" />
          </Button>
          {existingLocations.length > 0 ? (
            <Button variant="outline" onClick={() => setMode("pick")}>
              Link to existing instead
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="localmap-card-glow">
      <CardHeader>
        <CardTitle>Link audit to a workspace location</CardTitle>
        <CardDescription>
          {businessName
            ? `Connect your ${businessName} audit to an existing business, or add a new one.`
            : "Connect this audit to an existing business, or add a new one."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {existingLocations.map((location) => {
            const selected = selectedId === location.id;
            const isSuggested = location.id === suggestedLocationId;

            return (
              <li key={location.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(location.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "bg-background/60 hover:bg-muted/50",
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{location.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[location.city, location.state]
                          .filter(Boolean)
                          .join(", ") || "No city set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isSuggested ? (
                      <Badge variant="secondary">Best match</Badge>
                    ) : null}
                    {location.matchScore >= 70 ? (
                      <Badge variant="outline">{location.matchScore}% match</Badge>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!selectedId || isPending}
            onClick={handleLink}
          >
            {isPending ? "Linking audit…" : "Link audit to selected business"}
            {!isPending && <ArrowRightIcon className="size-4" />}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setMode("create");
              onCreateNew();
            }}
          >
            <PlusIcon className="size-4" />
            Add as new business
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
