"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  auditFindings,
  auditRuns,
  businessCategories,
  crawlerChecks,
  generatedPages,
  locations,
  schemaOutputs,
  serviceTaxonomy,
} from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import { runCrawlerCheck } from "@/lib/visibility/crawler-check";
import { submitIndexNow } from "@/lib/visibility/indexnow";
import { buildLlmsTxt } from "@/lib/visibility/llms-txt";
import { buildLocationPageHtml } from "@/lib/visibility/page";
import { buildLocationJsonLd } from "@/lib/visibility/schema";
import {
  computeVisibilityScore,
  type VisibilityScoreBreakdown,
} from "@/lib/visibility/score";

function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002").replace(
    /\/$/,
    "",
  );
}

function getPublicPageUrl(locationId: string): string {
  return `${getAppBaseUrl()}/l/${locationId}`;
}

async function assertLocationInOrg(locationId: string, orgId: string) {
  const db = getDb();
  const [location] = await db
    .select()
    .from(locations)
    .where(
      and(eq(locations.id, locationId), eq(locations.organizationId, orgId)),
    )
    .limit(1);

  if (!location) {
    throw new Error("Location not found");
  }

  return location;
}

async function resolveTaxonomy(profile: {
  categorySlug?: string;
  serviceSlugs: string[];
}) {
  const db = getDb();

  const [category] = profile.categorySlug
    ? await db
        .select()
        .from(businessCategories)
        .where(eq(businessCategories.slug, profile.categorySlug))
        .limit(1)
    : [undefined];

  const services =
    profile.serviceSlugs.length > 0
      ? await db
          .select({ name: serviceTaxonomy.name, slug: serviceTaxonomy.slug })
          .from(serviceTaxonomy)
          .where(inArray(serviceTaxonomy.slug, profile.serviceSlugs))
      : [];

  return {
    schemaOrgType: category?.schemaOrgType ?? "LocalBusiness",
    categoryName: category?.name,
    serviceNames: services.map((service) => service.name),
  };
}

async function getAuditCounts(locationId: string) {
  const db = getDb();

  const [latestRun] = await db
    .select({ id: auditRuns.id })
    .from(auditRuns)
    .where(
      and(
        eq(auditRuns.locationId, locationId),
        eq(auditRuns.status, "completed"),
      ),
    )
    .orderBy(desc(auditRuns.createdAt))
    .limit(1);

  const [runCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditRuns)
    .where(
      and(
        eq(auditRuns.locationId, locationId),
        eq(auditRuns.status, "completed"),
      ),
    );

  if (!latestRun) {
    return {
      runs: runCountRow?.count ?? 0,
      critical: 0,
      warning: 0,
      info: 0,
    };
  }

  const findings = await db
    .select({ severity: auditFindings.severity })
    .from(auditFindings)
    .where(eq(auditFindings.auditRunId, latestRun.id));

  return {
    runs: runCountRow?.count ?? 0,
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}

export async function getLocationVisibilityAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  const location = await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const audit = await getAuditCounts(locationId);
  const score = computeVisibilityScore({
    profile: location.profile,
    audit: audit.runs > 0 ? audit : undefined,
  });

  const [page] = await db
    .select()
    .from(generatedPages)
    .where(eq(generatedPages.locationId, locationId))
    .orderBy(desc(generatedPages.updatedAt))
    .limit(1);

  const [schema] = page
    ? await db
        .select()
        .from(schemaOutputs)
        .where(eq(schemaOutputs.generatedPageId, page.id))
        .orderBy(desc(schemaOutputs.createdAt))
        .limit(1)
    : [undefined];

  const checks = page
    ? await db
        .select()
        .from(crawlerChecks)
        .where(eq(crawlerChecks.generatedPageId, page.id))
        .orderBy(desc(crawlerChecks.createdAt))
        .limit(3)
    : [];

  const taxonomy = await resolveTaxonomy(location.profile);
  const pageUrl = getPublicPageUrl(locationId);
  const llmsTxt = buildLlmsTxt({
    profile: location.profile,
    pageUrl,
    serviceNames: taxonomy.serviceNames,
    categoryName: taxonomy.categoryName,
  });

  return {
    locationId: location.id,
    locationName: location.name,
    score,
    page: page ?? null,
    schema: schema ?? null,
    crawlerChecks: checks,
    publicPageUrl: pageUrl,
    llmsTxt,
    schemaOrgType: taxonomy.schemaOrgType,
  };
}

export async function generateVisibilityPageAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  const location = await assertLocationInOrg(locationId, orgId);
  const db = getDb();
  const now = new Date();

  const taxonomy = await resolveTaxonomy(location.profile);
  const pageUrl = getPublicPageUrl(locationId);
  const jsonLd = buildLocationJsonLd({
    profile: location.profile,
    schemaOrgType: taxonomy.schemaOrgType,
    pageUrl,
    serviceNames: taxonomy.serviceNames,
  });

  const htmlContent = buildLocationPageHtml({
    profile: location.profile,
    jsonLd,
    serviceNames: taxonomy.serviceNames,
    categoryName: taxonomy.categoryName,
  });

  const [existingPage] = await db
    .select()
    .from(generatedPages)
    .where(eq(generatedPages.locationId, locationId))
    .orderBy(desc(generatedPages.updatedAt))
    .limit(1);

  let pageId: string;

  if (existingPage) {
    const [updated] = await db
      .update(generatedPages)
      .set({
        title: location.profile.name,
        htmlContent,
        status: existingPage.status === "published" ? "published" : "draft",
        updatedAt: now,
      })
      .where(eq(generatedPages.id, existingPage.id))
      .returning();

    pageId = updated!.id;
  } else {
    const [created] = await db
      .insert(generatedPages)
      .values({
        locationId,
        slug: location.slug,
        title: location.profile.name,
        htmlContent,
        status: "draft",
      })
      .returning();

    pageId = created!.id;
  }

  await db.insert(schemaOutputs).values({
    locationId,
    generatedPageId: pageId,
    schemaType: taxonomy.schemaOrgType,
    jsonLd,
  });

  revalidatePath(`/dashboard/locations/${locationId}/visibility`);
  revalidatePath("/dashboard");
  revalidatePath(`/l/${locationId}`);

  return { pageId, pageUrl };
}

export async function publishVisibilityPageAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const [page] = await db
    .select()
    .from(generatedPages)
    .where(eq(generatedPages.locationId, locationId))
    .orderBy(desc(generatedPages.updatedAt))
    .limit(1);

  if (!page?.htmlContent) {
    throw new Error("Generate the AI visibility page first");
  }

  await db
    .update(generatedPages)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(generatedPages.id, page.id));

  const publicUrl = getPublicPageUrl(locationId);
  const llmsUrl = `${publicUrl}/llms.txt`;
  const indexNow = await submitIndexNow([publicUrl, llmsUrl]);

  revalidatePath(`/dashboard/locations/${locationId}/visibility`);
  revalidatePath("/dashboard");
  revalidatePath(`/l/${locationId}`);

  return { publicUrl, indexNow };
}

export async function runVisibilityCrawlerCheckAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const [page] = await db
    .select()
    .from(generatedPages)
    .where(
      and(
        eq(generatedPages.locationId, locationId),
        eq(generatedPages.status, "published"),
      ),
    )
    .orderBy(desc(generatedPages.updatedAt))
    .limit(1);

  if (!page) {
    throw new Error("Publish the visibility page before running a crawler check");
  }

  const pageUrl = getPublicPageUrl(locationId);
  const result = await runCrawlerCheck(pageUrl);

  const [check] = await db
    .insert(crawlerChecks)
    .values({
      locationId,
      generatedPageId: page.id,
      status: result.ok ? "passed" : "failed",
      targetUrl: pageUrl,
      results: result,
      checkedAt: new Date(),
    })
    .returning();

  revalidatePath(`/dashboard/locations/${locationId}/visibility`);

  return { check, result };
}

export async function getOrgVisibilitySummaryAction(): Promise<{
  averageScore: number;
  hasPublishedPage: boolean;
  hasGeneratedPage: boolean;
  locations: Array<{
    id: string;
    name: string;
    score: VisibilityScoreBreakdown;
    pageStatus: "draft" | "published" | "archived" | null;
  }>;
}> {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const orgLocations = await db
    .select()
    .from(locations)
    .where(eq(locations.organizationId, orgId))
    .orderBy(desc(locations.updatedAt));

  const locationIds = orgLocations.map((location) => location.id);

  const pages =
    locationIds.length > 0
      ? await db
          .select({
            locationId: generatedPages.locationId,
            status: generatedPages.status,
          })
          .from(generatedPages)
          .where(inArray(generatedPages.locationId, locationIds))
      : [];

  const pageByLocation = new Map<string, "draft" | "published" | "archived">();
  for (const page of pages) {
    const existing = pageByLocation.get(page.locationId);
    if (!existing || page.status === "published") {
      pageByLocation.set(page.locationId, page.status);
    }
  }

  const scored = await Promise.all(
    orgLocations.map(async (location) => {
      const audit = await getAuditCounts(location.id);
      return {
        id: location.id,
        name: location.name,
        pageStatus: pageByLocation.get(location.id) ?? null,
        score: computeVisibilityScore({
          profile: location.profile,
          audit: audit.runs > 0 ? audit : undefined,
        }),
      };
    }),
  );

  const averageScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, item) => sum + item.score.total, 0) / scored.length,
        )
      : 0;

  return {
    averageScore,
    hasPublishedPage: scored.some((item) => item.pageStatus === "published"),
    hasGeneratedPage: scored.some((item) => item.pageStatus !== null),
    locations: scored,
  };
}

export async function getPublishedPageAction(locationId: string) {
  const db = getDb();

  const [page] = await db
    .select()
    .from(generatedPages)
    .where(
      and(
        eq(generatedPages.locationId, locationId),
        eq(generatedPages.status, "published"),
      ),
    )
    .orderBy(desc(generatedPages.updatedAt))
    .limit(1);

  return page ?? null;
}

export async function getPublishedVisibilityContextAction(locationId: string) {
  const db = getDb();

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  if (!location) {
    return null;
  }

  const page = await getPublishedPageAction(locationId);
  if (!page?.htmlContent) {
    return null;
  }

  const taxonomy = await resolveTaxonomy(location.profile);

  return {
    location,
    page,
    taxonomy,
    pageUrl: getPublicPageUrl(locationId),
  };
}
