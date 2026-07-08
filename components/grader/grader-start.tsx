"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  LoaderIcon,
  RadarIcon,
  SearchIcon,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { startGraderAuditAction } from "@/app/actions/grader";
import { cn } from "@/lib/utils";

const SCAN_STEPS = [
  "Crawling your website…",
  "Checking Google results for your services…",
  "Analyzing competitors in your area…",
  "Testing page speed with Google…",
  "Reviewing your Google Business Profile…",
  "Scoring 44 visibility factors…",
];

function ScanAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => Math.min(current + 1, SCAN_STEPS.length - 1));
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100">
          <RadarIcon className="size-5 animate-pulse text-emerald-700" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">
            Auditing your local visibility
          </p>
          <p className="text-sm text-zinc-500">
            Usually takes 30–60 seconds — don&apos;t close this tab
          </p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {SCAN_STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2.5 text-sm text-zinc-700 transition-opacity duration-500",
              index > step && "opacity-30",
            )}
          >
            {index < step ? (
              <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
            ) : index === step ? (
              <LoaderIcon className="size-4 shrink-0 animate-spin text-emerald-600" />
            ) : (
              <span className="size-4 shrink-0 rounded-full border border-zinc-300" />
            )}
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
          style={{ width: `${Math.min(95, ((step + 1) / SCAN_STEPS.length) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function GraderStart() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const { auditId } = await startGraderAuditAction({
          url: String(formData.get("url") ?? ""),
        });
        router.push(`/grader/${auditId}`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Audit failed — check the URL and try again",
        );
      }
    });
  }

  if (isPending) {
    return <ScanAnimation />;
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm sm:p-8">
      <form action={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="url"
            required
            autoFocus
            inputMode="url"
            placeholder="yourbusiness.com"
            className="h-13 w-full rounded-2xl border border-zinc-200 bg-white pr-4 pl-11 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          Grade my business
          <ArrowRightIcon className="size-4" />
        </button>
      </form>
      <p className="mt-3 text-sm text-zinc-500">
        Free · no signup to run the audit · takes about a minute
      </p>
    </div>
  );
}
