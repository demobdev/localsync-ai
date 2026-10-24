import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  clients,
  listingPublisherAttempts,
  listingRoutingEvents,
  listingRoutingRuns,
  locationVersions,
  locations,
  organizations,
  publishers,
} from "@/db/schema";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

const QA_ORGANIZATION_ID = "org_3L78Di29tAhX0iTmYMWjBq8b05d";
const QA_ORGANIZATION_NAME = "LocalSync QA Cafe";
const QA_DATABASE_NAME = "localsync_fulfillment_qa";
const QA_NEON_HOSTS = new Set([
  "ep-green-hall-b7gjiyit.c-13.us-east-1.aws.neon.tech",
  "ep-green-hall-b7gjiyit-xnd.c-13.us-east-1.aws.neon.tech",
]);

const fixtures = [
  {
    scenario: "clean-match",
    locationId: "a8000000-0000-4000-8000-000000000001",
    versionId: "a8000000-0000-4000-8000-000000000002",
    runId: "a8000000-0000-4000-8000-000000000003",
    attemptId: "a8000000-0000-4000-8000-000000000004",
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

  const [target] = await db
    .select({ organizationId: organizations.id, clientId: clients.id })
    .from(organizations)
    .innerJoin(clients, eq(clients.organizationId, organizations.id))
    .innerJoin(locations, eq(locations.clientId, clients.id))
    .where(and(
      eq(organizations.id, QA_ORGANIZATION_ID),
      eq(organizations.name, QA_ORGANIZATION_NAME),
    ))
    .limit(1);
  if (!target) throw new Error("The synthetic QA workspace was not found.");

  const publisherRows = await db
    .select({ id: publishers.id, slug: publishers.slug })
    .from(publishers)
    .where(and(
      inArray(publishers.slug, fixtures.map(fixture => fixture.publisherSlug)),
      eq(publishers.rail, "manual"),
    ));
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

    return [
      db.insert(locations).values({
        id: fixture.locationId,
        organizationId: target.organizationId,
        clientId: target.clientId,
        name: fixture.name,
        slug: fixture.scenario,
        profile,
      }).onConflictDoNothing(),
      db.insert(locationVersions).values({
        id: fixture.versionId,
        locationId: fixture.locationId,
        versionNumber: 1,
        snapshot: profile,
        source: "user",
        actorUserId: operatorUserId,
        changeSummary: `Synthetic QA ${fixture.scenario} fixture`,
      }).onConflictDoNothing(),
      db.update(locations)
        .set({ currentVersionId: fixture.versionId, updatedAt: new Date() })
        .where(eq(locations.id, fixture.locationId)),
      db.insert(listingRoutingRuns).values({
        id: fixture.runId,
        organizationId: target.organizationId,
        locationId: fixture.locationId,
        locationVersionId: fixture.versionId,
        idempotencyKey: `localsync-qa-fulfillment-${fixture.scenario}-v1`,
        status: "waiting_for_staff",
        trigger: "manual",
        startedByUserId: operatorUserId,
        summary: { qaFixture: true, scenario: fixture.scenario, staffReviewCount: 1 },
      }).onConflictDoNothing(),
      db.insert(listingPublisherAttempts).values({
        id: fixture.attemptId,
        routingRunId: fixture.runId,
        organizationId: target.organizationId,
        locationId: fixture.locationId,
        publisherId,
        rail: "manual",
        status: "ready",
        responseData: {
          fulfillment: {
            nextActor: "localmap",
            state: "needs_operator_review",
            reasonCode: "manual_publisher_rail",
            qaFixture: true,
            scenario: fixture.scenario,
            staffReview,
          },
        },
      }).onConflictDoNothing(),
      db.insert(listingRoutingEvents).values({
        id: fixture.attemptId.replace(/4$/, "5"),
        routingRunId: fixture.runId,
        organizationId: target.organizationId,
        locationId: fixture.locationId,
        publisherId,
        stage: "staff_fulfillment",
        level: "info",
        code: "qa_synthetic_case_staged",
        message: `Synthetic QA ${fixture.scenario} case staged; no publisher submission or owner contact was attempted.`,
        detail: { publisherAttemptId: fixture.attemptId, scenario: fixture.scenario, synthetic: true },
      }).onConflictDoNothing(),
    ];
  });

  const [firstStatement, ...remainingStatements] = statements;
  if (!firstStatement) throw new Error("No synthetic QA fixtures are configured.");
  await db.batch([firstStatement, ...remainingStatements]);

  const created = await db
    .select({ id: listingPublisherAttempts.id })
    .from(listingPublisherAttempts)
    .where(inArray(listingPublisherAttempts.id, fixtures.map(fixture => fixture.attemptId)));
  if (created.length !== fixtures.length) {
    throw new Error("Synthetic fixture setup did not complete. Refresh before retrying.");
  }
  return { createdCases: created.length };
}
