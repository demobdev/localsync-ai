import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BotIcon,
  BrainCircuitIcon,
  CodeIcon,
  FileTextIcon,
  GlobeIcon,
  RadarIcon,
  SendIcon,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { AiVisibilityShowcase } from "@/components/marketing/distribution-visuals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AI Visibility | LocalMap",
  description:
    "Get cited by ChatGPT, Gemini, and Perplexity. Hosted machine-readable profile pages, schema.org, llms.txt, and IndexNow: the AI citation network, included with Pro.",
};

const PROOF_POINTS = [
  {
    title: "AI has no dashboard to log into",
    body: "ChatGPT and Gemini don't take profile edits. They cite the public web. The only way to manage what AI says about you is to publish accurate, structured facts where crawlers look.",
  },
  {
    title: "A citation source you actually control",
    body: "Every location gets a hosted, machine-readable profile page (schema.org markup, clean facts, no ads), purpose-built for assistants to read and cite.",
  },
  {
    title: "Measured, not assumed",
    body: "Visibility scans check how your business actually appears across search and AI surfaces, so you can watch citations improve instead of taking our word for it.",
  },
];

const FEATURES = [
  {
    category: "Hosted profile pages",
    icon: GlobeIcon,
    title: "A public page built for machines and humans",
    body: "Your master profile publishes to a hosted page (/l/your-business) with your name, hours, services, FAQs, and reviews: clean, fast, and structured so crawlers extract facts without guessing.",
  },
  {
    category: "schema.org",
    icon: CodeIcon,
    title: "Structured data that removes ambiguity",
    body: "LocalBusiness markup, service schemas, FAQ schemas: the vocabulary Google and LLM crawlers already trust, generated automatically from your profile. No hand-written JSON-LD.",
  },
  {
    category: "llms.txt",
    icon: FileTextIcon,
    title: "A plain-language brief for AI crawlers",
    body: "An llms.txt file summarizes your business in the format LLM crawlers are adopting, so when an assistant fetches your page, the important facts are impossible to miss.",
  },
  {
    category: "IndexNow",
    icon: SendIcon,
    title: "Updates pinged to search engines instantly",
    body: "When your profile changes, IndexNow notifies participating search engines immediately. No waiting for a recrawl while your old hours keep circulating.",
  },
  {
    category: "Visibility scans",
    icon: RadarIcon,
    title: "See yourself the way AI sees you",
    body: "Scans crawl your public presence and score how consistently and completely your business appears, with evidence for every finding and a history so you can track the trend.",
  },
  {
    category: "Crawler checks",
    icon: BotIcon,
    title: "Verify the crawlers are actually reading you",
    body: "We check that your hosted page and structured data are reachable and parseable by the crawlers that feed AI answers, because a citation source nobody can crawl is just a webpage.",
  },
];

const FAQS = [
  {
    q: "How do AI assistants decide which businesses to recommend?",
    a: "They synthesize from public sources: listings, reviews, websites, and structured data. Consistency and completeness across those sources make your business a safe fact to cite; contradictions make assistants skip you or cite something stale.",
  },
  {
    q: "What exactly do I get with AI Visibility?",
    a: "A hosted machine-readable profile page for each location, automatic schema.org markup, an llms.txt file, IndexNow pings on every update, visibility scans with history, and crawler reachability checks. It's included in Pro Listings, not a separate SKU.",
  },
  {
    q: "Can't I just add schema to my own website?",
    a: "You can, and you should. But hand-maintained markup drifts the moment your hours change. LocalMap generates it from the same master profile that feeds your listings, so your site, listings, and hosted page never disagree, which is the signal AI systems reward.",
  },
  {
    q: "How is this different from Yext's AI story?",
    a: "Yext structures your data for AI as part of its enterprise pitch, with Pages sold as a separate product behind a demo. LocalMap ships the whole citation layer (hosted pages, schema, llms.txt, IndexNow, scans) inside Pro at $79/mo, self-serve.",
  },
  {
    q: "How fast will I show up in ChatGPT answers?",
    a: "Honestly: it depends, and anyone promising a timeline is guessing. AI systems refresh their sources on their own schedules. What we control is making your facts accurate, structured, and crawlable everywhere, and measuring the change with scans.",
  },
  {
    q: "Do I need Pro for this?",
    a: "The free scan works for everyone. Run it anytime. The citation network itself (hosted pages, llms.txt, IndexNow, crawler checks) is a Pro feature at $79/location/mo.",
  },
];

export default async function AiVisibilityProductPage() {
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
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <Badge
                variant="secondary"
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
              >
                <BrainCircuitIcon className="mr-1.5 inline size-3.5" />
                AI Visibility · included with Pro
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.08]">
                When customers ask AI, make sure it answers with you
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Discovery is moving from blue links to AI answers. LocalMap
                publishes a machine-readable citation source for your business:
                hosted pages, schema.org, llms.txt, IndexNow. It measures
                whether it&apos;s working.
              </p>
              <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/grader" />}
                >
                  Run a free AI visibility scan
                  <ArrowRightIcon className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={primaryHref} />}
                >
                  {signedIn ? "Open workspace" : "Start free workspace"}
                </Button>
              </div>
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
              From profile to citation
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Your listing, the way an assistant reads it
            </h2>
            <p className="mt-4 text-muted-foreground">
              The same master profile that syncs your listings renders a
              structured public page, and that page is what AI assistants can
              fetch, parse, and cite.
            </p>
          </div>
          <AiVisibilityShowcase />
        </section>

        <section className="border-y bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                The citation network
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Five pieces, one job: make your facts citable
              </h2>
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
                  <h3 className="font-semibold leading-snug">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                vs the enterprise pitch
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                AI visibility shouldn&apos;t be an enterprise upsell
              </h2>
              <p className="mt-4 text-muted-foreground">
                Yext sells AI readiness across its top tiers and a separate
                Pages product, quoted through sales. LocalMap ships the entire
                citation layer inside Pro Listings at $79/location/mo,
                self-serve, month-to-month.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Hosted citation pages included, not a separate Pages product",
                  "llms.txt and IndexNow on by default, no configuration",
                  "Free scan for anyone. Measure before you spend a dollar",
                  "Honest about timelines: we control your facts, not AI's refresh cycle",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="localmap-card-glow rounded-2xl border bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What ships with Pro
              </p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "/l/your-business", note: "hosted, schema-rich profile page" },
                  { label: "llms.txt", note: "AI crawler brief, auto-generated" },
                  { label: "schema.org JSON-LD", note: "LocalBusiness + FAQ markup" },
                  { label: "IndexNow pings", note: "instant re-index on changes" },
                  { label: "Visibility scans", note: "scored, with history & evidence" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5"
                  >
                    <code className="text-sm font-semibold text-primary">
                      {item.label}
                    </code>
                    <span className="text-right text-xs text-muted-foreground">
                      {item.note}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                className="mt-5 w-full"
                variant="outline"
                nativeButton={false}
                render={<Link href="/pricing" />}
              >
                See Pro pricing
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl border-t px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            AI visibility questions
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
              Find out what AI already says about you
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              The free scan takes a minute and shows exactly where your facts
              are missing, wrong, or invisible.
            </p>
            <Button
              size="lg"
              className="mt-5"
              nativeButton={false}
              render={<Link href="/grader" />}
            >
              Run the free scan
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
