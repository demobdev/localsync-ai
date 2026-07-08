import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  CompassIcon,
  EyeIcon,
  LineChartIcon,
  MapPinIcon,
  MessageSquareIcon,
  NetworkIcon,
  RadarIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { AiVisibilityShowcase } from "@/components/marketing/distribution-visuals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Beacon — AI Visibility Agent | LocalMap",
  description:
    "Beacon is LocalMap's AI visibility agent. Agent-crawled visibility scoring across ChatGPT, Gemini, Perplexity, and Google — with an approve-first action plan that closes the gaps.",
};

const whyPillars = [
  {
    icon: RadarIcon,
    title: "Diagnose why you win or lose in AI",
    body: "Beacon doesn't stop at brand-level dashboards. It crawls what AI engines actually read about each location — your site, listings, and structured data — and shows the exact facts they can and can't see.",
  },
  {
    icon: WorkflowIcon,
    title: "Agentic execution, human approval",
    body: "Every gap becomes a prioritized action. AI drafts the fix — profile fields, FAQs, review replies — and nothing publishes until you approve it. Automation you can trust.",
  },
  {
    icon: NetworkIcon,
    title: "Built on your master profile",
    body: "Beacon executes from verified business data in your LocalMap master profile — not generic LLM guesses. One source of truth drives every page, listing, and AI-readable asset.",
  },
];

const dimensions = [
  {
    icon: EyeIcon,
    title: "Visibility monitoring",
    body: "Track how your business facts surface across Google and AI engines. Crawler checks verify that ChatGPT, Gemini, and Perplexity can actually read your published pages.",
  },
  {
    icon: NetworkIcon,
    title: "Structured distribution",
    body: "Schema.org JSON-LD, hosted visibility pages, and llms.txt — the machine-readable formats AI engines cite. Published from your profile with IndexNow pings on every update.",
  },
  {
    icon: MapPinIcon,
    title: "Listing accuracy",
    body: "Agent crawls of Yelp, BBB, and 20+ directories compare every public listing against your master profile and flag wrong phones, addresses, and hours with evidence.",
  },
  {
    icon: MessageSquareIcon,
    title: "Reviews & sentiment",
    body: "A unified review inbox with AI-drafted replies you approve before publishing. Review recency and response rate feed your visibility score.",
  },
];

const actionPlanSteps = [
  {
    step: "Notice",
    body: "Beacon's agents crawl your site, listings, and AI surfaces continuously.",
  },
  {
    step: "Recommend",
    body: "Every gap becomes a ranked action — scored by impact on your visibility.",
  },
  {
    step: "Approve",
    body: "You review AI-drafted fixes before anything goes live. Always.",
  },
  {
    step: "Execute",
    body: "Approved changes publish to your pages, listings rails, and llms.txt instantly.",
  },
];

const faqs = [
  {
    q: "What is Beacon?",
    a: "Beacon is LocalMap's AI visibility agent. It crawls your website and public listings with AI agents, scores how visible your business facts are to AI engines like ChatGPT, Gemini, and Perplexity, and turns every gap into a prioritized, approve-first action plan.",
  },
  {
    q: "How does Beacon gather AI visibility data?",
    a: "Beacon mirrors how AI engines discover businesses: agent crawls of your website and directory listings, extraction of the exact facts shown (name, phone, address, hours, services), verification that structured data exists (schema.org, llms.txt), and crawler checks that confirm AI systems can access your published pages.",
  },
  {
    q: "How is this different from a rank tracker?",
    a: "Rank trackers tell you where you appear. Beacon tells you why — by auditing the underlying facts AI engines read, then executing fixes from your verified master profile. Diagnosis and treatment, not just a symptom report.",
  },
  {
    q: "What does the free scan include?",
    a: "The free scan crawls your website and runs a 6-point AI readability check: business name, phone, address, hours, services, and structured data. The full report adds 20+ directory audits, NAP consistency, review health, and a prioritized action plan.",
  },
  {
    q: "Does Beacon change things without asking?",
    a: "No. Every AI-generated fix — profile updates, FAQs, review replies — goes through explicit approval before publishing. That's a core LocalMap principle: notice, recommend, approve, execute.",
  },
  {
    q: "Can agencies use Beacon across clients?",
    a: "Yes. Agency workspaces get Beacon across every client location — per-location scores, roll-up reporting, and a unified action queue for your team.",
  },
];

export default async function BeaconPage() {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={Boolean(session.userId)} />

      <main className="flex-1">
        {/* Hero */}
        <section className="localmap-mesh relative overflow-hidden border-b">
          <div className="localmap-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="max-w-xl space-y-6">
                <Badge
                  variant="secondary"
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
                >
                  <CompassIcon className="mr-1.5 inline size-3.5" />
                  Beacon · AI Visibility Agent
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.08]">
                  Optimize your visibility in AI search
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  AI is rewriting discovery. Beacon — LocalMap&apos;s AI
                  visibility agent — crawls what ChatGPT, Gemini, Perplexity,
                  and Google actually read about your business, then tells you
                  exactly what to fix and drafts the work for your approval.
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={<Link href="/grader" />}
                  >
                    Get your free visibility score
                    <ArrowRightIcon className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={
                      <Link href={session.userId ? "/dashboard" : "/sign-up"} />
                    }
                  >
                    {session.userId ? "Open workspace" : "Start free"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI engines cite brand-managed sources first. What you publish
                  is what AI trusts.
                </p>
              </div>

              <div className="lg:justify-self-end">
                <AiVisibilityShowcase />
              </div>
            </div>
          </div>
        </section>

        {/* Why AI chooses some brands */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Why AI chooses some businesses over others
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Diagnose. Prioritize. Execute — with approval.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {whyPillars.map((pillar) => (
              <Card key={pillar.title} className="localmap-card-glow">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <pillar.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{pillar.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Four dimensions */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                What drives AI to choose you
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Four dimensions of AI visibility
              </h2>
              <p className="mt-3 text-muted-foreground">
                Visibility isn&apos;t one number from a black box. Beacon
                measures the facts underneath — so every point on your score
                maps to something you can fix.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {dimensions.map((dimension) => (
                <Card key={dimension.title}>
                  <CardHeader className="flex flex-row items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <dimension.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {dimension.title}
                      </CardTitle>
                      <CardDescription className="mt-1.5">
                        {dimension.body}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Action plan */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Prioritized action plan
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Close gaps. Prove impact. Stay in control.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Beacon turns findings into a ranked queue of fixes. AI drafts the
              work; you approve it; the platform executes it. No risky
              auto-publishing.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actionPlanSteps.map((item, index) => (
              <Card key={item.step} className="localmap-card-glow">
                <CardHeader>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <CardTitle className="text-base">{item.step}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Score anatomy strip */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  The Visibility Score, explained
                </h2>
                <p className="text-muted-foreground">
                  Every location gets a 0–100 score built from profile
                  completeness, structured data, listing accuracy, published AI
                  pages, and review health. It moves when you fix things — and
                  we show you exactly which fix moves it most.
                </p>
                <ul className="space-y-2">
                  {[
                    "Profile completeness — the facts AI needs",
                    "Schema.org page + llms.txt published & crawlable",
                    "Listing consistency across 20+ directories",
                    "Review recency and response rate",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="localmap-card-glow justify-self-center p-2 lg:justify-self-end">
                <CardContent className="flex items-center gap-6 py-6">
                  <div className="text-center">
                    <p className="text-6xl font-bold tracking-tight text-primary">
                      86
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Visibility score
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <LineChartIcon className="size-4 text-primary" />
                      <span className="font-medium">+12 this month</span>
                    </p>
                    <p className="text-muted-foreground">
                      Published AI page, fixed 3 listings, replied to 8 reviews
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="mb-8 text-3xl font-bold tracking-tight">FAQs</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                  <CardDescription className="mt-1.5 leading-relaxed">
                    {faq.a}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t bg-primary text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
            <BotIcon className="mx-auto mb-4 size-8" />
            <h2 className="text-3xl font-bold tracking-tight">
              See exactly how AI sees your business — free
            </h2>
            <p className="mx-auto mt-3 max-w-xl opacity-90">
              20-second agent scan. No signup required. Don&apos;t let AI
              answers lose sight of your business.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6"
              nativeButton={false}
              render={<Link href="/grader" />}
            >
              <SparklesIcon className="size-4" />
              Run your free scan
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
