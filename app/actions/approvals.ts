"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  approvalRequests,
  businessCategories,
  locationVersions,
  locations,
  serviceTaxonomy,
} from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import {
  diffLocationProfiles,
  summarizeProfileDiff,
} from "@/lib/location-versioning";
import type { LocationFaq, LocationProfileSnapshot } from "@/lib/types/location-profile";
import { getGraderAuditForLocation } from "@/lib/grader/location-audit-bridge";
import { extractKeywordOpportunities } from "@/lib/grader/seed-tasks-from-audit";
import { generateFaqDrafts } from "@/lib/visibility/faq-generate";

import { generateVisibilityPageAction } from "./visibility";

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

export type FaqApprovalRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  faqs: LocationFaq[];
  createdAt: Date;
};

export async function listPendingFaqApprovalsAction(
  locationId: string,
): Promise<FaqApprovalRequest[]> {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const rows = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.locationId, locationId),
        eq(approvalRequests.organizationId, orgId),
        eq(approvalRequests.requestType, "faq_draft"),
        eq(approvalRequests.status, "pending"),
      ),
    )
    .orderBy(desc(approvalRequests.createdAt));

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    faqs: (row.payload.faqs as LocationFaq[]) ?? [],
    createdAt: row.createdAt,
  }));
}

export async function generateFaqDraftAction(locationId: string) {
  const { orgId, userId } = await requireOrgAuth();
  const location = await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const [existingPending] = await db
    .select({ id: approvalRequests.id })
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.locationId, locationId),
        eq(approvalRequests.requestType, "faq_draft"),
        eq(approvalRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (existingPending) {
    throw new Error("Approve or reject the pending FAQ draft first");
  }

  const [category] = location.profile.categorySlug
    ? await db
        .select()
        .from(businessCategories)
        .where(eq(businessCategories.slug, location.profile.categorySlug))
        .limit(1)
    : [undefined];

  const services =
    location.profile.serviceSlugs.length > 0
      ? await db
          .select({ name: serviceTaxonomy.name })
          .from(serviceTaxonomy)
          .where(inArray(serviceTaxonomy.slug, location.profile.serviceSlugs))
      : [];

  const linkedAudit = await getGraderAuditForLocation(locationId);
  const keywordOpportunities = linkedAudit?.keywords
    ? extractKeywordOpportunities(linkedAudit.keywords)
    : undefined;

  const faqs = await generateFaqDrafts({
    profile: location.profile,
    categoryName: category?.name,
    serviceNames: services.map((service) => service.name),
    keywordOpportunities,
  });

  const [request] = await db
    .insert(approvalRequests)
    .values({
      organizationId: orgId,
      locationId,
      requestType: "faq_draft",
      payload: { faqs },
      requestedByUserId: userId,
    })
    .returning();

  revalidatePath(`/dashboard/locations/${locationId}/visibility`);

  return { requestId: request!.id, faqs };
}

async function applyProfileUpdate(
  locationId: string,
  orgId: string,
  userId: string,
  nextProfile: LocationProfileSnapshot,
  changeSummary: string,
) {
  const db = getDb();
  const location = await assertLocationInOrg(locationId, orgId);

  const [latestVersion] = await db
    .select({ versionNumber: locationVersions.versionNumber })
    .from(locationVersions)
    .where(eq(locationVersions.locationId, locationId))
    .orderBy(desc(locationVersions.versionNumber))
    .limit(1);

  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  const [version] = await db
    .insert(locationVersions)
    .values({
      locationId,
      versionNumber: nextVersionNumber,
      snapshot: nextProfile,
      source: "user",
      actorUserId: userId,
      changeSummary,
    })
    .returning();

  await db
    .update(locations)
    .set({
      name: nextProfile.name.trim() || location.name,
      profile: nextProfile,
      currentVersionId: version?.id,
      updatedAt: new Date(),
    })
    .where(eq(locations.id, locationId));
}

export async function approveFaqDraftAction(requestId: string) {
  const { orgId, userId } = await requireOrgAuth();
  const db = getDb();

  const [request] = await db
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.id, requestId),
        eq(approvalRequests.organizationId, orgId),
        eq(approvalRequests.requestType, "faq_draft"),
        eq(approvalRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    throw new Error("FAQ draft not found or already reviewed");
  }

  const location = await assertLocationInOrg(request.locationId, orgId);
  const draftFaqs = (request.payload.faqs as LocationFaq[]) ?? [];
  const existingFaqs = location.profile.faqs ?? [];

  const mergedFaqs = [...existingFaqs];
  for (const faq of draftFaqs) {
    if (!mergedFaqs.some((item) => item.question === faq.question)) {
      mergedFaqs.push(faq);
    }
  }

  const nextProfile: LocationProfileSnapshot = {
    ...location.profile,
    faqs: mergedFaqs,
  };

  const diff = diffLocationProfiles(location.profile, nextProfile);
  await applyProfileUpdate(
    request.locationId,
    orgId,
    userId,
    nextProfile,
    summarizeProfileDiff(diff) || "Approved FAQ drafts",
  );

  await db
    .update(approvalRequests)
    .set({
      status: "approved",
      reviewedByUserId: userId,
      reviewedAt: new Date(),
    })
    .where(eq(approvalRequests.id, requestId));

  await generateVisibilityPageAction(request.locationId);

  revalidatePath(`/dashboard/locations/${request.locationId}/visibility`);
  revalidatePath("/dashboard");

  return { faqCount: mergedFaqs.length };
}

export async function rejectFaqDraftAction(requestId: string) {
  const { orgId, userId } = await requireOrgAuth();
  const db = getDb();

  const [request] = await db
    .select({ id: approvalRequests.id, locationId: approvalRequests.locationId })
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.id, requestId),
        eq(approvalRequests.organizationId, orgId),
        eq(approvalRequests.requestType, "faq_draft"),
        eq(approvalRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    throw new Error("FAQ draft not found or already reviewed");
  }

  await db
    .update(approvalRequests)
    .set({
      status: "rejected",
      reviewedByUserId: userId,
      reviewedAt: new Date(),
    })
    .where(eq(approvalRequests.id, requestId));

  revalidatePath(`/dashboard/locations/${request.locationId}/visibility`);
}
