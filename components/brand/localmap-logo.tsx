import { cn } from "@/lib/utils";

export function LocalMapLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5 text-white"
          aria-hidden
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
            fill="currentColor"
            opacity="0.9"
          />
          <circle cx="12" cy="9" r="2.5" fill="white" />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-tight text-foreground">
            LocalMap
          </p>
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Local Intelligence
          </p>
        </div>
      )}
    </div>
  );
}
