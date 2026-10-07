"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  CircleGaugeIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  SearchIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import {
  startWebsiteAuditAction,
  syncSearchConsoleAction,
} from "@/app/actions/search-intelligence";
import { ActionLoadingOverlay } from "@/components/ui/action-loading-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PanelData = {
  locationId: string;
  website: string | null;
  latestRun: {
    id: string;
    status: "queued" | "running" | "completed" | "failed";
    score: number | null;
    pagesFound: number;
    issuesFound: number;
    errorMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
  } | null;
  latestComplete: {
    id: string;
    score: number | null;
    pagesFound: number;
    issuesFound: number;
    createdAt: Date;
    completedAt: Date | null;
  } | null;
  runs: Array<{
    id: string;
    status: "queued" | "running" | "completed" | "failed";
    score: number | null;
    createdAt: Date;
  }>;
  findings: Array<{
    id: string;
    type: string;
    severity: "critical" | "warning" | "info" | "passed";
    url: string;
    title: string;
    evidence: string | null;
    remediation: string | null;
  }>;
  connection: {
    propertyUrl: string;
    lastSyncedAt: Date | null;
  } | null;
  opportunities: Array<{
    type: "striking_distance" | "low_ctr" | "cannibalization";
    title: string;
    detail: string;
    impact: "high" | "medium";
    query: string;
    page?: string;
  }>;
  trend: Array<{ day: string; clicks: number; impressions: number }>;
};

function ScoreRing({ score }: { score: number | null }) {
  const value = score ?? 0;
  const tone =
    score == null
      ? "text-muted-foreground"
      : value >= 85
        ? "text-primary"
        : value >= 60
          ? "text-chart-2"
          : "text-destructive";
  return (
    <div className="flex min-w-[150px] flex-col items-center border-b px-5 py-5 lg:border-r lg:border-b-0">
      <p className="mb-3 self-start text-sm font-semibold">Website health</p>
      <div
        className="grid size-28 place-items-center rounded-full p-[9px]"
        style={{
          background: `conic-gradient(var(--primary) ${value * 3.6}deg, var(--muted) 0deg)`,
        }}
      >
        <div className="grid size-full place-items-center rounded-full bg-card">
          <div className="text-center">
            <p className={cn("text-4xl font-bold tabular-nums", tone)}>
              {score ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">/100</p>
          </div>
        </div>
      </div>
      <p className={cn("mt-3 text-sm font-medium", tone)}>
        {score == null
          ? "Not audited"
          : value >= 85
            ? "Healthy"
            : value >= 60
              ? "Needs attention"
              : "At risk"}
      </p>
    </div>
  );
}

function SearchTrend({ rows }: { rows: PanelData["trend"] }) {
  return (
    <div className="min-w-0 flex-1 px-5 py-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">Search Console performance</p>
        <span className="text-xs text-muted-foreground">28 days</span>
      </div>
      {rows.length ? (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <defs>
                <linearGradient id="clicks-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="var(--primary)"
                fill="url(#clicks-fill)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="var(--chart-3)"
                fill="transparent"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-center">
          <div>
            <SearchIcon className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No Search Console data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect the matching property to reveal demand and opportunities.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchIntelligencePanel({
  data,
}: {
  data: PanelData;
  locationName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "critical" | "opportunities">("all");
  const displayedFindings = data.findings.filter((finding) =>
    filter === "critical" ? finding.severity === "critical" : filter === "opportunities" ? false : true,
  );
  const showOpportunities = filter !== "critical";
  const critical = data.findings.filter((finding) => finding.severity === "critical");
  const warnings = data.findings.filter((finding) => finding.severity === "warning");
  const passed = data.findings.filter((finding) => finding.severity === "passed");
  const running = data.latestRun?.status === "queued" || data.latestRun?.status === "running";
  const score = data.latestComplete?.score ?? null;

  useEffect(() => {
    if (!running) return;

    const refreshTimer = window.setInterval(() => router.refresh(), 1_500);
    return () => window.clearInterval(refreshTimer);
  }, [router, running]);

  function runAudit() {
    startTransition(async () => {
      try {
        await startWebsiteAuditAction(data.locationId);
        toast.success("Website audit queued");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not start audit");
      }
    });
  }

  function syncSearchConsole() {
    startTransition(async () => {
      try {
        const result = await syncSearchConsoleAction(data.locationId);
        toast.success(`Synced ${result.rows.toLocaleString()} Search Console rows`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Search Console sync failed");
      }
    });
  }

  return (
    <div className="relative space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Search intelligence</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Website health, real search demand, and the fixes most likely to improve local discovery.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runAudit} disabled={isPending || running || !data.website}>
            <RefreshCwIcon className={cn("size-4", running && "animate-spin")} />
            {running ? "Audit running" : "Run website audit"}
          </Button>
          {data.connection ? (
            <Button variant="outline" onClick={syncSearchConsole} disabled={isPending}>
              <CheckCircle2Icon className="size-4 text-primary" />
              Sync Search Console
            </Button>
          ) : (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={`/api/connectors/google/search-console?locationId=${encodeURIComponent(data.locationId)}`} />
              }
            >
              <ExternalLinkIcon className="size-4" />
              Connect Search Console
            </Button>
          )}
        </div>
      </header>

      {!data.website ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <CircleGaugeIcon className="mx-auto size-7 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Add this location’s website first</h3>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
            Search Intelligence uses the approved master-profile website as its audit boundary.
          </p>
          <Button className="mt-4" variant="outline" nativeButton={false} render={
            <Link href={`/dashboard/locations/${data.locationId}?tab=nap`} />
          }>
            Open profile
          </Button>
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-xl border bg-card localmap-card-glow">
            <div className="grid lg:grid-cols-[170px_minmax(420px,1fr)_minmax(320px,0.9fr)]">
              <ScoreRing score={score} />
              <div className="grid grid-cols-2 border-b lg:border-r lg:border-b-0">
                {[
                  ["Crawled pages", data.latestComplete?.pagesFound ?? 0],
                  ["Critical issues", critical.length],
                  ["Search opportunities", data.opportunities.length],
                  [
                    "Last audit",
                    data.latestComplete?.completedAt
                      ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                          new Date(data.latestComplete.completedAt),
                        )
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border-r border-b p-5 even:border-r-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
              <SearchTrend rows={data.trend} />
            </div>
          </section>

          {data.latestRun?.status === "failed" ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircleIcon className="mt-0.5 size-5 text-destructive" />
              <div>
                <p className="text-sm font-medium">The latest audit failed</p>
                <p className="text-sm text-muted-foreground">{data.latestRun.errorMessage}</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold">Opportunity queue</h3>
                <div className="flex gap-1">
                  {(["all", "critical", "opportunities"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-medium capitalize",
                        filter === value
                          ? "border-primary bg-primary/8 text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y">
                {showOpportunities
                  ? data.opportunities.map((opportunity) => (
                      <div key={`${opportunity.type}-${opportunity.query}-${opportunity.page}`} className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_90px]">
                        <div className="flex gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-chart-2/12 text-chart-2">
                            <TrendingUpIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{opportunity.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{opportunity.detail}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {opportunity.type === "striking_distance"
                            ? "A focused page improvement could move this query into a higher-visibility range."
                            : opportunity.type === "low_ctr"
                              ? "The result is being seen but earns fewer clicks than expected."
                              : "Multiple pages are splitting relevance for the same query."}
                        </p>
                        <Badge variant={opportunity.impact === "high" ? "default" : "secondary"} className="self-start justify-self-start">
                          {opportunity.impact} impact
                        </Badge>
                      </div>
                    ))
                  : null}
                {displayedFindings
                  .filter((finding) => finding.severity !== "passed")
                  .map((finding) => (
                    <div key={finding.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.2fr_1fr_90px]">
                      <div className="flex gap-3">
                        <div className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg",
                          finding.severity === "critical"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-chart-2/12 text-chart-2",
                        )}>
                          <TriangleAlertIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{finding.title}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{finding.url}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{finding.evidence}</p>
                      <Badge variant={finding.severity === "critical" ? "destructive" : "secondary"} className="self-start justify-self-start">
                        {finding.severity}
                      </Badge>
                    </div>
                  ))}
                {!data.opportunities.length && !displayedFindings.filter((finding) => finding.severity !== "passed").length ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Run an audit or connect Search Console to build the opportunity queue.
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold">Website checks</h3>
                {[
                  { label: "Critical", rows: critical, tone: "text-destructive" },
                  { label: "Warning", rows: warnings, tone: "text-chart-2" },
                  { label: "Passed", rows: passed, tone: "text-primary" },
                ].map(({ label, rows, tone }) => (
                  <div key={label} className="mt-4">
                    <p className={cn("text-sm font-semibold", tone)}>
                      {label} <span className="ml-1 text-xs">({rows.length})</span>
                    </p>
                    <div className="mt-2 divide-y">
                      {rows.slice(0, 4).map((finding) => (
                        <div key={finding.id} className="flex items-start gap-2 py-2">
                          {finding.severity === "passed" ? (
                            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                          ) : (
                            <AlertCircleIcon className={cn("mt-0.5 size-4 shrink-0", tone)} />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm">{finding.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{finding.evidence}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              <section className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold">Recent audit history</h3>
                <div className="mt-3 divide-y">
                  {data.runs.slice(0, 5).map((run) => (
                    <div key={run.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div>
                        <p>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(run.createdAt))}</p>
                        <p className="text-xs capitalize text-muted-foreground">{run.status}</p>
                      </div>
                      <p className="font-semibold tabular-nums">{run.score ?? "—"}<span className="text-xs font-normal text-muted-foreground">/100</span></p>
                    </div>
                  ))}
                  {!data.runs.length ? (
                    <p className="py-4 text-sm text-muted-foreground">No audits yet.</p>
                  ) : null}
                </div>
              </section>

              {data.website ? (
                <Link href={data.website} target="_blank" className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm hover:border-primary/40">
                  <span className="truncate">{new URL(data.website).hostname}</span>
                  <ArrowUpRightIcon className="size-4 shrink-0" />
                </Link>
              ) : null}
            </aside>
          </div>
        </>
      )}
      <ActionLoadingOverlay
        active={isPending}
        label="Queuing website audit…"
        className="rounded-2xl"
      />
    </div>
  );
}
