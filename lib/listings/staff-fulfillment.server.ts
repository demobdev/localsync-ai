import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { parseStaffReviewState, transitionStaffReview, type StaffReviewAction } from "@/lib/listings/staff-fulfillment";

export type StaffFulfillmentEvent = { id: string; code: string; message: string; at: string; actorUserId: string | null };
export type StaffFulfillmentCase = {
  attemptId: string;
  routingRunId: string;
  organizationId: string;
  locationId: string;
  publisherId: string;
  businessName: string;
  publisherName: string;
  publisherSlug: string;
  createdAt: string;
  staffReview: ReturnType<typeof parseStaffReviewState>;
  events: StaffFulfillmentEvent[];
};

type QueueRow = Omit<StaffFulfillmentCase, "staffReview" | "events"> & { staffReview: unknown; createdAt: Date | string };
type EventRow = { id: string; code: string; message: string; at: Date | string; detail: unknown };

function iso(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("A staff queue record has an invalid timestamp.");
  return date.toISOString();
}

export async function listStaffFulfillmentCases(): Promise<StaffFulfillmentCase[]> {
  const db = getDb();
  const result = await db.execute(sql`
    SELECT a.id::text AS "attemptId", a.routing_run_id::text AS "routingRunId",
      a.organization_id AS "organizationId", a.location_id::text AS "locationId",
      a.publisher_id::text AS "publisherId", l.name AS "businessName",
      p.name AS "publisherName", p.slug AS "publisherSlug", a.created_at AS "createdAt",
      a.response_data->'fulfillment'->'staffReview' AS "staffReview"
    FROM public.listing_publisher_attempts a
    INNER JOIN public.listing_routing_runs r ON r.id = a.routing_run_id
      AND r.organization_id = a.organization_id AND r.location_id = a.location_id
    INNER JOIN public.locations l ON l.id = a.location_id AND l.organization_id = a.organization_id
    INNER JOIN public.publishers p ON p.id = a.publisher_id
    WHERE a.status = 'ready' AND a.rail = 'manual'
      AND a.response_data->'fulfillment'->>'nextActor' = 'localmap'
      AND a.response_data->'fulfillment'->>'state' = 'needs_operator_review'
    ORDER BY a.created_at ASC, a.id ASC
    LIMIT 201
  `);
  if (result.rows.length > 200) throw new Error("The staff queue exceeds its safe page size. Narrow the queue before continuing.");
  const rows = result.rows as unknown as QueueRow[];
  if (rows.length === 0) return [];

  const eventResult = await db.execute(sql`
    SELECT e.id::text AS id, e.code, e.message, e.created_at AS at, e.detail
    FROM public.listing_routing_events e
    WHERE e.stage = 'staff_fulfillment'
      AND e.detail->>'publisherAttemptId' IN (${sql.join(rows.map(row => sql`${row.attemptId}`), sql`, `)})
    ORDER BY e.created_at DESC, e.id DESC
  `);
  const eventsByAttempt = new Map<string, StaffFulfillmentEvent[]>();
  for (const row of eventResult.rows as unknown as EventRow[]) {
    const detail = row.detail && typeof row.detail === "object" ? row.detail as Record<string, unknown> : {};
    const attemptId = typeof detail.publisherAttemptId === "string" ? detail.publisherAttemptId : null;
    if (!attemptId) continue;
    const events = eventsByAttempt.get(attemptId) ?? [];
    events.push({
      id: row.id,
      code: row.code,
      message: row.message,
      at: iso(row.at),
      actorUserId: typeof detail.operatorUserId === "string" ? detail.operatorUserId : null,
    });
    eventsByAttempt.set(attemptId, events);
  }

  return rows.map(row => ({
    attemptId: row.attemptId,
    routingRunId: row.routingRunId,
    organizationId: row.organizationId,
    locationId: row.locationId,
    publisherId: row.publisherId,
    businessName: row.businessName,
    publisherName: row.publisherName,
    publisherSlug: row.publisherSlug,
    createdAt: iso(row.createdAt),
    staffReview: parseStaffReviewState(row.staffReview),
    events: eventsByAttempt.get(row.attemptId) ?? [],
  }));
}

export async function transitionStaffFulfillmentCase(input: {
  attemptId: string;
  expectedRevision: number;
  action: StaffReviewAction;
  operatorUserId: string;
  note?: string;
}) {
  const db = getDb();
  const [current] = await db.execute(sql`
    SELECT a.id::text AS "attemptId", a.response_data->'fulfillment'->'staffReview' AS "staffReview"
    FROM public.listing_publisher_attempts a
    WHERE a.id = ${input.attemptId}::uuid AND a.status = 'ready' AND a.rail = 'manual'
      AND a.response_data->'fulfillment'->>'nextActor' = 'localmap'
      AND a.response_data->'fulfillment'->>'state' = 'needs_operator_review'
    LIMIT 1
  `).then(result => result.rows as unknown as Array<{ attemptId: string; staffReview: unknown }>);
  if (!current) throw new Error("This staff case is no longer available.");

  const previous = parseStaffReviewState(current.staffReview);
  if (previous.revision !== input.expectedRevision) throw new Error("This case changed. Refresh the queue before trying again.");
  const now = new Date().toISOString();
  const next = transitionStaffReview({ state: previous, action: input.action, actorUserId: input.operatorUserId, note: input.note, now });
  const event = {
    publisherAttemptId: current.attemptId,
    operatorUserId: input.operatorUserId,
    action: input.action,
    revision: next.revision,
    ...(input.note ? { note: input.note.trim() } : {}),
  };
  const code = input.action === "claim" ? "staff_fulfillment_claimed"
    : input.action === "request_information" ? "staff_fulfillment_waiting_on_owner"
      : "staff_fulfillment_resumed";
  const message = input.action === "claim" ? "LocalMap staff claimed a publisher case"
    : input.action === "request_information" ? "LocalMap staff marked the case as waiting on owner information"
      : "LocalMap staff resumed a publisher case";

  const changed = await db.execute(sql`
    WITH updated AS (
      UPDATE public.listing_publisher_attempts a
      SET response_data = jsonb_set(
        COALESCE(a.response_data, '{}'::jsonb),
        '{fulfillment}',
        (a.response_data->'fulfillment') || jsonb_build_object('staffReview', ${JSON.stringify(next)}::jsonb),
        true
      ), updated_at = ${now}::timestamptz
      WHERE a.id = ${input.attemptId}::uuid AND a.status = 'ready' AND a.rail = 'manual'
        AND jsonb_typeof(a.response_data->'fulfillment') = 'object'
        AND a.response_data->'fulfillment'->>'nextActor' = 'localmap'
        AND a.response_data->'fulfillment'->>'state' = 'needs_operator_review'
        AND CASE
          WHEN a.response_data->'fulfillment'->'staffReview'->>'revision' ~ '^[0-9]+$'
            THEN (a.response_data->'fulfillment'->'staffReview'->>'revision')::integer
          ELSE 0
        END = ${input.expectedRevision}
      RETURNING a.id, a.routing_run_id, a.organization_id, a.location_id, a.publisher_id
    )
    INSERT INTO public.listing_routing_events
      (routing_run_id, organization_id, location_id, publisher_id, stage, level, code, message, detail)
    SELECT updated.routing_run_id, updated.organization_id, updated.location_id, updated.publisher_id,
      'staff_fulfillment', 'info', ${code}, ${message}, ${JSON.stringify(event)}::jsonb
    FROM updated
    RETURNING id
  `);
  if (changed.rows.length !== 1) throw new Error("This case changed before the update could be saved. Refresh the queue.");
  return next;
}
