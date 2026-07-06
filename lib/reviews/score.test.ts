import { describe, expect, it } from "vitest";

import { computeReviewScore } from "./score";

describe("computeReviewScore", () => {
  it("returns zeros when there are no reviews", () => {
    expect(computeReviewScore([])).toEqual({
      averageRating: null,
      responseRate: 0,
      unrepliedCount: 0,
      totalCount: 0,
      score: 0,
    });
  });

  it("weights rating and response rate equally", () => {
    const result = computeReviewScore([
      { rating: 5, replyStatus: "replied" },
      { rating: 5, replyStatus: "unreplied" },
    ]);

    expect(result.averageRating).toBe(5);
    expect(result.responseRate).toBe(50);
    expect(result.unrepliedCount).toBe(1);
    expect(result.score).toBe(75);
  });
});
