import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  GlobeIcon,
  RadarIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import {
  AiVisibilityShowcase,
  DistributionFlowVisual,
} from "@/components/marketing/distribution-visuals";
import { PublisherNetworkGrid } from "@/components/marketing/publisher-network-grid";
import { YextComparisonSection } from "@/components/marketing/yext-comparison-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: GlobeIcon,
    title: "Identity",
    body: "One canonical master profile for every location — versioned, auditable, always current.",
  },
  {
    icon: RadarIcon,
    title: "Distribution",
    body: "Honest publisher rails: API, guided import, manual, or audit-only. No fake syndication.",
  },
  {
    icon: BrainCircuitIcon,
    title: "Intelligence",
    body: "Audits, AI visibility, consistency scoring, and evidence-backed recommendations.",
  },
  {
    icon: WorkflowIcon,
    title: "Automation",
    body: "Notice → recommend → approve → execute. AI suggests; humans stay in control.",
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

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={Boolean(session.userId)} />

      <main className="flex-1">
        <section className="localmap-mesh relative overflow-hidden border-b">
          <div className="localmap-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="max-w-xl space-y-6">
                <Badge
                  variant="secondary"
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
                >
                  <SparklesIcon className="mr-1.5 inline size-3.5" />
                  LocalMap OS · powered by LocalSync
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                  What does the internet know about your business?
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  One entity profile. Honest listing tracking. AI-ready
                  visibility across Google, Apple, Yelp, and the assistants
                  shaping search — built for agencies and local brands.
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={
                      <Link
                        href={session.userId ? "/dashboard" : "/sign-up"}
                      />
                    }
                  >
                    {session.userId ? "Open workspace" : "Start free workspace"}
                    <ArrowRightIcon className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/scan" />}
                  >
                    Free AI visibility scan
                  </Button>
                </div>
              </div>

              <DistributionFlowVisual className="lg:justify-self-end" />
            </div>
          </div>
        </section>

        <PublisherNetworkGrid />

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                AI listings management
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Structured for Google, Apple Maps, ChatGPT, and Gemini
              </h2>
              <p className="mt-4 text-muted-foreground">
                As discovery shifts from blue links to AI answers, your master
                profile becomes machine-readable — schema.org, hosted pages, and
                llms.txt so assistants cite accurate facts.
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

        <YextComparisonSection />

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Four pillars
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Shopify for local businesses — not another listing tool
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Packaged as four products:{" "}
              <Link href="/products/listings" className="font-medium text-primary hover:underline">
                Listings
              </Link>
              ,{" "}
              <Link href="/products/reputation" className="font-medium text-primary hover:underline">
                Reputation
              </Link>
              ,{" "}
              <Link href="/products/ai-visibility" className="font-medium text-primary hover:underline">
                AI Visibility
              </Link>
              , and{" "}
              <Link href="/products/verticals" className="font-medium text-primary hover:underline">
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
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Agency flywheel
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Every client moves through the same lifecycle
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Import once, audit everywhere, fix what matters, and turn
                  recommendations into agency work or SaaS upsells — automatically.
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

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="localmap-card-glow rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 sm:p-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Dogfood your own GBP case study
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pick <strong className="text-foreground">Internet / SaaS</strong>{" "}
                or <strong className="text-foreground">Marketing agency</strong>{" "}
                at onboarding — LocalSync preloads the right services and
                description so you can build your Google Business Profile as you
                ship the product.
              </p>
              <Button
                className="mt-6"
                nativeButton={false}
                render={
                  <Link
                    href={session.userId ? "/dashboard" : "/sign-up"}
                  />
                }
              >
                Start your case study
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} LocalMap · Local Intelligence Platform</p>
          <p>
            Home services · Professional · Internet/SaaS · Healthcare · Retail
          </p>
        </div>
      </footer>
    </div>
  );
}
