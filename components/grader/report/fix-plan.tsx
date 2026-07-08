"use client";

import { HammerIcon, RocketIcon, ZapIcon } from "lucide-react";

import type { AuditCheck, FixPlan } from "@/lib/grader/types";

import { Pill, ReportCard } from "./primitives";

const BUCKETS = [
  {
    key: "quickWins" as const,
    icon: ZapIcon,
    title: "Quick wins",
    subtitle: "Fixable this week — copy, tags, and profile fields",
    tone: "green" as const,
  },
  {
    key: "medium" as const,
    icon: HammerIcon,
    title: "Medium effort",
    subtitle: "A focused afternoon or a task for your web person",
    tone: "amber" as const,
  },
  {
    key: "highImpact" as const,
    icon: RocketIcon,
    title: "High-impact projects",
    subtitle: "The moves that change your ranking trajectory",
    tone: "red" as const,
  },
];

export function FixPlanSection({ fixPlan }: { fixPlan: FixPlan }) {
  return (
    <ReportCard className="overflow-hidden">
      <div className="px-5 pt-5 pb-1 sm:px-6 sm:pt-6">
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">
          Your fix plan
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Every failed check above, ordered by effort and impact.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
        {BUCKETS.map((bucket) => {
          const items = fixPlan[bucket.key];
          return (
            <div
              key={bucket.key}
              className="rounded-2xl border border-black/5 bg-white p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <bucket.icon className="size-4 text-zinc-500" />
                <p className="text-sm font-semibold text-zinc-800">
                  {bucket.title}
                </p>
                <Pill tone={bucket.tone} className="ml-auto">
                  {items.length}
                </Pill>
              </div>
              <p className="mb-3 text-xs text-zinc-500">{bucket.subtitle}</p>
              {items.length === 0 ? (
                <p className="rounded-xl bg-emerald-50/70 px-3 py-2 text-sm text-emerald-700">
                  Nothing here — you&apos;re covered.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.slice(0, 6).map((item) => (
                    <FixItem key={item.id} check={item} />
                  ))}
                  {items.length > 6 && (
                    <li className="text-xs text-zinc-400">
                      +{items.length - 6} more in the sections above
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </ReportCard>
  );
}

function FixItem({ check }: { check: AuditCheck }) {
  return (
    <li className="rounded-xl border border-black/5 bg-zinc-50/60 px-3 py-2">
      <p className="text-sm font-medium text-zinc-800">{check.label}</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        {check.recommendation ?? check.detail}
      </p>
    </li>
  );
}
