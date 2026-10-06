import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";
const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  fetchLocations: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/db", () => ({ getDb: () => mocks }));
vi.mock("@/lib/auth/org", () => ({
  requireOrgAuth: async () => ({ orgId: "org-test", userId: "user-test" }),
}));
vi.mock("@/lib/billing/plans", () => ({
  getWorkspacePlan: async () => ({ features: { apiSync: true } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/connectors/google", () => ({
  getValidGoogleAccessToken: async () => "test-token",
  fetchGbpLocationsSafe: mocks.fetchLocations,
}));
vi.mock("@/lib/connectors/google-write", () => ({
  patchGbpLocationSafe: mocks.patch,
}));
import { pushGbpFieldsAction } from "./google-import";

beforeEach(() => {
  vi.clearAllMocks();
  const results = [
    [
      {
        id: "local-1",
        profile: { ...EMPTY_LOCATION_PROFILE, name: "Owner's Box" },
      },
    ],
    [{ id: "publisher-1" }],
    [{ id: "link-1", externalId: "accounts/123/locations/456" }],
  ];
  mocks.select.mockImplementation(() => ({
    from: () => ({ where: () => ({ limit: async () => results.shift() }) }),
  }));
  mocks.set.mockReturnValue({ where: async () => undefined });
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.patch.mockResolvedValue({ ok: true, updatedFields: ["name"] });
});

describe("Don's listing verification with account-qualified links", () => {
  it("matches the v1 location after push and preserves the review account parent", async () => {
    mocks.fetchLocations.mockResolvedValue({
      ok: true,
      locations: [
        {
          gbpName: "locations/456",
          gbpAccountName: "accounts/123",
          title: "Owner's Box",
          regularHours: {},
          categories: [],
          verification: {
            status: "verified",
            hasVoiceOfMerchant: true,
            hasBusinessAuthority: true,
          },
        },
      ],
    });
    const result = await pushGbpFieldsAction({
      locationId: "local-1",
      fields: ["name"],
      gbpName: "locations/456",
    });
    expect(result.listingVerified).toBe(true);
    expect(mocks.fetchLocations).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: "accounts/123/locations/456" }),
    );
  });
  it("keeps the existing account parent if post-write verification is unavailable", async () => {
    mocks.fetchLocations.mockResolvedValue({
      ok: false,
      error: { code: "quota_exceeded" },
    });
    const result = await pushGbpFieldsAction({
      locationId: "local-1",
      fields: ["name"],
      gbpName: "locations/456",
    });
    expect(result.verified).toBe(false);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: "accounts/123/locations/456",
        status: "pending",
      }),
    );
  });
});
