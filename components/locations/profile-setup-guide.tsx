"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  SparklesIcon,
} from "lucide-react";

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
  PHASE_LABELS,
  type SetupPhase,
  type SetupProgress,
  type SetupStep,
} from "@/lib/profile/setup-workflow";
import { cn } from "@/lib/utils";

function StepRow({
  step,
  onProfileTab,
}: {
  step: SetupStep;
  onProfileTab?: (tab: NonNullable<SetupStep["profileTab"]>) => void;
}) {
  const isProfileTab = Boolean(step.profileTab && onProfileTab);

  const content = (
    <>
      {step.done ? (
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      ) : (
        <CircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              step.done && "text-muted-foreground line-through decoration-muted-foreground/40",
            )}
          >
            {step.title}
          </p>
          {step.optional ? (
            <Badge variant="outline" className="text-[10px]">
              Optional
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>
      {!step.done ? (
        <span className="shrink-0 text-xs font-medium text-primary">Go →</span>
      ) : null}
    </>
  );

  if (isProfileTab && step.profileTab && onProfileTab) {
    return (
      <button
        type="button"
        onClick={() => onProfileTab(step.profileTab!)}
        className="flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={step.href}
      className="flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:bg-muted/50"
    >
      {content}
    </Link>
  );
}

export function ProfileSetupGuide({
  progress,
  defaultExpanded = true,
  onProfileTab,
  compact = false,
}: {
  progress: SetupProgress;
  defaultExpanded?: boolean;
  onProfileTab?: (tab: NonNullable<SetupStep["profileTab"]>) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const phases: SetupPhase[] = ["audit", "profile", "connect", "visibility"];

  if (compact && progress.percent >= 100) {
    return null;
  }

  return (
    <Card className="localmap-card-glow border-primary/20">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              <CardTitle className="text-base">Setup guide</CardTitle>
            </div>
            <CardDescription>
              {progress.completedCount}/{progress.totalCount} required steps ·{" "}
              {progress.percent}% complete
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "Collapse setup guide" : "Expand setup guide"}
          >
            <ChevronDownIcon
              className={cn("size-4 transition-transform", expanded && "rotate-180")}
            />
          </Button>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        {progress.nextStep && !expanded ? (
          <Button
            size="sm"
            className="w-full sm:w-auto"
            nativeButton={false}
            render={<Link href={progress.nextStep.href} />}
          >
            Next: {progress.nextStep.title}
          </Button>
        ) : null}
      </CardHeader>

      {expanded ? (
        <CardContent className="space-y-5 pt-0">
          {phases.map((phase) => {
            const steps = progress.steps.filter((step) => step.phase === phase);
            const phaseDone = steps.filter((s) => !s.optional).every((s) => s.done);

            return (
              <div key={phase}>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {PHASE_LABELS[phase]}
                  </p>
                  {phaseDone ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Done
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {steps.map((step) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      onProfileTab={phase === "profile" ? onProfileTab : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push("/dashboard/connect")}
          >
            View all connections
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function SetupGuideCompact({
  progress,
  locationId,
}: {
  progress: SetupProgress;
  locationId: string;
}) {
  if (!progress.nextStep) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <CheckCircle2Icon className="size-4 text-primary" />
        <span>Profile setup complete — keep auditing and publishing for max visibility.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between localmap-card-glow">
      <div>
        <p className="text-sm font-medium">Continue setup</p>
        <p className="text-sm text-muted-foreground">
          {progress.percent}% done · Next: {progress.nextStep.title}
        </p>
      </div>
      <Button
        size="sm"
        nativeButton={false}
        render={
          <Link
            href={
              progress.nextStep.profileTab
                ? `/dashboard/locations/${locationId}?tab=${progress.nextStep.profileTab}`
                : progress.nextStep.href
            }
          />
        }
      >
        Continue
      </Button>
    </div>
  );
}
