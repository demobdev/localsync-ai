"use client";

/**
 * Visibility Brief — the culminated scan artifact before the full report.
 * Assembles photos, screenshot, findings, and score from real scan evidence.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CircleAlertIcon,
  MapPinIcon,
  SparklesIcon,
  StoreIcon,
  TrendingDownIcon,
} from "lucide-react";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { gradeColor, ScoreRing, Stars } from "@/components/grader/report/primitives";
import type {
  GraderProgressEvidence,
  GraderReportPreview,
} from "@/lib/grader/types";
import { cn } from "@/lib/utils";

const REVEAL_MS = 4500;

const GRADE_BLURB: Record<string, string> = {
  Poor: "Customers are finding competitors first.",
  Fair: "You're losing winnable local searches every day.",
  Good: "Solid foundation — a few fixes from the top spot.",
  Excellent: "You're a local leader. Protect the lead.",
};

export function BriefReveal({
  evidence,
  preview,
  domain,
  onComplete,
}: {
  evidence: GraderProgressEvidence;
  preview: GraderReportPreview;
  domain: string | null;
  onComplete: () => void;
}) {
  const [scoreVisible, setScoreVisible] = useState(false);
  const place = evidence.place;
  const businessName =
    preview.businessName || place?.name || domain || "Your business";
  const color = gradeColor(preview.grade);
  const topWarnings = evidence.warnings?.slice(0, 3) ?? [];
  const narrationTail = evidence.narration?.slice(-2) ?? [];
  const photos = place?.photoUrls?.slice(0, 4) ?? [];
  const competitors = evidence.competitors?.slice(0, 3) ?? [];

  useEffect(() => {
    const scoreTimer = setTimeout(() => setScoreVisible(true), 1200);
    const doneTimer = setTimeout(onComplete, REVEAL_MS);
    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#faf7ef]">
      <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="LocalMap home" className="flex items-center gap-2.5">
          <LocalMapLogo compact />
          <span className="min-w-0">
            <span className="block truncate font-semibold tracking-tight text-zinc-900">
              LocalMap
            </span>
            <span className="block truncate text-[11px] font-medium tracking-[0.18em] text-zinc-500 uppercase">
              Visibility Brief
            </span>
          </span>
        </Link>
        <span className="text-sm font-medium text-emerald-700">Audit complete</span>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 pb-8 sm:px-6">
        {/* Hero identity */}
        <section className="animate-in fade-in slide-in-from-bottom-2 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm duration-700 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
            Your local visibility brief
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            {place?.photoUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- Places media URL
              <img
                src={place.photoUrls[0]}
                alt={businessName}
                className="size-20 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
                <StoreIcon className="size-8 text-zinc-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
                {businessName}
              </h1>
              {place?.rating != null && (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                  <Stars rating={place.rating} />
                  {place.rating.toFixed(1)}
                  {place.reviewCount != null && (
                    <span className="text-zinc-400">
                      · {place.reviewCount} Google reviews
                    </span>
                  )}
                </p>
              )}
              {place?.address && (
                <p className="mt-1 flex items-start gap-1 text-sm text-zinc-500">
                  <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
                  {place.address}
                </p>
              )}
              {domain && !place?.address && (
                <p className="mt-1 text-sm text-zinc-500">{domain}</p>
              )}
            </div>
            <div
              className={cn(
                "flex shrink-0 flex-col items-center transition-opacity duration-700",
                scoreVisible ? "opacity-100" : "opacity-0",
              )}
            >
              <ScoreRing
                score={scoreVisible ? preview.totalScore : 0}
                color={color}
                size={120}
                strokeWidth={10}
              >
                <span className="text-3xl font-bold text-zinc-900">
                  {preview.totalScore}
                </span>
              </ScoreRing>
              <span
                className="mt-2 rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {preview.grade}
              </span>
            </div>
          </div>
          <p
            className={cn(
              "mt-4 text-sm text-zinc-600 transition-opacity duration-700 delay-300",
              scoreVisible ? "opacity-100" : "opacity-0",
            )}
          >
            {GRADE_BLURB[preview.grade] ?? GRADE_BLURB.Fair}
          </p>
        </section>

        {/* Visual proof row */}
        {(photos.length > 0 || evidence.screenshotUrl) && (
          <section className="animate-in fade-in slide-in-from-bottom-2 grid gap-3 duration-700 delay-150 sm:grid-cols-2">
            {evidence.screenshotUrl && (
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-black/5 bg-zinc-50 px-3 py-2">
                  <span className="size-2 rounded-full bg-red-300" />
                  <span className="size-2 rounded-full bg-amber-300" />
                  <span className="size-2 rounded-full bg-emerald-300" />
                  <span className="ml-2 truncate text-xs text-zinc-500">
                    {domain ?? "Your website"}
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element -- Firecrawl screenshot */}
                <img
                  src={evidence.screenshotUrl}
                  alt="Website homepage"
                  className="aspect-[16/10] w-full object-cover object-top"
                />
              </div>
            )}
            {photos.length > 0 && (
              <div className="rounded-2xl border border-black/5 bg-white/90 p-3 shadow-sm">
                <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                  Google photos
                  {evidence.photoBenchmark && (
                    <span className="ml-2 font-normal normal-case text-amber-700">
                      You: {evidence.photoBenchmark.yours} · Top rivals avg{" "}
                      {evidence.photoBenchmark.competitorAvg}
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element -- Places media URL
                    <img
                      key={url}
                      src={url}
                      alt="Business photo"
                      className="aspect-square rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Findings + leak */}
        <section className="animate-in fade-in slide-in-from-bottom-2 grid gap-3 duration-700 delay-300 lg:grid-cols-2">
          <div className="rounded-3xl border border-red-100 bg-red-50/70 p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-red-700">
              <TrendingDownIcon className="size-4 shrink-0" />
              Estimated revenue leak
            </p>
            <p className="mt-1 text-3xl font-bold text-red-700">
              ~${preview.estimatedMonthlyLoss.toLocaleString()}/mo
            </p>
            <p className="mt-1 text-sm text-red-600/80">
              from {preview.failedChecks} visibility leaks across{" "}
              {preview.totalChecks} factors
            </p>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
              <SparklesIcon className="size-3.5" />
              What we found
            </p>
            {topWarnings.length > 0 ? (
              <ul className="space-y-2">
                {topWarnings.map((warning) => (
                  <li
                    key={warning}
                    className="flex items-start gap-2 text-sm font-medium text-red-600"
                  >
                    <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            ) : narrationTail.length > 0 ? (
              <ul className="space-y-1.5">
                {narrationTail.map((line) => (
                  <li key={line} className="text-sm text-zinc-700">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-600">
                Competitors are outranking you on key local searches.
              </p>
            )}
          </div>
        </section>

        {/* Competitors */}
        {competitors.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-2 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm duration-700 delay-500">
            <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Who&apos;s beating you locally
            </p>
            <div className="space-y-2">
              {competitors.map((competitor) => (
                <div
                  key={competitor.name}
                  className="flex items-center gap-3 rounded-xl border border-black/5 bg-zinc-50/80 px-4 py-2.5"
                >
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-600 uppercase">
                    Competitor
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
                    {competitor.name}
                  </span>
                  <Stars rating={competitor.rating} />
                  <span className="text-xs text-zinc-500">
                    {competitor.rating.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Review themes */}
        {(evidence.reviewThemes?.length ?? 0) > 0 && (
          <section className="animate-in fade-in rounded-2xl border border-black/5 bg-white/90 p-4 shadow-sm duration-700 delay-700">
            <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Customer themes
            </p>
            <div className="flex flex-wrap gap-2">
              {evidence.reviewThemes!.map((theme) => (
                <span
                  key={theme.theme}
                  className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-zinc-50 px-3 py-1 text-sm text-zinc-700"
                >
                  {theme.theme}
                  <Stars rating={theme.rating} />
                </span>
              ))}
            </div>
          </section>
        )}

        <p className="animate-in fade-in pt-2 text-center text-sm text-zinc-500 duration-1000 delay-1000">
          Opening your full report…
        </p>
      </main>
    </div>
  );
}
