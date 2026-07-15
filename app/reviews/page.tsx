import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";
import { COMPANY, HERITAGE_STATS } from "@/lib/brand/company";
import {
  EXTERNAL_REVIEWS,
  REVIEW_PLATFORMS,
  SOCIAL_PRESENCE,
} from "@/lib/brand/external-reviews";
import {
  CLIENT_REVIEWS,
  CREATIVE_SAMPLES,
  PHOTO_GALLERY,
  PORTFOLIO_WORKS,
  SEO_CASES,
  VIDEO_THUMBS,
  WEBSITE_CASES,
} from "@/lib/brand/reviews-catalog";

export const metadata: Metadata = {
  title: "Reviews & Case Studies",
  description: `Real Local Map Co. client reviews, SEO rankings, websites, video, and creative. The proof behind ${COMPANY.brandName} since ${COMPANY.foundedYear}.`,
};

export default async function ReviewsPage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-full flex-col bg-background">
      <MarketingHeader signedIn={Boolean(userId)} />

      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-teal-50/70 to-background px-4 py-16 dark:from-teal-950/25 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-end gap-10 lg:grid-cols-[1.4fr_0.6fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                Reviews &amp; case studies
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Proof from real local brands
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Websites, #1 rankings, video, photography, and ads we shipped for
                clients. The same Greenville team now building LocalMap on{" "}
                {COMPANY.domain}.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button nativeButton={false} render={<Link href="/grader" />}>
                  Free visibility audit
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/contact" />}
                >
                  Talk to the team
                </Button>
              </div>
            </div>
            <div className="justify-self-start lg:justify-self-end">
              <Image
                src="/reviews/badge-coe.png"
                alt="Bark.com Customers Choice badge"
                width={180}
                height={140}
                className="h-auto w-[140px] object-contain sm:w-[180px]"
              />
            </div>
          </div>
        </section>

        <section className="border-b px-4 py-10 sm:px-6">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
            {HERITAGE_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-semibold tracking-tight text-teal-700 dark:text-teal-300">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="public-reviews"
          className="border-b bg-muted/25 px-4 py-16 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                  Third-party proof
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {SOCIAL_PRESENCE.bark.rating}/5 on Bark ·{" "}
                  {SOCIAL_PRESENCE.bark.reviewCount} public reviews
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Aggregated from Google Maps, Facebook, and BBB onto the Bark
                  profile. 100% five-star. We show source attribution on every
                  quote.
                </p>
              </div>
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={SOCIAL_PRESENCE.bark.href}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                View Bark profile
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              {REVIEW_PLATFORMS.filter((p) => p.href).map((platform) => (
                <a
                  key={platform.id}
                  href={platform.href!}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border px-3 py-1.5 text-muted-foreground transition hover:border-teal-600/40 hover:text-foreground"
                >
                  {platform.name}
                  {platform.rating != null
                    ? ` · ${platform.rating}/5`
                    : platform.reviewCount != null
                      ? ` · ${platform.reviewCount}`
                      : ""}
                </a>
              ))}
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {EXTERNAL_REVIEWS.filter((r) => r.featured).map((review) => (
                <figure key={`${review.author}-${review.date}`}>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    {"★".repeat(review.stars)} · {review.source}
                  </p>
                  <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="mt-4">
                    <p className="font-medium text-foreground">{review.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.date).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className="border-b px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Client reviews
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Direct quotes from owners who hired Local Map Co. for web, ads,
              video, and local growth.
            </p>
            <div className="mt-10 grid gap-10 lg:grid-cols-3">
              {CLIENT_REVIEWS.map((review) => (
                <figure key={review.slug} className="flex flex-col gap-5">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={review.avatar}
                      alt={review.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <blockquote className="text-sm leading-relaxed text-muted-foreground">
                    “{review.quote}”
                  </blockquote>
                  <figcaption>
                    <p className="font-medium text-foreground">{review.name}</p>
                    <p className="text-sm text-muted-foreground">{review.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="seo" className="border-b bg-muted/25 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              SEO ranking case studies
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Keyword wins and discovery growth. The local SEO work that made
              listing management a core part of every package.
            </p>
            <div className="mt-10 space-y-14">
              {SEO_CASES.map((item, index) => (
                <article
                  key={item.slug}
                  className="grid items-center gap-8 lg:grid-cols-2"
                >
                  <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                      Local SEO
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">
                      {item.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.summary}
                    </p>
                    <div className="relative mt-6 h-12 w-40">
                      <Image
                        src={item.logo}
                        alt={`${item.name} logo`}
                        fill
                        className="object-contain object-left"
                        sizes="160px"
                      />
                    </div>
                  </div>
                  <div
                    className={`relative aspect-[4/3] overflow-hidden bg-background ${
                      index % 2 === 1 ? "lg:order-1" : ""
                    }`}
                  >
                    <Image
                      src={item.ranking}
                      alt={`${item.name} ranking screenshot`}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="websites" className="border-b px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Website use cases
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Conversion-ready, SEO-ready sites for local service brands.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {WEBSITE_CASES.map((site) => (
                <figure key={site.slug} className="group">
                  <div className="relative aspect-[5/4] overflow-hidden bg-muted">
                    <Image
                      src={site.image}
                      alt={`${site.name} website`}
                      fill
                      className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <figcaption className="mt-3">
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {site.category}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="video" className="border-b bg-muted/25 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Video production
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Promotional, instructional, and biographical content for local
              brands.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {VIDEO_THUMBS.map((clip) => (
                <figure key={clip.src} className="relative aspect-video overflow-hidden bg-zinc-900">
                  <Image
                    src={clip.src}
                    alt={clip.label}
                    fill
                    className="object-cover opacity-95"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-xs text-white">
                    {clip.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="photography" className="border-b px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Photography
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              On-location brand photography used across sites, ads, and social.
            </p>
            <div className="mt-10 columns-1 gap-3 sm:columns-2 lg:columns-3">
              {PHOTO_GALLERY.map((src) => (
                <div
                  key={src}
                  className="relative mb-3 break-inside-avoid overflow-hidden bg-muted"
                >
                  <Image
                    src={src}
                    alt="Local Map Co. client photography"
                    width={1000}
                    height={750}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="creative" className="border-b bg-muted/25 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Social &amp; paid creative
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Covers, banners, and display units from live client campaigns.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CREATIVE_SAMPLES.filter((c) => c.wide).map((item) => (
                <figure
                  key={item.src}
                  className="relative aspect-[2/1] overflow-hidden bg-background sm:col-span-2 lg:col-span-3"
                >
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </figure>
              ))}
              {CREATIVE_SAMPLES.filter((c) => !c.wide).map((item) => (
                <figure
                  key={item.src}
                  className="relative aspect-square overflow-hidden bg-background"
                >
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                    {item.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              More portfolio work
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Additional design and campaign stills from the Local Map Co.
              archive.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {PORTFOLIO_WORKS.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden bg-muted"
                >
                  <Image
                    src={src}
                    alt={`Portfolio work ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src="/reviews/service-reputation.jpg"
                  alt="Reputation management"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src="/reviews/service-chat.jpg"
                  alt="Live chat management"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready for your own case study?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start with a free visibility audit, or open a LocalMap workspace
              and import your listings.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/grader" />}
              >
                Free visibility audit
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href={userId ? "/dashboard" : "/sign-up"} />}
              >
                {userId ? "Open workspace" : "Start free workspace"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
