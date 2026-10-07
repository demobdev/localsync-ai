import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CheckIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const proofPoints = [
  "Google connected",
  "Approve every change",
  "Verified after sync",
];

export function HeritageHero({
  signedIn,
  workspaceHref,
}: {
  signedIn: boolean;
  workspaceHref: string;
}) {
  return (
    <section className="relative isolate min-h-[760px] overflow-hidden border-b bg-[#062f3a] text-white lg:min-h-[820px]">
      <div className="absolute inset-0">
        <Image
          src="/marketing/localmap-signal-main-street-hero.png"
          alt="A local main street connected by signals from one trusted business profile"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[66%_center] sm:object-[63%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#042b35_0%,rgba(4,43,53,.98)_24%,rgba(4,43,53,.78)_48%,rgba(4,43,53,.16)_76%,rgba(4,43,53,.04)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#042b35_0%,transparent_28%,rgba(4,43,53,.28)_100%)]" />
        <div className="absolute -left-32 top-24 size-80 rounded-full bg-cyan-400/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-center px-4 pb-16 pt-28 sm:px-6 lg:min-h-[820px] lg:px-8 lg:pt-24">
        <div className="grid w-full gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(380px,.72fr)] lg:items-end">
          <div className="max-w-2xl localmap-hero-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-cyan-100 uppercase backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(190,242,100,.8)]" />
              Local business truth, everywhere
            </div>

            <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-[5.25rem]">
              Be the business the internet gets right.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/72 sm:text-xl">
              One approved profile keeps your Google listing accurate today—and
              gives every other directory a clear source of truth tomorrow.
              You see every difference. You approve every move.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-full bg-[#d9ff6f] px-6 font-semibold text-[#062f3a] shadow-[0_14px_40px_rgba(190,242,100,.2)] hover:bg-[#e5ff99]"
                nativeButton={false}
                render={<Link href={signedIn ? workspaceHref : "/grader"} />}
              >
                {signedIn ? "Open workspace" : "Check my visibility"}
                <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-white backdrop-blur-sm hover:bg-white/12 hover:text-white"
                nativeButton={false}
                render={<Link href={signedIn ? "/grader" : workspaceHref} />}
              >
                {signedIn ? "Run a visibility audit" : "Create free workspace"}
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/62">
              {proofPoints.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckIcon className="size-3.5 text-cyan-300" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden justify-self-end lg:block">
            <div className="w-[390px] overflow-hidden rounded-[1.75rem] border border-white/16 bg-[#052a33]/70 p-4 shadow-[0_30px_90px_rgba(1,20,25,.45)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-2 pb-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-cyan-200 uppercase">
                    Live status
                  </p>
                  <p className="mt-1 font-semibold">Your business profile</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-full bg-lime-300 text-[#062f3a]">
                  <BadgeCheckIcon className="size-5" />
                </div>
              </div>

              <div className="space-y-2.5 py-4">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Master Profile</p>
                      <p className="mt-1 text-xs text-white/50">
                        Name, phone, hours, services
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-300/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                      Approved
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-lime-300/30 bg-lime-300/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Google Business Profile</p>
                      <p className="mt-1 text-xs text-white/50">
                        Re-read after the latest update
                      </p>
                    </div>
                    <span className="rounded-full bg-lime-300 px-2.5 py-1 text-[11px] font-bold text-[#062f3a]">
                      Synced
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="size-5 text-cyan-300" />
                    <p className="text-xs leading-relaxed text-white/62">
                      “Live &amp; synced” appears only after publisher verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
