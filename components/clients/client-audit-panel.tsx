"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  FileBarChart2Icon,
  LoaderIcon,
  MapPinIcon,
  RadarIcon,
} from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { startGraderAuditFromLocationAction } from "@/app/actions/grader";
import { GraderScoreDelta } from "@/components/grader/grader-score-delta";
import { Button } from "@/components/ui/button";
import type { LocationAuditSummary } from "@/lib/grader/client-audit-summaries";

function LocationAuditRow({ location }: { location: LocationAuditSummary }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRunAudit() {
    startTransition(async () => {
      try {
        const { auditId } = await startGraderAuditFromLocationAction({
          locationId: location.locationId,
        });
        router.push(`/grader/${auditId}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not start audit",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-1.5 font-medium">
          <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{location.locationName}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {location.city ?? "No city on profile"}
          {location.totalScore != null ? (
            <>
              {" "}
              ·{" "}
              <span className="font-medium text-foreground tabular-nums">
                {location.totalScore}/100
              </span>
              {location.grade ? ` · Grade ${location.grade}` : null}
            </>
          ) : (
            " · No visibility audit yet"
          )}
        </p>
        {location.scoreDelta != null ? (
          <GraderScoreDelta delta={location.scoreDelta} />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {location.auditId ? (
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/grader/${location.auditId}`} />}
          >
            <FileBarChart2Icon className="size-4" />
            View report
          </Button>
        ) : null}
        <Button
          size="sm"
          variant={location.auditId ? "outline" : "default"}
          disabled={!location.canRunAudit || isPending}
          onClick={handleRunAudit}
        >
          {isPending ? (
            <>
              <LoaderIcon className="size-4 animate-spin" />
              Starting…
            </>
          ) : (
            <>
              <RadarIcon className="size-4" />
              {location.auditId ? "Re-run audit" : "Run audit"}
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          nativeButton={false}
          render={
            <Link href={`/dashboard/locations/${location.locationId}`} />
          }
        >
          Open
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function ClientAuditPanel({
  locations,
}: {
  locations: LocationAuditSummary[];
}) {
  if (locations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No locations yet — add one from onboarding or the locations page.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {locations.map((location) => (
        <LocationAuditRow key={location.locationId} location={location} />
      ))}
    </div>
  );
}
