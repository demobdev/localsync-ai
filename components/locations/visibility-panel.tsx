"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  generateVisibilityPageAction,
  publishVisibilityPageAction,
  runVisibilityCrawlerCheckAction,
} from "@/app/actions/visibility";
import { ActionLoadingOverlay } from "@/components/ui/action-loading-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SCORE_LABELS } from "@/lib/scores/labels";
import type { VisibilityScoreBreakdown } from "@/lib/visibility/score";

type VisibilityData = {
  locationId: string;
  locationName: string;
  score: VisibilityScoreBreakdown;
  page: {
    id: string;
    status: "draft" | "published" | "archived";
    publishedAt: Date | null;
    updatedAt: Date;
  } | null;
  schema: {
    schemaType: string;
    jsonLd: Record<string, unknown>;
  } | null;
  crawlerChecks: Array<{
    id: string;
    status: "queued" | "running" | "passed" | "failed";
    targetUrl: string;
    results: Record<string, unknown> | null;
    checkedAt: Date | null;
  }>;
  publicPageUrl: string;
  llmsTxt: string;
  schemaOrgType: string;
};

function ScoreRing({ score }: { score: number }) {
  const tone =
    score >= 75 ? "text-primary" : score >= 50 ? "text-chart-2" : "text-destructive";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-6 localmap-card-glow">
      <p className={`text-5xl font-bold tabular-nums ${tone}`}>{score}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {SCORE_LABELS.workspaceHealth} / 100
      </p>
    </div>
  );
}

export function VisibilityPanel({ data }: { data: VisibilityData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  return (
    <div className="relative space-y-6">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <ScoreRing score={data.score.total} />
        <Card className="localmap-card-glow">
          <CardHeader>
            <CardTitle>{SCORE_LABELS.workspaceHealth} breakdown</CardTitle>
            <CardDescription>
              {SCORE_LABELS.profileCompleteness} (50 pts) +{" "}
              {SCORE_LABELS.listingConsistency.toLowerCase()} (50 pts).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium">
                {SCORE_LABELS.profileCompleteness} · {data.score.profileScore}/50
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {data.score.profileChecks.map((check) => (
                  <li key={check.label} className="flex items-center gap-2">
                    <span>{check.passed ? "✓" : "○"}</span>
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium">
                {SCORE_LABELS.listingConsistency} · {data.score.auditScore}/50
              </p>
              {data.score.auditSummary ? (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>{data.score.auditSummary.runs} completed run(s)</li>
                  <li>{data.score.auditSummary.critical} critical findings</li>
                  <li>{data.score.auditSummary.warning} warnings</li>
                  <li>{data.score.auditSummary.info} info items</li>
                </ul>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Run a listing audit to unlock the listing half of workspace
                    health.
                  </p>
                  <Button variant="outline" size="sm" nativeButton={false} render={
                    <Link href={`/dashboard/locations/${data.locationId}/listings`} />
                  }>
                    Run listing audit
                  </Button>
                </div>
              )}
              {data.score.auditSummary && data.score.auditScore < 50 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  nativeButton={false}
                  render={
                    <Link href={`/dashboard/locations/${data.locationId}/listings`} />
                  }
                >
                  {data.score.auditScore === 0
                    ? "Re-run listing audit"
                    : "Fix findings & re-audit"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="localmap-card-glow">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>AI visibility page</CardTitle>
            <CardDescription>
              Vertical schema.org ({data.schemaOrgType}), hosted page, and llms.txt for AI crawlers.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={() =>
                run(
                  () => generateVisibilityPageAction(data.locationId),
                  "Visibility page generated",
                )
              }
            >
              {data.page ? "Regenerate" : "Generate page"}
            </Button>
            <Button
              variant="outline"
              disabled={isPending || !data.page}
              onClick={() =>
                run(
                  () => publishVisibilityPageAction(data.locationId),
                  "Page published",
                )
              }
            >
              Publish
            </Button>
            <Button
              variant="outline"
              disabled={isPending || data.page?.status !== "published"}
              onClick={() =>
                run(
                  () => runVisibilityCrawlerCheckAction(data.locationId),
                  "Crawler check complete",
                )
              }
            >
              Run crawler check
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={data.page?.status === "published" ? "default" : "secondary"}>
              {data.page?.status ?? "not generated"}
            </Badge>
            {data.page?.status === "published" ? (
              <Link
                href={data.publicPageUrl}
                target="_blank"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {data.publicPageUrl}
              </Link>
            ) : null}
          </div>

          {data.schema ? (
            <div>
              <p className="mb-2 text-sm font-medium">Latest JSON-LD ({data.schema.schemaType})</p>
              <ScrollArea className="h-48 rounded-xl border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(data.schema.jsonLd, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="localmap-card-glow">
        <CardHeader>
          <CardTitle>llms.txt preview</CardTitle>
          <CardDescription>
            Published at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /l/{data.locationId}/llms.txt
            </code>{" "}
            when the page is published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-56 rounded-xl border bg-muted/30 p-3">
            <pre className="text-xs whitespace-pre-wrap">{data.llmsTxt}</pre>
          </ScrollArea>
        </CardContent>
      </Card>

      {data.crawlerChecks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Crawler checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.crawlerChecks.map((check) => (
              <div key={check.id} className="rounded-xl border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{check.targetUrl}</p>
                  <Badge variant={check.status === "passed" ? "default" : "secondary"}>
                    {check.status}
                  </Badge>
                </div>
                {Array.isArray((check.results as { notes?: string[] })?.notes) ? (
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {((check.results as { notes: string[] }).notes).map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <ActionLoadingOverlay
        active={isPending}
        label="Updating visibility page…"
        className="rounded-2xl"
      />
    </div>
  );
}
