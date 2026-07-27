import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { activityEvents } from "@/db/schema";

export type ActivityEventInput = {
  organizationId: string;
  locationId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function logActivityEvent(
  input: ActivityEventInput,
): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(activityEvents)
    .values({
      organizationId: input.organizationId,
      locationId: input.locationId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? null,
    })
    .returning({ id: activityEvents.id });

  if (!row) {
    throw new Error("Failed to write activity event");
  }

  return row.id;
}

export async function listLocationActivityEvents(
  locationId: string,
  limit = 50,
) {
  const db = getDb();
  return db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.locationId, locationId))
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit);
}
