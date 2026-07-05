import { describe, expect, it } from "vitest";

import {
  diffLocationProfiles,
  summarizeProfileDiff,
} from "@/lib/location-versioning";
import { slugify } from "@/lib/slugify";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

describe("slugify", () => {
  it("normalizes business names", () => {
    expect(slugify("Restore Heating & Cooling")).toBe(
      "restore-heating-cooling",
    );
  });
});

describe("location versioning", () => {
  it("detects changed fields", () => {
    const diff = diffLocationProfiles(EMPTY_LOCATION_PROFILE, {
      ...EMPTY_LOCATION_PROFILE,
      name: "Tim's HVAC",
      phone: "864-555-0100",
    });

    expect(diff.some((entry) => entry.field === "name")).toBe(true);
    expect(diff.some((entry) => entry.field === "phone")).toBe(true);
    expect(summarizeProfileDiff(diff)).toContain("2 fields");
  });
});
