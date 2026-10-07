import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
  token: vi.fn(),
  fresh: vi.fn(),
}));
vi.mock("@/db", () => ({ getDb: () => mocks }));
vi.mock("@/lib/auth/org", () => ({
  requireOrgAuth: async () => ({ orgId: "org-test", userId: "user-test" }),
}));
vi.mock("@/lib/billing/plans", () => ({ getWorkspacePlan: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/connectors/google", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/connectors/google")>()),
  getValidGoogleAccessToken: mocks.token,
  fetchGbpLocationsSafe: mocks.fresh,
}));
const googleLocation = {
  gbpName: "locations/456",
  gbpAccountName: "accounts/123",
  title: "Owner's Box",
  regularHours: {},
  categories: [],
};

import { importGbpFieldsAction } from "./google-import";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.token.mockResolvedValue("test-token");
  mocks.fresh.mockResolvedValue({ ok: true, locations: [googleLocation] });
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

describe("fresh Google provenance before import", () => {
  it("rejects changed Google values before writing a profile or link", async () => {
    mocks.fresh.mockResolvedValue({
      ok: true,
      locations: [{ ...googleLocation, title: "Updated name" }],
    });
    await expect(
      importGbpFieldsAction({
        targetLocationId: "local-1",
        fields: ["name"],
        gbpLocation: googleLocation,
      }),
    ).resolves.toMatchObject({
      error: expect.stringContaining("changed since this page loaded"),
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects listings no longer accessible to this Google account", async () => {
    mocks.fresh.mockResolvedValue({ ok: true, locations: [] });
    await expect(
      importGbpFieldsAction({
        targetLocationId: "local-1",
        fields: ["name"],
        gbpLocation: googleLocation,
      }),
    ).resolves.toMatchObject({
      error: expect.stringContaining("no longer available"),
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not replace a missing fresh read with browser data", async () => {
    mocks.fresh.mockResolvedValue({
      ok: false,
      error: { message: "API disabled" },
    });
    await expect(
      importGbpFieldsAction({
        targetLocationId: "local-1",
        fields: ["name"],
        gbpLocation: googleLocation,
      }),
    ).resolves.toMatchObject({ error: "API disabled" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("uses fresh verification rather than trusting a browser verified flag", async () => {
    const result = await importGbpFieldsAction({
      targetLocationId: "local-1",
      fields: ["name"],
      gbpLocation: {
        ...googleLocation,
        verification: {
          status: "verified",
          label: "Verified",
          hasVoiceOfMerchant: true,
          hasBusinessAuthority: true,
          action: "none",
        },
      },
    });
    expect(result.listingVerified).toBe(false);
  });
});

it("links without changing a different Master business name when linkOnly is requested", async () => {
  const differentGoogle = {
    ...googleLocation,
    title: "Different Google business name",
  };
  mocks.fresh.mockResolvedValue({ ok: true, locations: [differentGoogle] });
  const result = await importGbpFieldsAction({
    targetLocationId: "local-1",
    fields: [],
    linkOnly: true,
    gbpLocation: differentGoogle,
  });
  expect(result).toMatchObject({ linked: true, changed: false });
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.set).toHaveBeenCalledTimes(1);
  expect(mocks.set).toHaveBeenCalledWith(
    expect.objectContaining({ externalId: "accounts/123/locations/456" }),
  );
  expect(mocks.set.mock.calls[0][0]).not.toHaveProperty("profile");
});
