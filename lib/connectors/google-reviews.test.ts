import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGoogleReviewsSafe } from "./google-reviews";
import {
  googleLocationName,
  googleReviewParent,
} from "./google-resource-names";

const review = (id: string) => ({
  reviewId: id,
  starRating: "FIVE",
  comment: "Great",
});
afterEach(() => vi.unstubAllGlobals());
describe("Google review resources and pagination", () => {
  it("preserves account identity for reviews and short names for v1 writes", () => {
    const full = googleReviewParent("locations/123", "accounts/456");
    expect(full).toBe("accounts/456/locations/123");
    expect(googleLocationName(full!)).toBe("locations/123");
    expect(googleLocationName("locations/123")).toBe("locations/123");
    expect(googleReviewParent("locations/123")).toBeNull();
  });
  it("asks to re-import legacy short links without making an invalid request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchGoogleReviewsSafe("test-token", "locations/123");
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fetches all review pages using the documented v4 parent", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ reviews: [review("1")], nextPageToken: "next+/=" }),
      )
      .mockResolvedValueOnce(Response.json({ reviews: [review("2")] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchGoogleReviewsSafe(
      "test-token",
      "accounts/456/locations/123",
    );
    expect(result.ok && result.reviews.map((r) => r.externalId)).toEqual([
      "1",
      "2",
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://mybusiness.googleapis.com/v4/accounts/456/locations/123/reviews?pageSize=50",
    );
    expect(
      new URL(fetchMock.mock.calls[1][0]).searchParams.get("pageToken"),
    ).toBe("next+/=");
  });
  it("does not return partial success if a later page fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ reviews: [review("1")], nextPageToken: "next" }),
        )
        .mockResolvedValueOnce(new Response("", { status: 429 })),
    );
    expect(
      await fetchGoogleReviewsSafe("test-token", "accounts/456/locations/123"),
    ).toMatchObject({ ok: false, error: { code: "quota_exceeded" } });
  });
  it("stops repeated page tokens instead of looping forever", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () =>
        Response.json({ reviews: [], nextPageToken: "repeat" }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(
      (await fetchGoogleReviewsSafe("test-token", "accounts/456/locations/123"))
        .ok,
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
