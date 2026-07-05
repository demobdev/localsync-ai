"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { locationVersions, locations } from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import {
  applyGbpFields,
  fetchGbpLocations,
  getValidGoogleAccessToken,
  isGoogleConfigured,
  type GbpFieldKey,
  type GbpLocation,
} from "@/lib/connectors/google";
import {
  diffLocationProfiles,
  summarizeProfileDiff,
} from "@/lib/location-versioning";

export type GoogleImportState =
  | { status: "not_configured" }
  | { status: "not_connected" }
  | { status: "connected"; locations: GbpLocation[] };

export async function getGoogleImportStateAction(): Promise<GoogleImportState> {
  const { orgId } = await requireOrgAuth();

  if (!isGoogleConfigured()) {
    return { status: "not_configured" };
  }

  const accessToken = await getValidGoogleAccessToken(orgId);

  if (!accessToken) {
    return { status: "not_connected" };
  }

  try {
    const gbpLocations = await fetchGbpLocations(accessToken);
    return { status: "connected", locations: gbpLocations };
  } catch (error) {
    console.error("[google-import] fetch failed", error);
    return { status: "not_connected" };
  }
}

export async function importGbpFieldsAction(input: {
  targetLocationId: string;
  gbpLocation: GbpLocation;
  fields: GbpFieldKey[];
}) {
  const { orgId, userId } = await requireOrgAuth();
  const db = getDb();

  const [location] = await db
    .select()
    .from(locations)
    .where(
      and(
        eq(locations.id, input.targetLocationId),
        eq(locations.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!location) {
    throw new Error("Location not found");
  }

  if (input.fields.length === 0) {
    throw new Error("Select at least one field to import");
  }

  const nextProfile = applyGbpFields(
    location.profile,
    input.gbpLocation,
    input.fields,
  );

  const diff = diffLocationProfiles(location.profile, nextProfile);

  if (diff.length === 0) {
    return { changed: false };
  }

  const latestVersion = await db
    .select({ versionNumber: locationVersions.versionNumber })
    .from(locationVersions)
    .where(eq(locationVersions.locationId, location.id))
    .orderBy(desc(locationVersions.versionNumber))
    .limit(1);

  const [version] = await db
    .insert(locationVersions)
    .values({
      locationId: location.id,
      versionNumber: (latestVersion[0]?.versionNumber ?? 0) + 1,
      snapshot: nextProfile,
      source: "gbp_import",
      actorUserId: userId,
      changeSummary: `Google import: ${summarizeProfileDiff(diff)}`,
    })
    .returning();

  await db
    .update(locations)
    .set({
      name: nextProfile.name,
      profile: nextProfile,
      currentVersionId: version?.id,
      updatedAt: new Date(),
    })
    .where(eq(locations.id, location.id));

  revalidatePath(`/dashboard/locations/${location.id}`);
  revalidatePath("/dashboard/locations");

  return { changed: true, fieldCount: diff.length };
}
