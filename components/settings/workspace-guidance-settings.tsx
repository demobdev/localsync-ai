"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  CompassIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const tourSteps = [
  {
    title: "Start with the workspace",
    description:
      "Use the workspace switcher for teams and the business switcher for locations. Your role and client access follow the workspace you open.",
    icon: LayoutDashboardIcon,
    destination: "/dashboard",
    destinationLabel: "Open overview",
  },
  {
    title: "Keep one Master Profile",
    description:
      "NAP, hours, services, attributes, photos, links, and approved FAQs live on the location. This is the source of truth for every channel.",
    icon: MapPinIcon,
    destination: "/dashboard/locations",
    destinationLabel: "View locations",
  },
  {
    title: "Work the fix queue",
    description:
      "LocalMap turns audits, missing profile fields, and listing differences into a prioritized queue so the team knows what to do next.",
    icon: ClipboardCheckIcon,
    destination: "/dashboard/tasks",
    destinationLabel: "Open fix queue",
  },
  {
    title: "Invite teammates, not clients",
    description:
      "Team members receive workspace-wide access today. Keep client access scoped until location-level permissions are available.",
    icon: UsersIcon,
    destination: "/dashboard/team",
    destinationLabel: "View team",
  },
] as const;

type LocationOption = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
};

function ProductTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = tourSteps[stepIndex]!;
  const StepIcon = step.icon;
  const isLast = stepIndex === tourSteps.length - 1;

  function openTour() {
    setStepIndex(0);
    setOpen(true);
  }

  function completeTour() {
    window.localStorage.setItem("localmap-product-tour-complete", "true");
    setOpen(false);
  }

  return (
    <>
      <Button onClick={openTour}>
        <CompassIcon className="size-4" />
        Replay product tour
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <div className="bg-primary/8 px-6 pb-5 pt-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
              <StepIcon className="size-5" />
            </div>
            <DialogHeader className="mt-5">
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
              <DialogDescription className="text-sm leading-6">
                {step.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5" aria-label={`Step ${stepIndex + 1} of ${tourSteps.length}`}>
                {tourSteps.map((tourStep, index) => (
                  <span
                    key={tourStep.title}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === stepIndex
                        ? "w-7 bg-primary"
                        : index < stepIndex
                          ? "w-3 bg-primary/45"
                          : "w-3 bg-muted-foreground/20",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {stepIndex + 1} of {tourSteps.length}
              </span>
            </div>

            <Link
              href={step.destination}
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {step.destinationLabel}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none px-6">
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={() =>
                isLast
                  ? completeTour()
                  : setStepIndex((value) => Math.min(tourSteps.length - 1, value + 1))
              }
            >
              {isLast ? "Finish tour" : "Next"}
              {isLast ? (
                <CheckCircle2Icon className="size-4" />
              ) : (
                <ArrowRightIcon className="size-4" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WorkspaceGuidanceSettings({
  isAdmin,
  locations,
}: {
  isAdmin: boolean;
  locations: LocationOption[];
}) {
  return (
    <div className="space-y-7 pb-10">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <SettingsIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Workspace settings
          </h1>
          <p className="text-muted-foreground">
            Revisit guidance without restarting business onboarding.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="localmap-card-glow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Product tour</CardTitle>
                <CardDescription className="mt-1 max-w-xl leading-6">
                  A quick teammate-friendly walkthrough of workspaces, Master
                  Profiles, the fix queue, and team access.
                </CardDescription>
              </div>
              <Badge variant="secondary">4 steps</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {tourSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
            <ProductTour />
          </CardContent>
        </Card>

        <Card className="localmap-card-glow">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheckIcon className="size-4" />
              </span>
              <div>
                <CardTitle>Guided setup</CardTitle>
                <CardDescription className="mt-1 leading-6">
                  Continue a location’s Smart Setup checklist. This never
                  creates another workspace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isAdmin ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4">
                <p className="text-sm font-medium">Owner setup is protected</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Your teammate account uses the existing workspace. An admin
                  can change business setup; you can still use the product tour.
                </p>
              </div>
            ) : locations.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/25 p-5 text-center">
                <p className="text-sm font-medium">No locations yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the first business to start its Smart Setup checklist.
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/dashboard/onboarding?add=1" />}
                >
                  Add first business
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((location) => {
                  const place = [location.city, location.state]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <Link
                      key={location.id}
                      href={`/dashboard/locations/${location.id}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {location.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {place || "Open Smart Setup checklist"}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        Continue
                        <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
