import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/** Table presence only; this does not certify schema compatibility or delivery readiness. */
export async function isSubmissionCampaignStorageReady(): Promise<boolean> {
  const result = await getDb().execute<{
    campaigns: string | null;
    targets: string | null;
    events: string | null;
  }>(sql`
    select
      to_regclass('public.submission_campaigns')::text as campaigns,
      to_regclass('public.submission_targets')::text as targets,
      to_regclass('public.submission_events')::text as events
  `);
  const row = result.rows[0];
  return Boolean(row?.campaigns && row.targets && row.events);
}
