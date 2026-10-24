import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }) }));
const mocks = vi.hoisted(() => ({ enabled: vi.fn(), staff: vi.fn(), list: vi.fn(), qaFixtures: vi.fn() }));
vi.mock("@/lib/auth/localmap-staff.server", () => ({ isStaffFulfillmentEnabled: mocks.enabled, requireLocalMapStaff: mocks.staff }));
vi.mock("@/lib/listings/staff-fulfillment.server", () => ({ listStaffFulfillmentCases: mocks.list }));
vi.mock("@/lib/listings/qa-fulfillment-fixtures.server", () => ({ canSeedSyntheticFulfillmentFixtures: mocks.qaFixtures }));
vi.mock("@/app/actions/qa-fulfillment-fixtures", () => ({ seedSyntheticFulfillmentFixturesAction: vi.fn() }));
vi.mock("@/components/listings/staff-fulfillment-queue", () => ({ StaffFulfillmentQueue: ({ staffUserId }: { staffUserId: string }) => <main>Staff queue for {staffUserId}</main> }));
import InternalPublisherFulfillmentPage, { metadata } from "./page";

afterEach(() => { vi.clearAllMocks(); });

describe("internal publisher fulfillment page", () => {
  it("hides the route while the feature flag is off without checking identity or data", async () => {
    mocks.enabled.mockReturnValue(false);
    await expect(InternalPublisherFulfillmentPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.staff).not.toHaveBeenCalled(); expect(mocks.list).not.toHaveBeenCalled();
  });

  it("hides the route from users without the private staff claim before reading queue data", async () => {
    mocks.enabled.mockReturnValue(true); mocks.staff.mockRejectedValue(new Error("denied"));
    await expect(InternalPublisherFulfillmentPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("loads data only after the private staff check and disables indexing", async () => {
    mocks.enabled.mockReturnValue(true); mocks.staff.mockResolvedValue({ userId: "user_staff" }); mocks.list.mockResolvedValue([]); mocks.qaFixtures.mockReturnValue(false);
    const html = renderToStaticMarkup(await InternalPublisherFulfillmentPage());
    expect(html).toContain("Staff queue for user_staff");
    expect(html).not.toContain("Seed two QA cases");
    expect(mocks.staff.mock.invocationCallOrder[0]).toBeLessThan(mocks.list.mock.invocationCallOrder[0]);
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the fixture control only when the QA environment guard passes", async () => {
    mocks.enabled.mockReturnValue(true); mocks.staff.mockResolvedValue({ userId: "user_staff" }); mocks.list.mockResolvedValue([]); mocks.qaFixtures.mockReturnValue(true);
    const html = renderToStaticMarkup(await InternalPublisherFulfillmentPage());
    expect(html).toContain("Seed two QA cases");
    expect(html).toContain("No owner contact or publisher submission occurs.");
  });
});
