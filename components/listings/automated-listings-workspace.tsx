"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
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
import { googleLocationName } from "@/lib/connectors/google-resource-names";
import type { GoogleImportState } from "@/app/actions/google-import";
import { createChecklistTasksAction } from "@/app/actions/tasks";
import { PublisherIcon } from "@/components/brand/publisher-icon";
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
import { normalizeListingUrl, publisherSlugForListingUrl } from "@/lib/publishers/detect-listing-url";
import { listingUrlPlaceholder } from "@/lib/publishers/listing-setup-copy";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import { cn } from "@/lib/utils";

type PublisherRow = {
  id: string;
  publisherId: string;
  publisherName: string;
  publisherSlug: string;
  rail: string;
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

type PublisherFilter = "all" | "connected" | "needs-action" | "audit-only";

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
  if (row.publisherSlug === GOOGLE_SLUG) return "Direct";
  if (row.rail === "audit_only" || row.rail === "manual") return "Audit-only";
  if (row.rail === "guided_import") return "Guided / audit-only";
  return "Not available yet";
}

function statusTone(status: string):
  | "default"
  | "secondary"
  | "outline"
  | "destructive" {
  if (status === "Live & synced") return "default";
  if (["Needs action", "Connection error", "Listing unavailable"].includes(status)) {
    return "destructive";
  }
  if (["Pending verification", "Verification unavailable", "Differences to review", "Confirmation required", "Ready to audit"].includes(status)) {
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
  const [savedUrlChanges, setSavedUrlChanges] = useState<
    Record<string, { previous: string; value: string }>
  >({});
  // Transitions update the UI asynchronously; this lock also covers same-tick clicks.
  const actionLock = useRef(false);
  const [savePending, startSaveTransition] = useTransition();
  const [discoverPending, startDiscoverTransition] = useTransition();
  const [auditPending, startAuditTransition] = useTransition();
  const actionPending = savePending || discoverPending || auditPending;

  function savedUrlFor(row: PublisherRow): string {
    const serverValue = row.listingUrl ?? "";
    const saved = savedUrlChanges[row.id];
    return saved?.previous === serverValue ? saved.value : serverValue;
  }

  function recordSavedUrl(row: PublisherRow, value: string) {
    const canonical = value ? normalizeListingUrl(value) ?? value : "";
    setSavedUrlChanges((current) => ({
      ...current,
      [row.id]: { previous: row.listingUrl ?? "", value: canonical },
    }));
    // Do not overwrite an edit made while the request was in flight.
    setUrls((current) => (current[row.id] ?? "") === (urls[row.id] ?? "")
      ? { ...current, [row.id]: canonical }
      : current);
  }

  const googleRow = publisherRows.find(
    (row) => row.publisherSlug === GOOGLE_SLUG,
  );
  const googleConnected = googleState.status === "connected";
  const googleConnectionError =
    googleState.status === "connected" ? googleState.fetchError : undefined;
  const matchedGoogleLocation =
    googleState.status === "connected" && !googleConnectionError && googleRow?.externalId
      ? googleState.locations.find(
          (location) => {
            const linkedName = googleLocationName(googleRow.externalId!);
            return linkedName && googleLocationName(location.gbpName) === linkedName;
          },
        )
      : undefined;
  const googleVerification = matchedGoogleLocation
    ? verifyGoogleProfile(profile, matchedGoogleLocation)
    : null;
  const liveAndSynced = Boolean(
    googleVerification?.verified && googleRow?.lastCheckedAt,
  );
  const profileReady = profileScore >= 35;
  const listingMatched = Boolean(matchedGoogleLocation);
  const verificationUnavailable = !matchedGoogleLocation?.verification ||
    matchedGoogleLocation.verification.status === "unknown";

  const auditOnlyRows = publisherRows.filter(
    (row) => row.publisherSlug !== GOOGLE_SLUG,
  );
  const configuredAuditOnlyCount = auditOnlyRows.filter((row) =>
    Boolean(savedUrlFor(row).trim()),
  ).length;
  const connectedCount = (googleConnected ? 1 : 0) + configuredAuditOnlyCount;
  const needsActionCount = liveAndSynced ? 0 : 1;

  const currentStep = !googleConnected || googleConnectionError
    ? 1
    : !listingMatched
      ? 2
      : !liveAndSynced
        ? 3
        : !profileReady ? 0 : 3;

  const primaryAction = !googleConnected
    ? {
        label: "Connect Google account",
        href: "/dashboard/connect/google",
        note: "Connect first to reuse your existing Google business details.",
      }
    : googleConnectionError
      ? {
          label: "Resolve Google access",
          href: "/dashboard/connect/google",
          note: googleConnectionError.message,
        }
      : !listingMatched
        ? {
            label: googleRow?.externalId ? "Review linked Google listing" : "Choose your Google listing",
            href: "/dashboard/connect/google",
            note: googleRow?.externalId
              ? "The saved listing could not be read from this Google account. Review access or choose the correct listing."
              : "Confirm which publisher record belongs to this Master Profile.",
          }
        : !liveAndSynced
          ? {
              label: "Review & approve differences",
              href: "/dashboard/connect/google",
              note: googleVerification?.mismatchedFields.length
                ? `${googleVerification.mismatchedFields.length} supported field${googleVerification.mismatchedFields.length === 1 ? "" : "s"} still ${googleVerification.mismatchedFields.length === 1 ? "differs" : "differ"}.`
                : verificationUnavailable
                  ? "The fields match, but Google’s ownership verification status is unavailable. Check the connection before continuing."
                  : !googleVerification?.listingVerified
                    ? matchedGoogleLocation?.verification?.label ?? "Review Google verification status."
                    : "The fields match and Google is verified. Save the listing confirmation to continue.",
            }
          : !profileReady
            ? {
                label: "Complete Master Profile",
                href: `/dashboard/locations/${locationId}`,
                note: "Google details are confirmed. Add only the business facts still missing from your profile.",
              }
            : {
                label: "Review publisher health",
                href: "#publisher-health",
                note: "Google is verified. Review audit-only coverage and recent checks.",
              };

  function publisherStatus(row: PublisherRow): string {
    if (row.publisherSlug === GOOGLE_SLUG) {
      if (googleState.status === "not_configured") return "Connection error";
      if (!googleConnected) return "Needs action";
      if (googleConnectionError) return "Connection error";
      if (!listingMatched) return googleRow?.externalId ? "Listing unavailable" : "Needs action";
      if (liveAndSynced) return "Live & synced";
      if (googleVerification?.mismatchedFields.length) return "Differences to review";
      if (verificationUnavailable) return "Verification unavailable";
      if (googleVerification?.listingVerified) return "Confirmation required";
      return "Pending verification";
    }

    const hasUrl = Boolean(savedUrlFor(row).trim());
    if (!hasUrl) return "Not configured";
    return row.lastCheckedAt ? "Audit complete" : "Ready to audit";
  }

  const visiblePublisherRows = (() => {
    const sorted = [...publisherRows].sort((a, b) => {
      if (a.publisherSlug === GOOGLE_SLUG) return -1;
      if (b.publisherSlug === GOOGLE_SLUG) return 1;
      const aConfigured = Boolean(savedUrlFor(a).trim());
      const bConfigured = Boolean(savedUrlFor(b).trim());
      if (aConfigured !== bConfigured) return aConfigured ? -1 : 1;
      return Number(b.isCore) - Number(a.isCore);
    });

    return sorted.filter((row) => {
      const status = publisherStatus(row);
      if (filter === "connected") {
        return row.publisherSlug === GOOGLE_SLUG
          ? googleConnected
          : Boolean(savedUrlFor(row).trim());
      }
      if (filter === "needs-action") {
        return (
          status === "Needs action" ||
          status === "Connection error" ||
          status === "Pending verification" ||
          status === "Listing unavailable" ||
          status === "Verification unavailable" ||
          status === "Differences to review" ||
          status === "Confirmation required"
        );
      }
      if (filter === "audit-only") return row.publisherSlug !== GOOGLE_SLUG;
      return true;
    });
  })();

  const filteredAuditOnlyRows = (() => {
    const query = auditOnlySearch.trim().toLowerCase();
    const rows = query
      ? auditOnlyRows.filter((row) =>
          `${row.publisherName} ${row.publisherSlug}`
            .toLowerCase()
            .includes(query),
        )
      : auditOnlyRows;

    return [...rows].sort((a, b) => {
      const aConfigured = Boolean(savedUrlFor(a).trim());
      const bConfigured = Boolean(savedUrlFor(b).trim());
      if (aConfigured !== bConfigured) return aConfigured ? -1 : 1;
      return Number(b.isCore) - Number(a.isCore);
    });
  })();

  function openAuditOnly() {
    setShowAuditOnly(true);
    requestAnimationFrame(() => {
      document
        .getElementById("audit-only-listings")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function saveAuditOnlyUrl(row: PublisherRow) {
    if (actionLock.current) return;
    actionLock.current = true;
    startSaveTransition(async () => {
      try {
        const value = (urls[row.id] ?? "").trim();
        await updateListingUrlAction({
          locationId,
          locationPublisherId: row.id,
          listingUrl: value,
          status: value ? "pending" : "unknown",
        });
        recordSavedUrl(row, value);
        toast.success(
          value
            ? `${row.publisherName} added as audit-only`
            : `${row.publisherName} removed`,
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save URL");
      } finally {
        actionLock.current = false;
      }
    });
  }

  function quickAddUrls() {
    if (actionLock.current) return;
    const pastedText = quickPaste;
    const pasted = parsePastedUrls(pastedText);
    if (pasted.length === 0) {
      toast.error("Paste at least one complete https:// listing URL");
      return;
    }

    actionLock.current = true;
    startSaveTransition(async () => {
      let saved = 0;
      let index = 0;
      const remaining: string[] = [];
      try {
        for (; index < pasted.length; index += 1) {
          const url = pasted[index];
          const slug = publisherSlugForListingUrl(url);
          const row = auditOnlyRows.find(
            (publisher) => publisher.publisherSlug === slug,
          );
          if (!row) {
            remaining.push(url);
            continue;
          }
          await updateListingUrlAction({
            locationId,
            locationPublisherId: row.id,
            listingUrl: url,
            status: "pending",
          });
          recordSavedUrl(row, url);
          saved += 1;
        }
        if (remaining.length > 0) {
          toast.info(`${remaining.length} link${remaining.length === 1 ? "" : "s"} could not be matched to a supported publisher`);
        }
      } catch (error) {
        remaining.push(...pasted.slice(index));
        toast.error(error instanceof Error ? error.message : "Could not save listing links");
      } finally {
        if (saved > 0) {
          toast.success(`Added ${saved} audit-only listing${saved === 1 ? "" : "s"}`);
          router.refresh();
        }
        setQuickPaste((current) => current === pastedText ? remaining.join(" ") : current);
        actionLock.current = false;
      }
    });
  }

  function discoverFromWebsite() {
    if (actionLock.current) return;
    actionLock.current = true;
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
          for (const found of result.filled) {
            const row = publisherRows.find(
              (publisher) => publisher.publisherSlug === found.publisherSlug,
            );
            if (row) recordSavedUrl(row, found.url);
          }
          toast.success(
            `Found ${result.filled.length} listing${result.filled.length === 1 ? "" : "s"} on the website`,
          );
          router.refresh();
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Website discovery failed",
        );
      } finally {
        actionLock.current = false;
      }
    });
  }

  function runAudit() {
    if (actionLock.current || configuredAuditOnlyCount === 0) return;
    actionLock.current = true;
    startAuditTransition(async () => {
      try {
        toast.info("Checking audit-only listings against the Master Profile…");
        const result = await startAuditAction(locationId);
        if (result.status === "failed") {
          toast.error("The listing check failed. Your saved profile is unchanged; try again.");
        } else {
          toast.success(
            `Audit complete — ${result.score.auditScore}/50 consistency points`,
          );
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Audit failed");
      } finally {
        actionLock.current = false;
      }
    });
  }

  function createTasks(row: PublisherRow) {
    if (actionLock.current) return;
    actionLock.current = true;
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
      } finally {
        actionLock.current = false;
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
                  Automated listings
                </span>
                <span className="text-xs text-white/50">
                  Google first · every status verified
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                One profile. One connection. No guesswork.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                Saving business facts updates LocalMap only. Sending changes to
                Google is a separate approval step. LocalMap checks the live
                result before calling anything synced.
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
              label="Connect account"
              description={googleConnected ? "Google authorized" : "OAuth required"}
              done={googleConnected}
              current={currentStep === 1}
            />
            <ProgressStep
              index={3}
              label="Confirm listing"
              description={listingMatched ? "Publisher ID linked" : "Choose the right record"}
              done={listingMatched}
              current={currentStep === 2}
            />
            <ProgressStep
              index={4}
              label="Approve & verify"
              description={liveAndSynced ? "Live values match" : "Review every difference"}
              done={liveAndSynced}
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
              <Badge variant={googleConnected ? "default" : "secondary"}>
                {googleConnected ? "1 direct" : "0 direct"}
              </Badge>
              <Badge variant="outline">
                {configuredAuditOnlyCount} audit-only
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
                  ["audit-only", "Audit-only"],
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
              const listingUrl = savedUrlFor(row).trim();
              const actionLabel = isGoogle
                ? !googleConnected
                  ? "Connect"
                  : !listingMatched
                    ? "Match listing"
                    : liveAndSynced
                      ? "Manage"
                      : "Review"
                : listingUrl
                  ? "View listing"
                  : "Add URL";

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
                    <Badge variant={isGoogle ? "default" : "outline"}>
                      {integrationLabel(row)}
                    </Badge>
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
                          disabled={actionPending}
                        >
                          Tasks
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={openAuditOnly}>
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
        id="audit-only-listings"
        className="localmap-card-glow scroll-mt-6 border-dashed"
      >
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">Optional fallback</Badge>
                <span className="text-xs text-muted-foreground">
                  Monitoring only · no write access
                </span>
              </div>
              <CardTitle className="text-lg">Audit another directory</CardTitle>
              <CardDescription className="mt-1">
                Add a public URL only when direct account management is not
                available. LocalMap can check it, but cannot change it.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuditOnly((current) => !current)}
            >
              {showAuditOnly ? "Hide fallback" : "Add audit-only listing"}
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
              <Button onClick={quickAddUrls} disabled={actionPending}>
                <Link2Icon className="size-4" />
                Match links
              </Button>
              <Button
                variant="outline"
                onClick={discoverFromWebsite}
                disabled={actionPending}
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
                disabled={actionPending || configuredAuditOnlyCount === 0}
              >
                <RadarIcon className="size-4" />
                {auditPending
                  ? "Checking listings…"
                  : `Check ${configuredAuditOnlyCount} listing${configuredAuditOnlyCount === 1 ? "" : "s"}`}
              </Button>
            </div>

            <div className="space-y-3">
              {filteredAuditOnlyRows.map((row) => {
                const savedUrl = savedUrlFor(row);
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
                          Audit-only · {row.isCore ? "priority" : "extended"}
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
                      disabled={actionPending || !dirty}
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
              A readable record of checks. Audit-only results never imply write
              access or publisher sync.
            </CardDescription>
          </div>
          {configuredAuditOnlyCount > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={runAudit}
              disabled={actionPending}
            >
              <RadarIcon className="size-4" />
              Run audit-only check
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {auditRuns.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/15 px-5 py-8 text-center">
              <Clock3Icon className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No audit-only checks yet</p>
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
                        {run.status} audit-only check
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
            : "Checking audit-only listings against the Master Profile…"
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
