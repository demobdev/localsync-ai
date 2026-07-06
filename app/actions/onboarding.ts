"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  businessCategories,
  clients,
  locationPublishers,
  locationVersions,
  locations,
  publishers,
} from "@/db/schema";
import { upsertOrganization, getOrganization } from "@/lib/auth/organizations";
import type { OrganizationType } from "@/lib/auth/organizations";
import { buildClientSlug } from "@/lib/clients";
import {
  isIncompleteOrganization,
  isPlaceholderOrganizationName,
} from "@/lib/org/onboarding-state";
import { countOrgLocations } from "@/lib/org/locations";
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

    const client = await clerkClient();
    const organization = await client.organizations.updateOrganization(
      session.orgId,
      { name: agencyName },
    );

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

  // 1. Workspace: reuse the active org, or create one named after the business.
  let organizationId = session.orgId ?? null;
  let createdOrganization = false;
  const workspaceType = input.workspaceType ?? "business";

  if (!organizationId) {
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
  } else {
    const organization = await getOrganization(organizationId);
    const locationCount = await countOrgLocations(organizationId);

    if (
      locationCount === 0 &&
      organization &&
      isPlaceholderOrganizationName(organization.name)
    ) {
      const client = await clerkClient();
      const updated = await client.organizations.updateOrganization(
        organizationId,
        { name: businessName },
      );

      await upsertOrganization({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        imageUrl: updated.imageUrl,
        type: workspaceType,
      });
    }
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
  const profileBase: LocationProfileSnapshot = {
    ...EMPTY_LOCATION_PROFILE,
    name: businessName,
    phone: input.phone?.trim() || undefined,
    city: input.city?.trim() || undefined,
    state: input.state?.trim() || undefined,
    website: input.website?.trim() || undefined,
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
    description: packed.description,
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard/clients");

  return {
    organizationId,
    createdOrganization,
    clientId,
    locationId: location.id,
    publishersTracked: allPublishers.length,
  };
}
