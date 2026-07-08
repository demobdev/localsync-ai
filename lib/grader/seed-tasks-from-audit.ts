import { and, eq, inArray, like } from "drizzle-orm";

import type { getDb } from "@/db";
import { manualTasks, publishers } from "@/db/schema";
import { deriveFixPlan } from "@/lib/grader/scoring";
import type { AuditCategory, AuditCheck } from "@/lib/grader/types";

type Db = ReturnType<typeof getDb>;

const DEFAULT_PUBLISHER_SLUG = "google-business-profile";

const PUBLISHER_SLUG_BY_CATEGORY: Record<AuditCategory, string> = {
  listings: "google-business-profile",
  search: "google-business-profile",
  guest: "google-business-profile",
};

function publisherSlugForCheck(check: AuditCheck): string {
  const label = check.label.toLowerCase();
  const group = check.group.toLowerCase();

  if (label.includes("yelp")) return "yelp";
  if (label.includes("facebook") || group.includes("social")) return "facebook";
  if (label.includes("apple")) return "apple-business-connect";
  if (label.includes("bing")) return "bing-places";

  return PUBLISHER_SLUG_BY_CATEGORY[check.category] ?? DEFAULT_PUBLISHER_SLUG;
}

export function graderTaskKey(checkId: string): string {
  return `grader:${checkId}`;
}

/** Quick wins first, then medium — capped for a focused queue. */
export function selectChecksForTaskSeeding(checks: AuditCheck[]): AuditCheck[] {
  const plan = deriveFixPlan(checks);
  const merged = [
    ...plan.quickWins,
    ...plan.medium.slice(0, Math.max(0, 8 - plan.quickWins.length)),
  ];
  return merged.slice(0, 8);
}

export async function seedGraderFixTasksForLocation(input: {
  db: Db;
  locationId: string;
  checks: AuditCheck[];
}): Promise<number> {
  const checksToSeed = selectChecksForTaskSeeding(input.checks);
  if (checksToSeed.length === 0) return 0;

  const publisherRows = await input.db
    .select({ id: publishers.id, slug: publishers.slug })
    .from(publishers);

  if (publisherRows.length === 0) return 0;

  const slugToId = new Map(publisherRows.map((row) => [row.slug, row.id]));
  const fallbackPublisherId =
    slugToId.get(DEFAULT_PUBLISHER_SLUG) ?? publisherRows[0]!.id;

  const existing = await input.db
    .select({ checklistItemKey: manualTasks.checklistItemKey })
    .from(manualTasks)
    .where(eq(manualTasks.locationId, input.locationId));

  const existingKeys = new Set(
    existing
      .map((row) => row.checklistItemKey)
      .filter((key): key is string => Boolean(key)),
  );

  const values = checksToSeed
    .filter((check) => !existingKeys.has(graderTaskKey(check.id)))
    .map((check) => {
      const slug = publisherSlugForCheck(check);
      return {
        locationId: input.locationId,
        publisherId: slugToId.get(slug) ?? fallbackPublisherId,
        title: check.label,
        description: check.recommendation ?? check.detail,
        status: "open" as const,
        checklistItemKey: graderTaskKey(check.id),
      };
    });

  if (values.length === 0) return 0;

  await input.db.insert(manualTasks).values(values);
  return values.length;
}

export async function countOpenGraderTasksForLocation(input: {
  db: Db;
  locationId: string;
}): Promise<number> {
  const rows = await input.db
    .select({ id: manualTasks.id })
    .from(manualTasks)
    .where(
      and(
        eq(manualTasks.locationId, input.locationId),
        like(manualTasks.checklistItemKey, "grader:%"),
        inArray(manualTasks.status, ["open", "in_progress", "blocked"]),
      ),
    );

  return rows.length;
}

/**
 * Opportunity keywords from a grader audit — feeds FAQ / visibility copy.
 */
export function extractKeywordOpportunities(
  keywords: Array<{
    keyword: string;
    yourMapRank: number | null;
    yourOrganicRank: number | null;
    intent?: string;
  }>,
  limit = 5,
): string[] {
  return keywords
    .filter(
      (row) =>
        row.intent === "opportunity" ||
        (row.yourMapRank === null && row.yourOrganicRank === null),
    )
    .slice(0, limit)
    .map((row) => row.keyword);
}
