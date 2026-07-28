import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CheckIcon,
  EyeIcon,
  LinkIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";
import { HOMEPAGE_REVIEWS, SOCIAL_PRESENCE } from "@/lib/brand/external-reviews";

const productionHero = "/marketing/localmap-signal-main-street-hero.png";

const clientWork = [
  ["Video", "Swamp Rabbit Moving", "/reviews/video-swamp-rabbit.png"],
  ["Video", "Wiz Team", "/reviews/video-wiz-team.png"],
  ["Video", "Mr. Seafood", "/reviews/video-mr-seafood.png"],
  ["Campaign", "Trial Masters", "/reviews/creative-ad-trial-masters.jpg"],
  ["Website", "Modern Chiropractic", "/reviews/case-modern-chiropractic.png"],
  ["Website", "Tesla Electric", "/reviews/case-tesla-electric.png"],
  ["Website", "Stoney Craven", "/reviews/case-stoney-craven.png"],
  ["Website", "Disability HC", "/reviews/case-disability-hc.png"],
  ["Website", "Masstar Signs", "/reviews/case-masstar-signs.png"],
  ["Video", "Sofrito", "/reviews/video-sofrito.png"],
  ["Video", "Andy Thomas", "/reviews/video-andy-thomas.png"],
  ["Video", "Local Fig", "/reviews/video-local-fig.png"],
] as const;

const workflow = [
  {
    icon: LinkIcon,
    step: "01",
    title: "Connect the account",
    body: "Authorize Google and choose the exact listing you manage. No pasted URL required for the direct workflow.",
  },
  {
    icon: EyeIcon,
    step: "02",
    title: "Review the truth",
    body: "Compare every supported field against your Master Profile, then choose which direction each change should go.",
  },
  {
    icon: BadgeCheckIcon,
    step: "03",
    title: "Verify the result",
    body: "LocalMap re-reads the publisher after an update. Only a confirmed match earns the Live & synced label.",
  },
] as const;

const statuses = [
  ["Connected", "The publisher account is authorized and the listing is linked."],
  ["Needs review", "LocalMap found a real difference and is waiting for your decision."],
  ["Pending verification", "An update was sent; the fresh publisher read has not confirmed it yet."],
  ["Live & synced", "The listing is verified and every supported field matches."],
] as const;

const plans = [
  {
    name: "Basic Listings",
    description: "Citation cleanup on your own steam",
    price: 19,
    featured: false,
    features: [
      "Secondary + audit-only publishers",
      "NAP consistency tracking",
      "Manual & guided checklists",
    ],
  },
  {
    name: "Premium Listings",
    description: "The majors, synced and monitored",
    price: 49,
    featured: true,
    features: [
      "Google, Apple, Bing, Facebook, Yelp + map graph",
      "Approve-first profile sync",
      "Visibility score & history",
    ],
  },
  {
    name: "Pro Listings",
    description: "Automation + AI discovery layer",
    price: 79,
    featured: false,
    features: [
      "Analytics & duplicate detection",
      "Expanded publisher set",
      "AI visibility pages (/l/[id], llms.txt)",
    ],
  },
] as const;

function ProfileStatusCard() {
  return (
    <div className="w-full max-w-sm rounded-[1.6rem] border border-white/15 bg-[#103e48]/80 p-5 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.18em] text-cyan-200 uppercase">
            Live status
          </p>
          <p className="mt-1 text-sm font-medium">Your business profile</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-lime-300 text-[#062f3a]">
          <BadgeCheckIcon className="size-5" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Master Profile</p>
              <p className="text-[0.68rem] text-white/45">Name, phone, hours, services</p>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[0.62rem] text-lime-200">
              Approved
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-lime-200/20 bg-lime-200/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Google Business Profile</p>
              <p className="text-[0.68rem] text-white/45">Re-read after the latest update</p>
            </div>
            <span className="rounded-full bg-lime-300 px-2 py-1 text-[0.62rem] font-semibold text-[#062f3a]">
              Synced
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 flex gap-2 text-[0.68rem] leading-relaxed text-white/45">
        <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-200" />
        “Live & synced” appears only after publisher verification.
      </p>
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session.userId);
  const workspaceHref = signedIn ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={signedIn} />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-[#062f3a] text-white">
          <Image
            src={productionHero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-30 object-cover object-center"
          />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,#062f3a_0%,rgba(6,47,58,.96)_42%,rgba(6,47,58,.42)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,47,58,.1),rgba(6,47,58,.2))]" />
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.72fr] lg:px-8">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-white/8 px-3 py-1.5 text-[0.68rem] font-bold tracking-[0.18em] text-cyan-100 uppercase">
                <span className="size-1.5 rounded-full bg-lime-300" />
                Local business truth, everywhere
              </p>
              <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl lg:leading-[0.94]">
                Be the business the internet gets right.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                One approved profile keeps your Google listing accurate today—and
                gives every other directory a clear source of truth tomorrow. You
                see every difference. You approve every move.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-full bg-lime-300 text-[#062f3a] hover:bg-lime-200"
                  nativeButton={false}
                  render={<Link href="/grader" />}
                >
                  Check my visibility
                  <ArrowRightIcon className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  nativeButton={false}
                  render={<Link href={workspaceHref} />}
                >
                  {signedIn ? "Open workspace" : "Create free workspace"}
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
                {["Google connected", "Approve every change", "Verified after sync"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <CheckIcon className="size-3.5 text-cyan-200" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <ProfileStatusCard />
            </div>
          </div>
        </section>

        <section className="border-b bg-[#071f26] py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-cyan-200 uppercase">
              Client work · archive
            </p>
            <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  The work that built the playbook.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
                  Selected client projects from our earlier agency years—not a
                  claim of recent production. The lessons behind them now shape
                  the LocalMap product.
                </p>
              </div>
              <p className="text-xs text-white/35">Swipe to explore client work</p>
            </div>
            <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
              {clientWork.map(([type, name, src]) => (
                <article
                  key={name}
                  className="group relative aspect-[4/3] min-w-[260px] snap-start overflow-hidden rounded-2xl border border-white/10 sm:min-w-[320px]"
                >
                  <Image src={src} alt="" fill sizes="320px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[0.65rem] font-bold tracking-[0.16em] text-cyan-200 uppercase">{type}</p>
                    <h3 className="mt-1 text-lg font-semibold">{name}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,.08),transparent_36%)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr]">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">A clearer workflow</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
                  One source of truth. Three deliberate moves.
                </h2>
                <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
                  Local listings software should remove uncertainty, not hide it.
                  The product always tells you what is connected, what differs,
                  what needs approval, and what has actually been verified.
                </p>
                <Link href="/products/listings" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Explore the listings workflow <ArrowRightIcon className="size-4" />
                </Link>
              </div>
              <ol className="grid gap-4 sm:grid-cols-3">
                {workflow.map(({ icon: Icon, step, title, body }) => (
                  <li key={step} className="rounded-[1.6rem] border bg-background/82 p-6 shadow-[0_18px_60px_rgba(8,52,60,.06)]">
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div>
                      <span className="text-xs font-bold tracking-[0.18em] text-muted-foreground/55">{step}</span>
                    </div>
                    <h3 className="mt-7 text-xl font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-b bg-[#082b34] text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-lime-200 uppercase">Honest by design</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Statuses that mean something.</h2>
            <p className="mt-5 max-w-2xl text-white/55">
              You should never have to guess whether “done” means connected,
              submitted, or actually correct. LocalMap makes the state visible.
            </p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-[1.6rem] bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {statuses.map(([title, body]) => (
                <div key={title} className="bg-[#082b34] p-6 sm:p-7">
                  <BadgeCheckIcon className="size-5 text-lime-300" />
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">Proof from business owners</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Getting found changes the conversation.</h2>
                <p className="mt-4 text-muted-foreground">
                  Real feedback from the client relationships that shaped our local search playbook. {SOCIAL_PRESENCE.bark.rating}/5 across {SOCIAL_PRESENCE.bark.reviewCount} Bark reviews.
                </p>
              </div>
              <Link href="/reviews" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Read all proof <ArrowRightIcon className="size-4" /></Link>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {HOMEPAGE_REVIEWS.slice(0, 3).map((review) => (
                <figure key={`${review.author}-${review.date}`} className="rounded-[1.6rem] border bg-card p-6">
                  <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{"★".repeat(review.stars)} · {review.source}</p>
                  <blockquote className="mt-5 leading-relaxed">“{review.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm font-semibold">{review.author}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">Start at the right depth</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Clear plans. No enterprise maze.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">Begin with visibility and manual tools, or unlock direct sync and deeper automation when the workflow earns it.</p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className={`relative flex flex-col rounded-[1.6rem] border bg-card p-6 ${plan.featured ? "ring-2 ring-primary" : ""}`}>
                  {plan.featured && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Best place to start</span>}
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-6"><span className="text-4xl font-semibold tracking-tight">${plan.price}</span><span className="text-sm text-muted-foreground">/location/mo</span></p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                    {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2.5"><CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" /><span>{feature}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-7 text-center"><Button variant="outline" className="rounded-full" nativeButton={false} render={<Link href="/pricing" />}>Compare every plan <ArrowRightIcon className="size-4" /></Button></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#062f3a] px-6 py-12 text-white shadow-[0_30px_90px_rgba(8,52,60,.18)] sm:px-10 sm:py-16 lg:px-14">
            <Image src={productionHero} alt="" fill sizes="1280px" className="-z-20 object-cover object-[72%_center] opacity-55" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#062f3a_0%,rgba(6,47,58,.98)_34%,rgba(6,47,58,.55)_72%,rgba(6,47,58,.3)_100%)]" />
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.2em] text-cyan-200 uppercase">See what the internet sees</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">Start with your real business.</h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/68">Run a free visibility check, find the facts that drifted, and turn the result into one clear next move.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-full bg-lime-300 text-[#062f3a] hover:bg-lime-200" nativeButton={false} render={<Link href="/grader" />}>Check my visibility <ArrowRightIcon className="size-4" /></Button>
                <Button variant="outline" className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white" nativeButton={false} render={<Link href={workspaceHref} />}>{signedIn ? "Open workspace" : "Create free workspace"}</Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
