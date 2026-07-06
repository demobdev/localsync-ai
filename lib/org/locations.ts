import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { locations } from "@/db/schema";

export async function countOrgLocations(orgId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(locations)
    .where(eq(locations.organizationId, orgId));

  return row?.count ?? 0;
}
