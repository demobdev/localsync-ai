"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type OnboardingStepId = "choose" | "agency-name" | "business";

const STEP_LABELS: Record<OnboardingStepId, string> = {
  choose: "Account type",
  "agency-name": "Agency",
  business: "Business",
};

type OnboardingProgressProps = {
  currentStep: OnboardingStepId;
  /** Agency path has 3 steps; business-only path has 2. */
  isAgencyPath: boolean;
  className?: string;
};

function resolveSteps(isAgencyPath: boolean): OnboardingStepId[] {
  return isAgencyPath
    ? ["choose", "agency-name", "business"]
    : ["choose", "business"];
}

export function OnboardingProgress({
  currentStep,
  isAgencyPath,
  className,
}: OnboardingProgressProps) {
  const steps = resolveSteps(isAgencyPath);
  const currentIndex = Math.max(0, steps.indexOf(currentStep));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step} className="flex flex-1 items-center gap-2">
              <div className="relative flex size-7 shrink-0 items-center justify-center">
                {isCurrent ? (
                  <motion.span
                    layoutId="onboarding-step-ring"
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary"
                    initial={false}
                    animate={{ width: isComplete ? "100%" : "0%" }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Step {currentIndex + 1} of {steps.length} ·{" "}
        <span className="font-medium text-foreground">
          {STEP_LABELS[currentStep]}
        </span>
      </p>
    </div>
  );
}
