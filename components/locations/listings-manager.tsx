"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ClipboardPasteIcon, RadarIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import {
  startAuditAction,
  updateListingUrlAction,
} from "@/app/actions/audits";
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

const railLabels: Record<string, string> = {
  api: "API",
  guided_import: "Guided import",
  manual: "Manual",
  audit_only: "Audit only",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
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

export function ListingsManager({
  locationId,
  publisherRows,
  auditRuns,
}: {
  locationId: string;
  publisherRows: PublisherRow[];
  auditRuns: AuditRunRow[];
}) {
  const router = useRouter();
  const [urls, setUrls] = useState<Record<string, string>>(
    Object.fromEntries(publisherRows.map((row) => [row.id, row.listingUrl ?? ""])),
  );
  const [filter, setFilter] = useState<FilterMode>("core");
  const [search, setSearch] = useState("");
  const [quickPaste, setQuickPaste] = useState("");
  const [isPending, startTransition] = useTransition();
  const [auditPending, startAuditTransition] = useTransition();

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
          `Matched and saved ${saved} listing URL${saved === 1 ? "" : "s"}`,
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

    return rows;
  }, [filter, publisherRows, search, urls]);

  function saveUrl(row: PublisherRow) {
    startTransition(async () => {
      try {
        await updateListingUrlAction({
          locationId,
          locationPublisherId: row.id,
          listingUrl: urls[row.id] ?? "",
        });
        toast.success(`${row.publisherName} listing URL saved`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save listing URL",
        );
      }
    });
  }

  function runAudit() {
    startAuditTransition(async () => {
      try {
        toast.info("Audit started — crawling listings. This can take a minute.");
        await startAuditAction(locationId);
        toast.success("Audit complete");
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
      <Card className="localmap-card-glow border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <RadarIcon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Demo tip</p>
              <p className="text-sm text-muted-foreground">
                Start with <strong>Yelp</strong> and <strong>BBB</strong> — paste
                listing URLs, save, then run audit.
              </p>
            </div>
          </div>
          <Button
            onClick={runAudit}
            disabled={auditPending || configuredCount === 0}
            className="shrink-0"
          >
            {auditPending
              ? "Auditing…"
              : `Run audit (${configuredCount} URL${configuredCount === 1 ? "" : "s"})`}
          </Button>
        </CardContent>
      </Card>

      <Card className="localmap-card-glow border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardPasteIcon className="size-4 text-primary" />
            <CardTitle className="text-base">Quick add — paste any listing links</CardTitle>
          </div>
          <CardDescription>
            Paste one or more URLs (Yelp, BBB, Facebook, Google Maps…) — we
            match each to the right publisher automatically.
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
            {isPending ? "Matching…" : "Add listings"}
          </Button>
        </CardContent>
      </Card>

      <Card className="localmap-card-glow relative overflow-hidden">
        <CardHeader>
          <CardTitle>Listing URLs</CardTitle>
          <CardDescription>
            Add known listing URLs. The audit engine crawls each one and compares
            it to your master profile.
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
              No publishers match this filter. Try &quot;All&quot; or clear search.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRows.map((row) => (
                <div
                  key={row.id}
                  className="space-y-3 rounded-xl border p-3 sm:p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{row.publisherName}</p>
                        {row.isCore ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Core
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline">{railLabels[row.rail] ?? row.rail}</Badge>
                        <Badge variant={statusVariants[row.status] ?? "outline"}>
                          {row.status}
                        </Badge>
                      </div>
                      {row.lastCheckedAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Checked {new Date(row.lastCheckedAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <div className="space-y-1">
                      <Label className="sr-only">Listing URL for {row.publisherName}</Label>
                      <Input
                        placeholder="https://..."
                        value={urls[row.id] ?? ""}
                        onChange={(event) =>
                          setUrls((current) => ({
                            ...current,
                            [row.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      disabled={isPending}
                      onClick={() => saveUrl(row)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => addChecklist(row)}
                    >
                      Tasks
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="localmap-card-glow">
        <CardHeader>
          <CardTitle>Audit history</CardTitle>
          <CardDescription>
            Every run stores findings plus crawl evidence for transparency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditRuns.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
              <p className="text-sm font-medium">No audits yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add listing URLs above and run your first audit.
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
