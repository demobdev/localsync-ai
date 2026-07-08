"use client";

import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleHelpIcon,
  StarIcon,
  XCircleIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import type { AuditGrade, CheckStatus } from "@/lib/grader/types";
import { cn } from "@/lib/utils";

/* ── Shared card shell ─────────────────────────────────────────────────── */

export function ReportCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-black/5 bg-white/80 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Score ring ────────────────────────────────────────────────────────── */

export function gradeColor(grade: AuditGrade): string {
  switch (grade) {
    case "Poor":
      return "#dc2626";
    case "Fair":
      return "#d97706";
    case "Good":
      return "#059669";
    case "Excellent":
      return "#047857";
  }
}

export function ScoreRing({
  score,
  max = 100,
  size = 160,
  strokeWidth = 12,
  color,
  children,
}: {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, score / max));

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e7e5df"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* ── Status icons + pills ──────────────────────────────────────────────── */

export function StatusIcon({
  status,
  className,
}: {
  status: CheckStatus;
  className?: string;
}) {
  switch (status) {
    case "pass":
      return (
        <CheckCircle2Icon
          className={cn("size-5 shrink-0 text-emerald-600", className)}
        />
      );
    case "fail":
      return (
        <XCircleIcon className={cn("size-5 shrink-0 text-red-500", className)} />
      );
    case "warn":
      return (
        <CircleAlertIcon
          className={cn("size-5 shrink-0 text-amber-500", className)}
        />
      );
    case "unknown":
      return (
        <CircleHelpIcon
          className={cn("size-5 shrink-0 text-zinc-400", className)}
        />
      );
  }
}

export function Pill({
  tone,
  children,
  className,
}: {
  tone: "red" | "amber" | "green" | "neutral";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Expandable check row ──────────────────────────────────────────────── */

export function CheckRow({
  status,
  label,
  detail,
  recommendation,
}: {
  status: CheckStatus;
  label: string;
  detail: string;
  recommendation?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-black/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50/70 sm:px-5"
      >
        <StatusIcon status={status} />
        <span className="flex-1 text-sm font-medium text-zinc-800">{label}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pl-12 sm:px-5 sm:pl-13">
          <p className="text-sm text-zinc-600">{detail}</p>
          {recommendation && (
            <p className="mt-1.5 text-sm text-zinc-600">
              <span className="font-semibold text-emerald-700">How to fix: </span>
              {recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Star rating ───────────────────────────────────────────────────────── */

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={cn(
            "size-3.5",
            i <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-200",
          )}
        />
      ))}
    </span>
  );
}

/* ── Google "G" icon ───────────────────────────────────────────────────── */

export function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

/* ── Section header ("1. Search Results — …") ──────────────────────────── */

export function SectionHeader({
  index,
  title,
  subtitle,
  score,
  max,
}: {
  index: number;
  title: string;
  subtitle: string;
  score: number;
  max: number;
}) {
  const ratio = score / max;
  const tone = ratio >= 0.75 ? "green" : ratio >= 0.5 ? "amber" : "red";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">
          {index}. {title}
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
      </div>
      <Pill tone={tone} className="text-sm">
        {score}/{max}
      </Pill>
    </div>
  );
}
