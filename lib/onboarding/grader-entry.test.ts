import { describe, expect, it } from "vitest";

import {
  rankOrgLocationsForAudit,
  scoreLocationAuditMatch,
} from "@/lib/grader/claim-context";
import { resolveGraderEntryRoute } from "@/lib/onboarding/grader-entry";
import type { AuditClaimContext } from "@/lib/grader/claim-context";

function mockClaimContext(
  overrides: Partial<AuditClaimContext> = {},
): AuditClaimContext {
  return {
    source: "audit",
    auditId: "11111111-1111-1111-1111-111111111111",
    url: "https://example.com",
    businessName: "Crumbl",
    phone: null,
    city: "Greenville",
    state: "SC",
    score: 61,
    categorySlug: "retail",
    failedChecks: 5,
    estimatedMonthlyLoss: 2500,
    claimStatus: "unclaimed",
    claimedLocationId: null,
    claimedOrganizationId: null,
    ...overrides,
  };
}

describe("scoreLocationAuditMatch", () => {
  it("scores exact name + city matches highest", () => {
    expect(
      scoreLocationAuditMatch({
        auditName: "Crumbl",
        auditCity: "Greenville",
        locationName: "Crumbl",
        locationCity: "Greenville",
      }),
    ).toBeGreaterThanOrEqual(90);
  });
});

describe("resolveGraderEntryRoute", () => {
  it("redirects to linked location when audit already claimed in org", () => {
    const route = resolveGraderEntryRoute({
      claimContext: mockClaimContext({
        claimStatus: "claimed_same_org",
        claimedLocationId: "loc-1",
      }),
      session: { userId: "user-1", orgId: "org-1" },
      existingLocations: [],
      addingAnother: false,
      setupComplete: false,
    });

    expect(route).toEqual({
      type: "redirect",
      href: "/dashboard/locations/loc-1?tab=nap",
    });
  });

  it("shows dedicated claim onboarding for unclaimed audit", () => {
    const route = resolveGraderEntryRoute({
      claimContext: mockClaimContext(),
      session: { userId: "user-1", orgId: "org-1" },
      existingLocations: rankOrgLocationsForAudit(
        { businessName: "Crumbl", city: "Greenville", state: "SC" },
        [{ id: "loc-1", name: "Crumbl", city: "Greenville", state: "SC" }],
      ),
      addingAnother: false,
      setupComplete: false,
    });

    expect(route.type).toBe("claim_onboarding");
    if (route.type === "claim_onboarding") {
      expect(route.suggestedLocationId).toBe("loc-1");
    }
  });

  it("blocks when audit claimed by another org", () => {
    const route = resolveGraderEntryRoute({
      claimContext: mockClaimContext({ claimStatus: "claimed_other_org" }),
      session: { userId: "user-1", orgId: "org-1" },
      existingLocations: [],
      addingAnother: false,
      setupComplete: false,
    });

    expect(route.type).toBe("already_claimed");
  });
});
