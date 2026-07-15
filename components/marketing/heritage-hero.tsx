import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { SurfaceGrain } from "@/components/marketing/surface-grain";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/brand/company";
import { HERO_TEXTURE } from "@/lib/brand/texture-assets";

export function HeritageHero({
  signedIn,
  workspaceHref,
}: {
  signedIn: boolean;
  workspaceHref: string;
}) {
  return (
    <section className="relative isolate min-h-[min(92vh,880px)] overflow-hidden border-b">
      {/* Full-bleed photographic plane */}
      <div className="absolute inset-0">
        <Image
          src={HERO_TEXTURE.primary}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[48%_35%] localmap-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/92 via-zinc-950/72 to-zinc-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/40" />
        <SurfaceGrain opacity={0.35} className="mix-blend-overlay" />
      </div>

      {/* Supporting photos — atmosphere, not cards */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block"
      >
        <div className="absolute right-[6%] top-[18%] h-[38%] w-[72%] overflow-hidden rounded-sm opacity-90 shadow-2xl shadow-black/40 localmap-float-a">
          <Image
            src={HERO_TEXTURE.secondary}
            alt=""
            fill
            sizes="40vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute bottom-[14%] right-[18%] h-[32%] w-[58%] overflow-hidden rounded-sm opacity-85 shadow-2xl shadow-black/40 localmap-float-b">
          <Image
            src={HERO_TEXTURE.accent}
            alt=""
            fill
            sizes="32vw"
            className="object-cover"
          />
        </div>
        <div className="absolute right-[42%] top-[52%] h-[22%] w-[36%] overflow-hidden rounded-sm opacity-75 shadow-xl shadow-black/30 localmap-float-c">
          <Image
            src={HERO_TEXTURE.tertiary}
            alt=""
            fill
            sizes="20vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[min(92vh,880px)] max-w-6xl flex-col justify-end px-4 pb-10 pt-28 sm:px-6 sm:pb-16 lg:justify-center lg:pb-24 lg:pt-24">
        <div className="max-w-xl space-y-6 text-white localmap-hero-rise">
          <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {COMPANY.brandName}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
            What does the internet know about your business?
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-white/75 sm:text-xl">
            One master profile. Honest listings across Google, Apple, Yelp, and
            the directories that matter, since {COMPANY.foundedYear}.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              size="lg"
              className="bg-white text-zinc-950 hover:bg-white/90"
              nativeButton={false}
              render={<Link href={workspaceHref} />}
            >
              {signedIn ? "Open workspace" : "Start free workspace"}
              <ArrowRightIcon className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
              nativeButton={false}
              render={<Link href="/grader" />}
            >
              Free visibility audit
            </Button>
          </div>
        </div>

        {/* Mobile texture strip — desktop uses floating frames instead */}
        <div
          aria-hidden
          className="mt-10 grid grid-cols-3 gap-2 lg:hidden"
        >
          {[HERO_TEXTURE.secondary, HERO_TEXTURE.accent, HERO_TEXTURE.tertiary].map(
            (src) => (
              <div
                key={src}
                className="relative aspect-[4/3] overflow-hidden rounded-sm"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
