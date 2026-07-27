"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ClipboardPasteIcon,
  Link2Icon,
  RadarIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  startAuditAction,
  updateListingUrlAction,
} from "@/app/actions/audits";
import { requestPublisherSyncAction } from "@/app/actions/sync";
import { createChecklistTasksAction } from "@/app/actions/tasks";
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
import { ActionLoadingOverlay } from "@/components/ui/action-loading-overlay";
import { SCORE_LABELS } from "@/lib/scores/labels";
import {
  isErrorStatus,
  isNeedsActionStatus,
  presentIntegrationTier,
  presentListingStatus,
} from "@/lib/sync/statuses";

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
  matchConfidence: number | null;
  lastSyncedAt: Date | null;
  lastVerifiedAt: Date | null;
  lastCheckedAt: Date | null;
};

type AuditRunRow = {
  id: string;
  status: string;
  summary: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

type SyncJobRow = {
  id: string;
  status: string;
  fieldKeys: string[];
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  publisherName: string;
  publisherSlug: string;
};

type FilterMode =
  | "all"
  | "connected"
  | "live"
  | "syncing"
  | "needs_action"
  | "errors"
  | "audit_only"
  | "not_configured";

const GENERIC_NAME_WORDS = new Set([
  "business",
  "profile",
  "places",
  "connect",
  "pages",
  "local",
  "the",
]);

function publisherTokens(row: PublisherRow): string[] {
  const fromName = row.publisherName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !GENERIC_NAME_WORDS.has(word));
  const fromSlug = row.publisherSlug
    .toLowerCase()
    .split("-")
    .filter((word) => word.length >= 3 && !GENERIC_NAME_WORDS.has(word));

  return Array.from(new Set([...fromName, ...fromSlug]));
}

function detectPublisher(
  url: string,
  rows: PublisherRow[],
): PublisherRow | null {
  let hostname: string;
  try {
    hostname = new URL(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
    ).hostname.toLowerCase();
  } catch {
    return null;
  }

  for (const row of rows) {
    if (publisherTokens(row).some((token) => hostname.includes(token))) {
      return row;
    }
  }

  return null;
}

function badgeVariantForTone(
  tone: ReturnType<typeof presentListingStatus>["tone"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (tone) {
    case "success":
      return "default";
    case "danger":
      return "destructive";
    case "warning":
    case "info":
      return "secondary";
    default:
      return "outline";
  }
}

function rowMatchesFilter(row: PublisherRow, filter: FilterMode): boolean {
  const connected = Boolean(row.externalId);
  const hasAuditUrl = Boolean((row.listingUrl ?? "").trim());

  switch (filter) {
    case "connected":
      return connected;
    case "live":
      return row.status === "live_synced";
    case "syncing":
      return row.status === "syncing";
    case "needs_action":
      return isNeedsActionStatus(row.status);
    case "errors":
      return isErrorStatus(row.status);
    case "audit_only":
      return row.rail === "audit_only" || row.status === "audit_only" || (hasAuditUrl && !connected);
    case "not_configured":
      return !connected && !hasAuditUrl;
    default:
      return true;
  }
}

export function ListingsManager({
  locationId,
  publisherRows,
  auditRuns,
  syncJobs = [],
  canSync = false,
  listingConsistencyScore = 0,
  workspaceHealthTotal = 0,
}: {
  locationId: string;
  publisherRows: PublisherRow[];
  auditRuns: AuditRunRow[];
  syncJobs?: SyncJobRow[];
  canSync?: boolean;
  listingConsistencyScore?: number;
  workspaceHealthTotal?: number;
}) {
  const router = useRouter();
  const [urls, setUrls] = useState<Record<string, string>>(
    Object.fromEntries(publisherRows.map((row) => [row.id, row.listingUrl ?? ""])),
  );
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [quickPaste, setQuickPaste] = useState("");
  const [showAuditFallback, setShowAuditFallback] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [auditPending, startAuditTransition] = useTransition();

  const googleRow = publisherRows.find(
    (row) => row.publisherSlug === "google-business-profile",
  );
  const connectedCount = publisherRows.filter((row) => row.externalId).length;
  const liveCount = publisherRows.filter((row) => row.status === "live_synced").length;
  const needsActionCount = publisherRows.filter((row) =>
    isNeedsActionStatus(row.status),
  ).length;
  const configuredCount = publisherRows.filter((row) =>
    (urls[row.id] ?? "").trim(),
  ).length;

  function quickAdd() {
    const entries = quickPaste
      .split(/[\s,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      toast.error("Paste at least one listing URL");
      return;
    }

    startTransition(async () => {
      let saved = 0;
      const unmatched: string[] = [];

      for (const entry of entries) {
        const match = detectPublisher(entry, publisherRows);

        if (!match) {
          unmatched.push(entry);
          continue;
        }

        const normalized = /^https?:\/\//i.test(entry)
          ? entry
          : `https://${entry}`;

        try {
          await updateListingUrlAction({
            locationId,
            locationPublisherId: match.id,
            listingUrl: normalized,
          });
          setUrls((current) => ({ ...current, [match.id]: normalized }));
          saved += 1;
        } catch {
          unmatched.push(entry);
        }
      }

      if (saved > 0) {
        toast.success(
          `Saved ${saved} audit-only listing URL${saved === 1 ? "" : "s"}`,
        );
        setQuickPaste(unmatched.join("\n"));
        router.refresh();
      }

      if (unmatched.length > 0) {
        toast.error(
          `Couldn't match ${unmatched.length} URL${unmatched.length === 1 ? "" : "s"} — find the publisher below and paste it there`,
        );
      }
    });
  }

  const visibleRows = useMemo(() => {
    let rows = publisherRows.filter((row) => rowMatchesFilter(row, filter));

    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) =>
        row.publisherName.toLowerCase().includes(query),
      );
    }

    return rows;
  }, [filter, publisherRows, search]);

  function saveUrl(row: PublisherRow) {
    startTransition(async () => {
      try {
        await updateListingUrlAction({
          locationId,
          locationPublisherId: row.id,
          listingUrl: urls[row.id] ?? "",
        });
        toast.success(`${row.publisherName} audit-only URL saved`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save listing URL",
        );
      }
    });
  }

  const completedAuditCount = auditRuns.filter(
    (run) => run.status === "completed",
  ).length;

  function runAudit() {
    startAuditTransition(async () => {
      try {
        toast.info("Audit started — crawling listings. This can take a minute.");
        const result = await startAuditAction(locationId);
        const delta =
          result.listingScoreDelta != null && result.listingScoreDelta !== 0
            ? ` (${result.listingScoreDelta >= 0 ? "+" : ""}${result.listingScoreDelta} pts)`
            : "";
        toast.success(
          `${SCORE_LABELS.listingConsistency}: ${result.score.auditScore}/50${delta} · ${SCORE_LABELS.workspaceHealth}: ${result.score.total}/100`,
          {
            action: {
              label: "View score",
              onClick: () =>
                router.push(`/dashboard/locations/${locationId}/visibility`),
            },
          },
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Audit failed");
        router.refresh();
      }
    });
  }

  function addChecklist(row: PublisherRow) {
    startTransition(async () => {
      try {
        await createChecklistTasksAction({
          locationId,
          publisherId: row.publisherId,
        });
        toast.success(`Checklist tasks created for ${row.publisherName}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create tasks",
        );
      }
    });
  }

  function syncGoogle() {
    startTransition(async () => {
      try {
        toast.info("Queuing Google sync job…");
        const result = await requestPublisherSyncAction({
          locationId,
          publisherSlug: "google-business-profile",
        });
        toast.success(
          `Sync job queued (${result.syncJobId.slice(0, 8)}…). Live and synced only after verification.`,
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sync failed");
      }
    });
  }

  const filters: Array<[FilterMode, string]> = [
    ["all", "All"],
    ["connected", "Connected"],
    ["live", "Live"],
    ["syncing", "Syncing"],
    ["needs_action", "Needs action"],
    ["errors", "Errors"],
    ["audit_only", "Audit-only"],
    ["not_configured", "Not configured"],
  ];

  return (
    <div className="relative space-y-6">
      <Card className="localmap-card-glow border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Publisher coverage</CardTitle>
          <CardDescription>
            Connect accounts, discover listings, sync approved Master Profile
            changes, and verify live publisher state. Manual URLs are audit-only
            fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
            nativeButton={false}
            render={<Link href="/dashboard/connect" />}
          >
            <span className="flex items-center gap-2 font-medium">
              <Link2Icon className="size-4" />
              Connect accounts
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Authorize LocalMap to find, update, and monitor listings.
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
            nativeButton={false}
            render={<Link href="/dashboard/import/google" />}
          >
            <span className="flex items-center gap-2 font-medium">
              <SearchIcon className="size-4" />
              Find my listings
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Import authorized Google locations and match external IDs.
            </span>
          </Button>

          <Button
            variant="default"
            className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
            disabled={isPending || !canSync || !googleRow?.externalId}
            onClick={syncGoogle}
          >
            <span className="flex items-center gap-2 font-medium">
              <RefreshCwIcon className="size-4" />
              Sync all changes
            </span>
            <span className="text-xs font-normal opacity-90">
              {!canSync
                ? "Premium required for direct sync."
                : !googleRow?.externalId
                  ? "Match Google first, then sync."
                  : "Queue verified write + re-read for Google."}
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
            onClick={() => setShowAuditFallback((value) => !value)}
          >
            <span className="flex items-center gap-2 font-medium">
              <ClipboardPasteIcon className="size-4" />
              Add audit-only listing
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Add a URL that can be monitored but not directly synchronized.
            </span>
          </Button>
        </CardContent>
        <CardContent className="flex flex-wrap gap-3 border-t pt-4 text-sm text-muted-foreground">
          <span>{connectedCount} connected</span>
          <span>{liveCount} live and synced</span>
          <span>{needsActionCount} need action</span>
          <span>{configuredCount} audit URLs</span>
        </CardContent>
      </Card>

      {configuredCount > 0 ? (
        <Card
          className={
            listingConsistencyScore > 0
              ? "localmap-card-glow border-emerald-500/30 bg-emerald-500/5"
              : "localmap-card-glow border-amber-500/30 bg-amber-500/5"
          }
        >
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {SCORE_LABELS.listingConsistency}: {listingConsistencyScore}/50
              </p>
              <p className="text-sm text-muted-foreground">
                {completedAuditCount === 0
                  ? "Run a listing audit to unlock this half of workspace health."
                  : listingConsistencyScore === 0
                    ? "Findings found — fix NAP mismatches on directories, then re-run the audit."
                    : `${SCORE_LABELS.workspaceHealth} total: ${workspaceHealthTotal}/100`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={runAudit}
                disabled={auditPending || configuredCount === 0}
              >
                {auditPending ? "Auditing…" : "Run audit"}
              </Button>
              {listingConsistencyScore > 0 ? (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link href={`/dashboard/locations/${locationId}/visibility`} />
                  }
                >
                  View breakdown
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showAuditFallback ? (
        <Card className="localmap-card-glow border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardPasteIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">
                Audit-only fallback — paste listing links
              </CardTitle>
            </div>
            <CardDescription>
              These URLs are monitored, not synchronized. Saving a URL never
              marks a publisher Live and synced.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="https://www.yelp.com/biz/your-business  https://www.bbb.org/…"
              value={quickPaste}
              onChange={(event) => setQuickPaste(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  quickAdd();
                }
              }}
              className="flex-1"
            />
            <Button onClick={quickAdd} disabled={isPending}>
              {isPending ? "Matching…" : "Add audit URLs"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="localmap-card-glow relative overflow-hidden">
        <CardHeader>
          <CardTitle>Publishers</CardTitle>
          <CardDescription>
            Connection, match, sync, and verification state per publisher.
            Direct sync currently ships for Google Business Profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search publishers…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
              {filters.map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={filter === value ? "default" : "ghost"}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No publishers match this filter. Try &quot;All&quot; or clear search.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Publisher</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">External ID / URL</th>
                    <th className="px-3 py-2 font-medium">Last verified</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const status = presentListingStatus(row.status);
                    const tier = presentIntegrationTier(row.rail);

                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="px-3 py-3 align-top">
                          <div className="font-medium">{row.publisherName}</div>
                          {row.isCore ? (
                            <Badge variant="secondary" className="mt-1 text-[10px]">
                              Core
                            </Badge>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge variant="outline">{tier}</Badge>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge variant={badgeVariantForTone(status.tone)}>
                            {status.label}
                          </Badge>
                          <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                            {status.description}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          {row.externalId ? (
                            <p className="font-mono text-xs break-all">
                              {row.externalId}
                            </p>
                          ) : null}
                          {showAuditFallback || row.listingUrl ? (
                            <div className="mt-2 space-y-1">
                              <Label className="sr-only">
                                Listing URL for {row.publisherName}
                              </Label>
                              <Input
                                placeholder="Audit-only https://..."
                                value={urls[row.id] ?? ""}
                                onChange={(event) =>
                                  setUrls((current) => ({
                                    ...current,
                                    [row.id]: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {row.rail === "api"
                                ? "Connect account to import ID"
                                : "No listing linked"}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                          {row.lastVerifiedAt
                            ? new Date(row.lastVerifiedAt).toLocaleString()
                            : row.lastSyncedAt
                              ? `Accepted ${new Date(row.lastSyncedAt).toLocaleString()}`
                              : row.lastCheckedAt
                                ? `Checked ${new Date(row.lastCheckedAt).toLocaleString()}`
                                : "—"}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {row.publisherSlug === "google-business-profile" &&
                            row.externalId &&
                            canSync ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={syncGoogle}
                              >
                                Force sync
                              </Button>
                            ) : null}
                            {row.publisherSlug === "google-business-profile" &&
                            !row.externalId ? (
                              <Button
                                size="sm"
                                variant="outline"
                                nativeButton={false}
                                render={<Link href="/dashboard/import/google" />}
                              >
                                Match
                              </Button>
                            ) : null}
                            {(showAuditFallback || row.listingUrl) && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => saveUrl(row)}
                              >
                                Save URL
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => addChecklist(row)}
                            >
                              Tasks
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="localmap-card-glow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <RadarIcon className="size-4 text-primary" />
            <CardTitle>Sync jobs</CardTitle>
          </div>
          <CardDescription>
            Asynchronous publisher writes. Accepted is not Live and synced until
            LocalMap re-reads the publisher.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {syncJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No sync jobs yet. Connect Google, match a listing, then sync
              approved changes.
            </div>
          ) : (
            syncJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {job.publisherName} · {new Date(job.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {job.errorMessage ??
                      `${job.fieldKeys.length} field${job.fieldKeys.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <Badge
                  variant={
                    job.status === "live"
                      ? "default"
                      : job.status === "failed" || job.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {job.status === "live" ? "live (verified)" : job.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="localmap-card-glow">
        <CardHeader>
          <CardTitle>Audit history</CardTitle>
          <CardDescription>
            Crawl-based audits remain available for audit-only publishers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditRuns.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm font-medium">No audits yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add audit-only URLs and run an audit, or sync a connected
                publisher.
              </p>
            </div>
          ) : (
            auditRuns.map((run) => (
              <Link
                key={run.id}
                href={`/dashboard/locations/${locationId}/listings/${run.id}`}
                className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">
                    {new Date(run.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {run.summary ?? "In progress..."}
                  </p>
                </div>
                <Badge
                  variant={
                    run.status === "completed"
                      ? "default"
                      : run.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {run.status}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <ActionLoadingOverlay
        active={auditPending}
        label="Running listing audit — crawling URLs…"
        className="rounded-2xl"
      />
    </div>
  );
}
