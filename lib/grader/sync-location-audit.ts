import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { locations } from "@/db/schema";
import {
  withLocationOperatingContext,
} from "@/lib/profile/operating-model-meta";

/** Point the location profile at the latest completed audit (re-grade loop). */
export async function syncGraderAuditIdToLocation(input: {
  locationId: string;
  auditId: string;
}): Promise<void> {
  const db = getDb();
  const location = await db.query.locations.findFirst({
    where: eq(locations.id, input.locationId),
    columns: { id: true, profile: true },
  });

  if (!location) return;

  const profile = withLocationOperatingContext(location.profile, {
    graderAuditId: input.auditId,
    onboardingIntent: "fix",
  });

  await db
    .update(locations)
    .set({ profile, updatedAt: new Date() })
    .where(eq(locations.id, input.locationId));
}
