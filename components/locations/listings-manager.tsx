"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2Icon,
  ClipboardPasteIcon,
  ExternalLinkIcon,
  Link2Icon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  discoverListingUrlsAction,
  startAuditAction,
  updateListingUrlAction,
} from "@/app/actions/audits";
import { createChecklistTasksAction } from "@/app/actions/tasks";
import { PublisherIcon } from "@/components/brand/publisher-icon";
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
import { publisherSlugForListingUrl } from "@/lib/publishers/detect-listing-url";
import {
  coreCoverage,
  listingUrlPlaceholder,
  listingWhyLine,
  nextUnlinkedPublishers,
  railSetupHint,
} from "@/lib/publishers/listing-setup-copy";
import { SCORE_LABELS } from "@/lib/scores/labels";
import { cn } from "@/lib/utils";

const railLabels: Record<string, string> = {
  api: "API",
  guided_import: "Guided import",
  manual: "Manual",
  audit_only: "Audit only",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  synced: "default",
  pending: "secondary",
  manual: "outline",
  unknown: "outline",
};

type PublisherRow = {
  id: string;
  publisherId: string;
  publisherName: string;
  publisherSlug: string;
  rail: string;
  isCore: boolean;
  status: string;
  listingUrl: string | null;
  lastCheckedAt: Date | null;
};

type AuditRunRow = {
  id: string;
  status: string;
  summary: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

type FilterMode = "core" | "configured" | "all";

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
  const slug = publisherSlugForListingUrl(url);
  if (slug) {
    const bySlug = rows.find((row) => row.publisherSlug === slug);
    if (bySlug) return bySlug;
  }

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

function ListingPublisherCard({
  row,
  url,
  savedUrl,
  isNext,
  isHighlight,
  isPending,
  onUrlChange,
  onSave,
  onTasks,
}: {
  row: PublisherRow;
  url: string;
  savedUrl: string;
  isNext: boolean;
  isHighlight: boolean;
  isPending: boolean;
  onUrlChange: (value: string) => void;
  onSave: () => void;
  onTasks: () => void;
}) {
  const trimmed = url.trim();
  const savedTrimmed = savedUrl.trim();
  const hasDraft = Boolean(trimmed);
  const isSavedLinked = Boolean(savedTrimmed);
  const isDirty = trimmed !== savedTrimmed;
  const why = listingWhyLine(row.publisherSlug);
  const openHref =
    trimmed && /^https?:\/\//i.test(trimmed)
      ? trimmed
      : trimmed
        ? `https://${trimmed}`
        : null;

  return (
    <div
      id={`listing-row-${row.id}`}
      className={cn(
        "relative space-y-3 overflow-hidden rounded-xl border p-3 transition-[border-color,background-color,box-shadow] sm:p-4",
        isSavedLinked &&
          "border-emerald-500/50 bg-emerald-500/[0.07] shadow-[inset_3px_0_0_0_rgb(16,185,129)]",
        !isSavedLinked &&
          isNext &&
          "border-primary/45 bg-primary/[0.06] shadow-[inset_3px_0_0_0_var(--primary)]",
        !isSavedLinked &&
          !isNext &&
          "border-border/80 bg-background",
        isDirty &&
          hasDraft &&
          !isSavedLinked &&
          "border-amber-500/45 bg-amber-500/[0.06]",
        isHighlight && "ring-2 ring-primary/35",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PublisherIcon
            slug={row.publisherSlug}
            badge
            size={36}
            showCheck={isSavedLinked}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">{row.publisherName}</p>
              {row.isCore ? (
                <Badge variant="secondary" className="text-[10px]">
                  Core
                </Badge>
              ) : null}
              {isSavedLinked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                  <Link2Icon className="size-3" />
                  Linked
                </span>
              ) : isNext ? (
                <Badge className="bg-primary text-[10px] text-primary-foreground">
                  Next up
                </Badge>
              ) : null}
              {isDirty && hasDraft ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-[10px] text-amber-800 dark:text-amber-200"
                >
                  Unsaved
                </Badge>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge variant="outline">{railLabels[row.rail] ?? row.rail}</Badge>
              {isSavedLinked ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-600/15 text-emerald-900 dark:text-emerald-100"
                >
                  {row.lastCheckedAt
                    ? "In your map · audited"
                    : "In your map · ready to audit"}
                </Badge>
              ) : (
                <Badge variant={statusVariants[row.status] ?? "outline"}>
                  {row.status}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {isSavedLinked
                ? "LocalMap is watching this listing for NAP drift."
                : (why ?? railSetupHint(row.rail))}
            </p>
            {row.lastCheckedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Last checked {new Date(row.lastCheckedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>

        {isSavedLinked && openHref ? (
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 hover:bg-emerald-500/15 dark:text-emerald-100"
            nativeButton={false}
            render={
              <a href={openHref} target="_blank" rel="noreferrer" />
            }
          >
            Open
            <ExternalLinkIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1">
          <Label className="sr-only">Listing URL for {row.publisherName}</Label>
          <Input
            placeholder={listingUrlPlaceholder(row.publisherSlug)}
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            className={cn(
              isSavedLinked &&
                "border-emerald-500/35 bg-white/80 focus-visible:border-emerald-600 dark:bg-background/60",
            )}
          />
        </div>
        <Button
          variant={isDirty ? "default" : "outline"}
          disabled={isPending || (!isDirty && isSavedLinked)}
          onClick={onSave}
        >
          {isDirty ? (hasDraft ? "Save link" : "Clear") : isSavedLinked ? "Saved" : "Save"}
        </Button>
        <Button variant="ghost" disabled={isPending} onClick={onTasks}>
          Tasks
        </Button>
      </div>
    </div>
  );
}

export function ListingsManager({
  locationId,
  publisherRows,
  auditRuns,
  listingConsistencyScore = 0,
  workspaceHealthTotal = 0,
  priorityPublisherSlugs,
}: {
  locationId: string;
  publisherRows: PublisherRow[];
  auditRuns: AuditRunRow[];
  listingConsistencyScore?: number;
  workspaceHealthTotal?: number;
  /** Optional pack order (e.g. from operating model). */
  priorityPublisherSlugs?: string[];
}) {
  const router = useRouter();
  const [urls, setUrls] = useState<Record<string, string>>(
    Object.fromEntries(
      publisherRows.map((row) => [row.id, row.listingUrl ?? ""]),
    ),
  );
  const [filter, setFilter] = useState<FilterMode>("core");
  const [search, setSearch] = useState("");
  const [quickPaste, setQuickPaste] = useState("");
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [auditPending, startAuditTransition] = useTransition();
  const [discoverPending, startDiscoverTransition] = useTransition();

  const coverage = useMemo(
    () => coreCoverage({ rows: publisherRows, urls }),
    [publisherRows, urls],
  );

  const nextUp = useMemo(
    () =>
      nextUnlinkedPublishers({
        rows: publisherRows,
        urls,
        prioritySlugs: priorityPublisherSlugs,
        limit: 2,
      }),
    [publisherRows, urls, priorityPublisherSlugs],
  );

  const nextUpIds = useMemo(
    () => new Set(nextUp.map((row) => row.id)),
    [nextUp],
  );

  function focusNextPublishers() {
    setFilter("core");
    setSearch("");
    setHighlightIds(nextUp.map((row) => row.id));
    const first = nextUp[0];
    if (first) {
      requestAnimationFrame(() => {
        document
          .getElementById(`listing-row-${first.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  function discoverFromWebsite() {
    startDiscoverTransition(async () => {
      try {
        const result = await discoverListingUrlsAction(locationId);
        if (result.filled.length === 0) {
          toast.message(
            result.scannedWebsite
              ? "LocalMap scanned your site — no new directory links found. Link the next two below."
              : "Add a website on the profile first, or paste listing URLs below.",
          );
          focusNextPublishers();
          return;
        }

        setUrls((current) => {
          const next = { ...current };
          for (const item of result.filled) {
            const row = publisherRows.find(
              (publisher) => publisher.publisherSlug === item.publisherSlug,
            );
            if (row) next[row.id] = item.url;
          }
          return next;
        });

        toast.success(
          `LocalMap linked ${result.filled.length} listing${result.filled.length === 1 ? "" : "s"} from your website`,
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not scan the website for listing links",
        );
      }
    });
  }

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
            status: "pending",
          });
          setUrls((current) => ({ ...current, [match.id]: normalized }));
          saved += 1;
        } catch {
          unmatched.push(entry);
        }
      }

      if (saved > 0) {
        toast.success(
          `LocalMap matched ${saved} listing URL${saved === 1 ? "" : "s"}`,
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

  const configuredCount = publisherRows.filter((row) =>
    (urls[row.id] ?? "").trim(),
  ).length;

  const priorityRank = useMemo(() => {
    const list = priorityPublisherSlugs ?? [];
    return (slug: string) => {
      const index = list.indexOf(slug);
      return index === -1 ? list.length + 50 : index;
    };
  }, [priorityPublisherSlugs]);

  const visibleRows = useMemo(() => {
    let rows = publisherRows;

    if (filter === "core") {
      rows = rows.filter((row) => row.isCore);
    } else if (filter === "configured") {
      rows = rows.filter((row) => (urls[row.id] ?? "").trim());
    }

    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) =>
        row.publisherName.toLowerCase().includes(query),
      );
    }

    // Saved/linked first → next-up → pack priority (drafts stay with open until Save)
    return [...rows].sort((a, b) => {
      const aLinked = Boolean((a.listingUrl ?? "").trim());
      const bLinked = Boolean((b.listingUrl ?? "").trim());
      if (aLinked !== bLinked) return aLinked ? -1 : 1;

      const aNext = nextUpIds.has(a.id);
      const bNext = nextUpIds.has(b.id);
      if (aNext !== bNext) return aNext ? -1 : 1;

      return priorityRank(a.publisherSlug) - priorityRank(b.publisherSlug);
    });
  }, [filter, publisherRows, search, urls, nextUpIds, priorityRank]);

  const watchingRows = useMemo(
    () =>
      visibleRows.filter((row) => Boolean((row.listingUrl ?? "").trim())),
    [visibleRows],
  );
  const openRows = useMemo(
    () =>
      visibleRows.filter((row) => !(row.listingUrl ?? "").trim()),
    [visibleRows],
  );

  function saveUrl(row: PublisherRow) {
    startTransition(async () => {
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
            ? `${row.publisherName} linked — ready for LocalMap to audit`
            : `${row.publisherName} URL cleared`,
        );
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
        toast.info("LocalMap is crawling your listings — this can take a minute.");
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

  return (
    <div className="relative space-y-6">
      {/* Outcome hero + coverage */}
      <Card className="localmap-card-glow border-primary/20 bg-primary/5">
        <CardContent className="space-y-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                <SparklesIcon className="size-3.5" />
                Directory coverage
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Link the directories customers already use
              </h2>
              <p className="text-sm text-muted-foreground">
                LocalMap audits each public listing against your master profile.
                Mismatched name, phone, or hours cost calls — empty rows stay
                unprotected until linked.
              </p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2 lg:items-end">
              <div className="flex w-full items-baseline justify-between gap-2 lg:justify-end lg:gap-3">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {coverage.linked}
                  <span className="text-lg font-semibold text-muted-foreground">
                    /{coverage.total}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  core directories linked
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
                  style={{ width: `${coverage.percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {coverage.linked === 0
                  ? "Start with Find links — LocalMap does the first pass."
                  : coverage.linked >= coverage.total
                    ? "Core coverage complete — run an audit to score consistency."
                    : `${coverage.total - coverage.linked} core still open — we can’t watch those yet.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              onClick={discoverFromWebsite}
              disabled={discoverPending}
            >
              {discoverPending ? "Scanning website…" : "Find links on website"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={runAudit}
              disabled={auditPending || configuredCount === 0}
            >
              {auditPending
                ? "Auditing…"
                : configuredCount === 0
                  ? "Run audit (need a URL)"
                  : `Run audit (${configuredCount})`}
            </Button>
            {nextUp.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={focusNextPublishers}
              >
                Focus next {nextUp.length}
              </Button>
            ) : null}
          </div>

          {nextUp.length > 0 ? (
            <div className="rounded-xl border border-dashed border-primary/25 bg-background/70 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Next best · link these two
              </p>
              <ul className="mt-2 space-y-2">
                {nextUp.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="font-medium">{row.publisherName}</span>
                    <span className="text-muted-foreground">
                      {listingWhyLine(row.publisherSlug) ??
                        railSetupHint(row.rail)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Fill what you can on those two — then run audit. More directories
                anytime.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
              <p>
                Core directories are linked. Run an audit so LocalMap can score
                consistency and surface mismatches.
              </p>
            </div>
          )}
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
                  ? "Run a listing audit — LocalMap unlocks this half of workspace health."
                  : listingConsistencyScore === 0
                    ? "LocalMap found issues — fix NAP on directories, then re-run."
                    : `${SCORE_LABELS.workspaceHealth} total: ${workspaceHealthTotal}/100`}
              </p>
            </div>
            {listingConsistencyScore > 0 ? (
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/dashboard/locations/${locationId}/visibility`}
                  />
                }
              >
                View breakdown
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="localmap-card-glow border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardPasteIcon className="size-4 text-primary" />
            <CardTitle className="text-base">
              Quick add — paste what you already have
            </CardTitle>
          </div>
          <CardDescription>
            Facebook, Yelp, BBB, Google Maps, and more. Prefer Find links first;
            paste anything the scanner missed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="https://www.yelp.com/biz/…  https://www.facebook.com/…"
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
            {isPending ? "Matching…" : "Add listings"}
          </Button>
        </CardContent>
      </Card>

      <Card className="localmap-card-glow relative overflow-hidden">
        <CardHeader>
          <CardTitle>Listing URLs</CardTitle>
          <CardDescription>
            Linked directories rise to the top with a green map state. Open ones
            stay below — Next up is what to finish next.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
              {(
                [
                  ["core", "Core"],
                  ["configured", "Configured"],
                  ["all", "All"],
                ] as const
              ).map(([value, label]) => (
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
              No publishers match this filter. Try &quot;All&quot; or clear
              search.
            </div>
          ) : (
            <div className="space-y-6">
              {watchingRows.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-300">
                      Watching · {watchingRows.length} linked
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sorted to the top — LocalMap can audit these
                    </p>
                  </div>
                  {watchingRows.map((row) => (
                    <ListingPublisherCard
                      key={row.id}
                      row={row}
                      url={urls[row.id] ?? ""}
                      savedUrl={row.listingUrl ?? ""}
                      isNext={false}
                      isHighlight={highlightIds.includes(row.id)}
                      isPending={isPending}
                      onUrlChange={(value) =>
                        setUrls((current) => ({
                          ...current,
                          [row.id]: value,
                        }))
                      }
                      onSave={() => saveUrl(row)}
                      onTasks={() => addChecklist(row)}
                    />
                  ))}
                </div>
              ) : null}

              {openRows.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Still open · {openRows.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Next up highlighted — link these for coverage
                    </p>
                  </div>
                  {openRows.map((row) => (
                    <ListingPublisherCard
                      key={row.id}
                      row={row}
                      url={urls[row.id] ?? ""}
                      savedUrl={row.listingUrl ?? ""}
                      isNext={nextUpIds.has(row.id)}
                      isHighlight={highlightIds.includes(row.id)}
                      isPending={isPending}
                      onUrlChange={(value) =>
                        setUrls((current) => ({
                          ...current,
                          [row.id]: value,
                        }))
                      }
                      onSave={() => saveUrl(row)}
                      onTasks={() => addChecklist(row)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="localmap-card-glow">
        <CardHeader>
          <CardTitle>Audit history</CardTitle>
          <CardDescription>
            Every run stores findings plus crawl evidence — credited to LocalMap
            scans.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditRuns.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm font-medium">No audits yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Link a couple of directories, then run your first LocalMap audit.
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
        active={auditPending || discoverPending}
        label={
          discoverPending
            ? "LocalMap is scanning your website for listing links…"
            : "LocalMap is running your listing audit…"
        }
        className="rounded-2xl"
      />
    </div>
  );
}
