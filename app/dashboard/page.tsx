import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  FileBarChart2Icon,
  ListChecksIcon,
  MapPinIcon,
  RadarIcon,
} from "lucide-react";
import { redirect } from "next/navigation";

import { getGoogleImportStateAction } from "@/app/actions/google-import";
import { listTasksAction } from "@/app/actions/tasks";
import { getRecentMarketingInsightAction, getOrgGraderAuditSummaryAction, getLocationGraderScoresAction } from "@/app/actions/marketing-insights";
import { getPrimaryLocationSetupAction } from "@/app/actions/setup-progress";
import {
  listLocationsAction,
} from "@/app/actions/locations";
import { getOrgVisibilitySummaryAction } from "@/app/actions/visibility";
import { FixQueuePreview } from "@/components/dashboard/fix-queue-preview";
import { SetupGuideCompact } from "@/components/locations/profile-setup-guide";
import { OperatingModelDashboardBanner } from "@/components/dashboard/operating-model-banner";
import { RecentMarketingInsightCard } from "@/components/dashboard/recent-marketing-insight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/ui/sparkline";
import { SCORE_LABELS } from "@/lib/scores/labels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GraderScoreDelta } from "@/components/grader/grader-score-delta";
import { countOrgLocations } from "@/lib/org/locations";
import {
  fixQueuePriority,
  sortFixQueueTasks,
} from "@/lib/tasks/fix-queue";

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

  const locationCount = await countOrgLocations(session.orgId);
  if (locationCount === 0) {
    redirect("/dashboard/onboarding");
  }

  const highlightAuditId =
    params.audit && UUID_RE.test(params.audit) ? params.audit : null;
  const highlightScanId =
    params.scan && UUID_RE.test(params.scan) ? params.scan : null;

  const [locations, visibility, googleState, primarySetup, recentInsight, graderSummary, locationGraderScores, tasks] =
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
        { progress: null, locationId: null, operatingContext: null },
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
      safe(
        "graderSummary",
        () => getOrgGraderAuditSummaryAction(),
        {
          averageScore: null,
          auditedLocationCount: 0,
          totalLocationCount: 0,
          latestScoreDelta: null,
          scoreTrend: [],
          trendLocationId: null,
        },
      ),
      safe(
        "locationGraderScores",
        () => getLocationGraderScoresAction(),
        {},
      ),
      safe("tasks", () => listTasksAction(), []),
    ]);

  const hasData = locations.length > 0;
  const topLocation = visibility.locations[0];
  const topListingRuns = topLocation?.score.auditSummary?.runs ?? 0;
  const googleConnected = googleState.status === "connected";
  const primaryLocationId = primarySetup.locationId ?? locations[0]?.id ?? null;
  const openFixTasks = sortFixQueueTasks(tasks).filter(
    (task) => task.status !== "done",
  );
  const urgentFixCount = openFixTasks.filter(
    (task) => fixQueuePriority(task) === "urgent",
  ).length;

  return (
    <div className="space-y-6 pb-8 md:space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#082b3a] text-white shadow-[0_24px_70px_rgba(5,38,50,0.16)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(32,201,181,0.22),transparent_34%),radial-gradient(circle_at_88%_85%,rgba(241,194,125,0.14),transparent_34%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div className="max-w-2xl">
            <Badge className="border-[#65dfd0]/35 bg-[#65dfd0]/12 text-[#9ff3e8]">
              Automated listings command center
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {urgentFixCount > 0
                ? urgentFixCount +
                  (urgentFixCount === 1
                    ? " high-priority fix needs you."
                    : " high-priority fixes need you.")
                : openFixTasks.length > 0
                  ? openFixTasks.length +
                    (openFixTasks.length === 1
                      ? " fix is ready for review."
                      : " fixes are ready for review.")
                  : "Your listings are under control."}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              LocalMap tracks connected and audited publishers, verifies what
              is live, and brings you only the decisions or publisher steps it
              cannot safely finish alone.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-[#67e3d5] text-[#062b31] hover:bg-[#91eee4]"
                nativeButton={false}
                render={
                  <Link
                    href={
                      openFixTasks.length > 0
                        ? "/dashboard/tasks"
                        : primaryLocationId
                          ? "/dashboard/locations/" +
                            primaryLocationId +
                            "/listings"
                          : "/dashboard/locations"
                    }
                  />
                }
              >
                {openFixTasks.length > 0
                  ? "Open fix queue"
                  : "Open listing workflow"}
                <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={
                  <Link
                    href={
                      primaryLocationId
                        ? "/dashboard/locations/" + primaryLocationId
                        : "/dashboard/locations"
                    }
                  />
                }
              >
                <MapPinIcon className="size-4" />
                Master Profile
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7de8da]">
                  System pulse
                </p>
                <p className="mt-1 text-sm text-white/55">
                  Current workspace state
                </p>
              </div>
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#67e3d5] opacity-50" />
                <span className="relative inline-flex size-3 rounded-full bg-[#67e3d5]" />
              </span>
            </div>
            <div className="mt-5 space-y-2">
              {[
                {
                  label: "Google connection",
                  value: googleConnected ? "Connected" : "Needs connection",
                  ok: googleConnected,
                },
                {
                  label: "Listing verification",
                  value:
                    topListingRuns > 0
                      ? topListingRuns +
                        (topListingRuns === 1 ? " audit run" : " audit runs")
                      : "No audit yet",
                  ok: topListingRuns > 0,
                },
                {
                  label: "Human action",
                  value:
                    urgentFixCount > 0
                      ? urgentFixCount + " urgent"
                      : openFixTasks.length + " open",
                  ok: openFixTasks.length === 0,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[#061f2b]/60 px-3.5 py-3"
                >
                  <span className="text-sm text-white/62">{item.label}</span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {item.ok ? (
                      <CheckCircle2Icon className="size-4 text-[#67e3d5]" />
                    ) : (
                      <AlertTriangleIcon className="size-4 text-[#f1c27d]" />
                    )}
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {primarySetup.operatingContext && primarySetup.locationId ? (
        <OperatingModelDashboardBanner
          context={primarySetup.operatingContext}
          locationId={primarySetup.locationId}
          googleState={googleState}
        />
      ) : null}

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
            label: SCORE_LABELS.marketAuditShort,
            value: graderSummary.averageScore != null ? `${graderSummary.averageScore}` : "—",
            hint:
              graderSummary.auditedLocationCount > 0
                ? graderSummary.latestScoreDelta != null
                  ? `${graderSummary.latestScoreDelta >= 0 ? "+" : ""}${graderSummary.latestScoreDelta} pts on latest re-grade · ${graderSummary.auditedLocationCount}/${graderSummary.totalLocationCount} locations audited.`
                  : `${graderSummary.auditedLocationCount} location${graderSummary.auditedLocationCount === 1 ? "" : "s"} with market audit scores. Re-run audits to track improvement.`
                : "Run the grader on a location to get your first market audit score.",
            icon: FileBarChart2Icon,
            tone: "text-emerald-600",
            href: graderSummary.trendLocationId
              ? `/dashboard/locations/${graderSummary.trendLocationId}`
              : "/grader",
            trend: graderSummary.scoreTrend,
          },
          {
            label: "Fix queue",
            value: String(openFixTasks.length),
            hint:
              urgentFixCount > 0
                ? urgentFixCount +
                  (urgentFixCount === 1
                    ? " urgent exception needs attention."
                    : " urgent exceptions need attention.")
                : openFixTasks.length > 0
                  ? "Prioritized human actions across every location."
                  : "No publisher or audit work needs you right now.",
            icon: ListChecksIcon,
            tone:
              urgentFixCount > 0 ? "text-rose-600" : "text-primary",
            href: "/dashboard/tasks",
          },
          {
            label: SCORE_LABELS.listingConsistency,
            value: hasData
              ? `${topLocation?.score.auditScore ?? 0}/50`
              : "—",
            hint:
              topListingRuns === 0
                ? "Run your first listing audit to unlock up to 50 pts."
                : (topLocation?.score.auditScore ?? 0) === 0
                  ? "Audit complete — fix directory mismatches, then re-run to score."
                  : "Listing audit points toward workspace health. Click to review or re-audit.",
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
        ].map((stat: {
          label: string;
          value: string;
          hint: string;
          icon: typeof FileBarChart2Icon;
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
              locations.slice(0, 5).map((location) => {
                const graderScore = locationGraderScores[location.id];
                return (
                <Link
                  key={location.id}
                  href={`/dashboard/locations/${location.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{location.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {location.clientName ?? location.name}
                      {location.profile.city ? ` · ${location.profile.city}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {graderScore ? (
                      <>
                        <Badge variant="outline" className="tabular-nums">
                          Audit {graderScore.totalScore}
                        </Badge>
                        {graderScore.scoreDelta != null ? (
                          <GraderScoreDelta delta={graderScore.scoreDelta} />
                        ) : null}
                      </>
                    ) : (
                      <Badge variant="secondary">No audit</Badge>
                    )}
                  </div>
                </Link>
              );
              })
            )}
          </CardContent>
        </Card>

        <FixQueuePreview tasks={tasks} className="lg:col-span-2" />
      </div>
    </div>
  );
}
