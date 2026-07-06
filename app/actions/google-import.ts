"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { locationPublishers, locationVersions, locations, publishers } from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";
import {
  applyGbpFields,
  fetchGbpLocationsSafe,
  getValidGoogleAccessToken,
  hasGoogleCredentials,
  isGoogleConfigured,
  type GbpFieldKey,
  type GbpFetchErrorCode,
  type GbpLocation,
} from "@/lib/connectors/google";
import {
  diffLocationProfiles,
  summarizeProfileDiff,
} from "@/lib/location-versioning";

export type GoogleImportState =
  | { status: "not_configured" }
  | { status: "not_connected" }
  | {
      status: "connected";
      locations: GbpLocation[];
      fetchError?: {
        code: GbpFetchErrorCode;
        message: string;
      };
    };

export async function getGoogleImportStateAction(): Promise<GoogleImportState> {
  const { orgId } = await requireOrgAuth();

  if (!isGoogleConfigured()) {
    return { status: "not_configured" };
  }

  const linked = await hasGoogleCredentials(orgId);

  if (!linked) {
    return { status: "not_connected" };
  }

  const accessToken = await getValidGoogleAccessToken(orgId);

  if (!accessToken) {
    return {
      status: "connected",
      locations: [],
      fetchError: {
        code: "unknown",
        message:
          "Google is connected but the access token could not be refreshed. Click Reconnect to authorize again.",
      },
    };
  }

  const result = await fetchGbpLocationsSafe(accessToken);

  if (!result.ok) {
    if (result.error.code === "quota_exceeded") {
      console.warn("[google-import] GBP API quota not available yet");
    } else {
      console.warn("[google-import] GBP fetch failed:", result.error.code);
    }

    return {
      status: "connected",
      locations: [],
      fetchError: result.error,
    };
  }

  return { status: "connected", locations: result.locations };
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

  const [googlePublisher] = await db
    .select({ id: publishers.id })
    .from(publishers)
    .where(eq(publishers.slug, "google-business-profile"))
    .limit(1);

  if (googlePublisher) {
    const [existingLink] = await db
      .select({ id: locationPublishers.id })
      .from(locationPublishers)
      .where(
        and(
          eq(locationPublishers.locationId, location.id),
          eq(locationPublishers.publisherId, googlePublisher.id),
        ),
      )
      .limit(1);

    if (existingLink) {
      await db
        .update(locationPublishers)
        .set({
          externalId: input.gbpLocation.gbpName,
          status: "synced",
          updatedAt: new Date(),
        })
        .where(eq(locationPublishers.id, existingLink.id));
    } else {
      await db.insert(locationPublishers).values({
        locationId: location.id,
        publisherId: googlePublisher.id,
        externalId: input.gbpLocation.gbpName,
        status: "synced",
      });
    }
  }

  revalidatePath(`/dashboard/locations/${location.id}`);
  revalidatePath("/dashboard/connect/google");
  revalidatePath("/dashboard/connect");
  revalidatePath("/dashboard/import/google");
  revalidatePath("/dashboard/locations");

  return { changed: true, fieldCount: diff.length };
}
