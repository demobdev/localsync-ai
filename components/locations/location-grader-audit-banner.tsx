"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  FileBarChart2Icon,
  LoaderIcon,
  RadarIcon,
} from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { startGraderAuditFromLocationAction } from "@/app/actions/grader";
import { GraderScoreDelta } from "@/components/grader/grader-score-delta";
import { Button } from "@/components/ui/button";
import type { LinkedGraderAudit } from "@/lib/grader/location-audit-bridge";

export function LocationGraderAuditBanner({
  locationId,
  audit,
}: {
  locationId: string;
  audit: LinkedGraderAudit;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRegrade() {
    startTransition(async () => {
      try {
        const { auditId } = await startGraderAuditFromLocationAction({
          locationId,
        });
        router.push(`/grader/${auditId}`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not start a new audit",
        );
      }
    });
  }

  return (
    <div className="localmap-card-glow mb-4 flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
          <RadarIcon className="size-3.5" />
          Visibility audit linked
        </p>
        <p className="text-sm text-foreground">
          <span className="font-semibold tabular-nums">{audit.totalScore}/100</span>
          {audit.grade ? (
            <span className="text-muted-foreground"> · Grade {audit.grade}</span>
          ) : null}
          {audit.scoreDelta != null ? (
            <span className="ml-2 inline-flex align-middle">
              <GraderScoreDelta delta={audit.scoreDelta} />
            </span>
          ) : null}
          <span className="text-muted-foreground">
            {" "}
            · {audit.failedChecks} leak{audit.failedChecks === 1 ? "" : "s"} to fix
          </span>
        </p>
        {audit.priorTotalScore != null ? (
          <p className="text-xs text-muted-foreground">
            Previous audit: {audit.priorTotalScore}/100
            {audit.failedChecksDelta != null && audit.failedChecksDelta > 0
              ? ` · ${audit.failedChecksDelta} fewer leak${audit.failedChecksDelta === 1 ? "" : "s"}`
              : null}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/grader/${audit.id}`} />}
        >
          <FileBarChart2Icon className="size-4" />
          View report
          <ArrowRightIcon className="size-4" />
        </Button>
        <Button size="sm" disabled={isPending} onClick={handleRegrade}>
          {isPending ? (
            <>
              <LoaderIcon className="size-4 animate-spin" />
              Starting…
            </>
          ) : (
            "Re-run audit"
          )}
        </Button>
      </div>
    </div>
  );
}
