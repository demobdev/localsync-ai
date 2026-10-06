import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocationReviewRow, SyncGoogleReviewsResult } from "@/app/actions/reviews";
import { computeReviewScore } from "@/lib/reviews/score";

const mocks = vi.hoisted(() => ({
  sync: vi.fn(), seed: vi.fn(), approve: vi.fn(), reject: vi.fn(), draft: vi.fn(), skip: vi.fn(),
  refresh: vi.fn(), success: vi.fn(), error: vi.fn(),
}));
vi.mock("@/app/actions/reviews", () => ({
  syncGoogleReviewsAction: mocks.sync, seedDemoReviewsAction: mocks.seed,
  approveReviewReplyAction: mocks.approve, rejectReviewReplyAction: mocks.reject,
  generateReviewReplyDraftAction: mocks.draft, skipReviewAction: mocks.skip,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: ReactNode; href: string; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

import { ReviewsPanel } from "./reviews-panel";

const success: SyncGoogleReviewsResult = {
  ok: true, source: "google", inserted: 2, updated: 1, unchanged: 3, total: 6,
  skipped: 0, pagesFetched: 1, googleTotalReviewCount: 6, googleAverageRating: 4.5,
};
const review: LocationReviewRow = {
  id: "review-1", source: "google", authorName: "Alex", rating: 5, text: "Great service",
  publishedAt: new Date("2026-10-01T10:00:00Z"), replyStatus: "unreplied", replyText: null,
  replyPostedAt: null, pendingDraft: null,
};
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.resetAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  mocks.sync.mockResolvedValue(success);
  mocks.seed.mockResolvedValue({ inserted: 3 });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
async function render({
  locationId = "location-1", googleLinked = true, reviews = [] as LocationReviewRow[],
} = {}) {
  await act(async () => root.render(<ReviewsPanel locationId={locationId} googleLinked={googleLinked}
    reviews={reviews} summary={computeReviewScore(reviews)} />));
}
function button(text: string) {
  return [...container.querySelectorAll("button")].find((node) => node.textContent === text)!;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("review sync workflow", () => {
  it("never syncs or seeds automatically on mount or refresh", async () => {
    await render();
    await render({ reviews: [review] });
    expect(mocks.sync).not.toHaveBeenCalled();
    expect(mocks.seed).not.toHaveBeenCalled();
    expect(container.textContent).toContain("1 Google review(s) saved · 0 demo review(s)");
  });

  it("disables unlinked sync and provides the connect next step", async () => {
    await render({ googleLinked: false });
    expect(button("Sync from Google").disabled).toBe(true);
    expect(container.querySelector('a[href="/dashboard/connect/google"]')).not.toBeNull();
    expect(container.textContent).not.toContain("Until GBP API quota is approved");
    await act(async () => button("Sync from Google").click());
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it("shows returned counts persistently after syncing and refreshes the view", async () => {
    await render();
    await act(async () => button("Sync from Google").click());
    expect(mocks.sync).toHaveBeenCalledWith("location-1");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("2 added, 1 updated, 3 unchanged");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    await render({ reviews: [review] });
    expect(container.textContent).toContain("Read 6 Google review(s)");
  });

  it("shows empty success honestly without loading demo data or hiding saved rows", async () => {
    mocks.sync.mockResolvedValue({ ...success, total: 0, inserted: 0, updated: 0, unchanged: 0 });
    await render({ reviews: [review] });
    await act(async () => button("Sync from Google").click());
    expect(container.textContent).toContain("Google returned no reviews for this location");
    expect(container.textContent).toContain("Existing saved reviews were kept");
    expect(container.textContent).toContain("Great service");
    expect(mocks.seed).not.toHaveBeenCalled();
  });

  it("distinguishes unsupported records from a genuine empty Google result", async () => {
    mocks.sync.mockResolvedValue({ ...success, total: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 2 });
    await render();
    await act(async () => button("Sync from Google").click());
    expect(container.textContent).toContain("Google returned no importable reviews");
    expect(container.textContent).toContain("2 review(s) had unsupported data and were skipped");
  });

  it("shows safe expected errors inline and allows an explicit retry", async () => {
    mocks.sync.mockResolvedValueOnce({ ok: false, error: "Re-import this location to repair its account ID." });
    await render();
    await act(async () => button("Sync from Google").click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Re-import this location");
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(button("Sync from Google").disabled).toBe(false);
    await act(async () => button("Sync from Google").click());
    expect(mocks.sync).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("recovers controls after an unexpected rejected action", async () => {
    mocks.sync.mockRejectedValueOnce(new Error("Connection interrupted"));
    await render();
    await act(async () => button("Sync from Google").click());
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Connection interrupted");
    expect(button("Sync from Google").disabled).toBe(false);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("blocks rapid repeated clicks and other actions while a sync is pending", async () => {
    const pending = deferred<SyncGoogleReviewsResult>();
    mocks.sync.mockReturnValueOnce(pending.promise);
    await render({ reviews: [review] });
    await act(async () => {
      const sync = button("Sync from Google");
      sync.click(); sync.click(); button("Load demo reviews").click();
    });
    expect(mocks.sync).toHaveBeenCalledTimes(1);
    expect(mocks.seed).not.toHaveBeenCalled();
    expect(button("Syncing from Google…").disabled).toBe(true);
    expect(button("Draft reply").disabled).toBe(true);
    expect(container.querySelector('[aria-label="Reading reviews from Google…"]')).not.toBeNull();
    await act(async () => pending.resolve(success));
    expect(button("Sync from Google").disabled).toBe(false);
    expect(container.querySelector('[aria-busy="false"]')).not.toBeNull();
  });

  it("does not apply a stale success to a newly navigated location", async () => {
    const pending = deferred<SyncGoogleReviewsResult>();
    mocks.sync.mockReturnValueOnce(pending.promise);
    await render();
    await act(async () => button("Sync from Google").click());
    await render({ locationId: "location-2" });
    await act(async () => pending.resolve(success));
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("Read 6 Google review(s)");
  });

  it("labels demo data and warns that summary metrics include samples", async () => {
    await render({ reviews: [review, { ...review, id: "demo-1", source: "demo" }] });
    expect(container.textContent).toContain("1 Google review(s) saved · 1 demo review(s)");
    expect(container.textContent).toContain("Demo data");
    expect(container.textContent).toContain("do not represent your Google-only results");
  });

  it("explains that saved replies are not a publish confirmation", async () => {
    await render({ reviews: [{ ...review, replyStatus: "replied", replyText: "Thanks" }] });
    expect(container.textContent).toContain("Reply saved");
    expect(container.textContent).toContain("Approving a draft in LocalSync does not publish it to Google");
  });
});
