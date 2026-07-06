import { computeProfileScore, computeVisibilityScore } from "@/lib/visibility/score";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";
import { describe, expect, it } from "vitest";

describe("visibility score", () => {
  it("scores a complete profile higher than an empty one", () => {
    const empty = computeProfileScore(EMPTY_LOCATION_PROFILE);
    const full = computeProfileScore({
      ...EMPTY_LOCATION_PROFILE,
      name: "Demo HVAC",
      phone: "555-0100",
      addressLine1: "123 Main St",
      city: "Austin",
      state: "TX",
      description: "Heating and cooling",
      website: "https://example.com",
      categorySlug: "hvac",
      serviceSlugs: ["ac-repair"],
      regularHours: {
        monday: { open: "08:00", close: "17:00" },
      },
    });

    expect(full.profileScore).toBeGreaterThan(empty.profileScore);
  });

  it("adds audit score when audit findings exist", () => {
    const score = computeVisibilityScore({
      profile: {
        ...EMPTY_LOCATION_PROFILE,
        name: "Demo",
      },
      audit: { runs: 1, critical: 0, warning: 1, info: 2 },
    });

    expect(score.auditScore).toBeGreaterThan(0);
    expect(score.total).toBe(score.profileScore + score.auditScore);
  });
});
