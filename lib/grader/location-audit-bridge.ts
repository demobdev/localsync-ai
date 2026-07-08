import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { graderAudits } from "@/db/schema";
import type { AuditCheck, KeywordResult } from "@/lib/grader/types";
import type { SetupStep } from "@/lib/profile/setup-workflow";

export type LinkedGraderAudit = {
  id: string;
  totalScore: number;
  grade: string | null;
  failedChecks: number;
  checks: AuditCheck[];
  keywords: KeywordResult[];
  locationId: string | null;
  businessName: string | null;
};

/** Latest claimed grader audit linked to this location. */
export async function getGraderAuditForLocation(
  locationId: string,
): Promise<LinkedGraderAudit | null> {
  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.locationId, locationId),
    orderBy: [desc(graderAudits.createdAt)],
    columns: {
      id: true,
      totalScore: true,
      grade: true,
      failedChecks: true,
      checks: true,
      keywords: true,
      locationId: true,
      businessName: true,
    },
  });

  if (!audit) return null;

  return {
    id: audit.id,
    totalScore: audit.totalScore,
    grade: audit.grade,
    failedChecks: audit.failedChecks,
    checks: audit.checks ?? [],
    keywords: audit.keywords ?? [],
    locationId: audit.locationId,
    businessName: audit.businessName,
  };
}

function hrefForGraderCheck(check: AuditCheck, locationId: string): string {
  const base = `/dashboard/locations/${locationId}`;

  if (check.category === "listings") {
    return `${base}/listings`;
  }

  if (
    check.group.toLowerCase().includes("schema") ||
    check.group.toLowerCase().includes("faq") ||
    check.label.toLowerCase().includes("faq")
  ) {
    return `${base}/visibility`;
  }

  if (
    check.group.toLowerCase().includes("hour") ||
    check.label.toLowerCase().includes("hour")
  ) {
    return `${base}?tab=hours`;
  }

  if (
    check.group.toLowerCase().includes("service") ||
    check.label.toLowerCase().includes("service") ||
    check.label.toLowerCase().includes("category")
  ) {
    return `${base}?tab=services`;
  }

  if (
    check.group.toLowerCase().includes("photo") ||
    check.label.toLowerCase().includes("photo")
  ) {
    return `${base}?tab=photos`;
  }

  if (check.category === "search") {
    return `${base}/visibility`;
  }

  return `${base}?tab=nap`;
}

function profileTabForCheck(
  check: AuditCheck,
): SetupStep["profileTab"] | undefined {
  const href = hrefForGraderCheck(check, "");
  if (href.includes("tab=hours")) return "hours";
  if (href.includes("tab=services")) return "services";
  if (href.includes("tab=photos")) return "photos";
  if (href.includes("tab=links")) return "links";
  if (href.includes("/listings") || href.includes("/visibility")) return undefined;
  return "nap";
}

/** Turn failed/warn grader checks into setup-guide steps (fix queue). */
export function buildGraderFixSteps(input: {
  locationId: string;
  checks: AuditCheck[];
  limit?: number;
}): SetupStep[] {
  const impactOrder = { high: 0, medium: 1, low: 2 } as const;

  const actionable = input.checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .sort((a, b) => {
      const impact = impactOrder[a.impact] - impactOrder[b.impact];
      if (impact !== 0) return impact;
      return a.label.localeCompare(b.label);
    })
    .slice(0, input.limit ?? 8);

  return actionable.map((check) => {
    const profileTab = profileTabForCheck(check);
    return {
      id: `grader-fix-${check.id}`,
      phase: "audit" as const,
      title: check.label,
      description:
        check.recommendation?.slice(0, 140) ??
        check.detail.slice(0, 140) ??
        "Fix from your visibility audit",
      done: false,
      href: hrefForGraderCheck(check, input.locationId),
      profileTab,
    };
  });
}

export function locationFixQueueHref(locationId: string): string {
  return `/dashboard/locations/${locationId}?tab=nap`;
}

export function buildGraderTaskQueueStep(input: {
  locationId: string;
  openTaskCount: number;
}): SetupStep | null {
  if (input.openTaskCount <= 0) return null;

  return {
    id: "grader-task-queue",
    phase: "audit",
    title: "Complete audit fix tasks",
    description: `${input.openTaskCount} open task${input.openTaskCount === 1 ? "" : "s"} queued from your visibility audit`,
    done: false,
    href: "/dashboard/tasks",
  };
}

/** Top failed check labels for dashboard teaser. */
export function topFailedCheckLabels(
  checks: AuditCheck[],
  limit = 3,
): string[] {
  const impactOrder = { high: 0, medium: 1, low: 2 } as const;
  return checks
    .filter((c) => c.status === "fail")
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, limit)
    .map((c) => c.label);
}
