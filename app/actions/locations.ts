"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  businessCategories,
  clients,
  locationPublishers,
  locationVersions,
  locations,
  publishers,
  serviceTaxonomy,
} from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import { buildClientSlug } from "@/lib/clients";
import {
  fetchCompletedAuditsForLocations,
  summarizeLocationAudit,
  type LocationAuditSummary,
} from "@/lib/grader/client-audit-summaries";
import {
  diffLocationProfiles,
  summarizeProfileDiff,
} from "@/lib/location-versioning";
import { uniqueSlug } from "@/lib/slugify";
import { applyCategoryPackToProfile } from "@/lib/taxonomy/category-packs";
import {
  EMPTY_LOCATION_PROFILE,
  type LocationProfileSnapshot,
} from "@/lib/types/location-profile";

async function assertClientInOrg(clientId: string, orgId: string) {
  const db = getDb();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);

  if (!client) {
    throw new Error("Client not found");
  }

  return client;
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

export async function listClientsAction() {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  return db
    .select()
    .from(clients)
    .where(eq(clients.organizationId, orgId))
    .orderBy(desc(clients.createdAt));
}

export type ClientWithLocationAudits = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  locations: LocationAuditSummary[];
};

/** Agency clients with per-location grader audit summaries. */
export async function listClientsWithLocationAuditsAction(): Promise<
  ClientWithLocationAudits[]
> {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const [clientRows, locationRows] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(eq(clients.organizationId, orgId))
      .orderBy(desc(clients.createdAt)),
    db
      .select({
        id: locations.id,
        name: locations.name,
        clientId: locations.clientId,
        profile: locations.profile,
      })
      .from(locations)
      .where(eq(locations.organizationId, orgId))
      .orderBy(desc(locations.updatedAt)),
  ]);

  const auditsByLocation = await fetchCompletedAuditsForLocations(
    locationRows.map((row) => row.id),
  );

  const locationsByClient = new Map<string, LocationAuditSummary[]>();
  for (const location of locationRows) {
    const summary = summarizeLocationAudit({
      locationId: location.id,
      locationName: location.name,
      profile: location.profile,
      auditsForLocation: auditsByLocation.get(location.id) ?? [],
    });
    const list = locationsByClient.get(location.clientId) ?? [];
    list.push(summary);
    locationsByClient.set(location.clientId, list);
  }

  return clientRows.map((client) => ({
    id: client.id,
    name: client.name,
    slug: client.slug,
    contactEmail: client.contactEmail,
    contactPhone: client.contactPhone,
    notes: client.notes,
    locations: locationsByClient.get(client.id) ?? [],
  }));
}

export async function createClientAction(input: {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}) {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const baseSlug = buildClientSlug(input.name);
  const slug = uniqueSlug(baseSlug, crypto.randomUUID().slice(0, 6));

  const [client] = await db
    .insert(clients)
    .values({
      organizationId: orgId,
      name: input.name.trim(),
      slug,
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .returning();

  revalidatePath("/dashboard/clients");
  return client;
}

export async function listLocationsAction(clientId?: string) {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const conditions = [eq(locations.organizationId, orgId)];

  if (clientId) {
    conditions.push(eq(locations.clientId, clientId));
  }

  return db
    .select({
      id: locations.id,
      name: locations.name,
      slug: locations.slug,
      clientId: locations.clientId,
      profile: locations.profile,
      updatedAt: locations.updatedAt,
      clientName: clients.name,
    })
    .from(locations)
    .innerJoin(clients, eq(clients.id, locations.clientId))
    .where(and(...conditions))
    .orderBy(desc(locations.updatedAt));
}

export async function getLocationAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  return location ?? null;
}

export async function createLocationAction(input: {
  clientId: string;
  name: string;
  city?: string;
  categorySlug?: string;
}) {
  const { orgId, userId } = await requireOrgAuth();
  await assertClientInOrg(input.clientId, orgId);
  const db = getDb();

  const categorySlug = input.categorySlug ?? "internet-saas";

  const profileBase: LocationProfileSnapshot = {
    ...EMPTY_LOCATION_PROFILE,
    name: input.name.trim(),
    city: input.city?.trim(),
    categorySlug,
    serviceSlugs: [],
  };

  const packed = applyCategoryPackToProfile({
    categorySlug,
    businessName: input.name.trim(),
    profile: profileBase,
  });

  const profile: LocationProfileSnapshot = {
    ...profileBase,
    description: packed.description,
    serviceSlugs: packed.serviceSlugs,
  };

  const slug = uniqueSlug(input.name, input.city ?? crypto.randomUUID().slice(0, 6));

  const [location] = await db
    .insert(locations)
    .values({
      organizationId: orgId,
      clientId: input.clientId,
      name: input.name.trim(),
      slug,
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
      actorUserId: userId,
      changeSummary: "Initial profile created",
    })
    .returning();

  await db
    .update(locations)
    .set({
      currentVersionId: version?.id,
      updatedAt: new Date(),
    })
    .where(eq(locations.id, location.id));

  const allPublishers = await db.select({ id: publishers.id }).from(publishers);

  if (allPublishers.length > 0) {
    await db.insert(locationPublishers).values(
      allPublishers.map((publisher) => ({
        locationId: location.id,
        publisherId: publisher.id,
        status: "unknown" as const,
      })),
    );
  }

  revalidatePath("/dashboard/locations");
  return location;
}

export async function updateLocationProfileAction(input: {
  locationId: string;
  profile: LocationProfileSnapshot;
}) {
  const { orgId, userId } = await requireOrgAuth();
  const location = await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();

  const diff = diffLocationProfiles(location.profile, input.profile);
  const changeSummary = summarizeProfileDiff(diff);

  const latestVersion = await db
    .select({ versionNumber: locationVersions.versionNumber })
    .from(locationVersions)
    .where(eq(locationVersions.locationId, location.id))
    .orderBy(desc(locationVersions.versionNumber))
    .limit(1);

  const nextVersionNumber = (latestVersion[0]?.versionNumber ?? 0) + 1;

  const [version] = await db
    .insert(locationVersions)
    .values({
      locationId: location.id,
      versionNumber: nextVersionNumber,
      snapshot: input.profile,
      source: "user",
      actorUserId: userId,
      changeSummary,
    })
    .returning();

  const [updated] = await db
    .update(locations)
    .set({
      name: input.profile.name.trim() || location.name,
      profile: input.profile,
      currentVersionId: version?.id,
      updatedAt: new Date(),
    })
    .where(eq(locations.id, location.id))
    .returning();

  revalidatePath(`/dashboard/locations/${location.id}`);
  revalidatePath("/dashboard/locations");

  return updated;
}

export async function listLocationVersionsAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  return db
    .select()
    .from(locationVersions)
    .where(eq(locationVersions.locationId, locationId))
    .orderBy(desc(locationVersions.versionNumber));
}

export async function compareLocationVersionsAction(input: {
  locationId: string;
  fromVersionId: string;
  toVersionId: string;
}) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();

  const versions = await db
    .select()
    .from(locationVersions)
    .where(eq(locationVersions.locationId, input.locationId));

  const fromVersion = versions.find((version) => version.id === input.fromVersionId);
  const toVersion = versions.find((version) => version.id === input.toVersionId);

  if (!fromVersion || !toVersion) {
    throw new Error("Version not found");
  }

  return diffLocationProfiles(fromVersion.snapshot, toVersion.snapshot);
}

export async function deleteLocationAction(locationId: string) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(locationId, orgId);
  const db = getDb();

  await db.delete(locations).where(eq(locations.id, locationId));

  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard");
}

export async function listPublishersAction() {
  await requireOrgAuth();
  const db = getDb();

  return db.select().from(publishers).orderBy(publishers.sortOrder);
}

export async function listTaxonomyAction() {
  await requireOrgAuth();
  const db = getDb();

  const categories = await db
    .select()
    .from(businessCategories)
    .orderBy(businessCategories.sortOrder);

  const services = await db
    .select()
    .from(serviceTaxonomy)
    .orderBy(serviceTaxonomy.sortOrder);

  return { categories, services };
}
