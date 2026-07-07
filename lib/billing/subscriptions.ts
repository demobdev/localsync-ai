import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { billingSubscriptions } from "@/db/schema";

type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "ended"
  | "abandoned"
  | "incomplete"
  | "expired"
  | "upcoming";

const KNOWN_STATUSES: SubscriptionStatus[] = [
  "active",
  "past_due",
  "canceled",
  "ended",
  "abandoned",
  "incomplete",
  "expired",
  "upcoming",
];

export function normalizeSubscriptionStatus(
  raw: string | undefined,
): SubscriptionStatus {
  return KNOWN_STATUSES.includes(raw as SubscriptionStatus)
    ? (raw as SubscriptionStatus)
    : "incomplete";
}

function toDate(epochMs: number | null | undefined): Date | null {
  return epochMs ? new Date(epochMs) : null;
}

export async function upsertBillingSubscription(input: {
  subscriptionId: string;
  organizationId: string;
  planSlug: string;
  status: string;
  payerEmail?: string | null;
  periodStart?: number | null;
  periodEnd?: number | null;
  canceledAt?: number | null;
  pastDueAt?: number | null;
}): Promise<void> {
  const db = getDb();
  const status = normalizeSubscriptionStatus(input.status);
  const now = new Date();

  await db
    .insert(billingSubscriptions)
    .values({
      id: input.subscriptionId,
      organizationId: input.organizationId,
      planSlug: input.planSlug,
      status,
      payerEmail: input.payerEmail ?? null,
      periodStart: toDate(input.periodStart),
      periodEnd: toDate(input.periodEnd),
      canceledAt: toDate(input.canceledAt),
      pastDueAt: toDate(input.pastDueAt),
    })
    .onConflictDoUpdate({
      target: billingSubscriptions.id,
      set: {
        organizationId: input.organizationId,
        planSlug: input.planSlug,
        status,
        ...(input.payerEmail ? { payerEmail: input.payerEmail } : {}),
        periodStart: toDate(input.periodStart),
        periodEnd: toDate(input.periodEnd),
        canceledAt: toDate(input.canceledAt),
        pastDueAt: toDate(input.pastDueAt),
        updatedAt: now,
      },
    });
}

/**
 * Item-level events carry no parent subscription id — match by org + plan.
 */
export async function updateBillingSubscriptionByOrgPlan(input: {
  organizationId: string;
  planSlug: string;
  status: string;
  canceledAt?: number | null;
  pastDueAt?: number | null;
}): Promise<void> {
  const db = getDb();

  await db
    .update(billingSubscriptions)
    .set({
      status: normalizeSubscriptionStatus(input.status),
      ...(input.canceledAt ? { canceledAt: new Date(input.canceledAt) } : {}),
      ...(input.pastDueAt ? { pastDueAt: new Date(input.pastDueAt) } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(billingSubscriptions.organizationId, input.organizationId),
        eq(billingSubscriptions.planSlug, input.planSlug),
      ),
    );
}

export async function getOrgSubscription(organizationId: string) {
  const db = getDb();

  const [subscription] = await db
    .select()
    .from(billingSubscriptions)
    .where(eq(billingSubscriptions.organizationId, organizationId))
    .limit(1);

  return subscription ?? null;
}
