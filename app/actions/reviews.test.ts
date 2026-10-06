import { PgDialect } from "drizzle-orm/pg-core";
import type { GoogleReviewRecord } from "@/lib/connectors/google-reviews";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(), update: vi.fn(), insert: vi.fn(), set: vi.fn(),
  updateWhere: vi.fn(), values: vi.fn(), selectWhere: vi.fn(),
  auth: vi.fn(), token: vi.fn(), fetchReviews: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/db", () => ({ getDb: () => mocks }));
vi.mock("@/lib/auth/org", () => ({ requireOrgAuth: mocks.auth }));
vi.mock("@/lib/billing/plans", () => ({ getWorkspacePlan: vi.fn() }));
vi.mock("@/lib/connectors/google", () => ({ getValidGoogleAccessToken: mocks.token }));
vi.mock("@/lib/connectors/google-reviews", () => ({ fetchGoogleReviewsSafe: mocks.fetchReviews }));
vi.mock("@/lib/reviews/reply-generate", () => ({ generateReviewReplyDraft: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { syncGoogleReviewsAction } from "./reviews";

const incoming: GoogleReviewRecord = {
  externalId: "review-1", authorName: "Google author", rating: 5,
  text: "Excellent", publishedAt: new Date("2026-10-01T10:00:00Z"),
  existingReply: "Thanks", replyUpdatedAt: new Date("2026-10-02T10:00:00Z"),
};
const existing = {
  id: "row-1", organizationId: "org-1", locationId: "location-1", source: "google",
  externalId: "review-1", authorName: "Google author", rating: 5,
  text: "Excellent", publishedAt: incoming.publishedAt,
  replyText: "Thanks", replyStatus: "replied", replyPostedAt: incoming.replyUpdatedAt,
};
const fetched = (reviews = [incoming]) => ({
  ok: true, reviews, skipped: 0, pagesFetched: 1,
  totalReviewCount: reviews.length, averageRating: reviews.length ? 5 : null,
});
const location = [{ id: "location-1" }];
const link = [{ externalId: "accounts/123/locations/456" }];
function queries(...results: unknown[][]) {
  for (const rows of results) {
    mocks.select.mockImplementationOnce(() => {
      const query = {
        from: () => query,
        innerJoin: () => query,
        where: (condition: unknown) => { mocks.selectWhere(condition); return query; },
        limit: async () => rows,
        then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
      };
      return query;
    });
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ orgId: "org-1", userId: "user-1" });
  mocks.token.mockResolvedValue("fixture-access-token");
  mocks.fetchReviews.mockResolvedValue(fetched());
  mocks.updateWhere.mockResolvedValue(undefined);
  mocks.set.mockReturnValue({ where: mocks.updateWhere });
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.values.mockResolvedValue(undefined);
  mocks.insert.mockReturnValue({ values: mocks.values });
});

describe("Google review sync action", () => {
  it("requires organization ownership before credentials or Google reads", async () => {
    queries([]);
    await expect(syncGoogleReviewsAction("location-1")).rejects.toThrow("Location not found");
    expect(mocks.token).not.toHaveBeenCalled();
    expect(mocks.fetchReviews).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it.each([{ badLink: [] }, { badLink: [{ externalId: "locations/456" }] }])(
    "returns link repair guidance without touching credentials for %j", async ({ badLink }) => {
      queries(location, badLink);
      expect(await syncGoogleReviewsAction("location-1")).toMatchObject({ ok: false, error: expect.stringContaining("Connect") });
      expect(mocks.token).not.toHaveBeenCalled();
      expect(mocks.fetchReviews).not.toHaveBeenCalled();
    },
  );

  it("returns reconnect guidance for missing credentials", async () => {
    queries(location, link);
    mocks.token.mockResolvedValue(null);
    expect(await syncGoogleReviewsAction("location-1")).toEqual({ ok: false, error: "Google is not connected. Link your account in Connect." });
    expect(mocks.fetchReviews).not.toHaveBeenCalled();
  });

  it("does not expose credential refresh errors", async () => {
    queries(location, link);
    mocks.token.mockRejectedValue(new Error("private credential details"));
    const result = await syncGoogleReviewsAction("location-1");
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain("private credential");
    expect(mocks.fetchReviews).not.toHaveBeenCalled();
  });

  it("returns expected Google failure text and makes no partial database writes", async () => {
    queries(location, link);
    mocks.fetchReviews.mockResolvedValue({ ok: false, error: { code: "api_disabled", message: "Enable the required API." } });
    expect(await syncGoogleReviewsAction("location-1")).toEqual({ ok: false, error: "Enable the required API." });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("inserts real Google provenance and the upstream reply timestamp, then refreshes views", async () => {
    queries(location, link, [], []);
    expect(await syncGoogleReviewsAction("location-1")).toMatchObject({ ok: true, source: "google", inserted: 1, updated: 0, unchanged: 0, total: 1 });
    expect(mocks.values).toHaveBeenCalledWith({
      organizationId: "org-1", locationId: "location-1", source: "google", externalId: "review-1",
      authorName: "Google author", rating: 5, text: "Excellent", publishedAt: incoming.publishedAt,
      replyText: "Thanks", replyStatus: "replied", replyPostedAt: incoming.replyUpdatedAt,
    });
    const dialect = new PgDialect();
    const filters = mocks.selectWhere.mock.calls.map(([sql]) => dialect.sqlToQuery(sql).params);
    expect(filters).toContainEqual(["org-1", "location-1", "google", "review-1"]);
    expect(mocks.revalidate.mock.calls).toEqual([["/dashboard/locations/location-1/reviews"], ["/dashboard"]]);
  });

  it("reports a genuine empty sync without seeding demo data or deleting saved reviews", async () => {
    queries(location, link);
    mocks.fetchReviews.mockResolvedValue(fetched([]));
    expect(await syncGoogleReviewsAction("location-1")).toMatchObject({ ok: true, total: 0, inserted: 0, updated: 0 });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates changed author, stars, text and Google replies on later syncs", async () => {
    queries(location, link, [], [{ ...existing, authorName: "Old author", rating: 2, text: "Old text", replyText: "Old reply" }]);
    expect(await syncGoogleReviewsAction("location-1")).toMatchObject({ inserted: 0, updated: 1, unchanged: 0 });
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({
      authorName: "Google author", rating: 5, text: "Excellent", replyText: "Thanks",
      replyPostedAt: incoming.replyUpdatedAt,
    }));
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("keeps approved LocalSync-only reply work when refreshing review content", async () => {
    queries(location, link, [{ payload: { reviewId: "row-1", draftReply: "My saved draft" } }],
      [{ ...existing, text: "Old text", replyText: "My saved draft" }]);
    await syncGoogleReviewsAction("location-1");
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ text: "Excellent" }));
    expect(mocks.set.mock.calls[0][0]).not.toHaveProperty("replyText");
    expect(mocks.set.mock.calls[0][0]).not.toHaveProperty("replyStatus");
  });

  it("keeps pending reply drafts", async () => {
    queries(location, link, [], [{ ...existing, replyStatus: "draft_pending", text: "Old text" }]);
    await syncGoogleReviewsAction("location-1");
    expect(mocks.set.mock.calls[0][0]).not.toHaveProperty("replyStatus");
  });

  it("keeps skipped status when Google has no reply", async () => {
    queries(location, link, [], [{ ...existing, replyStatus: "skipped", replyText: null, replyPostedAt: null }]);
    mocks.fetchReviews.mockResolvedValue(fetched([{ ...incoming, existingReply: null, replyUpdatedAt: null }]));
    expect(await syncGoogleReviewsAction("location-1")).toMatchObject({ updated: 0, unchanged: 1 });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("clears a removed upstream reply when there is no saved LocalSync draft", async () => {
    queries(location, link, [], [existing]);
    mocks.fetchReviews.mockResolvedValue(fetched([{ ...incoming, existingReply: null, replyUpdatedAt: null }]));
    await syncGoogleReviewsAction("location-1");
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({
      replyStatus: "unreplied", replyText: null, replyPostedAt: null,
    }));
  });

  it("marks unchanged repeat syncs accurately without inserting or updating", async () => {
    queries(location, link, [], [existing]);
    expect(await syncGoogleReviewsAction("location-1")).toMatchObject({ inserted: 0, updated: 0, unchanged: 1 });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("does not invent a posted time for a Google reply without one", async () => {
    queries(location, link, [], []);
    mocks.fetchReviews.mockResolvedValue(fetched([{ ...incoming, replyUpdatedAt: null }]));
    await syncGoogleReviewsAction("location-1");
    expect(mocks.values.mock.calls[0][0].replyPostedAt).toBeNull();
  });
});
