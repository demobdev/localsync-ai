import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BuildingIcon,
  CheckIcon,
  MinusIcon,
  RadarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  WorkflowIcon,
} from "lucide-react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { PublisherNetworkGrid } from "@/components/marketing/publisher-network-grid";
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
import { cn } from "@/lib/utils";

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

type MatrixValue = boolean | string;

type MatrixRow = {
  feature: string;
  basic: MatrixValue;
  premium: MatrixValue;
  pro: MatrixValue;
};

type MatrixGroup = {
  group: string;
  rows: MatrixRow[];
};

const COMPARISON_MATRIX: MatrixGroup[] = [
  {
    group: "Identity & audits",
    rows: [
      {
        feature: "Master business profile with version history",
        basic: true,
        premium: true,
        pro: true,
      },
      {
        feature: "NAP consistency tracking",
        basic: true,
        premium: true,
        pro: true,
      },
      {
        feature: "Listing audits with screenshot evidence",
        basic: true,
        premium: true,
        pro: true,
      },
      {
        feature: "Per-publisher guided checklists",
        basic: true,
        premium: true,
        pro: true,
      },
    ],
  },
  {
    group: "Sync & distribution",
    rows: [
      {
        feature: "Secondary + audit-only publishers",
        basic: true,
        premium: true,
        pro: true,
      },
      {
        feature: "Google, Apple, Bing, Facebook, Yelp + map graph",
        basic: false,
        premium: true,
        pro: true,
      },
      {
        feature: "Approve-first API profile sync",
        basic: false,
        premium: true,
        pro: true,
      },
      {
        feature: "Expanded publisher set",
        basic: false,
        premium: false,
        pro: true,
      },
      {
        feature: "Duplicate listing detection",
        basic: false,
        premium: false,
        pro: true,
      },
    ],
  },
  {
    group: "Intelligence & AI",
    rows: [
      {
        feature: "Visibility score & history",
        basic: false,
        premium: true,
        pro: true,
      },
      {
        feature: "Publisher analytics dashboards",
        basic: false,
        premium: false,
        pro: true,
      },
      {
        feature: "AI visibility pages (hosted profile, llms.txt)",
        basic: false,
        premium: false,
        pro: true,
      },
      {
        feature: "AI citation network (schema.org, IndexNow)",
        basic: false,
        premium: false,
        pro: true,
      },
      {
        feature: "Review inbox + AI reply drafts",
        basic: false,
        premium: false,
        pro: true,
      },
    ],
  },
  {
    group: "Add-ons",
    rows: [
      {
        feature: "Vertical directory networks",
        basic: "+$15/mo",
        premium: "+$15/mo",
        pro: "+$15/mo",
      },
    ],
  },
];

const VALUE_PROPS = [
  {
    icon: WorkflowIcon,
    title: "Approve-first, always",
    body: "AI drafts profile updates, FAQs, and review replies — nothing publishes until you approve it. No surprise edits to your listings.",
  },
  {
    icon: RadarIcon,
    title: "Honest rails, no fake syndication",
    body: "Every publisher is labeled API, guided, manual, or audit-only. You always know what actually syncs versus what we verify.",
  },
  {
    icon: TrendingUpIcon,
    title: "Built for the AI search shift",
    body: "Hosted machine-readable profiles, schema.org, and llms.txt so ChatGPT, Gemini, and Google AI cite accurate facts about your business.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Evidence, not promises",
    body: "Audits come with screenshots and crawl evidence. When we say a listing is wrong, you can see exactly what customers see.",
  },
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
    q: "What happens if I cancel?",
    a: "Your listings stay live — we never held them hostage in the first place. You keep your master profile export and audit history. Automation stops; the manual checklists keep working until the end of your billing period.",
  },
  {
    q: "Do you require an annual contract?",
    a: "No. Plans are month-to-month with a 14-day free trial on Premium and Pro. Annual billing is optional and saves roughly two months.",
  },
  {
    q: "How does agency pricing work?",
    a: "Agency workspaces manage multiple clients with per-location pricing and volume discounts at 10 / 50 / 100+ locations. Contact us for wholesale rates and white-label options.",
  },
];

function MatrixCell({ value }: { value: MatrixValue }) {
  if (value === true) {
    return <CheckIcon className="mx-auto size-4 text-primary" />;
  }
  if (value === false) {
    return <MinusIcon className="mx-auto size-4 text-muted-foreground/40" />;
  }
  return (
    <span className="block text-center text-xs font-medium text-muted-foreground">
      {value}
    </span>
  );
}

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
          <div className="grid gap-4 pt-3 md:grid-cols-3">
            {LISTING_PLANS.map((plan) => (
              <Card
                key={plan.slug}
                className={cn(
                  "localmap-card-glow relative overflow-visible",
                  plan.tier === "premium" && "border-primary/40 bg-primary/5",
                )}
              >
                {plan.tier === "premium" ? (
                  <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 shadow-sm">
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
                Compare plans in detail
              </h2>
              <p className="mt-2 text-muted-foreground">
                Every tier keeps the manual path. Upgrades unlock automation,
                the major platforms, and the AI discovery layer.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 font-semibold">Feature</th>
                    {LISTING_PLANS.map((plan) => (
                      <th
                        key={plan.slug}
                        className={cn(
                          "w-32 px-4 py-3 text-center font-semibold",
                          plan.tier === "premium" && "text-primary",
                        )}
                      >
                        {plan.name.replace(" Listings", "")}
                        <span className="block text-xs font-normal text-muted-foreground">
                          ${plan.priceMonthly}/mo
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_MATRIX.map((section) => (
                    <Fragment key={section.group}>
                      <tr className="border-b bg-muted/20">
                        <td
                          colSpan={4}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {section.group}
                        </td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.feature} className="border-b last:border-b-0">
                          <td className="px-4 py-3">{row.feature}</td>
                          <td className="px-4 py-3">
                            <MatrixCell value={row.basic} />
                          </td>
                          <td className="bg-primary/[0.03] px-4 py-3">
                            <MatrixCell value={row.premium} />
                          </td>
                          <td className="px-4 py-3">
                            <MatrixCell value={row.pro} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
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
        </section>

        <section className="border-y bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  The math vs Yext
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Modular beats the bundle
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Yext&apos;s Premium tier runs $999/yr per location — and you
                  pay for every vertical network whether your category needs it
                  or not. With LocalMap, a dentist pays for Premium plus
                  Healthcare. Nothing else.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <strong>No annual lock-in.</strong> Month-to-month, cancel
                      anytime, listings stay live.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <strong>No pay-to-see pricing.</strong> Every price is on
                      this page. Agencies get volume rates, not mystery quotes.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <strong>AI visibility included in Pro.</strong> Hosted
                      machine-readable profiles that assistants can actually
                      cite — not an enterprise upsell.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="localmap-card-glow overflow-hidden rounded-2xl border bg-card">
                <div className="grid grid-cols-2 border-b bg-muted/40 text-sm font-semibold">
                  <div className="px-4 py-3">Yext Premium</div>
                  <div className="border-l px-4 py-3 text-primary">
                    LocalMap Premium + 1 vertical
                  </div>
                </div>
                <div className="grid grid-cols-2 text-sm">
                  <div className="space-y-2 px-4 py-4 text-muted-foreground">
                    <p className="text-2xl font-bold text-foreground">
                      $999<span className="text-sm font-normal">/yr</span>
                    </p>
                    <p>≈ $83/mo per location</p>
                    <p>All verticals bundled, needed or not</p>
                    <p>Annual contract</p>
                  </div>
                  <div className="space-y-2 border-l px-4 py-4 text-muted-foreground">
                    <p className="text-2xl font-bold text-foreground">
                      $64<span className="text-sm font-normal">/mo</span>
                    </p>
                    <p>$49 Premium + $15 add-on</p>
                    <p>Only the vertical you need</p>
                    <p>Month-to-month, 14-day trial</p>
                  </div>
                </div>
                <div className="border-t bg-primary/5 px-4 py-3 text-center text-sm font-medium text-primary">
                  ~23% less — and modular
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Every plan is built on the same principles
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((item) => (
              <div
                key={item.title}
                className="localmap-card-glow rounded-2xl border bg-card p-5"
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

        <div className="border-t bg-muted/20">
          <PublisherNetworkGrid />
        </div>

        <section className="mx-auto max-w-3xl border-t px-4 py-14 sm:px-6">
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
