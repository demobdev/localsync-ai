import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  CheckIcon,
  GlobeIcon,
  RadarIcon,
  WorkflowIcon,
} from "lucide-react";

import { HeritageHero } from "@/components/marketing/heritage-hero";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import {
  AiVisibilityShowcase,
  DistributionFlowVisual,
} from "@/components/marketing/distribution-visuals";
import { PhotoMarquee } from "@/components/marketing/photo-marquee";
import { PublisherNetworkGrid } from "@/components/marketing/publisher-network-grid";
import { SurfaceGrain } from "@/components/marketing/surface-grain";
import { YextComparisonSection } from "@/components/marketing/yext-comparison-section";
import { Button } from "@/components/ui/button";
import { COMPANY, HERITAGE_STATS } from "@/lib/brand/company";
import {
  HOMEPAGE_REVIEWS,
  SOCIAL_PRESENCE,
} from "@/lib/brand/external-reviews";
import { HERITAGE_STRIP } from "@/lib/brand/texture-assets";
import { LISTING_PLANS } from "@/lib/billing/plan-catalog";
import { cn } from "@/lib/utils";

const pillars = [
  {
    icon: GlobeIcon,
    title: "Identity",
    body: "Master Business Profile with versioned NAP, hours, services, and photos as the single source of truth.",
    href: "/products/listings",
    linkLabel: "Listings product",
  },
  {
    icon: RadarIcon,
    title: "Distribution",
    body: "Honest listing rails across Google, Apple, Yelp, and directories, labeled API, guided, manual, or audit-only.",
    href: "/products/listings",
    linkLabel: "Explore Listings",
  },
  {
    icon: BrainCircuitIcon,
    title: "Intelligence",
    body: "Listing audits with evidence, visibility scores, and AI citation pages so search and assistants stay accurate.",
    href: "/products/ai-visibility",
    linkLabel: "AI Visibility",
  },
  {
    icon: WorkflowIcon,
    title: "Automation",
    body: "Notice → recommend → approve → execute. AI drafts profile fixes and review replies; humans stay in control.",
    href: "/products/reputation",
    linkLabel: "Reputation in Pro",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Master profile",
    body: "Capture the canonical entity: name, address, phone, hours, services, and photos.",
  },
  {
    step: "02",
    title: "Audit & sync",
    body: "Compare publishers to the master profile. Approve-first updates, never surprise edits.",
  },
  {
    step: "03",
    title: "Publishers",
    body: "Google, Apple, Bing, Facebook, Yelp, and the extended map graph. Honest rails, no fake syndication.",
  },
  {
    step: "04",
    title: "Scores & AI",
    body: "Visibility and review scores, plus machine-readable pages assistants can cite.",
  },
];

const flywheel = [
  "Import profile",
  "Audit listings",
  "Fix inconsistencies",
  "Generate AI assets",
  "Improve visibility",
  "Measure results",
];

export default async function HomePage() {
  const session = await auth();
  const workspaceHref = session.userId ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={Boolean(session.userId)} />

      <main className="flex-1">
        <HeritageHero
          signedIn={Boolean(session.userId)}
          workspaceHref={workspaceHref}
        />

        <PhotoMarquee />

        <section className="localmap-mesh relative overflow-hidden border-b">
          <div className="localmap-grid absolute inset-0 opacity-30" />
          <SurfaceGrain opacity={0.2} className="mix-blend-multiply dark:mix-blend-soft-light" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                The product
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                One profile in. Honest rails out.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Capture NAP, hours, services, and photos once. Audit publishers
                against the master, approve every change, and feed search plus
                AI the same facts.{" "}
                <span className="text-foreground/80">
                  {SOCIAL_PRESENCE.bark.rating}/5 on{" "}
                  <a
                    href={SOCIAL_PRESENCE.bark.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Bark
                  </a>{" "}
                  ·{" "}
                  <Link
                    href="/reviews"
                    className="font-medium text-primary hover:underline"
                  >
                    see proof
                  </Link>
                </span>
              </p>
              <Button
                className="mt-6"
                variant="outline"
                nativeButton={false}
                render={<Link href="/products/listings" />}
              >
                Explore Listings
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
            <DistributionFlowVisual className="lg:justify-self-end" />
          </div>
        </section>

        <PublisherNetworkGrid />

        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Client proof
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  What owners say when they get found
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Real reviews from BBB, Google Maps, and Facebook.{" "}
                  {SOCIAL_PRESENCE.bark.rating}/5 across{" "}
                  {SOCIAL_PRESENCE.bark.reviewCount} on Bark.
                </p>
              </div>
              <Link
                href="/reviews"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                All reviews &amp; case studies
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-10 sm:grid-cols-2">
              {HOMEPAGE_REVIEWS.map((review) => (
                <figure key={`${review.author}-${review.date}`}>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    {"★".repeat(review.stars)} · {review.source}
                  </p>
                  <blockquote className="mt-3 text-base leading-relaxed text-foreground/90">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-medium text-foreground">
                      {review.author}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                From master profile to publishers, in four steps
              </h2>
              <p className="mt-4 text-muted-foreground">
                Capture once, audit and sync with approval, distribute honestly,
                then score and publish for search and AI.
              </p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item) => (
                <li key={item.step} className="relative">
                  <p className="text-xs font-semibold tracking-[0.18em] text-primary">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
            <Link
              href="/products/listings"
              className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              See Listings Management
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </section>

        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Plans
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Modular listings. Pay for the tier you need
              </h2>
              <p className="mt-4 text-muted-foreground">
                Reputation is included in Pro. Vertical networks are +$15/mo à
                la carte, not buried in a $999 bundle.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {LISTING_PLANS.map((plan) => (
                <div
                  key={plan.slug}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-card p-5",
                    plan.tier === "premium" && "border-primary/40 shadow-sm",
                  )}
                >
                  {plan.tier === "premium" ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      Most popular
                    </p>
                  ) : null}
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>
                  <p className="mt-3">
                    <span className="text-3xl font-bold">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /location/mo
                    </span>
                  </p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                    {plan.highlights.slice(0, 3).map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Reputation in Pro · Verticals +$15/mo
              </p>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/pricing" />}
              >
                See full pricing
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        <YextComparisonSection />

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Four pillars
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Listings first, then reputation, AI, and verticals
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Packaged as{" "}
              <Link
                href="/products/listings"
                className="font-medium text-primary hover:underline"
              >
                Listings
              </Link>
              ,{" "}
              <Link
                href="/products/reputation"
                className="font-medium text-primary hover:underline"
              >
                Reputation
              </Link>
              ,{" "}
              <Link
                href="/products/ai-visibility"
                className="font-medium text-primary hover:underline"
              >
                AI Visibility
              </Link>
              , and{" "}
              <Link
                href="/products/verticals"
                className="font-medium text-primary hover:underline"
              >
                Vertical Networks
              </Link>
              .
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((item) => (
              <div
                key={item.title}
                className="localmap-card-glow group rounded-2xl border bg-card p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <Link
                  href={item.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {item.linkLabel}
                  <ArrowRightIcon className="size-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  For agencies &amp; multi-location brands
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Every location follows the same playbook
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Import once, audit listings everywhere, fix what matters, and
                  turn recommendations into clear next steps for your team or
                  your clients.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {flywheel.map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
                      {step}
                    </span>
                    {index < flywheel.length - 1 && (
                      <ArrowRightIcon className="hidden size-4 text-muted-foreground sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                AI visibility
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Structured for assistants, after listings are clean
              </h2>
              <p className="mt-4 text-muted-foreground">
                Once the master profile and directories agree, publish
                machine-readable pages so ChatGPT, Gemini, and Google AI cite
                accurate facts.
              </p>
              <Link
                href="/products/ai-visibility"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Explore AI Visibility
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>
            <AiVisibilityShowcase />
          </div>
        </section>

        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 grid grid-cols-4 opacity-[0.18] dark:opacity-[0.22]">
            {HERITAGE_STRIP.map((src) => (
              <div key={src} className="relative min-h-[220px]">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/92 to-background" />
          <SurfaceGrain opacity={0.25} className="mix-blend-multiply dark:mix-blend-soft-light" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Proven locally
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  A Greenville agency, now a listings platform
                </h2>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                  Since {COMPANY.foundedYear}, Local Map Co. has helped local
                  brands get found with SEO, listings, and reputation. LocalMap
                  turns that operating model into software: approve-first sync,
                  real audits, and no fake syndication claims.{" "}
                  <Link
                    href="/about"
                    className="font-medium text-primary hover:underline"
                  >
                    Read the story
                  </Link>
                  .
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {HERITAGE_STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-semibold tracking-tight text-teal-700 dark:text-teal-300">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl overflow-hidden px-4 py-14 sm:px-6 sm:py-20">
          <div className="localmap-card-glow relative overflow-hidden rounded-3xl border">
            <div className="absolute inset-0">
              <Image
                src="/texture/hero-still.jpg"
                alt=""
                fill
                sizes="1152px"
                className="object-cover object-[50%_30%] opacity-35 dark:opacity-25"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/15" />
              <SurfaceGrain opacity={0.3} className="mix-blend-overlay" />
            </div>
            <div className="relative p-8 sm:p-10">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Start with your real business
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Connect Google, audit your publishers, and tighten the master
                  profile, then watch visibility improve with evidence you can
                  share.
                </p>
                <Button
                  className="mt-6"
                  nativeButton={false}
                  render={<Link href={workspaceHref} />}
                >
                  {session.userId ? "Open workspace" : "Create free workspace"}
                  <ArrowRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
