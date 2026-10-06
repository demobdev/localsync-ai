import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
}));
vi.mock("@/db", () => ({ getDb: () => mocks }));
vi.mock("@/lib/auth/org", () => ({
  requireOrgAuth: async () => ({ orgId: "org-test", userId: "user-test" }),
}));
vi.mock("@/lib/billing/plans", () => ({ getWorkspacePlan: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { importGbpFieldsAction } from "./google-import";

beforeEach(() => {
  vi.clearAllMocks();
  const profile = { ...EMPTY_LOCATION_PROFILE, name: "Owner's Box" };
  const results = [
    [{ id: "local-1", profile }],
    [{ id: "publisher-1" }],
    [{ id: "link-1" }],
  ];
  mocks.select.mockImplementation(() => ({
    from: () => ({ where: () => ({ limit: async () => results.shift() }) }),
  }));
  mocks.where.mockResolvedValue(undefined);
  mocks.set.mockReturnValue({ where: mocks.where });
  mocks.update.mockReturnValue({ set: mocks.set });
});

describe("re-import link repair", () => {
  it("updates a legacy review link even if selected fields already match", async () => {
    const result = await importGbpFieldsAction({
      targetLocationId: "local-1",
      fields: ["name"],
      gbpLocation: {
        gbpName: "locations/456",
        gbpAccountName: "accounts/123",
        title: "Owner's Box",
        regularHours: {},
        categories: [],
      },
    });
    expect(result).toMatchObject({ changed: false });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: "accounts/123/locations/456" }),
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
