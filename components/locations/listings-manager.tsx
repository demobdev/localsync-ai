"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  rail: string;
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
  const [isPending, startTransition] = useTransition();
  const [auditPending, startAuditTransition] = useTransition();

  const configuredCount = publisherRows.filter((row) =>
    (urls[row.id] ?? "").trim(),
  ).length;

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Listing URLs</CardTitle>
            <CardDescription>
              Add known listing URLs for this location. The audit engine crawls
              each one and compares it to the master profile.
            </CardDescription>
          </div>
          <Button
            onClick={runAudit}
            disabled={auditPending || configuredCount === 0}
          >
            {auditPending
              ? "Auditing..."
              : `Run audit (${configuredCount} URL${configuredCount === 1 ? "" : "s"})`}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {publisherRows.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-lg border p-3 md:grid-cols-[200px_1fr_auto_auto]"
            >
              <div>
                <p className="font-medium">{row.publisherName}</p>
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
                Add tasks
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit history</CardTitle>
          <CardDescription>
            Every run stores findings plus crawl evidence for transparency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No audits yet. Add listing URLs above and run your first audit.
            </p>
          ) : (
            auditRuns.map((run) => (
              <Link
                key={run.id}
                href={`/dashboard/locations/${locationId}/listings/${run.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
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
    </div>
  );
}
