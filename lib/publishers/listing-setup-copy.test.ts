import { describe, expect, it } from "vitest";

import {
  coreCoverage,
  listingUrlPlaceholder,
  nextUnlinkedPublishers,
} from "@/lib/publishers/listing-setup-copy";

const rows = [
  {
    id: "1",
    publisherName: "Yelp",
    publisherSlug: "yelp",
    rail: "audit_only",
    isCore: true,
  },
  {
    id: "2",
    publisherName: "Facebook",
    publisherSlug: "facebook",
    rail: "audit_only",
    isCore: true,
  },
  {
    id: "3",
    publisherName: "Angi",
    publisherSlug: "angi",
    rail: "manual",
    isCore: false,
  },
];

describe("coreCoverage", () => {
  it("counts only core linked rows", () => {
    expect(
      coreCoverage({ rows, urls: { "1": "https://yelp.com/biz/x", "2": "" } }),
    ).toEqual({ linked: 1, total: 2, percent: 50 });
  });
});

describe("nextUnlinkedPublishers", () => {
  it("returns top two unlinked core by priority", () => {
    const next = nextUnlinkedPublishers({
      rows,
      urls: {},
      prioritySlugs: ["facebook", "yelp"],
      limit: 2,
    });
    expect(next.map((r) => r.publisherSlug)).toEqual(["facebook", "yelp"]);
  });
});

describe("listingUrlPlaceholder", () => {
  it("returns example shape for yelp", () => {
    expect(listingUrlPlaceholder("yelp")).toContain("yelp.com");
  });
});
