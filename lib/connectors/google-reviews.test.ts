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

describe("Google review data contract", () => {
  it("maps ratings, review text, author, publication and reply timestamps", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      reviews: [{
        reviewId: "id-1", reviewer: { displayName: " Alice " },
        starRating: "FOUR", comment: " Helpful team ",
        createTime: "2026-09-01T12:00:00Z", updateTime: "2026-09-02T12:00:00Z",
        reviewReply: { comment: " Thank you ", updateTime: "2026-09-03T12:00:00Z" },
      }], totalReviewCount: 1, averageRating: 4,
    })));
    const result = await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123");
    expect(result).toEqual({
      ok: true,
      reviews: [{ externalId: "id-1", authorName: "Alice", rating: 4, text: "Helpful team",
        publishedAt: new Date("2026-09-01T12:00:00Z"), existingReply: "Thank you",
        replyUpdatedAt: new Date("2026-09-03T12:00:00Z") }],
      pagesFetched: 1, skipped: 0, totalReviewCount: 1, averageRating: 4,
    });
  });

  it("supports star-only and anonymous reviews without inventing timestamps", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      reviews: [{ reviewId: "id-1", starRating: "ONE", createTime: "not-a-date",
        reviewReply: { comment: "", updateTime: "invalid" } }],
    })));
    const result = await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123");
    expect(result.ok && result.reviews[0]).toEqual({
      externalId: "id-1", authorName: "Google user", rating: 1, text: "(No comment)",
      publishedAt: null, existingReply: null, replyUpdatedAt: null,
    });
  });

  it("reports skipped invalid records and deduplicates page boundaries", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ reviews: [review("1"), null,
        { reviewId: "no-rating" }, { starRating: "FIVE" }], nextPageToken: "next" }))
      .mockResolvedValueOnce(Response.json({ reviews: [review("1"), review("2")] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123");
    expect(result).toMatchObject({ ok: true, skipped: 3, pagesFetched: 2 });
    expect(result.ok && result.reviews.map((item) => item.externalId)).toEqual(["1", "2"]);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store", signal: expect.any(AbortSignal) });
  });

  it("accepts the genuine empty result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ totalReviewCount: 0 })));
    expect(await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123"))
      .toMatchObject({ ok: true, reviews: [], skipped: 0, pagesFetched: 1, totalReviewCount: 0 });
  });

  it.each([null, [], { reviews: {} }, { nextPageToken: 123 }])(
    "does not treat malformed payload %j as an empty success", async (payload) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
      expect(await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123"))
        .toMatchObject({ ok: false, error: { code: "unknown" } });
    },
  );

  it.each([
    [401, "", "unauthenticated"],
    [403, "", "permission_denied"],
    [403, JSON.stringify({ error: { details: [{ reason: "SERVICE_DISABLED" }] } }), "api_disabled"],
    [404, "", "not_found"],
    [429, "", "quota_exceeded"],
  ])("classifies HTTP %i without leaking its response", async (status, body, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
    const result = await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123");
    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(JSON.stringify(result)).not.toContain("fixture-token");
  });

  it("safely returns network/timeout errors without partial records or secrets", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ reviews: [review("1")], nextPageToken: "next" }))
      .mockRejectedValueOnce(new Error("Bearer fixture-token network failed")));
    const result = await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123");
    expect(result).toMatchObject({ ok: false, error: { code: "unknown" } });
    expect(result).not.toHaveProperty("reviews");
    expect(JSON.stringify(result)).not.toContain("fixture-token");
  });

  it("safely rejects invalid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json")));
    expect(await fetchGoogleReviewsSafe("fixture-token", "accounts/456/locations/123"))
      .toMatchObject({ ok: false, error: { code: "unknown" } });
  });
});
