import Link from "next/link";
import { SparklesIcon, ZapIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Reusable "do this the easy way" upsell banner.
 * Pattern: everything works manually on the base plan; this banner shows
 * the automated/premium path without blocking the manual one.
 */
export function UpgradeBanner({
  title,
  description,
  ctaLabel = "View packages",
  href = "/dashboard/billing",
  badge,
  className,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  href?: string;
  badge?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "localmap-card-glow relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-accent/10 px-4 py-3.5 sm:px-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ZapIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{title}</p>
              {badge ? (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <SparklesIcon className="size-3" />
                  {badge}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          nativeButton={false}
          render={<Link href={href} />}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
