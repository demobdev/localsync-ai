"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  MapPinIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { AuditReport } from "@/lib/grader/types";
import { buildGraderFixHref } from "@/lib/onboarding/routing";

export function fixHref(report: AuditReport, signedIn: boolean): string {
  return buildGraderFixHref({ auditId: report.id, signedIn });
}

export function ImproveWithAICTA({
  report,
  signedIn,
}: {
  report: AuditReport;
  signedIn: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 20% 0%, rgba(255,255,255,0.35), transparent), radial-gradient(ellipse 50% 60% at 90% 100%, rgba(52,211,153,0.4), transparent)",
        }}
      />
      <div className="relative grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <SparklesIcon className="size-3.5" />
            Fix it with LocalSync
          </p>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Fix your visibility leaks with LocalSync
          </h2>
          <p className="mt-2 max-w-lg text-emerald-100/90">
            Approve-first sync to every major listing, AI-drafted descriptions
            and review responses, and honest rails — nothing publishes without
            your sign-off.
          </p>
          <ul className="mt-4 space-y-1.5">
            {[
              `Fix the ${report.failedChecks} issues found in this audit`,
              "Sync your profile to 20+ directories from one place",
              "AI drafts, you approve — reviews, posts, descriptions",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-emerald-50"
              >
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-300" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={fixHref(report, signedIn)}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-base font-semibold text-emerald-900 transition-colors hover:bg-emerald-50"
          >
            Start fixing my visibility
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        {/* Phone mockup */}
        <div className="mx-auto hidden w-56 lg:block">
          <div className="rounded-[2rem] border-4 border-white/20 bg-zinc-900/80 p-3 shadow-2xl">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-white/95 p-2.5">
                <MapPinIcon className="size-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-800">
                    {report.businessName}
                  </p>
                  <p className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <StarIcon className="size-2.5 fill-amber-400 text-amber-400" />
                    4.9 · #1 in {report.city ?? "your area"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[10px] font-medium text-emerald-200">
                  Visibility score
                </p>
                <p className="text-xl font-bold text-white">92/100</p>
                <div className="mt-1 h-1 rounded-full bg-white/20">
                  <div className="h-full w-[92%] rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <p className="text-[10px] text-emerald-200">
                  20 listings synced ✓
                </p>
                <p className="text-[10px] text-emerald-200">
                  3 review replies drafted for approval
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StickyFixCTA({
  report,
  signedIn,
}: {
  report: AuditReport;
  signedIn: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 900);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {report.failedChecks} visibility leaks · ~$
            {report.estimatedMonthlyLoss.toLocaleString()}/mo at stake
          </p>
          <p className="hidden text-xs text-zinc-500 sm:block">
            LocalSync fixes these with approve-first sync and AI drafts
          </p>
        </div>
        <Link
          href={fixHref(report, signedIn)}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Fix my visibility
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </div>
  );
}
