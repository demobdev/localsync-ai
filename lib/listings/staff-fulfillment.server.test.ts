// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ db: vi.fn() }));
vi.mock("@/db", () => ({ getDb: mocks.db }));
import { listAgentPreviewFulfillmentCases, listStaffFulfillmentCases, transitionStaffFulfillmentCase } from "./staff-fulfillment.server";

const id = "50000000-0000-4000-8000-000000000001";
const runId = "40000000-0000-4000-8000-000000000001";
const locationId = "10000000-0000-4000-8000-000000000001";
const publisherId = "30000000-0000-4000-8000-000000000001";
const otherAttemptId = "50000000-0000-4000-8000-000000000002";
let sqlDb: PGlite;
let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  sqlDb = new PGlite(); db = drizzle(sqlDb);
  await sqlDb.exec(`
    CREATE TABLE organizations (id text PRIMARY KEY, name text);
    CREATE TABLE locations (id uuid, organization_id text, name text);
    CREATE TABLE publishers (id uuid, name text, slug text);
    CREATE TABLE listing_routing_runs (id uuid, organization_id text, location_id uuid);
    CREATE TABLE listing_publisher_attempts (
      id uuid PRIMARY KEY, routing_run_id uuid, organization_id text, location_id uuid, publisher_id uuid,
      rail text, status text, response_data jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE listing_routing_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), routing_run_id uuid, organization_id text,
      location_id uuid, publisher_id uuid, stage text, level text, code text, message text,
      detail jsonb, created_at timestamptz DEFAULT now()
    );
  `);
});
afterAll(async () => { await sqlDb.close(); });
beforeEach(async () => {
  vi.clearAllMocks(); mocks.db.mockReturnValue(db);
  await sqlDb.exec("TRUNCATE organizations, locations, publishers, listing_routing_runs, listing_publisher_attempts, listing_routing_events;");
  await sqlDb.query("INSERT INTO organizations VALUES ('org_demo', 'LocalSync QA Cafe'), ('org_other', 'Customer Workspace')");
  await sqlDb.query("INSERT INTO locations VALUES ($1, 'org_demo', 'Demo Corner Cafe')", [locationId]);
  await sqlDb.query("INSERT INTO publishers VALUES ($1, 'Example Publisher', 'example-publisher')", [publisherId]);
  await sqlDb.query("INSERT INTO listing_routing_runs VALUES ($1, 'org_demo', $2)", [runId, locationId]);
  await sqlDb.query(`INSERT INTO listing_publisher_attempts
    (id, routing_run_id, organization_id, location_id, publisher_id, rail, status, response_data, created_at)
    VALUES ($1, $2, 'org_demo', $3, $4, 'manual', 'ready', $5, '2026-10-23T10:00:00Z')`,
  [id, runId, locationId, publisherId, { providerPrivateField: "never projected", fulfillment: { nextActor: "localmap", state: "needs_operator_review" } }]);
  await sqlDb.query(`INSERT INTO listing_publisher_attempts
    (id, routing_run_id, organization_id, location_id, publisher_id, rail, status, response_data)
    VALUES ($1, $2, 'org_demo', $3, $4, 'manual', 'submitted', $5)`,
  [otherAttemptId, runId, locationId, publisherId, { fulfillment: { nextActor: "localmap", state: "needs_operator_review" } }]);
  await sqlDb.query("INSERT INTO locations VALUES ($1, 'org_other', 'Customer Location')", ["10000000-0000-4000-8000-000000000002"]);
  await sqlDb.query("INSERT INTO listing_routing_runs VALUES ($1, 'org_other', $2)", ["40000000-0000-4000-8000-000000000002", "10000000-0000-4000-8000-000000000002"]);
  await sqlDb.query(`INSERT INTO listing_publisher_attempts
    (id, routing_run_id, organization_id, location_id, publisher_id, rail, status, response_data, created_at)
    VALUES ($1, $2, 'org_other', $3, $4, 'manual', 'ready', $5, '2026-10-23T10:01:00Z')`,
  ["50000000-0000-4000-8000-000000000003", "40000000-0000-4000-8000-000000000002", "10000000-0000-4000-8000-000000000002", publisherId, { fulfillment: { nextActor: "localmap", state: "needs_operator_review" } }]);
});

describe("durable LocalMap staff fulfillment store", () => {
  it("selects only manual ready attempts explicitly routed to LocalMap and excludes provider payloads", async () => {
    const queue = await listStaffFulfillmentCases();
    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({ attemptId: id, businessName: "Demo Corner Cafe", publisherSlug: "example-publisher",
      staffReview: { status: "needs_review", revision: 0, assignedToUserId: null } });
    expect(queue[1]).toMatchObject({ organizationId: "org_other", businessName: "Customer Location" });
    expect(JSON.stringify(queue)).not.toContain("providerPrivateField");
    expect(queue[0].events).toEqual([]);
  });

  it("scopes the agent preview to the synthetic QA organization", async () => {
    const queue = await listAgentPreviewFulfillmentCases();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ organizationId: "org_demo", businessName: "Demo Corner Cafe" });
  });

  it("atomically saves assigned review state with an append-only routing event", async () => {
    const claimed = await transitionStaffFulfillmentCase({ attemptId: id, expectedRevision: 0, action: "claim", operatorUserId: "user_staff" });
    expect(claimed).toMatchObject({ status: "in_progress", revision: 1, assignedToUserId: "user_staff" });
    const saved = await sqlDb.query<{ response_data: Record<string, unknown> }>("SELECT response_data FROM listing_publisher_attempts WHERE id = $1", [id]);
    expect(saved.rows[0].response_data.providerPrivateField).toBe("never projected");
    expect((saved.rows[0].response_data.fulfillment as Record<string, unknown>).state).toBe("needs_operator_review");
    expect(await sqlDb.query("SELECT id FROM listing_routing_events WHERE stage = 'staff_fulfillment' AND code = 'staff_fulfillment_claimed'")).toHaveProperty("rows.length", 1);
    expect((await listStaffFulfillmentCases())[0].staffReview.status).toBe("in_progress");
  });

  it("saves information requests and resumption while retaining the revision history", async () => {
    await transitionStaffFulfillmentCase({ attemptId: id, expectedRevision: 0, action: "claim", operatorUserId: "user_staff" });
    const waiting = await transitionStaffFulfillmentCase({ attemptId: id, expectedRevision: 1, action: "request_information", operatorUserId: "user_staff", note: "Need owner-approved URL" });
    expect(waiting).toMatchObject({ status: "needs_information", revision: 2, lastNote: "Need owner-approved URL" });
    const resumed = await transitionStaffFulfillmentCase({ attemptId: id, expectedRevision: 2, action: "resume", operatorUserId: "user_staff", note: "Owner provided the URL" });
    expect(resumed).toMatchObject({ status: "in_progress", revision: 3 });
    const queue = await listStaffFulfillmentCases();
    expect(queue[0].events.map(event => event.code)).toEqual([
      "staff_fulfillment_resumed", "staff_fulfillment_waiting_on_owner", "staff_fulfillment_claimed",
    ]);
    expect(queue[0].events.map(event => event.actorUserId)).toEqual(["user_staff", "user_staff", "user_staff"]);
  });

  it("rejects stale revisions and attempts that are no longer eligible for staff review", async () => {
    await transitionStaffFulfillmentCase({ attemptId: id, expectedRevision: 0, action: "claim", operatorUserId: "user_staff" });
    await expect(transitionStaffFulfillmentCase({ attemptId: id, expectedRevision: 0, action: "request_information", operatorUserId: "user_staff", note: "Need a URL" })).rejects.toThrow("changed");
    await expect(transitionStaffFulfillmentCase({ attemptId: otherAttemptId, expectedRevision: 0, action: "claim", operatorUserId: "user_staff" })).rejects.toThrow("no longer available");
    expect(await sqlDb.query("SELECT id FROM listing_routing_events")).toHaveProperty("rows.length", 1);
  });
});
