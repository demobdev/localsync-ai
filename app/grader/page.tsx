import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  MapPinIcon,
  SearchCheckIcon,
  TrendingDownIcon,
} from "lucide-react";

import { GraderStart } from "@/components/grader/grader-start";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { parseGraderModelParam } from "@/lib/onboarding/routing";

export const metadata: Metadata = {
  title: "Free Business Check",
  description:
    "Find your business on Google and check its public profile, reviews, and website before setting up your listings workspace.",
};

const PROOF_POINTS = [
  {
    icon: SearchCheckIcon,
    title: "Your public profile",
    body: "Start with the business details customers see on Google. Confirm the right location before running a check.",
  },
  {
    icon: MapPinIcon,
    title: "Competitor comparison",
    body: "Review available local search evidence alongside nearby businesses. Coverage depends on the data returned.",
  },
  {
    icon: TrendingDownIcon,
    title: "A clear next step",
    body: "Use the findings to prioritize profile corrections and listing setup in your LocalMap workspace.",
  },
];

export default async function GraderPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string; add?: string }>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const initialModel = parseGraderModelParam(params.model) ?? "storefront";
  const addBusiness = params.add === "1";

  return (
    <div className="localmap-public flex min-h-full flex-col">
      <MarketingHeader signedIn={Boolean(session.userId)} />

      <main id="main-content" className="flex-1">
        {session.userId ? (
          <div className="border-b border-black/5 bg-white/70">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                <ArrowLeftIcon className="size-4" />
                Back to dashboard
              </Link>
              <span className="text-xs text-zinc-500">
                Audits you claim link to your workspace automatically
              </span>
            </div>
          </div>
        ) : null}
        <section className="relative z-30">
          <div className="mx-auto max-w-3xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
            <div className="mb-8 space-y-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-700">
                <BarChart3Icon className="size-3.5" />
                Free business check
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                Start with what customers see.
              </h1>
              <p className="mx-auto max-w-xl text-lg text-zinc-600">
                Find your business on Google, confirm the right location, and
                check its public profile, reviews, and website. Nothing is
                changed or published during this check.
              </p>
            </div>

            <GraderStart initialModel={initialModel} addBusiness={addBusiness} />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Ready to manage your listings?{" "}
              <Link href={session.userId ? "/dashboard" : "/sign-up"} className="font-semibold text-primary underline underline-offset-4">Set up your workspace</Link>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {PROOF_POINTS.map((point) => (
              <div
                key={point.title}
                className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-100">
                  <point.icon className="size-5 text-emerald-700" />
                </div>
                <h2 className="font-semibold text-zinc-900">{point.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">{point.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
