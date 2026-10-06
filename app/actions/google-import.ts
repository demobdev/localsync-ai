"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  locationPublishers,
  locationVersions,
  locations,
  publishers,
} from "@/db/schema";
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
  googleLocationName,
  googleReviewParent,
} from "@/lib/connectors/google-resource-names";
import { verifyGoogleProfile } from "@/lib/connectors/google-profile-diff";
import { patchGbpLocationSafe } from "@/lib/connectors/google-write";
import { getWorkspacePlan } from "@/lib/billing/plans";
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
      console.warn("[google-import] GBP API rate or quota limit reached");
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
  if (diff.length > 0) {
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
  }

  const verification = verifyGoogleProfile(nextProfile, input.gbpLocation);

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
          externalId:
            googleReviewParent(
              input.gbpLocation.gbpName,
              input.gbpLocation.gbpAccountName,
            ) ?? input.gbpLocation.gbpName,
          listingUrl: input.gbpLocation.mapsUri ?? null,
          status: verification.verified ? "synced" : "pending",
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(locationPublishers.id, existingLink.id));
    } else {
      await db.insert(locationPublishers).values({
        locationId: location.id,
        publisherId: googlePublisher.id,
        externalId:
          googleReviewParent(
            input.gbpLocation.gbpName,
            input.gbpLocation.gbpAccountName,
          ) ?? input.gbpLocation.gbpName,
        listingUrl: input.gbpLocation.mapsUri ?? null,
        status: verification.verified ? "synced" : "pending",
        lastCheckedAt: new Date(),
      });
    }
  }

  revalidatePath(`/dashboard/locations/${location.id}`);
  revalidatePath("/dashboard/connect/google");
  revalidatePath("/dashboard/connect");
  revalidatePath("/dashboard/import/google");
  revalidatePath("/dashboard/locations");
  revalidatePath(`/dashboard/locations/${location.id}/listings`);

  return {
    changed: diff.length > 0,
    fieldCount: diff.length,
    verified: verification.verified,
    listingVerified: verification.listingVerified,
    mismatchedFields: verification.mismatchedFields,
  };
}

export async function pushGbpFieldsAction(input: {
  locationId: string;
  fields: GbpFieldKey[];
  gbpName?: string;
}) {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const workspace = await getWorkspacePlan();
  if (!workspace.features.apiSync) {
    throw new Error(
      "API listing sync is a Premium feature. Upgrade at /dashboard/billing to push changes to Google automatically.",
    );
  }

  if (input.fields.length === 0) {
    throw new Error("Select at least one field to push");
  }

  const [location] = await db
    .select()
    .from(locations)
    .where(
      and(
        eq(locations.id, input.locationId),
        eq(locations.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!location) {
    throw new Error("Location not found");
  }

  const [googlePublisher] = await db
    .select({ id: publishers.id })
    .from(publishers)
    .where(eq(publishers.slug, "google-business-profile"))
    .limit(1);

  if (!googlePublisher) {
    throw new Error("Google Business Profile publisher is not configured");
  }

  const [link] = await db
    .select({
      id: locationPublishers.id,
      externalId: locationPublishers.externalId,
    })
    .from(locationPublishers)
    .where(
      and(
        eq(locationPublishers.locationId, location.id),
        eq(locationPublishers.publisherId, googlePublisher.id),
      ),
    )
    .limit(1);

  const accessToken = await getValidGoogleAccessToken(orgId);

  if (!accessToken) {
    throw new Error("Google is not connected. Reconnect from Connections.");
  }

  const targetExternalId = input.gbpName ?? link?.externalId;

  if (!targetExternalId) {
    throw new Error("Choose the Google listing to update first.");
  }

  const targetLocationName = googleLocationName(targetExternalId);
  if (!targetLocationName)
    throw new Error("Invalid Google location link. Re-import this location.");

  if (
    !link?.externalId ||
    googleLocationName(link.externalId) !== targetLocationName
  ) {
    const authorized = await fetchGbpLocationsSafe(accessToken);
    const authorizedMatch = authorized.ok
      ? authorized.locations.some(
          (publisherLocation) =>
            publisherLocation.gbpName === targetLocationName,
        )
      : false;

    if (!authorizedMatch) {
      throw new Error(
        "LocalMap could not confirm that the connected Google account manages this listing.",
      );
    }
  }

  const result = await patchGbpLocationSafe(
    accessToken,
    targetExternalId,
    location.profile,
    input.fields,
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const refreshed = await fetchGbpLocationsSafe(accessToken);
  const verifiedLocation = refreshed.ok
    ? refreshed.locations.find(
        (publisherLocation) => publisherLocation.gbpName === targetLocationName,
      )
    : null;
  const verification = verifiedLocation
    ? verifyGoogleProfile(location.profile, verifiedLocation)
    : null;

  const publisherState = {
    externalId:
      (verifiedLocation &&
        googleReviewParent(
          verifiedLocation.gbpName,
          verifiedLocation.gbpAccountName,
        )) ||
      (link?.externalId &&
      googleLocationName(link.externalId) === targetLocationName
        ? link.externalId
        : targetExternalId),
    status: verification?.verified ? ("synced" as const) : ("pending" as const),
    ...(verifiedLocation
      ? {
          listingUrl: verifiedLocation.mapsUri ?? null,
          lastCheckedAt: new Date(),
        }
      : {}),
    updatedAt: new Date(),
  };

  if (link) {
    await db
      .update(locationPublishers)
      .set(publisherState)
      .where(eq(locationPublishers.id, link.id));
  } else {
    await db.insert(locationPublishers).values({
      locationId: location.id,
      publisherId: googlePublisher.id,
      ...publisherState,
    });
  }

  revalidatePath(`/dashboard/locations/${location.id}`);
  revalidatePath(`/dashboard/locations/${location.id}/listings`);
  revalidatePath("/dashboard/connect/google");
  revalidatePath("/dashboard/connect");

  return {
    pushed: true,
    fieldCount: result.updatedFields.length,
    verified: verification?.verified ?? false,
    listingVerified: verification?.listingVerified ?? false,
    mismatchedFields: verification?.mismatchedFields ?? input.fields,
  };
}
