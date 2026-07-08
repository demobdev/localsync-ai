import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  GavelIcon,
  LandmarkIcon,
  LayersIcon,
  StethoscopeIcon,
  UtensilsIcon,
  WrenchIcon,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Vertical Networks — LocalMap",
  description:
    "Industry directory networks as $15/mo add-ons: Healthcare, Legal, Home Services, Restaurant, and Financial Services. Pay for the network your category needs — not a Yext bundle.",
};

const VERTICALS = [
  {
    icon: StethoscopeIcon,
    name: "Healthcare",
    who: "Practices, clinics, and providers",
    publishers: "Healthgrades, WebMD, Vitals, Zocdoc-class directories",
    fields:
      "Provider profiles, specialties, insurance acceptance, appointment info",
  },
  {
    icon: GavelIcon,
    name: "Legal",
    who: "Firms and solo attorneys",
    publishers: "Avvo, FindLaw, Justia, Martindale-class directories",
    fields: "Practice areas, attorney profiles, bar listings, consultations",
  },
  {
    icon: WrenchIcon,
    name: "Home Services",
    who: "Contractors, plumbers, electricians, HVAC",
    publishers: "Angi, HomeAdvisor, Thumbtack, Houzz-class directories",
    fields: "Service areas, licenses, emergency hours, project galleries",
  },
  {
    icon: UtensilsIcon,
    name: "Restaurant",
    who: "Restaurants, cafés, and hospitality",
    publishers: "Menu platforms, reservation rails, delivery platform links",
    fields: "Menus, reservations, ordering links, holiday hours",
  },
  {
    icon: LandmarkIcon,
    name: "Financial Services",
    who: "Advisors, branches, and agencies",
    publishers: "Advisor and branch directories, insurance networks",
    fields: "Advisor profiles, products, compliance-oriented disclosures",
  },
];

const FAQS = [
  {
    q: "How do vertical add-ons work?",
    a: "Each add-on is $15/location/mo on top of any listing tier. It extends your workspace with the industry directories that matter for your category — tracked, audited, and managed through the same honest rails as everything else.",
  },
  {
    q: "Why not just bundle them like Yext does?",
    a: "Because a plumber shouldn't pay for healthcare directories. Yext folds vertical networks into its top tiers and enterprise deals, so you buy the whole bundle to get one industry. Modular add-ons keep the base price low and the bill legible.",
  },
  {
    q: "Can I add more than one vertical?",
    a: "Yes — add-ons stack. A med-spa might run Healthcare plus Restaurant-style booking rails; an agency can mix add-ons per client location. Each is $15/mo and can be dropped anytime.",
  },
  {
    q: "Do vertical directories really matter for rankings?",
    a: "For regulated and high-consideration categories, yes. Search engines and AI assistants weight category-authoritative sources — a dentist cited consistently on healthcare directories reads as more trustworthy than one who only exists on generic maps.",
  },
  {
    q: "What do I need before adding a vertical?",
    a: "Any listing tier works. Basic gets vertical tracking and guided checklists; Premium and Pro layer approve-first sync and the AI visibility stack on top. Most vertical directories use guided or manual rails today — labeled honestly, as always.",
  },
  {
    q: "I'm an agency with clients in different industries. How does this price?",
    a: "Per location, per add-on — so each client only carries the network their category needs. Volume discounts apply at 10 / 50 / 100+ locations across your workspace.",
  },
];

export default async function VerticalsProductPage() {
  const session = await auth();
  const signedIn = Boolean(session.userId);
  const primaryHref = signedIn ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={signedIn} />

      <main className="flex-1">
        <section className="localmap-mesh relative overflow-hidden border-b">
          <div className="localmap-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
            >
              <LayersIcon className="mr-1.5 inline size-3.5" />
              Vertical networks · $15/mo add-ons
            </Badge>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.08]">
              The directories your industry trusts — à la carte
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              A dentist needs Healthgrades. A plumber needs Angi. Nobody needs
              both — so we don&apos;t sell them as a bundle. Add the network
              your category needs for $15/location/mo.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
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
                render={<Link href="/pricing" />}
              >
                See full pricing
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
            <div>
              <h2 className="font-semibold">Five networks, one price each</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Healthcare, Legal, Home Services, Restaurant, and Financial
                Services — each a flat $15/location/mo on any tier.
              </p>
            </div>
            <div>
              <h2 className="font-semibold">Category authority is a signal</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Search engines and AI assistants weight industry directories
                when ranking regulated, high-trust categories.
              </p>
            </div>
            <div>
              <h2 className="font-semibold">Built for mixed-client agencies</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Assign add-ons per location, so every client pays only for
                their industry&apos;s network.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              The networks
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Pick your industry. Skip the rest.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((vertical) => (
              <div
                key={vertical.name}
                className="localmap-card-glow flex flex-col rounded-2xl border bg-card p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <vertical.icon className="size-5" />
                  </div>
                  <Badge variant="outline">+$15/mo</Badge>
                </div>
                <h3 className="mt-4 font-semibold">{vertical.name}</h3>
                <p className="text-xs text-muted-foreground">{vertical.who}</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">
                      Directories:
                    </span>{" "}
                    {vertical.publishers}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Synced fields:
                    </span>{" "}
                    {vertical.fields}
                  </p>
                </div>
              </div>
            ))}
            <div className="localmap-card-glow flex flex-col justify-center rounded-2xl border border-dashed bg-card p-5 text-center">
              <h3 className="font-semibold">Don&apos;t see your industry?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Category packs cover 20 niches today, and new vertical networks
                ship as their rails come online. Tell us what you need.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mx-auto mt-4"
                nativeButton={false}
                render={<Link href="/sign-up" />}
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
                  One industry shouldn&apos;t cost the whole bundle
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Yext ties vertical networks to its top tiers and enterprise
                  agreements — to get healthcare directories you often buy a
                  $999/yr plan or a custom deal. LocalMap prices the network
                  itself: $15/mo on top of whatever tier you already run.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Premium + Healthcare = $64/mo — vs Yext Premium at ~$83/mo",
                    "Add-ons stack and can be dropped anytime, per location",
                    "Same audits, evidence, and honest rail labels as core listings",
                    "Agencies mix add-ons across clients instead of upgrading everyone",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="localmap-card-glow overflow-hidden rounded-2xl border bg-card">
                <div className="grid grid-cols-2 border-b bg-muted/40 text-sm font-semibold">
                  <div className="px-4 py-3">Yext (bundled)</div>
                  <div className="border-l px-4 py-3 text-primary">
                    LocalMap (modular)
                  </div>
                </div>
                <div className="grid grid-cols-2 text-sm">
                  <div className="space-y-2 px-4 py-4 text-muted-foreground">
                    <p className="text-2xl font-bold text-foreground">
                      $999<span className="text-sm font-normal">/yr</span>
                    </p>
                    <p>Premium tier or enterprise deal</p>
                    <p>Every vertical, needed or not</p>
                    <p>Annual contract, demo first</p>
                  </div>
                  <div className="space-y-2 border-l px-4 py-4 text-muted-foreground">
                    <p className="text-2xl font-bold text-foreground">
                      $34<span className="text-sm font-normal">/mo</span>
                    </p>
                    <p>Basic ($19) + one vertical ($15)</p>
                    <p>Only your industry&apos;s network</p>
                    <p>Month-to-month, self-serve</p>
                  </div>
                </div>
                <div className="border-t bg-primary/5 px-4 py-3 text-center text-sm font-medium text-primary">
                  Start vertical-first from $34/mo
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Vertical network questions
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
              See how your industry presence scores today
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              The free scan checks your visibility across general and
              industry surfaces — before you add anything.
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
