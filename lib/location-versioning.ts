import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

type DiffEntry = {
  field: string;
  label: string;
  before: string;
  after: string;
};

const FIELD_LABELS: Record<string, string> = {
  name: "Business name",
  description: "Description",
  phone: "Phone",
  email: "Email",
  website: "Website",
  addressLine1: "Address line 1",
  addressLine2: "Address line 2",
  city: "City",
  state: "State",
  postalCode: "Postal code",
  country: "Country",
  latitude: "Latitude",
  longitude: "Longitude",
  categorySlug: "Category",
};

function stringify(value: unknown): string {
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

export function diffLocationProfiles(
  before: LocationProfileSnapshot,
  after: LocationProfileSnapshot,
): DiffEntry[] {
  const entries: DiffEntry[] = [];

  for (const [field, label] of Object.entries(FIELD_LABELS)) {
    const beforeValue = stringify(before[field as keyof LocationProfileSnapshot]);
    const afterValue = stringify(after[field as keyof LocationProfileSnapshot]);

    if (beforeValue !== afterValue) {
      entries.push({ field, label, before: beforeValue, after: afterValue });
    }
  }

  const complexFields: Array<{
    field: keyof LocationProfileSnapshot;
    label: string;
  }> = [
    { field: "serviceSlugs", label: "Services" },
    { field: "regularHours", label: "Regular hours" },
    { field: "holidayHours", label: "Holiday hours" },
    { field: "attributes", label: "Attributes" },
    { field: "photos", label: "Photos" },
    { field: "sameAs", label: "Links & profiles" },
    { field: "faqs", label: "FAQs" },
  ];

  for (const { field, label } of complexFields) {
    const beforeValue = stringify(before[field]);
    const afterValue = stringify(after[field]);

    if (beforeValue !== afterValue) {
      entries.push({ field, label, before: beforeValue, after: afterValue });
    }
  }

  return entries;
}

export function summarizeProfileDiff(entries: DiffEntry[]) {
  if (entries.length === 0) {
    return "No changes";
  }

  if (entries.length === 1) {
    return `Updated ${entries[0]?.label.toLowerCase()}`;
  }

  return `Updated ${entries.length} fields`;
}
