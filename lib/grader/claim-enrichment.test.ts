import { describe, expect, it } from "vitest";

import {
  matchExtractedServicesToSlugs,
  parseHoursSummaryToRegularHours,
} from "@/lib/grader/claim-enrichment";

describe("parseHoursSummaryToRegularHours", () => {
  it("parses Mon-Fri ranges", () => {
    const hours = parseHoursSummaryToRegularHours("Mon-Fri 9:00 AM - 5:00 PM");
    expect(hours.monday).toEqual({ open: "09:00", close: "17:00" });
    expect(hours.friday).toEqual({ open: "09:00", close: "17:00" });
    expect(hours.saturday).toBeUndefined();
  });
});

describe("matchExtractedServicesToSlugs", () => {
  it("matches extracted names within category", () => {
    const slugs = matchExtractedServicesToSlugs({
      extractedServices: ["AC repair", "Heating repair"],
      taxonomyServices: [
        {
          slug: "ac-repair",
          name: "AC repair",
          categorySlug: "hvac",
        },
        {
          slug: "heating-repair",
          name: "Heating repair",
          categorySlug: "hvac",
        },
      ],
      categorySlug: "hvac",
    });
    expect(slugs).toEqual(["ac-repair", "heating-repair"]);
  });
});
