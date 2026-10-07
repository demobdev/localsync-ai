import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  locations,
  websiteAuditPages,
  websiteAuditRuns,
  websiteFindings,
} from "@/db/schema";

import { crawlLocationWebsite } from "./crawler";

export async function executeWebsiteAudit(auditRunId: string) {
  const db = getDb();
  const [run] = await db
    .select()
    .from(websiteAuditRuns)
    .where(eq(websiteAuditRuns.id, auditRunId))
    .limit(1);
  if (!run) throw new Error("Website audit run not found");

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, run.locationId))
    .limit(1);
  if (!location) throw new Error("Location not found");

  await db
    .update(websiteAuditRuns)
    .set({ status: "running", startedAt: new Date(), errorMessage: null })
    .where(eq(websiteAuditRuns.id, auditRunId));

  try {
    const result = await crawlLocationWebsite(location.profile);
    await db.delete(websiteFindings).where(eq(websiteFindings.auditRunId, auditRunId));
    await db.delete(websiteAuditPages).where(eq(websiteAuditPages.auditRunId, auditRunId));

    if (result.pages.length) {
      await db.insert(websiteAuditPages).values(
        result.pages.map((page) => ({
          auditRunId,
          ...page,
        })),
      );
    }
    if (result.findings.length) {
      await db.insert(websiteFindings).values(
        result.findings.map((finding) => ({
          auditRunId,
          type: finding.type,
          severity: finding.severity,
          url: finding.url,
          title: finding.title,
          evidence: finding.evidence ?? null,
          remediation: finding.remediation ?? null,
        })),
      );
    }

    await db
      .update(websiteAuditRuns)
      .set({
        status: "completed",
        score: result.score,
        pagesFound: result.pages.length,
        issuesFound: result.findings.filter(
          (finding) => finding.severity !== "passed",
        ).length,
        completedAt: new Date(),
      })
      .where(eq(websiteAuditRuns.id, auditRunId));

    return result;
  } catch (error) {
    await db
      .update(websiteAuditRuns)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Audit failed",
        completedAt: new Date(),
      })
      .where(eq(websiteAuditRuns.id, auditRunId));
    throw error;
  }
}

