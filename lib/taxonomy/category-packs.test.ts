import { describe, expect, it } from "vitest";

import { applyCategoryPackToProfile } from "./category-packs";

describe("applyCategoryPackToProfile", () => {
  it("preloads services and description for internet SaaS", () => {
    const result = applyCategoryPackToProfile({
      categorySlug: "internet-saas",
      businessName: "LocalSync",
      profile: { serviceSlugs: [] },
    });

    expect(result.serviceSlugs).toContain("local-seo-software");
    expect(result.description).toContain("LocalSync");
  });

  it("does not overwrite existing services", () => {
    const result = applyCategoryPackToProfile({
      categorySlug: "hvac",
      businessName: "Acme HVAC",
      profile: {
        serviceSlugs: ["ac-repair"],
        description: "Custom copy",
      },
    });

    expect(result.serviceSlugs).toEqual(["ac-repair"]);
    expect(result.description).toBe("Custom copy");
  });
});
