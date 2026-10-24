import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireStaff: vi.fn(),
  allowed: vi.fn(),
  seed: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/localmap-staff.server", () => ({ requireLocalMapStaff: mocks.requireStaff }));
vi.mock("@/lib/listings/qa-fulfillment-fixtures.server", () => ({
  canSeedSyntheticFulfillmentFixtures: mocks.allowed,
  seedSyntheticFulfillmentFixtures: mocks.seed,
}));

import { seedSyntheticFulfillmentFixturesAction } from "./qa-fulfillment-fixtures";

afterEach(() => vi.clearAllMocks());

describe("seedSyntheticFulfillmentFixturesAction", () => {
  it("requires staff authorization before checking or writing QA data", async () => {
    mocks.requireStaff.mockRejectedValue(new Error("denied"));

    await expect(seedSyntheticFulfillmentFixturesAction(new FormData())).rejects.toThrow("denied");
    expect(mocks.allowed).not.toHaveBeenCalled();
    expect(mocks.seed).not.toHaveBeenCalled();
  });

  it("does not write when the Preview database guard fails", async () => {
    mocks.requireStaff.mockResolvedValue({ userId: "user_qa_staff" });
    mocks.allowed.mockReturnValue(false);

    await expect(seedSyntheticFulfillmentFixturesAction(new FormData())).rejects.toThrow("isolated QA Preview");
    expect(mocks.seed).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("seeds under the authenticated staff identity and refreshes the queue", async () => {
    mocks.requireStaff.mockResolvedValue({ userId: "user_qa_staff" });
    mocks.allowed.mockReturnValue(true);
    mocks.seed.mockResolvedValue({ createdCases: 2 });

    await seedSyntheticFulfillmentFixturesAction(new FormData());

    expect(mocks.seed).toHaveBeenCalledWith("user_qa_staff");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/internal/publisher-fulfillment");
  });
});
