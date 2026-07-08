"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  businessCategories,
  clients,
  graderAudits,
  locationPublishers,
  locationVersions,
  locations,
  publishers,
} from "@/db/schema";
import { upsertOrganization } from "@/lib/auth/organizations";
import type { OrganizationType } from "@/lib/auth/organizations";
import { buildClientSlug } from "@/lib/clients";
import { claimGraderAudit } from "@/lib/grader/claim";
import { isIncompleteOrganization } from "@/lib/org/onboarding-state";
import { uniqueSlug } from "@/lib/slugify";
import { applyCategoryPackToProfile } from "@/lib/taxonomy/category-packs";
import {
  EMPTY_LOCATION_PROFILE,
  type LocationProfileSnapshot,
} from "@/lib/types/location-profile";

export async function listOnboardingCategoriesAction() {
  const session = await auth();

  if (!session.userId) {
    throw new Error("Not authenticated");
  }

  const db = getDb();

  return db
    .select({
      slug: businessCategories.slug,
      name: businessCategories.name,
      vertical: businessCategories.vertical,
      description: businessCategories.description,
    })
    .from(businessCategories)
    .orderBy(businessCategories.sortOrder)
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        description: row.description ?? "",
      })),
    );
}

export type QuickSetupResult = {
  organizationId: string;
  createdOrganization: boolean;
  clientId: string;
  locationId: string;
  publishersTracked: number;
  /** Set when a grader audit was linked to the new location. */
  claimedAuditId: string | null;
};

export type CreateAgencyWorkspaceResult = {
  organizationId: string;
  organizationName: string;
};

export async function createAgencyWorkspaceAction(input: {
  agencyName: string;
}): Promise<CreateAgencyWorkspaceResult> {
  const session = await auth();

  if (!session.userId) {
    throw new Error("Not authenticated");
  }

  const agencyName = input.agencyName.trim();

  if (!agencyName) {
    throw new Error("Enter your agency name");
  }

  if (session.orgId) {
    const incomplete = await isIncompleteOrganization(session.orgId);

    if (!incomplete) {
      throw new Error("You already have an active workspace");
    }
  }

  const client = await clerkClient();
  const organization = await client.organizations.createOrganization({
    name: agencyName,
    createdBy: session.userId,
  });

  await upsertOrganization({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    imageUrl: organization.imageUrl,
    type: "agency",
  });

  return {
    organizationId: organization.id,
    organizationName: organization.name,
  };
}

export async function quickSetupBusinessAction(input: {
  businessName: string;
  categorySlug: string;
  phone?: string;
  city?: string;
  state?: string;
  website?: string;
  workspaceType?: OrganizationType;
  /** Grader audit to claim + enrich the profile from (optional). */
  auditId?: string;
}): Promise<QuickSetupResult> {
  const session = await auth();

  if (!session.userId) {
    throw new Error("Not authenticated");
  }

  const businessName = input.businessName.trim();

  if (!businessName) {
    throw new Error("Enter your business name");
  }

  const db = getDb();

  // Rich extracted data from the grader audit (crawl + Places), when linked.
  const audit = input.auditId
    ? await db.query.graderAudits.findFirst({
        where: eq(graderAudits.id, input.auditId),
        columns: { id: true, websiteUrl: true, extracted: true },
      })
    : null;

  // 1. Workspace: create a new org when none exists or setup is still incomplete.
  let organizationId = session.orgId ?? null;
  let createdOrganization = false;
  const workspaceType = input.workspaceType ?? "business";

  const needsNewWorkspace =
    !organizationId ||
    (organizationId ? await isIncompleteOrganization(organizationId) : false);

  if (needsNewWorkspace) {
    const client = await clerkClient();
    const organization = await client.organizations.createOrganization({
      name: businessName,
      createdBy: session.userId,
    });

    organizationId = organization.id;
    createdOrganization = true;

    await upsertOrganization({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      imageUrl: organization.imageUrl,
      type: workspaceType,
    });
  }

  if (!organizationId) {
    throw new Error("Failed to resolve workspace");
  }

  // 2. Client record (solo businesses mirror the business; agencies get one per end-customer).
  const [existingClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.organizationId, organizationId))
    .limit(1);

  let clientId: string;

  if (
    workspaceType === "business" &&
    existingClient &&
    existingClient.name === businessName
  ) {
    clientId = existingClient.id;
  } else {
    const [createdClient] = await db
      .insert(clients)
      .values({
        organizationId,
        name: businessName,
        slug: uniqueSlug(
          buildClientSlug(businessName),
          crypto.randomUUID().slice(0, 6),
        ),
      })
      .returning();

    if (!createdClient) {
      throw new Error("Failed to create business record");
    }

    clientId = createdClient.id;
  }

  // 3. Location + initial profile snapshot.
  const extracted = audit?.extracted ?? null;
  const profileBase: LocationProfileSnapshot = {
    ...EMPTY_LOCATION_PROFILE,
    name: businessName,
    phone: input.phone?.trim() || extracted?.phone || undefined,
    city: input.city?.trim() || extracted?.city || undefined,
    state: input.state?.trim() || extracted?.state || undefined,
    website: input.website?.trim() || audit?.websiteUrl || undefined,
    // Audit-only enrichment: the crawl found these, no extra typing needed.
    addressLine1: extracted?.address || undefined,
    latitude: extracted?.latitude ?? undefined,
    longitude: extracted?.longitude ?? undefined,
    // A real description beats the category-pack template below.
    description: extracted?.description || undefined,
    categorySlug: input.categorySlug,
    serviceSlugs: [],
  };

  const packed = applyCategoryPackToProfile({
    categorySlug: input.categorySlug,
    businessName,
    profile: profileBase,
  });

  const profile: LocationProfileSnapshot = {
    ...profileBase,
    description: profileBase.description ?? packed.description,
    serviceSlugs: packed.serviceSlugs,
  };

  const [location] = await db
    .insert(locations)
    .values({
      organizationId,
      clientId,
      name: businessName,
      slug: uniqueSlug(businessName, input.city ?? crypto.randomUUID().slice(0, 6)),
      profile,
    })
    .returning();

  if (!location) {
    throw new Error("Failed to create location");
  }

  const [version] = await db
    .insert(locationVersions)
    .values({
      locationId: location.id,
      versionNumber: 1,
      snapshot: profile,
      source: "user",
      actorUserId: session.userId,
      changeSummary: "Business created during onboarding",
    })
    .returning();

  await db
    .update(locations)
    .set({ currentVersionId: version?.id, updatedAt: new Date() })
    .where(eq(locations.id, location.id));

  // 4. Track every publisher in the registry for this location.
  const allPublishers = await db
    .select({ id: publishers.id })
    .from(publishers);

  if (allPublishers.length > 0) {
    await db.insert(locationPublishers).values(
      allPublishers.map((publisher) => ({
        locationId: location.id,
        publisherId: publisher.id,
        status: "unknown" as const,
      })),
    );
  }

  // 5. Claim the grader audit that led here, linking it to this workspace.
  let claimedAuditId: string | null = null;
  if (audit) {
    const claimed = await claimGraderAudit({
      auditId: audit.id,
      userId: session.userId,
      organizationId,
      locationId: location.id,
    });
    if (claimed) {
      claimedAuditId = audit.id;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard/clients");

  return {
    organizationId,
    createdOrganization,
    clientId,
    locationId: location.id,
    publishersTracked: allPublishers.length,
    claimedAuditId,
  };
}
