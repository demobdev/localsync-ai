import { describe, expect, it } from "vitest";

import { resolveDashboardEntry } from "@/lib/onboarding/dashboard-entry";

describe("dashboard onboarding entry", () => {
  it("hands an invited teammate to an existing workspace", () => {
    expect(
      resolveDashboardEntry({
        hasWorkspace: true,
        hasActiveWorkspace: false,
      }),
    ).toBe("workspace_handoff");
  });

  it("opens the dashboard when Clerk already has an active workspace", () => {
    expect(
      resolveDashboardEntry({
        hasWorkspace: true,
        hasActiveWorkspace: true,
      }),
    ).toBe("dashboard");
  });

  it("keeps account setup for a user without a workspace", () => {
    expect(
      resolveDashboardEntry({
        hasWorkspace: false,
        hasActiveWorkspace: false,
      }),
    ).toBe("onboarding");
  });
});
