import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CheckIcon,
  CopyXIcon,
  FileSearchIcon,
  GlobeIcon,
  HistoryIcon,
  RadarIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { DistributionFlowVisual } from "@/components/marketing/distribution-visuals";
import { PublisherNetworkGrid } from "@/components/marketing/publisher-network-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LISTING_PLANS } from "@/lib/billing/plan-catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Listings Management — LocalMap",
  description:
    "One master profile, synced and verified across Google, Apple, Bing, Yelp, and 20+ directories. Approve-first sync, honest rails, and audits with evidence — from $19/location/mo.",
};

const PROOF_POINTS = [
  {
    title: "One profile. Every publisher.",
    body: "A versioned master profile feeds Google, Apple, Bing, Facebook, Yelp, and the extended map graph — update once, distribute everywhere.",
  },
  {
    title: "Honest rails, not fake syndication",
    body: "Every publisher is labeled API, guided, manual, or audit-only. You always know what actually syncs versus what we verify.",
  },
  {
    title: "Evidence with every audit",
    body: "Listing audits ship with screenshots and crawl data — when we say a listing is wrong, you can see exactly what customers see.",
  },
];

const FEATURES = [
  {
    category: "Identity",
    icon: HistoryIcon,
    title: "A master profile that never drifts",
    body: "Name, address, phone, hours, services, photos, FAQs — held in one canonical, version-controlled profile. Every change is tracked, so you always know what the internet should say about your business.",
  },
  {
    category: "NAP consistency",
    icon: RadarIcon,
    title: "Catch inconsistencies before search engines do",
    body: "Google cross-checks your details across the web. We track NAP consistency on every publisher and flag mismatches with evidence, so trust signals stay intact and rankings don't slip.",
  },
  {
    category: "Approve-first sync",
    icon: WorkflowIcon,
    title: "Nothing publishes without your approval",
    body: "AI drafts profile updates; you review and approve; we execute. Premium unlocks direct API sync to the majors — always through the same approve-first gate. No surprise edits, ever.",
  },
  {
    category: "Audits",
    icon: FileSearchIcon,
    title: "Audits with screenshots, not scores you have to trust",
    body: "Every audit crawls your live listings and attaches what it found. Broken hours on Yelp, an old address on MapQuest — you see the actual page, then fix it with a guided checklist or one approved sync.",
  },
  {
    category: "Duplicates",
    icon: CopyXIcon,
    title: "Duplicate detection that protects your rankings",
    body: "Duplicate listings split your reviews and confuse search engines. Pro detects duplicates across the network and walks you through suppression, publisher by publisher.",
  },
  {
    category: "AI readiness",
    icon: SparklesIcon,
    title: "Structured for the assistants shaping search",
    body: "Your profile is formatted for Google and Apple today and machine-readable for ChatGPT and Gemini tomorrow — schema.org, hosted profile pages, and llms.txt come built into Pro.",
  },
];

const FAQS = [
  {
    q: "What are business listings and why do they matter?",
    a: "Listings are the profiles that show your name, address, phone, and hours across Google, Apple Maps, Yelp, and dozens of directories. Search engines cross-check them against each other — inconsistent data erodes trust and rankings, and AI assistants may cite outdated facts instead of yours.",
  },
  {
    q: "What does \"honest rails\" mean?",
    a: "Every publisher in your workspace is labeled by how updates actually reach it: API (direct write), guided (we prep, you submit), manual (checklist), or audit-only (we verify what's live). No pretending everything syncs automatically when it doesn't.",
  },
  {
    q: "How is this different from Yext Listings?",
    a: "Yext sells bundled annual tiers ($199–$999/yr) funneled through a sales demo, and claims 200+ integrations without telling you which ones actually accept API writes. LocalMap is self-serve and month-to-month, labels every rail honestly, and includes audits with screenshot evidence on every tier — starting at $19/mo.",
  },
  {
    q: "Which publishers are covered?",
    a: "Basic covers secondary and audit-only directories. Premium adds Google Business Profile, Apple, Bing, Facebook, Yelp, and the core map graph (Foursquare, MapQuest, and more). Pro expands the set further and adds duplicate detection. Vertical networks — Healthgrades, Avvo, Angi-class directories — are $15/mo add-ons.",
  },
  {
    q: "What happens to my listings if I cancel?",
    a: "They stay live. We never held them hostage in the first place — you keep your master profile export and audit history, and the manual checklists work until the end of your billing period.",
  },
  {
    q: "Can I manage everything manually on the cheapest plan?",
    a: "Yes. Basic includes the master profile, NAP tracking, audits, and per-publisher guided checklists. Upgrades buy automation — the manual path never disappears.",
  },
];

export default async function ListingsProductPage() {
  const session = await auth();
  const signedIn = Boolean(session.userId);
  const primaryHref = signedIn ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={signedIn} />

      <main className="flex-1">
        <section className="localmap-mesh relative overflow-hidden border-b">
          <div className="localmap-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="max-w-xl space-y-6">
                <Badge
                  variant="secondary"
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
                >
                  <GlobeIcon className="mr-1.5 inline size-3.5" />
                  Listings · the core product
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.08]">
                  Listings management with nothing to hide
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  One master profile, synced and verified across Google, Apple,
                  Bing, Yelp, and 20+ directories — with every publisher rail
                  honestly labeled and every change approved by you first.
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={<Link href={primaryHref} />}
                  >
                    {signedIn ? "Open workspace" : "Start free workspace"}
                    <ArrowRightIcon className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/grader" />}
                  >
                    Scan your listings free
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  From $19/location/mo · month-to-month · manual path always
                  included
                </p>
              </div>

              <DistributionFlowVisual className="lg:justify-self-end" />
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
            {PROOF_POINTS.map((point) => (
              <div key={point.title}>
                <h2 className="font-semibold">{point.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              The problem isn&apos;t publishing. It&apos;s drift.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Directories overwrite your data, duplicates appear, hours go
              stale. LocalMap keeps a canonical profile, verifies what&apos;s
              actually live, and fixes drift through the rail each publisher
              really supports.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="localmap-card-glow rounded-2xl border bg-card p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="size-4.5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {feature.category}
                  </span>
                </div>
                <h3 className="font-semibold leading-snug">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-y bg-muted/20">
          <PublisherNetworkGrid />
        </div>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Pick your tier
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Three tiers. Same honest foundation.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every tier includes the master profile, audits, and NAP tracking.
              Upgrades buy the major platforms, approve-first API sync, and the
              AI discovery layer.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {LISTING_PLANS.map((plan) => (
              <div
                key={plan.slug}
                className={cn(
                  "localmap-card-glow rounded-2xl border bg-card p-5",
                  plan.tier === "premium" && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p>
                    <span className="text-2xl font-bold">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /loc/mo
                    </span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.tagline}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <Button
              nativeButton={false}
              render={<Link href="/pricing" />}
              variant="outline"
            >
              Compare plans in detail
              <ArrowRightIcon className="size-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Yext&apos;s equivalent bundles run $199–$999/yr — annual only,
              demo required.
            </p>
          </div>
        </section>

        <section className="border-y bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  vs Yext Listings
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Same architecture. Different honesty policy.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Yext pioneered the master-profile model — we kept the
                  architecture and dropped the opacity. No aggregator claims
                  without rail labels, no pricing behind a demo, no annual
                  lock-in.
                </p>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  "Every publisher rail labeled — API, guided, manual, or audit-only",
                  "Month-to-month from $19; Yext starts at $199/yr for secondary directories only",
                  "Audits ship screenshot evidence, not just a verifier verdict",
                  "Approve-first sync on every automated change",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Listings questions
          </h2>
          <div className="mt-6 space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
          <div className="localmap-card-glow mt-10 rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 text-center">
            <h3 className="text-xl font-bold">
              See what the internet says about your business
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Run the free scan — we&apos;ll show you every inconsistency we
              find, with evidence.
            </p>
            <Button
              size="lg"
              className="mt-5"
              nativeButton={false}
              render={<Link href="/grader" />}
            >
              Get your free scan
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
