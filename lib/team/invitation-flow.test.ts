import { describe, expect, it } from "vitest";

import {
  recentInvitationCutoff,
  selectInvitationMembership,
  visibleInvitationHistory,
} from "@/lib/team/invitation-flow";

describe("team invitation flow", () => {
  it("limits the success screen to a recent acceptance", () => {
    expect(recentInvitationCutoff(1_000_000)).toBe(100_000);
  });

  it("does not claim an unrelated active workspace accepted the invitation", () => {
    const memberships = [
      {
        organizationId: "org_biolight",
        createdAt: 200,
      },
      {
        organizationId: "org_restore",
        createdAt: 100,
      },
    ];

    expect(selectInvitationMembership(memberships, null)).toBeUndefined();
    expect(
      selectInvitationMembership(memberships, "org_pasport_radio"),
    ).toBeUndefined();
    expect(
      selectInvitationMembership(memberships, "org_restore"),
    ).toMatchObject({ organizationId: "org_restore" });
  });

  it("does not treat an old active membership as a newly accepted invite", () => {
    const memberships = [
      { organizationId: "org_biolight", createdAt: 100 },
      { organizationId: "org_restore", createdAt: 950 },
    ];

    expect(
      selectInvitationMembership(memberships, "org_biolight", 900),
    ).toBeUndefined();
    expect(
      selectInvitationMembership(memberships, "org_restore", 900),
    ).toMatchObject({ organizationId: "org_restore" });
  });

  it("keeps revoked retry tokens out of the primary invitations table", () => {
    const invitations = [
      { id: "pending", status: "pending" as const },
      { id: "revoked-1", status: "revoked" as const },
      { id: "revoked-2", status: "revoked" as const },
      { id: "accepted", status: "accepted" as const },
    ];

    expect(visibleInvitationHistory(invitations)).toEqual([
      { id: "pending", status: "pending" },
      { id: "accepted", status: "accepted" },
    ]);
  });
});
