"use client";

import { CircleAlertIcon, StoreIcon, TrendingDownIcon, TrophyIcon } from "lucide-react";

import type { AuditReport } from "@/lib/grader/types";

import { Pill, ReportCard, Stars } from "./primitives";

export function TopSummaryGrid({
  report,
  problems,
}: {
  report: AuditReport;
  problems: string[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ProblemSummaryCard report={report} problems={problems} />
      <CompetitorSummaryCard report={report} />
    </div>
  );
}

function ProblemSummaryCard({
  report,
  problems,
}: {
  report: AuditReport;
  problems: string[];
}) {
  return (
    <ReportCard className="flex flex-col p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
          <StoreIcon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">
            {report.businessName}
          </p>
          <p className="truncate text-sm text-zinc-500">
            {report.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-red-100 bg-red-50/70 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-red-700">
          <TrendingDownIcon className="size-4 shrink-0" />
          Estimated revenue leak
        </p>
        <p className="mt-1 text-2xl font-bold text-red-700 sm:text-3xl">
          ~${report.estimatedMonthlyLoss.toLocaleString()}/month
        </p>
        <p className="mt-1 text-sm text-red-600/80">
          from {report.failedChecks} visibility leaks across{" "}
          {report.totalChecks} factors we reviewed
        </p>
      </div>

      <ul className="space-y-2.5">
        {problems.map((problem) => (
          <li key={problem} className="flex items-start gap-2.5 text-sm text-zinc-700">
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
            {problem}
          </li>
        ))}
      </ul>
    </ReportCard>
  );
}

function CompetitorSummaryCard({ report }: { report: AuditReport }) {
  const competitors = report.competitors;

  return (
    <ReportCard className="flex flex-col p-5 sm:p-6">
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <TrophyIcon className="size-4" />
          Local competition
        </p>
        <h3 className="mt-1 text-xl font-bold text-zinc-900">
          You&apos;re ranking below{" "}
          <span className="text-red-600">{competitors.length} competitors</span>
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          These businesses show up first when customers search for what you do
          {report.city ? ` in ${report.city}` : ""}.
        </p>
      </div>

      <div className="space-y-2">
        {competitors.map((competitor) => (
          <div
            key={competitor.name}
            className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
              {competitor.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-800">
                {competitor.name}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Stars rating={competitor.rating} />
                {competitor.rating.toFixed(1)} ({competitor.reviewCount} reviews)
              </p>
            </div>
            <Pill tone="neutral">#{competitor.rank} locally</Pill>
          </div>
        ))}

        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-red-300 bg-red-50/50 p-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-red-400 text-sm font-bold text-red-500">
            ?
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-800">
              {report.businessName}
            </p>
            <p className="text-xs text-red-600">
              Often missing from the results above
            </p>
          </div>
          <Pill tone="red">You</Pill>
        </div>
      </div>
    </ReportCard>
  );
}
