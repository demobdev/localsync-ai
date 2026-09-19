import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { LISTING_PLANS } from "@/lib/billing/plan-catalog";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  PlugZapIcon,
  RadarIcon,
  SendIcon,
  ShieldCheckIcon,
  StoreIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";

import { PublisherIcon } from "@/components/brand/publisher-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const campaignRows = [
  {
    name: "Google",
    slug: "google-business-profile",
    detail: "Connect the account that manages your listing",
    status: "Connection required",
    tone: "amber",
  },
  {
    name: "Apple Maps",
    slug: "apple-business-connect",
    detail: "Owner confirmation required",
    status: "Customer verification",
    tone: "blue",
  },
  {
    name: "Bing",
    slug: "bing-places",
    detail: "Review the publisher setup instructions",
    status: "Guided setup",
    tone: "violet",
  },
  {
    name: "Yelp",
    slug: "yelp",
    detail: "Profile ready for your approval",
    status: "Ready for review",
    tone: "amber",
  },
  {
    name: "Facebook",
    slug: "facebook",
    detail: "Watching the existing listing for drift",
    status: "Monitoring",
    tone: "teal",
  },
] as const;

const workflow = [
  {
    number: "1",
    icon: StoreIcon,
    title: "Add your business",
    body: "Start with a name or website.",
  },
  {
    number: "2",
    icon: ShieldCheckIcon,
    title: "Approve the profile",
    body: "Confirm the facts once.",
  },
  {
    number: "3",
    icon: RadarIcon,
    title: "Track every source",
    body: "See what needs attention and what is verified.",
  },
] as const;

const deliveryRails = [
  { icon: PlugZapIcon, label: "Direct connection" },
  { icon: UsersIcon, label: "Supported connections" },
  { icon: SendIcon, label: "Managed submission" },
  { icon: UserCheckIcon, label: "Customer verification" },
  { icon: ActivityIcon, label: "Monitored" },
] as const;

const premiumPlan = LISTING_PLANS.find((plan) => plan.tier === "premium")!;

const premiumFeatures = [
  "One approved business profile",
  "Publisher setup and verification guidance",
  "Approve updates on supported connections",
  "Listing checks and evidence history",
] as const;

function statusClass(tone: (typeof campaignRows)[number]["tone"]) {
  return cn(
    "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold",
    tone === "amber" && "bg-amber-50 text-amber-800",
    tone === "blue" && "bg-sky-50 text-sky-700",
    tone === "violet" && "bg-violet-50 text-violet-700",
    tone === "teal" && "bg-emerald-50 text-emerald-700",
  );
}

function CampaignPreview() {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/25 bg-white text-[#072d38] shadow-[0_30px_90px_rgba(0,0,0,.28)]">
      <div className="flex items-center justify-between border-b px-4 py-4 sm:px-5">
        <div>
          <p className="text-base font-semibold tracking-tight">
            Submission campaign
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Illustrative workflow · not live account data
          </p>
        </div>
        <span className="rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
          Example
        </span>
      </div>

      <div className="m-3 flex items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3.5 py-3 sm:m-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#062f3a] text-[#bef264]">
            <StoreIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Master Profile</p>
            <p className="truncate text-[11px] text-slate-500">
              Your approved business facts
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700">
          <CircleCheckIcon className="size-3" />
          Approved
        </span>
      </div>

      <div className="divide-y border-t">
        {campaignRows.map((publisher) => (
          <div
            key={publisher.slug}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_16px] sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <PublisherIcon slug={publisher.slug} badge size={32} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{publisher.name}</p>
                <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">
                  {publisher.detail}
                </p>
              </div>
            </div>
            <span className={statusClass(publisher.tone)}>
              {publisher.status}
            </span>
            <ChevronDownIcon className="hidden size-3.5 text-slate-400 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session.userId);

  return (
    <div className="localmap-public min-h-full">
      <MarketingHeader signedIn={signedIn} />
      <main id="main-content">
      <section className="relative overflow-hidden bg-[#062f3a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(18,139,155,.18),transparent_35%)]" />


        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-semibold leading-[.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-[4rem]">
              Get your business listed. Keep it right.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
              Keep your name, address, hours, and contact details in one place.
              Review updates, follow each publisher’s next step, and see which
              listings match your approved profile.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={signedIn ? "/dashboard" : "/sign-up"} />}
                className="h-12 rounded-xl bg-[#bef264] px-6 text-[15px] font-semibold text-[#062f3a] hover:bg-[#d1fa87]"
              >
                {signedIn ? "Open your workspace" : "Set up my listings"}
                <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/grader" />}
                className="h-12 rounded-xl border-cyan-300/60 bg-transparent px-6 text-[15px] font-semibold text-cyan-100 hover:bg-white/10 hover:text-white"
              >
                Check my business first
              </Button>
            </div>
          </div>

          <CampaignPreview />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-10 origin-bottom-left -skew-y-1 bg-white sm:h-14" />
      </section>

      <section id="how-it-works" className="scroll-mt-8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-4xl">
            <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-balance sm:text-5xl lg:text-6xl">
              One profile. Clear next steps. Proof of what changed.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Approve your business details, follow the setup for each publisher,
              and keep a record of listing checks and approved changes.
            </p>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
            {workflow.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="flex items-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-[#a3e635] text-[#062f3a]">
                    <step.icon className="size-6" />
                  </span>
                  {index < workflow.length - 1 ? (
                    <span className="ml-5 hidden h-px flex-1 bg-[#0b3a45]/40 md:block" />
                  ) : null}
                </div>
                <div className="mt-7 flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#a3e635] text-[11px] font-bold text-[#062f3a]">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid overflow-hidden border-y sm:grid-cols-2 lg:grid-cols-5">
            {deliveryRails.map((rail) => (
              <div
                key={rail.label}
                className="flex items-center gap-3 border-b px-4 py-5 last:border-b-0 sm:border-r lg:border-b-0 lg:last:border-r-0"
              >
                <rail.icon className="size-5 shrink-0 text-[#0e9ab0]" />
                <span className="text-sm font-semibold">{rail.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-8 bg-[#062f3a] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-semibold leading-[1.04] tracking-[-0.05em] text-balance sm:text-5xl">
              Start with listings. Upgrade when growth needs more.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">
              Premium Listings brings your business profile, supported connections,
              listing checks, and next actions into one workspace. Automation
              depends on publisher access and your account connection.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl overflow-hidden rounded-2xl border border-cyan-300/45 md:grid-cols-[.72fr_1.28fr]">
            <div className="flex flex-col justify-center border-b border-cyan-300/30 p-7 md:border-r md:border-b-0 sm:p-10">
              <span className="flex size-16 items-center justify-center rounded-full border border-cyan-300 text-cyan-200">
                <RadarIcon className="size-7" />
              </span>
              <h3 className="mt-7 text-2xl font-semibold">Premium Listings</h3>
              <p className="mt-5 flex items-end gap-2">
                <span className="text-6xl font-semibold tracking-[-0.06em]">${premiumPlan.priceMonthly}</span>
                <span className="pb-2 text-lg text-white/70">/ month</span>
              </p>
              <p className="mt-2 text-sm text-white/55">per business location</p>
            </div>
            <div className="p-7 sm:p-10">
              <ul className="space-y-4">
                {premiumFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm sm:text-base">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-cyan-300 text-cyan-200">
                      <CheckIcon className="size-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                nativeButton={false}
                render={<Link href={signedIn ? "/dashboard" : "/sign-up"} />}
                className="mt-8 h-12 w-full rounded-xl bg-[#bef264] px-6 text-base font-semibold text-[#062f3a] hover:bg-[#d1fa87]"
              >
                {signedIn ? "Open your workspace" : "Set up my listings"}
                <ArrowRightIcon className="size-4" />
              </Button>
              <Link
                href="/pricing"
                className="mt-5 block text-center text-sm font-medium text-cyan-200 underline underline-offset-4"
              >
                Compare all plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      </main>
      <MarketingFooter />
    </div>
  );
}
