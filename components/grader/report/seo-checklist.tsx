"use client";

import { InfoIcon } from "lucide-react";
import { useState } from "react";

import { CATEGORY_MAX, type AuditCheck, type AuditReport } from "@/lib/grader/types";

import { CheckRow, ReportCard, SectionHeader, StatusIcon } from "./primitives";

const GROUP_ORDER = [
  "Domain",
  "Headline (H1)",
  "Metadata",
  "Schema",
  "Indexability",
];

export function ReviewedItemsSummary({ report }: { report: AuditReport }) {
  const needsWork = report.checks.filter(
    (c) => c.status === "fail" || c.status === "warn",
  ).length;

  return (
    <div className="rounded-3xl border border-black/5 bg-zinc-900 p-6 text-center shadow-sm sm:p-8">
      <p className="text-2xl font-bold text-white sm:text-3xl">
        {report.totalChecks} things reviewed,{" "}
        <span className="text-amber-400">{needsWork} need work</span>
      </p>
      <p className="mt-1.5 text-sm text-zinc-400">
        See what&apos;s wrong and how to improve — every item below expands
        with an explanation and a fix.
      </p>
    </div>
  );
}

export function WebsiteSeoChecklist({ report }: { report: AuditReport }) {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const searchChecks = report.checks.filter((c) => c.category === "search");

  const groups = GROUP_ORDER.map((group) => ({
    group,
    checks: searchChecks.filter((c) => c.group === group),
  })).filter((g) => g.checks.length > 0);

  return (
    <ReportCard className="overflow-hidden">
      <SectionHeader
        index={1}
        title="Search Results"
        subtitle="Get your website to the top of Google"
        score={report.categoryScores.search}
        max={CATEGORY_MAX.search}
      />

      <div className="px-5 pb-4 sm:px-6">
        <button
          type="button"
          onClick={() => setExplainerOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
        >
          <InfoIcon className="size-4" />
          What&apos;s SEO?
        </button>
        {explainerOpen && (
          <p className="mt-2 rounded-2xl bg-emerald-50/70 p-4 text-sm text-zinc-700">
            SEO (search engine optimization) is how Google decides which
            websites to show first. When your site clearly says what you do,
            where you do it, and marks that up so machines can read it, Google
            trusts it — and ranks it above competitors. Every item below is a
            signal Google reads on your website today.
          </p>
        )}
      </div>

      {groups.map(({ group, checks }) => (
        <CheckGroup key={group} title={group} checks={checks} />
      ))}
    </ReportCard>
  );
}

export function CheckGroup({
  title,
  checks,
}: {
  title: string;
  checks: AuditCheck[];
}) {
  const passed = checks.filter((c) => c.status === "pass").length;

  return (
    <div className="border-t border-black/5">
      <div className="flex items-center justify-between bg-zinc-50/70 px-4 py-2.5 sm:px-5">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          {title}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <StatusIcon
            status={passed === checks.length ? "pass" : "warn"}
            className="size-3.5"
          />
          {passed}/{checks.length} passing
        </p>
      </div>
      {checks.map((check) => (
        <CheckRow
          key={check.id}
          status={check.status}
          label={check.label}
          detail={check.detail}
          recommendation={check.recommendation}
        />
      ))}
    </div>
  );
}
