import { describe, expect, it } from "vitest";

import { googleConnectCopyForContext } from "./google-connect-copy";

describe("Google connection quota guidance", () => {
  it("does not infer pending access approval from a quota error", () => {
    const copy = googleConnectCopyForContext({
      context: null,
      googleState: {
        status: "connected",
        locations: [],
        fetchError: { code: "quota_exceeded", message: "Rate limit reached" },
      },
    });

    expect(copy.headline).toContain("rate or quota limit reached");
    expect(copy.description).toContain("Retry later");
    expect(copy.description).toContain("does not mean API access is unapproved");
    expect(copy.description).toContain("verify the OAuth project and effective quota");
    expect(`${copy.headline} ${copy.description}`).not.toMatch(
      /waiting on API approval|once Google approves|quota pending|submit.*application/i,
    );
  });

  it("keeps connection details and manual work available while quota-limited", () => {
    const copy = googleConnectCopyForContext({
      context: null,
      googleState: {
        status: "connected",
        locations: [],
        fetchError: { code: "quota_exceeded", message: "Rate limit reached" },
      },
    });

    expect(copy.cta).toBe("View connection status");
    expect(copy.helper).toContain("run audits manually");
  });

  it("keeps healthy connections ready to import", () => {
    const copy = googleConnectCopyForContext({
      context: null,
      googleState: { status: "connected", locations: [] },
    });

    expect(copy.headline).toBe("Google Business Profile linked");
    expect(copy.cta).toBe("Manage import");
    expect(copy.description).not.toMatch(/quota|approval/i);
  });
});
