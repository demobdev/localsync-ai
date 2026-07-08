"use client";

/**
 * Progressive scan experience for /grader/[auditId] while status="scanning".
 *
 * Functional implementation of docs/grader-scan-experience.md: left-rail
 * checklist + evidence stage driven entirely by GET /api/grader/status/[id]
 * (polled ~1.5s). State derives from the endpoint, so refresh mid-scan just
 * resumes. Plain CSS transitions only — the creative motion pass comes later.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  GaugeIcon,
  GlobeIcon,
  LoaderIcon,
  MapPinIcon,
  SparklesIcon,
  StoreIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  GraderProgressEvidence,
  GraderStatusResponse,
} from "@/lib/grader/types";
import { cn } from "@/lib/utils";

import { Stars } from "./report/primitives";

const POLL_MS = 1500;
const SCENE_MS = 4500;
const ESTIMATE_SECONDS = 45;

function checklistLabels(input: {
  businessName: string | null;
  domain: string | null;
}): string[] {
  const name = input.businessName ?? input.domain ?? "Your business";
  return [
    `${name} & local competitors`,
    "Google Business Profile",
    "Review sentiment",
    "Photos & first impressions",
    input.domain ?? "Website check",
    "Mobile experience & speed",
  ];
}

export function ScanExperience({
  auditId,
  initial,
  domain,
}: {
  auditId: string;
  initial: GraderStatusResponse;
  /** Website domain for the checklist label; null in no-website mode. */
  domain: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<GraderStatusResponse>(initial);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const refreshed = useRef(false);

  // ── Poll the status endpoint; all state derives from it (refresh-safe) ──
  useEffect(() => {
    if (data.status !== "scanning") return;

    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/grader/status/${auditId}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const next = (await response.json()) as GraderStatusResponse;
        setData(next);
      } catch {
        // Transient poll failures are fine — next tick retries.
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [auditId, data.status]);

  // ── Complete → re-render the server page as the report ──────────────────
  useEffect(() => {
    if (data.status === "complete" && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [data.status, router]);

  // ── Countdown tick (client-only to avoid hydration drift) ───────────────
  useEffect(() => {
    const startedAt = new Date(data.startedAt).getTime();
    const tick = () => setElapsed((Date.now() - startedAt) / 1000);
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data.startedAt]);

  if (data.status === "failed") {
    return <ScanFailed />;
  }

  const doneCount =
    data.status === "complete" ? 6 : Math.min(data.stagesDone.length, 5);
  const labels = checklistLabels({
    businessName: data.evidence.place?.name ?? null,
    domain,
  });

  const remaining =
    elapsed === null ? null : Math.ceil(ESTIMATE_SECONDS - elapsed);
  const countdownText =
    data.status === "complete"
      ? "Preparing your report…"
      : remaining !== null && remaining > 5
        ? `~${remaining} seconds remaining`
        : "Almost done…";

  const progressPct = Math.min(
    95,
    Math.max(
      (doneCount / 6) * 100,
      elapsed !== null ? Math.min((elapsed / ESTIMATE_SECONDS) * 100, 92) : 0,
    ),
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10 lg:flex-row lg:gap-6">
      {/* Left rail: checklist + progress + countdown */}
      <div className="w-full shrink-0 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm sm:p-6 lg:w-80">
        <p className="text-lg font-bold text-zinc-900">Scanning…</p>
        <p className="mb-5 text-sm text-zinc-500">
          Auditing your local visibility across 44 factors
        </p>

        <ul className="space-y-3">
          {labels.map((label, index) => {
            const state =
              index < doneCount
                ? "done"
                : index === doneCount
                  ? "active"
                  : "pending";
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2.5 text-sm transition-opacity duration-500",
                  state === "pending" && "opacity-30",
                )}
              >
                {state === "done" ? (
                  <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                ) : state === "active" ? (
                  <LoaderIcon className="size-4 shrink-0 animate-spin text-emerald-600" />
                ) : (
                  <span className="size-4 shrink-0 rounded-full border border-zinc-300" />
                )}
                <span className="truncate font-medium text-zinc-700">
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">{countdownText}</p>
        </div>
      </div>

      {/* Center stage: evidence scenes + streamed AI narration */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <EvidenceStage evidence={data.evidence} domain={domain} />
        <NarrationPanel lines={data.evidence.narration ?? []} />
      </div>
    </div>
  );
}

/** Streamed consultant lines — fades new lines in as polls deliver them. */
function NarrationPanel({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-4 shadow-sm sm:p-5">
      <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
        <SparklesIcon className="size-3.5" />
        LocalSync AI
      </p>
      <div className="space-y-1.5">
        {lines.map((line) => (
          <p
            key={line}
            className="animate-in fade-in slide-in-from-bottom-1 text-sm text-zinc-700 duration-500"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── Evidence stage ────────────────────────────────────────────────────── */

type SceneId = "identity" | "reviews" | "photos" | "screenshot" | "speed";

function availableScenes(
  evidence: GraderProgressEvidence,
): SceneId[] {
  const scenes: SceneId[] = ["identity"];
  if ((evidence.place?.reviews.length ?? 0) > 0) scenes.push("reviews");
  if ((evidence.place?.photoUrls.length ?? 0) > 0) scenes.push("photos");
  if (evidence.screenshotUrl) scenes.push("screenshot");
  if (evidence.pageSpeed) scenes.push("speed");
  return scenes;
}

function EvidenceStage({
  evidence,
  domain,
}: {
  evidence: GraderProgressEvidence;
  domain: string | null;
}) {
  const scenes = availableScenes(evidence);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), SCENE_MS);
    return () => clearInterval(timer);
  }, []);

  const scene = scenes[tick % scenes.length] ?? "identity";

  const content = useMemo(() => {
    switch (scene) {
      case "reviews":
        return <ReviewsScene evidence={evidence} />;
      case "photos":
        return <PhotosScene evidence={evidence} />;
      case "screenshot":
        return <ScreenshotScene evidence={evidence} />;
      case "speed":
        return <SpeedScene evidence={evidence} />;
      default:
        return <IdentityScene evidence={evidence} domain={domain} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scene identity drives re-render
  }, [scene, evidence, domain]);

  return (
    <div className="relative min-h-[26rem] flex-1 overflow-hidden rounded-3xl border border-black/5 bg-white/60 p-4 shadow-sm sm:p-6">
      {/* Scene crossfade: keyed remount + CSS fade/drift-in */}
      <div
        key={scene}
        className="animate-in fade-in slide-in-from-bottom-3 flex h-full items-center justify-center duration-500"
      >
        {content}
      </div>
    </div>
  );
}

function IdentityScene({
  evidence,
  domain,
}: {
  evidence: GraderProgressEvidence;
  domain: string | null;
}) {
  const place = evidence.place;

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {place?.photoUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- Places media URL
            <img
              src={place.photoUrls[0]}
              alt={place.name}
              className="size-20 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
              {place ? (
                <StoreIcon className="size-8 text-zinc-400" />
              ) : (
                <GlobeIcon className="size-8 text-zinc-400" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-zinc-900">
              {place?.name ?? (domain ? `Scanning ${domain}` : "Your business")}
            </p>
            {place?.rating != null && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-600">
                <Stars rating={place.rating} />
                {place.rating.toFixed(1)}
                {place.reviewCount != null && (
                  <span className="text-zinc-400">
                    · {place.reviewCount} reviews
                  </span>
                )}
              </p>
            )}
            {place?.address && (
              <p className="mt-1 flex items-start gap-1 text-xs text-zinc-500">
                <MapPinIcon className="mt-0.5 size-3 shrink-0" />
                {place.address}
              </p>
            )}
            {place?.category && (
              <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {place.category}
              </span>
            )}
          </div>
        </div>

        {(evidence.warnings?.length ?? 0) > 0 && (
          <div className="mt-4 space-y-2 border-t border-black/5 pt-4">
            {evidence.warnings!.map((warning) => (
              <p
                key={warning}
                className="flex items-center gap-2 text-sm font-medium text-red-600"
              >
                <CircleAlertIcon className="size-4 shrink-0" />
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>

      {(evidence.competitors?.length ?? 0) > 0 && (
        <div className="mt-3 space-y-2">
          {evidence.competitors!.slice(0, 3).map((competitor) => (
            <div
              key={competitor.name}
              className="flex items-center gap-2.5 rounded-2xl border border-black/5 bg-white/90 px-4 py-2.5 shadow-sm"
            >
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-600 uppercase">
                Competitor
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
                {competitor.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Stars rating={competitor.rating} />
                {competitor.rating.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsScene({ evidence }: { evidence: GraderProgressEvidence }) {
  const reviews = evidence.place?.reviews ?? [];
  const themes = evidence.reviewThemes ?? [];

  return (
    <div className="w-full max-w-md space-y-3">
      <p className="text-center text-sm font-medium text-zinc-500">
        Reading what customers say about you
      </p>
      {themes.length > 0 && (
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          {themes.map((theme) => (
            <div
              key={theme.theme}
              className="flex items-center justify-between border-b border-black/5 py-1.5 last:border-b-0"
            >
              <span className="text-sm font-medium text-zinc-800">
                {theme.theme}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Stars rating={theme.rating} />
                {theme.rating}/5
              </span>
            </div>
          ))}
        </div>
      )}
      {reviews.slice(0, themes.length > 0 ? 2 : 4).map((review) => (
        <div
          key={`${review.author}-${review.when}`}
          className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {review.author.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-800">
                {review.author}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Stars rating={review.rating} />
                {review.when}
              </p>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
            {review.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function PhotosScene({ evidence }: { evidence: GraderProgressEvidence }) {
  const photos = evidence.place?.photoUrls ?? [];

  return (
    <div className="w-full max-w-lg">
      <p className="mb-3 text-center text-sm font-medium text-zinc-500">
        Checking your photos & first impressions
      </p>
      <div
        className={cn(
          "grid gap-2",
          photos.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {photos.slice(0, 6).map((url) => (
          // eslint-disable-next-line @next/next/no-img-element -- Places media URL
          <img
            key={url}
            src={url}
            alt="Business photo"
            className="aspect-square w-full rounded-2xl border border-black/5 object-cover shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}

function ScreenshotScene({ evidence }: { evidence: GraderProgressEvidence }) {
  return (
    <div className="w-full max-w-lg">
      <p className="mb-3 text-center text-sm font-medium text-zinc-500">
        Scanning your website like Google does
      </p>
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-md">
        <div className="flex items-center gap-1.5 border-b border-black/5 bg-zinc-50 px-3 py-2">
          <span className="size-2.5 rounded-full bg-red-300" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-emerald-300" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- Firecrawl screenshot */}
        <img
          src={evidence.screenshotUrl}
          alt="Your website homepage"
          className="max-h-72 w-full object-cover object-top"
        />
      </div>
      {(evidence.services?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {evidence.services!.slice(0, 6).map((service) => (
            <span
              key={service}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
            >
              {service}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const SPEED_STATUS_META = {
  pass: { label: "Passing", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fail: { label: "Needs work", className: "bg-red-50 text-red-700 border-red-200" },
  unknown: { label: "Measuring…", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
} as const;

function SpeedScene({ evidence }: { evidence: GraderProgressEvidence }) {
  const speed = evidence.pageSpeed;
  if (!speed) return null;
  const meta = SPEED_STATUS_META[speed.status];

  return (
    <div className="w-full max-w-sm rounded-3xl border border-black/5 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100">
        <GaugeIcon className="size-6 text-zinc-600" />
      </div>
      <p className="font-semibold text-zinc-900">Mobile speed test by Google</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {speed.lcp && (
          <span className="rounded-full border border-black/5 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
            LCP {speed.lcp}
          </span>
        )}
        {speed.cls && (
          <span className="rounded-full border border-black/5 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
            CLS {speed.cls}
          </span>
        )}
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-sm font-semibold",
            meta.className,
          )}
        >
          {meta.label}
        </span>
      </div>
    </div>
  );
}

function ScanFailed() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50">
        <CircleAlertIcon className="size-7 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900">
        This audit didn&apos;t finish
      </h1>
      <p className="max-w-md text-sm text-zinc-600">
        We couldn&apos;t complete the scan — the website may have blocked our
        crawler. Double-check the URL and run a fresh audit.
      </p>
      <Link
        href="/grader"
        className="inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        Run a new audit
      </Link>
    </div>
  );
}
