import { describe, expect, it } from "vitest";

import { TAXONOMY_CATEGORIES } from "@/db/seed/taxonomy";
import {
  CATEGORY_PACK_BY_CATEGORY,
  CATEGORY_PACKS,
} from "@/lib/verticals/category-pack-catalog";

describe("category pack catalog", () => {
  it("covers every seeded business category exactly once", () => {
    const mapped = CATEGORY_PACKS.flatMap((pack) => pack.categorySlugs);

    expect(new Set(mapped).size).toBe(mapped.length);
    expect(mapped.sort()).toEqual(
      TAXONOMY_CATEGORIES.map((category) => category.slug).sort(),
    );
  });

  it("defines a useful result contract for every pack", () => {
    for (const pack of CATEGORY_PACKS) {
      expect(pack.profileFields.length).toBeGreaterThanOrEqual(3);
      expect(pack.publishers.length).toBeGreaterThanOrEqual(3);
      expect(pack.outcome.length).toBeGreaterThan(30);

      for (const categorySlug of pack.categorySlugs) {
        expect(CATEGORY_PACK_BY_CATEGORY.get(categorySlug)?.slug).toBe(pack.slug);
      }
    }
  });

  it("does not imply direct sync for category publishers", () => {
    for (const pack of CATEGORY_PACKS) {
      expect(pack.publishers.every((publisher) => publisher.rail !== ("api" as never))).toBe(
        true,
      );
    }
  });
});
