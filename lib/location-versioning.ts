import {
  PROFILE_FIELD_REGISTRY,
  stringifyFieldValue,
} from "@/lib/fields/registry";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

type DiffEntry = {
  field: string;
  label: string;
  before: string;
  after: string;
};

export function diffLocationProfiles(
  before: LocationProfileSnapshot,
  after: LocationProfileSnapshot,
): DiffEntry[] {
  const entries: DiffEntry[] = [];

  for (const field of PROFILE_FIELD_REGISTRY) {
    const beforeValue = stringifyFieldValue(before[field.key]);
    const afterValue = stringifyFieldValue(after[field.key]);

    if (beforeValue !== afterValue) {
      entries.push({
        field: field.key,
        label: field.label,
        before: beforeValue,
        after: afterValue,
      });
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
