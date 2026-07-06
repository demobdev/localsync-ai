"use client";

import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ActionLoadingOverlay({
  active,
  label = "Working…",
  className,
}: {
  active: boolean;
  label?: string;
  className?: string;
}) {
  if (!active) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/80 backdrop-blur-sm",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2Icon className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <Loader2Icon
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      aria-hidden
    />
  );
}
