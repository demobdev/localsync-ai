import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { PhotoMarquee } from "@/components/marketing/photo-marquee";
import { SurfaceGrain } from "@/components/marketing/surface-grain";
import { Button } from "@/components/ui/button";
import {
  AGENCY_SERVICE_LINES,
  COMPANY,
  HERITAGE_STATS,
  HERITAGE_TESTIMONIALS,
  LEGACY_SEO_PACKAGES,
} from "@/lib/brand/company";
import { HERO_TEXTURE } from "@/lib/brand/texture-assets";

export const metadata: Metadata = {
  title: "About",
  description: `Since ${COMPANY.foundedYear}, ${COMPANY.brandName} has helped local brands get found. Now the same team builds LocalMap: listings, reputation, and AI visibility on ${COMPANY.domain}.`,
};

export default async function AboutPage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-full flex-col bg-background">
      <MarketingHeader signedIn={Boolean(userId)} />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden border-b">
          <div className="absolute inset-0">
            <Image
              src={HERO_TEXTURE.secondary}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[50%_25%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/75 to-zinc-950/45" />
            <SurfaceGrain opacity={0.3} className="mix-blend-overlay" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              Since {COMPANY.foundedYear}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              We help local brands get found
            </h1>
            <p className="mt-4 text-lg text-white/75">
              {COMPANY.brandName} started as a Greenville digital marketing
              agency: market research, local SEO, listings, reputation, creative,
              and ads for hundreds of local brands. {COMPANY.domain} now hosts
              the LocalMap platform: the same mission, automated with honest
              listing rails and approve-first workflows.
            </p>
          </div>
        </section>

        <PhotoMarquee label="Photography and creative from real client work" />

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-4 sm:px-6">
          {HERITAGE_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold tracking-tight text-teal-700 dark:text-teal-300">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="border-y bg-muted/30 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              Agency heritage → platform product
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              What clients bought as managed campaigns still matters. The SaaS
              productizes the listing and reputation operating system so agencies
              and brands can run it at scale, without fake syndication claims.
            </p>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Agency service lines
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {AGENCY_SERVICE_LINES.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Managed SEO packages (legacy shop)
                </h3>
                <ul className="mt-3 space-y-3 text-sm">
                  {LEGACY_SEO_PACKAGES.map((pkg) => (
                    <li key={pkg.name}>
                      <span className="font-medium">{pkg.name}</span>: $
                      {pkg.priceMonthly}/mo · {pkg.focus} · {pkg.keywords}{" "}
                      keywords · includes listing management
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">
                  Need done-for-you SEO alongside LocalMap?{" "}
                  <Link href="/contact" className="underline underline-offset-4">
                    Talk to the agency team
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            What clients say
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {HERITAGE_TESTIMONIALS.map((t) => (
              <blockquote key={t.name} className="text-sm leading-relaxed">
                <p className="text-muted-foreground">“{t.quote}”</p>
                <footer className="mt-4">
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-muted-foreground">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/pricing" />}>
              See LocalMap pricing
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/reviews" />}
            >
              Reviews &amp; case studies
            </Button>
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/contact" />}
            >
              Contact the team
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
