import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import {
  BarChart3Icon,
  MapPinIcon,
  SearchCheckIcon,
  TrendingDownIcon,
} from "lucide-react";

import { GraderStart } from "@/components/grader/grader-start";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export const metadata: Metadata = {
  title: "Free Local Visibility Grader — LocalSync",
  description:
    "See where customers are finding your competitors instead of you. Free local visibility & revenue leak audit — 44 factors, Google rankings, page speed, and your Business Profile.",
};

const PROOF_POINTS = [
  {
    icon: SearchCheckIcon,
    title: "44 factors reviewed",
    body: "SEO, page speed, Google Business Profile, reviews, and local rankings — scored like Google sees them.",
  },
  {
    icon: MapPinIcon,
    title: "Competitor comparison",
    body: "See exactly who outranks you in the map pack for the searches that bring in customers.",
  },
  {
    icon: TrendingDownIcon,
    title: "Revenue leak estimate",
    body: "A dollar figure on what invisible rankings cost you every month — and the plan to fix it.",
  },
];

export default async function GraderPage() {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col bg-[#faf7ef]">
      <MarketingHeader signedIn={Boolean(session.userId)} />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
            <div className="mb-8 space-y-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-sm font-medium text-emerald-700">
                <BarChart3Icon className="size-3.5" />
                Free local visibility audit
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                See where customers are finding your{" "}
                <span className="text-emerald-700">competitors</span> instead of
                you.
              </h1>
              <p className="mx-auto max-w-xl text-lg text-zinc-600">
                Enter your website and get a full audit of your Google rankings,
                website experience, and local listings — with a dollar estimate
                of what you&apos;re leaving on the table.
              </p>
            </div>

            <GraderStart />
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
    </div>
  );
}
