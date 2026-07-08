import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { graderAudits } from "@/db/schema";
import type { AuditGrade, GraderStatusResponse } from "@/lib/grader/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** Polled ~1.5s by the scan experience while an audit is processing. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await params;
  if (!UUID_RE.test(auditId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  }

  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, auditId),
    columns: {
      status: true,
      progress: true,
      createdAt: true,
      businessName: true,
      totalScore: true,
      grade: true,
      failedChecks: true,
      totalChecks: true,
      estimatedMonthlyLoss: true,
    },
  });

  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  }

  const progress = audit.progress;
  const payload: GraderStatusResponse = {
    status:
      audit.status === "complete"
        ? "complete"
        : audit.status === "failed"
          ? "failed"
          : "scanning",
    stage: progress?.stage ?? "place",
    stagesDone: progress?.stagesDone ?? [],
    startedAt: progress?.startedAt ?? audit.createdAt.toISOString(),
    evidence: progress?.evidence ?? {},
    ...(audit.status === "complete"
      ? {
          preview: {
            businessName: audit.businessName ?? "Your business",
            totalScore: audit.totalScore,
            grade: (audit.grade as AuditGrade | null) ?? "Fair",
            failedChecks: audit.failedChecks,
            totalChecks: audit.totalChecks,
            estimatedMonthlyLoss: audit.estimatedMonthlyLoss,
          },
        }
      : {}),
  };

  return NextResponse.json(payload, { headers: NO_STORE });
}
