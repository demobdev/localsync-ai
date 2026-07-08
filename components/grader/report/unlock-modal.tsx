"use client";

import { useRouter } from "next/navigation";
import { LockOpenIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { captureGraderLeadAction } from "@/app/actions/grader";
import type { AuditReport } from "@/lib/grader/types";
import { cn } from "@/lib/utils";

import { UnlockBackdrop } from "./unlock-backdrop";

const RELATIONSHIPS = [
  { value: "owner" as const, label: "I'm the owner or manager" },
  { value: "provider" as const, label: "I provide services to this business" },
  { value: "other" as const, label: "Other" },
];

export function UnlockModal({ report }: { report: AuditReport }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<
    "owner" | "provider" | "other" | null
  >(null);
  const [optIn, setOptIn] = useState(false);
  const [isPending, startTransition] = useTransition();

  const competitorA = report.competitors[0]?.name ?? "your competitors";
  const competitorB = report.competitors[1]?.name;

  function handleStepOne(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Enter your name");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setStep(2);
  }

  function handleUnlock() {
    if (!relationship) {
      toast.error("Pick the option that fits you best");
      return;
    }
    startTransition(async () => {
      try {
        await captureGraderLeadAction({
          auditId: report.id,
          name,
          email,
          relationship,
          optIn,
        });
        // Server re-renders with leadCaptured=true and removes the blur.
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <UnlockBackdrop report={report} />
      <div className="relative w-full max-w-md rounded-3xl border border-black/5 bg-white p-6 shadow-2xl sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
          Step {step} of 2
        </p>

        {step === 1 ? (
          <form onSubmit={handleStepOne} className="mt-2 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Unlock your free report
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                See why {competitorA}
                {competitorB ? ` and ${competitorB}` : ""} are beating you
                locally — and exactly how to catch up.
              </p>
            </div>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                autoComplete="email"
                required
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Continue
            </button>
            <p className="text-center text-xs text-zinc-400">
              Free forever. No credit card. We&apos;ll email you a copy of the
              report.
            </p>
          </form>
        ) : (
          <div className="mt-2 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                What&apos;s your relationship to {report.businessName}?
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                This helps us tailor the recommendations in your report.
              </p>
            </div>
            <div className="space-y-2">
              {RELATIONSHIPS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRelationship(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    relationship === option.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                      relationship === option.value
                        ? "border-emerald-600"
                        : "border-zinc-300",
                    )}
                  >
                    {relationship === option.value && (
                      <span className="size-2 rounded-full bg-emerald-600" />
                    )}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                className="mt-0.5 size-4 accent-emerald-600"
              />
              Receive updates on your score and competitors
            </label>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              <LockOpenIcon className="size-4" />
              {isPending ? "Unlocking…" : "Unlock Report"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
