import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { graderAudits, locations } from "@/db/schema";
import { seedGraderFixTasksForLocation } from "@/lib/grader/seed-tasks-from-audit";
import {
  withLocationOperatingContext,
} from "@/lib/profile/operating-model-meta";

/** Point the location profile at the latest completed audit (re-grade loop). */
export async function syncGraderAuditIdToLocation(input: {
  locationId: string;
  auditId: string;
}): Promise<{ tasksSeeded: number }> {
  const db = getDb();
  const location = await db.query.locations.findFirst({
    where: eq(locations.id, input.locationId),
    columns: { id: true, profile: true },
  });

  if (!location) return { tasksSeeded: 0 };

  const profile = withLocationOperatingContext(location.profile, {
    graderAuditId: input.auditId,
    onboardingIntent: "fix",
  });

  await db
    .update(locations)
    .set({ profile, updatedAt: new Date() })
    .where(eq(locations.id, input.locationId));

  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, input.auditId),
    columns: { checks: true },
  });

  const tasksSeeded = audit?.checks?.length
    ? await seedGraderFixTasksForLocation({
        db,
        locationId: input.locationId,
        checks: audit.checks,
      })
    : 0;

  return { tasksSeeded };
}
