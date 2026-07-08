import Link from "next/link";
import { CheckCircle2Icon, ExternalLinkIcon } from "lucide-react";

import {
  GOOGLE_BUSINESS_CREATE_URL,
  LOCALSYNC_PREMIUM_SETUP_URL,
} from "@/lib/grader/gbp-links";
import { onboardingGuideForModel } from "@/lib/onboarding/operating-model-paths";
import type { SetupPrefill } from "@/lib/onboarding/prefill";
import { cn } from "@/lib/utils";

export function OperatingModelGuide({
  prefill,
  className,
}: {
  prefill: SetupPrefill;
  className?: string;
}) {
  if (!prefill.operatingModel) return null;

  const guide = onboardingGuideForModel(
    prefill.operatingModel,
    prefill.auditTier ?? "full_local",
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/15 bg-primary/5 p-5",
        className,
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
        {guide.badge}
      </p>
      <h2 className="mt-1 text-lg font-bold tracking-tight">{guide.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{guide.description}</p>

      <ul className="mt-4 space-y-2">
        {guide.steps.map((step) => (
          <li
            key={step}
            className="flex items-start gap-2 text-sm text-foreground/90"
          >
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            {step}
          </li>
        ))}
      </ul>

      {guide.noGbpNote && !prefill.gbpLinked ? (
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <p>{guide.noGbpNote}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a
              href={GOOGLE_BUSINESS_CREATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Create on Google
              <ExternalLinkIcon className="size-3" />
            </a>
            <Link
              href={LOCALSYNC_PREMIUM_SETUP_URL}
              className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Done-for-you setup (Premium)
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
