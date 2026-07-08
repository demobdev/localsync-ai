"use client";

import { ListChecksIcon, MapPinIcon, MonitorSmartphoneIcon, SearchIcon } from "lucide-react";

import { CATEGORY_MAX, type AuditReport } from "@/lib/grader/types";

import { gradeColor, Pill, ReportCard, ScoreRing } from "./primitives";

function categoryStatus(score: number, max: number) {
  const ratio = score / max;
  if (ratio >= 0.75) return { label: "Looking good", tone: "green" as const };
  if (ratio >= 0.5) return { label: "Needs work", tone: "amber" as const };
  return { label: "Falling behind", tone: "red" as const };
}

const GRADE_BLURB: Record<string, string> = {
  Poor: "Customers searching for what you do are finding competitors first.",
  Fair: "You show up sometimes — but you're losing winnable searches every day.",
  Good: "A solid foundation. A few fixes separate you from the top spot.",
  Excellent: "You're a local leader. Protect the lead and keep reviews flowing.",
};

export function ScoreHero({ report }: { report: AuditReport }) {
  const color = gradeColor(report.grade);
  const categories = [
    {
      icon: SearchIcon,
      title: "Search Results",
      score: report.categoryScores.search,
      max: CATEGORY_MAX.search,
      note: "Where you rank on Google",
    },
    {
      icon: MonitorSmartphoneIcon,
      title: "Guest Experience",
      score: report.categoryScores.guest,
      max: CATEGORY_MAX.guest,
      note: "How your website converts",
    },
    {
      icon: MapPinIcon,
      title: "Local Listings",
      score: report.categoryScores.listings,
      max: CATEGORY_MAX.listings,
      note: "Your Google Business Profile",
    },
  ];

  return (
    <ReportCard className="overflow-hidden">
      <div className="flex flex-col items-center gap-6 px-6 pt-8 pb-6 text-center sm:px-10">
        <div className="space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium tracking-wide text-zinc-500 uppercase">
            <ListChecksIcon className="size-4" />
            LocalSync Visibility Score
          </p>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            {report.businessName}
          </h1>
          <p className="text-sm text-zinc-500">
            {report.websiteUrl ? (
              report.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
            ) : (
              <span className="font-medium text-red-600">No website found</span>
            )}
            {report.city ? ` · ${report.city}${report.state ? `, ${report.state}` : ""}` : ""}
          </p>
        </div>

        <ScoreRing score={report.totalScore} color={color} size={180} strokeWidth={14}>
          <span className="text-5xl font-bold tracking-tight text-zinc-900">
            {report.totalScore}
          </span>
          <span className="text-sm text-zinc-500">out of 100</span>
        </ScoreRing>

        <div className="space-y-2">
          <span
            className="inline-flex rounded-full px-4 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {report.grade}
          </span>
          <p className="mx-auto max-w-md text-sm text-zinc-600">
            {GRADE_BLURB[report.grade]}
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-t border-black/5 bg-zinc-50/50 p-4 sm:grid-cols-3 sm:p-5">
        {categories.map((category) => {
          const status = categoryStatus(category.score, category.max);
          return (
            <div
              key={category.title}
              className="rounded-2xl border border-black/5 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <category.icon className="size-4 text-zinc-500" />
                  <p className="text-sm font-semibold text-zinc-800">
                    {category.title}
                  </p>
                </div>
                <Pill tone={status.tone}>{status.label}</Pill>
              </div>
              <p className="mt-2 text-2xl font-bold text-zinc-900">
                {category.score}
                <span className="text-sm font-medium text-zinc-400">
                  /{category.max}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{category.note}</p>
            </div>
          );
        })}
      </div>
    </ReportCard>
  );
}
