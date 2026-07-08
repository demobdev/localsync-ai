import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRightIcon,
  FileBarChart2Icon,
  GlobeIcon,
  MapPinIcon,
  MessageSquareIcon,
  RadarIcon,
} from "lucide-react";
import { redirect } from "next/navigation";

import { getOrgReviewSummaryAction } from "@/app/actions/reviews";
import { getGoogleImportStateAction } from "@/app/actions/google-import";
import { getRecentMarketingInsightAction } from "@/app/actions/marketing-insights";
import { getPrimaryLocationSetupAction } from "@/app/actions/setup-progress";
import {
  listLocationsAction,
} from "@/app/actions/locations";
import {
  getOrgVisibilityHistoryAction,
  getOrgVisibilitySummaryAction,
} from "@/app/actions/visibility";
import { SetupGuideCompact } from "@/components/locations/profile-setup-guide";
import { AuditNewBusinessCard } from "@/components/dashboard/audit-new-business-card";
import { RecentMarketingInsightCard } from "@/components/dashboard/recent-marketing-insight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/ui/sparkline";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getOrganization } from "@/lib/auth/organizations";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[dashboard] ${label} failed:`, error);
    return fallback;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ audit?: string; scan?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session.orgId) {
    redirect("/dashboard/onboarding");
  }

  const highlightAuditId =
    params.audit && UUID_RE.test(params.audit) ? params.audit : null;
  const highlightScanId =
    params.scan && UUID_RE.test(params.scan) ? params.scan : null;

  const organization = await getOrganization(session.orgId);
  const isAgency = organization?.type === "agency";

  const [locations, visibility, googleState, primarySetup, reviews, recentInsight] =
    await Promise.all([
      safe("listLocations", () => listLocationsAction(), []),
      safe(
        "visibilitySummary",
        () => getOrgVisibilitySummaryAction(),
        {
          averageScore: 0,
          hasPublishedPage: false,
          hasGeneratedPage: false,
          locations: [],
        },
      ),
      safe(
        "googleImport",
        () => getGoogleImportStateAction(),
        { status: "not_connected" as const },
      ),
      safe(
        "setupProgress",
        () => getPrimaryLocationSetupAction(),
        { progress: null, locationId: null },
      ),
      safe(
        "reviews",
        () => getOrgReviewSummaryAction(),
        {
          totalReviews: 0,
          unrepliedCount: 0,
          averageScore: 0,
          topLocation: null,
        },
      ),
      safe(
        "marketingInsight",
        () =>
          getRecentMarketingInsightAction({
            highlightAuditId,
            highlightScanId,
          }),
        null,
      ),
    ]);

  if (locations.length === 0) {
    redirect("/dashboard/onboarding");
  }

  const history = await safe(
    "visibilityHistory",
    () => getOrgVisibilityHistoryAction({ days: 90 }),
    [],
  );

  const hasData = locations.length > 0;
  const topLocation = visibility.locations[0];
  const profileComplete =
    (topLocation?.score.profileScore ?? 0) >= 35;
  const googleConnected = googleState.status === "connected";

  return (
    <div className="space-y-6 pb-8 md:space-y-8">
      <div className="localmap-mesh relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div className="relative max-w-2xl space-y-3">
          <Badge
            variant="secondary"
            className="rounded-full border border-primary/20 bg-primary/10 text-primary"
          >
            Local Intelligence · Sprint 4
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your local presence command center
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Master profiles, publisher registry, listing audits, and Google import
            — the engine behind LocalMap agency services.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/grader" />}
            >
              <FileBarChart2Icon className="size-4" />
              New visibility audit
            </Button>
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/locations" />}
            >
              <MapPinIcon className="size-4" />
              Manage locations
            </Button>
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/connect" />}
            >
              Connect sources
            </Button>
          </div>
        </div>
      </div>

      <AuditNewBusinessCard isAgency={isAgency} />

      {recentInsight ? (
        <RecentMarketingInsightCard insight={recentInsight} />
      ) : null}

      {primarySetup.progress && primarySetup.locationId ? (
        <SetupGuideCompact
          progress={primarySetup.progress}
          locationId={primarySetup.locationId}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Visibility score",
            value: hasData ? `${visibility.averageScore}` : "—",
            hint: hasData
              ? history.length > 1
                ? `${history[history.length - 1]!.score - history[0]!.score >= 0 ? "+" : ""}${history[history.length - 1]!.score - history[0]!.score} over ${history.length} days tracked.`
                : "How complete + consistent your business info is. Click to improve it."
              : "Add a business to get your first score.",
            icon: GlobeIcon,
            tone: "text-primary",
            href: topLocation
              ? `/dashboard/locations/${topLocation.id}/visibility`
              : "/dashboard/locations",
            trend: history.map((point) => point.score),
          },
          {
            label: "Listing audits",
            value: hasData ? String(topLocation?.score.auditScore ?? 0) : "—",
            hint: "We crawl your public listings and flag wrong info. Click to run one.",
            icon: RadarIcon,
            tone: "text-chart-2",
            href: topLocation
              ? `/dashboard/locations/${topLocation.id}/listings`
              : "/dashboard/locations",
          },
          {
            label: "Businesses",
            value: String(locations.length),
            hint: "Locations you manage in this workspace.",
            icon: MapPinIcon,
            tone: "text-chart-3",
            href: "/dashboard/locations",
          },
          {
            label: "Reviews needing reply",
            value:
              reviews.totalReviews > 0
                ? String(reviews.unrepliedCount)
                : "—",
            hint:
              reviews.totalReviews > 0
                ? "AI drafts replies — you approve before saving."
                : "Load demo reviews or sync from Google to start.",
            icon: MessageSquareIcon,
            tone: "text-chart-5",
            href: reviews.topLocation
              ? `/dashboard/locations/${reviews.topLocation.id}/reviews`
              : topLocation
                ? `/dashboard/locations/${topLocation.id}/reviews`
                : "/dashboard/locations",
          },
        ].map((stat: {
          label: string;
          value: string;
          hint: string;
          icon: typeof GlobeIcon;
          tone: string;
          href: string;
          trend?: number[];
        }) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="localmap-card-glow h-full overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>{stat.label}</CardDescription>
                  <stat.icon className={cn("size-4", stat.tone)} />
                </div>
                <CardTitle className="text-3xl tabular-nums">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stat.trend && stat.trend.length > 0 ? (
                  <Sparkline points={stat.trend} height={36} />
                ) : null}
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="localmap-card-glow lg:col-span-3">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent locations</CardTitle>
              <CardDescription>
                Open a location to edit its master profile or run audits.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/locations" />}
            >
              View all
              <ArrowRightIcon className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {locations.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm font-medium">No businesses yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  One quick form sets up your profile and directory tracking.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/dashboard/onboarding" />}
                  >
                    Add your business
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/dashboard/connect" />}
                  >
                    Connect Google
                  </Button>
                </div>
              </div>
            ) : (
              locations.slice(0, 5).map((location) => (
                <Link
                  key={location.id}
                  href={`/dashboard/locations/${location.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{location.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {location.clientName}
                      {location.profile.city ? ` · ${location.profile.city}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Profile
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="localmap-card-glow lg:col-span-2">
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <CardDescription>
              The agency flywheel — notice, recommend, approve, execute.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                title: "Set up master profile",
                body: "Canonical NAP, hours, services, photos.",
                href: topLocation
                  ? `/dashboard/locations/${topLocation.id}`
                  : "/dashboard/locations",
                done: profileComplete,
              },
              {
                title: "Connect Google Business Profile",
                body: "OAuth import with field-by-field merge.",
                href: "/dashboard/connect/google",
                done: googleConnected,
              },
              {
                title: "Generate AI visibility page",
                body: "Schema.org JSON-LD, hosted page, llms.txt.",
                href: topLocation
                  ? `/dashboard/locations/${topLocation.id}/visibility`
                  : "/dashboard/locations",
                done: visibility.hasPublishedPage,
              },
              {
                title: "Reply to customer reviews",
                body: "Ingest reviews, AI-draft replies, approve before save.",
                href: reviews.topLocation
                  ? `/dashboard/locations/${reviews.topLocation.id}/reviews`
                  : topLocation
                    ? `/dashboard/locations/${topLocation.id}/reviews`
                    : "/dashboard/locations",
                done:
                  reviews.totalReviews > 0 && reviews.unrepliedCount === 0,
              },
              {
                title: "Run listing audits",
                body: "Firecrawl + AI extraction vs master profile.",
                href: locations[0]
                  ? `/dashboard/locations/${locations[0].id}/listings`
                  : "/dashboard/locations",
                done: (topLocation?.score.auditScore ?? 0) > 0,
              },
            ].map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="block rounded-xl border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{action.title}</p>
                  <Badge variant={action.done ? "default" : "secondary"}>
                    {action.done ? "Done" : "Next"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{action.body}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
