"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  GlobeIcon,
  Link2Icon,
  MapPinIcon,
  RadarIcon,
} from "lucide-react";

import type { GoogleImportState } from "@/app/actions/google-import";
import { PublisherIcon } from "@/components/brand/publisher-icon";
import type { SetupProgress } from "@/lib/profile/setup-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ConnectionCard = {
  id: string;
  title: string;
  description: string;
  icon: typeof GlobeIcon;
  publisherSlug?: string;
  done: boolean;
  statusLabel: string;
  href: string;
  cta: string;
  tone?: string;
};

export function ConnectionsHub({
  googleState,
  setupProgress,
  primaryLocationId,
}: {
  googleState: GoogleImportState;
  setupProgress: SetupProgress | null;
  primaryLocationId: string | null;
}) {
  const googleConnected = googleState.status === "connected";
  const googleQuotaPending =
    googleConnected &&
    Boolean(
      googleState.status === "connected" && googleState.fetchError?.code === "quota_exceeded",
    );

  const listingStep = setupProgress?.steps.find((s) => s.id === "listing-urls");
  const auditStep = setupProgress?.steps.find((s) => s.id === "first-audit");
  const publishStep = setupProgress?.steps.find((s) => s.id === "publish-page");

  const cards: ConnectionCard[] = [
    {
      id: "google",
      title: "Google Business Profile",
      description: googleQuotaPending
        ? "Connected — waiting on Google API approval to import listing data."
        : googleConnected
          ? "Account linked. Import NAP, hours, and categories into your master profile."
          : "OAuth read-only link. Requires a verified profile on your Google account.",
      icon: GlobeIcon,
      publisherSlug: "google-business-profile",
      done: googleConnected,
      statusLabel: googleQuotaPending
        ? "Quota pending"
        : googleConnected
          ? "Connected"
          : "Not connected",
      href: "/dashboard/connect/google",
      cta: googleConnected ? "Manage import" : "Connect Google",
      tone: googleConnected ? "text-primary" : undefined,
    },
    {
      id: "listings",
      title: "Directory listings",
      description:
        "Add Yelp, BBB, and other URLs. We crawl and compare them to your master profile.",
      icon: Link2Icon,
      done: listingStep?.done ?? false,
      statusLabel: listingStep?.done ? "URLs added" : "Add URLs",
      href: primaryLocationId
        ? `/dashboard/locations/${primaryLocationId}/listings`
        : "/dashboard/locations",
      cta: "Manage listings",
      tone: "text-chart-2",
    },
    {
      id: "audits",
      title: "Listing audits",
      description:
        "Firecrawl + AI extraction flags wrong phone, address, or hours on public listings.",
      icon: RadarIcon,
      done: auditStep?.done ?? false,
      statusLabel: auditStep?.done ? "Audit complete" : "Not run yet",
      href: primaryLocationId
        ? `/dashboard/locations/${primaryLocationId}/listings`
        : "/dashboard/locations",
      cta: "Run audit",
      tone: "text-chart-3",
    },
    {
      id: "visibility",
      title: "AI visibility page",
      description:
        "Hosted schema.org page + llms.txt so AI systems can read accurate business facts.",
      icon: MapPinIcon,
      done: publishStep?.done ?? false,
      statusLabel: publishStep?.done ? "Published" : "Draft or not started",
      href: primaryLocationId
        ? `/dashboard/locations/${primaryLocationId}/visibility`
        : "/dashboard/locations",
      cta: "Open visibility",
      tone: "text-chart-4",
    },
  ];

  const doneCount = cards.filter((card) => card.done).length;

  return (
    <div className="space-y-6">
      <div className="localmap-mesh rounded-2xl border bg-card p-6">
        <Badge
          variant="secondary"
          className="mb-3 rounded-full border border-primary/20 bg-primary/10 text-primary"
        >
          {doneCount}/{cards.length} connected
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Connections & data sources
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Link external profiles, import canonical data, audit directories, and
          publish your AI-readable visibility page — in order or as you go.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            className={cn(
              "localmap-card-glow relative overflow-hidden",
              card.done && "border-primary/30",
            )}
          >
            <div className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full border bg-muted/50 text-xs font-semibold text-muted-foreground">
              {index + 1}
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 pr-8">
                {card.publisherSlug ? (
                  <PublisherIcon slug={card.publisherSlug} badge size={28} />
                ) : (
                  <card.icon className={cn("size-5", card.tone ?? "text-muted-foreground")} />
                )}
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <Badge variant={card.done ? "default" : "secondary"}>
                {card.statusLabel}
              </Badge>
              <Button
                size="sm"
                variant={card.done ? "outline" : "default"}
                nativeButton={false}
                render={<Link href={card.href} />}
              >
                {card.cta}
                <ArrowRightIcon className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {setupProgress ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended order</CardTitle>
            <CardDescription>
              Complete profile fields first, then connect Google, add listing URLs,
              audit, and publish.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {setupProgress.steps
                .filter((step) => !step.optional)
                .slice(0, 6)
                .map((step, index) => (
                  <li key={step.id} className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className={step.done ? "line-through opacity-60" : ""}>
                      {step.title}
                    </span>
                  </li>
                ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
