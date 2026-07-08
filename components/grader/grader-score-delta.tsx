import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function GraderScoreDelta({
  delta,
  className,
  size = "sm",
}: {
  delta: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const improved = delta > 0;
  const flat = delta === 0;
  const Icon = improved ? TrendingUpIcon : TrendingDownIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium tabular-nums",
        size === "md" ? "text-sm" : "text-xs",
        flat
          ? "border-muted-foreground/25 bg-muted/50 text-muted-foreground"
          : improved
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
            : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
        className,
      )}
    >
      {!flat ? <Icon className={size === "md" ? "size-4" : "size-3.5"} /> : null}
      {flat ? "No change" : `${delta > 0 ? "+" : ""}${delta} pts`}
    </span>
  );
}
