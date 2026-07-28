import { describe, expect, it } from "vitest";

import {
  calculateWebsiteHealthScore,
  deriveSearchOpportunities,
} from "./scoring";

describe("calculateWebsiteHealthScore", () => {
  it("keeps a clean crawl at 100", () => {
    expect(calculateWebsiteHealthScore([], 10)).toBe(100);
  });

  it("normalizes issue penalties by crawl size", () => {
    const finding = {
      type: "broken_page",
      severity: "critical" as const,
      url: "https://example.com/broken",
      title: "Broken page",
    };
    expect(calculateWebsiteHealthScore([finding], 1)).toBe(82);
    expect(calculateWebsiteHealthScore([finding], 100)).toBe(98);
  });
});

describe("deriveSearchOpportunities", () => {
  it("finds striking-distance and low-CTR queries", () => {
    const result = deriveSearchOpportunities([
      {
        query: "greenville gifts",
        page: "https://example.com/gifts",
        clicks: 3,
        impressions: 640,
        ctr: 0.004,
        position: 8.4,
      },
    ]);
    expect(result.map((item) => item.type)).toEqual([
      "striking_distance",
      "low_ctr",
    ]);
  });

  it("finds query cannibalization", () => {
    const result = deriveSearchOpportunities([
      {
        query: "custom books",
        page: "https://example.com/a",
        clicks: 1,
        impressions: 30,
        ctr: 0.03,
        position: 21,
      },
      {
        query: "custom books",
        page: "https://example.com/b",
        clicks: 1,
        impressions: 30,
        ctr: 0.03,
        position: 22,
      },
    ]);
    expect(result.some((item) => item.type === "cannibalization")).toBe(true);
  });
});

