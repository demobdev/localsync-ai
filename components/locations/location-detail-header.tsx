import Link from "next/link";
import { ArrowLeftIcon, GlobeIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function LocationDetailHeader({
  locationId,
  name,
  city,
  state,
  visibilityScore,
}: {
  locationId: string;
  name: string;
  city?: string;
  state?: string;
  visibilityScore?: number;
}) {
  const locationLine = [city, state].filter(Boolean).join(", ");
  const scoreTone =
    visibilityScore === undefined
      ? ""
      : visibilityScore >= 75
        ? "text-primary"
        : visibilityScore >= 50
          ? "text-chart-2"
          : "text-destructive";

  return (
    <div className="mb-4 space-y-3">
      <Link
        href="/dashboard/locations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All locations
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
          {locationLine ? (
            <p className="mt-1 text-sm text-muted-foreground">{locationLine}</p>
          ) : null}
        </div>
        {visibilityScore !== undefined ? (
          <Link
            href={`/dashboard/locations/${locationId}/visibility`}
            className="localmap-card-glow flex items-center gap-2 rounded-xl border bg-card px-3 py-2 transition-colors hover:border-primary/40"
          >
            <GlobeIcon className={cn("size-4", scoreTone)} />
            <div className="text-right">
              <p className={cn("text-lg font-bold tabular-nums leading-none", scoreTone)}>
                {visibilityScore}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Visibility
              </p>
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
