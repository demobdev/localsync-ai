import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ staff: vi.fn(), transition: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth/localmap-staff.server", () => ({ requireLocalMapStaff: mocks.staff }));
vi.mock("@/lib/listings/staff-fulfillment.server", () => ({ transitionStaffFulfillmentCase: mocks.transition }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { claimStaffFulfillmentCaseAction, requestStaffFulfillmentInformationAction } from "./staff-fulfillment";

afterEach(() => { vi.clearAllMocks(); });

describe("staff fulfillment server actions", () => {
  it("authorizes staff before processing any client-supplied case data", async () => {
    mocks.staff.mockRejectedValue(new Error("LocalMap staff access required"));
    const form = new FormData(); form.set("attemptId", "50000000-0000-4000-8000-000000000001"); form.set("expectedRevision", "0");
    await expect(claimStaffFulfillmentCaseAction(form)).rejects.toThrow("staff access required");
    expect(mocks.transition).not.toHaveBeenCalled();
  });

  it("passes a validated claim action from the server-authenticated identity", async () => {
    mocks.staff.mockResolvedValue({ userId: "user_staff" });
    const form = new FormData(); form.set("attemptId", "50000000-0000-4000-8000-000000000001"); form.set("expectedRevision", "2");
    await claimStaffFulfillmentCaseAction(form);
    expect(mocks.transition).toHaveBeenCalledWith({ attemptId: "50000000-0000-4000-8000-000000000001", expectedRevision: 2, action: "claim", operatorUserId: "user_staff" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/internal/publisher-fulfillment");
  });

  it("rejects malformed notes before writing", async () => {
    mocks.staff.mockResolvedValue({ userId: "user_staff" });
    const form = new FormData(); form.set("attemptId", "not-a-uuid"); form.set("expectedRevision", "-1"); form.set("note", "x".repeat(501));
    await expect(requestStaffFulfillmentInformationAction(form)).rejects.toThrow("valid staff action");
    expect(mocks.transition).not.toHaveBeenCalled();
  });
});
