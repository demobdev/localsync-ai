import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { graderAudits } from "@/db/schema";
import type { SetupPrefill } from "@/lib/onboarding/prefill";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Onboarding prefill from a grader audit (`?auditId=`). */
export async function getAuditPrefill(
  auditId: string,
): Promise<SetupPrefill | null> {
  if (!UUID_RE.test(auditId)) return null;

  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, auditId),
    columns: {
      id: true,
      websiteUrl: true,
      businessName: true,
      phone: true,
      city: true,
      state: true,
      totalScore: true,
      industry: true,
      progress: true,
      gbpProfile: true,
    },
  });

  if (!audit) return null;

  return {
    source: "audit",
    auditId: audit.id,
    url: audit.websiteUrl,
    businessName: audit.businessName,
    phone: audit.phone,
    city: audit.city,
    state: audit.state,
    score: audit.totalScore,
    categorySlug: audit.industry,
    operatingModel: audit.progress?.operatingModel,
    auditTier: audit.progress?.auditTier,
    gbpLinked: audit.gbpProfile?.gbpLinked !== false,
    serviceAreaCities:
      audit.city && audit.state
        ? `${audit.city}, ${audit.state}`
        : audit.city ?? null,
  };
}

/**
 * Links an audit to the user/org/location created during onboarding.
 * First claim wins; later attempts are no-ops.
 */
export async function claimGraderAudit(input: {
  auditId: string;
  userId: string;
  organizationId: string;
  locationId: string;
}): Promise<boolean> {
  if (!UUID_RE.test(input.auditId)) return false;

  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, input.auditId),
    columns: { id: true, claimedByUserId: true },
  });

  if (!audit || audit.claimedByUserId) return false;

  await db
    .update(graderAudits)
    .set({
      claimedByUserId: input.userId,
      organizationId: input.organizationId,
      locationId: input.locationId,
      claimedAt: new Date(),
    })
    .where(eq(graderAudits.id, input.auditId));

  return true;
}
