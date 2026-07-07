import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  SparklesIcon,
} from "lucide-react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LISTING_PLANS } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Pricing — LocalMap",
  description:
    "Modular listing packages. Pay for the tier and vertical networks you need — not a bundle you don't.",
};

const VERTICAL_ADDONS = [
  { name: "Healthcare", note: "Healthgrades, WebMD, Zocdoc-class directories" },
  { name: "Legal", note: "Avvo, FindLaw, Justia-class directories" },
  { name: "Home Services", note: "Angi, HomeAdvisor, Thumbtack-class directories" },
  { name: "Restaurant", note: "Menus, reservations, delivery platform links" },
  { name: "Financial Services", note: "Advisor & branch directories" },
];

const FAQS = [
  {
    q: "Why is LocalMap cheaper than Yext?",
    a: "Yext bundles vertical networks into $999/yr tiers. We sell modular: pick a listing tier, add only the vertical network your category needs. A contractor doesn't pay for healthcare directories.",
  },
  {
    q: "What does \"approve-first sync\" mean?",
    a: "Nothing publishes without your approval. AI drafts profile updates, FAQs, and review replies — you review, approve, and we execute. No surprise edits to your listings.",
  },
  {
    q: "Can I do everything manually on Basic?",
    a: "Yes. Basic gives you the master profile, audits, NAP tracking, and per-publisher checklists. Premium and Pro automate the same work — the manual path never disappears.",
  },
  {
    q: "How does agency pricing work?",
    a: "Agency workspaces manage multiple clients with per-location pricing and volume discounts at 10 / 50 / 100+ locations. Contact us for wholesale rates and white-label options.",
  },
];

export default async function PricingPage() {
  const session = await auth();
  const signedIn = Boolean(session.userId);
  const ctaHref = signedIn ? "/dashboard/billing" : "/sign-up";

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={signedIn} />

      <main className="flex-1">
        <section className="localmap-mesh relative overflow-hidden border-b">
          <div className="localmap-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
            >
              <SparklesIcon className="mr-1.5 inline size-3.5" />
              Simple, modular pricing
            </Badge>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Pay for what your business needs. Nothing else.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Every plan is per location, per month. Manual workflows are always
              included — upgrades buy automation, not access.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {LISTING_PLANS.map((plan) => (
              <Card
                key={plan.slug}
                className={
                  plan.tier === "premium"
                    ? "localmap-card-glow relative border-primary/40 bg-primary/5"
                    : "localmap-card-glow"
                }
              >
                {plan.tier === "premium" ? (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    Most popular
                  </Badge>
                ) : null}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                  <p className="pt-1">
                    <span className="text-4xl font-bold">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /location/mo
                    </span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <ul className="flex-1 space-y-2 text-sm">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.tier === "premium" ? "default" : "outline"}
                    nativeButton={false}
                    render={<Link href={ctaHref} />}
                  >
                    {signedIn ? "Choose plan" : "Start free"}
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Premium and Pro include a 14-day free trial. Annual billing saves
            ~2 months.
          </p>
        </section>

        <section className="border-t bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Vertical add-ons — $15/mo each
              </h2>
              <p className="mt-2 text-muted-foreground">
                Yext bundles these into $999/yr tiers. We sell them à la carte —
                a dentist adds Healthcare, a plumber adds Home Services.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VERTICAL_ADDONS.map((addon) => (
                <div
                  key={addon.name}
                  className="localmap-card-glow flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{addon.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {addon.note}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    +$15/mo
                  </Badge>
                </div>
              ))}
              <div className="localmap-card-glow flex items-center justify-between gap-3 rounded-2xl border border-dashed bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <BuildingIcon className="size-4 text-primary" />
                    Agencies & enterprise
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Volume discounts at 10 / 50 / 100+ locations
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/sign-up" />}
                  className="shrink-0"
                >
                  Talk to us
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pricing questions
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
              Not sure which tier fits?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Run the free AI visibility scan — we&apos;ll show you exactly
              what&apos;s broken and which plan fixes it.
            </p>
            <Button
              size="lg"
              className="mt-5"
              nativeButton={false}
              render={<Link href="/scan" />}
            >
              Get your free score
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
