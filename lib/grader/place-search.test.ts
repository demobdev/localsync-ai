import { describe, expect, it } from "vitest";

import { scorePlaceMatch } from "@/lib/grader/place-search";

describe("Google place match confidence", () => {
  it("does not promote a generic one-word prefix as a strong business match", () => {
    expect(scorePlaceMatch("Gift a story", "The Gift")).toBeLessThan(50);
  });

  it("keeps exact and article-only brand matches strong", () => {
    expect(scorePlaceMatch("The Owners Box", "The Owners Box")).toBe(100);
    expect(scorePlaceMatch("Owners Box", "The Owners Box")).toBeGreaterThanOrEqual(
      85,
    );
  });
});
