import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

const QA_ORGANIZATION_ID = "org_3L78Di29tAhX0iTmYMWjBq8b05d";
const QA_ORGANIZATION_NAME = "LocalSync QA Cafe";
const QA_DATABASE_NAME = "localsync_fulfillment_qa";
const QA_NEON_HOSTS = new Set([
  "ep-green-hall-b7gjiyit.c-13.us-east-1.aws.neon.tech",
  "ep-green-hall-b7gjiyit-xnd.c-13.us-east-1.aws.neon.tech",
  "ep-green-hall-b7gjiyit-pooler.c-13.us-east-1.aws.neon.tech",
]);

const fixtures = [
  {
    scenario: "clean-match",
    locationId: "a8000000-0000-4000-8000-000000000001",
    versionId: "a8000000-0000-4000-8000-000000000002",
    runId: "a8000000-0000-4000-8000-000000000003",
    attemptId: "a8000000-0000-4000-8000-000000000004",
    eventId: "a8000000-0000-4000-8000-000000000005",
    publisherSlug: "bbb",
    name: "LocalSync QA - Juniper Demo Cafe",
    phone: "555-010-1201",
    addressLine1: "101 QA Way",
    website: "https://juniper-demo.example",
    categorySlug: "restaurant",
    summary: "Synthetic clean-match manual fulfillment case.",
  },
  {
    scenario: "partial-match",
    locationId: "a8000000-0000-4000-8000-000000000011",
    versionId: "a8000000-0000-4000-8000-000000000012",
    runId: "a8000000-0000-4000-8000-000000000013",
    attemptId: "a8000000-0000-4000-8000-000000000014",
    eventId: "a8000000-0000-4000-8000-000000000015",
    publisherSlug: "data-axle",
    name: "LocalSync QA - Harbor Demo Dental",
    phone: "555-010-1202",
    addressLine1: "202 QA Avenue",
    website: "https://harbor-demo.example",
    categorySlug: "dentist",
    summary: "Synthetic partial-match manual fulfillment case.",
  },
] as const;

type Environment = Record<string, string | undefined>;

export function canSeedSyntheticFulfillmentFixtures(env: Environment = process.env) {
  if (env.VERCEL_ENV !== "preview") return false;
  if (env.VERCEL_GIT_COMMIT_REF !== "codex/localsync-synup-mvp") return false;
  if (env.LOCALMAP_STAFF_FULFILLMENT_ENABLED !== "true") return false;

  try {
    const databaseUrl = new URL(env.DATABASE_URL ?? "");
    return databaseUrl.protocol.startsWith("postgres")
      && databaseUrl.pathname === `/${QA_DATABASE_NAME}`
      && QA_NEON_HOSTS.has(databaseUrl.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function seedSyntheticFulfillmentFixtures(operatorUserId: string) {
  if (!operatorUserId.trim() || !canSeedSyntheticFulfillmentFixtures()) {
    throw new Error("Synthetic fixtures are unavailable outside the isolated QA Preview.");
  }

  const db = getDb();
  const databaseResult = await db.execute(sql`SELECT current_database() AS name`);
  const databaseName = (databaseResult.rows[0] as { name?: string } | undefined)?.name;
  if (databaseName !== QA_DATABASE_NAME) {
    throw new Error("The active database does not match the isolated QA database.");
  }

  const targetResult = await db.execute(sql`
    SELECT o.id AS organization_id, c.id::text AS client_id
    FROM public.organizations o
    INNER JOIN public.clients c ON c.organization_id = o.id
    INNER JOIN public.locations l ON l.client_id = c.id AND l.organization_id = o.id
    WHERE o.id = ${QA_ORGANIZATION_ID} AND o.name = ${QA_ORGANIZATION_NAME}
    ORDER BY c.id
    LIMIT 1
  `);
  const target = targetResult.rows[0] as { organization_id: string; client_id: string } | undefined;
  if (!target) throw new Error("The synthetic QA workspace was not found.");

  const publisherResult = await db.execute(sql`
    SELECT id::text AS id, slug
    FROM public.publishers
    WHERE rail = 'manual' AND slug IN (${sql.join(fixtures.map(fixture => sql`${fixture.publisherSlug}`), sql`, `)})
  `);
  const publisherRows = publisherResult.rows as Array<{ id: string; slug: string }>;
  const publisherIds = new Map(publisherRows.map(row => [row.slug, row.id]));
  if (fixtures.some(fixture => !publisherIds.has(fixture.publisherSlug))) {
    throw new Error("A required manual publisher fixture is unavailable.");
  }

  const statements = fixtures.flatMap(fixture => {
    const profile = {
      ...EMPTY_LOCATION_PROFILE,
      name: fixture.name,
      phone: fixture.phone,
      addressLine1: fixture.addressLine1,
      city: "Sampleville",
      state: "CA",
      postalCode: "90210",
      country: "US",
      website: fixture.website,
      categorySlug: fixture.categorySlug,
    };
    const publisherId = publisherIds.get(fixture.publisherSlug)!;
    const staffReview = {
      status: "needs_review",
      revision: 0,
      assignedToUserId: null,
      lastNote: null,
      updatedAt: null,
    };

    const fulfillment = {
      nextActor: "localmap",
      state: "needs_operator_review",
      reasonCode: "manual_publisher_rail",
      qaFixture: true,
      scenario: fixture.scenario,
      staffReview,
    };
    const summary = { qaFixture: true, scenario: fixture.scenario, staffReviewCount: 1 };
    const eventDetail = {
      publisherAttemptId: fixture.attemptId,
      scenario: fixture.scenario,
      synthetic: true,
    };

    return [
      db.execute(sql`
        INSERT INTO public.locations (id, organization_id, client_id, name, slug, profile)
        VALUES (${fixture.locationId}::uuid, ${target.organization_id}, ${target.client_id}::uuid,
          ${fixture.name}, ${fixture.scenario}, ${JSON.stringify(profile)}::jsonb)
        ON CONFLICT (id) DO NOTHING
      `),
      db.execute(sql`
        INSERT INTO public.location_versions
          (id, location_id, version_number, snapshot, source, actor_user_id, change_summary)
        VALUES (${fixture.versionId}::uuid, ${fixture.locationId}::uuid, 1,
          ${JSON.stringify(profile)}::jsonb, 'user', ${operatorUserId}, ${`Synthetic QA ${fixture.scenario} fixture`})
        ON CONFLICT (id) DO NOTHING
      `),
      db.execute(sql`
        UPDATE public.locations SET current_version_id = ${fixture.versionId}::uuid, updated_at = now()
        WHERE id = ${fixture.locationId}::uuid AND organization_id = ${target.organization_id}
      `),
      db.execute(sql`
        INSERT INTO public.listing_routing_runs
          (id, organization_id, location_id, location_version_id, idempotency_key, status, trigger, started_by_user_id, summary)
        VALUES (${fixture.runId}::uuid, ${target.organization_id}, ${fixture.locationId}::uuid,
          ${fixture.versionId}::uuid, ${`localsync-qa-fulfillment-${fixture.scenario}-v1`},
          'waiting_for_staff', 'manual', ${operatorUserId}, ${JSON.stringify(summary)}::jsonb)
        ON CONFLICT DO NOTHING
      `),
      db.execute(sql`
        INSERT INTO public.listing_publisher_attempts
          (id, routing_run_id, organization_id, location_id, publisher_id, rail, status, response_data)
        VALUES (${fixture.attemptId}::uuid, ${fixture.runId}::uuid, ${target.organization_id},
          ${fixture.locationId}::uuid, ${publisherId}::uuid, 'manual', 'ready',
          ${JSON.stringify({ fulfillment })}::jsonb)
        ON CONFLICT DO NOTHING
      `),
      db.execute(sql`
        INSERT INTO public.listing_routing_events
          (id, routing_run_id, organization_id, location_id, publisher_id, stage, level, code, message, detail)
        VALUES (${fixture.eventId}::uuid, ${fixture.runId}::uuid, ${target.organization_id},
          ${fixture.locationId}::uuid, ${publisherId}::uuid, 'staff_fulfillment', 'info',
          'qa_synthetic_case_staged',
          ${`Synthetic QA ${fixture.scenario} case staged; no publisher submission or owner contact was attempted.`},
          ${JSON.stringify(eventDetail)}::jsonb)
        ON CONFLICT (id) DO NOTHING
      `),
    ];
  });

  const [firstStatement, ...remainingStatements] = statements;
  if (!firstStatement) throw new Error("No synthetic QA fixtures are configured.");
  await db.batch([firstStatement, ...remainingStatements]);

  const verified = await db.execute(sql`
    SELECT a.id::text AS id, a.organization_id, a.location_id::text AS location_id,
      a.publisher_id::text AS publisher_id, a.rail::text AS rail, a.status::text AS status,
      a.response_data->'fulfillment'->>'scenario' AS scenario
    FROM public.listing_publisher_attempts a
    WHERE a.id IN (${sql.join(fixtures.map(fixture => sql`${fixture.attemptId}::uuid`), sql`, `)})
  `);
  const rows = verified.rows as Array<{
    id: string;
    organization_id: string;
    location_id: string;
    publisher_id: string;
    rail: string;
    status: string;
    scenario: string;
  }>;
  const isExpectedFixture = (fixture: typeof fixtures[number]) => rows.some(row =>
    row.id === fixture.attemptId
      && row.organization_id === target.organization_id
      && row.location_id === fixture.locationId
      && row.publisher_id === publisherIds.get(fixture.publisherSlug)
      && row.rail === "manual"
      && row.status === "ready"
      && row.scenario === fixture.scenario,
  );
  if (fixtures.some(fixture => !isExpectedFixture(fixture))) {
    throw new Error("Synthetic fixture setup did not complete. Refresh before retrying.");
  }
  return { createdCases: rows.length };
}
