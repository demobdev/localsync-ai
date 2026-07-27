import { describe, expect, it } from "vitest";

import {
  getFieldLabel,
  listSyncableFieldKeys,
  PROFILE_FIELD_REGISTRY,
} from "@/lib/fields/registry";

describe("profile field registry", () => {
  it("includes core NAP fields as syncable", () => {
    const syncable = new Set(listSyncableFieldKeys());
    expect(syncable.has("name")).toBe(true);
    expect(syncable.has("phone")).toBe(true);
    expect(syncable.has("website")).toBe(true);
    expect(syncable.has("regularHours")).toBe(true);
  });

  it("returns human labels", () => {
    expect(getFieldLabel("postalCode")).toBe("Postal code");
    expect(PROFILE_FIELD_REGISTRY.length).toBeGreaterThan(10);
  });
});
