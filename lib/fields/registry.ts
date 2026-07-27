import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

export type FieldGroup =
  | "identity"
  | "location"
  | "contact"
  | "taxonomy"
  | "hours"
  | "commerce"
  | "content"
  | "media";

export type FieldValueType =
  | "string"
  | "number"
  | "boolean"
  | "hours"
  | "string_array"
  | "object"
  | "photo_array";

export type ProfileFieldDefinition = {
  key: keyof LocationProfileSnapshot;
  label: string;
  group: FieldGroup;
  valueType: FieldValueType;
  /** Can be pushed through a direct publisher connector when supported. */
  syncable: boolean;
  description?: string;
};

/**
 * Canonical Master Profile field registry.
 * Source of truth for labels, grouping, and sync eligibility.
 */
export const PROFILE_FIELD_REGISTRY: readonly ProfileFieldDefinition[] = [
  {
    key: "name",
    label: "Business name",
    group: "identity",
    valueType: "string",
    syncable: true,
  },
  {
    key: "description",
    label: "Description",
    group: "content",
    valueType: "string",
    syncable: false,
  },
  {
    key: "phone",
    label: "Phone",
    group: "contact",
    valueType: "string",
    syncable: true,
  },
  {
    key: "email",
    label: "Email",
    group: "contact",
    valueType: "string",
    syncable: false,
  },
  {
    key: "website",
    label: "Website",
    group: "contact",
    valueType: "string",
    syncable: true,
  },
  {
    key: "addressLine1",
    label: "Address line 1",
    group: "location",
    valueType: "string",
    syncable: true,
  },
  {
    key: "addressLine2",
    label: "Address line 2",
    group: "location",
    valueType: "string",
    syncable: false,
  },
  {
    key: "city",
    label: "City",
    group: "location",
    valueType: "string",
    syncable: true,
  },
  {
    key: "state",
    label: "State",
    group: "location",
    valueType: "string",
    syncable: true,
  },
  {
    key: "postalCode",
    label: "Postal code",
    group: "location",
    valueType: "string",
    syncable: true,
  },
  {
    key: "country",
    label: "Country",
    group: "location",
    valueType: "string",
    syncable: false,
  },
  {
    key: "latitude",
    label: "Latitude",
    group: "location",
    valueType: "number",
    syncable: false,
  },
  {
    key: "longitude",
    label: "Longitude",
    group: "location",
    valueType: "number",
    syncable: false,
  },
  {
    key: "categorySlug",
    label: "Category",
    group: "taxonomy",
    valueType: "string",
    syncable: false,
  },
  {
    key: "serviceSlugs",
    label: "Services",
    group: "taxonomy",
    valueType: "string_array",
    syncable: false,
  },
  {
    key: "regularHours",
    label: "Regular hours",
    group: "hours",
    valueType: "hours",
    syncable: true,
  },
  {
    key: "holidayHours",
    label: "Holiday hours",
    group: "hours",
    valueType: "object",
    syncable: false,
  },
  {
    key: "attributes",
    label: "Attributes",
    group: "taxonomy",
    valueType: "object",
    syncable: false,
  },
  {
    key: "photos",
    label: "Photos",
    group: "media",
    valueType: "photo_array",
    syncable: false,
  },
  {
    key: "sameAs",
    label: "Links & profiles",
    group: "commerce",
    valueType: "string_array",
    syncable: false,
  },
  {
    key: "faqs",
    label: "FAQs",
    group: "content",
    valueType: "object",
    syncable: false,
  },
] as const;

const BY_KEY = new Map(
  PROFILE_FIELD_REGISTRY.map((field) => [field.key, field] as const),
);

export function getFieldDefinition(
  key: string,
): ProfileFieldDefinition | undefined {
  return BY_KEY.get(key as keyof LocationProfileSnapshot);
}

export function getFieldLabel(key: string): string {
  return getFieldDefinition(key)?.label ?? key;
}

export function listSyncableFieldKeys(): Array<keyof LocationProfileSnapshot> {
  return PROFILE_FIELD_REGISTRY.filter((field) => field.syncable).map(
    (field) => field.key,
  );
}

export function stringifyFieldValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}
