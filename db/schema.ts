import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
  fromDriver(value: string) {
    return JSON.parse(value) as number[];
  },
});

export const versionSourceEnum = pgEnum("version_source", [
  "user",
  "gbp_import",
  "ai_suggestion_approved",
]);

export const publisherRailEnum = pgEnum("publisher_rail", [
  "api",
  "guided_import",
  "manual",
  "audit_only",
]);

export const locationPublisherStatusEnum = pgEnum("location_publisher_status", [
  "synced",
  "pending",
  "manual",
  "unknown",
]);

export const manualTaskStatusEnum = pgEnum("manual_task_status", [
  "open",
  "in_progress",
  "done",
  "blocked",
]);

export const auditRunStatusEnum = pgEnum("audit_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const auditFindingSeverityEnum = pgEnum("audit_finding_severity", [
  "critical",
  "warning",
  "info",
]);

export const approvalRequestStatusEnum = pgEnum("approval_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const generatedPageStatusEnum = pgEnum("generated_page_status", [
  "draft",
  "published",
  "archived",
]);

export const crawlerCheckStatusEnum = pgEnum("crawler_check_status", [
  "queued",
  "running",
  "passed",
  "failed",
]);

export const reviewSourceEnum = pgEnum("review_source", [
  "google",
  "yelp",
  "manual",
  "demo",
]);

export const reviewReplyStatusEnum = pgEnum("review_reply_status", [
  "unreplied",
  "draft_pending",
  "replied",
  "skipped",
]);

export const organizationTypeEnum = pgEnum("organization_type", [
  "business",
  "agency",
]);

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  imageUrl: text("image_url"),
  type: organizationTypeEnum("type").default("business").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("clients_organization_id_idx").on(table.organizationId),
    index("clients_org_slug_idx").on(table.organizationId, table.slug),
  ],
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    profile: jsonb("profile").$type<LocationProfileSnapshot>().notNull(),
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("locations_organization_id_idx").on(table.organizationId),
    index("locations_client_id_idx").on(table.clientId),
    index("locations_org_slug_idx").on(table.organizationId, table.slug),
  ],
);

export const locationVersions = pgTable(
  "location_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    versionNumber: integer("version_number").notNull(),
    snapshot: jsonb("snapshot").$type<LocationProfileSnapshot>().notNull(),
    source: versionSourceEnum("source").notNull().default("user"),
    actorUserId: text("actor_user_id"),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("location_versions_location_id_idx").on(table.locationId),
    index("location_versions_location_version_idx").on(
      table.locationId,
      table.versionNumber,
    ),
  ],
);

export const businessCategories = pgTable(
  "business_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    vertical: text("vertical").notNull(),
    schemaOrgType: text("schema_org_type").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("business_categories_vertical_idx").on(table.vertical)],
);

export const serviceTaxonomy = pgTable(
  "service_taxonomy",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categorySlug: text("category_slug").notNull(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("service_taxonomy_category_slug_idx").on(table.categorySlug),
  ],
);

export const publishers = pgTable(
  "publishers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    rail: publisherRailEnum("rail").notNull(),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    description: text("description"),
    isCore: boolean("is_core").notNull().default(false),
    isHomeServices: boolean("is_home_services").notNull().default(false),
    checklistMarkdown: text("checklist_markdown"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("publishers_rail_idx").on(table.rail)],
);

export const publisherRequiredFields = pgTable(
  "publisher_required_fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publisherId: uuid("publisher_id")
      .references(() => publishers.id, { onDelete: "cascade" })
      .notNull(),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("publisher_required_fields_publisher_id_idx").on(table.publisherId),
  ],
);

export const locationPublishers = pgTable(
  "location_publishers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    publisherId: uuid("publisher_id")
      .references(() => publishers.id, { onDelete: "cascade" })
      .notNull(),
    status: locationPublisherStatusEnum("status").notNull().default("unknown"),
    listingUrl: text("listing_url"),
    externalId: text("external_id"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("location_publishers_location_id_idx").on(table.locationId),
    index("location_publishers_publisher_id_idx").on(table.publisherId),
    index("location_publishers_location_publisher_idx").on(
      table.locationId,
      table.publisherId,
    ),
  ],
);

export const manualTasks = pgTable(
  "manual_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    publisherId: uuid("publisher_id")
      .references(() => publishers.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: manualTaskStatusEnum("status").notNull().default("open"),
    checklistItemKey: text("checklist_item_key"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("manual_tasks_location_id_idx").on(table.locationId),
    index("manual_tasks_publisher_id_idx").on(table.publisherId),
    index("manual_tasks_status_idx").on(table.status),
  ],
);

export const auditRuns = pgTable(
  "audit_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    status: auditRunStatusEnum("status").notNull().default("queued"),
    triggeredByUserId: text("triggered_by_user_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_runs_location_id_idx").on(table.locationId),
    index("audit_runs_status_idx").on(table.status),
  ],
);

export const auditFindings = pgTable(
  "audit_findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditRunId: uuid("audit_run_id")
      .references(() => auditRuns.id, { onDelete: "cascade" })
      .notNull(),
    publisherId: uuid("publisher_id").references(() => publishers.id, {
      onDelete: "set null",
    }),
    fieldKey: text("field_key").notNull(),
    masterValue: text("master_value"),
    foundValue: text("found_value"),
    severity: auditFindingSeverityEnum("severity").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_findings_audit_run_id_idx").on(table.auditRunId),
    index("audit_findings_publisher_id_idx").on(table.publisherId),
  ],
);

export const auditEvidence = pgTable(
  "audit_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditRunId: uuid("audit_run_id")
      .references(() => auditRuns.id, { onDelete: "cascade" })
      .notNull(),
    publisherId: uuid("publisher_id").references(() => publishers.id, {
      onDelete: "set null",
    }),
    sourceUrl: text("source_url").notNull(),
    markdownSnapshot: text("markdown_snapshot"),
    extractedData: jsonb("extracted_data").$type<Record<string, unknown>>(),
    embedding: vector("embedding"),
    blobUrl: text("blob_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_evidence_audit_run_id_idx").on(table.auditRunId),
    index("audit_evidence_publisher_id_idx").on(table.publisherId),
  ],
);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    requestType: text("request_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: approvalRequestStatusEnum("status").notNull().default("pending"),
    requestedByUserId: text("requested_by_user_id"),
    reviewedByUserId: text("reviewed_by_user_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("approval_requests_organization_id_idx").on(table.organizationId),
    index("approval_requests_location_id_idx").on(table.locationId),
    index("approval_requests_status_idx").on(table.status),
  ],
);

export const generatedPages = pgTable(
  "generated_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    status: generatedPageStatusEnum("status").notNull().default("draft"),
    htmlContent: text("html_content"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("generated_pages_location_id_idx").on(table.locationId),
    index("generated_pages_status_idx").on(table.status),
  ],
);

export const schemaOutputs = pgTable(
  "schema_outputs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    generatedPageId: uuid("generated_page_id").references(
      () => generatedPages.id,
      { onDelete: "set null" },
    ),
    schemaType: text("schema_type").notNull(),
    jsonLd: jsonb("json_ld").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("schema_outputs_location_id_idx").on(table.locationId)],
);

export const crawlerChecks = pgTable(
  "crawler_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    generatedPageId: uuid("generated_page_id").references(
      () => generatedPages.id,
      { onDelete: "set null" },
    ),
    status: crawlerCheckStatusEnum("status").notNull().default("queued"),
    targetUrl: text("target_url").notNull(),
    results: jsonb("results").$type<Record<string, unknown>>(),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crawler_checks_location_id_idx").on(table.locationId),
    index("crawler_checks_status_idx").on(table.status),
  ],
);

export const locationReviews = pgTable(
  "location_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    source: reviewSourceEnum("source").notNull(),
    externalId: text("external_id"),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    text: text("text").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    replyStatus: reviewReplyStatusEnum("reply_status")
      .notNull()
      .default("unreplied"),
    replyText: text("reply_text"),
    replyPostedAt: timestamp("reply_posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("location_reviews_location_id_idx").on(table.locationId),
    index("location_reviews_organization_id_idx").on(table.organizationId),
    index("location_reviews_reply_status_idx").on(table.replyStatus),
    index("location_reviews_location_source_external_idx").on(
      table.locationId,
      table.source,
      table.externalId,
    ),
  ],
);

export const connectorCredentials = pgTable(
  "connector_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    provider: text("provider").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    scope: text("scope"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("connector_credentials_org_provider_idx").on(
      table.organizationId,
      table.provider,
    ),
  ],
);

export const enablePgVector = sql`CREATE EXTENSION IF NOT EXISTS vector`;

/** Daily visibility score snapshots per location, for trend charts. */
export const visibilityScoreSnapshots = pgTable(
  "visibility_score_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .references(() => locations.id, { onDelete: "cascade" })
      .notNull(),
    day: text("day").notNull(), // YYYY-MM-DD (UTC)
    score: integer("score").notNull(),
    profileScore: integer("profile_score").notNull(),
    auditScore: integer("audit_score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("visibility_snapshots_location_day_idx").on(
      table.locationId,
      table.day,
    ),
  ],
);

/** Public "free AI visibility scan" leads — no auth, captured pre-signup. */
export const scanLeads = pgTable(
  "scan_leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull(),
    businessName: text("business_name"),
    phone: text("phone"),
    city: text("city"),
    state: text("state"),
    score: integer("score").notNull().default(0),
    checks: jsonb("checks").$type<
      Array<{ id: string; label: string; passed: boolean; detail: string }>
    >(),
    extracted: jsonb("extracted"),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("scan_leads_created_at_idx").on(table.createdAt)],
);
