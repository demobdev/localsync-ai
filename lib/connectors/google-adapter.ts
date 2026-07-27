import { getFieldLabel, stringifyFieldValue } from "@/lib/fields/registry";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

import {
  fetchGbpLocationsSafe,
  getValidGoogleAccessToken,
  type GbpFieldKey,
  type GbpLocation,
} from "./google";
import { patchGbpLocationSafe } from "./google-write";
import type {
  PublisherConnector,
  PublisherFieldDefinition,
  PublisherFieldUpdate,
  PublisherJob,
  PublisherListing,
  PublisherLocation,
} from "./types";

const GOOGLE_WRITABLE_FIELDS: GbpFieldKey[] = [
  "name",
  "phone",
  "website",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "regularHours",
];

function gbpToPublisherLocation(location: GbpLocation): PublisherLocation {
  return {
    externalId: location.gbpName,
    title: location.title,
    listingUrl: location.mapsUri,
    addressLine1: location.addressLine1,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    phone: location.phone,
    website: location.website,
  };
}

function gbpToProfilePartial(
  location: GbpLocation,
): Partial<LocationProfileSnapshot> {
  return {
    name: location.title,
    phone: location.phone,
    website: location.website,
    addressLine1: location.addressLine1,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    regularHours: location.regularHours,
  };
}

function asGbpFieldKeys(changes: PublisherFieldUpdate[]): GbpFieldKey[] {
  const allowed = new Set<string>(GOOGLE_WRITABLE_FIELDS);
  return changes
    .map((change) => change.fieldKey)
    .filter((key): key is GbpFieldKey => allowed.has(key));
}

export const googlePublisherConnector: PublisherConnector = {
  publisherSlug: "google-business-profile",
  capabilities: [
    "connect",
    "refresh_auth",
    "list_authorized_locations",
    "get_listing",
    "update_listing",
    "verify_listing",
  ],

  async getSupportedFields(): Promise<PublisherFieldDefinition[]> {
    return GOOGLE_WRITABLE_FIELDS.map((fieldKey) => ({
      fieldKey,
      label: getFieldLabel(fieldKey),
      required: fieldKey === "name",
      writable: true,
    }));
  },

  async listAuthorizedLocations(input) {
    const accessToken = await getValidGoogleAccessToken(input.organizationId);
    if (!accessToken) {
      throw new Error("Google is not connected. Reconnect from Connections.");
    }

    const result = await fetchGbpLocationsSafe(accessToken);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.locations.map(gbpToPublisherLocation);
  },

  async getListing(input): Promise<PublisherListing> {
    const accessToken = await getValidGoogleAccessToken(input.organizationId);
    if (!accessToken) {
      throw new Error("Google is not connected. Reconnect from Connections.");
    }

    const result = await fetchGbpLocationsSafe(accessToken);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    const match = result.locations.find(
      (location) => location.gbpName === input.listingId,
    );

    if (!match) {
      throw new Error("Google listing not found for this account.");
    }

    return {
      ...gbpToPublisherLocation(match),
      fields: gbpToProfilePartial(match),
    };
  },

  async updateListing(input): Promise<PublisherJob> {
    const accessToken = await getValidGoogleAccessToken(input.organizationId);
    if (!accessToken) {
      return {
        status: "failed",
        message: "Google is not connected. Reconnect from Connections.",
      };
    }

    const fields = asGbpFieldKeys(input.changes);
    if (fields.length === 0) {
      return {
        status: "failed",
        message: "No Google-supported fields selected for update.",
      };
    }

    const result = await patchGbpLocationSafe(
      accessToken,
      input.listingId,
      input.profile,
      fields,
    );

    if (!result.ok) {
      return {
        status: "rejected",
        message: result.error.message,
        raw: { code: result.error.code },
      };
    }

    return {
      status: "accepted",
      updatedFields: result.updatedFields,
      message:
        "Google accepted the update. Verification is required before Live and synced.",
    };
  },

  async verifyListing(input) {
    const listing = await this.getListing?.({
      organizationId: input.organizationId,
      listingId: input.listingId,
    });

    if (!listing) {
      return {
        verified: false,
        matchedFields: [],
        mismatchedFields: input.fieldKeys.map((fieldKey) => ({
          fieldKey,
          expected: stringifyFieldValue(
            input.profile[fieldKey as keyof LocationProfileSnapshot],
          ),
          actual: "",
        })),
      };
    }

    const matchedFields: string[] = [];
    const mismatchedFields: Array<{
      fieldKey: string;
      expected: string;
      actual: string;
    }> = [];

    for (const fieldKey of input.fieldKeys) {
      const expected = stringifyFieldValue(
        input.profile[fieldKey as keyof LocationProfileSnapshot],
      );
      const actual = stringifyFieldValue(
        listing.fields[fieldKey as keyof LocationProfileSnapshot],
      );

      if (!expected) {
        continue;
      }

      if (expected === actual) {
        matchedFields.push(fieldKey);
      } else {
        mismatchedFields.push({ fieldKey, expected, actual });
      }
    }

    return {
      verified: mismatchedFields.length === 0 && matchedFields.length > 0,
      matchedFields,
      mismatchedFields,
    };
  },
};

export function getConnectorBySlug(
  publisherSlug: string,
): PublisherConnector | null {
  if (publisherSlug === googlePublisherConnector.publisherSlug) {
    return googlePublisherConnector;
  }

  return null;
}
