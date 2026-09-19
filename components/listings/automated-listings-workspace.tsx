"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleIcon,
  Clock3Icon,
  ExternalLinkIcon,
  HistoryIcon,
  Link2Icon,
  ListFilterIcon,
  RadarIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  discoverListingUrlsAction,
  startAuditAction,
  updateListingUrlAction,
} from "@/app/actions/audits";
import type { GoogleImportState } from "@/app/actions/google-import";
import type { LatestSubmissionCampaign } from "@/app/actions/listing-campaigns";
import { createChecklistTasksAction } from "@/app/actions/tasks";
import { PublisherIcon } from "@/components/brand/publisher-icon";
import { SubmissionCampaignPanel } from "@/components/listings/submission-campaign-panel";
import { ActionLoadingOverlay } from "@/components/ui/action-loading-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyGoogleProfile } from "@/lib/connectors/google-profile-diff";
import { publisherSlugForListingUrl } from "@/lib/publishers/detect-listing-url";
import {
  isAutomationRail,
  publisherDeliveryDescription,
  publisherDeliveryLabel,
  publisherNextActionLabel,
  type PublisherApprovalStatus,
  type PublisherCostCadence,
  type PublisherDeliveryRail,
  type PublisherOperation,
  type PublisherVerificationOwner,
} from "@/lib/publishers/delivery";
import { listingUrlPlaceholder } from "@/lib/publishers/listing-setup-copy";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import { cn } from "@/lib/utils";

type PublisherRow = {
  id: string;
  publisherId: string;
  publisherName: string;
  publisherSlug: string;
  rail: string;
  deliveryRail: PublisherDeliveryRail;
  approvalStatus: PublisherApprovalStatus;
  verificationOwner: PublisherVerificationOwner;
  costCadence: PublisherCostCadence;
  estimatedCostCents: number;
  costNotes: string | null;
  ownershipPersists: boolean;
  supportedOperations: PublisherOperation[];
  evidenceRequirement: string | null;
  isCore: boolean;
  status: string;
  listingUrl: string | null;
  externalId: string | null;
  lastCheckedAt: Date | null;
};

type AuditRunRow = {
  id: string;
  status: string;
  summary: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

type PublisherFilter = "all" | "connected" | "needs-action" | "managed";

const GOOGLE_SLUG = "google-business-profile";

function formatDate(value: Date | string | null): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function parsePastedUrls(value: string): string[] {
  return Array.from(
    new Set(value.match(/https?:\/\/[^\s,]+/gi)?.map((url) => url.trim()) ?? []),
  );
}

function integrationLabel(row: PublisherRow): string {
  return publisherDeliveryLabel(row);
}

function statusTone(status: string):
  | "default"
  | "secondary"
  | "outline"
  | "destructive" {
  if (status === "Live & synced") return "default";
  if (status === "Needs action" || status === "Connection error") {
    return "destructive";
  }
  if (
    status === "Pending verification" ||
    status === "Ready to audit" ||
    status === "Ready to submit" ||
    status === "Ready to distribute"
  ) {
    return "secondary";
  }
  return "outline";
}

function ProgressStep({
  index,
  label,
  description,
  done,
  current,
}: {
  index: number;
  label: string;
  description: string;
  done: boolean;
  current: boolean;
}) {
  return (
    <li className="relative flex min-w-0 gap-3 lg:flex-1 lg:flex-col lg:gap-2">
      <div className="flex items-center lg:w-full">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
            done
              ? "border-emerald-300 bg-emerald-300 text-emerald-950"
              : current
                ? "border-white bg-white text-slate-950"
                : "border-white/25 bg-white/5 text-white/60",
          )}
        >
          {done ? <CheckCircle2Icon className="size-4" /> : index}
        </span>
        <span className="mx-2 hidden h-px flex-1 bg-white/15 lg:block" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold",
            done || current ? "text-white" : "text-white/55",
          )}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/55">
          {description}
        </p>
      </div>
    </li>
  );
}

export function AutomatedListingsWorkspace({
  locationId,
  profile,
  publisherRows,
  auditRuns,
  googleState,
  profileScore,
  listingConsistencyScore,
  listingHealthScore,
  canSync,
  submissionCampaign,
}: {
  locationId: string;
  profile: LocationProfileSnapshot;
  publisherRows: PublisherRow[];
  auditRuns: AuditRunRow[];
  googleState: GoogleImportState;
  profileScore: number;
  listingConsistencyScore: number;
  listingHealthScore: number;
  canSync: boolean;
  submissionCampaign: LatestSubmissionCampaign | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<PublisherFilter>("all");
  const [showAuditOnly, setShowAuditOnly] = useState(false);
  const [auditOnlySearch, setAuditOnlySearch] = useState("");
  const [quickPaste, setQuickPaste] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>(
    Object.fromEntries(
      publisherRows.map((row) => [row.id, row.listingUrl ?? ""]),
    ),
  );
  const [savePending, startSaveTransition] = useTransition();
  const [discoverPending, startDiscoverTransition] = useTransition();
  const [auditPending, startAuditTransition] = useTransition();

  const googleRow = publisherRows.find(
    (row) => row.publisherSlug === GOOGLE_SLUG,
  );
  const googleConnected = googleState.status === "connected";
  const googleConnectionError =
    googleState.status === "connected" ? googleState.fetchError : undefined;
  const matchedGoogleLocation =
    googleState.status === "connected" && googleRow?.externalId
      ? googleState.locations.find(
          (location) => location.gbpName === googleRow.externalId,
        )
      : undefined;
  const googleVerification = matchedGoogleLocation
    ? verifyGoogleProfile(profile, matchedGoogleLocation)
    : null;
  const liveAndSynced = Boolean(
    googleVerification?.verified && googleRow?.lastCheckedAt,
  );
  const profileReady = profileScore >= 35;
  const listingMatched = Boolean(googleRow?.externalId);

  const auditOnlyRows = publisherRows.filter(
    (row) => row.publisherSlug !== GOOGLE_SLUG,
  );
  const configuredAuditOnlyCount = auditOnlyRows.filter((row) =>
    Boolean((urls[row.id] ?? "").trim()),
  ).length;
  const connectedCount = (googleConnected ? 1 : 0) + configuredAuditOnlyCount;
  const needsActionCount =
    (liveAndSynced ? 0 : 1) +
    auditOnlyRows.filter(
      (row) => row.isCore && !(urls[row.id] ?? "").trim(),
    ).length;
  const automationReadyCount = publisherRows.filter((row) =>
    isAutomationRail(row),
  ).length;
  const approvalRequiredCount = publisherRows.filter(
    (row) =>
      row.deliveryRail === "approval_gated_direct" &&
      row.approvalStatus !== "production",
  ).length;
  const managedSubmissionCount = publisherRows.filter(
    (row) => row.deliveryRail === "managed_submission",
  ).length;
  const customerActionCount = publisherRows.filter(
    (row) => row.deliveryRail === "customer_action",
  ).length;
  const monitorOnlyCount = publisherRows.filter(
    (row) => row.deliveryRail === "monitor_only",
  ).length;

  const campaignVerifiedCount =
    submissionCampaign?.targets.filter((target) => target.status === "verified")
      .length ?? 0;
  const currentStep = !profileReady
    ? 0
    : publisherRows.length === 0
      ? 1
    : !submissionCampaign
      ? 2
      : campaignVerifiedCount < submissionCampaign.targetCount
        ? 3
        : 4;

  const primaryAction = !profileReady
    ? {
        label: "Complete Master Profile",
        href: `/dashboard/locations/${locationId}`,
        note: "Add the core facts publishers need before connecting an account.",
      }
    : !submissionCampaign
      ? {
          label: "Start submission campaign",
          href: "#submission-campaign",
          note:
            "Google is one optional source. Route the Master Profile across every available delivery rail.",
        }
      : {
          label: "Review campaign actions",
          href: "#submission-campaign",
          note: `${submissionCampaign.targetCount} publisher jobs are classified by what LocalSync can truthfully deliver.`,
        };

  function publisherStatus(row: PublisherRow): string {
    if (row.publisherSlug === GOOGLE_SLUG) {
      if (googleState.status === "not_configured") return "Connection error";
      if (!googleConnected) return "Needs action";
      if (googleConnectionError) return "Connection error";
      if (!listingMatched) return "Needs action";
      return liveAndSynced ? "Live & synced" : "Pending verification";
    }

    const hasUrl = Boolean((urls[row.id] ?? "").trim());
    if (!hasUrl) {
      if (
        row.deliveryRail === "approval_gated_direct" &&
        row.approvalStatus !== "production"
      ) {
        return "Approval required";
      }
      if (row.deliveryRail === "partner_network") {
        return "Ready to distribute";
      }
      if (row.deliveryRail === "managed_submission") {
        return "Ready to submit";
      }
      if (row.deliveryRail === "customer_action") {
        return "Customer verification";
      }
      return "Not configured";
    }
    return row.lastCheckedAt ? "Audit complete" : "Ready to audit";
  }

  const visiblePublisherRows = (() => {
    const sorted = [...publisherRows].sort((a, b) => {
      if (a.publisherSlug === GOOGLE_SLUG) return -1;
      if (b.publisherSlug === GOOGLE_SLUG) return 1;
      const aConfigured = Boolean((urls[a.id] ?? "").trim());
      const bConfigured = Boolean((urls[b.id] ?? "").trim());
      if (aConfigured !== bConfigured) return aConfigured ? -1 : 1;
      return Number(b.isCore) - Number(a.isCore);
    });

    return sorted.filter((row) => {
      const status = publisherStatus(row);
      if (filter === "connected") {
        return row.publisherSlug === GOOGLE_SLUG
          ? googleConnected
          : Boolean((urls[row.id] ?? "").trim());
      }
      if (filter === "needs-action") {
        return (
          status === "Needs action" ||
          status === "Connection error" ||
          status === "Pending verification" ||
          status === "Approval required" ||
          status === "Customer verification" ||
          status === "Ready to submit" ||
          status === "Ready to distribute" ||
          (row.isCore && status === "Not configured")
        );
      }
      if (filter === "managed") {
        return (
          row.deliveryRail === "managed_submission" ||
          row.deliveryRail === "customer_action" ||
          row.deliveryRail === "monitor_only"
        );
      }
      return true;
    });
  })();

  const filteredAuditOnlyRows = useMemo(() => {
    const query = auditOnlySearch.trim().toLowerCase();
    const rows = query
      ? auditOnlyRows.filter((row) =>
          `${row.publisherName} ${row.publisherSlug}`
            .toLowerCase()
            .includes(query),
        )
      : auditOnlyRows;

    return [...rows].sort((a, b) => {
      const aConfigured = Boolean((urls[a.id] ?? "").trim());
      const bConfigured = Boolean((urls[b.id] ?? "").trim());
      if (aConfigured !== bConfigured) return aConfigured ? -1 : 1;
      return Number(b.isCore) - Number(a.isCore);
    });
  }, [auditOnlyRows, auditOnlySearch, urls]);

  function openAuditOnly() {
    setShowAuditOnly(true);
    requestAnimationFrame(() => {
      document
        .getElementById("submission-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function saveAuditOnlyUrl(row: PublisherRow) {
    startSaveTransition(async () => {
      try {
        const value = (urls[row.id] ?? "").trim();
        await updateListingUrlAction({
          locationId,
          locationPublisherId: row.id,
          listingUrl: value,
          status: value ? "pending" : "unknown",
        });
        toast.success(
          value
            ? `${row.publisherName} added to monitoring`
            : `${row.publisherName} removed`,
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save URL");
      }
    });
  }

  function quickAddUrls() {
    const pasted = parsePastedUrls(quickPaste);
    if (pasted.length === 0) {
      toast.error("Paste at least one complete https:// listing URL");
      return;
    }

    startSaveTransition(async () => {
      let saved = 0;
      const missed: string[] = [];

      for (const url of pasted) {
        const slug = publisherSlugForListingUrl(url);
        const row = auditOnlyRows.find(
          (publisher) => publisher.publisherSlug === slug,
        );

        if (!row) {
          missed.push(url);
          continue;
        }

        await updateListingUrlAction({
          locationId,
          locationPublisherId: row.id,
          listingUrl: url,
          status: "pending",
        });
        setUrls((current) => ({ ...current, [row.id]: url }));
        saved += 1;
      }

      if (saved > 0) {
        toast.success(
          `Added ${saved} tracked listing${saved === 1 ? "" : "s"}`,
        );
        setQuickPaste(missed.join(" "));
        router.refresh();
      }
      if (missed.length > 0) {
        toast.info(
          `${missed.length} link${missed.length === 1 ? "" : "s"} could not be matched to a supported publisher`,
        );
      }
    });
  }

  function discoverFromWebsite() {
    startDiscoverTransition(async () => {
      try {
        const result = await discoverListingUrlsAction(locationId);
        if (result.filled.length === 0) {
          toast.info(
            result.scannedWebsite
              ? "No new directory links were found on the website"
              : "Add a website to the Master Profile first, or paste listing links below",
          );
        } else {
          setUrls((current) => {
            const next = { ...current };
            for (const found of result.filled) {
              const row = publisherRows.find(
                (publisher) =>
                  publisher.publisherSlug === found.publisherSlug,
              );
              if (row) next[row.id] = found.url;
            }
            return next;
          });
          toast.success(
            `Found ${result.filled.length} listing${result.filled.length === 1 ? "" : "s"} on the website`,
          );
          router.refresh();
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Website discovery failed",
        );
      }
    });
  }

  function runAudit() {
    startAuditTransition(async () => {
      try {
        toast.info("Checking tracked listings against the Master Profile…");
        const result = await startAuditAction(locationId);
        toast.success(
          `Audit complete — ${result.score.auditScore}/50 consistency points`,
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Audit failed");
      }
    });
  }

  function createTasks(row: PublisherRow) {
    startSaveTransition(async () => {
      try {
        const created = await createChecklistTasksAction({
          locationId,
          publisherId: row.publisherId,
        });
        toast.success(
          created.length > 0
            ? `Created ${created.length} ${row.publisherName} task${created.length === 1 ? "" : "s"}`
            : "No new tasks were needed",
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create tasks");
      }
    });
  }

  return (
    <div className="relative space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] bg-[#102d32] text-white shadow-[0_24px_70px_-34px_rgba(7,38,43,0.75)]">
        <div className="px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/80">
                  <SparklesIcon className="size-3.5 text-emerald-300" />
                  Listings control plane
                </span>
                <span className="text-xs text-white/50">
                  Truthful delivery · evidence at every step
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                One approved profile. Every available listing rail.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                LocalSync discovers the business, routes each publisher through
                the delivery method we actually control, and shows the proof
                before anything is called submitted, live, or verified.
              </p>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-white/12 bg-white/[0.07] p-4 xl:max-w-sm">
              <p className="text-xs font-semibold tracking-wide text-emerald-300 uppercase">
                Your next step
              </p>
              <p className="mt-1.5 text-base font-semibold">
                {primaryAction.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                {primaryAction.note}
              </p>
              <Button
                className="mt-4 w-full bg-white text-slate-950 hover:bg-white/90"
                nativeButton={false}
                render={<Link href={primaryAction.href} />}
              >
                {primaryAction.label}
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>

          <ol className="mt-7 grid gap-4 border-t border-white/12 pt-6 lg:grid-cols-4 lg:gap-2">
            <ProgressStep
              index={1}
              label="Master Profile"
              description={`${profileScore}/50 profile points`}
              done={profileReady}
              current={currentStep === 0}
            />
            <ProgressStep
              index={2}
              label="Discover sources"
              description={`${publisherRows.length} publishers classified`}
              done={publisherRows.length > 0}
              current={currentStep === 1}
            />
            <ProgressStep
              index={3}
              label="Start campaign"
              description={
                submissionCampaign
                  ? `${submissionCampaign.targetCount} durable jobs created`
                  : "Create one job per publisher"
              }
              done={Boolean(submissionCampaign)}
              current={currentStep === 2}
            />
            <ProgressStep
              index={4}
              label="Approve & verify"
              description={
                submissionCampaign
                  ? `${campaignVerifiedCount}/${submissionCampaign.targetCount} verified live`
                  : "Review every external outcome"
              }
              done={
                submissionCampaign !== null &&
                submissionCampaign.targetCount > 0 &&
                campaignVerifiedCount === submissionCampaign.targetCount
              }
              current={currentStep === 3}
            />
          </ol>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
        <Card className="localmap-card-glow overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Listing health
                </p>
                <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">
                  {listingHealthScore}
                  <span className="text-base font-medium text-muted-foreground">
                    /100
                  </span>
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-5" />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Master Profile",
                  value: profileScore,
                  max: 50,
                },
                {
                  label: "Listing checks",
                  value: listingConsistencyScore,
                  max: 50,
                },
              ].map((score) => (
                <div key={score.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium">{score.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {score.value}/{score.max}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(score.value / score.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Transparent total: profile completeness (50) plus evidence from
              listing checks (50). Direct sync never adds points without a
              verified read.
            </p>
          </CardContent>
        </Card>

        <Card className="localmap-card-glow">
          <CardContent className="p-5 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Publisher coverage
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {connectedCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {googleConnected ? "Google account connected" : "No direct account yet"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant={automationReadyCount > 0 ? "default" : "secondary"}>
                {automationReadyCount} automation-ready
              </Badge>
              <Badge variant="outline">
                {approvalRequiredCount} approval-gated
              </Badge>
              <Badge variant="outline">
                {managedSubmissionCount} managed
              </Badge>
              <Badge variant="outline">
                {customerActionCount} customer verification
              </Badge>
              <Badge variant="outline">
                {monitorOnlyCount} monitored
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="localmap-card-glow">
          <CardContent className="p-5 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Needs attention
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {needsActionCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Specific account, match, verification, or coverage actions.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-5"
              onClick={() => setFilter("needs-action")}
            >
              Show actions
              <ListFilterIcon className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section id="submission-campaign" className="scroll-mt-6">
        <SubmissionCampaignPanel
          locationId={locationId}
          sourceCount={publisherRows.length}
          campaign={submissionCampaign}
        />
      </section>

      <Card id="publisher-health" className="localmap-card-glow scroll-mt-6">
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Publisher health</CardTitle>
              <CardDescription className="mt-1">
                Account, listing, data, and verification state in one place.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1">
              {(
                [
                  ["all", "All"],
                  ["connected", "Connected"],
                  ["needs-action", "Needs action"],
                  ["managed", "Managed / monitor"],
                ] as Array<[PublisherFilter, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={cn(
                    "min-h-8 rounded-lg px-3 text-xs font-semibold transition-colors",
                    filter === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden grid-cols-[1.4fr_.85fr_1fr_1fr_.8fr_auto] gap-3 border-b bg-muted/25 px-5 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase xl:grid">
            <span>Publisher</span>
            <span>Integration</span>
            <span>Account / listing</span>
            <span>Data status</span>
            <span>Last checked</span>
            <span>Action</span>
          </div>

          {visiblePublisherRows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No publishers match this filter.
            </div>
          ) : (
            visiblePublisherRows.map((row) => {
              const status = publisherStatus(row);
              const isGoogle = row.publisherSlug === GOOGLE_SLUG;
              const listingUrl = (urls[row.id] ?? "").trim();
              const actionLabel = isGoogle
                ? !googleConnected
                  ? "Connect"
                  : !listingMatched
                    ? "Match listing"
                    : liveAndSynced
                      ? "Manage"
                      : "Review"
                : publisherNextActionLabel({
                    state: row,
                    hasListingUrl: Boolean(listingUrl),
                  });

              return (
                <div
                  key={row.id}
                  className="grid gap-4 border-b px-5 py-5 last:border-b-0 xl:grid-cols-[1.4fr_.85fr_1fr_1fr_.8fr_auto] xl:items-center xl:gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PublisherIcon
                      slug={row.publisherSlug}
                      badge
                      size={38}
                      showCheck={status === "Live & synced"}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {row.publisherName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.isCore ? "Priority publisher" : "Extended network"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase xl:hidden">
                      Integration
                    </p>
                    <Badge
                      variant={isAutomationRail(row) ? "default" : "outline"}
                    >
                      {integrationLabel(row)}
                    </Badge>
                    <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                      {publisherDeliveryDescription(row)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase xl:hidden">
                      Account / listing
                    </p>
                    <p className="text-sm">
                      {isGoogle
                        ? googleConnected
                          ? listingMatched
                            ? "Account connected · match confirmed"
                            : "Connected · match required"
                          : "Account not connected"
                        : listingUrl
                          ? "Public URL saved"
                          : "No listing URL"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase xl:hidden">
                      Data status
                    </p>
                    <Badge variant={statusTone(status)}>{status}</Badge>
                    {isGoogle && matchedGoogleLocation?.verification ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {matchedGoogleLocation.verification.label}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase xl:hidden">
                      Last checked
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(row.lastCheckedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {isGoogle ? (
                      <Button
                        size="sm"
                        variant={liveAndSynced ? "outline" : "default"}
                        nativeButton={false}
                        render={<Link href="/dashboard/connect/google" />}
                      >
                        {actionLabel}
                        <ArrowRightIcon className="size-3.5" />
                      </Button>
                    ) : listingUrl ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={
                            <a href={listingUrl} target="_blank" rel="noreferrer" />
                          }
                        >
                          {actionLabel}
                          <ExternalLinkIcon className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => createTasks(row)}
                          disabled={savePending}
                        >
                          Tasks
                        </Button>
                      </>
                    ) : row.deliveryRail === "monitor_only" ? (
                      <Button size="sm" variant="outline" onClick={openAuditOnly}>
                        {actionLabel}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createTasks(row)}
                        disabled={savePending}
                      >
                        {actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card
        id="submission-workspace"
        className="localmap-card-glow scroll-mt-6 border-dashed"
      >
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">Submission workspace</Badge>
                <span className="text-xs text-muted-foreground">
                  Managed, customer-action, and monitoring rails
                </span>
              </div>
              <CardTitle className="text-lg">Add or verify another publisher</CardTitle>
              <CardDescription className="mt-1">
                Paste known public URLs, let LocalSync discover links from the
                business website, or prepare the next submission task.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuditOnly((current) => !current)}
            >
              {showAuditOnly ? "Hide workspace" : "Open workspace"}
              {showAuditOnly ? (
                <ChevronUpIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {showAuditOnly ? (
          <CardContent className="space-y-5 border-t pt-5">
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 lg:flex-row lg:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="audit-quick-paste">Paste listing links</Label>
                <Input
                  id="audit-quick-paste"
                  placeholder="https://www.yelp.com/biz/…  https://www.bbb.org/…"
                  value={quickPaste}
                  onChange={(event) => setQuickPaste(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      quickAddUrls();
                    }
                  }}
                />
              </div>
              <Button onClick={quickAddUrls} disabled={savePending}>
                <Link2Icon className="size-4" />
                Match links
              </Button>
              <Button
                variant="outline"
                onClick={discoverFromWebsite}
                disabled={discoverPending}
              >
                <SearchIcon className="size-4" />
                {discoverPending ? "Scanning…" : "Find on website"}
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={auditOnlySearch}
                  onChange={(event) => setAuditOnlySearch(event.target.value)}
                  placeholder="Search directories"
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={runAudit}
                disabled={auditPending || configuredAuditOnlyCount === 0}
              >
                <RadarIcon className="size-4" />
                {auditPending
                  ? "Checking listings…"
                  : `Check ${configuredAuditOnlyCount} listing${configuredAuditOnlyCount === 1 ? "" : "s"}`}
              </Button>
            </div>

            <div className="space-y-3">
              {filteredAuditOnlyRows.map((row) => {
                const savedUrl = row.listingUrl ?? "";
                const value = urls[row.id] ?? "";
                const dirty = value.trim() !== savedUrl.trim();

                return (
                  <div
                    key={row.id}
                    className="grid gap-3 rounded-2xl border p-4 lg:grid-cols-[minmax(190px,.7fr)_1.6fr_auto] lg:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <PublisherIcon
                        slug={row.publisherSlug}
                        badge
                        size={34}
                        showCheck={Boolean(savedUrl)}
                      />
                      <div>
                        <p className="text-sm font-semibold">
                          {row.publisherName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {publisherDeliveryLabel(row)} · {row.isCore ? "priority" : "extended"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="sr-only">
                        Listing URL for {row.publisherName}
                      </Label>
                      <Input
                        placeholder={listingUrlPlaceholder(row.publisherSlug)}
                        value={value}
                        onChange={(event) =>
                          setUrls((current) => ({
                            ...current,
                            [row.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      variant={dirty ? "default" : "outline"}
                      disabled={savePending || (!dirty && Boolean(savedUrl))}
                      onClick={() => saveAuditOnlyUrl(row)}
                    >
                      {dirty ? (value.trim() ? "Save URL" : "Remove") : savedUrl ? "Saved" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Card className="localmap-card-glow">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <HistoryIcon className="size-4 text-primary" />
              <CardTitle className="text-lg">Verification activity</CardTitle>
            </div>
            <CardDescription className="mt-1">
              A readable record of checks. A discovered or submitted listing is
              never called synchronized until live evidence confirms it.
            </CardDescription>
          </div>
          {configuredAuditOnlyCount > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={runAudit}
              disabled={auditPending}
            >
              <RadarIcon className="size-4" />
              Run listing check
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {auditRuns.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/15 px-5 py-8 text-center">
              <Clock3Icon className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No listing checks yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Google verification is handled through the direct connection.
                Add another directory only if you also want URL monitoring.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-2xl border">
              {auditRuns.slice(0, 5).map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/locations/${locationId}/listings/${run.id}`}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    {run.status === "completed" ? (
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : run.status === "failed" ? (
                      <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                    ) : (
                      <CircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {run.status} listing check
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {run.summary ?? "Listing values compared with the Master Profile"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatDate(run.completedAt ?? run.createdAt)}
                    <ArrowRightIcon className="size-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionLoadingOverlay
        active={auditPending || discoverPending}
        label={
          discoverPending
            ? "Scanning the website for public listing links…"
            : "Checking tracked listings against the Master Profile…"
        }
        className="rounded-[1.75rem]"
      />

      {!canSync && googleConnected ? (
        <p className="text-center text-xs text-muted-foreground">
          Google comparison and import are available. Direct write approval is a
          Premium feature. <Link href="/dashboard/billing" className="font-medium text-primary hover:underline">View plans</Link>.
        </p>
      ) : null}
    </div>
  );
}
