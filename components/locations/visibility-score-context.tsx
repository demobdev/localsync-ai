"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SCORE_DESCRIPTIONS,
  SCORE_LABELS,
} from "@/lib/scores/labels";
import type { VisibilityScoreBreakdown } from "@/lib/visibility/score";
import type { ReviewScoreBreakdown } from "@/lib/reviews/score";
import { cn } from "@/lib/utils";

type LinkedGraderAudit = {
  auditId: string;
  score: number | null;
};

function ScoreRow({
  label,
  value,
  max,
  hint,
  href,
}: {
  label: string;
  value: number | null;
  max?: number;
  hint?: string;
  href?: string;
}) {
  const display =
    value === null
      ? "—"
      : max !== undefined
        ? `${value}/${max}`
        : String(value);

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/60 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? (
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold tabular-nums">{display}</span>
        {href ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            nativeButton={false}
            render={<Link href={href} aria-label={`Open ${label}`} />}
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function VisibilityScoreContext({
  breakdown,
  reviewSummary,
  linkedGraderAudit,
  locationId,
}: {
  breakdown: VisibilityScoreBreakdown;
  reviewSummary: ReviewScoreBreakdown;
  linkedGraderAudit: LinkedGraderAudit | null;
  locationId: string;
}) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
          How these scores differ
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          {SCORE_LABELS.workspaceHealth} is what you improve inside LocalSync.
          {linkedGraderAudit?.score != null
            ? ` Your linked ${SCORE_LABELS.marketAuditShort.toLowerCase()} is a separate market snapshot.`
            : ` Link a grader report to compare with a ${SCORE_LABELS.marketAuditShort.toLowerCase()}.`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 px-3">
          <ScoreRow
            label={SCORE_LABELS.workspaceHealth}
            value={breakdown.total}
            max={100}
            hint="Profile + listing consistency in this workspace"
          />
          <ScoreRow
            label={SCORE_LABELS.profileCompleteness}
            value={breakdown.profileScore}
            max={50}
            hint={SCORE_DESCRIPTIONS.profileCompleteness}
            href={`/dashboard/locations/${locationId}/profile`}
          />
          <ScoreRow
            label={SCORE_LABELS.listingConsistency}
            value={breakdown.auditScore}
            max={50}
            hint={SCORE_DESCRIPTIONS.listingConsistency}
          />
          <ScoreRow
            label={SCORE_LABELS.reputation}
            value={reviewSummary.totalCount > 0 ? reviewSummary.score : null}
            max={100}
            hint={
              reviewSummary.totalCount > 0
                ? SCORE_DESCRIPTIONS.reputation
                : "No reviews synced yet"
            }
            href={`/dashboard/locations/${locationId}/reviews`}
          />
          {linkedGraderAudit ? (
            <ScoreRow
              label={SCORE_LABELS.marketAudit}
              value={linkedGraderAudit.score}
              max={100}
              hint={SCORE_DESCRIPTIONS.marketAudit}
              href={
                linkedGraderAudit.auditId
                  ? `/grader/${linkedGraderAudit.auditId}`
                  : undefined
              }
            />
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setGlossaryOpen((open) => !open)}
            className="flex w-full items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Score glossary
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                glossaryOpen && "rotate-180",
              )}
            />
          </button>
          {glossaryOpen ? (
            <dl className="mt-3 space-y-3 text-sm">
              {(
                [
                  ["marketAudit", SCORE_LABELS.marketAudit],
                  ["workspaceHealth", SCORE_LABELS.workspaceHealth],
                  ["profileCompleteness", SCORE_LABELS.profileCompleteness],
                  ["listingConsistency", SCORE_LABELS.listingConsistency],
                  ["reputation", SCORE_LABELS.reputation],
                ] as const
              ).map(([key, term]) => (
                <div key={key}>
                  <dt className="font-medium text-foreground">{term}</dt>
                  <dd className="text-muted-foreground mt-0.5">
                    {SCORE_DESCRIPTIONS[key]}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
