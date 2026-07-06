import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { BotIcon, RadarIcon, SparklesIcon } from "lucide-react";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ScanTool } from "@/components/scan/scan-tool";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Free AI Visibility Scan — LocalMap",
  description:
    "See exactly how ChatGPT, Gemini, and Google see your business. Free AI-agent scan of your website in 20 seconds — no signup required.",
};

const trustPoints = [
  {
    icon: BotIcon,
    title: "Real AI-agent crawl",
    body: "We read your site the same way AI assistants do — not a superficial keyword check.",
  },
  {
    icon: RadarIcon,
    title: "6-point visibility check",
    body: "Name, phone, address, hours, services, and structured data — the facts AI engines cite.",
  },
  {
    icon: SparklesIcon,
    title: "Instant action plan",
    body: "Claim your profile and we pre-fill it from the scan, then track 20+ directories for you.",
  },
];

export default async function ScanPage() {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader signedIn={Boolean(session.userId)} />

      <main className="flex-1">
        <section className="localmap-mesh relative overflow-hidden border-b">
          <div className="localmap-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-8 space-y-4 text-center">
              <Badge
                variant="secondary"
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
              >
                <BotIcon className="mr-1.5 inline size-3.5" />
                Free AI visibility scan
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                What does AI see when it looks at your business?
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                ChatGPT, Gemini, and Google answer customer questions using
                whatever they can read about you. Find out what that is — in 20
                seconds, free.
              </p>
            </div>

            <ScanTool signedIn={Boolean(session.userId)} />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point.title} className="space-y-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <point.icon className="size-5 text-primary" />
                </div>
                <h2 className="font-semibold">{point.title}</h2>
                <p className="text-sm text-muted-foreground">{point.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
