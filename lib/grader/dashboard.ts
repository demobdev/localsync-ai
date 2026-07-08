import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { graderAudits, scanLeads } from "@/db/schema";
import { topFailedCheckLabels } from "@/lib/grader/location-audit-bridge";
import type { AuditCheck, KeywordResult } from "@/lib/grader/types";

export type RecentGraderInsight = {
  kind: "grader";
  auditId: string;
  locationId: string | null;
  businessName: string | null;
  city: string | null;
  totalScore: number;
  grade: string | null;
  failedChecks: number;
  topKeywords: KeywordResult[];
  topFailedChecks: string[];
  claimedAt: Date | null;
  createdAt: Date;
};

export type RecentScanInsight = {
  kind: "scan";
  scanId: string;
  businessName: string | null;
  city: string | null;
  score: number;
  url: string;
  claimedAt: Date | null;
  createdAt: Date;
};

export type RecentMarketingInsight = RecentGraderInsight | RecentScanInsight;

function topKeywords(keywords: KeywordResult[] | null | undefined, limit = 3) {
  if (!keywords?.length) return [];
  return keywords.slice(0, limit);
}

function graderInsightFromRow(audit: {
  id: string;
  locationId: string | null;
  businessName: string | null;
  city: string | null;
  totalScore: number;
  grade: string | null;
  failedChecks: number;
  keywords: KeywordResult[] | null;
  checks: AuditCheck[] | null;
  claimedAt: Date | null;
  createdAt: Date;
}): RecentGraderInsight {
  return {
    kind: "grader",
    auditId: audit.id,
    locationId: audit.locationId,
    businessName: audit.businessName,
    city: audit.city,
    totalScore: audit.totalScore,
    grade: audit.grade,
    failedChecks: audit.failedChecks,
    topKeywords: topKeywords(audit.keywords),
    topFailedChecks: topFailedCheckLabels(audit.checks ?? []),
    claimedAt: audit.claimedAt,
    createdAt: audit.createdAt,
  };
}

/** Most recently claimed grader audit for this workspace. */
export async function getRecentGraderAuditForOrg(
  organizationId: string,
): Promise<RecentGraderInsight | null> {
  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.organizationId, organizationId),
    orderBy: [desc(graderAudits.claimedAt), desc(graderAudits.createdAt)],
    columns: {
      id: true,
      locationId: true,
      businessName: true,
      city: true,
      totalScore: true,
      grade: true,
      failedChecks: true,
      keywords: true,
      checks: true,
      claimedAt: true,
      createdAt: true,
    },
  });

  if (!audit) return null;

  return graderInsightFromRow(audit);
}

/** Most recently claimed free scan for this workspace. */
export async function getRecentScanForOrg(
  organizationId: string,
): Promise<RecentScanInsight | null> {
  const db = getDb();
  const [lead] = await db
    .select({
      id: scanLeads.id,
      url: scanLeads.url,
      businessName: scanLeads.businessName,
      city: scanLeads.city,
      score: scanLeads.score,
      claimedAt: scanLeads.claimedAt,
      createdAt: scanLeads.createdAt,
    })
    .from(scanLeads)
    .where(eq(scanLeads.organizationId, organizationId))
    .orderBy(desc(scanLeads.claimedAt), desc(scanLeads.createdAt))
    .limit(1);

  if (!lead) return null;

  return {
    kind: "scan",
    scanId: lead.id,
    businessName: lead.businessName,
    city: lead.city,
    score: lead.score,
    url: lead.url,
    claimedAt: lead.claimedAt,
    createdAt: lead.createdAt,
  };
}

export async function getGraderAuditByIdForOrg(
  auditId: string,
  organizationId: string,
): Promise<RecentGraderInsight | null> {
  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, auditId),
    columns: {
      id: true,
      organizationId: true,
      locationId: true,
      businessName: true,
      city: true,
      totalScore: true,
      grade: true,
      failedChecks: true,
      keywords: true,
      checks: true,
      claimedAt: true,
      createdAt: true,
    },
  });

  if (!audit || audit.organizationId !== organizationId) return null;

  return graderInsightFromRow(audit);
}

export async function getScanByIdForOrg(
  scanId: string,
  organizationId: string,
): Promise<RecentScanInsight | null> {
  const db = getDb();
  const [lead] = await db
    .select({
      id: scanLeads.id,
      organizationId: scanLeads.organizationId,
      url: scanLeads.url,
      businessName: scanLeads.businessName,
      city: scanLeads.city,
      score: scanLeads.score,
      claimedAt: scanLeads.claimedAt,
      createdAt: scanLeads.createdAt,
    })
    .from(scanLeads)
    .where(eq(scanLeads.id, scanId))
    .limit(1);

  if (!lead || lead.organizationId !== organizationId) return null;

  return {
    kind: "scan",
    scanId: lead.id,
    businessName: lead.businessName,
    city: lead.city,
    score: lead.score,
    url: lead.url,
    claimedAt: lead.claimedAt,
    createdAt: lead.createdAt,
  };
}

/** Prefer explicit URL highlight, then claimed grader audit, then claimed scan. */
export async function resolveRecentMarketingInsight(input: {
  organizationId: string;
  highlightAuditId?: string | null;
  highlightScanId?: string | null;
}): Promise<RecentMarketingInsight | null> {
  if (input.highlightAuditId) {
    const highlighted = await getGraderAuditByIdForOrg(
      input.highlightAuditId,
      input.organizationId,
    );
    if (highlighted) return highlighted;
  }

  if (input.highlightScanId) {
    const highlighted = await getScanByIdForOrg(
      input.highlightScanId,
      input.organizationId,
    );
    if (highlighted) return highlighted;
  }

  const grader = await getRecentGraderAuditForOrg(input.organizationId);
  if (grader) return grader;

  return getRecentScanForOrg(input.organizationId);
}
