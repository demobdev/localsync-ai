import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("@/db", () => ({ getDb: () => ({ execute }) }));

import { isSubmissionCampaignStorageReady } from "@/lib/publishers/campaign-storage";

describe("campaign storage readiness", () => {
  beforeEach(() => { execute.mockReset(); });

  it.each(Array.from({ length: 8 }, (_, mask) => mask))(
    "requires all three tables (presence mask %i)",
    async (mask) => {
      execute.mockResolvedValue({ rows: [{
        campaigns: mask & 1 ? "submission_campaigns" : null,
        targets: mask & 2 ? "submission_targets" : null,
        events: mask & 4 ? "submission_events" : null,
      }] });
      expect(await isSubmissionCampaignStorageReady()).toBe(mask === 7);
      expect(execute).toHaveBeenCalledTimes(1);
    },
  );

  it("fails closed when the catalog query returns no row", async () => {
    execute.mockResolvedValue({ rows: [] });
    expect(await isSubmissionCampaignStorageReady()).toBe(false);
  });

  it("does not hide a database outage as an unapplied migration", async () => {
    execute.mockRejectedValue(new Error("Database unavailable"));
    await expect(isSubmissionCampaignStorageReady()).rejects.toThrow("Database unavailable");
  });
});
