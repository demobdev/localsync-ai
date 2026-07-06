import { notFound } from "next/navigation";

import { getAuditRunDetailAction } from "@/app/actions/audits";
import { getLocationAction } from "@/app/actions/locations";
import { AuditFindingsPanel } from "@/components/locations/audit-findings-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="space-y-6">
      <Card className="localmap-card-glow">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Audit run</CardTitle>
              <CardDescription>
                {new Date(run.createdAt).toLocaleString()} ·{" "}
                {run.summary ?? "In progress..."}
              </CardDescription>
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

      <AuditFindingsPanel findings={findings} evidence={evidence} />
    </div>
  );
}
