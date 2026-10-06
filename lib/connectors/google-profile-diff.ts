import type { GbpFieldKey, GbpLocation } from "@/lib/connectors/google";
import type {
  LocationProfileSnapshot,
  RegularHours,
} from "@/lib/types/location-profile";

const DAY_ORDER: Array<keyof RegularHours> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const GOOGLE_PROFILE_FIELD_ORDER: GbpFieldKey[] = [
  "name",
  "phone",
  "website",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "regularHours",
];

const FIELD_LABELS: Record<GbpFieldKey, string> = {
  name: "Business name",
  phone: "Phone",
  website: "Website",
  addressLine1: "Street address",
  city: "City",
  state: "State",
  postalCode: "Postal code",
  regularHours: "Regular hours",
};

export type GoogleProfileComparison = {
  field: GbpFieldKey;
  label: string;
  masterValue: string;
  googleValue: string;
  matches: boolean;
};

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePhone(value: string | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
}

function normalizeWebsite(value: string | undefined): string {
  if (!value?.trim()) return "";

  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    );
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return normalizeText(value);
  }
}

function normalizedHours(hours: RegularHours): string {
  return DAY_ORDER.map((day) => {
    const value = hours[day];
    if (!value) return `${day}:unset`;
    if (value.closed) return `${day}:closed`;
    return `${day}:${value.open}-${value.close}`;
  }).join("|");
}

export function formatRegularHours(hours: RegularHours): string {
  const configured = DAY_ORDER.flatMap((day) => {
    const value = hours[day];
    if (!value) return [];

    const label = day.slice(0, 3);
    return [
      value.closed
        ? `${label}: Closed`
        : `${label}: ${value.open}–${value.close}`,
    ];
  });

  return configured.length > 0 ? configured.join(" · ") : "Not set";
}

function displayValue(value: string | undefined): string {
  return value?.trim() || "Not set";
}

function comparisonForField(
  field: GbpFieldKey,
  master: LocationProfileSnapshot,
  google: GbpLocation,
): GoogleProfileComparison {
  if (field === "regularHours") {
    return {
      field,
      label: FIELD_LABELS[field],
      masterValue: formatRegularHours(master.regularHours),
      googleValue:
        google.hoursDisplay ?? formatRegularHours(google.regularHours),
      matches:
        !google.hoursImportWarning &&
        normalizedHours(master.regularHours) ===
          normalizedHours(google.regularHours),
    };
  }

  const masterValue = master[field];
  const googleKey = field === "name" ? "title" : field;
  const googleValue = google[googleKey];

  const normalizer =
    field === "phone"
      ? normalizePhone
      : field === "website"
        ? normalizeWebsite
        : normalizeText;

  return {
    field,
    label: FIELD_LABELS[field],
    masterValue: displayValue(masterValue),
    googleValue: displayValue(googleValue),
    matches: normalizer(masterValue) === normalizer(googleValue),
  };
}

export function compareGoogleProfile(
  master: LocationProfileSnapshot,
  google: GbpLocation,
): GoogleProfileComparison[] {
  return GOOGLE_PROFILE_FIELD_ORDER.map((field) =>
    comparisonForField(field, master, google),
  );
}

export function verifyGoogleProfile(
  master: LocationProfileSnapshot,
  google: GbpLocation,
): {
  verified: boolean;
  listingVerified: boolean;
  mismatchedFields: GbpFieldKey[];
} {
  const comparisons = compareGoogleProfile(master, google);
  const mismatchedFields = comparisons
    .filter((comparison) => !comparison.matches)
    .map((comparison) => comparison.field);
  const listingVerified = google.verification?.status === "verified";

  return {
    verified: listingVerified && mismatchedFields.length === 0,
    listingVerified,
    mismatchedFields,
  };
}
