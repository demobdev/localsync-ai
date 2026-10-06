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
import type { LocationOperatingContext } from "@/lib/profile/operating-model-meta";
import { listingsDescriptionForModel } from "@/lib/profile/publisher-packs-by-model";
import { googleConnectCopyForContext } from "@/lib/connect/google-connect-copy";
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
  operatingContext = null,
}: {
  googleState: GoogleImportState;
  setupProgress: SetupProgress | null;
  primaryLocationId: string | null;
  operatingContext?: LocationOperatingContext | null;
}) {
  const googleCopy = googleConnectCopyForContext({
    context: operatingContext,
    googleState,
  });
  const model = operatingContext?.operatingModel ?? "storefront";
  const googleConnected = googleState.status === "connected";
  const googleQuotaLimited =
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
      description: googleCopy.description,
      icon: GlobeIcon,
      publisherSlug: "google-business-profile",
      done: googleConnected,
      statusLabel: googleQuotaLimited
        ? "Rate or quota limit reached"
        : googleConnected
          ? "Connected"
          : "Not connected",
      href: "/dashboard/connect/google",
      cta: googleConnected ? googleCopy.cta : googleCopy.cta,
      tone: googleConnected ? "text-primary" : undefined,
    },
    {
      id: "listings",
      title: "Audit-only directories",
      description: `${listingsDescriptionForModel(model)} Use this only when direct publisher management is unavailable.`,
      icon: Link2Icon,
      done: listingStep?.done ?? false,
      statusLabel: listingStep?.done ? "Monitoring" : "Optional",
      href: primaryLocationId
        ? `/dashboard/locations/${primaryLocationId}/listings`
        : "/dashboard/locations",
      cta: "Manage fallback",
      tone: "text-chart-2",
    },
    {
      id: "audits",
      title: "Audit-only checks",
      description:
        "Check saved public URLs for wrong phone, address, or hours without implying write access.",
      icon: RadarIcon,
      done: auditStep?.done ?? false,
      statusLabel: auditStep?.done ? "Audit complete" : "Not run yet",
      href: primaryLocationId
        ? `/dashboard/locations/${primaryLocationId}/listings`
        : "/dashboard/locations",
      cta: "Check listings",
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
          {operatingContext
            ? `${googleCopy.headline}. Confirm the correct listing, review field differences, and verify the result before expanding coverage.`
            : "Connect a real publisher account first, then use audit-only monitoring only where direct management is unavailable."}
        </p>
        {googleCopy.helper ? (
          <p className="mt-2 text-xs text-muted-foreground">{googleCopy.helper}</p>
        ) : null}
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
              Complete the Master Profile, connect Google, confirm the listing,
              and approve differences. Audit-only URLs are optional.
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
