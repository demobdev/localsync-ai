import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  Layers3Icon,
  LocateFixedIcon,
  RouteIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

import { CategoryPackExplorer } from "@/components/marketing/category-pack-explorer";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ProductFamilyNav } from "@/components/marketing/product-family-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_PACK_PRICE_MONTHLY,
  CATEGORY_PACKS,
} from "@/lib/verticals/category-pack-catalog";

export const metadata: Metadata = {
  title: "Category Packs | LocalMap",
  description:
    "Industry-specific profile fields, priority publishers, guided work, and evidence-backed results for $15 per location per month.",
};

const CATEGORY_COUNT = new Set(
  CATEGORY_PACKS.flatMap((pack) => pack.categorySlugs),
).size;

const PACK_VALUE = [
  {
    icon: Layers3Icon,
    title: "A category-ready profile",
    body: "The fields your niche needs but a generic name-address-phone record cannot hold.",
  },
  {
    icon: LocateFixedIcon,
    title: "A priority publisher plan",
    body: "The useful category surfaces, ranked by the role they play in discovery and trust.",
  },
  {
    icon: RouteIcon,
    title: "The right delivery rail",
    body: "Direct, guided, manual, or audit-only is shown before the work starts, never hidden.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "An evidence-backed result",
    body: "A status, proof of what is live, and the next action for every publisher in the pack.",
  },
] as const;

const FAQS = [
  {
    q: "Is a Category Pack just a list of directory links?",
    a: "No. The publisher list is only one layer. A pack also adds the category-specific fields to collect, a prioritized work plan, honest delivery rails, and a result record with evidence and next actions.",
  },
  {
    q: "Does every category publisher sync automatically?",
    a: "No. Google is the direct core connector today. Category publishers are labeled guided, manual, or audit-only depending on what each platform actually supports. We never call an audit or checklist a sync.",
  },
  {
    q: "What does the $15 per month pay for?",
    a: "It activates the category profile, priority publisher workflow, recurring checks, and evidence history for one location. It is operational software and ongoing monitoring, not a one-time PDF.",
  },
  {
    q: "Do I need more than one pack?",
    a: "Usually no. A dentist needs Healthcare; a plumber needs Home services. A genuinely multi-category location can add another pack, but the default is one clear pack matched to its primary business category.",
  },
  {
    q: "Are all industries covered?",
    a:
      "The current catalog covers all " +
      CATEGORY_COUNT +
      " categories available during LocalMap onboarding. New categories should only launch after their profile fields, publishers, delivery rails, and evidence rules are defined.",
  },
  {
    q: "Can an agency mix packs across clients?",
    a: "Yes. Packs attach per location, so an agency can run Legal for one client and Restaurant for another without upgrading every client into the same oversized bundle.",
  },
];

export default async function VerticalsProductPage() {
  const session = await auth();
  const signedIn = Boolean(session.userId);
  const primaryHref = signedIn ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-full flex-col bg-[#f5faf9]">
      <MarketingHeader signedIn={signedIn} />
      <ProductFamilyNav active="verticals" />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#071f2d] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(32,201,181,0.20),transparent_34%),radial-gradient(circle_at_82%_70%,rgba(255,177,92,0.15),transparent_32%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="rounded-full border-[#65dfd0]/35 bg-[#65dfd0]/12 px-3 py-1 text-[#9ff3e8]">
                <SparklesIcon className="mr-1.5 inline size-3.5" />
                {CATEGORY_COUNT} categories ready today
              </Badge>
              <h1 className="mt-7 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl sm:leading-[1.02]">
                Your category changes the work.{" "}
                <span className="text-[#73e2d5]">Not the price.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/68 sm:text-xl">
                Core Listings controls the facts. A Category Pack adds the
                fields, publishers, checks, and tasks your niche needs—for{" "}
                <strong className="font-semibold text-white">
                  {"$"}
                  {CATEGORY_PACK_PRICE_MONTHLY}/location/mo
                </strong>
                .
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-[#67e3d5] text-[#062b31] hover:bg-[#91eee4]"
                  nativeButton={false}
                  render={<Link href={primaryHref} />}
                >
                  {signedIn ? "Open workspace" : "Match my category"}
                  <ArrowRightIcon className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  nativeButton={false}
                  render={<Link href="#explore-packs" />}
                >
                  Explore every pack
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:mr-0">
              <div className="absolute -inset-6 rounded-[3rem] bg-[#20c9b5]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.07] p-3 shadow-2xl backdrop-blur-sm">
                <div className="rounded-[1.45rem] bg-[#f7fbfa] p-5 text-[#092d3b] sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
                        Location match
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        Bailey Plumbing Co.
                      </p>
                    </div>
                    <span className="grid size-11 place-items-center rounded-2xl bg-[#dff4f0] text-[#0f766e]">
                      <BadgeCheckIcon className="size-5" />
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#082b3a] p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-white/50">Recommended pack</p>
                        <p className="mt-1 font-semibold">Home services</p>
                      </div>
                      <Badge className="bg-[#67e3d5] text-[#073039]">
                        +$15/mo
                      </Badge>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      {[
                        ["5", "publishers"],
                        ["4", "profile fields"],
                        ["3", "work rails"],
                      ].map(([value, label]) => (
                        <div key={label} className="rounded-xl bg-white/7 p-3">
                          <p className="text-xl font-semibold text-[#7de8da]">
                            {value}
                          </p>
                          <p className="mt-1 text-[10px] leading-tight text-white/48">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {["Angi Pro", "Thumbtack", "Houzz"].map(
                      (publisher, index) => (
                        <div
                          key={publisher}
                          className="flex items-center justify-between rounded-xl border border-[#dceae8] bg-white px-3.5 py-3"
                        >
                          <span className="flex items-center gap-2.5 text-sm font-medium">
                            <CheckCircle2Icon className="size-4 text-[#0f766e]" />
                            {publisher}
                          </span>
                          <span className="text-[11px] text-[#668087]">
                            {index === 2 ? "Audit-only" : "Manual"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#cfe3e0] bg-white">
          <div className="mx-auto grid max-w-6xl gap-px bg-[#dce9e7] sm:grid-cols-2 lg:grid-cols-4">
            {PACK_VALUE.map((item) => (
              <div key={item.title} className="bg-white px-5 py-7 sm:px-6">
                <item.icon className="size-5 text-[#0f766e]" />
                <h2 className="mt-4 font-semibold text-[#092d3b]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#60777e]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="explore-packs"
          className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                Choose a category
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#092d3b] sm:text-5xl">
                See exactly what your $15 unlocks.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[#55727a]">
                Each pack is a small operating system for one category—not a
                vague bundle of logos. Pick an industry to inspect its fields,
                publisher plan, delivery rails, and finished result.
              </p>
            </div>
            <div className="mt-10">
              <CategoryPackExplorer />
            </div>
          </div>
        </section>

        <section className="border-y border-[#244652] bg-[#0a2c3a] px-4 py-16 text-white sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#73e2d5]">
                Modular by design
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Don&apos;t make a dentist fund a contractor directory.
              </h2>
              <p className="mt-4 leading-relaxed text-white/65">
                Traditional bundles optimize for the size of the network.
                LocalMap optimizes for relevance: one core listing system, then
                only the category work this location can actually use.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Core Listings", "Google connection, master profile, audits"],
                ["One Category Pack", "Industry fields, publishers, work plan"],
                ["One clear bill", "$15 per selected location each month"],
                ["One honest result", "Live status, evidence, and next action"],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"
                >
                  <ShieldCheckIcon className="size-5 text-[#73e2d5]" />
                  <p className="mt-4 font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
              Straight answers
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#092d3b] sm:text-4xl">
              Category Pack questions
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-[#c9e2df] bg-white p-6"
              >
                <h3 className="font-semibold text-[#092d3b]">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5a747b]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-[2rem] bg-[#f1c27d] p-7 text-[#173440] sm:p-10">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Start with the facts already on the web.
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#37535c]">
                  Run the free scan, see the gaps, then match the location to
                  the category work that will actually improve it.
                </p>
              </div>
              <Button
                size="lg"
                className="shrink-0 bg-[#082b3a] text-white hover:bg-[#0d3d4e]"
                nativeButton={false}
                render={<Link href="/grader" />}
              >
                Run the free scan
                <ScanSearchIcon className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
