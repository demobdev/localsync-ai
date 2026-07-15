import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { graderAudits } from "@/db/schema";
import { GraderReportGate } from "@/components/grader/report/report-gate";
import { ScanExperience } from "@/components/grader/scan-experience";
import { emptyPageSpeed } from "@/lib/grader/pagespeed";
import { gradeForScore } from "@/lib/grader/scoring";
import { resolveGraderDashboardHref } from "@/lib/onboarding/grader-entry";
import type { AuditReport, GraderStatusResponse } from "@/lib/grader/types";

export const metadata: Metadata = {
  title: "Your Local Visibility Report | LocalMap Grader",
  description:
    "Your full local visibility & revenue leak audit: Google rankings, website experience, and local listings, scored across 44 factors.",
  robots: { index: false },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GraderReportPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  if (!UUID_PATTERN.test(auditId)) notFound();

  const session = await auth();
  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, auditId),
  });

  if (!audit) notFound();

  if (audit.status === "failed") {
    const initial: GraderStatusResponse = {
      status: "failed",
      stage: audit.progress?.stage ?? "crawl",
      stagesDone: audit.progress?.stagesDone ?? [],
      startedAt: audit.progress?.startedAt ?? audit.createdAt.toISOString(),
      evidence: audit.progress?.evidence ?? {},
    };
    const domain = audit.websiteUrl
      ? new URL(audit.websiteUrl).hostname.replace(/^www\./, "")
      : null;
    return (
      <ScanExperience auditId={audit.id} initial={initial} domain={domain} />
    );
  }

  if (audit.status !== "complete") {
    // Progressive scan experience — the same URL becomes the report when the
    // background pipeline finishes (shareable, refresh-safe).
    const initial: GraderStatusResponse = {
      status: "scanning",
      stage: audit.progress?.stage ?? "place",
      stagesDone: audit.progress?.stagesDone ?? [],
      startedAt: audit.progress?.startedAt ?? audit.createdAt.toISOString(),
      evidence: audit.progress?.evidence ?? {},
    };
    const domain = audit.websiteUrl
      ? new URL(audit.websiteUrl).hostname.replace(/^www\./, "")
      : null;

    // Full-page takeover — the component owns the viewport (logo bar included).
    return <ScanExperience auditId={audit.id} initial={initial} domain={domain} />;
  }

  const report: AuditReport = {
    id: audit.id,
    url: audit.url,
    // Null = no-website audit (url column holds a "place:" marker instead).
    websiteUrl: audit.websiteUrl,
    businessName: audit.businessName ?? "Your business",
    city: audit.city,
    state: audit.state,
    phone: audit.phone,
    latitude: audit.extracted?.latitude ?? null,
    longitude: audit.extracted?.longitude ?? null,
    industry: audit.industry ?? "retail",
    status: audit.status,
    totalScore: audit.totalScore,
    grade:
      (audit.grade as AuditReport["grade"] | null) ??
      gradeForScore(audit.totalScore),
    categoryScores: audit.categoryScores ?? { search: 0, guest: 0, listings: 0 },
    totalChecks: audit.totalChecks,
    failedChecks: audit.failedChecks,
    estimatedMonthlyLoss: audit.estimatedMonthlyLoss,
    checks: audit.checks ?? [],
    keywords: audit.keywords ?? [],
    competitors: audit.competitors ?? [],
    pageSpeed: audit.pageSpeed ?? emptyPageSpeed(),
    gbpProfile: audit.gbpProfile ?? {
      rating: null,
      reviewCount: null,
      profileFields: [],
      reviewFields: [],
      isSample: true,
      gbpLinked: false,
    },
    leadCaptured: audit.leadCaptured,
    createdAt: audit.createdAt.toISOString(),
    scanSnapshot: audit.progress?.evidence,
    operatingModel: audit.progress?.operatingModel,
    auditTier: audit.progress?.auditTier,
  };

  const [dashboardHref, fixHref] = await Promise.all([
    resolveGraderDashboardHref({
      auditId: audit.id,
      userId: session.userId,
      orgId: session.orgId ?? null,
      intent: "organic",
    }),
    resolveGraderDashboardHref({
      auditId: audit.id,
      userId: session.userId,
      orgId: session.orgId ?? null,
      intent: "fix",
    }),
  ]);

  return <GraderReportGate report={report} signedIn={Boolean(session.userId)} dashboardHref={dashboardHref} fixHref={fixHref} />;
}
