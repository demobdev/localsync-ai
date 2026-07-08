"use client";

import { GaugeIcon } from "lucide-react";

import {
  CATEGORY_MAX,
  type AuditReport,
  type PageSpeedData,
  type PageSpeedMetric,
} from "@/lib/grader/types";
import { cn } from "@/lib/utils";

import { Pill, ReportCard, SectionHeader } from "./primitives";
import { CheckGroup } from "./seo-checklist";

export function GuestExperienceSection({ report }: { report: AuditReport }) {
  const conversionChecks = report.checks.filter(
    (c) => c.category === "guest" && c.group === "Conversion",
  );

  return (
    <ReportCard className="overflow-hidden">
      <SectionHeader
        index={2}
        title="Guest Experience"
        subtitle="Improve the experience on your website"
        score={report.categoryScores.guest}
        max={CATEGORY_MAX.guest}
      />

      <div className="px-4 pb-4 sm:px-5">
        <PageSpeedCard pageSpeed={report.pageSpeed} />
      </div>

      <CheckGroup title="Conversion & trust" checks={conversionChecks} />
    </ReportCard>
  );
}

const RATING_META = {
  good: { dot: "bg-emerald-500", label: "Good", text: "text-emerald-700" },
  "needs-improvement": {
    dot: "bg-amber-500",
    label: "Needs improvement",
    text: "text-amber-700",
  },
  poor: { dot: "bg-red-500", label: "Poor", text: "text-red-700" },
  unknown: { dot: "bg-zinc-300", label: "Not enough data", text: "text-zinc-500" },
} as const;

function PageSpeedCard({ pageSpeed }: { pageSpeed: PageSpeedData }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100">
            <GaugeIcon className="size-4.5 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              Page speed test by Google
            </p>
            <p className="text-xs text-zinc-500">
              Real-user Core Web Vitals, mobile
            </p>
          </div>
        </div>
        {pageSpeed.overall === "pass" ? (
          <Pill tone="green">Passing</Pill>
        ) : pageSpeed.overall === "fail" ? (
          <Pill tone="red">Failing</Pill>
        ) : (
          <Pill tone="neutral">Not enough data</Pill>
        )}
      </div>

      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {pageSpeed.metrics.map((metric) => (
          <MetricRow key={metric.id} metric={metric} />
        ))}
      </div>

      {pageSpeed.performanceScore !== null && (
        <p className="mt-4 text-xs text-zinc-500">
          Lighthouse performance score:{" "}
          <span className="font-semibold text-zinc-700">
            {pageSpeed.performanceScore}/100
          </span>
        </p>
      )}
    </div>
  );
}

function MetricRow({ metric }: { metric: PageSpeedMetric }) {
  const meta = RATING_META[metric.rating];

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm text-zinc-700">
          <span className={cn("size-2 rounded-full", meta.dot)} />
          {metric.label}{" "}
          <span className="text-xs text-zinc-400">({metric.id})</span>
        </p>
        <p className={cn("text-sm font-semibold", meta.text)}>
          {metric.displayValue}
        </p>
      </div>
      <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full">
        <div className="absolute inset-0 flex">
          <div className="h-full flex-1 bg-emerald-200" />
          <div className="h-full flex-1 bg-amber-200" />
          <div className="h-full flex-1 bg-red-200" />
        </div>
        {metric.percentile !== null && (
          <div
            className="absolute top-0 h-full w-1 rounded-full bg-zinc-800"
            style={{ left: `${metric.percentile}%` }}
          />
        )}
      </div>
    </div>
  );
}
