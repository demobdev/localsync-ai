import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }) }));
const mocks = vi.hoisted(() => ({ enabled: vi.fn(), staff: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/auth/localmap-staff.server", () => ({ isStaffFulfillmentEnabled: mocks.enabled, requireLocalMapStaff: mocks.staff }));
vi.mock("@/lib/listings/staff-fulfillment.server", () => ({ listAgentPreviewFulfillmentCases: mocks.list }));
vi.mock("@/components/agent/agent-workspace-preview", () => ({
  AgentWorkspacePreview: ({ queueStatus, handoffs }: { queueStatus: string; handoffs: Array<{ publisherName: string; eventCount: number }> }) => (
    <main>{queueStatus}:{handoffs.length}:{handoffs[0]?.publisherName}:{handoffs[0]?.eventCount}</main>
  ),
}));

import AgentWorkspacePreviewPage, { dynamic, metadata } from "./page";

afterEach(() => { vi.clearAllMocks(); });

describe("agent workspace preview page", () => {
  it("hides the preview when the staff feature flag is disabled", async () => {
    mocks.enabled.mockReturnValue(false);
    await expect(AgentWorkspacePreviewPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.staff).not.toHaveBeenCalled();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("requires the private staff claim before reading the QA queue", async () => {
    mocks.enabled.mockReturnValue(true);
    mocks.staff.mockRejectedValue(new Error("denied"));
    await expect(AgentWorkspacePreviewPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("passes only the QA handoff summary to the interactive preview", async () => {
    mocks.enabled.mockReturnValue(true);
    mocks.staff.mockResolvedValue({ userId: "user_staff" });
    mocks.list.mockResolvedValue([{
      publisherName: "Angi",
      staffReview: { status: "needs_review", revision: 0, assignedToUserId: "private-user-id", lastNote: "private note", updatedAt: null },
      createdAt: "2026-10-23T10:00:00.000Z",
      events: [{ message: "private event detail" }],
      organizationId: "private-organization-id",
    }]);

    const html = renderToStaticMarkup(await AgentWorkspacePreviewPage());
    expect(html).toContain("ready:1:Angi:1");
    expect(html).not.toContain("private-user-id");
    expect(html).not.toContain("private note");
    expect(html).not.toContain("private event detail");
    expect(mocks.staff.mock.invocationCallOrder[0]).toBeLessThan(mocks.list.mock.invocationCallOrder[0]);
    expect(dynamic).toBe("force-dynamic");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("keeps the preview available with an explicit unavailable state when QA storage fails", async () => {
    mocks.enabled.mockReturnValue(true);
    mocks.staff.mockResolvedValue({ userId: "user_staff" });
    mocks.list.mockRejectedValue(new Error("database unavailable"));
    const html = renderToStaticMarkup(await AgentWorkspacePreviewPage());
    expect(html).toContain("unavailable:0");
  });
});
