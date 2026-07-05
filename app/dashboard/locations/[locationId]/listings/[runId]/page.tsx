import Link from "next/link";
import { notFound } from "next/navigation";

import { getAuditRunDetailAction } from "@/app/actions/audits";
import { getLocationAction } from "@/app/actions/locations";
import { LocationTabs } from "@/components/locations/location-tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const severityVariants = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
} as const;

export default async function AuditRunDetailPage({
  params,
}: {
  params: Promise<{ locationId: string; runId: string }>;
}) {
  const { locationId, runId } = await params;

  const location = await getLocationAction(locationId);

  if (!location) {
    notFound();
  }

  let detail;
  try {
    detail = await getAuditRunDetailAction({ locationId, auditRunId: runId });
  } catch {
    notFound();
  }

  const { run, findings, evidence } = detail;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{location.name}</h2>
        <p className="text-sm text-muted-foreground">
          Audit run from {new Date(run.createdAt).toLocaleString()}
        </p>
      </div>
      <LocationTabs locationId={locationId} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Run summary</CardTitle>
                <CardDescription>{run.summary ?? "In progress..."}</CardDescription>
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
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Findings ({findings.length})</CardTitle>
            <CardDescription>
              Differences between the master profile and what was found on each
              listing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No findings — all audited listings match the master profile.
              </p>
            ) : (
              findings.map((finding) => (
                <div key={finding.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{finding.message}</p>
                    <Badge variant={severityVariants[finding.severity]}>
                      {finding.severity}
                    </Badge>
                  </div>
                  {finding.masterValue || finding.foundValue ? (
                    <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                      <div className="rounded bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">Master profile</p>
                        <p>{finding.masterValue ?? "—"}</p>
                      </div>
                      <div className="rounded bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">Found on listing</p>
                        <p>{finding.foundValue ?? "—"}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence ({evidence.length})</CardTitle>
            <CardDescription>
              What the crawler extracted from each listing page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidence.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.publisherName ?? "Unknown publisher"}</p>
                  <Link
                    href={item.sourceUrl}
                    target="_blank"
                    className="text-sm text-muted-foreground underline underline-offset-4"
                  >
                    View listing
                  </Link>
                </div>
                <pre className="mt-2 overflow-x-auto rounded bg-muted/50 p-2 text-xs">
                  {JSON.stringify(item.extractedData, null, 2)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
