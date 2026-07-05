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
  diffLocationProfiles,
  summarizeProfileDiff,
} from "@/lib/location-versioning";
import { uniqueSlug } from "@/lib/slugify";
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

  const profile: LocationProfileSnapshot = {
    ...EMPTY_LOCATION_PROFILE,
    name: input.name.trim(),
    city: input.city?.trim(),
    categorySlug: input.categorySlug ?? "hvac",
    serviceSlugs: [],
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
