import { describe, expect, it } from "vitest";

import { buildOrganizationInvitation } from "@/lib/team/invitation-config";

describe("organization invitation configuration", () => {
  it("uses Clerk's managed acceptance flow instead of dropping a ticket on the dashboard", () => {
    const invitation = buildOrganizationInvitation({
      organizationId: "org_restore",
      emailAddress: "demo@wvfmlabs.com",
      role: "org:member",
      inviterUserId: "user_demo",
    });

    expect(invitation).not.toHaveProperty("redirectUrl");
    expect(invitation).toMatchObject({
      organizationId: "org_restore",
      emailAddress: "demo@wvfmlabs.com",
      role: "org:member",
      inviterUserId: "user_demo",
      expiresInDays: 14,
    });
  });
});
