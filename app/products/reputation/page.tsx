import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  InboxIcon,
  MessageSquareTextIcon,
  PenLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reputation | LocalMap",
  description:
    "One review inbox for Google, Facebook, and Yelp with AI reply drafts you approve before anything publishes. Included with Pro Listings, no separate reputation SKU.",
};

const PROOF_POINTS = [
  {
    title: "One inbox, every platform",
    body: "Reviews from Google, Facebook, Yelp, and your tracked directories land in a single queue. No more tab-hopping to find what needs a reply.",
  },
  {
    title: "AI drafts. You approve. Always.",
    body: "Every reply is drafted in your voice and waits for your approval. Nothing auto-publishes. A bad AI reply on a 1-star review is worse than no reply.",
  },
  {
    title: "Included with Pro, not an upsell",
    body: "Reputation is folded into Pro Listings at $79/mo. Yext charges $999/yr for the tier that includes reviews.",
  },
];

const FEATURES = [
  {
    category: "Review inbox",
    icon: InboxIcon,
    title: "Every review, one queue, nothing missed",
    body: "New reviews stream into a unified inbox with rating, platform, and response status. Filter to what's unanswered, sort by severity, and clear the queue in one sitting.",
  },
  {
    category: "AI reply drafts",
    icon: PenLineIcon,
    title: "Replies drafted in your voice, ready in seconds",
    body: "AI reads the review, your business profile, and your services, then drafts a specific, empathetic reply, not a template. Edit it, approve it, or throw it out. Three free drafts before Pro, so you can judge the quality yourself.",
  },
  {
    category: "Approve-first",
    icon: ShieldCheckIcon,
    title: "The guardrail that makes AI safe for your reputation",
    body: "Auto-posted AI replies are how brands end up apologizing for their apology. On LocalMap the AI writes to drafts only. A human approves every word before it's published to the platform.",
  },
  {
    category: "Review signals",
    icon: TrendingUpIcon,
    title: "Reviews are ranking fuel. Treat them like it",
    body: "Recency, volume, rating, and response rate all feed local rankings and AI-assistant recommendations. Your review score sits next to your visibility score, so reputation work shows up in the same dashboard as listings work.",
  },
  {
    category: "Sentiment",
    icon: MessageSquareTextIcon,
    title: "Know what customers keep saying",
    body: "Recurring themes surface across reviews (the praised technician, the parking complaint) so you fix operational issues instead of just replying to them.",
  },
  {
    category: "Context",
    icon: SparklesIcon,
    title: "Reputation and listings in one platform",
    body: "The same master profile powers both. When a review mentions old hours or a wrong phone number, you fix the listing and the reply from the same workspace.",
  },
];

const FAQS = [
  {
    q: "Do AI replies publish automatically?",
    a: "No, and that's the point. Every AI draft waits in your queue until you approve it. You can edit before approving, or discard entirely. Auto-posting is how reputation tools damage reputations.",
  },
  {
    q: "Which review platforms are supported?",
    a: "Google, Facebook, and Yelp reviews flow into the inbox today, alongside review signals from your tracked directories. Publishing approved replies uses each platform's supported rail, labeled honestly like everything else in LocalMap.",
  },
  {
    q: "Why is Reputation part of Pro instead of a separate product?",
    a: "Because reviews and listings feed the same ranking systems, splitting them into separate SKUs just doubles your bill. Pro Listings ($79/location/mo) includes the review inbox, AI drafts, analytics, and the AI visibility layer.",
  },
  {
    q: "How is this different from Yext Reviews?",
    a: "Yext's reputation tools live in its $999/yr Premium tier behind a sales demo. LocalMap includes reputation in Pro at $79/mo, month-to-month, and makes approve-before-publish the default rather than an optional workflow setting.",
  },
  {
    q: "Can I try the AI drafts before paying?",
    a: "Yes. Every workspace gets three free AI reply drafts, so you can judge the writing quality on your own real reviews before upgrading.",
  },
  {
    q: "Do reviews really affect AI search?",
    a: "Yes. Assistants like ChatGPT and Gemini weigh review volume, rating, and recency when recommending local businesses. They cite the same public ecosystem Google reads. A well-managed review profile is a citation signal, not just social proof.",
  },
];

const INBOX_PREVIEW = [
  {
    platform: "Google",
    rating: 5,
    text: "Fast, professional, and they actually showed up on time.",
    status: "Draft ready",
    draft: true,
  },
  {
    platform: "Yelp",
    rating: 2,
    text: "Quoted one price on the phone and charged another…",
    status: "Needs reply",
    draft: false,
  },
  {
    platform: "Facebook",
    rating: 4,
    text: "Great work on the panel upgrade. Scheduling took a while.",
    status: "Approved",
    draft: false,
  },
];

export default async function ReputationProductPage() {
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
                  <StarIcon className="mr-1.5 inline size-3.5" />
                  Reputation · included with Pro
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.08]">
                  Every review answered. Nothing published without you.
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  One inbox for Google, Facebook, and Yelp. AI drafts replies in
                  your voice. You approve before anything goes live. Reply
                  fatigue ends; reputation risk doesn&apos;t begin.
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={<Link href={primaryHref} />}
                  >
                    {signedIn ? "Open workspace" : "Try 3 free AI drafts"}
                    <ArrowRightIcon className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/pricing" />}
                  >
                    See Pro pricing
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Part of Pro Listings · $79/location/mo · month-to-month
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-lg rounded-3xl border bg-card/80 p-6 shadow-xl shadow-primary/5 backdrop-blur-sm lg:justify-self-end">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <InboxIcon className="size-4" />
                    </div>
                    <p className="font-semibold">Review inbox</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    3 open
                  </Badge>
                </div>
                <div className="space-y-3">
                  {INBOX_PREVIEW.map((review) => (
                    <div
                      key={review.text}
                      className="rounded-xl border bg-background p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {review.platform}
                        </span>
                        <span className="text-xs text-amber-500">
                          {"★".repeat(review.rating)}
                          <span className="text-muted-foreground/40">
                            {"★".repeat(5 - review.rating)}
                          </span>
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        &ldquo;{review.text}&rdquo;
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            review.draft
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : undefined
                          }
                        >
                          {review.draft ? (
                            <SparklesIcon className="mr-1 size-3" />
                          ) : null}
                          {review.status}
                        </Badge>
                        {review.draft ? (
                          <span className="text-xs text-muted-foreground">
                            Awaiting your approval
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  AI drafts · human approves · then it publishes
                </p>
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
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Reviews are ranking signals. Reply fatigue is real.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Unanswered reviews cost rankings and trust, but replying to
              every one is a part-time job. LocalMap turns it into a review →
              draft → approve loop you can clear in minutes.
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

        <section className="border-y bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  vs Yext Reviews
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Their reputation tier costs more than our whole platform
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Yext gates review response and AI reputation tools behind its
                  $999/yr Premium tier. LocalMap folds reputation into Pro
                  Listings at $79/mo, alongside analytics, duplicate
                  detection, and the AI visibility layer.
                </p>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  "Included with Pro ($79/mo). Yext's reviews tier is $999/yr",
                  "Approve-before-publish is the default, not a workflow setting",
                  "3 free AI drafts to judge quality before you pay",
                  "Same workspace as listings. Fix the root cause, not just the reply",
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
            Reputation questions
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
              Clear your review queue this week
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Connect your profile, get three free AI drafts, and see how fast
              approve-first replies feel.
            </p>
            <Button
              size="lg"
              className="mt-5"
              nativeButton={false}
              render={<Link href={primaryHref} />}
            >
              Start free
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
